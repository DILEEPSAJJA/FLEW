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
    libLoaded?: boolean;
  }
}

export interface Msg91Config {
  widgetId: string;
  tokenAuth?: string;
  identifier?: string;
  exposeMethods?: boolean;
  success?: (data: any) => void;
  failure?: (error: any) => void;
  [key: string]: any;
}

const MSG91_SCRIPT_URL = 'https://verify.msg91.com/otp-provider.js';

let isScriptLoading = false;
let isScriptLoaded = false;
let initPromise: Promise<void> | null = null;
let cachedConfig: { widgetId: string; tokenAuth: string } | null = null;

/**
 * Fetch client configuration from environment or backend /api/config
 */
export async function fetchClientConfig(): Promise<{ widgetId: string; tokenAuth: string }> {
  if (cachedConfig && cachedConfig.widgetId && cachedConfig.tokenAuth) {
    return cachedConfig;
  }

  const envWidgetId = (import.meta.env.VITE_MSG91_WIDGET_ID || '').trim();
  const envTokenAuth = (import.meta.env.VITE_MSG91_TOKEN_AUTH || '').trim();

  if (envWidgetId && envTokenAuth) {
    cachedConfig = { widgetId: envWidgetId, tokenAuth: envTokenAuth };
    return cachedConfig;
  }

  // Fetch dynamic config from backend /api/config (supports Vercel backend environment variables)
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      const widgetId = envWidgetId || (data.widgetId || '').trim() || '366a72663669373338373430';
      const tokenAuth = envTokenAuth || (data.tokenAuth || '').trim() || '582635TpBR0JJA9Kq6ad46e2fP1';
      cachedConfig = { widgetId, tokenAuth };
      return cachedConfig;
    }
  } catch (err) {
    console.warn('Failed to fetch /api/config, falling back to build env:', err);
  }

  cachedConfig = {
    widgetId: envWidgetId || '366a72663669373338373430',
    tokenAuth: envTokenAuth || '582635TpBR0JJA9Kq6ad46e2fP1',
  };
  return cachedConfig;
}

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
 * Initializes the MSG91 OTP widget with custom exposed methods.
 * Crucial: MSG91's Angular web component boots asynchronously after document append,
 * so this function polls until window.sendOtp is actually registered.
 */
export async function initializeMsg91Widget(
  onGlobalSuccess?: (data: any) => void,
  onGlobalFailure?: (err: any) => void
): Promise<void> {
  if (typeof window === 'undefined') return;

  // If methods are already exposed and ready, resolve immediately
  if (typeof window.sendOtp === 'function') {
    return;
  }

  // Reuse in-flight initialization promise
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    await loadMsg91Script();

    if (!window.initSendOTP) {
      throw new Error('MSG91 script loaded but window.initSendOTP is not defined.');
    }

    const { widgetId, tokenAuth } = await fetchClientConfig();

    if (!widgetId) {
      throw new Error(
        'MSG91 Widget ID is missing. Please configure VITE_MSG91_WIDGET_ID in your environment variables.'
      );
    }

    if (!tokenAuth) {
      throw new Error(
        'MSG91 Token Auth is missing. Please set VITE_MSG91_TOKEN_AUTH (or MSG91_TOKEN_AUTH in Vercel) from MSG91 Dashboard > OTP > OTP Widget > Token.'
      );
    }

    const config: Msg91Config = {
      widgetId,
      tokenAuth,
      exposeMethods: true,
      success: (data) => {
        console.log('MSG91 SDK Global Success Event:', data);
        if (onGlobalSuccess) onGlobalSuccess(data);
      },
      failure: (error) => {
        console.error('MSG91 SDK Global Failure Event:', error);
        if (onGlobalFailure) onGlobalFailure(error);
      },
    };

    try {
      window.initSendOTP(config);
    } catch (err: any) {
      console.error('Error invoking window.initSendOTP:', err);
      throw new Error(`MSG91 initialization failed: ${err?.message || err}`);
    }

    // Wait asynchronously for MSG91's Angular web component to finish mounting and expose methods
    await new Promise<void>((resolve, reject) => {
      if (typeof window.sendOtp === 'function') {
        return resolve();
      }

      let elapsed = 0;
      const interval = 50;
      const maxTimeout = 10000; // 10 seconds

      const timer = setInterval(() => {
        elapsed += interval;
        if (typeof window.sendOtp === 'function') {
          clearInterval(timer);
          resolve();
        } else if (elapsed >= maxTimeout) {
          clearInterval(timer);
          reject(
            new Error(
              'Timed out waiting for MSG91 SDK to expose custom methods. Please verify that your Widget ID and Token Auth are valid, and verify that your domain is whitelisted in your MSG91 widget settings.'
            )
          );
        }
      }, interval);
    });
  })();

  try {
    await initPromise;
  } catch (err) {
    initPromise = null; // Reset to allow retry on error
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
  // Ensure widget is initialized and custom methods are registered on window
  if (typeof window.sendOtp !== 'function') {
    await initializeMsg91Widget();
  }

  if (typeof window.sendOtp !== 'function') {
    throw new Error('MSG91 SDK sendOtp method is not available. Please verify your Widget ID and Token Auth.');
  }

  // MSG91 identifier format for Indian mobile: 91XXXXXXXXXX (no plus)
  const identifier = `91${phone10Digits}`;

  return new Promise((resolve, reject) => {
    try {
      window.sendOtp!(
        identifier,
        (response) => {
          console.log('MSG91 sendOtp success response:', response);
          resolve(response);
        },
        (error) => {
          console.error('MSG91 sendOtp error response:', error);
          const errMsg = typeof error === 'string' 
            ? error 
            : error?.message || error?.error || (typeof error === 'object' ? JSON.stringify(error) : 'MSG91 failed to dispatch OTP');
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
  if (typeof window.retryOtp !== 'function') {
    await initializeMsg91Widget();
  }

  if (typeof window.retryOtp !== 'function') {
    throw new Error('MSG91 SDK retryOtp method is not available.');
  }

  return new Promise((resolve, reject) => {
    try {
      window.retryOtp!(
        channel,
        (response) => {
          console.log('MSG91 retryOtp success response:', response);
          resolve(response);
        },
        (error) => {
          console.error('MSG91 retryOtp error response:', error);
          const errMsg = typeof error === 'string' 
            ? error 
            : error?.message || error?.error || 'MSG91 failed to retry OTP';
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
  if (typeof window.verifyOtp !== 'function') {
    await initializeMsg91Widget();
  }

  if (typeof window.verifyOtp !== 'function') {
    throw new Error('MSG91 SDK verifyOtp method is not available.');
  }

  const payload: any = reqId ? { otp: otpCode.trim(), reqId } : otpCode.trim();

  return new Promise((resolve, reject) => {
    try {
      window.verifyOtp!(
        payload,
        (data) => {
          console.log('MSG91 verifyOtp success response:', data);
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
            // Check any key starting with eyJ
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
          console.error('MSG91 verifyOtp error response:', error);
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
