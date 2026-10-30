import { expect, test, type Page, type Route } from '@playwright/test';

const HOME_ID = 'home-e2e-001';
const TODAY_DAILY_RULE = {
  ruleId: 'daily-rule-001',
  homeId: HOME_ID,
  alertType: 'daily_limit',
  threshold: 0.5,
  unit: 'm3_day',
  active: true,
};
const MONTHLY_RULE = {
  ruleId: 'monthly-rule-001',
  homeId: HOME_ID,
  alertType: 'monthly_limit',
  threshold: 15,
  unit: 'm3_month',
  active: true,
};
const BACKEND_RECOMMENDATION = {
  userRecommendationId: 'recommendation-e2e-001',
  recommendationId: 'recommendation-template-e2e-001',
  userId: 'user-e2e-001',
  homeId: HOME_ID,
  title: 'Consejo guardado por el backend',
  description: 'Revisa posibles fugas para reducir el consumo del hogar.',
  category: 'Consumo',
  activationThreshold: 0.75,
  thresholdUnit: 'm3_day',
  status: 'Pending',
  usefulness: null,
  sentAt: '2026-10-29T12:00:00.000Z',
  readAt: null,
};

type CapturedRequests = {
  loginCsrfHeader: string | null;
  thresholdBody: Record<string, unknown> | null;
  createdRuleBody: Record<string, unknown> | null;
  updatedRuleBodies: Array<Record<string, unknown>>;
  recommendationUpdateBody: Record<string, unknown> | null;
};

async function installApiMocks(page: Page): Promise<CapturedRequests> {
  let authenticated = false;
  let thresholds = { dailyLimit: 0.5, monthlyLimit: 15, active: true };
  let rules: Array<Record<string, unknown>> = [TODAY_DAILY_RULE, MONTHLY_RULE];
  let recommendations: Array<Record<string, unknown>> = [BACKEND_RECOMMENDATION];
  let recommendationSummary = {
    homeId: HOME_ID,
    totalRecommendations: 1,
    appliedCount: 0,
    pendingCount: 1,
    dismissedCount: 0,
    averageUsefulness: null,
    refreshedAt: '2026-10-29T12:00:00.000Z',
  };
  const captured: CapturedRequests = {
    loginCsrfHeader: null,
    thresholdBody: null,
    createdRuleBody: null,
    updatedRuleBodies: [],
    recommendationUpdateBody: null,
  };
  const today = await page.evaluate(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  });

  await page.route('**/api/v1/**', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const method = request.method();
    const respond = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });

    if (method === 'GET' && path === '/auth/csrf') {
      return route.fulfill({ status: 204, headers: { 'X-CSRF-Token': 'csrf-e2e-token' } });
    }

    if (method === 'POST' && path === '/auth/refresh') {
      return respond({ error: { message: 'Sesión inexistente' } }, 401);
    }

    if (method === 'POST' && path === '/auth/login') {
      captured.loginCsrfHeader = request.headers()['x-csrf-token'] || null;
      authenticated = true;
      return respond({ data: { userId: 'user-e2e-001', sessionId: 'session-e2e-001', refreshExpiresAt: '2099-01-01T00:00:00.000Z' } });
    }
    if (method === 'POST' && path === '/auth/logout') {
      authenticated = false;
      return route.fulfill({ status: 204 });
    }
    if (method === 'GET' && path === '/users/me') {
      if (!authenticated) return respond({ error: { message: 'No autenticado' } }, 401);
      return respond({
        data: {
          userId: 'user-e2e-001',
          fullName: 'Usuario de Prueba',
          email: 'e2e@example.test',
          roles: ['HomeUser'],
          permissions: ['alerts.manage', 'reports.read', 'homes.manage'],
          preferences: { language: 'es', currency: 'COP' },
        },
      });
    }
    if (method === 'GET' && path === '/homes') {
      return respond({ data: [{ homeId: HOME_ID, name: 'Hogar de prueba' }] });
    }
    if (method === 'GET' && path === `/alerts/home/${HOME_ID}/history`) {
      return respond({ data: [], pagination: { page: 1, pageSize: 100, total: 0 } });
    }
    if (method === 'GET' && path === `/alerts/home/${HOME_ID}/thresholds`) {
      return respond({ data: thresholds });
    }
    if (method === 'GET' && path === `/alerts/home/${HOME_ID}/pending`) {
      return respond({ data: { homeId: HOME_ID, pendingCount: 0, lastAlertAt: null, refreshedAt: null } });
    }
    if (method === 'GET' && path === `/alerts/home/${HOME_ID}/rules`) {
      return respond({ data: rules });
    }
    if (method === 'GET' && path === '/recommendations') {
      return respond({ data: recommendations, pagination: { page: 1, pageSize: 20, total: recommendations.length } });
    }
    if (method === 'GET' && path === `/recommendations/home/${HOME_ID}/summary`) {
      return respond({ data: recommendationSummary });
    }
    if (method === 'PUT' && path === `/alerts/home/${HOME_ID}/thresholds`) {
      captured.thresholdBody = request.postDataJSON() as Record<string, unknown>;
      thresholds = { ...thresholds, ...captured.thresholdBody } as typeof thresholds;
      return respond({ data: thresholds });
    }
    if (method === 'POST' && path === `/alerts/home/${HOME_ID}/rules`) {
      captured.createdRuleBody = request.postDataJSON() as Record<string, unknown>;
      rules = [
        ...rules,
        { ...captured.createdRuleBody, ruleId: 'custom-rule-001', homeId: HOME_ID },
      ];
      return respond({ data: rules[rules.length - 1] }, 201);
    }
    if (method === 'PATCH' && path.startsWith('/alerts/rules/')) {
      const ruleId = path.split('/').at(-1);
      const changes = request.postDataJSON() as Record<string, unknown>;
      captured.updatedRuleBodies.push(changes);
      rules = rules.map((rule) => rule.ruleId === ruleId ? { ...rule, ...changes } : rule);
      return respond({ data: rules.find((rule) => rule.ruleId === ruleId) });
    }
    if (method === 'PATCH' && path.startsWith('/recommendations/')) {
      captured.recommendationUpdateBody = request.postDataJSON() as Record<string, unknown>;
      const userRecommendationId = path.split('/').at(-1);
      recommendations = recommendations.map((recommendation) =>
        recommendation.userRecommendationId === userRecommendationId
          ? { ...recommendation, ...captured.recommendationUpdateBody }
          : recommendation
      );
      const updated = recommendations.find((recommendation) => recommendation.userRecommendationId === userRecommendationId);
      if (captured.recommendationUpdateBody.status === 'Applied') {
        recommendationSummary = { ...recommendationSummary, appliedCount: 1, pendingCount: 0 };
      }
      return respond({ data: updated });
    }
    if (method === 'GET' && path === '/consumption/summary') {
      const from = url.searchParams.get('from') || '';
      const to = url.searchParams.get('to') || '';
      const rangeDays = Math.round(
        (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) /
          86_400_000
      );
      const totalM3 =
        from === to
          ? from === today
            ? 0.8
            : 0.4
          : rangeDays === 6 && to === today
            ? 4.2
            : rangeDays === 6
              ? 3.5
              : 12;
      return respond({ data: { totalM3 } });
    }
    if (method === 'GET' && path === '/consumption/hourly') {
      return respond({ data: { points: [] } });
    }
    if (method === 'GET' && path === '/consumption/daily') {
      return respond({ data: { consumptionLiters: 1000 } });
    }
    if (method === 'GET' && path === '/devices') {
      return respond({ data: [] });
    }

    return respond({ error: { message: `Ruta API no simulada en E2E: ${method} ${path}` } }, 501);
  });

  return captured;
}

