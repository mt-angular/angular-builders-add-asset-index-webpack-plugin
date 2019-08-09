"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// to not compile it in the dist folder again. It will be compile already in the e2e.spec
const add_asset_index_plugin_1 = require("../../dist/src/add-asset-index-plugin");
const path = require("path");
const path_normalize_1 = require("../../linked_modules/@mt/node-util-dist/path-normalize");
// I use util-dist instead of util because in this tsconfig I didn't put a outDir, then it would compile close to the original file
const webpack_common_1 = require("./webpack.common");
const root = path.resolve(__dirname, '..');
function addAssetIndexPlugin(option) {
    const configs = [];
    const defaultParametersBlob = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path.resolve(root, path_normalize_1.pathNormalize('assets/font/**/*.woff2'))
        }], {
        root: root,
        options: {
            index: path.join(root, path_normalize_1.pathNormalize('src/index.html'))
        },
        webpackConfiguration: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: defaultParametersBlob,
        title: 'AddAssetIndexPlugin default parameters with one blob',
        outputDir: path.join(webpack_common_1.dist(option.mode), 'defaultParametersBlob')
    });
    const defaultParametersFewBlobs = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path.resolve(root, path_normalize_1.pathNormalize('assets/font/libre-franklin/*.woff2'))
        },
        {
            filepath: path.resolve(root, path_normalize_1.pathNormalize('assets/font/rubik/*.woff2'))
        }], {
        root: root,
        options: {
            index: path.join(root, path_normalize_1.pathNormalize('src/index.html'))
        },
        webpackConfiguration: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: defaultParametersFewBlobs,
        title: 'AddAssetIndexPlugin default parameters with few blobs',
        outputDir: path.join(webpack_common_1.dist(option.mode), 'defaultParametersFewBlobs')
    });
    const defaultParametersFewFiles = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path.resolve(root, path_normalize_1.pathNormalize('assets/font/rubik/rubik-v7-latin-300.woff2'))
        },
        {
            filepath: path.resolve(root, path_normalize_1.pathNormalize('assets/font/rubik/rubik-v7-latin-400.woff2'))
        },
        {
            filepath: path.resolve(root, path_normalize_1.pathNormalize('assets/font/rubik/rubik-v7-latin-500.woff2'))
        }], {
        root: root,
        options: {
            index: path.join(root, path_normalize_1.pathNormalize('src/index.html'))
        },
        webpackConfiguration: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: defaultParametersFewFiles,
        title: 'AddAssetIndexPlugin default parameters with few files',
        outputDir: path.join(webpack_common_1.dist(option.mode), 'defaultParametersFewFiles')
    });
    const oneBlobWithGenericOptions = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path.resolve(root, path_normalize_1.pathNormalize('assets/font/**/*.woff2'))
        }], {
        root: root,
        options: {
            index: path.join(root, path_normalize_1.pathNormalize('src/index.html')),
            subresourceIntegrity: false,
            baseHref: 'public/base',
            deployUrl: 'public/deploy',
            attributes: {
                as: 'font',
                rel: 'preload'
            },
            hash: true,
            place: 'head'
        },
        webpackConfiguration: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: oneBlobWithGenericOptions,
        title: 'AddAssetIndexPlugin one blob with generic options',
        outputDir: path.join(webpack_common_1.dist(option.mode), 'oneBlobWithGenericOptions')
    });
    const fewBlobsWithAssetOptions = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path.resolve(root, path_normalize_1.pathNormalize('assets/font/libre-franklin/*.woff2')),
            attributes: {
                as: 'font',
                rel: 'preload',
                speed: 'super-fast'
            },
            deployUrl: 'public/deploy/libre-franklin',
            hash: true,
            place: 'head',
            sri: true
        },
        {
            filepath: path.resolve(root, path_normalize_1.pathNormalize('assets/font/rubik/*.woff2')),
            attributes: {
                as: 'font',
                rel: 'preload',
                speed: 'super-fast'
            },
            deployUrl: 'public/deploy/rubik',
            place: 'body',
            sri: false
        }], {
        root: root,
        options: {
            index: path.join(root, path_normalize_1.pathNormalize('src/index.html')),
            subresourceIntegrity: false,
            baseHref: 'public/base0',
            deployUrl: 'public/deploy0',
            attributes: {
                as: 'style',
                rel: 'prefetch',
                network: 'global'
            },
            hash: false,
            place: 'head'
        },
        webpackConfiguration: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: fewBlobsWithAssetOptions,
        title: 'AddAssetIndexPlugin few blobs with asset specific options overriding generic options',
        outputDir: path.join(webpack_common_1.dist(option.mode), 'fewBlobsWithAssetOptions')
    });
    const oneBlobWithAssetOptionOutputDir = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path.resolve(root, path_normalize_1.pathNormalize('assets/font/**/*.woff2')),
            attributes: {
                as: 'font',
                rel: 'preload',
            },
            outputDir: (filepath) => {
                const split = filepath.split('assets/font/');
                const newpath = path.join('bust-cache-asset/font', split[1]);
                return path.dirname(newpath);
            }
        },
    ], {
        root: root,
        options: {
            index: path.join(root, path_normalize_1.pathNormalize('src/index.html')),
        },
        webpackConfiguration: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: oneBlobWithAssetOptionOutputDir,
        title: 'AddAssetIndexPlugin one blob with asset specific option outputDir',
        outputDir: path.join(webpack_common_1.dist(option.mode), 'oneBlobWithAssetOptionOutputDir')
    });
    return configs;
}
exports.addAssetIndexPlugin = addAssetIndexPlugin;
//# sourceMappingURL=add-asset-index-plugin-configurations.js.map