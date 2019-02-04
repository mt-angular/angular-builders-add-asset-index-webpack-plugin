const { AddAssetIndexPlugin } = require('../dist/add-asset-index-plugin');
const path = require('path');


const webpackConfig = {
    entry: path.resolve('src/index.js'),
    output: {
        path: path.resolve('dist'),
        filename: 'index_bundle.js',
    },
    /*  module: {
         rules: [
             {
                 test: /\.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani)$/,
                 loader: 'file-loader',
                 options: {
                     name: `[name][hash].[ext]`,
                 },
             }
         ],
     }, */
    plugins: [
        new AddAssetIndexPlugin([{ filepath: 'assets/font/**/*.woff2', as: 'font', hash: true }], {
            root: __dirname,
            options: {
                index: '/home/milottit/Projects/IFA/webpack/test/src/index.html',
                subresourceIntegrity: false,
                baseHref: undefined,
                deployUrl: undefined
            }

        })

        // new AddAssetIndexPlugin([{ filepath: 'assets/font/**/*.woff2', attributes: { as: 'font' } }], { indexName: path.resolve('src/index.html') })
    ],
};

module.exports = webpackConfig;
