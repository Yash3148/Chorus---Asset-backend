import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  //   @IsEmail({}, { message: 'Please provide a valid email address' })
  //   email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}
