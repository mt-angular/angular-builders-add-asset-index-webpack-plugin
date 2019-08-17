// const webpack = require('webpack');
const path = require('path');
const { AddAssetIndexPlugin } = require('../dist/add-asset-index-plugin');


console.log('Extra Webpack : Thomas Milotti :)');


module.exports = builderParameters => {

    return {
        /*  module: {
             rules: [
                 {
                     // test: /\.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani)$/,
                     test: /\.css$/,
                     loader: 'css-loader',
                     options: {
                         name: `[name][hash].[ext]`,
                     },
                 }
             ],
         }, */
        plugins: [
            /* new webpack.DefinePlugin({
              ENVIRONMENT: JSON.stringify('browser')
            }),
            new webpack.NormalModuleReplacementPlugin(/(.*)\$environment\$(\.*)/, function (resource) {
              resource.request = resource.request.replace(/\$environment\$/, 'browser');
            }), */
            // new AddAssetHtmlPlugin({ filepath: path.resolve('./assets/font/**/*.woff2') })

            new AddAssetIndexPlugin([
                {
                    // filepath: 'src/font/**/*.woff2',
                    filepath: 'src/font/**/*.woff2',
                    attributes: {
                        as: 'font',
                        rel: 'preload',
                        // speed: 'super-fast'
                    },
                    /* deployUrl: 'public/deploy/libre-franklin',
                    hash: true,
                    place: 'head',
                    sri: true */
                    outputDir: filepath => {
                        const split = filepath.split('src/font/');
                        const newpath = path.join('assets/bust-cached-font', split[1]);

                        console.log(filepath, newpath);
                        return path.dirname(newpath);
                    }
                }
            ], builderParameters)
        ],

        /* resolve: {
          alias: {
            theme: path.join(__dirname, 'src', 'theme')
          },
        // symlinks: false
      }*/
    };

};
