/**
 * Server-Side MSG91 OTP Widget Verification Client
 *
 * Validates the MSG91 JWT access token server-to-server.
 * NEVER exposed to client or browser bundles.
 */

export interface Msg91TokenVerifyResult {
  success: boolean;
  mobile?: string;
  email?: string;
  message: string;
  statusCode: number;
  raw?: any;
}

export async function verifyMsg91AccessToken(accessToken: string): Promise<Msg91TokenVerifyResult> {
  const authKey = process.env.MSG91_AUTH_KEY;

  if (!authKey || authKey === 'your_msg91_auth_key_here') {
    return {
      success: false,
      message: 'Server configuration error: MSG91_AUTH_KEY is not configured in environment variables. Please provide a valid MSG91 Auth Key.',
      statusCode: 500,
    };
  }

  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length === 0) {
    return {
      success: false,
      message: 'Bad Request: access-token is required.',
      statusCode: 400,
    };
  }

  try {
    const response = await fetch('https://api.msg91.com/api/v5/widget/verifyAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: authKey.trim(),
      },
      body: JSON.stringify({
        'access-token': accessToken.trim(),
      }),
    });

    const data: any = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || `MSG91 verification rejected with HTTP status ${response.status}`,
        statusCode: response.status,
        raw: data,
      };
    }

    // MSG91 success response structure:
    // { type: "success", message: "Access token verified successfully", data: { mobile: "919876543210" } }
    if (data?.type === 'success' || data?.status === 'success' || data?.data?.mobile) {
      const mobile = data?.data?.mobile || data?.mobile;
      const email = data?.data?.email || data?.email;

      return {
        success: true,
        mobile: mobile ? String(mobile) : undefined,
        email: email ? String(email) : undefined,
        message: data?.message || 'Access token verified successfully',
        statusCode: 200,
        raw: data,
      };
    }

    return {
      success: false,
      message: data?.message || 'Invalid or expired MSG91 access token',
      statusCode: 401,
      raw: data,
    };
  } catch (error: any) {
    console.error('Error during MSG91 verifyAccessToken call:', error);
    return {
      success: false,
      message: error?.message || 'Failed to connect to MSG91 verification servers',
      statusCode: 502,
    };
  }
}
