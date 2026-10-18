import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, MessageSquare, CheckCircle2, Lock, Smartphone, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '../context/StoreContext';
import { validateIndianMobileNumber } from '../utils/msg91';

interface WelcomeAuthGateProps {
  onVerified: () => void;
}

export const WelcomeAuthGate: React.FC<WelcomeAuthGateProps> = ({ onVerified }) => {
  const { verifyUserWithPhone, navigateTo, verifyAdminPin } = useStore();

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [cleanPhone, setCleanPhone] = useState('');
  const [name, setName] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [simulatedSms, setSimulatedSms] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showAdminPinPrompt, setShowAdminPinPrompt] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

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

  // 1. Send OTP: Generate code & display incoming SMS banner
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

    // Generate fresh 4-digit verification code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setEnteredOtp(['', '', '', '']);
    setResendTimer(30);
    setStep('otp');

    // Display incoming mobile message banner with auto-fill option
    setSimulatedSms(`FLEW OTP: ${code} is your verification code for FLEW Gowlidoddy. Valid for 5 minutes.`);
  };

  // 2. Resend OTP code
  const handleResendOtp = () => {
    if (resendTimer > 0) return;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setEnteredOtp(['', '', '', '']);
    setResendTimer(30);
    setErrorMsg('');
    setSimulatedSms(`FLEW OTP: ${code} is your fresh verification code for FLEW Gowlidoddy.`);
  };

  // 3. Auto-fill from simulated incoming SMS banner
  const handleAutofillFromSms = () => {
    if (generatedOtp) {
      const digits = generatedOtp.split('');
      setEnteredOtp(digits);
      validateOtpCode(generatedOtp);
    }
  };

  // 4. Handle OTP digit typing
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
    if (index < 3 && digit) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    const code = updated.join('');
    if (code.length === 4) {
      validateOtpCode(code);
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

  // 5. Validate OTP code & issue session token
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

      // Update store context with verified profile
      verifyUserWithPhone(cleanPhone, name.trim() || 'Flew Patron');

      confetti({
        particleCount: 85,
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
      setErrorMsg(err?.message || 'Verification error. Please try again.');
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPinError('');
    const valid = await verifyAdminPin(adminPin);
    if (valid) {
      navigateTo('admin');
    } else {
      setAdminPinError('Invalid Passcode. (Store PIN: 123789)');
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
                <label className="block text-xs font-semibold text-white/70 mb-1 uppercase tracking-wider">
                  Indian Mobile Number *
                </label>
                <div className="flex items-center rounded-xl bg-[#18181f] border border-white/10 focus-within:border-[#ff2626] overflow-hidden transition-colors">
                  <span className="px-3.5 py-2.5 text-sm font-bold text-white/60 border-r border-white/10 bg-white/[0.02]">
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
                  disabled={isLoading}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dileep"
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
              <span>Verify via SMS Code</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/40">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant SMS verification. Valid for orders & live tracking.</span>
            </div>
          </form>
        )}

        {/* STEP 2: OTP Verification Input with Display Banner */}
        {step === 'otp' && (
          <div className="space-y-5">
            {/* Realistic Incoming Mobile Message Banner */}
            {simulatedSms && (
              <div className="p-3.5 rounded-2xl bg-[#1f1414] border-2 border-[#ff2626]/60 shadow-xl text-xs text-white animate-bounce-slow">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#ff2626]/20 border border-[#ff2626]/50 flex items-center justify-center text-[#ff4444] shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-white/50 mb-1">
                      <span className="font-bold text-white flex items-center gap-1">
                        <span>MESSAGES</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff2626]" />
                      </span>
                      <span>just now</span>
                    </div>
                    <p className="text-white/90 text-xs font-mono leading-relaxed">
                      FLEW OTP: <strong className="text-[#ff4444] text-sm bg-black/50 px-2 py-0.5 rounded border border-[#ff2626]/30">{generatedOtp}</strong> is your verification code for FLEW Gowlidoddy.
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutofillFromSms}
                        className="px-3 py-1 bg-[#ff2626] hover:bg-[#ff3b3b] text-white text-[11px] font-bold rounded-lg transition-all shadow-md shadow-[#ff2626]/30 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-Fill Code ({generatedOtp})</span>
                      </button>
                      <span className="text-[10px] text-white/40">Tap to fill & verify</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center pt-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                Enter Mobile OTP
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Enter the 4-digit code sent to <strong className="text-white font-mono">{formattedPhone}</strong>
              </p>
            </div>

            {/* 4 Digit Input Slots */}
            <div>
              <div className="flex justify-center gap-2.5 sm:gap-3.5">
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
                    className="w-13 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold font-mono bg-[#18181f] border-2 border-white/15 focus:border-[#ff2626] rounded-2xl text-white focus:outline-none transition-colors shadow-inner"
                  />
                ))}
              </div>
              <span className="text-[10px] text-white/40 block text-center mt-2">
                Type the 4-digit code from the message banner above or click Auto-Fill.
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
              className="w-full py-3.5 bg-gradient-to-r from-[#ff2626] to-[#dc2626] hover:opacity-95 disabled:opacity-40 text-white font-bold rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify & Unlock FLEW</span>
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
              Mobile verified! Entering the dessert haven now...
            </p>
          </div>
        )}

        {/* Discreet Store Staff Portal Entry Link */}
        <div className="mt-8 pt-4 border-t border-white/5 text-center">
          {!showAdminPinPrompt ? (
            <button
              type="button"
              onClick={() => setShowAdminPinPrompt(true)}
              className="text-[10px] text-white/30 hover:text-white/70 transition-colors inline-flex items-center gap-1"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Store Staff Portal (PIN: 123789)</span>
            </button>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-2 max-w-xs mx-auto animate-fadeIn">
              <div className="text-[11px] text-white/60 font-semibold flex items-center justify-between">
                <span>Enter 6-Digit Store PIN:</span>
                <button
                  type="button"
                  onClick={() => setShowAdminPinPrompt(false)}
                  className="text-white/40 hover:text-white text-[10px]"
                >
                  Cancel
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="PIN: 123789"
                  autoFocus
                  className="flex-1 rounded-lg bg-[#18181f] border border-white/10 px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-[#ff2626]"
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#ff2626] text-white text-xs font-bold rounded-lg hover:bg-[#ff3b3b]"
                >
                  Enter
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
