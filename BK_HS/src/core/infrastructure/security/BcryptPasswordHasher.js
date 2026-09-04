const bcrypt = require('bcryptjs');

class BcryptPasswordHasher {
  constructor(rounds = 12) {
    this.rounds = rounds;
  }

  hash(value) { return bcrypt.hash(value, this.rounds); }

  compare(value, hash) { return bcrypt.compare(value, hash); }
}

module.exports = { BcryptPasswordHasher };
