import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiOkResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { AuthGuard, RefreshTokenGuard, AuthService } from '@p3d-hub/auth';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { RefreshRequestDto } from "./dto/refresh-request.dto";
import { AuthRequestDto } from "./dto/auth-request.dto";
import { AuthResponseDto } from './dto/auth-response.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Реєстрація нового користувача' })
  @ApiOkResponse({ type: AuthResponseDto, description: 'Успішна реєстрація' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() credentialsDto: AuthCredentialsDto): Promise<AuthResponseDto> {
    return this.authService.register(credentialsDto.login, credentialsDto.password);
  }

  @ApiOperation({ summary: 'Авторизація користувача' })
  @ApiOkResponse({ type: AuthResponseDto, description: 'Успішна авторизація' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() credentialsDto: AuthCredentialsDto): Promise<AuthResponseDto> {
    return this.authService.login(credentialsDto.login, credentialsDto.password);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Вихід з системи' })
  @ApiNoContentResponse({ description: 'Успішний вихід' })
  @ApiBody({ schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } })
  @UseGuards(AuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Request() req: AuthRequestDto,
    @Body('refreshToken') refreshToken: string
  ): Promise<void> {
    if (!refreshToken) {
      throw new BadRequestException('Не передано refreshToken для виходу');
    }
    await this.authService.logout(req.user.sub, refreshToken);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Оновлення токенів доступу' })
  @ApiOkResponse({ type: TokenResponseDto, description: 'Токени успішно оновлено' })
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Request() req: RefreshRequestDto): Promise<TokenResponseDto> {
    const userId = req.user.sub;
    const refreshToken = req.user.refreshToken;
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Перевірка валідності токена' })
  @ApiOkResponse({ schema: { type: 'object', properties: { userId: { type: 'string' } } }, description: 'Токен валідний' })
  @UseGuards(AuthGuard)
  @Get('verify')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Request() req: AuthRequestDto): Promise<{ userId: string }> {
    return {
      userId: req.user.sub,
    };
  }
}
