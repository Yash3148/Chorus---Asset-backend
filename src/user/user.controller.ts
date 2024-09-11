import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('changePassword')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ) {
    await this.userService.changePassword(
      req.user.email,
      changePasswordDto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @Get('searchQuery/:email')
  async getPastSearches(@Param('email') email: string) {
    return this.userService.getPastSearches(email);
  }
}
