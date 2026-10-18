import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, RefreshCw, CheckCircle2, Smartphone, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';
import { 
  validateIndianMobileNumber, 
  sendMsg91Otp, 
  retryMsg91Otp, 
  verifyMsg91Otp, 
  exchangeTokenWithBackend 
} from '../utils/msg91';

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
  subtitle = 'Verify your phone via official MSG91 OTP to place orders and track delivery.',
}) => {
  const { verifyUserWithPhone } = useStore();

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cleanPhone, setCleanPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setEnteredOtp(['', '', '', '', '', '']);
      setErrorMsg('');
      setInfoMsg('');
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const validation = validateIndianMobileNumber(phoneNumber);
    if (!validation.valid || !validation.cleanPhone) {
      setErrorMsg(validation.error || 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsLoading(true);
    setCleanPhone(validation.cleanPhone);
    setFormattedPhone(validation.formatted || `+91 ${validation.cleanPhone}`);

    try {
      await sendMsg91Otp(validation.cleanPhone);
      setIsLoading(false);
      setStep('otp');
      setResendTimer(30);
      setInfoMsg(`SMS verification code sent via MSG91 to ${validation.formatted}`);
    } catch (err: any) {
      setIsLoading(false);
      console.error('MSG91 sendOtp error:', err);
      setErrorMsg(err?.message || 'Failed to dispatch SMS OTP. Please check widget configuration.');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;

    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      await retryMsg91Otp('11');
      setIsLoading(false);
      setResendTimer(30);
      setInfoMsg('Fresh OTP code dispatched via SMS.');
    } catch (err: any) {
      setIsLoading(false);
      console.error('MSG91 retryOtp error:', err);
      setErrorMsg(err?.message || 'Failed to resend OTP code.');
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

    if (index < 5 && digit) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const code = updated.join('');
    if (code.length === 4 || code.length === 6) {
      const filledCount = updated.filter(Boolean).length;
      if (filledCount === 4 || filledCount === 6) {
        handleVerifyOtp(code);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setEnteredOtp(updated);

    if (pasted.length === 4 || pasted.length === 6) {
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || enteredOtp.join('')).trim();

    if (code.length < 4) {
      setErrorMsg('Please enter the complete OTP code received on your phone.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const sdkResult = await verifyMsg91Otp(code);
      const accessToken = sdkResult.accessToken;

      if (!accessToken) {
        throw new Error('No access token returned from MSG91.');
      }

      // Backend token verification & session creation
      const backendResult = await exchangeTokenWithBackend(accessToken, name.trim(), address.trim());

      setIsLoading(false);
      setStep('success');

      verifyUserWithPhone(
        backendResult.user?.phoneNumber || cleanPhone,
        backendResult.user?.name || name.trim() || 'Flew Patron',
        address.trim()
      );

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff2626', '#10b981', '#ffffff'],
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsLoading(false);
      console.error('Verification error:', err);
      setErrorMsg(err?.message || 'Invalid or expired OTP code.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black overflow-hidden backdrop-blur-xl"
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

        {/* STEP 1: Phone & Details */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
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

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Indian Mobile Number <span className="text-[#ff2626]">*</span></span>
                  <span className="text-[10px] text-white/40">MSG91 OTP</span>
                </label>
                <div className="flex items-center rounded-xl bg-[#18181f] border border-white/10 focus-within:border-[#ff2626] overflow-hidden transition-colors">
                  <span className="px-3.5 text-sm font-bold text-white/60 border-r border-white/10 bg-white/[0.02]">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneNumber}
                    disabled={isLoading}
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
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  disabled={isLoading}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                  Delivery Landmark / Address
                </label>
                <input
                  type="text"
                  value={address}
                  disabled={isLoading}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Flat 301, Sai Tulasi Enclave, Gowlidoddy"
                  className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-[#ff2626] to-[#dc2626] hover:opacity-95 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send OTP via SMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                <Smartphone className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-extrabold text-white font-display">
                Enter Mobile OTP
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Enter code sent via SMS to <strong className="text-white font-mono">{formattedPhone}</strong>
              </p>
            </div>

            {infoMsg && (
              <p className="text-xs text-emerald-400 text-center font-medium bg-emerald-950/40 py-2 px-3 rounded-xl border border-emerald-500/30">
                {infoMsg}
              </p>
            )}

            {/* 6 Digit Input Slots */}
            <div>
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
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
                    className="w-full h-13 sm:h-14 text-center text-xl sm:text-2xl font-bold font-mono bg-[#18181f] border-2 border-white/15 focus:border-[#ff2626] rounded-2xl text-white focus:outline-none transition-colors shadow-inner"
                  />
                ))}
              </div>
              <span className="text-[10px] text-white/40 block text-center mt-2">
                Type or paste the 4 or 6-digit code.
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-white/60 pt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => { setStep('phone'); setErrorMsg(''); setInfoMsg(''); }}
                className="hover:text-white underline"
              >
                Change Number
              </button>

              {resendTimer > 0 ? (
                <span className="text-white/40 font-mono text-[11px]">
                  Resend SMS in {resendTimer}s
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleResendOtp}
                  className="text-[#ff4444] font-bold flex items-center gap-1 hover:underline text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend SMS Code</span>
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={isLoading || enteredOtp.filter(Boolean).length < 4}
              onClick={() => handleVerifyOtp()}
              className="w-full py-3.5 bg-gradient-to-r from-[#ff2626] to-[#dc2626] hover:opacity-95 disabled:opacity-40 text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify with MSG91</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold text-white font-display">
              Verification Complete!
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-xs mx-auto">
              Mobile verified with MSG91. You're ready to place orders and track your cravings!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
