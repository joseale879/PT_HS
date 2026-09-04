import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/ui/dropdown-menu';
import { languageOptions, normalizeLanguage } from '@shared/i18n/locale';
import { sessionTokens, userApi } from '@shared/http/httpClient';

export function FloatingLanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentCode = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const currentLanguage = languageOptions.find((language) => language.code === currentCode) || languageOptions[0];

  const handleLanguageChange = async (code: string) => {
    i18n.changeLanguage(code);
    if (sessionTokens.accessToken) {
      const language = languageOptions.find((option) => option.code === code);
      if (language) userApi.updatePreferences({ language: code, currency: language.defaultCurrency }).catch(() => undefined);
    }
    setIsOpen(false);
  };

  return (
    <div className="floating-language-switcher fixed z-[70]">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="size-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700" aria-label={t('settings.language')}>
            <div className="flex flex-col items-center justify-center">
              <Globe className="size-5" />
              <span className="mt-0.5 text-xs">{currentLanguage.code.toUpperCase()}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" sideOffset={10} collisionPadding={16} className="w-48">
          {languageOptions.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`flex cursor-pointer items-center gap-3 ${currentCode === language.code ? 'bg-blue-50' : ''}`}
            >
              <span className="text-2xl">{language.flag}</span>
              <span className="flex-1">{t(`languages.${language.code}`)}</span>
              {currentCode === language.code && <span className="text-blue-600">{'\u2713'}</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
