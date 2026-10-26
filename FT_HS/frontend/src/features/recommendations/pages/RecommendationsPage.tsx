import { Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';

const VISUAL_TIPS = Array.from({ length: 10 }, (_, index) => index + 1);

/**
 * Consejos informativos de presentación.
 * No representan recomendaciones generadas, métricas ni acciones persistidas.
 */
export function RecommendationsPage(_: { homeId?: string }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl text-gray-900">
          <Lightbulb className="size-6 text-amber-500" aria-hidden="true" />
          {t('recommendations.title')}
        </h2>
        <p className="text-gray-600">{t('recommendations.visualOnlyDescription')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('recommendations.visualOnlyTitle')}</CardTitle>
          <CardDescription>{t('recommendations.visualOnlyNotice')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VISUAL_TIPS.map((tipNumber) => (
              <article key={tipNumber} className="rounded-lg border bg-white p-4">
                <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                  {tipNumber}
                </div>
                <h3 className="font-medium text-gray-900">
                  {t(`recommendations.tip${tipNumber}Title`)}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {t(`recommendations.tip${tipNumber}Description`)}
                </p>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
