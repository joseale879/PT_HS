const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const healthRoutes = require('./api/health.routes');
const authRoutes = require('./api/auth.routes');
const homeRoutes = require('./api/home.routes');
const deviceRoutes = require('./api/device.routes');
const consumptionRoutes = require('./api/consumption.routes');
const userRoutes = require('./api/user.routes');
const tariffRoutes = require('./api/tariff.routes');
const alertRoutes = require('./api/alert.routes');
const goalRoutes = require('./api/goal.routes');
const vacationRoutes = require('./api/vacation.routes');
const roleRoutes = require('./api/role.routes');
const supportRoutes = require('./api/support.routes');
const auditRoutes = require('./api/audit.routes');
const privacyRoutes = require('./api/privacy.routes');
const reportRoutes = require('./api/report.routes');
const recommendationRoutes = require('./api/recommendation.routes');
const actuatorRoutes = require('./api/actuator.routes');
const { notFound, errorHandler, requestContext } = require('./shared/http');
const { getEnv } = require('./config/env');

const app = express();

app.disable('x-powered-by');
// El backend recibe las peticiones del navegador a través de Nginx.
app.set('trust proxy', 1);
app.use(helmet());
app.use(requestContext);
app.use(cors({ origin: getEnv().corsOrigin.split(',').map((origin) => origin.trim()) }));
// Permite transportar un avatar de hasta 2 MB en base64; el caso de uso
// comprueba el tamaño binario real antes de persistirlo.
app.use(express.json({ limit: '4mb' }));

app.get('/', (_req, res) => {
  res.json({ name: 'Hidro Smart API', version: 'v1', status: 'ok' });
});

app.use('/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/homes', homeRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/consumption', consumptionRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tariffs', tariffRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/vacation', vacationRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/privacy', privacyRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/actuators', actuatorRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
