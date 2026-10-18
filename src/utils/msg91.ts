/**
 * Official MSG91 Web SDK Integration Utility
 *
 * Integrates https://verify.msg91.com/otp-provider.js
 * Exposes methods to send OTP, retry OTP, verify OTP, and exchange the verified
 * MSG91 JWT access token with the FLEW secure backend.
 */

// Augment window object for MSG91 global methods
declare global {
  interface Window {
    initSendOTP?: (config: Msg91Config) => void;
    sendOtp?: (
      identifier: string,
      success?: (data: any) => void,
      failure?: (error: any) => void
    ) => void;
    retryOtp?: (
      channel?: string | null,
      success?: (data: any) => void,
      failure?: (error: any) => void,
      reqId?: string
    ) => void;
    verifyOtp?: (
      payload: any,
      success?: (data: any) => void,
      failure?: (error: any) => void
    ) => void;
  }
}

export interface Msg91Config {
  widgetId: string;
  tokenAuth?: string;
  identifier?: string;
  exposeMethods?: boolean;
  success?: (data: any) => void;
  failure?: (error: any) => void;
}

const MSG91_SCRIPT_URL = 'https://verify.msg91.com/otp-provider.js';

let isScriptLoading = false;
let isScriptLoaded = false;
let isInitialized = false;

/**
 * Dynamically loads the official MSG91 OTP Widget Provider script
 */
