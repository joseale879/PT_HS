export type SupportedLanguage = 'es' | 'en' | 'pt' | 'it';

const languageSettings: Record<SupportedLanguage, { locale: string; defaultCurrency: string; flag: string }> = {
  es: { locale: 'es-CO', defaultCurrency: 'COP', flag: '\u{1F1E8}\u{1F1F4}' },
  en: { locale: 'en-US', defaultCurrency: 'USD', flag: '\u{1F1FA}\u{1F1F8}' },
  pt: { locale: 'pt-BR', defaultCurrency: 'BRL', flag: '\u{1F1E7}\u{1F1F7}' },
  it: { locale: 'it-IT', defaultCurrency: 'EUR', flag: '\u{1F1EE}\u{1F1F9}' }
};

export const languageOptions = (Object.keys(languageSettings) as SupportedLanguage[]).map((code) => ({ code, ...languageSettings[code] }));

export function normalizeLanguage(language?: string): SupportedLanguage {
  const code = language?.split('-')[0] as SupportedLanguage;
  return code in languageSettings ? code : 'es';
}

export function localeForLanguage(language?: string) {
  return languageSettings[normalizeLanguage(language)].locale;
}

export function defaultCurrencyForLanguage(language?: string) {
  return languageSettings[normalizeLanguage(language)].defaultCurrency;
}

export function formatCurrency(amount: number, language?: string, currency?: string) {
  return new Intl.NumberFormat(localeForLanguage(language), {
    style: 'currency',
    currency: currency || defaultCurrencyForLanguage(language),
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(value: number, language?: string, options: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat(localeForLanguage(language), options).format(value);
}
