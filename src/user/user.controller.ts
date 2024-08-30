import {
  Body,
  Controller,
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
export class UserController {
  constructor(private readonly userService: UserService) {}

  //   @UseGuards(JwtAuthGuard)
  //   @Post()
  //   async findUserByEmail(email: string): Promise<any> {
  //     return this.userService.findUserByEmail(email);
  //   }

  @Post('changePassword')
  // @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    // @Req() req,
  ) {
    await this.userService.changePassword(
      changePasswordDto.email,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }
}
