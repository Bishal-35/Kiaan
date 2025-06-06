const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  console.log(`Building in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
  
  return {
    entry: './src/js/index.js',
    output: {
      filename: 'kiaan-voice-orb.min.js',
      path: path.resolve(__dirname, 'dist'),
      library: 'KiaanVoiceOrb',
      libraryTarget: 'umd',
      libraryExport: 'default',
      publicPath: './', // Change from '' to './' for better relative path handling
      clean: true,
      // Add globalObject for better UMD compatibility
      globalObject: 'typeof self !== \'undefined\' ? self : this'
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
            compress: {
              drop_console: false, // Keep console statements for debugging
              drop_debugger: isProduction, // Remove debugger in production
            },
            format: {
              comments: false,
            },
          },
        }),
        new CssMinimizerPlugin()
      ]
    },
    devtool: isProduction ? false : 'source-map',
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 8080,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
      }
    },
    resolve: {
      extensions: ['.js', '.css'],
      alias: {
        '@css': path.resolve(__dirname, 'src/css/'),
        '@js': path.resolve(__dirname, 'src/js/')
      }
    }
  };
};
