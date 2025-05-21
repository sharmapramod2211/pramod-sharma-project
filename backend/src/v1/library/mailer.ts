import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export class Mailer {
    transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS, 
            },
        });
    }

    async sendOtpMail(to: string, otp: string): Promise<boolean> {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject: 'Your OTP Code',
            html: `<p>Your OTP code is <b>${otp}</b>. It will expire in 30 minutes.</p>`,
        };

        try {
            await this.transporter.sendMail(mailOptions);
            return true;
        } catch (err) {
            console.error('Error sending email:', err);
            return false;
        }
    }
}
