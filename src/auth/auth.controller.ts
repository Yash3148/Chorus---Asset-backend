// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UsePipes,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name); // Initialize logger

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() RegisterUser: RegisterUserDto) {
    this.logger.log('Register endpoint called');
    const result = await this.authService.register(RegisterUser);
    this.logger.log('User registered successfully');
    return result;
  }

  @Post('initLogin')
  async initLogin(
    @Body('email') email: string,
  ): Promise<{ hashedUser: string; isUserVerified: boolean }> {
    this.logger.log(`InitLogin endpoint called with email: ${email}`);
    const result = await this.authService.initLogin(email);
    this.logger.log('Login initialization process completed');
    return result;
  }

  @Post('initPassword')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(HttpStatus.OK)
  async initPassword(
    @Body('password') password: string,
    @Req() req,
  ): Promise<any> {
    this.logger.log(
      `InitPassword endpoint called for user: ${req.user?.email}`,
    );
    const result = await this.authService.initPassword(
      req.user?.email,
      password,
    );
    this.logger.log('Password initialization process completed');
    return result;
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(HttpStatus.OK)
  async login(@Body() userCred: LoginUserDto) {
    this.logger.log(`Login endpoint called for email: ${userCred.email}`);
    const result = await this.authService.login(
      userCred.email,
      userCred.password,
    );
    this.logger.log('User logged in successfully');
    return result;
  }

  @Post('forgotPassword')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(
      `ForgotPassword endpoint called for email: ${forgotPasswordDto.email}`,
    );
    const otp = await this.authService.forgetPassword(forgotPasswordDto.email);
    this.logger.log('OTP sent to user email');
    return otp;
  }

  @Post('verifyOtp')
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    this.logger.log(
      `VerifyOtp endpoint called for hashed user: ${verifyOtpDto.hashedUser}`,
    );
    const token = await this.authService.verifyOtp(
      verifyOtpDto.hashedUser,
      verifyOtpDto.otp,
    );
    this.logger.log('OTP verified successfully');
    return { message: 'OTP verified', token };
  }

  @Post('resetPassword')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Req() req) {
    this.logger.log(
      `ResetPassword endpoint called for user: ${req.user?.email}`,
    );
    const resetResponse = await this.authService.resetPassword(
      req.user?.email,
      resetPasswordDto.newPassword,
    );
    this.logger.log('Password reset successfully');
    return { message: 'Password reset successfully', resetResponse };
  }
}
