import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Globe, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@app/providers/ThemeProvider';
import { toast } from 'sonner';
import { languageOptions, normalizeLanguage } from '@shared/i18n/locale';
import { userApi } from '@shared/http/httpClient';

// RF33 - Internacionalización
export function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const { theme, setTheme } = useTheme();

  // RF33.2 - Cambio de idioma
  const handleLanguageChange = async (lang: string) => {
    const language = languageOptions.find((option) => option.code === lang);
    await i18n.changeLanguage(lang);
    if (language) {
      try {
        await userApi.updatePreferences({ language: lang, currency: language.defaultCurrency });
      } catch {
        toast.error('No fue posible guardar la preferencia de idioma');
      }
    }
    toast.success(t('settings.changesSaved'), {
      description: `${t('settings.language')}: ${t(`languages.${lang}`)}`
    });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'default' | 'dark' | 'green' | 'ocean');
    toast.success(t('settings.changesSaved'), {
      description: `${t('settings.theme')}: ${t(`themes.${newTheme}`)}`
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
            <Select value={normalizeLanguage(i18n.resolvedLanguage || i18n.language)} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language" className="w-full">
                <SelectValue placeholder={t('settings.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>{languageOptions.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{language.flag}</span>
                    <span>{t(`languages.${language.code}`)}</span>
                  </div>
                </SelectItem>
              ))}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Selector de Tema */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-blue-600" aria-hidden="true" />
            <CardTitle>{t('settings.theme')}</CardTitle>
          </div>
          <CardDescription>{t('settings.selectTheme')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label htmlFor="theme">{t('settings.theme')}</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme" className="w-full">
                <SelectValue placeholder={t('settings.selectTheme')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-blue-600"></div>
                    <span>{t('themes.default')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-slate-800"></div>
                    <span>{t('themes.dark')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="green">
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-green-600"></div>
                    <span>{t('themes.green')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="ocean">
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-cyan-600"></div>
                    <span>{t('themes.ocean')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Vista previa de temas */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => handleThemeChange('default')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme === 'default' ? 'border-blue-600 ring-2 ring-blue-600 ring-offset-2' : 'border-gray-200 hover:border-blue-300'
                }`}
                aria-label={t('themes.default')}
              >
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-6 bg-blue-600 rounded"></div>
                    <div className="h-2 w-4 bg-blue-400 rounded"></div>
                  </div>
                  <div className="h-8 bg-blue-50 rounded"></div>
                  <div className="text-xs text-center">{t('themes.default')}</div>
                </div>
              </button>

              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme === 'dark' ? 'border-slate-600 ring-2 ring-slate-600 ring-offset-2' : 'border-gray-200 hover:border-slate-300'
                }`}
                aria-label={t('themes.dark')}
              >
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-6 bg-slate-700 rounded"></div>
                    <div className="h-2 w-4 bg-slate-500 rounded"></div>
                  </div>
                  <div className="h-8 bg-slate-800 rounded"></div>
                  <div className="text-xs text-center">{t('themes.dark')}</div>
                </div>
              </button>

              <button
                onClick={() => handleThemeChange('green')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme === 'green' ? 'border-green-600 ring-2 ring-green-600 ring-offset-2' : 'border-gray-200 hover:border-green-300'
                }`}
                aria-label={t('themes.green')}
              >
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-6 bg-green-600 rounded"></div>
                    <div className="h-2 w-4 bg-green-400 rounded"></div>
                  </div>
                  <div className="h-8 bg-green-50 rounded"></div>
                  <div className="text-xs text-center">{t('themes.green')}</div>
                </div>
              </button>

              <button
                onClick={() => handleThemeChange('ocean')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  theme === 'ocean' ? 'border-cyan-600 ring-2 ring-cyan-600 ring-offset-2' : 'border-gray-200 hover:border-cyan-300'
                }`}
                aria-label={t('themes.ocean')}
              >
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-6 bg-cyan-600 rounded"></div>
                    <div className="h-2 w-4 bg-cyan-400 rounded"></div>
                  </div>
                  <div className="h-8 bg-cyan-50 rounded"></div>
                  <div className="text-xs text-center">{t('themes.ocean')}</div>
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
