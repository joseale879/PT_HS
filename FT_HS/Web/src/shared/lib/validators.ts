export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const documentNumberPattern = /^\d{1,10}$/;

export function normalizeDocumentNumber(value: string) { return value.replace(/\D/g, '').slice(0, 10); }
export function passwordValidation(password: string) {
  return { hasMinLength: password.length >= 8, hasMaxLength: password.length <= 128, hasUpperCase: /[A-Z]/.test(password), hasLowerCase: /[a-z]/.test(password), hasNumber: /\d/.test(password), hasSymbol: /[^A-Za-z0-9]/.test(password) };
}
export function isValidPassword(password: string) { return Object.values(passwordValidation(password)).every(Boolean); }
