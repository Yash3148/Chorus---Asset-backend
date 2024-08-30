import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @Length(4, 4, { message: 'OTP must be exactly 4 characters long' })
  otp: string;
}
