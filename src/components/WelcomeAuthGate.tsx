import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, MessageSquare, CheckCircle2, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';

interface WelcomeAuthGateProps {
  onVerified: () => void;
}

export const WelcomeAuthGate: React.FC<WelcomeAuthGateProps> = ({ onVerified }) => {
  const { verifyUserWithPhone, navigateTo } = useStore();

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [simulatedSms, setSimulatedSms] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAdminPinPrompt, setShowAdminPinPrompt] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneNumber.replace(/[^0-9]/g, '');
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Generate 4-digit OTP code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setResendTimer(30);
    setErrorMsg('');
    setStep('otp');

    // Simulate incoming mobile message notification
    setSimulatedSms(`💬 Messages • now\nFLEW OTP: ${code} is your verification code for FLEW Gowlidoddy. Valid for 5 minutes.`);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newOtp = [...enteredOtp];
    newOtp[index] = value;
    setEnteredOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits typed
    const fullCode = newOtp.join('');
    if (fullCode.length === 4) {
      validateOtpCode(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleAutofillFromSms = () => {
    if (generatedOtp) {
      const digits = generatedOtp.split('');
      setEnteredOtp(digits);
      validateOtpCode(generatedOtp);
    }
  };

  const validateOtpCode = (code: string) => {
    if (code === generatedOtp) {
      setErrorMsg('');
      setStep('success');
      verifyUserWithPhone(phoneNumber, name);

      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff2626', '#ffffff', '#10b981'],
      });

      setTimeout(() => {
        onVerified();
      }, 1200);
    } else {
      setErrorMsg('Incorrect OTP. Please check the incoming mobile message.');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === '1234' || adminPin.toLowerCase() === 'flew' || adminPin.toLowerCase() === 'flew2026') {
      navigateTo('admin');
    } else {
      setAdminPinError('Invalid Passcode. (Default PIN: 1234)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070709] bg-paw-pattern overflow-y-auto">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff2626]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff2626]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Verification Card */}
      <div className="relative w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black my-auto">
        
        {/* Simulated Incoming Mobile Normal Message Banner */}
        {simulatedSms && (
          <div className="mb-5 p-3.5 rounded-2xl bg-[#1c1414] border-2 border-[#ff2626]/50 shadow-xl text-xs text-white animate-bounce-slow">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#ff2626]/20 border border-[#ff2626]/40 flex items-center justify-center text-[#ff4444] flex-shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] text-white/50 mb-0.5">
                  <span className="font-semibold text-white">MESSAGES</span>
                  <span>now</span>
                </div>
                <p className="text-white font-medium text-xs whitespace-pre-line leading-relaxed">
                  {simulatedSms}
                </p>
                <button
                  type="button"
                  onClick={handleAutofillFromSms}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold text-[11px] shadow-sm transition-all"
                >
                  <span>Autofill code ({generatedOtp})</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Phone & Name Input */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            {/* Mascot Visual Header */}
            <div className="text-center">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <img
                  src="/assets/flew-logo.png"
                  alt="FLEW Logo"
                  className="w-full h-full object-cover rounded-full border-2 border-[#ff2626] shadow-lg shadow-[#ff2626]/40"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo.svg';
                  }}
                />
                <span className="absolute -bottom-1 -right-1 text-lg">🐾</span>
              </div>

              <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#ff2626]/20 text-[#ff4444] text-[10px] font-bold border border-[#ff2626]/30 mb-2">
                NORMAL IS BORING... FLEW IS FREEDOM!
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                Welcome to <span className="text-[#ff3333]">FLEW</span>
              </h2>
              <p className="text-xs text-white/65 mt-1.5 leading-relaxed max-w-xs mx-auto">
                Enter your mobile number to explore our late-night dessert menu, order thickshakes, and track your cravings in Gowlidoddy.
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                  Mobile Number <span className="text-[#ff2626]">*</span>
                </label>
                <div className="flex items-center rounded-xl bg-[#18181f] border border-white/10 focus-within:border-[#ff2626] overflow-hidden transition-colors">
                  <span className="px-3.5 text-sm font-bold text-white/60 border-r border-white/10 bg-white/[0.02]">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="98765 43210"
                    required
                    autoFocus
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditya"
                  className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-[#ff4444] text-center font-medium">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              <span>Verify via SMS Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-white/40 text-center">
              We send a 4-digit code to verify your late-night orders. No spam, ever.
            </p>
          </form>
        )}

        {/* STEP 2: OTP Verification Input */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display">
                Enter Mobile OTP
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Enter the 4-digit code sent via SMS to <strong className="text-white font-mono">+91 {phoneNumber}</strong>
              </p>
            </div>

            {/* 4 Digit Boxes */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={enteredOtp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  autoFocus={index === 0}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold font-mono bg-[#18181f] border-2 border-white/15 focus:border-[#ff2626] rounded-2xl text-white focus:outline-none transition-colors shadow-inner"
                />
              ))}
            </div>

            {errorMsg && (
              <p className="text-xs text-[#ff4444] text-center font-medium">
                {errorMsg}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-white/60 pt-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="hover:text-white underline"
              >
                Change Number
              </button>

              {resendTimer > 0 ? (
                <span className="text-white/40 font-mono">
                  Resend SMS in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleSendOtp(e as any)}
                  className="text-[#ff4444] font-bold flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend SMS</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => validateOtpCode(enteredOtp.join(''))}
              className="w-full py-3.5 bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              <span>Verify & Unlock FLEW</span>
            </button>
          </div>
        )}

        {/* STEP 3: Success Animation */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold text-white font-display">
              Welcome to the Cat Universe!
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-xs mx-auto">
              Mobile verified! Entering the dessert haven now...
            </p>
          </div>
        )}

        {/* Discreet Store Manager Entry Link */}
        <div className="mt-8 pt-4 border-t border-white/5 text-center">
          {!showAdminPinPrompt ? (
            <button
              type="button"
              onClick={() => setShowAdminPinPrompt(true)}
              className="text-[10px] text-white/30 hover:text-white/70 transition-colors inline-flex items-center gap-1"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Store Manager Portal Access</span>
            </button>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-2 max-w-xs mx-auto animate-fadeIn">
              <div className="text-[11px] text-white/60 font-semibold flex items-center justify-between">
                <span>Enter Admin PIN:</span>
                <button
                  type="button"
                  onClick={() => setShowAdminPinPrompt(false)}
                  className="text-white/40 hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="PIN: 1234"
                  autoFocus
                  className="flex-1 rounded-lg bg-[#18181f] border border-white/10 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#ff2626]"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#ff2626] text-white text-xs font-bold rounded-lg"
                >
                  Go
                </button>
              </div>
              {adminPinError && (
                <p className="text-[10px] text-[#ff4444] text-left">{adminPinError}</p>
              )}
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
