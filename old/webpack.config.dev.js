const sharedConfig = require('./webpack.config.common');
const NodemonPlugin = require('nodemon-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
  ...sharedConfig,
  mode: 'development',
  plugins: [
    new NodemonPlugin({
      script: './dist/build.js',
      watch: path.resolve('./dist')
    })
  ],
  externals: [nodeExternals()]
};
