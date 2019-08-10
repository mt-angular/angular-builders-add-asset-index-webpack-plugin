import  path from 'path';
import { AddAssetIndexPlugin, AssetResolved, BuilderParameters } from '../../src/add-asset-index-plugin';
import { AddAssetIndexPluginPrivate } from './add-asset-index-plugin.private';
import { Asset } from '../../src/asset';
import { AssetPrivate } from '../asset/asset.private';
import { globbyMock } from '../asset/globby.mock';
import { IndexWriter } from '../../src/index-writer';
import { WebpackCompilationMock } from '../index-writer/webpack-compilation.mock';
import { Compilation } from '../../src/common';
import { Compiler } from 'webpack';
import { ExecuteOnTempState } from '@upradata/browser-util';
import { root, createAddAssetIndexPlugin, defaultAssetOption } from './add-asset-index-plugin.mock';



describe('Test suite for AddAssetIndexPlugin', () => {

    describe('Test suite for AddAssetIndexPlugin constructor', () => {

        test('default parameters', () => {
            const builderOption: BuilderParameters = {
                root: root as any,
                buildOptions: {
                    index: path.join(root, 'src/index.html'),
                },
                baseWebpackConfig: {
                    mode: 'development' as any
                }
            };

            const getBuilderOptionsOriginal = AddAssetIndexPlugin.prototype[ 'getBuilderOptions' ];
            const getBuilderOptionsMock = jest.spyOn(AddAssetIndexPlugin.prototype, 'getBuilderOptions' as any);

            const addAssetIndexPlugin: AddAssetIndexPluginPrivate = new AddAssetIndexPlugin(defaultAssetOption, builderOption) as any;

            expect(getBuilderOptionsMock).toHaveBeenCalledTimes(1);
            expect(addAssetIndexPlugin.root).toBe(root);
            expect(addAssetIndexPlugin.option.input).toBe(path.resolve(root, builderOption.buildOptions.index));
            expect(addAssetIndexPlugin.option.output).toBe(path.basename(builderOption.buildOptions.index));

            AddAssetIndexPlugin.prototype[ 'getBuilderOptions' ] = getBuilderOptionsOriginal;
        });


        test('all parameters', () => {
            const baseHref = 'a/b/c';
            const deployUrl = 'public/dist';
            const hash = true;
            const place = 'body';
            const subresourceIntegrity = true;
            const attributes = { as: 'font', rel: 'preload' };


            const addAssetIndexPlugin = createAddAssetIndexPlugin(
                undefined,
                {
                    param: {
                        buildOptions: {
                            baseHref, deployUrl, subresourceIntegrity, hash, place, attributes
                        }
                    }
                }
            );

            expect(addAssetIndexPlugin.assetsOption).toEqual(expect.arrayContaining([ defaultAssetOption ]));

            expect(addAssetIndexPlugin.option).toEqual(expect.objectContaining({
                baseHref,
                deployUrl,
                sri: subresourceIntegrity,
                hash,
                place,
                attributes
            }));
        });


        test('Webpack mode = production should set hash to true', () => {
            const addAssetIndexPlugin = createAddAssetIndexPlugin(undefined,
                {
                    param: { baseWebpackConfig: { mode: 'production' } }
                });

            expect(addAssetIndexPlugin.option.hash).toBe(true);
        });
    });


    describe('Test suite for apply method', () => {

        function createCompiler() {
            const compilation = new WebpackCompilationMock().init().compilation;

            const tapPromise = jest.fn().mockImplementation(async (tapOption, cb: (compilation: Compilation) => void) => {
                await cb(compilation as Compilation);
            });

            const compiler = { hooks: { emit: { tapPromise } } };

            return { compilation: compilation as any as Compilation, compiler: compiler as any as Compiler };
        }

        async function createIndexWriteMockTemp(asyncCallback: () => void) {
            new ExecuteOnTempState().state({ obj: IndexWriter.prototype, tmpState: { writeInIndex: jest.fn() } })
                .execute(async () => await asyncCallback());
        }

        test('apply is calling all the submethods needed to init and execute the main logic', async () => {
            await createIndexWriteMockTemp(() => {

                const addAssetIndexPlugin = createAddAssetIndexPlugin();

                const handleEmitMock = addAssetIndexPlugin.handleEmit = jest.fn();

                const { compilation, compiler } = createCompiler();
                addAssetIndexPlugin.apply(compiler);

                expect(handleEmitMock).toHaveBeenCalledTimes(1);
                expect(handleEmitMock).toHaveBeenCalledWith(compilation);
            });
        });


        test('handleEmit is calling all the submethods needed to init and execute the main logic', async () => {
            await createIndexWriteMockTemp(async () => {

                const addFileToAssetsOriginal = (Asset.prototype as any as AssetPrivate).addFileToAssets;
                (Asset.prototype as any as AssetPrivate).addFileToAssets =
                    jest.fn().mockReturnValue([]);

                const filepaths = [
                    { filepath: 'a1/b.png' },
                    { filepath: 'a2/**/*.png' },
                    { filepath: 'a3/b.png' }
                ];

                const addAssetIndexPlugin = createAddAssetIndexPlugin({
                    param: filepaths
                });

                addAssetIndexPlugin.addAllAssetsToCompilation = jest.fn().mockReturnValueOnce([]);

                const { compilation } = createCompiler();
                await addAssetIndexPlugin.handleEmit(compilation);

                expect(addAssetIndexPlugin.assets.length).toBe(3);
                expect(addAssetIndexPlugin.addAllAssetsToCompilation).toHaveBeenCalledTimes(1);
                expect(addAssetIndexPlugin.indexWriter.writeInIndex).toHaveBeenCalledTimes(1);

                (Asset.prototype as any as AssetPrivate).addFileToAssets = addFileToAssetsOriginal;
            });
        });

        test('apply is calling indexWriter.writeInIndex with assetsResolved', async () => {
            await createIndexWriteMockTemp(async () => {
                const addFileToAssetsMock = async function () {
                    const filepath: string = this.option.filepath;

                    if (filepath.includes('*'))
                        return globbyMock(filepath);

                    return [ filepath ];
                };


                const addFileToAssetsOriginal = (Asset.prototype as any as AssetPrivate).addFileToAssets;
                (Asset.prototype as any as AssetPrivate).addFileToAssets =
                    jest.fn().mockImplementation(addFileToAssetsMock);


                const filepaths = [
                    { filepath: 'a1/b.png' },
                    { filepath: 'a2/**/*.png' },
                    { filepath: 'a3/b.png' }
                ];

                const addAssetIndexPlugin = createAddAssetIndexPlugin({
                    param: filepaths
                });

                const { compilation } = createCompiler();
                await addAssetIndexPlugin.handleEmit(compilation);

                const assetsResolved: AssetResolved[] = [];

                for (let i = 0; i < filepaths.length; ++i) {
                    const asset = { option: { filepath: filepaths[ i ].filepath } };
                    const resolvedPaths = await addFileToAssetsMock.call(asset);

                    for (const resolvedPath of resolvedPaths)
                        assetsResolved.push({ asset: addAssetIndexPlugin.assets[ i ], resolvedPath });
                }


                expect(addAssetIndexPlugin.indexWriter.writeInIndex).toHaveBeenCalledWith(assetsResolved);

                (Asset.prototype as any as AssetPrivate).addFileToAssets = addFileToAssetsOriginal;
            });
        });
    });
});
