import {
  Controller,
  Get,
  Param,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { UserService } from '@p3d-hub/user';
import { AuthGuard } from '@p3d-hub/auth';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthRequestDto } from './dto/auth-request.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { ModelManagementService } from '@p3d-hub/model-management';

@ApiTags('Users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly modelManagementService: ModelManagementService,
  ) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Отримати профіль користувача за ID' })
  @ApiOkResponse({ type: UserResponseDto, description: 'Профіль користувача' })
  @UseGuards(AuthGuard)
  @Get('profile/:id')
  @HttpCode(HttpStatus.OK)
  async getProfileById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('Користувача не знайдено');
    return new UserResponseDto(user);
  }

  @ApiOperation({ summary: 'Отримати логін користувача за ID' })
  @ApiOkResponse({ type: UserLoginDto, description: 'Логін користувача' })
  @Get('login/:id')
  @HttpCode(HttpStatus.OK)
  async getLoginById(@Param('id') id: string): Promise<UserLoginDto> {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('Користувача не знайдено');
    const loginDto = new UserLoginDto();
    loginDto.login = user.login;
    return loginDto;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Оновити профіль поточного користувача' })
  @ApiOkResponse({ type: UserResponseDto, description: 'Оновлений профіль користувача' })
  @UseGuards(AuthGuard)
  @Put('profile')
  @HttpCode(HttpStatus.OK)
  async update(
    @Request() req: AuthRequestDto,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const userId = req.user.sub;
    const { currentPassword, ...updateData } = updateUserDto;
    const updatedUser = await this.userService.updateProfile(
      userId,
      currentPassword,
      updateData,
    );
    return new UserResponseDto(updatedUser);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Видалити профіль поточного користувача' })
  @ApiOkResponse({ type: UserResponseDto, description: 'Видалений профіль користувача' })
  @UseGuards(AuthGuard)
  @Delete('profile')
  @HttpCode(HttpStatus.OK)
  async remove(@Request() req: AuthRequestDto): Promise<UserResponseDto> {
    const userId = req.user.sub;

    await this.modelManagementService.removeAllUserLikes(userId);
    await this.modelManagementService.deleteAllUserModels(userId);

    const deletedUser = await this.userService.delete(userId);
    return new UserResponseDto(deletedUser);
  }
}
