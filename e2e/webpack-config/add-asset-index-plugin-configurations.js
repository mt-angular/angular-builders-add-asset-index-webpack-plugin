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
const transforms_1 = require("@ud-angular-builders/custom-webpack/dist/transforms");
const fs_extra_1 = require("fs-extra");
const root = path_1.default.resolve(__dirname, '..');
const builderContext = { workspaceRoot: root };
const buildOptions = () => {
    const buildO = {};
    // indexTransforms.options.indexTransforms === indexTransforms === buildOptions.indexTransforms;
    const indexTransforms = new transforms_1.Transforms(buildO, builderContext);
    return buildO;
};
exports.assetDir = path_1.default.join(root, 'tmpdir-asset');
const tmpFile = (mode, name) => {
    const file = path_1.default.join(exports.assetDir, mode, name);
    fs_extra_1.ensureFileSync(file);
    return file;
};
function addAssetIndexPluginList(option) {
    const configs = [];
    const defaultParametersOneBlob = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/**/*.woff2'))
        }], {
        builderContext,
        buildOptions: buildOptions(),
        baseWebpackConfig: {
            mode: option.mode
        }
    }, {
        tmpFile: tmpFile(option.mode, 'defaultParametersOneBlob.json')
    });
    configs.push({
        configuration: defaultParametersOneBlob,
        title: 'AddAssetIndexPlugin default parameters with one blob: defaultParametersOneBlob',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'defaultParametersOneBlob'),
        tmpFile: tmpFile(option.mode, 'defaultParametersOneBlob.json')
    });
    const defaultParametersFewBlobs = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/libre-franklin/*.woff2'))
        },
        {
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/rubik/*.woff2'))
        }], {
        builderContext,
        buildOptions: buildOptions(),
        baseWebpackConfig: {
            mode: option.mode
        }
    }, {
        tmpFile: tmpFile(option.mode, 'defaultParametersFewBlobs.json')
    });
    configs.push({
        configuration: defaultParametersFewBlobs,
        title: 'AddAssetIndexPlugin default parameters with few blobs:defaultParametersFewBlobs',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'defaultParametersFewBlobs'),
        tmpFile: tmpFile(option.mode, 'defaultParametersFewBlobs.json')
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
        builderContext,
        buildOptions: buildOptions(),
        baseWebpackConfig: {
            mode: option.mode
        }
    }, {
        tmpFile: tmpFile(option.mode, 'defaultParametersFewFiles.json')
    });
    configs.push({
        configuration: defaultParametersFewFiles,
        title: 'AddAssetIndexPlugin default parameters with few files: defaultParametersFewFiles',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'defaultParametersFewFiles'),
        tmpFile: tmpFile(option.mode, 'defaultParametersFewFiles.json')
    });
    const oneBlobWithGenericBuildOptions = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
            filepath: path_1.default.resolve(root, node_util_1.pathNormalize('assets/font/**/*.woff2'))
        }], {
        builderContext,
        buildOptions: Object.assign(buildOptions(), {
            // index: path.join(root, pathNormalize('src/index.html')),
            subresourceIntegrity: false,
            baseHref: 'public/base',
            deployUrl: 'public/deploy',
            attributes: {
                as: 'font',
                rel: 'preload'
            },
            hash: true,
            place: 'head'
        }),
        baseWebpackConfig: {
            mode: option.mode
        }
    }, {
        tmpFile: tmpFile(option.mode, 'oneBlobWithGenericBuildOptions.json')
    });
    configs.push({
        configuration: oneBlobWithGenericBuildOptions,
        title: 'AddAssetIndexPlugin one blob with generic buildOptions: oneBlobWithGenericBuildOptions',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'oneBlobWithGenericBuildOptions'),
        tmpFile: tmpFile(option.mode, 'oneBlobWithGenericBuildOptions.json')
    });
    const fewBlobsWithAssetBuildOptions = new add_asset_index_plugin_1.AddAssetIndexPlugin([{
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
        builderContext,
        buildOptions: Object.assign(buildOptions(), {
            // index: path.join(root, pathNormalize('src/index.html')),
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
        }),
        baseWebpackConfig: {
            mode: option.mode
        }
    }, {
        tmpFile: tmpFile(option.mode, 'fewBlobsWithAssetBuildOptions.json')
    });
    configs.push({
        configuration: fewBlobsWithAssetBuildOptions,
        title: 'AddAssetIndexPlugin few blobs with asset specific buildOptions overriding generic buildOptions: fewBlobsWithAssetBuildOptions',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'fewBlobsWithAssetBuildOptions'),
        tmpFile: tmpFile(option.mode, 'fewBlobsWithAssetBuildOptions.json')
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
        builderContext,
        buildOptions: Object.assign(buildOptions(), {
        // index: path.join(root, pathNormalize('src/index.html')),
        }),
        baseWebpackConfig: {
            mode: option.mode
        }
    }, {
        tmpFile: tmpFile(option.mode, 'oneBlobWithAssetOptionOutputDir.json')
    });
    configs.push({
        configuration: oneBlobWithAssetOptionOutputDir,
        title: 'AddAssetIndexPlugin one blob with asset specific option outputDir: oneBlobWithAssetOptionOutputDir',
        outputDir: path_1.default.join(webpack_common_1.dist(option.mode), 'oneBlobWithAssetOptionOutputDir'),
        tmpFile: tmpFile(option.mode, 'oneBlobWithAssetOptionOutputDir.json')
    });
    return configs;
}
exports.addAssetIndexPluginList = addAssetIndexPluginList;
//# sourceMappingURL=add-asset-index-plugin-configurations.js.map