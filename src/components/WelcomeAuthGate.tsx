import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, CheckCircle2, Lock, Smartphone, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';
import { 
  validateIndianMobileNumber, 
  sendMsg91Otp, 
  retryMsg91Otp, 
  verifyMsg91Otp, 
  exchangeTokenWithBackend 
} from '../utils/msg91';

interface WelcomeAuthGateProps {
  onVerified: () => void;
}

export const WelcomeAuthGate: React.FC<WelcomeAuthGateProps> = ({ onVerified }) => {
  const { verifyUserWithPhone, navigateTo } = useStore();

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [cleanPhone, setCleanPhone] = useState('');
  const [name, setName] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // 1. Send OTP via Official MSG91 Web SDK
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
      setErrorMsg(
        err?.message || 
        'Failed to dispatch SMS OTP via MSG91. Please verify network and MSG91 widget configuration.'
      );
    }
  };

  // 2. Resend OTP via MSG91 SDK
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;

    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      await retryMsg91Otp('11'); // '11' specifies SMS channel
      setIsLoading(false);
      setResendTimer(30);
      setInfoMsg('Fresh OTP code dispatched via SMS.');
    } catch (err: any) {
      setIsLoading(false);
      console.error('MSG91 retryOtp error:', err);
      setErrorMsg(err?.message || 'Failed to resend OTP code. Please wait and try again.');
    }
  };

  // 3. Handle OTP Digits Input
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

    // Auto-focus next input
    if (index < 5 && digit) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when code entered
    const code = updated.join('');
    if (code.length === 4 || code.length === 6) {
      // Check if all slots filled up to current
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

  // 4. Verify OTP with MSG91 Web SDK & Exchange Token with Backend
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || enteredOtp.join('')).trim();

    if (code.length < 4) {
      setErrorMsg('Please enter the complete OTP code received on your phone.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // A. Verify with official MSG91 Web SDK to get access token
      const sdkResult = await verifyMsg91Otp(code);
      const accessToken = sdkResult.accessToken;

      if (!accessToken) {
        throw new Error('No access token returned from MSG91 SDK.');
      }

      // B. Server-side validation with MSG91 verifyAccessToken API + session creation
      const backendResult = await exchangeTokenWithBackend(accessToken, name.trim());

      setIsLoading(false);
      setStep('success');

      // Update store context with verified profile
      verifyUserWithPhone(
        backendResult.user?.phoneNumber || cleanPhone,
        backendResult.user?.name || name.trim() || 'Flew Patron'
      );

      confetti({
        particleCount: 80,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#ff2626', '#ffffff', '#10b981'],
      });

      setTimeout(() => {
        onVerified();
      }, 1200);
    } catch (err: any) {
      setIsLoading(false);
      console.error('Verification error:', err);
      setErrorMsg(err?.message || 'Invalid or expired OTP code. Please verify and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070709] bg-paw-pattern overflow-y-auto">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff2626]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ff2626]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Verification Card */}
      <div className="relative w-full max-w-md bg-[#121216] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black my-auto backdrop-blur-xl">
        
        {/* STEP 1: Indian Phone & Name Input */}
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
                Hyderabad's cat-themed late night thickshake & dessert destination in Gowlidoddy.
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Indian Mobile Number <span className="text-[#ff2626]">*</span></span>
                  <span className="text-[10px] text-white/40 font-normal">SMS OTP by MSG91</span>
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
                    className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none font-mono tracking-wide"
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
                  placeholder="e.g. Aditya"
                  className="w-full rounded-xl bg-[#18181f] border border-white/10 focus:border-[#ff2626] px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
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

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified via official MSG91 SMS gateway.</span>
            </div>
          </form>
        )}

        {/* STEP 2: MSG91 OTP Verification Input */}
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
                Enter the verification code sent via SMS to <strong className="text-white font-mono">{formattedPhone}</strong>
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
                Paste or type the 4 or 6-digit code received on your phone.
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
                  <span>Verify with MSG91 & Unlock</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 3: Success Animation */}
        {step === 'success' && (
          <div className="py-8 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-2xl font-bold text-white font-display">
              Welcome to the Cat Universe!
            </h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-xs mx-auto">
              Mobile verified with MSG91. Entering the dessert haven now...
            </p>
          </div>
        )}

        {/* Discreet Store Manager Entry Link */}
        <div className="mt-8 pt-4 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={() => navigateTo('admin')}
            className="text-[10px] text-white/30 hover:text-white/70 transition-colors inline-flex items-center gap-1"
          >
            <Lock className="w-2.5 h-2.5" />
            <span>Store Staff Portal (PIN Required)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
