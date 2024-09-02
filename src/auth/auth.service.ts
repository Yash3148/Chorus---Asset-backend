// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
<<<<<<< HEAD
  Logger,
  NotFoundException,
  UnauthorizedException,
  Inject,
=======
  NotFoundException,
  UnauthorizedException,
>>>>>>> origin/main
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from 'src/user/schemas/user.entity';
import { MailerService } from 'src/helpers/mailer.service';
<<<<<<< HEAD
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  // private otps: Map<string, { otp: string; expiresIn: number }> = new Map();

=======

@Injectable()
export class AuthService {
  private otps: Map<string, { otp: string; expiresIn: number }> = new Map();
>>>>>>> origin/main
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
<<<<<<< HEAD
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async register(email: string): Promise<any> {
    if (!email) {
      this.logger.warn('Registration failed: email is required');
      throw new BadRequestException('Email is required');
    }

    const existingUser = await this.userService.findUserByEmail(email);
    if (existingUser) {
      this.logger.warn(
        `Registration failed: User already exists with email ${email}`,
      );
      throw new BadRequestException('User already exists');
    }

    const password = crypto.randomBytes(4).toString('hex'); // Generate a random 8-character password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { email, password: hashedPassword };

    this.logger.log(`Registering user with email ${email}`);
    await this.userService.registerUser(userData);

    // Send the generated password to the user via email
    await this.mailerService.sendPasswordEmail(email, password);

=======
  ) {}

  async register(email: string): Promise<any> {
    const password = crypto.randomBytes(4).toString('hex'); // Generate a random 16-character password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { email, password: hashedPassword };
    console.log({ email, password });
    await this.userService.registerUser(userData);
>>>>>>> origin/main
    return { email, password };
  }

  async login(email: string, userPassword: string): Promise<any> {
<<<<<<< HEAD
    if (!email || !userPassword) {
      this.logger.warn('Login failed: email and password are required');
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userService.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(userPassword, user.password))) {
      this.logger.warn(`Login failed: Invalid credentials for email ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...userDetails } = user;
    const payload = userDetails;
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`User logged in with email ${email}`);
=======
    const user = await this.userService.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(userPassword, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { password, ...userDetails } = user;
    const payload = userDetails;
    const accessToken = this.jwtService.sign(payload);
>>>>>>> origin/main
    return { user: userDetails, accessToken };
  }

  async forgetPassword(email: string): Promise<any> {
<<<<<<< HEAD
    if (!email) {
      this.logger.warn('Forget Password failed: email is required');
      throw new BadRequestException('Email is required');
    }

    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      this.logger.warn(
        `Forget Password failed: User not found with email ${email}`,
      );
=======
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
>>>>>>> origin/main
      throw new NotFoundException('User not found');
    }

    const otp = this.mailerService.generateOtp();
    const expiresIn = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

<<<<<<< HEAD
    // Store OTP in cache with a TTL of 10 minutes
    await this.cacheManager.set(email, { otp, expiresIn }, 600);

    this.logger.log(`OTP generated for email ${email}`);
    await this.mailerService.sendOtpEmail(email, otp);

    return { otp }; // For debugging, remove in production
  }

  async verifyOtp(email: string, otp: string): Promise<any> {
    if (!email || !otp) {
      this.logger.warn('Verify OTP failed: email and OTP are required');
      throw new BadRequestException('Email and OTP are required');
    }

    const record = await this.cacheManager.get<{
      otp: string;
      expiresIn: number;
    }>(email);
    if (!record || record.otp !== otp) {
      this.logger.warn(
        `Verify OTP failed: Invalid or expired OTP for email ${email}`,
      );
=======
    this.otps.set(email, { otp, expiresIn });
    // await this.mailerService.sendOtpEmail(email, otp);
    return { otp };
  }

  async verifyOtp(email: string, otp: string): Promise<any> {
    const record = this.otps.get(email);
    if (!record || record.otp !== otp) {
>>>>>>> origin/main
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (record.expiresIn < Date.now()) {
<<<<<<< HEAD
      await this.cacheManager.del(email);
      this.logger.warn(`Verify OTP failed: OTP has expired for email ${email}`);
=======
      this.otps.delete(email);
>>>>>>> origin/main
      throw new BadRequestException('OTP has expired');
    }

    // OTP is valid, remove it to prevent reuse
<<<<<<< HEAD
    await this.cacheManager.del(email);
    this.logger.log(`OTP verified for email ${email}`);
=======
    this.otps.delete(email);
>>>>>>> origin/main

    // Generate a temporary JWT token for password reset
    const user = await this.userService.findUserByEmail(email);
    const payload = { sub: user.id, email: user.email };
<<<<<<< HEAD
    const token = this.jwtService.sign(payload, { expiresIn: '1m' }); // Token valid for 1 minute

    return { token };
  }

  async resetPassword(email: string, newPassword: string): Promise<User> {
    if (!email || !newPassword) {
      this.logger.warn(
        'Reset Password failed: email and new password are required',
      );
      throw new BadRequestException('Email and new password are required');
    }

    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      this.logger.warn(
        `Reset Password failed: User not found with email ${email}`,
      );
=======
    const token = this.jwtService.sign(payload, { expiresIn: '1m' }); // Token valid for 1 minutes

    return token;
  }

  async resetPassword(email: string, newPassword: string): Promise<User> {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
>>>>>>> origin/main
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
<<<<<<< HEAD

    this.logger.log(`Password reset for user with email ${email}`);
=======
>>>>>>> origin/main
    return this.userService.updateUser(user);
  }
}
