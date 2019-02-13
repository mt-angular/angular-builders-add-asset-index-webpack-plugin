// import { BuildOptions } from '@angular-devkit/build-angular/src/angular-cli-files/models/build-options';
import { IndexHtmlWebpackPluginOptions } from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin';
import {
	/* BuilderParameters, */ NormalizedCustomWebpackBrowserBuildSchema
} from '../linked_modules/@mt/custom-webpack-builder/custom-webpack-builder';
import * as path from 'path';
import * as globby from 'globby';

import { Compiler, compilation, Configuration as WebpackConfiguration } from 'webpack';

import { isArray, isDefined } from '../linked_modules/@mt/util/is';

// import micromatch from 'micromatch';

import { Tap } from 'tapable';
import { getSystemPath, Path } from '@angular-devkit/core';
import { Asset, AssetOption } from './asset';
import { IndexWriter } from './index-writer';
import { pluginName } from './common';

type Compilation = compilation.Compilation;

interface BuilderParametersOption {
	index: NormalizedCustomWebpackBrowserBuildSchema['index'];
	baseHref: NormalizedCustomWebpackBrowserBuildSchema['baseHref'];
	deployUrl: NormalizedCustomWebpackBrowserBuildSchema['deployUrl'];
	subresourceIntegrity: NormalizedCustomWebpackBrowserBuildSchema['subresourceIntegrity'];
	attributes?: AssetOption['attributes'];
	place?: AssetOption['place'];
	hash?: boolean;
}

export interface BuilderParameters {
	root: Path;
	options: BuilderParametersOption;
	webpackConfiguration: { mode: WebpackConfiguration['mode'] };
}

type AddAssetIndexPluginOptions = Pick<
	IndexHtmlWebpackPluginOptions,
	Exclude<keyof IndexHtmlWebpackPluginOptions, 'entrypoints' | 'noModuleEntrypoints'>
>;

export interface AssetResolved {
	asset: Asset;
	// basename: string;
	resolvedPath: string;
}

export class AddAssetIndexPlugin {
	private assetsResolved: AssetResolved[] = [];
	private assetsOption: AssetOption[];
	private root: Path;
	private option: AddAssetIndexPluginOptions;
	private assets: Asset[];
	private indexWriter: IndexWriter;
	private compilation: Compilation;

	constructor(assetsOption: AssetOption | AssetOption[] = [], builderParameters: BuilderParameters) {
		// '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin'
		// new IndexHtmlWebpackPlugin(); if one day we need. Like we could overwrite
		this.root = builderParameters.root;
		this.option = this.getBuilderOptions(builderParameters); // Object.assign(new Option(), option);
		this.assetsOption = isArray<AssetOption>(assetsOption) ? assetsOption : [ assetsOption ];
	}

	private getBuilderOptions(builderParameters: BuilderParameters): AddAssetIndexPluginOptions {
		const root = getSystemPath(builderParameters.root);
		const { index, baseHref, deployUrl, subresourceIntegrity, hash } = builderParameters.options;

		// copied from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin'
		const buildOptions = {
			input: path.resolve(root, index),
			output: path.basename(index),
			baseHref: baseHref,
			// entrypoints: generateEntryPoints(builderParameters.options),
			deployUrl: deployUrl,
			sri: subresourceIntegrity
			// noModuleEntrypoints: ['es2015-polyfills'],
		};

		// copied from @angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.ts
		const options = {
			input: 'index.html',
			output: 'index.html',
			// entrypoints: ['polyfills', 'main'],
			// noModuleEntrypoints: [],
			sri: false,
			...buildOptions,
			// My addition
			hash: hash || builderParameters.webpackConfiguration.mode === 'production'
		};

		return options;
	}

	initAssets() {
		this.assets = this.assetsOption.map(
			(option) => new Asset(this.compilation, this.root, Object.assign(this.option, option))
		);
	}

	apply(compiler: Compiler) {
		const tapOption: Partial<Tap> = {
			name: pluginName,
			stage: Infinity // to be sure the plugin is applied the last one. Because taps are applied in order of registration
			// normally it is ok if the plugin is registered after angular IndexHtmlWebpackPluginOptions
			// angular-cli/packages/angular_devkit/build_angular/src/angular-cli-files/plugins/index-html-webpack-plugin.ts
		};

		// it is a mistake. Here it should be just a Partial. In Tap, it is missing even before
		// check source code https://github.com/webpack/tapable/blob/master/lib/Hook.js
		compiler.hooks.emit.tapPromise(tapOption as Tap, async (compilation: Compilation) => {
			this.compilation = compilation;
			this.indexWriter = new IndexWriter(this.compilation, {
				indexInputPath: this.option.input,
				indexOutputPath: this.option.output
			});

			await this.getAssetsOptionsWithGlobFetch();
			this.initAssets();

			await this.addAllAssetsToCompilation();
			await this.indexWriter.writeInIndex(this.assetsResolved);
		});
	}

	async addAllAssetsToCompilation() {
		for (const asset of this.assets) {
			const resolvedPath = await asset.addFileToAssets();
			this.assetsResolved.push({ asset, resolvedPath });
		}
	}

	private async getAssetsOptionsWithGlobFetch() {
		const globbyAssets = [];
		const normalAssets = [];

		// if filepath is null or undefined, just bubble up.
		for (const assetO of this.assetsOption) {
			if (isDefined(assetO.filepath) && globby.hasMagic(assetO.filepath)) globbyAssets.push(assetO);
			else normalAssets.push(assetO);
		}

		const assetOptions: AssetOption[] = [];

		await Promise.all(
			globbyAssets.map((asset) =>
				globby(asset.filepath).then((paths) =>
					paths.forEach((filepath) => assetOptions.push(Object.assign({}, asset, { filepath })))
				)
			)
		);

		return (this.assetsOption = assetOptions.concat(normalAssets));
	}
}
