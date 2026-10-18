import React, { useState, useRef, useEffect } from 'react';
import { Lock, ArrowRight, ArrowLeft, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface AdminPinLockProps {
  onUnlock: () => void;
}

export const AdminPinLock: React.FC<AdminPinLockProps> = ({ onUnlock }) => {
  const { navigateTo, verifyAdminPin } = useStore();

  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDigits, setShowDigits] = useState(false);
  const [shake, setShake] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (lockoutTimer === 0 && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [lockoutTimer]);

  // Lockout countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleDigitChange = (index: number, value: string) => {
    if (lockoutTimer > 0) return;

    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const updated = [...pinDigits];
      updated[index] = '';
      setPinDigits(updated);
      return;
    }

    const digit = cleaned.slice(-1);
    const updated = [...pinDigits];
    updated[index] = digit;
    setPinDigits(updated);
    setErrorMsg('');

    // Auto-advance
    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    if (index === 5 && digit) {
      const fullPin = updated.join('');
      if (fullPin.length === 6) {
        submitPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const updated = [...pinDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setPinDigits(updated);

    if (pasted.length === 6) {
      submitPin(pasted);
    } else {
      inputRefs.current[Math.min(5, pasted.length)]?.focus();
    }
  };

  const submitPin = async (pinString: string) => {
    if (isSubmitting || lockoutTimer > 0) return;

    if (pinString.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the staff PIN.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await verifyAdminPin(pinString);

      if (result.success) {
        onUnlock();
      } else {
        const nextFailed = failedAttempts + 1;
        setFailedAttempts(nextFailed);

        setShake(true);
        setTimeout(() => setShake(false), 500);

        if (nextFailed >= 5) {
          setLockoutTimer(120); // 2 minutes lockout
          setErrorMsg('Security lockout: Too many incorrect attempts. Locked for 120 seconds.');
        } else {
          setErrorMsg(result.message || `Incorrect 6-digit staff PIN. (Attempt ${nextFailed}/5)`);
        }

        setPinDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Verification error occurred. Please check network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (lockoutTimer > 0) return;

    if (val === 'CLEAR') {
      setPinDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      return;
    }

    if (val === 'BACK') {
      const lastFilled = pinDigits.map((d, i) => (d ? i : -1)).filter((i) => i >= 0).pop();
      if (lastFilled !== undefined) {
        const updated = [...pinDigits];
        updated[lastFilled] = '';
        setPinDigits(updated);
        inputRefs.current[lastFilled]?.focus();
      }
      return;
    }

    // Number entered
    const firstEmpty = pinDigits.findIndex((d) => !d);
    if (firstEmpty !== -1) {
      const updated = [...pinDigits];
      updated[firstEmpty] = val;
      setPinDigits(updated);

      if (firstEmpty < 5) {
        inputRefs.current[firstEmpty + 1]?.focus();
      } else {
        const fullPin = updated.join('');
        if (fullPin.length === 6) {
          submitPin(fullPin);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff2626]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#121216] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black relative z-10 backdrop-blur-xl">
        {/* Top Return to Store Link */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateTo('customer')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Storefront</span>
          </button>

          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/50">
            FLEW Core v2.0
          </span>
        </div>

        {/* Security Emblem */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff2626]/20 to-[#991b1b]/10 border border-[#ff2626]/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#ff2626]/20 relative">
            <Lock className="w-8 h-8 text-[#ff4444]" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#ff2626] border-2 border-[#121216] flex items-center justify-center text-[10px]">
              🐾
            </div>
          </div>

          <h2 className="text-2xl font-black text-white font-display tracking-tight">
            Store Staff Portal
          </h2>
          <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
            Restricted access for FLEW managers & kitchen dispatch in Gowlidoddy.
          </p>
        </div>

        {/* PIN Inputs */}
        <form onSubmit={(e) => { e.preventDefault(); submitPin(pinDigits.join('')); }} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#ff4444]" />
                <span>Enter 6-Digit PIN</span>
              </label>

              <button
                type="button"
                onClick={() => setShowDigits(!showDigits)}
                className="text-[11px] text-white/40 hover:text-white flex items-center gap-1 transition-colors"
              >
                {showDigits ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showDigits ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            {/* 6 Digit Input Slots */}
            <div className={`grid grid-cols-6 gap-2 sm:gap-3 ${shake ? 'animate-shake' : ''}`}>
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type={showDigits ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  disabled={lockoutTimer > 0 || isSubmitting}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className={`w-full h-13 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black rounded-2xl border transition-all focus:outline-none ${
                    digit
                      ? 'bg-[#181822] border-[#ff2626] text-white shadow-md shadow-[#ff2626]/20'
                      : 'bg-[#16161c] border-white/10 text-white placeholder-white/20 focus:border-white/40'
                  } ${lockoutTimer > 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Error / Lockout Feedback */}
          {lockoutTimer > 0 ? (
            <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Too many failed attempts. Try again in <strong>{lockoutTimer}s</strong>.</span>
            </div>
          ) : errorMsg ? (
            <p className="text-xs text-[#ff4444] text-center font-medium bg-[#ff2626]/10 py-2 px-3 rounded-xl border border-[#ff2626]/20 animate-fadeIn">
              {errorMsg}
            </p>
          ) : (
            <p className="text-[11px] text-white/40 text-center">
              Authorized store staff & management access only.
            </p>
          )}

          {/* Unlock Button */}
          <button
            type="submit"
            disabled={pinDigits.join('').length !== 6 || lockoutTimer > 0 || isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#ff2626] to-[#dc2626] hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg shadow-[#ff2626]/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Unlock Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* On-screen Keypad for Rapid Mobile Entry */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map((val) => (
              <button
                key={val}
                type="button"
                disabled={lockoutTimer > 0 || isSubmitting}
                onClick={() => handleKeypadPress(val)}
                className={`h-11 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  val === 'CLEAR'
                    ? 'bg-white/5 hover:bg-white/10 text-white/50 text-xs font-semibold'
                    : val === 'BACK'
                    ? 'bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold'
                    : 'bg-[#18181f] hover:bg-white/10 text-white font-mono text-base border border-white/5'
                }`}
              >
                {val === 'BACK' ? '⌫' : val}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
