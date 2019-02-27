// const webpack = require('webpack');
const path = require('path');
const { AddAssetIndexPlugin } = require('../dist/src/add-asset-index-plugin');


console.log('Extra Webpack : Thomas Milotti :)');


module.exports = (builderParameters) => {

    return {
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
                    filepath: 'src/assets/font/**/*.woff2',
                    /* attributes: {
                        as: 'font',
                        rel: 'preload',
                        speed: 'super-fast'
                    },
                    deployUrl: 'public/deploy/libre-franklin',
                    hash: true,
                    place: 'head',
                    sri: true */
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
