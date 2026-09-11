const emailPattern = /^[A-Z0-9!#$%&'*+/=?^_{}|~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_{}|~-]+)*@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
const namePattern = /^[\p{L}\p{M}]+(?: +[\p{L}\p{M}]+)*$/u;

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  if (email.length > 150 || !emailPattern.test(email)) return false;
  const [localPart, domain] = email.split('@');
  const labels = domain.split('.');
  const topLevelDomain = labels[labels.length - 1] || '';
  return (
    Boolean(localPart) &&
    localPart.length <= 64 &&
    labels.every((label) => /^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i.test(label)) &&
    /^\p{L}{2,63}$/u.test(topLevelDomain)
  );
}

function isValidPersonName(value) {
  if (typeof value !== 'string') return false;
  const name = value.trim();
  return name.length >= 3 && name.length <= 60 && namePattern.test(name);
}

module.exports = { isValidEmail, isValidPersonName };
