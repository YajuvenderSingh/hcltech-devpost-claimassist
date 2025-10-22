// Real-time Authentication Service with AWS SES Email Verification
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// AWS SES Configuration
const SES_CONFIG = {
  region: 'us-east-1',
  fromEmail: 'admin@hcltech.com', // Use a verified domain email
  fromName: 'HCLTech AI IDP Team'
};

export interface AuthUser {
  id: string;
  email: string;
  role: 'Adjuster' | 'Uploader';
  verified: boolean;
  token: string;
}

interface StoredUser {
  id: string;
  email: string;
  password: string;
  role: 'Adjuster' | 'Uploader';
  verified: boolean;
  verificationCode: string;
  createdAt: number;
}

class RealAuthService {
  private users: Map<string, StoredUser> = new Map();
  private sessions: Map<string, AuthUser> = new Map();
  private sesClient: SESClient;

  constructor() {
    // Initialize AWS SES Client with default credentials
    this.sesClient = new SESClient({ 
      region: SES_CONFIG.region
    });
    
    // Load users from localStorage
    this.loadUsers();
  }

  // Generate verification code
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate session token
  private generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Send verification email via AWS SES
  private async sendVerificationEmail(email: string, code: string): Promise<void> {
    try {
      console.log(`📧 Sending verification email to ${email} via AWS SES`);
      
      const emailParams = {
        Source: SES_CONFIG.fromEmail,
        Destination: {
          ToAddresses: [email]
        },
        Message: {
          Subject: {
            Data: 'HCLTech AI IDP - Email Verification Code'
          },
          Body: {
            Text: {
              Data: `
HCLTech AI IDP - Email Verification

Hello,

Welcome to HCLTech AI IDP (Intelligent Document Processing)!

Your verification code is: ${code}

This code will expire in 10 minutes.

Please enter this code in the application to complete your registration.

If you didn't create an account, please ignore this email.

Best regards,
HCLTech AI IDP Team
              `
            },
            Html: {
              Data: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #2563eb; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">HCLTech AI IDP</h1>
                    <p style="color: #e0e7ff; margin: 5px 0 0 0;">Email Verification</p>
                  </div>
                  
                  <div style="padding: 30px; background: #f8fafc;">
                    <h2 style="color: #1e293b;">Verify Your Email</h2>
                    <p>Welcome to HCLTech AI IDP! Your verification code is:</p>
                    
                    <div style="background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                      <div style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px;">
                        ${code}
                      </div>
                    </div>
                    
                    <p style="color: #f59e0b;">⏰ This code expires in 10 minutes.</p>
                    <p>Enter this code in the application to verify your email.</p>
                    
                    <hr style="margin: 20px 0;">
                    <p style="color: #64748b; font-size: 12px;">
                      If you didn't create an account, please ignore this email.<br>
                      Best regards, HCLTech AI IDP Team
                    </p>
                  </div>
                </div>
              `
            }
          }
        }
      };

      const command = new SendEmailCommand(emailParams);
      const response = await this.sesClient.send(command);
      
      console.log('✅ Email sent successfully via AWS SES:', response.MessageId);
      
    } catch (error: any) {
      console.error('❌ AWS SES Error:', error);
      
      // For testing, show the code in console
      console.log(`🔑 VERIFICATION CODE: ${code} for ${email}`);
      
      // Throw error to show user that email couldn't be sent
      throw new Error('Email service temporarily unavailable. Please try again later.');
    }
  }

  // Sign up with AWS SES email verification
  async signUp(email: string, password: string, role: 'Adjuster' | 'Uploader'): Promise<void> {
    try {
      // Check if user already exists
      if (this.users.has(email)) {
        throw new Error('User already exists with this email');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }

      // Validate password
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const verificationCode = this.generateVerificationCode();
      
      const user: StoredUser = {
        id: `user_${Date.now()}`,
        email,
        password, // In production, hash this password
        role,
        verified: false,
        verificationCode,
        createdAt: Date.now()
      };

      this.users.set(email, user);
      this.saveUsers();

      // Try to send verification email via AWS SES
      try {
        await this.sendVerificationEmail(email, verificationCode);
        console.log('✅ User registered and email sent:', { email, role });
      } catch (emailError) {
        // If email fails, still allow signup but inform user
        console.log('⚠️ User registered but email failed:', { email, role });
        throw new Error(`Account created but verification email failed. Your code is: ${verificationCode}`);
      }
    } catch (error: any) {
      console.error('❌ Sign up error:', error);
      throw error;
    }
  }

  // Verify email with code
  async verifyEmail(email: string, code: string): Promise<void> {
    try {
      const user = this.users.get(email);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.verified) {
        throw new Error('Email already verified');
      }

      if (user.verificationCode !== code) {
        throw new Error('Invalid verification code');
      }

      // Check if code is expired (10 minutes)
      const codeAge = Date.now() - user.createdAt;
      if (codeAge > 10 * 60 * 1000) {
        throw new Error('Verification code expired');
      }

      user.verified = true;
      this.users.set(email, user);
      this.saveUsers();

      console.log('✅ Email verified successfully:', email);
    } catch (error: any) {
      console.error('❌ Email verification error:', error);
      throw error;
    }
  }

  // Sign in
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const user = this.users.get(email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (user.password !== password) {
        throw new Error('Invalid email or password');
      }

      if (!user.verified) {
        throw new Error('Please verify your email before signing in');
      }

      const token = this.generateToken();
      
      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        verified: user.verified,
        token
      };

      this.sessions.set(token, authUser);
      this.saveSessions();

      console.log('✅ Sign in successful:', { email, role: user.role });
      return authUser;
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  }

  // Resend verification code via AWS SES
  async resendVerificationCode(email: string): Promise<void> {
    try {
      const user = this.users.get(email);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (user.verified) {
        throw new Error('Email already verified');
      }

      const newCode = this.generateVerificationCode();
      user.verificationCode = newCode;
      user.createdAt = Date.now(); // Reset timer
      
      this.users.set(email, user);
      this.saveUsers();

      try {
        await this.sendVerificationEmail(email, newCode);
        console.log('✅ Verification code resent via AWS SES:', email);
      } catch (emailError) {
        throw new Error(`Failed to resend email. Your new code is: ${newCode}`);
      }
    } catch (error: any) {
      console.error('❌ Resend code error:', error);
      throw error;
    }
  }

  // Get current user by token
  getCurrentUser(token: string): AuthUser | null {
    return this.sessions.get(token) || null;
  }

  // Sign out
  async signOut(token: string): Promise<void> {
    this.sessions.delete(token);
    this.saveSessions();
    console.log('✅ Sign out successful');
  }

  // Check if user exists
  userExists(email: string): boolean {
    return this.users.has(email);
  }

  // Get user verification status
  getUserStatus(email: string): { exists: boolean; verified: boolean } {
    const user = this.users.get(email);
    return {
      exists: !!user,
      verified: user?.verified || false
    };
  }

  // Storage helpers
  private saveUsers(): void {
    try {
      const usersArray = Array.from(this.users.entries());
      localStorage.setItem('realAuth_users', JSON.stringify(usersArray));
    } catch (error) {
      console.error('❌ Error saving users:', error);
    }
  }

  private loadUsers(): void {
    try {
      const stored = localStorage.getItem('realAuth_users');
      if (stored) {
        const usersArray = JSON.parse(stored);
        this.users = new Map(usersArray);
      }
    } catch (error) {
      console.error('❌ Error loading users:', error);
    }
  }

  private saveSessions(): void {
    try {
      const sessionsArray = Array.from(this.sessions.entries());
      localStorage.setItem('realAuth_sessions', JSON.stringify(sessionsArray));
    } catch (error) {
      console.error('❌ Error saving sessions:', error);
    }
  }

  // Get all users (for admin/debug)
  getAllUsers(): Array<{ email: string; role: string; verified: boolean }> {
    return Array.from(this.users.values()).map(user => ({
      email: user.email,
      role: user.role,
      verified: user.verified
    }));
  }
}

export const realAuthService = new RealAuthService();
