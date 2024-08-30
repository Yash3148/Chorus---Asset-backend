// src/auth/dto/register-user.dto.ts
import { IsEmail } from 'class-validator';

export class RegisterUserDto {
  @IsEmail({}, { message: 'Invalid email' })
  email: string;
}
