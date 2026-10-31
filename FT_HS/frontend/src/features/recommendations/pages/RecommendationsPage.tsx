import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  CheckCheck,
  Clock3,
  Lightbulb,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import {
  recommendationsApi,
  type Recommendation,
  type RecommendationSummary,
} from '@shared/http/httpClient';

export function RecommendationsPage({ homeId }: { homeId?: string }) {
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<RecommendationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!homeId) {
      setRecommendations([]);
      setSummary(null);
      return;
    }
    setLoading(true);
    try {
      const [listResponse, summaryResponse] = await Promise.all([
        recommendationsApi.list(homeId),
        recommendationsApi.summary(homeId),
      ]);
      setRecommendations(listResponse.data);
      setSummary(summaryResponse.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('recommendations.loadError'));
    } finally {
      setLoading(false);
    }
  }, [homeId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateRecommendation = async (
    recommendation: Recommendation,
    payload: { status?: 'Read' | 'Dismissed' | 'Applied'; usefulness?: boolean }
  ) => {
    setBusyId(recommendation.userRecommendationId);
    try {
      await recommendationsApi.update(recommendation.userRecommendationId, payload);
      toast.success(
        payload.usefulness !== undefined
          ? t('recommendations.usefulnessUpdated')
          : t('recommendations.updated')
      );
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('recommendations.updateError'));
    } finally {
      setBusyId(null);
    }
  };

  const countCards = [
    {
      label: t('recommendations.total'),
      value: summary?.totalRecommendations ?? recommendations.length,
    },
    { label: t('recommendations.pending'), value: summary?.pendingCount ?? 0 },
    { label: t('recommendations.applied'), value: summary?.appliedCount ?? 0 },
    { label: t('recommendations.dismissed'), value: summary?.dismissedCount ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl text-gray-900">
            <Lightbulb className="size-6 text-amber-500" aria-hidden="true" />
            {t('recommendations.title')}
          </h2>
          <p className="text-gray-600">{t('recommendations.subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={!homeId || loading}>
          <RefreshCw className="mr-2 size-4" />
          {t('recommendations.refresh')}
        </Button>
      </div>

      {!homeId ? (
        <Card>
          <CardContent className="pt-6 text-sm text-gray-600">
            {t('recommendations.selectHome')}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {countCards.map((item) => (
              <Card key={item.label}>
                <CardContent className="p-4">
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{item.value}</p>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">{t('recommendations.averageUsefulness')}</p>
                <p className="mt-1 text-2xl font-semibold">
                  {summary?.averageUsefulness == null
                    ? '—'
                    : `${Math.round(summary.averageUsefulness * 100)}%`}
                </p>
                {summary?.averageUsefulness == null && (
                  <p className="mt-1 text-xs text-gray-500">{t('recommendations.noUsefulness')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('recommendations.listTitle')}</CardTitle>
              <CardDescription>{t('recommendations.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && recommendations.length === 0 ? (
                <p className="text-sm text-gray-500">{t('recommendations.loading')}</p>
              ) : recommendations.length === 0 ? (
                <p className="text-sm text-gray-500">{t('recommendations.empty')}</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {recommendations.map((recommendation) => {
                    const busy = busyId === recommendation.userRecommendationId;
                    return (
                      <article
                        key={recommendation.userRecommendationId}
                        className="flex flex-col rounded-lg border bg-white p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <Badge variant="outline">{recommendation.category}</Badge>
                          <Badge>
                            {t(`recommendations.status.${recommendation.status}`, {
                              defaultValue: recommendation.status,
                            })}
                          </Badge>
                        </div>
                        <h3 className="mt-3 font-semibold text-gray-900">{recommendation.title}</h3>
                        <p className="mt-2 flex-1 whitespace-pre-line text-sm text-gray-600">
                          {recommendation.description}
                        </p>
                        {recommendation.activationThreshold != null && (
                          <p className="mt-3 text-xs text-gray-500">
                            {recommendation.activationThreshold.toLocaleString()}{' '}
                            {recommendation.thresholdUnit}
                          </p>
                        )}
                        <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <Clock3 className="size-3.5" />
                          {new Date(recommendation.sentAt).toLocaleString()}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {recommendation.status === 'Pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                void updateRecommendation(recommendation, { status: 'Read' })
                              }
                            >
                              <Check className="mr-1 size-4" />
                              {t('recommendations.markRead')}
                            </Button>
                          )}
                          {recommendation.status !== 'Applied' && (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void updateRecommendation(recommendation, { status: 'Applied' })
                              }
                            >
                              <CheckCheck className="mr-1 size-4" />
                              {t('recommendations.markApplied')}
                            </Button>
                          )}
                          {recommendation.status !== 'Dismissed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() =>
                                void updateRecommendation(recommendation, { status: 'Dismissed' })
                              }
                            >
                              {t('recommendations.dismiss')}
                            </Button>
                          )}
                        </div>
                        <div className="mt-4 border-t pt-3">
                          <p className="mb-2 text-xs text-gray-600">
                            {t('recommendations.usefulQuestion')}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={recommendation.usefulness === true ? 'default' : 'outline'}
                              disabled={busy || recommendation.usefulness === true}
                              onClick={() =>
                                void updateRecommendation(recommendation, { usefulness: true })
                              }
                            >
                              <ThumbsUp className="mr-1 size-4" />
                              {t('recommendations.usefulYes')}
                            </Button>
                            <Button
                              size="sm"
                              variant={recommendation.usefulness === false ? 'default' : 'outline'}
                              disabled={busy || recommendation.usefulness === false}
                              onClick={() =>
                                void updateRecommendation(recommendation, { usefulness: false })
                              }
                            >
                              <ThumbsDown className="mr-1 size-4" />
                              {t('recommendations.usefulNo')}
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
