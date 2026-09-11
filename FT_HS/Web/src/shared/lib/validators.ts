const emailLocalPart = /^[A-Z0-9!#$%&'*+/=?^_{}|~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_{}|~-]+)*$/i;
const emailDomainPart = /^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i;

// Acepta proveedores públicos e institucionales sin limitar la lista de dominios.
export const emailPattern = /^[A-Z0-9!#$%&'*+/=?^_{}|~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_{}|~-]+)*@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
export const namePattern = /^[\p{L}\p{M}]+(?: +[\p{L}\p{M}]+)*$/u;
export const documentNumberPattern = /^\d{1,10}$/;

export function isValidEmail(value: string) {
  const email = value.trim();
  if (email.length > 150 || !emailPattern.test(email)) return false;
  const [localPart, domain] = email.split('@');
  const domainLabels = domain.split('.');
  const topLevelDomain = domainLabels[domainLabels.length - 1] || '';
  return Boolean(
    localPart &&
      localPart.length <= 64 &&
      emailLocalPart.test(localPart) &&
      domainLabels.every((label) => emailDomainPart.test(label)) &&
      /^\p{L}{2,63}$/u.test(topLevelDomain)
  );
}

export function normalizeNameInput(value: string) {
  return value
    .replace(/[^\p{L}\p{M}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '')
    .slice(0, 60);
}

export function isValidName(value: string) {
  const name = value.trim();
  return name.length >= 3 && name.length <= 60 && namePattern.test(name);
}

export function normalizeDocumentNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 10);
}
export function passwordValidation(password: string) {
  return {
    hasMinLength: password.length >= 8,
    hasMaxLength: password.length <= 128,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };
}
export function isValidPassword(password: string) {
  return Object.values(passwordValidation(password)).every(Boolean);
}
