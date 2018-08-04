// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const webpack = require('webpack');
const bundleCss = new ExtractTextWebpackPlugin('css/bundle.min.css');
const dirs = {
  src: path.join(__dirname, '../src'),
  dest: path.join(__dirname, '../dist'),
};
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: 'css/bundle.min',
          test: /\.css$/,
          chunks: 'all',
          priority: 1000,
          enforce: true
        }
      }
    }
  },
  context: path.join(__dirname, './'),
  watchOptions: {
    ignored: /node_modules/,
    poll: true
  },
  entry: {
    index: `${dirs.src}/js/index.js`,
    restaurant_info: `${dirs.src}/js/restaurant_info.js`,
    style: glob.sync(`${dirs.src}/**/*.css`),
  },
  output: {
    filename: 'js/[name].js',
    path: `${dirs.dest}`,
  },
  devtool: 'cheap-eval-source-map',
  devServer: {
    compress: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    },
    open: true,
    overlay: {
      warnings: true,
      errors: true
    },
    hot: true,
    port: 8000
  },
  module: {
    noParse: /node_modules\/localforage\/dist\/localforage.js/,
    rules: [
      {
        test: /\.html$/,
        use: {
          loader: 'html-loader?cacheDirectory',
          options: {
            minimize: true
          }
        }
      },
      {
        test: /\.css$/,
        use: bundleCss.extract({
          fallback: 'style-loader',
          use: 'css-loader',
        }),
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader?cacheDirectory',
        },{
          loader: 'eslint-loader',
        }],
      }/*,
      {
        test: /\.s?[ac]ss$/,
        use: [{
          loader: MiniCssExtractPlugin.loader, options: {
            interpolate: true, sourceMap: true
          }
        }, {
          loader: 'style-loader', options: {interpolate: true,
            sourceMap: true
          }},
        {
          loader: 'css-loader', options: {interpolate: true,
            sourceMap: true
          }
        }, {
          loader: 'sass-loader', options: {interpolate: true,
            sourceMap: true
          }
        }]
      }*/,
      {
        test: /\.(jpe?g|png|webp|ttf|eot|svg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 8000, // Convert images < 8kb to base64 strings
            name: 'img/[name].[ext]'
          }
        }]
      }
    ],
  },
  plugins: [
    /*new CleanWebpackPlugin( [
      'dist/*.*',
    ],{ root: path.resolve(__dirname , '..'), verbose: true,
      dry: false }),*/

    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new CopyWebpackPlugin([
      {
        root: path.resolve(__dirname , '..'),
        from: path.resolve('./src' , 'img'),
        to: './img'
      }, {
        root: path.resolve(__dirname , '..'),
        from: path.resolve('./src' , 'sw.js'),
      }
    ]),
    new HtmlWebpackPlugin({
      //chunks: ['index', 'home'],
      template: `${dirs.src}/index.html`,
      inject: false,
      filename: `${dirs.dest}/index.html`
    }),
    new HtmlWebpackPlugin({
      //chunks: ['index', 'home'],
      template: `${dirs.src}/restaurant.html`,
      inject: false,
      filename: `${dirs.dest}/restaurant.html`
    }),bundleCss,
    new ImageminPlugin({
      test: /\.(jpe?g|png|webp|ttf|eot|svg|gif)(\?v=[0-9]\.[0-9]\.[0-9])?$/i,
      disable: process.env.NODE_ENV !== 'production'
    }),
    //new BundleAnalyzerPlugin(),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css'
    }),
    new CompressionPlugin({
      test: /\.(js|css)/
    })
  ],
};
