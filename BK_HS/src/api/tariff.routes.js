const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { GetCurrentHomeTariff } = require('../core/application/use-cases/tariff/GetCurrentHomeTariff');
const { PostgresTariffRepository } = require('../core/infrastructure/repositories/postgres/PostgresTariffRepository');
const { TariffController } = require('./controllers/TariffController');

const tariffController = new TariffController({
  getCurrentHomeTariff: new GetCurrentHomeTariff({ tariffRepository: new PostgresTariffRepository() })
});

router.use(authenticate);
router.get('/home/:homeId', asyncHandler((req, res) => tariffController.currentByHome(req, res)));

module.exports = router;
