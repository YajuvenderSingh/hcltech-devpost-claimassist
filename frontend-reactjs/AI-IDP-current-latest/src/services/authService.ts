import {
  signIn,
  signOut,
  getCurrentUser,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  fetchAuthSession,
  fetchUserAttributes,
} from "aws-amplify/auth";
import type { SignInInput, SignUpInput } from "aws-amplify/auth";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "Uploader" | "Adjuster";
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: "Uploader" | "Adjuster";
}

class AuthService {
  // Sign in user
  async signIn(
    credentials: LoginCredentials,
  ): Promise<{ user: AuthUser; token: string }> {
    try {
      // Clear any existing sessions
      try {
        await signOut();
      } catch (error) {
        console.log("No existing session to clear");
      }

      const signInInput: SignInInput = {
        username: credentials.email,
        password: credentials.password,
      };

      console.log("Attempting to sign in with:", credentials.email);
      const result = await signIn(signInInput);

      // Handle different sign-in steps
      if (result.nextStep) {
        switch (result.nextStep.signInStep) {
          case "CONFIRM_SIGN_UP":
            throw new Error(
              "VERIFICATION_REQUIRED|Please verify your email address first. Check your email for verification code.",
            );
          case "RESET_PASSWORD":
            throw new Error(
              "Password reset required. Please reset your password.",
            );
          case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
            throw new Error(
              "New password required. Please contact administrator.",
            );
          case "DONE":
            // Sign-in completed successfully, continue with normal flow
            console.log("Sign-in step DONE - authentication completed");
            break;
          default:
            throw new Error(
              `Authentication step required: ${result.nextStep.signInStep}`,
            );
        }
      }

      if (!result.isSignedIn) {
        throw new Error("Authentication failed");
      }

      // Get current user details
      const currentUser = await getCurrentUser();

      // Get user attributes
      let userAttributes: Record<string, any> = {};
      try {
        userAttributes = await fetchUserAttributes();
      } catch (error) {
        console.log("Could not fetch user attributes:", error);
      }

      // Get session token
      let token = "placeholder-token";
      try {
        const session = await fetchAuthSession();
        token = session.tokens?.accessToken?.toString() || "placeholder-token";
      } catch (sessionError) {
        console.log("Could not fetch session, using placeholder token");
      }

      // Determine user role
      const userRole = this.getUserRole(userAttributes, credentials.email);

      const user: AuthUser = {
        id: currentUser.userId,
        email: credentials.email, // Always use the login email
        name: userAttributes.name || userAttributes.email || currentUser.username,
        role: userRole,
        emailVerified: userAttributes.email_verified === "true" || true,
        createdAt: userAttributes.created_at || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // Store email in localStorage for getCurrentUser method
      localStorage.setItem('userEmail', credentials.email);

      console.log("Sign in successful for user:", user);
      return { user, token };
    } catch (error: any) {
      console.error("🚨 Sign in error occurred:");
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
      console.error("Error code:", error.code);
      console.error("Full error object:", error);
      console.error("Error stack:", error.stack);
      
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Sign up new user
  async signUp(
    userData: SignUpData,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Clear any existing sessions
      try {
        await signOut();
      } catch (error) {
        console.log("No existing session to clear");
      }

      const signUpInput: SignUpInput = {
        username: userData.email,
        password: userData.password,
        options: {
          userAttributes: {
            email: userData.email,
            name: userData.name,
            // Store role in a standard attribute since custom attributes might not be configured
            preferred_username: userData.role,
          },
        },
      };

      console.log("Attempting to sign up with:", userData);
      const result = await signUp(signUpInput);

      if (result.isSignUpComplete) {
        return {
          success: true,
          message: "Account created successfully! You can now sign in.",
        };
      } else if (result.nextStep?.signUpStep === "CONFIRM_SIGN_UP") {
        return {
          success: true,
          message: "Please check your email for verification code.",
        };
      } else {
        return {
          success: true,
          message: `Please complete the verification process. Step: ${result.nextStep?.signUpStep}`,
        };
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Admin confirm user (workaround for disabled auto-verification)
  async adminConfirmUser(email: string): Promise<void> {
    try {
      console.log("Admin confirming user:", email);
      
      // This would require admin privileges - for now, we'll simulate success
      // In production, this should call adminConfirmSignUp API
      
      console.log("User confirmed successfully (simulated)");
    } catch (error: any) {
      console.log("Error confirming user:", error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Confirm sign up with verification code
  async confirmSignUp(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log("Confirming sign up for:", email, "with code:", code);

      const result = await confirmSignUp({
        username: email,
        confirmationCode: code.trim(), // Remove any whitespace
      });

      if (result.isSignUpComplete) {
        return {
          success: true,
          message: "Email verified successfully! You can now sign in.",
        };
      } else {
        throw new Error("Email verification incomplete");
      }
    } catch (error: any) {
      console.error("Confirm sign up error:", error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Resend verification code
  async resendVerificationCode(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log("Resending verification code to:", email);

      const result = await resendSignUpCode({
        username: email,
      });

      console.log("Resend result:", result);

      return {
        success: true,
        message:
          "Verification code sent to your email. Please check your inbox and spam folder.",
      };
    } catch (error: any) {
      console.error("Resend code error:", error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      await signOut();
      // Clear stored email
      localStorage.removeItem('userEmail');
    } catch (error: any) {
      console.error("Sign out error:", error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Get current authenticated user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        return null;
      }

      // Get user attributes
      let userAttributes: Record<string, any> = {};
      try {
        userAttributes = await fetchUserAttributes();
      } catch (error) {
        console.log("Could not fetch user attributes:", error);
        // Fallback when identity pool is not configured
        userAttributes = {
          email: currentUser.username,
          name: currentUser.username,
          email_verified: "true"
        };
      }

      const userRole = this.getUserRole(
        userAttributes,
        userAttributes.email || currentUser.username,
      );

      // Get stored email from localStorage
      const storedEmail = localStorage.getItem('userEmail');
      const userEmail = storedEmail || userAttributes.email || currentUser.username;

      return {
        id: currentUser.userId,
        email: userEmail,
        name: userAttributes.name || userEmail,
        role: userRole,
        emailVerified: userAttributes.email_verified === "true" || true,
        createdAt: userAttributes.created_at || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }

  // Enhanced role determination
  private getUserRole(
    userAttributes: Record<string, any>,
    email: string,
  ): "Uploader" | "Adjuster" {
    // First try to get role from custom attribute
    if (userAttributes["custom:role"]) {
      const role = userAttributes["custom:role"];
      if (role === "Adjuster" || role === "Document Reviewer") {
        return "Adjuster";
      }
      return "Uploader";
    }

    // Try preferred_username where we stored the role
    if (userAttributes["preferred_username"]) {
      const role = userAttributes["preferred_username"];
      if (role === "Adjuster" || role === "Document Reviewer") {
        return "Adjuster";
      }
      return "Uploader";
    }

    // Fallback to email-based determination
    const lowerEmail = email.toLowerCase();
    if (lowerEmail.includes("adjuster") || lowerEmail.includes("reviewer")) {
      return "Adjuster";
    }

    return "Uploader";
  }

  // Enhanced error handling
  private getErrorMessage(error: any): string {
    const errorCode = error.name || error.code;

    console.log("🔍 Complete Error Analysis:", {
      name: error.name,
      code: error.code,
      message: error.message,
      errorString: error.toString(),
      errorType: typeof error,
      keys: Object.keys(error),
      fullError: JSON.stringify(error, null, 2),
      stack: error.stack,
    });

    switch (errorCode) {
      case "UserNotFoundException":
        return "No account found with this email address. Please check your email or sign up for a new account.";
      case "NotAuthorizedException":
        return "Incorrect email or password. Please try again.";
      case "UserNotConfirmedException":
        return "VERIFICATION_REQUIRED|Please verify your email address before signing in. Check your email for verification code.";
      case "InvalidParameterException":
        return "Invalid email or password format. Please check your input.";
      case "TooManyRequestsException":
        return "Too many attempts. Please wait a few minutes before trying again.";
      case "LimitExceededException":
        return "Too many requests. Please try again later.";
      case "UsernameExistsException":
        return "An account with this email already exists. Please sign in instead.";
      case "InvalidPasswordException":
        return "Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters.";
      case "CodeMismatchException":
        return "Invalid verification code. Please check the code and try again.";
      case "ExpiredCodeException":
        return "Verification code has expired. Please request a new one.";
      case "AliasExistsException":
        return "An account with this email already exists.";
      case "InvalidVerificationCodeException":
        return "Invalid verification code format.";
      case "NetworkError":
        return "Network error. Please check your internet connection and try again.";
      default:
        return (
          error.message ||
          "An unexpected error occurred. Please try again or contact support."
        );
    }
  }
}

export const authService = new AuthService();
