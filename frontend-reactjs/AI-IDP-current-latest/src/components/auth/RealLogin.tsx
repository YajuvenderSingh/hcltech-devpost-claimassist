import React, { useState } from 'react';
import { Shield, Mail, Lock, LogIn, Users, Eye, EyeOff, UserCheck, RefreshCw, CheckCircle, FileText, Brain, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { realAuthService, AuthUser } from '../../services/realAuth';
import toast from 'react-hot-toast';

interface RealLoginProps {
  onLogin: (user: AuthUser) => void;
}

type AuthMode = 'signin' | 'signup' | 'verify';

const RealLogin: React.FC<RealLoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    verificationCode: '',
    role: 'Uploader' as 'Adjuster' | 'Uploader'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const user = await realAuthService.signIn(formData.email, formData.password);
        onLogin(user);
        toast.success('Welcome back!');
      } else if (mode === 'signup') {
        await realAuthService.signUp(formData.email, formData.password, formData.role);
        setMode('verify');
        toast.success('Verification code sent to your email');
      } else if (mode === 'verify') {
        await realAuthService.verifyEmail(formData.email, formData.verificationCode);
        const user = await realAuthService.signIn(formData.email, formData.password);
        onLogin(user);
        toast.success('Account verified successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Smart Document Processing",
      description: "AI-powered extraction and classification of insurance documents"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Intelligent Analysis",
      description: "Advanced ML algorithms for accurate claim processing"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Process thousands of documents in minutes, not hours"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "99.9% Accuracy",
      description: "Industry-leading precision in data extraction"
    }
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Left Side - Perfect Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background with RGBA overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/95 via-indigo-700/90 to-purple-800/95"></div>
        
        {/* Elegant Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-40 h-40 border border-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 border border-white rounded-full"></div>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            {/* Signature Logo */}
            <div className="mb-8">
              <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20 shadow-xl mx-auto">
                <Shield className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
              
              {/* Better Solution Name */}
               <div className="mb-4">
                <h1 className="text-5xl font-light mb-2 tracking-wide text-white">
                  AI-IDP
                </h1>
                <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-3"></div>
                <p className="text-lg text-blue-100 font-light tracking-wider">
                  Intelligent Document Processing
                </p>
              </div>
              
              {/* Signature Line */}
              <div className="text-sm text-blue-200 font-light italic">
                Crafted with precision by
              </div>
              <div className="text-xl font-bold text-white mt-1 tracking-wide">
                HCLTech
              </div>
            </div>

            {/* Elegant Features */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-center space-x-3 text-blue-100 group">
                <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:scale-150 transition-transform"></div>
                <span className="font-light text-sm">Smart Document Processing</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-blue-100 group">
                <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:scale-150 transition-transform"></div>
                <span className="font-light text-sm">AI-Powered Intelligence</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-blue-100 group">
                <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:scale-150 transition-transform"></div>
                <span className="font-light text-sm">Enterprise Excellence</span>
              </div>
            </div>

            {/* Signature Footer */}
            <div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-2"></div>
              <p className="text-xs text-blue-200 font-light italic">
                "Innovation meets Intelligence"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl mb-3 shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Verify Email'}
            </h1>
            <p className="text-sm text-gray-600">
              {mode === 'signin' ? 'Sign in to your AI-IDP account' : 
               mode === 'signup' ? 'Join the AI-IDP platform' : 
               'Enter the verification code sent to your email'}
            </p>
          </div>

          {/* Auth Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email Field */}
              {(mode === 'signin' || mode === 'signup') && (
                <div className="group">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              {(mode === 'signin' || mode === 'signup') && (
                <div className="group">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Role Selection - Only for signup */}
              {mode === 'signup' && (
                <div className="group">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Uploader' | 'Adjuster' })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400 appearance-none bg-white"
                    >
                      <option value="Uploader">Uploader</option>
                      <option value="Adjuster">Adjuster</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Verification Code Field */}
              {mode === 'verify' && (
                <div className="group">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCheck className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={formData.verificationCode}
                      onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                      placeholder="Enter verification code"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    {mode === 'signin' ? 'Signing In...' : mode === 'signup' ? 'Creating Account...' : 'Verifying...'}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    {mode === 'signin' ? <LogIn className="w-4 h-4 mr-2" /> : 
                     mode === 'signup' ? <UserCheck className="w-4 h-4 mr-2" /> : 
                     <CheckCircle className="w-4 h-4 mr-2" />}
                    {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Verify Email'}
                  </div>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Mode Toggle */}
          <div className="mt-4 text-center">
            {mode === 'signin' ? (
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign up
                </button>
              </p>
            ) : mode === 'signup' ? (
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Resend
                </button>
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Powered by <span className="font-semibold text-blue-600">HCLTech AI-IDP</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealLogin;
