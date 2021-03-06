// to not compile it in the dist folder again. It will be compile already in the e2e.spec
import { AddAssetIndexPlugin, BuilderOptionsNeeded } from '../../dist/add-asset-index-plugin';
import path from 'path';
import { pathNormalize } from '@upradata/node-util';
// I use util-dist instead of util because in this tsconfig I didn't put a outDir, then it would compile close to the original file
import { dist, Mode } from './webpack.common';
import { Transforms } from '@ud-angular-builders/custom-webpack/dist/transforms';
import { ensureFileSync } from 'fs-extra';

export interface Configuration {
    configuration: AddAssetIndexPlugin;
    title: string;
    outputDir: string;
    tmpFile: string;
}


const root = path.resolve(__dirname, '..');
const builderContext = { workspaceRoot: root };

const buildOptions = (): BuilderOptionsNeeded => {
    const buildO = {} as BuilderOptionsNeeded;
    // indexTransforms.options.indexTransforms === indexTransforms === buildOptions.indexTransforms;
    const indexTransforms = new Transforms(buildO as any, builderContext as any);

    return buildO;
};


export const assetDir = path.join(root, 'tmpdir-asset');

const tmpFile = (mode: Mode, name: string) => {
    const file = path.join(assetDir, mode, name);
    ensureFileSync(file);

    return file;
};

export function addAssetIndexPluginList(option: { mode: Mode }): Configuration[] {
    const configs: Configuration[] = [];


    const defaultParametersOneBlob = new AddAssetIndexPlugin(
        [ {
            filepath: path.resolve(root, pathNormalize('assets/font/**/*.woff2'))
        } ], {
            builderContext,
            buildOptions: buildOptions(),
            baseWebpackConfig: {
                mode: option.mode
            }
        },
        {
            tmpFile: tmpFile(option.mode, 'defaultParametersOneBlob.json')
        }
    );


    configs.push({
        configuration: defaultParametersOneBlob,
        title: 'AddAssetIndexPlugin default parameters with one blob: defaultParametersOneBlob',
        outputDir: path.join(dist(option.mode), 'defaultParametersOneBlob'),
        tmpFile: tmpFile(option.mode, 'defaultParametersOneBlob.json')
    });



    const defaultParametersFewBlobs = new AddAssetIndexPlugin(
        [ {
            filepath: path.resolve(root, pathNormalize('assets/font/libre-franklin/*.woff2'))
        },
        {
            filepath: path.resolve(root, pathNormalize('assets/font/rubik/*.woff2'))
        } ], {
            builderContext,
            buildOptions: buildOptions(),
            baseWebpackConfig: {
                mode: option.mode
            }
        },
        {
            tmpFile: tmpFile(option.mode, 'defaultParametersFewBlobs.json')
        });


    configs.push({
        configuration: defaultParametersFewBlobs,
        title: 'AddAssetIndexPlugin default parameters with few blobs:defaultParametersFewBlobs',
        outputDir: path.join(dist(option.mode), 'defaultParametersFewBlobs'),
        tmpFile: tmpFile(option.mode, 'defaultParametersFewBlobs.json')
    });






    const defaultParametersFewFiles = new AddAssetIndexPlugin(
        [ {
            filepath: path.resolve(root, pathNormalize('assets/font/rubik/rubik-v7-latin-300.woff2'))
        },
        {
            filepath: path.resolve(root, pathNormalize('assets/font/rubik/rubik-v7-latin-400.woff2'))
        },
        {
            filepath: path.resolve(root, pathNormalize('assets/font/rubik/rubik-v7-latin-500.woff2'))
        } ], {
            builderContext,
            buildOptions: buildOptions(),
            baseWebpackConfig: {
                mode: option.mode
            }
        },
        {
            tmpFile: tmpFile(option.mode, 'defaultParametersFewFiles.json')
        });


    configs.push({
        configuration: defaultParametersFewFiles,
        title: 'AddAssetIndexPlugin default parameters with few files: defaultParametersFewFiles',
        outputDir: path.join(dist(option.mode), 'defaultParametersFewFiles'),
        tmpFile: tmpFile(option.mode, 'defaultParametersFewFiles.json')
    });




    const oneBlobWithGenericBuildOptions = new AddAssetIndexPlugin(
        [ {
            filepath: path.resolve(root, pathNormalize('assets/font/**/*.woff2'))
        } ], {
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
        },
        {
            tmpFile: tmpFile(option.mode, 'oneBlobWithGenericBuildOptions.json')
        });




    configs.push({
        configuration: oneBlobWithGenericBuildOptions,
        title: 'AddAssetIndexPlugin one blob with generic buildOptions: oneBlobWithGenericBuildOptions',
        outputDir: path.join(dist(option.mode), 'oneBlobWithGenericBuildOptions'),
        tmpFile: tmpFile(option.mode, 'oneBlobWithGenericBuildOptions.json')
    });



    const fewBlobsWithAssetBuildOptions = new AddAssetIndexPlugin(
        [ {
            filepath: path.resolve(root, pathNormalize('assets/font/libre-franklin/*.woff2')),
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
            filepath: path.resolve(root, pathNormalize('assets/font/rubik/*.woff2')),
            attributes: {
                as: 'font',
                rel: 'preload',
                speed: 'super-fast'
            },
            deployUrl: 'public/deploy/rubik',
            place: 'body',
            sri: false
        } ], {
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
        },
        {
            tmpFile: tmpFile(option.mode, 'fewBlobsWithAssetBuildOptions.json')
        });


    configs.push({
        configuration: fewBlobsWithAssetBuildOptions,
        title: 'AddAssetIndexPlugin few blobs with asset specific buildOptions overriding generic buildOptions: fewBlobsWithAssetBuildOptions',
        outputDir: path.join(dist(option.mode), 'fewBlobsWithAssetBuildOptions'),
        tmpFile: tmpFile(option.mode, 'fewBlobsWithAssetBuildOptions.json')
    });




    const oneBlobWithAssetOptionOutputDir = new AddAssetIndexPlugin(
        [ {
            filepath: path.resolve(root, pathNormalize('assets/font/**/*.woff2')),
            attributes: {
                as: 'font',
                rel: 'preload',
            },
            outputDir: (filepath: string) => {
                const split = filepath.split('assets/font/');
                const newpath = path.join('bust-cache-asset/font', split[ 1 ]);

                return path.dirname(newpath);
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
        },
        {
            tmpFile: tmpFile(option.mode, 'oneBlobWithAssetOptionOutputDir.json')
        });


    configs.push({
        configuration: oneBlobWithAssetOptionOutputDir,
        title: 'AddAssetIndexPlugin one blob with asset specific option outputDir: oneBlobWithAssetOptionOutputDir',
        outputDir: path.join(dist(option.mode), 'oneBlobWithAssetOptionOutputDir'),
        tmpFile: tmpFile(option.mode, 'oneBlobWithAssetOptionOutputDir.json')
    });




    return configs;
}
