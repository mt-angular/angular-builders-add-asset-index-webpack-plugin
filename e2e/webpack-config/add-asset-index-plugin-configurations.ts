// to not compile it in the dist folder again. It will be compile already in the e2e.spec
import { AddAssetIndexPlugin } from '../../dist/add-asset-index-plugin';
import path from 'path';
import { pathNormalize } from '@upradata/node-util';
// I use util-dist instead of util because in this tsconfig I didn't put a outDir, then it would compile close to the original file
import { dist, Mode } from './webpack.common';


export interface Configuration {
    configuration: AddAssetIndexPlugin;
    title: string;
    outputDir: string;
}


const root = path.resolve(__dirname, '..');

export function addAssetIndexPluginList(option: { mode: Mode }): Configuration[] {
    const configs: Configuration[] = [];



    const defaultParametersOneBlob = new AddAssetIndexPlugin(
        [ {
            filepath: path.resolve(root, pathNormalize('assets/font/**/*.woff2'))
        } ], {
            root: root as any,
            buildOptions: {
                index: path.join(root, pathNormalize('src/index.html'))
            },
            baseWebpackConfig: {
                mode: option.mode
            }
        });


    configs.push({
        configuration: defaultParametersOneBlob,
        title: 'AddAssetIndexPlugin default parameters with one blob',
        outputDir: path.join(dist(option.mode), 'defaultParametersOneBlob')
    });



    const defaultParametersFewBlobs = new AddAssetIndexPlugin(
        [ {
            filepath: path.resolve(root, pathNormalize('assets/font/libre-franklin/*.woff2'))
        },
        {
            filepath: path.resolve(root, pathNormalize('assets/font/rubik/*.woff2'))
        } ], {
            root: root as any,
            buildOptions: {
                index: path.join(root, pathNormalize('src/index.html'))
            },
            baseWebpackConfig: {
                mode: option.mode
            }
        });

    configs.push({
        configuration: defaultParametersFewBlobs,
        title: 'AddAssetIndexPlugin default parameters with few blobs',
        outputDir: path.join(dist(option.mode), 'defaultParametersFewBlobs')
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
            root: root as any,
            buildOptions: {
                index: path.join(root, pathNormalize('src/index.html'))
            },
            baseWebpackConfig: {
                mode: option.mode
            }
        });


    configs.push({
        configuration: defaultParametersFewFiles,
        title: 'AddAssetIndexPlugin default parameters with few files',
        outputDir: path.join(dist(option.mode), 'defaultParametersFewFiles')
    });




    const oneBlobWithGenericbuildOptions = new AddAssetIndexPlugin(
        [ {
            filepath: path.resolve(root, pathNormalize('assets/font/**/*.woff2'))
        } ], {
            root: root as any,
            buildOptions: {
                index: path.join(root, pathNormalize('src/index.html')),
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
        outputDir: path.join(dist(option.mode), 'oneBlobWithGenericbuildOptions')
    });



    const fewBlobsWithAssetbuildOptions = new AddAssetIndexPlugin(
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
            root: root as any,
            buildOptions: {
                index: path.join(root, pathNormalize('src/index.html')),
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
        outputDir: path.join(dist(option.mode), 'fewBlobsWithAssetbuildOptions')
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
            root: root as any,
            buildOptions: {
                index: path.join(root, pathNormalize('src/index.html')),
            },
            baseWebpackConfig: {
                mode: option.mode
            }
        });


    configs.push({
        configuration: oneBlobWithAssetOptionOutputDir,
        title: 'AddAssetIndexPlugin one blob with asset specific option outputDir',
        outputDir: path.join(dist(option.mode), 'oneBlobWithAssetOptionOutputDir')
    });




    return configs;
}
