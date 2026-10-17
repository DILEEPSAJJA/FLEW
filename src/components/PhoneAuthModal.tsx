import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldCheck, ArrowRight, RefreshCw, MessageSquare, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Register with Mobile Number',
  subtitle = 'Verify your phone to place orders and receive live kitchen updates.',
}) => {
  const { verifyUserWithPhone } = useStore();

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [simulatedSms, setSimulatedSms] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setEnteredOtp(['', '', '', '']);
      setErrorMsg('');
      setSimulatedSms(null);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = phoneNumber.replace(/[^0-9]/g, '');
    if (clean.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    // Generate random 4-digit OTP
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setResendTimer(30);
    setErrorMsg('');
    setStep('otp');

    // Simulate SMS toast
    setSimulatedSms(`💬 FLEW SMS: Your verification code is ${code}. Valid for 5 mins.`);
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

    // If all 4 digits typed, auto-verify!
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

  const handleAutofillOtp = () => {
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
      verifyUserWithPhone(phoneNumber, name, address);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ff2626', '#10b981', '#ffffff'],
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } else {
      setErrorMsg('Incorrect OTP. Please check the simulated SMS banner above.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
          aria-label="Close authentication modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Simulated Incoming SMS Toast Notification Banner */}
        {simulatedSms && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 to-[#1e1313] border border-[#ff2626]/50 shadow-lg text-xs text-white animate-bounce-slow flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-[#ff4444] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block text-[#ff6666]">{simulatedSms}</span>
              <button
                type="button"
                onClick={handleAutofillOtp}
                className="mt-1 text-[11px] underline text-white font-bold hover:text-emerald-400"
              >
                Tap here to autofill OTP ({generatedOtp})
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Phone & Details */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div className="text-center">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#ff2626]/20 border border-[#ff2626]/40 flex items-center justify-center mx-auto mb-3 text-2xl">
                📱
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                {subtitle}
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                  Mobile Number <span className="text-[#ff2626]">*</span>
                </label>
                <div className="flex items-center rounded-xl bg-[#18181f] border border-white/10 focus-within:border-[#ff2626] overflow-hidden">
                  <span className="px-3.5 text-sm font-semibold text-white/50 border-r border-white/10 bg-white/[0.02]">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="98765 43210"
                    required
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none font-mono"
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
                  className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                  Delivery Landmark / Flat (Optional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Sai Tulasi Enclave, Gowlidoddy"
                  className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
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
              <span>Send OTP Verification Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[11px] text-white/40 text-center">
              We send an instant 4-digit code to verify your late-night orders.
            </p>
          </form>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-13 h-13 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display">
                Verify Mobile OTP
              </h3>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                Enter the 4-digit code sent to <strong className="text-white font-mono">+91 {phoneNumber}</strong>
              </p>
            </div>

            {/* 4-digit inputs */}
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
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold font-mono bg-[#18181f] border-2 border-white/15 focus:border-[#ff2626] rounded-2xl text-white focus:outline-none transition-colors"
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
                  Resend OTP in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleSendOtp(e as any)}
                  className="text-[#ff4444] font-bold flex items-center gap-1 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend OTP</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => validateOtpCode(enteredOtp.join(''))}
              className="w-full py-3.5 bg-[#ff2626] hover:bg-[#ff3b3b] text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              <span>Verify & Complete</span>
            </button>
          </div>
        )}

        {/* STEP 3: Verification Success */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold text-white font-display">
              Mobile Verified!
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-xs mx-auto">
              Your phone <strong className="text-white font-mono">+91 {phoneNumber}</strong> is verified. Loading your dessert tray...
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
