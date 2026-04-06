import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@p3d-hub/user';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(id: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: id },
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: id },
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async addRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const hashedRefreshToken = await bcrypt.hash(tokenHash, 10);

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException('Користувача не знайдено');
    }

    const updatedTokens = [
      ...(user.refreshTokens || []),
      hashedRefreshToken,
    ].slice(-5);

    await this.userService.update(userId, { refreshTokens: updatedTokens });
  }

  async login(login: string, pass: string) {
    const user = await this.userService.findByLogin(login);
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new BadRequestException('Невірний логін або пароль');
    }

    const tokens = await this.generateTokens(user._id.toString());
    await this.addRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      ...tokens,
    };
  }

  async register(login: string, pass: string) {
    const existingUser = await this.userService.findByLogin(login);
    if (existingUser) {
      throw new BadRequestException('Користувач з таким логіном вже існує');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = await this.userService.create({
      login,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user._id.toString());
    await this.addRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const user = await this.userService.findById(userId);

    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
      return;
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const activeTokens: string[] = [];

    for (const storedTokenHash of user.refreshTokens) {
      const matches = await bcrypt.compare(tokenHash, storedTokenHash);
      if (!matches) {
        activeTokens.push(storedTokenHash);
      }
    }

    await this.userService.update(userId, { refreshTokens: activeTokens });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userService.findById(userId);

    if (!user || !user.refreshTokens || user.refreshTokens.length === 0) {
      throw new ForbiddenException('Доступ заборонено');
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    let isTokenValid = false;
    let tokenIndex = -1;

    for (let i = 0; i < user.refreshTokens.length; i++) {
      const matches = await bcrypt.compare(tokenHash, user.refreshTokens[i]);
      if (matches) {
        isTokenValid = true;
        tokenIndex = i;
        break;
      }
    }

    if (!isTokenValid) {
      throw new ForbiddenException('Доступ заборонено');
    }

    const tokens = await this.generateTokens(user._id.toString());

    const newTokenHash = crypto
      .createHash('sha256')
      .update(tokens.refreshToken)
      .digest('hex');
    const hashedNewRefreshToken = await bcrypt.hash(newTokenHash, 10);

    const newRefreshTokens = [...user.refreshTokens];
    newRefreshTokens[tokenIndex] = hashedNewRefreshToken;

    await this.userService.update(user._id.toString(), {
      refreshTokens: newRefreshTokens,
    });

    return tokens;
  }
}