async function signIn(page: Page, requests: CapturedRequests) {
  await page.goto('/login');
  await page.locator('#email').fill('e2e@example.test');
  await page.locator('#password').fill('Test-Only-Password-123!');
  await page.locator('form').first().getByRole('button', { name: /iniciar sesi[oó]n/i }).click();
  await expect(page).toHaveURL(/\/app$/);
  expect(requests.loginCsrfHeader).toBe('csrf-e2e-token');
}

test('el usuario puede guardar umbrales diarios y mensuales del hogar', async ({ page }) => {
  const requests = await installApiMocks(page);
  await signIn(page, requests);
  await page.goto('/app/alerts');

  await expect(page.locator('#daily-alert-limit')).toBeVisible();
  await page.locator('#daily-alert-limit').fill('0.75');
  await page.locator('#monthly-alert-limit').fill('18.5');
  await page.getByRole('button', { name: 'Guardar límites' }).click();

  await expect.poll(() => requests.thresholdBody).toEqual({
    dailyLimit: 0.75,
    monthlyLimit: 18.5,
    active: true,
  });
  await expect(page.locator('#daily-alert-limit')).toHaveValue('0.75');
  await expect(page.locator('#monthly-alert-limit')).toHaveValue('18.5');
});

test('el usuario puede crear y actualizar una regla de alerta', async ({ page }) => {
  const requests = await installApiMocks(page);
  await signIn(page, requests);
  await page.goto('/app/alerts');

  await page.locator('#new-alert-threshold').fill('2.5');
  await page.getByRole('button', { name: 'Agregar regla' }).click();

  await expect.poll(() => requests.createdRuleBody).toEqual({
    alertType: 'excessive_consumption',
    threshold: 2.5,
    unit: 'm3_day',
    active: true,
  });
  const threshold = page.locator('input[aria-label^="Umbral:"]');
  await expect(threshold).toBeVisible();
  await threshold.fill('3.25');
  await page.getByRole('checkbox', { name: 'Activa', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect.poll(() => requests.updatedRuleBodies.at(-1)).toEqual({
    alertType: 'excessive_consumption',
    unit: 'm3_day',
    threshold: 3.25,
    active: false,
  });
});

test('el panel muestra recomendaciones del backend y permite registrar su estado', async ({ page }) => {
  const requests = await installApiMocks(page);
  await signIn(page, requests);

  await expect(page.getByText('Consejo guardado por el backend')).toBeVisible();
  await page.goto('/app/recommendations');
  await expect(page.getByText('Revisa posibles fugas para reducir el consumo del hogar.')).toBeVisible();
  await page.getByRole('button', { name: 'Aplicada', exact: true }).click();
  await expect.poll(() => requests.recommendationUpdateBody).toEqual({ status: 'Applied' });
});
