class TariffController {
  constructor({ getCurrentHomeTariff }) {
    this.getCurrentHomeTariff = getCurrentHomeTariff;
  }

  async currentByHome(req, res) {
    const tariff = await this.getCurrentHomeTariff.execute({
      userId: req.user.id,
      homeId: req.params.homeId,
      date: req.query.date
    });
    res.json({ data: tariff });
  }
}

module.exports = { TariffController };
