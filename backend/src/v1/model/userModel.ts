import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { functions } from '../library/functions';
import { appdb } from './appdb';
import nodemailer from 'nodemailer';
dotenv.config();

const functionOnj = new functions();

interface User {
    user_name: string;
    user_email: string;
    user_password: string;
    user_phone: string;
    user_aadhar?: string;
    user_verify?: boolean;
    user_profile?: string;
    user_role?: string;
    user_otp: number;
}

interface ServiceResponse {
    error: boolean;
    message: string;
    data: any;
}

export class userModel extends appdb {
    constructor() {
        super();
        this.table = 'users';
        this.uniqueField = 'id';
    }

    private generateOtp(): number {
        return Math.floor(100000 + Math.random() * 900000);
    }
    
    private async sendOtpEmail(email: string, otp: number): Promise<void> {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env['EMAIL_USER'],
                pass: process.env['EMAIL_PASS']
            }
        });
    
        const mailOptions = {
            from: process.env['EMAIL_USER'],
            to: email,
            subject: 'Verify Your Account - OTP',
            text: `Your OTP for verification is ${otp}. It will expire in 10 minutes.`
        };
        await transporter.sendMail(mailOptions);
    }    

    async findUserByEmail(user_email: string): Promise<ServiceResponse> {
        try {
            this.where = `WHERE user_email = '${user_email}'`;
            const row = await this.listRecords("*");

            return functionOnj.output(200, "User Found Successfully", row[0]);
        } catch (error) {
            return functionOnj.output(500, "Error Fetching User", null);
        }
    }

    async registerUserService(userData: User, ip: string): Promise<ServiceResponse> {
        try {
            const obj = new userModel();
            const existingUser = await obj.findUserByEmail(userData.user_email);
    
            if (existingUser.data) {
                return functionOnj.output(400, "User already registered, please login", null);
            }
    
            const hashedPassword = await bcrypt.hash(userData.user_password, 10);
            userData.user_password = hashedPassword;
    
            const otp = this.generateOtp();
            const otpExpiry = new Date(Date.now() + 30 * 60000)
                .toISOString()
                .replace("T", " ")
                .slice(0, -1);
    
                const userId = await this.insertRecord({
                    ...userData,
                    user_otp_verify: otp,
                    user_otp_expiry: otpExpiry,
                    created_ip: ip
                });
        
                try {
                    await this.sendOtpEmail(userData.user_email, otp);
                } catch (emailError) {
                    console.error("OTP Email sending failed:", emailError);
                    return functionOnj.output(500, "Failed to send OTP email", null);
                }
                
                const token = jwt.sign(
                    { id: userId },
                    process.env['JWT_SECRET'] as string,
                    { expiresIn: "10h" }
                );
    
                return functionOnj.output(200, "User registered successfully. OTP sent to email.", {
                    user_id: userId,
                    token
                });
        } catch (error) {
            return functionOnj.output(500, "Error Registering User", null);
        }
    }
    
    async verifyOtpService(user_email: string, user_otp_verify: number): Promise<ServiceResponse> {
        try {
            const user = await this.findUserByEmail(user_email);
    
            if (!user.data) {
                return functionOnj.output(404, "User not found", null);
            }
            
            const otp = user.data.user_otp_verify;
            const otpExpiry = new Date(user.data.user_otp_expir + "UTC");
            const now = new Date(); 
    
            if (!otp || Number(otp) !== Number(user_otp_verify)) {
                return functionOnj.output(400, "Invalid OTP", null);
              }
          
              if (now > otpExpiry) {
                return functionOnj.output(410, "OTP expired", null);
              }
            
            const updatePayload = {
                user_verify: true,
            };
    
            const updated = await this.updateRecord(user.data.id, updatePayload);
    
            if (!updated) {
                // console.log('====================================');
                // console.log("updated", updated.error);
                // console.log('====================================');
                return functionOnj.output(500, "Failed to verify user", null);
            }
        
            return functionOnj.output(200, "User verified successfully", null);
        } catch (error) {
            return functionOnj.output(500, "Error verifying OTP", error);
        }
    }

    async resendOtp(user_email: string, ip: string): Promise<ServiceResponse> {
        try {
            const user = await this.findUserByEmail(user_email);
    
            if (!user.data) {
                return functionOnj.output(404, "User not found", null);
            }
    
            if (user.data.user_otp_verify === null) {
                return functionOnj.output(400, "Email already verified", null);
            }
    
            const otp = this.generateOtp();
            const otpExpiry = new Date(Date.now() + 30 * 60000)
                .toISOString()
                .replace("T", " ")
                .slice(0, -1);
    
            await this.update(
                "users",
                {
                    user_otp_verify: otp,
                    user_otp_expiry: otpExpiry,
                    updated_ip: ip
                },
                `WHERE user_email = '${user_email}'`
            );
    
            await this.sendOtpEmail(user_email, otp);
    
            return functionOnj.output(200, "OTP resent successfully", null);
        } catch (error) {
            return functionOnj.output(500, "Error resending OTP", error);
        }
    }
    
    async loginService(user_email: string, user_password: string): Promise<ServiceResponse> {
        try {
            const obj = new userModel();
            const user = await obj.findUserByEmail(user_email);

            if (!user.data) {
                // console.log(user.data);
                return functionOnj.output(401, "Invalid Credentials", null);
            }

            const isValidPassword = await bcrypt.compare(user_password, user.data.user_password);
            if (!isValidPassword) {
                return functionOnj.output(401, "Invalid Password", null);
            }

            const token = jwt.sign(
                { id: user.data.id },
                process.env['JWT_SECRET'] as string,
                { expiresIn: "10h" }
            );

            return functionOnj.output(200, "Login Success", {
                token,
                id: user.data.id,
                email: user.data.user_email,
                verify: user.data.user_verify,
            });
        } catch (error) {
            return functionOnj.output(500, "Error in Login", null);
        }
    }

    async forgotPassword(user_email: string, ip: string): Promise<ServiceResponse> {
        try {
            const user = await this.findUserByEmail(user_email);
    
            if (!user.data) {
                return functionOnj.output(404, "User not found with this email", null);
            }
   
            const otp = this.generateOtp();
            const otpExpiry = new Date(Date.now() + 30 * 60000) 
                .toISOString()
                .replace("T", " ")
                .slice(0, -1); 
    
            const updatePayload = {
                user_otp_verify: otp,
                user_otp_expiry: otpExpiry,
                updated_ip: ip,
                updated_at: new Date().toISOString(),
            };
    
            const updated = await this.updateRecord(user.data.id, updatePayload);
            
            if (!updated) {
                return functionOnj.output(500, "Failed to update OTP", null);
            }
    
            await this.sendOtpEmail(user_email, otp);

            return functionOnj.output(200, "OTP sent successfully to your email. Please check your inbox.", null);
    
        } catch (error) {
            return functionOnj.output(500, "Error processing forgot password request", null);
        }
    }
    
    async resetPasswordService(user_email: string, user_otp_verify: number, new_password: string) : Promise<ServiceResponse> {
        try{
            const user = await this.findUserByEmail(user_email);

            if(!user.data){
                return functionOnj.output(0, "User not found", null);
            }
            const hashedPassword = await bcrypt.hash(new_password, 10);

            const updated = await this.updateRecord(user.data.id, {
                user_password: hashedPassword,
            });

            if(!updated){
                return functionOnj.output(500, "Failed to reset password", null);
            }
            return functionOnj.output(200, "Password reset successfully", updated);
        }catch(error){
            return functionOnj.output(500, "Error processing reset password request", null);
        }
    }

    async getProfileService(id: number): Promise<ServiceResponse> {
        try {
            const row = await this.selectRecord(id, "id, user_name, user_email, user_phone, user_verify, user_aadhar");

            if (!row[0]) {
                return functionOnj.output(400, "User not found", null);
            }
            return functionOnj.output(200, "Profile Fetch Successfully", row[0]);
        } catch (error) {
            return functionOnj.output(500, "Error in fetching Profile", null);
        }
    }

    async updateUser(id: number, userData: Partial<User>, ip: string): Promise<ServiceResponse> {
        try {
            const result = await this.updateRecord(id, {
                ...userData,
                updated_ip: ip
            });
    
            if (!result) {
                return functionOnj.output(404, "User not Updated", null);
            }
            return functionOnj.output(200, "Profile Update Successfully", userData);
        } catch (error) {
            return functionOnj.output(500, "Error in Update Profile", null);
        }
    }
    
    async getAllUser(): Promise<ServiceResponse> {
        try {
            const result = await this.listRecords("id, user_name, user_email, user_phone, user_verify, user_aadhar, user_role");

            if (!result) {
                return functionOnj.output(404, "Users not found", null);
            }
            return functionOnj.output(200, "All Users", result);
        } catch (error) {
            return functionOnj.output(500, "Error in Fetching Users", null);
        }
    }

    async checkUserRole(user_id: number): Promise<ServiceResponse> {
        if (!user_id || isNaN(Number(user_id))) {
            return functionOnj.output(400, "Invalid user ID", null);
        }
    
        this.where = `WHERE id = ${user_id}`;
        const user = await this.listRecords("id, user_role");
    
        if (user.length === 0) {
            return functionOnj.output(404, "User not found", null);
        }
    
        return functionOnj.output(200, "User role found", user[0]);
    }
}
