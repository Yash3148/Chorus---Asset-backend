import { Injectable } from '@nestjs/common';
// import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class MailerService {
  constructor(private readonly configService: ConfigService) {
    // sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  //   async sendOtpEmail(to: string, otp: string) {
  //     const msg = {
  //       to,
  //       from: 'your-email@example.com', // Replace with your verified sender
  //       subject: 'Your Password Reset OTP',
  //       text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
  //     };

  //     try {
  //       await sgMail.send(msg);
  //       return { message: 'OTP sent successfully' };
  //     } catch (error) {
  //       return { message: 'Failed to send OTP', error };
  //     }
  //   }

  //   async sendPasswordEmail(to: string, username: string, password: string) {
  //     const msg = {
  //       to,
  //       from: 'your-email@example.com',
  //       subject: 'Your Account Registration',
  //       text: `Hi ${username},\n\nYour account has been successfully created.\nYour password is: ${password}\n\nPlease keep it safe!`,
  //     };

  //     try {
  //       await sgMail.send(msg);
  //       return { message: 'Email sent successfully' };
  //     } catch (error) {
  //       return { message: 'Failed to send email', error };
  //     }
  //   }

  generateOtp(): string {
    return crypto.randomBytes(2).toString('hex').toUpperCase(); // Generates a 6-character OTP
  }
}
