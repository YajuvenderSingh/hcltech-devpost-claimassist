import React, { useState, useEffect } from 'react';
import { Shield, Mail, Lock, LogIn, Users, FileText, Brain, Zap, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

// Load Google Font
const loadGoogleFont = () => {
  const link = document.createElement('link');
  link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
};

interface SimpleLoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

const SimpleLogin: React.FC<SimpleLoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'Uploader' as 'Uploader' | 'Adjuster'
  });
  const [loading, setLoading] = useState(false);

  // Load Google Font on component mount
  useEffect(() => {
    loadGoogleFont();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onLogin(formData.email, formData.password);
    } catch (error: any) {
      alert(error.message || 'Login failed');
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
                <h1 className="text-6xl font-bold mb-2 tracking-wider bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-2xl" style={{ fontFamily: 'Great Vibes, cursive', textShadow: '0 0 30px rgba(255,255,255,0.5)' }}>
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

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl mb-3 shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h1>
            <p className="text-sm text-gray-600">Sign in to your AI-IDP account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
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

            {/* Password Field */}
            <div className="group">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
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

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Signing In...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </div>
              )}
            </button>
          </form>

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

export default SimpleLogin;
