// import { Injectable, Logger } from '@nestjs/common';
// import * as sgMail from '@sendgrid/mail';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class MailerService {
//   private readonly logger = new Logger(MailerService.name);
//   private apiKey: string;
//   private emailUser: string;

//   constructor(private readonly configService: ConfigService) {
//     this.apiKey = this.configService.get<string>('SENDGRID_API_KEY');
//     this.emailUser = this.configService.get<string>('EMAIL_USER');

//     if (!this.apiKey) {
//       this.logger.error(
//         'SendGrid API Key is not defined in the environment variables.',
//       );
//       throw new Error(
//         'SendGrid API Key is not defined in the environment variables.',
//       );
//     }

//     if (!this.emailUser) {
//       this.logger.error(
//         'Sender email is not defined in the environment variables.',
//       );
//       throw new Error(
//         'Sender email is not defined in the environment variables.',
//       );
//     }

//     sgMail.setApiKey(this.apiKey);
//     this.logger.log('SendGrid API Key set successfully.');
//   }

//   async sendOtpEmail(to: string, otp: string) {
//     this.logger.log(`Attempting to send OTP email to: ${to}`);

//     const msg = {
//       to,
//       from: this.emailUser, // Make sure this is a verified sender
//       subject: 'Your Password Reset OTP',
//       text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
//     };

//     try {
//       await sgMail.send(msg);
//       this.logger.log(`OTP email sent successfully to ${to}`);
//       return { message: 'OTP sent successfully' };
//     } catch (error) {
//       this.logger.error(
//         `Failed to send OTP email to ${to}`,
//         error.response?.body || error,
//       );
//       return {
//         message: 'Failed to send OTP',
//         error: error.response?.body || error,
//       };
//     }
//   }

//   async sendPasswordEmail(to: string, password: string) {
//     this.logger.log(`Attempting to send registration email to: ${to}`);

//     const msg = {
//       to,
//       from: this.emailUser, // Make sure this is a verified sender
//       subject: 'Your Account Registration',
//       text: `Hi,\n\nYour account has been successfully created.\nYour password is: ${password}\n\nPlease keep it safe!`,
//     };

//     try {
//       await sgMail.send(msg);
//       this.logger.log(`Email sent successfully to ${to}`);
//       return { message: 'Email sent successfully' };
//     } catch (error) {
//       this.logger.error(
//         `Failed to send email to ${to}`,
//         error.response?.body || error,
//       );
//       return {
//         message: 'Failed to send email',
//         error: error.response?.body || error,
//       };
//     }
//   }

//   generateOtp(): string {
//     // Generate a 6-digit OTP
//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     this.logger.log(`Generated OTP: ${otp}`);
//     return otp;
//   }
// }

// import { Injectable, Logger } from '@nestjs/common';
// import * as nodemailer from 'nodemailer';
// import { google } from 'googleapis';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class MailerService {
//   private readonly logger = new Logger(MailerService.name);
//   private oAuth2Client: any;

//   constructor(private readonly configService: ConfigService) {
//     const CLIENT_ID = this.configService.get<string>('CLIENT_ID'); // Your client ID
//     const CLIENT_SECRET = this.configService.get<string>('CLIENT_SECRET'); // Your client secret
//     const REFRESH_TOKEN = this.configService.get<string>('REFRESH_TOKEN'); // Your refresh token

//     this.oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);

//     this.oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
//   }

//   private async createTransporter() {
//     const accessToken = await this.oAuth2Client.getAccessToken();

//     return nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         type: 'OAuth2',
//         user: this.configService.get<string>('EMAIL_USER'), // Your email address (verified with Gmail)
//         clientId: this.configService.get<string>('CLIENT_ID'),
//         clientSecret: this.configService.get<string>('CLIENT_SECRET'),
//         refreshToken: this.configService.get<string>('REFRESH_TOKEN'),
//         accessToken: accessToken.token,
//       },
//     });
//   }

//   async sendOtpEmail(to: string, otp: string) {
//     this.logger.log(`Attempting to send OTP email to: ${to}`);

//     const transporter = await this.createTransporter();

//     const mailOptions = {
//       from: this.configService.get<string>('EMAIL_USER'), // Sender address
//       to,
//       subject: 'Your OTP Code',
//       text: `Your OTP code is: ${otp}. It is valid for 10 minutes.`,
//       html: `<p>Your OTP code is: <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
//     };

//     try {
//       const result = await transporter.sendMail(mailOptions);
//       this.logger.log(`OTP email sent successfully to ${to}`);
//       return { message: 'OTP sent successfully' };
//     } catch (error) {
//       this.logger.error(`Failed to send OTP email to ${to}`, error.message);
//       return { message: 'Failed to send OTP', error: error.message };
//     }
//   }

//   generateOtp(): string {
//     // Generate a 4-digit OTP
//     const otp = Math.floor(1000 + Math.random() * 9000).toString();
//     this.logger.log(`Generated OTP: ${otp}`);
//     return otp;
//   }
// }

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;
  private emailUser: string;
  constructor(private readonly configService: ConfigService) {
    this.emailUser = this.configService.get<string>('EMAIL_USER');
    // Initialize the Nodemailer transporter with SMTP configuration
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 465,
      secure: true, // true for 465, false for other ports
      logger: false,
      debug: false,
      secureConnection: false,
      auth: {
        user: this.emailUser, // generated ethereal user
        pass: this.configService.get<string>('EMAIL_PASSWORD'), // generated ethereal password
      },
      tls: {
        rejectUnAuthorized: true,
      },
      // host: this.configService.get<string>('EMAIL_HOST'), // Replace with your SMTP server
      // port: this.configService.get<string>('EMAIL_PORT'),
      // secure: true, // Use true for 465, false for other ports
      // auth: {
      //   user: this.emailUser, // Your email
      //   pass: this.configService.get<string>('EMAIL_PASSWORD'), // Your email password
      // },
    });

    if (!this.emailUser) {
      this.logger.error(
        'Sender email is not defined in the environment variables.',
      );
      throw new Error(
        'Sender email is not defined in the environment variables.',
      );
    }
  }

  async sendOtpEmail(to: string, otp): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.emailUser, // sender address
        to, // list of receivers
        subject: 'Chorus Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
      });
      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw new Error('Failed to send email');
    }
  }

  generateOtp(): string {
    // Generate a 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    this.logger.log(`Generated OTP: ${otp}`);
    return otp;
  }
}
