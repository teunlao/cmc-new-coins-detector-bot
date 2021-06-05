const path = require('path');

const entry = [path.resolve('./src/main.js')];

// if (!isProduction) {
//   plugins.push(new webpack.HotModuleReplacementPlugin());
// }

module.exports = {
  devtool: 'eval-source-map',
  target: 'node',
  entry: entry,
  output: {
    path: path.resolve(__dirname, './dev'),
    filename: 'dev.build.js'
  },
  resolve: {
    extensions: ['', '.js', '.jsx', '.json', '.node']
  },
  module: {
    rules: []
  }
};
