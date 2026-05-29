export function formatSignUpError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('rate limit') || lower.includes('over_email_send')) {
    return 'Signup email limit reached. Wait about an hour, sign in if you already registered, or ask an admin to create your account from the Admin panel.';
  }

  if (lower.includes('invalid') && lower.includes('email')) {
    return 'That email address is not accepted. Use a real address like you@gmail.com.';
  }

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  return message;
}

export function isAutoConfirmSignupEnabled(): boolean {
  return process.env.SIGNUP_AUTO_CONFIRM === 'true';
}
