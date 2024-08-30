// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from 'src/user/schemas/user.entity';
import { MailerService } from 'src/helpers/mailer.service';

@Injectable()
export class AuthService {
  private otps: Map<string, { otp: string; expiresIn: number }> = new Map();
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async register(email: string): Promise<any> {
    const password = crypto.randomBytes(4).toString('hex'); // Generate a random 16-character password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { email, password: hashedPassword };
    console.log({ email, password });
    await this.userService.registerUser(userData);
    return { email, password };
  }

  async login(email: string, userPassword: string): Promise<any> {
    const user = await this.userService.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(userPassword, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { password, ...userDetails } = user;
    const payload = userDetails;
    const accessToken = this.jwtService.sign(payload);
    return { user: userDetails, accessToken };
  }

  async forgetPassword(email: string): Promise<any> {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otp = this.mailerService.generateOtp();
    const expiresIn = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    this.otps.set(email, { otp, expiresIn });
    // await this.mailerService.sendOtpEmail(email, otp);
    return { otp };
  }

  async verifyOtp(email: string, otp: string): Promise<any> {
    const record = this.otps.get(email);
    if (!record || record.otp !== otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (record.expiresIn < Date.now()) {
      this.otps.delete(email);
      throw new BadRequestException('OTP has expired');
    }

    // OTP is valid, remove it to prevent reuse
    this.otps.delete(email);

    // Generate a temporary JWT token for password reset
    const user = await this.userService.findUserByEmail(email);
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload, { expiresIn: '1m' }); // Token valid for 1 minutes

    return token;
  }

  async resetPassword(email: string, newPassword: string): Promise<User> {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    return this.userService.updateUser(user);
  }
}
