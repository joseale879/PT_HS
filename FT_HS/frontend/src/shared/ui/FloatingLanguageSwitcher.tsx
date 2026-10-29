import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import { languageOptions, normalizeLanguage } from '@shared/i18n/locale';
import { userApi } from '@shared/http/httpClient';
import { useAuth } from '@app/providers/AuthProvider';
import { toast } from 'sonner';

export function FloatingLanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const currentCode = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const currentLanguage =
    languageOptions.find((language) => language.code === currentCode) || languageOptions[0];
  const isAuthScreen = ['/login', '/register', '/privacy'].includes(pathname);

  const handleLanguageChange = async (code: string) => {
    if (isAuthenticated) {
      const language = languageOptions.find((option) => option.code === code);
      if (language) {
        try {
          await userApi.updatePreferences({ language: code, currency: language.defaultCurrency });
        } catch {
          toast.error('No fue posible guardar la preferencia de idioma');
          return;
        }
      }
    }
    await i18n.changeLanguage(code);
    setIsOpen(false);
  };

  if (!isAuthenticated || isAuthScreen) return null;

  return (
    <div className="floating-language-switcher fixed z-[70]">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            className="floating-language-trigger size-14 rounded-full bg-blue-600 p-0 text-white shadow-lg hover:bg-blue-700"
            aria-label={t('settings.language')}
          >
            <span className="floating-language-trigger__content">
              <Globe className="size-5" />
              <span className="floating-language-trigger__code">
                {currentLanguage.code.toUpperCase()}
              </span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={10}
          collisionPadding={16}
          className="w-48"
        >
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