export function loadMsg91Script(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window not available'));
    }

    if (window.initSendOTP || isScriptLoaded) {
      isScriptLoaded = true;
      return resolve();
    }

    const existingScript = document.querySelector(`script[src="${MSG91_SCRIPT_URL}"]`);
    if (existingScript) {
      if ((window as any).initSendOTP) {
        isScriptLoaded = true;
        return resolve();
      }
      existingScript.addEventListener('load', () => {
        isScriptLoaded = true;
        resolve();
      });
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    if (isScriptLoading) {
      const checkInterval = setInterval(() => {
        if (window.initSendOTP) {
          clearInterval(checkInterval);
          isScriptLoaded = true;
          resolve();
        }
      }, 50);
      return;
    }

    isScriptLoading = true;
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = MSG91_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      isScriptLoading = false;
      isScriptLoaded = true;
      resolve();
    };

    script.onerror = (err) => {
      isScriptLoading = false;
      reject(new Error(`Failed to load MSG91 SDK script from ${MSG91_SCRIPT_URL}: ${err}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * Initializes the MSG91 OTP widget with custom exposed methods
 */
export async function initializeMsg91Widget(onGlobalSuccess?: (data: any) => void, onGlobalFailure?: (err: any) => void): Promise<void> {
  await loadMsg91Script();

  if (!window.initSendOTP) {
    throw new Error('MSG91 initSendOTP is not defined on window.');
  }

  // Fetch client credentials from env or /api/config
  const widgetId = import.meta.env.VITE_MSG91_WIDGET_ID || '336662446c64373435303732';
  const tokenAuth = import.meta.env.VITE_MSG91_TOKEN_AUTH || '';

  const config: Msg91Config = {
    widgetId,
    tokenAuth,
    exposeMethods: true,
    success: (data) => {
      if (onGlobalSuccess) onGlobalSuccess(data);
    },
    failure: (error) => {
      console.error('MSG91 SDK Global Failure:', error);
      if (onGlobalFailure) onGlobalFailure(error);
    },
  };

  try {
    window.initSendOTP(config);
    isInitialized = true;
  } catch (err) {
    console.error('Error during window.initSendOTP call:', err);
    throw err;
  }
}

/**
 * Validate Indian mobile numbers (10 digits starting with 6, 7, 8, or 9)
 */
export function validateIndianMobileNumber(input: string): { valid: boolean; cleanPhone?: string; formatted?: string; error?: string } {
  if (!input) {
    return { valid: false, error: 'Please enter your 10-digit mobile number.' };
  }

  const digits = input.replace(/[^0-9]/g, '');

  let cleanPhone = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    cleanPhone = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    cleanPhone = digits.slice(1);
  }

  if (cleanPhone.length !== 10) {
    return { valid: false, error: 'Mobile number must be exactly 10 digits.' };
  }

  if (!/^[6-9]/.test(cleanPhone)) {
    return { valid: false, error: 'Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.' };
  }

  const formatted = `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
  return { valid: true, cleanPhone, formatted };
}

/**
 * Triggers sending SMS OTP via official MSG91 Web SDK
 */
export async function sendMsg91Otp(phone10Digits: string): Promise<any> {
  if (!isInitialized) {
    await initializeMsg91Widget();
  }

  if (!window.sendOtp) {
    throw new Error('MSG91 SDK window.sendOtp is not available. Ensure exposeMethods is true.');
  }

  // MSG91 identifier format for Indian mobile: 91XXXXXXXXXX (no plus)
  const identifier = `91${phone10Digits}`;

  return new Promise((resolve, reject) => {
    try {
      window.sendOtp!(
        identifier,
        (response) => {
          resolve(response);
        },
        (error) => {
          const errMsg = typeof error === 'string' ? error : error?.message || 'MSG91 failed to send OTP';
          reject(new Error(errMsg));
        }
      );
    } catch (err: any) {
      reject(new Error(err?.message || 'Error executing window.sendOtp'));
    }
  });
}

/**
 * Triggers resending OTP via official MSG91 Web SDK
 */
export async function retryMsg91Otp(channel: '11' | 'SMS' | null = '11', reqId?: string): Promise<any> {
  if (!window.retryOtp) {
    throw new Error('MSG91 SDK window.retryOtp is not available.');
  }

  return new Promise((resolve, reject) => {
    try {
      window.retryOtp!(
        channel,
        (response) => resolve(response),
        (error) => {
          const errMsg = typeof error === 'string' ? error : error?.message || 'MSG91 failed to retry OTP';
          reject(new Error(errMsg));
        },
        reqId
      );
    } catch (err: any) {
      reject(new Error(err?.message || 'Error executing window.retryOtp'));
    }
  });
}

/**
 * Verifies OTP code with MSG91 Web SDK and extracts the JWT access token
 */
export async function verifyMsg91Otp(otpCode: string, reqId?: string): Promise<{ accessToken: string; raw: any }> {
  if (!window.verifyOtp) {
    throw new Error('MSG91 SDK window.verifyOtp is not available.');
  }

  const payload: any = reqId ? { otp: otpCode.trim(), reqId } : otpCode.trim();

  return new Promise((resolve, reject) => {
    try {
      window.verifyOtp!(
        payload,
        (data) => {
          // Extract JWT Access Token from MSG91 response
          let token: string | undefined;

          if (typeof data === 'string') {
            token = data;
          } else if (data && typeof data === 'object') {
            token = data['access-token'] || data.accessToken || data.token || data.jwt || data.data?.['access-token'];
          }

          if (!token && data?.message && data.message.includes('eyJ')) {
            // Some versions return the JWT inside message
            token = data.message;
          }

          if (!token) {
            // If data is an object, check any value starting with eyJ (JWT header)
            for (const key of Object.keys(data || {})) {
              if (typeof data[key] === 'string' && data[key].startsWith('eyJ')) {
                token = data[key];
                break;
              }
            }
          }

          if (token) {
            resolve({ accessToken: token, raw: data });
          } else {
            reject(new Error('MSG91 verification succeeded but no access-token was returned in payload.'));
          }
        },
        (error) => {
          const errMsg = typeof error === 'string' ? error : error?.message || 'Invalid OTP code. Please check and try again.';
          reject(new Error(errMsg));
        }
      );
    } catch (err: any) {
      reject(new Error(err?.message || 'Error executing window.verifyOtp'));
    }
  });
}

/**
 * Server-Side Token Exchange
 * Sends the verified MSG91 JWT access token to our backend /api/auth/verify-token
 */
export async function exchangeTokenWithBackend(
  accessToken: string,
  name?: string,
  address?: string
): Promise<{ success: boolean; sessionToken: string; user: any; message?: string }> {
  const response = await fetch('/api/auth/verify-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accessToken,
      name,
      address,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || `Server authentication failed with status ${response.status}`);
  }

  // Persist session token in localStorage for authenticated order requests
  if (data.sessionToken) {
    localStorage.setItem('flew_session_token', data.sessionToken);
  }

  return data;
}

/**
 * Returns stored session token for API requests
 */
export function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('flew_session_token');
}

/**
 * Clears stored session token on logout
 */
export function clearStoredSessionToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('flew_session_token');
}
