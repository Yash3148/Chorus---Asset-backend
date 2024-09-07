// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from 'src/user/schemas/user.entity';
import { MailerService } from 'src/helpers/mailer.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  private readonly logger: Logger = new Logger(AuthService.name);
  // private otps: Map<string, { otp: string; expiresIn: number }> = new Map();

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private readonly mailerService: MailerService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<any> {
    const {
      email,
      firstName,
      lastName,
      middleInitial,
      hospitalId,
      phoneNumber,
    } = registerUserDto;

    const existingUser = await this.userService.findUserByEmail(email);
    if (existingUser) {
      this.logger.warn(
        `Registration failed: User already exists with email ${email}`,
      );
      throw new BadRequestException('User already exists');
    }

    const password = crypto.randomBytes(4).toString('hex'); // Generate a random 8-character password
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User();
    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;
    user.middleInitial = middleInitial;
    user.hospitalId = hospitalId;
    user.phoneNumber = phoneNumber;
    user.password = hashedPassword; // Set password to null
    user.isUserVerified = false; // Set lastLogin to null

    this.logger.log(`Registering user with email ${email}`);
    await this.userService.registerUser(user);

    // Send the generated password to the user via email
    // await this.mailerService.sendPasswordEmail(email, password);

    return { message: 'User Registered successfully' };
  }

  async initLogin(
    email: string,
  ): Promise<{ hashedUser: string; isUserVerified: boolean }> {
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // If user is not verified, send OTP and cache OTP and hashed user details
    if (!user.isUserVerified) {
      const otp = this.mailerService.generateOtp();
      // const expiresIn = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

      const hashedUser = crypto
        .createHash('sha256')
        .update(email)
        .digest('hex'); // Create hash for the user

      // Store OTP and hashed user in cache manager
      await this.cacheManager.set(hashedUser, { otp, email }, 300000); // TTL 5 minutes
      this.logger.log(`OTP:- ${otp} generated for email ${email}`);
      await this.mailerService.sendOtpEmail(email, otp);
      return { hashedUser, isUserVerified: false };
    } else {
      // User already verified, return hashed user with isUserVerified true
      const hashedUser = crypto
        .createHash('sha256')
        .update(email)
        .digest('hex');
      return { hashedUser, isUserVerified: true };
    }
  }

  async login(email: string, userPassword: string): Promise<any> {
    if (!email || !userPassword) {
      this.logger.warn('Login failed: email and password are required');
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userService.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(userPassword, user.password))) {
      this.logger.warn(`Login failed: Invalid credentials for email ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.id,
    });

    const { id, password, ...sanitizedUser } = user;
    this.logger.log(`User logged in with email ${email}`);
    return { user: sanitizedUser, accessToken };
  }

  async forgetPassword(email: string): Promise<any> {
    if (!email) {
      this.logger.warn('Forget Password failed: email is required');
      throw new BadRequestException('Email is required');
    }

    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      this.logger.warn(
        `Forget Password failed: User not found with email ${email}`,
      );
      throw new NotFoundException('User not found');
    }

    const otp = this.mailerService.generateOtp();
    // const expiresIn = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    const hashedUser = crypto.createHash('sha256').update(email).digest('hex');
    // Store OTP in cache with a TTL of 10 minutes
    await this.cacheManager.set(hashedUser, { otp, email }, 300000);

    this.logger.log(`OTP:- ${otp} generated for email ${email}`);
    await this.mailerService.sendOtpEmail(email, otp);

    return { message: 'otp sent successfully' }; // For debugging, remove in production
  }

  async verifyOtp(hashedUser: string, otp: string): Promise<any> {
    if (!hashedUser || !otp) {
      this.logger.warn('Verify OTP failed: HashUser and OTP are required');
      throw new BadRequestException('Key and OTP are required');
    }

    const cachedData = await this.cacheManager.get<{
      otp: string;
      email: string;
    }>(hashedUser);
    if (!cachedData || cachedData.otp !== otp) {
      this.logger.warn(
        `Verify OTP failed: Invalid or expired OTP for email ${cachedData.email}`,
      );
      throw new BadRequestException('Invalid or expired OTP');
    }

    // if (record.expiresIn < Date.now()) {
    //   await this.cacheManager.del(email);
    //   this.logger.warn(`Verify OTP failed: OTP has expired for email ${email}`);
    //   throw new BadRequestException('OTP has expired');
    // }

    // OTP is valid, remove it to prevent reuse
    await this.cacheManager.del(hashedUser);
    this.logger.log(`OTP verified for email ${cachedData.email}`);

    // Generate a temporary JWT token for password reset
    const user = await this.userService.findUserByEmail(cachedData.email);
    user.isUserVerified = true;
    await this.userService.updateUser(user);
    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload, { expiresIn: '1m' }); // Token valid for 1 minute

    return { message: 'OTP verified successfully.', access_token };
  }

  async resetPassword(email: string, newPassword: string): Promise<any> {
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
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    this.logger.log(`Password reset for user with email ${email}`);
    return { message: 'Password reset successfully' };
  }

  async initPassword(email: string, newPassword: string): Promise<any> {
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
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    this.logger.log(`Password reset for user with email ${email}`);
    await this.userService.updateUser(user);
    const { id, password, ...sanitizedUser } = user;
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.id,
    });
    return { user: sanitizedUser, accessToken };
  }
}
