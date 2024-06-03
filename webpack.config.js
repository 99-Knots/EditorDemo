const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
//const WebpackObfuscator = require('webpack-obfuscator');
//const webpack = require('webpack');
//new webpack.EnvironmentPlugin(['NODE_ENV', 'DEBUG']);

module.exports = {
  entry: './src/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      //{
      //  test: /\.js$/,
      //  exclude: [ 
      //      path.resolve(__dirname, 'bundle.js') 
      //  ],
      //  enforce: 'post',
      //  use: { 
      //      loader: WebpackObfuscator.loader, 
      //      options: {
      //          rotateStringArray: true,
      //          compact: true,
      //      }
      //  }
      // }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    //new WebpackObfuscator ({
    //    rotateStringArray: true,
    //    compact: true,
    //}, ['bundle.js']),
    //new webpack.ProvidePlugin({
    //  process: 'process/browser',
    //}),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
    open: true,
  },
};
