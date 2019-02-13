import * as path from 'path';
import { WebpackCompilationMock } from './index-writer/webpack-compilation.mock';
import { AssetOption, Asset } from '../src/asset';
import { pluginName, hash } from '../src/common';

function createAsset(root: string = __dirname, option?: Partial<AssetOption>, noOption = false): Asset {
	const compilation = new WebpackCompilationMock().init().compilation;

	const o: AssetOption = Object.assign(
		noOption
			? {
					filepath: 'a/b/c/font.woff2'
				}
			: {
					filepath: 'a/b/c/font.woff2',
					hash: false,
					deployUrl: '',
					sri: false,
					attributes: {},
					place: 'head'
				},
		option
	);

	return new Asset(compilation as any, root as any, o);
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

	test('addFileToAssets should throw an error if no filepath', async () => {
		const asset = createAsset();
		(asset as any).addFileToWebpackAssets = jest.fn();

		asset.option.filepath = '';
		await expect(asset.addFileToAssets()).rejects.toThrow('No filepath defined');
	});

	test('getSourceHash should return the good hash', async () => {
		const asset = createAsset();

		const buffer = Buffer.from('test');
		const bufferHash = (asset as any).getSourceHash(buffer);

		expect(bufferHash).toBe(hash(buffer, { algo: 'sha384', digest: 'hex' }).substr(0, 20));
	});

	describe('Test suite for private method addFileToWebpackAssets', () => {
		async function createAssetMocksTemp(asyncCallback: (assetBuffer: Buffer) => any) {
			const originals = { readFile: Asset.readFile, statFile: Asset.readFile };

			const assetBuffer = Buffer.from('test');

			Asset.readFile = jest.fn().mockImplementation(async () => Promise.resolve(assetBuffer));
			Asset.statFile = jest.fn().mockImplementation(async () => Promise.resolve({ size: assetBuffer.length }));

			await asyncCallback(assetBuffer);

			Object.assign(Asset, originals);
		}

		test('addFileToWebpackAssets should throw an error if no filepath', async () => {
			const asset = createAsset();

			await expect(asset.addFileToAssets()).rejects.toThrow(
				pluginName + ': could not load file ' + asset.option.filepath
			);
		});

		test('default option & filepath relative', async () => {
			await createAssetMocksTemp(async () => {
				const asset = createAsset('/path/to/root', undefined, true);
				asset.option.filepath = 'rel/path/image.png';

				const resolvedPath = await asset.addFileToAssets();
				expect(resolvedPath).toBe('rel/path/image.png');
			});
		});

		test('default option & filepath absolute', async () => {
			await createAssetMocksTemp(async () => {
				const asset = createAsset('/path/to/root', undefined, true);
				asset.option.filepath = '/path/to/root/src/rel/path/image.png';

				const resolvedPath = await asset.addFileToAssets();
				expect(resolvedPath).toBe('src/rel/path/image.png');
			});
		});

		test('deployUrl', async () => {
			await createAssetMocksTemp(async () => {
				const asset = createAsset('/path/to/root', { deployUrl: 'public/dir' }, true);
				asset.option.filepath = 'rel/path/image.png';

				const resolvedPath = await asset.addFileToAssets();
				expect(resolvedPath).toBe('public/dir/rel/path/image.png');
			});
		});

		test('deployUrl & hash', async () => {
			await createAssetMocksTemp(async (assetBuffer) => {
				const asset = createAsset('/path/to/root', { deployUrl: 'public/dir', hash: true }, true);
				asset.option.filepath = 'rel/path/image.png';

				const resolvedPath = await asset.addFileToAssets();
				const hash = (asset as any).getSourceHash(assetBuffer);
				expect(resolvedPath).toBe(`public/dir/rel/path/image.${hash}.png`);
			});
		});
	});
});
