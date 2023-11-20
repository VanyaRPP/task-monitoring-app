const dotenvPlugin = require('cypress-dotenv');

module.exports = (on, config) => {
  dotenvPlugin(on, config);
  return config;
};
