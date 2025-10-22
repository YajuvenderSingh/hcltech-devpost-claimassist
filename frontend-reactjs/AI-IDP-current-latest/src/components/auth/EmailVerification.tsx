import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowLeft, RefreshCw, AlertCircle, CheckCircle, Clock, Shield } from 'lucide-react';
import { authService } from '../../services/authService';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerified,
  onBack
}) => {
  const [codes, setCodes] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTestMode, setShowTestMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields filled
    if (newCodes.every(code => code !== '') && value) {
      handleVerify(newCodes.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCodes = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCodes(newCodes);
    
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (code?: string) => {
    const verificationCode = code || codes.join('');
    
    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await authService.confirmSignUp(email, verificationCode);
      setSuccess('✅ Email verified successfully!');
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.message || 'Verification failed';
      
      if (errorMessage.includes('expired') || errorMessage.includes('ExpiredCodeException')) {
        setError('Code expired. Sending new code...');
        handleResendCode();
      } else if (errorMessage.includes('CodeMismatchException') || errorMessage.includes('Invalid')) {
        setError('Invalid code. Please check and try again.');
        setCodes(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError('');
    setSuccess('');
    setCodes(['', '', '', '', '', '']);
    setTimeLeft(300);
    setCanResend(false);

    try {
      await authService.resendVerificationCode(email);
      setSuccess('📧 New code sent! Check your email.');
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      setError(error.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleTestVerify = () => {
    setSuccess('🧪 Test mode: Email verified!');
    setTimeout(() => {
      onVerified();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Mail className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Verify Your Email</h2>
          <p className="text-gray-600 leading-relaxed">
            Enter the 6-digit code sent to<br />
            <span className="font-semibold text-blue-600">{email}</span>
          </p>
        </div>

        {/* Code Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-3 mb-4">
            {codes.map((code, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={code}
                onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                disabled={isVerifying}
              />
            ))}
          </div>
          
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Code expires in {formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={() => handleVerify()}
          disabled={isVerifying || codes.some(code => code === '')}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
        >
          {isVerifying ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Verifying...
            </>
          ) : (
            <>
              <Shield className="h-5 w-5" />
              Verify Email
            </>
          )}
        </button>

        {/* Help Section */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="text-center space-y-3">
            <p className="text-blue-800 font-medium text-sm">Need help?</p>
            
            <button
              onClick={handleResendCode}
              disabled={isResending || !canResend}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Sending...' : canResend ? 'Send New Code' : `Resend in ${formatTime(timeLeft)}`}
            </button>

            <div className="text-xs text-blue-600 space-y-1">
              <p>• Check spam/junk folder</p>
              <p>• Code expires in 5 minutes</p>
              <p>• Use the latest code received</p>
            </div>
          </div>
        </div>

        {/* Developer Mode */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowTestMode(!showTestMode)}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            {showTestMode ? 'Hide' : 'Show'} Developer Mode
          </button>
        </div>

        {showTestMode && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
            <button
              onClick={handleTestVerify}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              🧪 Skip Verification (Dev Mode)
            </button>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
