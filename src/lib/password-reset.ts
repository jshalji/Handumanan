export type PasswordResetResult = {
  status: 'invalid' | 'success' | 'error';
  message: string;
};

const RESET_SUCCESS_MESSAGE = 'If an account matches this email, a password reset link will be sent. Check your inbox and spam folder.';
const RESET_NETWORK_ERROR_MESSAGE = "We couldn't submit the request right now. Check your connection and try again.";
const RESET_FIREBASE_ERROR_MESSAGE = "We couldn't complete the reset request right now. Please try again later.";

export function validatePasswordResetEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function requestPasswordReset(
  email: string,
  sendEmail: (normalizedEmail: string) => Promise<unknown>,
  onLoadingChange: (isLoading: boolean) => void = () => {},
): Promise<PasswordResetResult> {
  const normalizedEmail = email.trim();
  if (!validatePasswordResetEmail(normalizedEmail)) {
    return { status: 'invalid', message: 'Enter a valid email address.' };
  }

  onLoadingChange(true);
  try {
    await sendEmail(normalizedEmail);
    return { status: 'success', message: RESET_SUCCESS_MESSAGE };
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
    if (code === 'auth/user-not-found') {
      return { status: 'success', message: RESET_SUCCESS_MESSAGE };
    }
    if (code === 'auth/invalid-email') {
      return { status: 'invalid', message: 'Enter a valid email address.' };
    }
    if (code === 'auth/network-request-failed' || (error instanceof TypeError && /fetch|network/i.test(error.message))) {
      return { status: 'error', message: RESET_NETWORK_ERROR_MESSAGE };
    }
    return { status: 'error', message: RESET_FIREBASE_ERROR_MESSAGE };
  } finally {
    onLoadingChange(false);
  }
}
