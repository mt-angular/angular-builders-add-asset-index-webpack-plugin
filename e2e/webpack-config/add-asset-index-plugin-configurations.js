"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// to not compile it in the dist folder again. It will be compile already in the e2e.spec
const add_asset_index_plugin_1 = require("../../dist/add-asset-index-plugin");
const path_1 = __importDefault(require("path"));
const node_util_1 = require("@upradata/node-util");
// I use util-dist instead of util because in this tsconfig I didn't put a outDir, then it would compile close to the original file
const webpack_common_1 = require("./webpack.common");
const root = path_1.default.resolve(__dirname, '..');
function addAssetIndexPluginList(option) {
    const configs = [];
    const defaultParametersOneBlob = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/**/*.woff2'))
        }], {
        root: root,
        buildOptions: {
            index: path_1.default.join(root, node_util_1.pathNormalize('src/index.html'))
        },
        baseWebpackConfig: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: defaultParametersOneBlob,
        title: 'AddAssetIndexPlugin default parameters with one blob',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'defaultParametersOneBlob')
    });
    const defaultParametersFewBlobs = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/libre-franklin/*.woff2'))
        },
        {
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/rubik/*.woff2'))
        }], {
        root: root,
        buildOptions: {
            index: path_1.default.join(root, node_util_1.pathNormalize('src/index.html'))
        },
        baseWebpackConfig: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: defaultParametersFewBlobs,
        title: 'AddAssetIndexPlugin default parameters with few blobs',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'defaultParametersFewBlobs')
    });
    const defaultParametersFewFiles = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/rubik/rubik-v7-latin-300.woff2'))
        },
        {
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/rubik/rubik-v7-latin-400.woff2'))
        },
        {
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/rubik/rubik-v7-latin-500.woff2'))
        }], {
        root: root,
        buildOptions: {
            index: path_1.default.join(root, node_util_1.pathNormalize('src/index.html'))
        },
        baseWebpackConfig: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: defaultParametersFewFiles,
        title: 'AddAssetIndexPlugin default parameters with few files',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'defaultParametersFewFiles')
    });
    const oneBlobWithGenericbuildOptions = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/**/*.woff2'))
        }], {
        root: root,
        buildOptions: {
            index: path_1.default.join(root, node_util_1.pathNormalize('src/index.html')),
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
        baseWebpackConfig: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: oneBlobWithGenericbuildOptions,
        title: 'AddAssetIndexPlugin one blob with generic buildOptions',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'oneBlobWithGenericbuildOptions')
    });
    const fewBlobsWithAssetbuildOptions = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/libre-franklin/*.woff2')),
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
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/rubik/*.woff2')),
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
        buildOptions: {
            index: path_1.default.join(root, node_util_1.pathNormalize('src/index.html')),
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
        baseWebpackConfig: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: fewBlobsWithAssetbuildOptions,
        title: 'AddAssetIndexPlugin few blobs with asset specific buildOptions overriding generic buildOptions',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'fewBlobsWithAssetbuildOptions')
    });
    const oneBlobWithAssetOptionOutputDir = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/**/*.woff2')),
            attributes: {
                as: 'font',
                rel: 'preload',
            },
            outputDir: (filepath) => {
                const split = filepath.split('assets/font/');
                const newpath = path_1.default.join('bust-cache-asset/font', split[1]);
                return path_1.default.dirname(newpath);
            }
        },
    ], {
        root: root,
        buildOptions: {
            index: path_1.default.join(root, node_util_1.pathNormalize('src/index.html')),
        },
        baseWebpackConfig: {
            mode: option.mode
        }
    });
    configs.push({
        configuration: oneBlobWithAssetOptionOutputDir,
        title: 'AddAssetIndexPlugin one blob with asset specific option outputDir',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'oneBlobWithAssetOptionOutputDir')
    });
    return configs;
}
exports.addAssetIndexPluginList = addAssetIndexPluginList;
//# sourceMappingURL=add-asset-index-plugin-configurations.js.map