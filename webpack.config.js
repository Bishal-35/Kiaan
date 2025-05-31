const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/js/index.js',
    output: {
      filename: 'kiaan-voice-orb.min.js',
      path: path.resolve(__dirname, 'dist'),
      library: 'KiaanVoiceOrb',
      libraryTarget: 'umd',
      libraryExport: 'default',
      publicPath: ''
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        {
          test: /\.svg$/,
          type: 'asset/inline'
        },
        {
          test: /\.(png|jpe?g|gif)$/i,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'kiaan-voice-orb.min.css'
      })
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            format: {
              comments: false,
            },
          },
        }),
        new CssMinimizerPlugin()
      ]
    },
    devtool: isProduction ? false : 'source-map',
    resolve: {
      extensions: ['.js', '.css'],
      alias: {
        '@css': path.resolve(__dirname, 'src/css/'),
        '@js': path.resolve(__dirname, 'src/js/')
      }
    }
  };
};
