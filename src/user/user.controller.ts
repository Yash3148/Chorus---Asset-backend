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
  Logger,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name); // Initialize logger

  constructor(private readonly userService: UserService) {}

  @Post('changePassword')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ) {
    this.logger.log(
      `Change password endpoint called for user: ${req.user.email}`,
    );

    await this.userService.changePassword(
      req.user.email,
      changePasswordDto.newPassword,
    );

    this.logger.log(
      'Password changed successfully for user: ' + req.user.email,
    );

    return { message: 'Password changed successfully' };
  }

  @Get('searchQuery/:email')
  async getPastSearches(@Param('email') email: string) {
    this.logger.log(`Get past searches endpoint called for email: ${email}`);

    const searches = await this.userService.getPastSearches(email);

    this.logger.log(`Past searches retrieved successfully for email: ${email}`);

    return searches;
  }
}
