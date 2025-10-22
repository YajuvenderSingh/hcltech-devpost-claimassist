// Simple local authentication without Cognito
interface User {
  id: string;
  email: string;
  name: string;
  role: "Uploader" | "Adjuster";
  avatar?: string;
  emailVerified: boolean;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
  role: "Uploader" | "Adjuster";
}

// Mock users database
const mockUsers: { [email: string]: User & { password: string } } = {
  'uploader@test.com': {
    id: '1',
    email: 'uploader@test.com',
    password: 'password123',
    name: 'Test Uploader',
    role: 'Uploader',
    emailVerified: true
  },
  'adjuster@test.com': {
    id: '2',
    email: 'adjuster@test.com',
    password: 'password123',
    name: 'Test Adjuster',
    role: 'Adjuster',
    emailVerified: true
  }
};

class SimpleAuthService {
  private currentUser: User | null = null;

  async signIn(credentials: SignInCredentials): Promise<{ user: User; token: string }> {
    const { email, password } = credentials;
    
    console.log('🔍 Simple Auth - Sign in attempt:', email);
    
    const mockUser = mockUsers[email.toLowerCase()];
    
    if (!mockUser) {
      throw new Error('User not found');
    }
    
    if (mockUser.password !== password) {
      throw new Error('Invalid password');
    }
    
    const user: User = {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
      avatar: mockUser.avatar,
      emailVerified: mockUser.emailVerified
    };
    
    this.currentUser = user;
    
    // Store in localStorage
    localStorage.setItem('simpleAuth_user', JSON.stringify(user));
    localStorage.setItem('simpleAuth_token', 'mock-token-' + Date.now());
    
    console.log('✅ Simple Auth - Login successful:', user);
    
    return {
      user,
      token: 'mock-token-' + Date.now()
    };
  }

  async signUp(data: SignUpData): Promise<{ user: User; token: string }> {
    const { email, password, name, role } = data;
    
    console.log('🔍 Simple Auth - Sign up attempt:', email, role);
    
    if (mockUsers[email.toLowerCase()]) {
      throw new Error('User already exists');
    }
    
    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      password,
      name,
      role,
      emailVerified: true
    };
    
    mockUsers[email.toLowerCase()] = newUser;
    
    const user: User = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      emailVerified: newUser.emailVerified
    };
    
    this.currentUser = user;
    
    // Store in localStorage
    localStorage.setItem('simpleAuth_user', JSON.stringify(user));
    localStorage.setItem('simpleAuth_token', 'mock-token-' + Date.now());
    
    console.log('✅ Simple Auth - Signup successful:', user);
    
    return {
      user,
      token: 'mock-token-' + Date.now()
    };
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    
    const storedUser = localStorage.getItem('simpleAuth_user');
    const storedToken = localStorage.getItem('simpleAuth_token');
    
    if (storedUser && storedToken) {
      this.currentUser = JSON.parse(storedUser);
      console.log('🔍 Simple Auth - Restored user from storage:', this.currentUser);
      return this.currentUser;
    }
    
    return null;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('simpleAuth_user');
    localStorage.removeItem('simpleAuth_token');
    console.log('✅ Simple Auth - Signed out');
  }

  async verifyEmail(email: string, code: string): Promise<void> {
    console.log('✅ Simple Auth - Email verification (mock):', email, code);
    // Mock verification - always succeeds
  }

  async resendVerificationCode(email: string): Promise<void> {
    console.log('✅ Simple Auth - Resend verification (mock):', email);
    // Mock resend - always succeeds
  }
}

export const simpleAuthService = new SimpleAuthService();
