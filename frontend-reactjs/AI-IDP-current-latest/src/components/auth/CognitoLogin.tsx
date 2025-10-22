import React, { useState, useEffect } from 'react';
import { Shield, Mail, Lock, LogIn, Users, Eye, EyeOff, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cognitoAuthService, CognitoUser } from '../../services/cognitoAuth';
import toast from 'react-hot-toast';

interface CognitoLoginProps {
  onLogin: (user: CognitoUser) => void;
}

type AuthMode = 'signin' | 'signup' | 'confirm';

const CognitoLogin: React.FC<CognitoLoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmationCode: '',
    role: 'Uploader' as 'Adjuster' | 'Uploader'
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const user = await cognitoAuthService.signIn(formData.email, formData.password);
        toast.success(`Welcome ${user.role}!`);
        onLogin(user);
      } else if (mode === 'signup') {
        await cognitoAuthService.signUp(formData.email, formData.password, formData.role);
        toast.success('Account created! Check your email.');
        setMode('confirm');
      } else if (mode === 'confirm') {
        await cognitoAuthService.confirmSignUp(formData.email, formData.confirmationCode);
        toast.success('Account confirmed!');
        setMode('signin');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'Adjuster' | 'Uploader') => {
    setLoading(true);
    try {
      const user = await cognitoAuthService.demoSignIn(role);
      toast.success(`Welcome ${role}!`);
      onLogin(user);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-lg shadow-lg border"
      >
        {/* Header */}
        <div className="bg-blue-600 p-6 text-center rounded-t-lg">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">HCLTech AI IDP</h1>
          <p className="text-blue-100 text-sm">Document Processing System</p>
        </div>

        <div className="p-6">
          {/* Mode Tabs */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'signin', label: 'Sign In' },
              { key: 'signup', label: 'Sign Up' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMode(key as AuthMode)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  mode === key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Quick Access */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Access:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDemoLogin('Adjuster')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Adjuster
              </button>
              <button
                onClick={() => handleDemoLogin('Uploader')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Users className="w-4 h-4" />
                Uploader
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or use form</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode !== 'confirm' && (
              <>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Role Selection (Sign Up only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'Uploader', label: 'Uploader', icon: Users },
                        { key: 'Adjuster', label: 'Adjuster', icon: UserCheck }
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, role: key as any }))}
                          className={`p-3 rounded-lg border text-sm flex items-center justify-center gap-2 transition-colors ${
                            formData.role === key
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Confirmation Code */}
            {mode === 'confirm' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirmation Code</label>
                <input
                  type="text"
                  value={formData.confirmationCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmationCode: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter confirmation code"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>
                    {mode === 'signin' ? 'Sign In' : 
                     mode === 'signup' ? 'Create Account' : 'Confirm Account'}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Mode Switch */}
          {mode === 'confirm' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setMode('signin')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CognitoLogin;
