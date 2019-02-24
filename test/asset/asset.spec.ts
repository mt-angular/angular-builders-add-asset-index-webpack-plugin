import * as path from 'path';
import { WebpackCompilationMock } from '../index-writer/webpack-compilation.mock';
import { AssetOption, Asset } from '../../src/asset';
import { pluginName, hash } from '../../src/common';
import { assignRecursive } from '../../linked_modules/@mt/util/assign';
import { AssetPrivate } from './asset.private';
import { WebpackCompilation } from '../webpack.mock';
import { ExecuteOnTempState } from '../../linked_modules/@mt/util/execute-temporary-state';
import { globbyMock } from './globby.mock';

function createAsset(root: string = __dirname, option?: Partial<AssetOption>, noDefaultOption = false): AssetPrivate {
    const compilation = new WebpackCompilationMock().init().compilation;

    const o: AssetOption = assignRecursive(
        { filepath: 'a/b/c/font.woff2' },
        noDefaultOption ? {} : {
            hash: false,
            deployUrl: '',
            sri: false,
            attributes: {},
            place: 'head'
        },
        option
    );

    return new Asset(compilation as any, root as any, o) as any;
}


describe('Test suite for Asset', () => {
    test('Asset constructor should set the option field', () => {
        const root = '/a/b/c';
        const option: AssetOption = {
            filepath: 'd/e/font.woff2',
            hash: true,
            deployUrl: 'public',
            sri: true,
            attributes: { as: 'font', rel: 'preload' },
            place: 'body'
        };

        const asset = createAsset(root, option);
        expect(asset.option).toEqual(option);

        const assetDefault = createAsset(root, undefined, true);
        const defaultOption = new AssetOption();
        defaultOption.filepath = assetDefault.option.filepath;
        expect(assetDefault.option).toEqual(defaultOption);
    });


    test('getSourceHash should return the good hash', async () => {
        const asset = createAsset();

        const buffer = Buffer.from('test');
        const bufferHash = (asset as any).getSourceHash(buffer);

        expect(bufferHash).toBe(hash(buffer, { algo: 'sha384', digest: 'hex' }).substr(0, 20));
    });


    test('getPathsFromGlob should return [] if filepath does not exist', async () => {
        const asset = createAsset();
        await expect(asset.getPathsFromGlob('file-not-exist.png')).resolves.toEqual([]);
    });


    describe('Test suite for addFileToAssets', () => {

        test('getAssetsOptionsWithGlobFetch should return no glob file ', async () => {
            const asset = createAsset(undefined, { filepath: 'a/b/c/d.png' });

            const paths = await asset.getAssetsOptionsWithGlobFetch();
            expect(paths).toEqual(expect.arrayContaining([ asset.option.filepath ]));
        });

        test('getAssetsOptionsWithGlobFetch shoudl resolve glob files ', async () => {
            const asset = createAsset(undefined, { filepath: 'a/b/c/**/d/*.png' });

            asset.getPathsFromGlob = jest.fn().mockImplementation(paths => Promise.resolve(globbyMock(paths)));

            const paths = await asset.getAssetsOptionsWithGlobFetch();

            const filepaths = globbyMock(asset.option.filepath);
            expect(paths).toEqual(expect.arrayContaining(filepaths));
        });

        test('addFileToAssets should resolved paths calling addFileToWebpackAssets', async () => {
            const asset = createAsset(undefined, { filepath: 'a/b/c/**/d/*.png' });

            asset.getPathsFromGlob = jest.fn().mockImplementation(paths => Promise.resolve(globbyMock(paths)));
            const addFileToWebpackAssetsMock = asset.addFileToWebpackAssets = jest.fn().mockImplementation(filepath => filepath);

            const resolvePaths = await asset.addFileToAssets();

            const paths = globbyMock(asset.option.filepath);
            expect(addFileToWebpackAssetsMock).toHaveBeenCalledTimes(paths.length);
            expect(resolvePaths).toEqual(expect.arrayContaining(paths));
        });
    });


    describe('Test suite for private method addFileToWebpackAssets', () => {
        async function createAssetMocksTemp(asyncCallback: (assetBuffer: Buffer) => any) {

            const assetBuffer = Buffer.from('test');

            new ExecuteOnTempState().state({
                obj: Asset,
                tmpState: {
                    readFile: jest.fn().mockImplementation(async (filepath: string) => Promise.resolve(assetBuffer)),
                    statFile: jest.fn().mockImplementation(async (filepath: string) => Promise.resolve({ size: assetBuffer.length }))
                }
            })
                .execute(async () => await asyncCallback(assetBuffer));

            /* const originals = { readFile: Asset.readFile, statFile: Asset.readFile };
    
            const assetBuffer = Buffer.from('test');
    
            Asset.readFile = jest.fn().mockImplementation(async (filepath: string) => Promise.resolve(assetBuffer));
            Asset.statFile = jest.fn().mockImplementation(async (filepath: string) => Promise.resolve({ size: assetBuffer.length }));
    
            await asyncCallback(assetBuffer);
    
            Object.assign(Asset, originals); */
        }

        test('addFileToWebpackAssets should throw an error if no filepath', async () => {
            const asset = createAsset();

            const filepath = 'anyfile.png';
            await expect(asset.addFileToWebpackAssets(filepath)).rejects.toThrow(
                pluginName + ': could not load file ' + filepath
            );
        });

        test('addFileToWebpackAssets should push the asset in webpack.compilation.assets', async () => {
            await createAssetMocksTemp(async assetBuffer => {
                const asset = createAsset();

                const filepath = 'anyfile.png';
                const a = await asset.addFileToWebpackAssets(filepath);


                const compilation: WebpackCompilation = asset.compilation as any;
                const webpackAsset = compilation.assets[ filepath ];

                expect(webpackAsset.source()).toBe(assetBuffer);
                expect(webpackAsset.size()).toBe(assetBuffer.length);
            });
        });

        test('default option & filepath relative', async () => {
            await createAssetMocksTemp(async () => {
                const asset = createAsset('/path/to/root', undefined, true);

                const filepath = 'rel/path/image.png';
                const resolvedPath = await asset.addFileToWebpackAssets(filepath);
                expect(resolvedPath).toBe(filepath);
            });
        });

        test('default option & filepath absolute', async () => {
            await createAssetMocksTemp(async () => {
                const asset = createAsset('/path/to/root', undefined, true);

                const fileRelativeToRoot = 'src/rel/path/image.png';
                const filepath = path.join('/path/to/root', fileRelativeToRoot);
                const resolvedPath = await asset.addFileToWebpackAssets(filepath);

                expect(resolvedPath).toBe(fileRelativeToRoot);
            });
        });

        test('deployUrl', async () => {
            await createAssetMocksTemp(async () => {
                const deployUrl = 'public/dir';
                const asset = createAsset('/path/to/root', { deployUrl }, true);

                const fileRelativeToDeploy = 'rel/path/image.png';
                const resolvedPath = await asset.addFileToWebpackAssets(fileRelativeToDeploy);

                expect(resolvedPath).toBe(path.join(deployUrl, fileRelativeToDeploy));
            });
        });

        test('deployUrl & hash', async () => {
            await createAssetMocksTemp(async assetBuffer => {
                const deployUrl = 'public/dir';
                const asset = createAsset('/path/to/root', { deployUrl, hash: true }, true);

                const fileRelativeToDeploy = 'rel/path/image.png';
                const resolvedPath = await asset.addFileToWebpackAssets(fileRelativeToDeploy);
                const hash = asset.getSourceHash(assetBuffer);

                expect(resolvedPath).toBe(path.join(deployUrl, path.dirname(fileRelativeToDeploy), `image.${hash}.png`));
            });
        });
    });
});
