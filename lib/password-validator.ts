/**
 * Enterprise Password Complexity Validator
 * Requires:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 numeric digit (0-9)
 * - At least 1 special character (!@#$%^&*...)
 */

export interface PasswordValidationResult {
  ok: boolean;
  reason?: string;
}

export function validatePasswordComplexity(password: string): PasswordValidationResult {
  if (!password || password.length < 8) {
    return { ok: false, reason: "Password minimal 8 karakter." };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, reason: "Password harus mengandung minimal 1 huruf kapital (A-Z)." };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, reason: "Password harus mengandung minimal 1 huruf kecil (a-z)." };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, reason: "Password harus mengandung minimal 1 angka (0-9)." };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return { ok: false, reason: "Password harus mengandung minimal 1 karakter simbol khusus (!@#$%^&* dll)." };
  }
  return { ok: true };
}
