import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private apiKey: string;
  private emailUser: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.emailUser = this.configService.get<string>('EMAIL_USER');

    if (!this.apiKey) {
      this.logger.error(
        'SendGrid API Key is not defined in the environment variables.',
      );
      throw new Error(
        'SendGrid API Key is not defined in the environment variables.',
      );
    }

    if (!this.emailUser) {
      this.logger.error(
        'Sender email is not defined in the environment variables.',
      );
      throw new Error(
        'Sender email is not defined in the environment variables.',
      );
    }

    sgMail.setApiKey(this.apiKey);
    this.logger.log('SendGrid API Key set successfully.');
  }

  async sendOtpEmail(to: string, otp: string) {
    this.logger.log(`Attempting to send OTP email to: ${to}`);

    const msg = {
      to,
      from: this.emailUser, // Make sure this is a verified sender
      subject: 'Your Password Reset OTP',
      text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`OTP email sent successfully to ${to}`);
      return { message: 'OTP sent successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to send OTP email to ${to}`,
        error.response?.body || error,
      );
      return {
        message: 'Failed to send OTP',
        error: error.response?.body || error,
      };
    }
  }

  async sendPasswordEmail(to: string, password: string) {
    this.logger.log(`Attempting to send registration email to: ${to}`);

    const msg = {
      to,
      from: this.emailUser, // Make sure this is a verified sender
      subject: 'Your Account Registration',
      text: `Hi,\n\nYour account has been successfully created.\nYour password is: ${password}\n\nPlease keep it safe!`,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email sent successfully to ${to}`);
      return { message: 'Email sent successfully' };
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}`,
        error.response?.body || error,
      );
      return {
        message: 'Failed to send email',
        error: error.response?.body || error,
      };
    }
  }

  generateOtp(): string {
    // Generate a 6-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.logger.log(`Generated OTP: ${otp}`);
    return otp;
  }
}
