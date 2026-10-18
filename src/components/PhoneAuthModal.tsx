import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, RefreshCw, MessageSquare, CheckCircle2, Smartphone, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';
import { validateIndianMobileNumber } from '../utils/msg91';

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
  subtitle = 'Verify your phone to place orders and track delivery live.',
}) => {
  const { verifyUserWithPhone } = useStore();

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cleanPhone, setCleanPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [simulatedSms, setSimulatedSms] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setEnteredOtp(['', '', '', '']);
      setErrorMsg('');
      setSimulatedSms(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = validateIndianMobileNumber(phoneNumber);
    if (!validation.valid || !validation.cleanPhone) {
      setErrorMsg(validation.error || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const clean = validation.cleanPhone;
    setCleanPhone(clean);
    setFormattedPhone(validation.formatted || `+91 ${clean}`);

    // Generate random 4-digit verification code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setEnteredOtp(['', '', '', '']);
    setResendTimer(30);
    setStep('otp');

    // Display incoming mobile message banner
    setSimulatedSms(`FLEW OTP: ${code} is your verification code for FLEW Gowlidoddy. Valid for 5 minutes.`);
  };

  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setEnteredOtp(['', '', '', '']);
    setResendTimer(30);
    setErrorMsg('');
    setSimulatedSms(`FLEW OTP: ${code} is your fresh verification code for FLEW Gowlidoddy.`);
  };

  const handleAutofillOtp = () => {
    if (generatedOtp) {
      const digits = generatedOtp.split('');
      setEnteredOtp(digits);
      validateOtpCode(generatedOtp);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    const updated = [...enteredOtp];

    if (!cleaned) {
      updated[index] = '';
      setEnteredOtp(updated);
      return;
    }

    const digit = cleaned.slice(-1);
    updated[index] = digit;
    setEnteredOtp(updated);
    setErrorMsg('');

    if (index < 3 && digit) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const fullCode = updated.join('');
    if (fullCode.length === 4) {
      validateOtpCode(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 4);
    if (!pasted) return;

    const updated = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setEnteredOtp(updated);

    if (pasted.length === 4) {
      validateOtpCode(pasted);
    }
  };

  const validateOtpCode = async (codeToVerify?: string) => {
    const code = (codeToVerify || enteredOtp.join('')).trim();

    if (code.length < 4) {
      setErrorMsg('Please enter the 4-digit code shown in the message banner.');
      return;
    }

    if (code !== generatedOtp) {
      setErrorMsg('Incorrect OTP. Please check the incoming mobile message banner above.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // Exchange with backend to persist customer & obtain verified session JWT
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: cleanPhone,
            name: name.trim(),
            address: address.trim(),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.sessionToken) {
            localStorage.setItem('flew_session_token', data.sessionToken);
          }
        }
      } catch (backendErr) {
        console.warn('Backend session exchange skipped or unavailable:', backendErr);
      }

      setIsLoading(false);
      setStep('success');

      verifyUserWithPhone(cleanPhone, name.trim() || 'Flew Patron', address.trim());

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ff2626', '#10b981', '#ffffff'],
      });

      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      console.error('Verification error:', err);
      setErrorMsg(err?.message || 'Verification error. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Phone + Name Input */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="text-center pr-6">
              <div className="w-12 h-12 rounded-2xl bg-[#ff2626]/20 border border-[#ff2626]/40 flex items-center justify-center mx-auto mb-2 text-[#ff4444]">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white font-display">
                {title}
              </h3>
              <p className="text-xs text-white/60 mt-1">
                {subtitle}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                  Indian Mobile Number *
                </label>
                <div className="flex items-center rounded-xl bg-[#18181f] border border-white/10 focus-within:border-[#ff2626] overflow-hidden transition-colors">
                  <span className="px-3 py-2.5 text-sm font-bold text-white/60 border-r border-white/10 bg-white/[0.02]">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phoneNumber}
                    disabled={isLoading}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="98765 43210"
                    required
                    autoFocus
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
                  disabled={isLoading}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dileep"
                  className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                  Delivery Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={address}
                  disabled={isLoading}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near DLF Cybercity, Gowlidoddy"
                  className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#ff2626] hover:bg-[#ff3b3b] disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              <span>Verify via SMS Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: OTP Entry with Display Banner */}
        {step === 'otp' && (
          <div className="space-y-4">
            {/* Simulated SMS Notification Banner */}
            {simulatedSms && (
              <div className="p-3.5 rounded-2xl bg-[#1f1414] border-2 border-[#ff2626]/60 shadow-xl text-xs text-white animate-bounce-slow">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#ff2626]/20 border border-[#ff2626]/50 flex items-center justify-center text-[#ff4444] shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-white/50 mb-0.5">
                      <span className="font-bold text-white flex items-center gap-1">
                        <span>MESSAGES</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff2626]" />
                      </span>
                      <span>now</span>
                    </div>
                    <p className="text-white/90 text-xs font-mono leading-relaxed">
                      FLEW OTP: <strong className="text-[#ff4444] text-sm bg-black/50 px-1.5 py-0.5 rounded border border-[#ff2626]/30">{generatedOtp}</strong>
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutofillOtp}
                        className="px-2.5 py-1 bg-[#ff2626] hover:bg-[#ff3b3b] text-white text-[11px] font-bold rounded-lg transition-all shadow-md shadow-[#ff2626]/30 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-Fill Code ({generatedOtp})</span>
                      </button>
                      <span className="text-[10px] text-white/40">Tap to verify</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-xl font-extrabold text-white font-display">
                Enter Mobile OTP
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Enter the 4-digit code sent to <strong className="text-white font-mono">{formattedPhone}</strong>
              </p>
            </div>

            {/* 4 Digit Boxes */}
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={(el) => { otpInputsRef.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={enteredOtp[index]}
                  disabled={isLoading}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={handleOtpPaste}
                  autoFocus={index === 0}
                  className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold font-mono bg-[#18181f] border-2 border-white/15 focus:border-[#ff2626] rounded-2xl text-white focus:outline-none transition-colors shadow-inner"
                />
              ))}
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-white/60 pt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => { setStep('phone'); setErrorMsg(''); setSimulatedSms(null); }}
                className="hover:text-white underline"
              >
                Change Number
              </button>

              {resendTimer > 0 ? (
                <span className="text-white/40 font-mono text-[11px]">
                  Resend in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleResendOtp}
                  className="text-[#ff4444] font-bold flex items-center gap-1 hover:underline text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={isLoading || enteredOtp.filter(Boolean).length < 4}
              onClick={() => validateOtpCode()}
              className="w-full py-3 bg-[#ff2626] hover:bg-[#ff3b3b] disabled:opacity-40 text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify & Unlock</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 3: Success Animation */}
        {step === 'success' && (
          <div className="py-6 text-center space-y-3 animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white font-display">
              Verified!
            </h3>
            <p className="text-xs text-white/70">
              Welcome back to FLEW! Unlocking now...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
