const sharedConfig = require('./webpack.config.common');
const path = require('path');

module.exports = {
  ...sharedConfig,
  mode: 'production',
  output: {
    path: path.resolve(__dirname, './prod'),
    filename: 'cmc-bot.js'
  },
  module: {
    rules: [
      ...sharedConfig.module.rules,
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  }
};
