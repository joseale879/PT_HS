import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { languageOptions, normalizeLanguage } from '@shared/i18n/locale';
import { userApi } from '@shared/http/httpClient';
import { useAuth } from '@app/providers/AuthProvider';

// RF33 - Internacionalización
export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const { refreshSession } = useAuth();

  // RF33.2 - Cambio de idioma
  const handleLanguageChange = async (lang: string) => {
    const language = languageOptions.find((option) => option.code === lang);
    if (language) {
      try {
        await userApi.updatePreferences({ language: lang, currency: language.defaultCurrency });
        await refreshSession();
      } catch {
        toast.error('No fue posible guardar la preferencia de idioma');
        return;
      }
    }
    await i18n.changeLanguage(lang);
    toast.success(t('settings.changesSaved'), {
      description: `${t('settings.language')}: ${t(`languages.${lang}`)}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Selector de Idioma */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-blue-600" aria-hidden="true" />
            <CardTitle>{t('settings.language')}</CardTitle>
          </div>
          <CardDescription>{t('settings.selectLanguage')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language">{t('settings.language')}</Label>
            <Select
              value={normalizeLanguage(i18n.resolvedLanguage || i18n.language)}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder={t('settings.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{language.flag}</span>
                      <span>{t(`languages.${language.code}`)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
