// import { BuildOptions } from '@angular-devkit/build-angular/src/angular-cli-files/models/build-options';
import { IndexHtmlWebpackPluginOptions } from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin';
import {
	/* BuilderParameters, */ NormalizedCustomWebpackBrowserBuildSchema
} from '@ud-angular-builders/custom-webpack-7';

import path from 'path';
import { isArray, isDefined, assignDefaultOption } from '@upradata/browser-util';

import { Compiler, Configuration as WebpackConfiguration } from 'webpack';
import { Tap } from 'tapable';
import { getSystemPath, Path } from '@angular-devkit/core';
import { Asset, AssetOption, AssetGlobalOption } from './asset';
import { IndexWriter } from './index-writer';
import { pluginName, Compilation } from './common';


// We need only these properties. Not all angular.json builder configuration
export type BuilderParametersOptions = {
    index: NormalizedCustomWebpackBrowserBuildSchema[ 'index' ];
    baseHref?: NormalizedCustomWebpackBrowserBuildSchema[ 'baseHref' ]; // not necessary. I will delete it certainely
    // deployUrl?: NormalizedCustomWebpackBrowserBuildSchema[ 'deployUrl' ]; // already in AssetGlobalOption
    subresourceIntegrity?: NormalizedCustomWebpackBrowserBuildSchema[ 'subresourceIntegrity' ]; // will be sri in AssetGlobalOption
} & Omit<AssetGlobalOption, 'sri'>;


// We need only these properties. Not all @ud-angular-builders/custom-webpack-7 BuilderParameters
export interface BuilderParameters {
    root: Path;
    buildOptions: BuilderParametersOptions;
    baseWebpackConfig: { mode: WebpackConfiguration[ 'mode' ] };
}

export type AddAssetIndexPluginOptions = Omit<IndexHtmlWebpackPluginOptions, 'entrypoints' | 'noModuleEntrypoints'> & AssetGlobalOption;

export interface AssetResolved {
    asset: Asset;
    resolvedPath: string;
}

export class AddAssetIndexPlugin {
    private assetsOption: AssetOption[];
    private root: Path;
    private option: AddAssetIndexPluginOptions;
    private assets: Asset[];
    private indexWriter: IndexWriter;
    private compilation: Compilation;

    constructor(assetsOption: AssetOption | AssetOption[], builderParameters: BuilderParameters) {
        // @angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin
        // new IndexHtmlWebpackPlugin(); if one day we need. Like we could overwrite
        this.root = builderParameters.root;
        this.option = this.getBuilderOptions(builderParameters); // Object.assign(new Option(), option);
        this.assetsOption = isArray<AssetOption>(assetsOption) ? assetsOption : [ assetsOption ];
    }

    private getBuilderOptions(builderParameters: BuilderParameters): AddAssetIndexPluginOptions {
        const root = getSystemPath(builderParameters.root);

        const { index, baseHref, deployUrl, subresourceIntegrity, hash, place, attributes, outputDir } = builderParameters.buildOptions;

        // copied from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin'
        const buildOptions = {
            input: path.resolve(root, index),
            output: path.basename(index),
            baseHref,
            // entrypoints: generateEntryPoints(builderParameters.options),
            deployUrl,
            sri: subresourceIntegrity
            // noModuleEntrypoints: ['es2015-polyfills'],
        };

        // copied from @angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.ts
        const options: AddAssetIndexPluginOptions = {
            input: 'index.html',
            output: 'index.html',
            // entrypoints: ['polyfills', 'main'],
            // noModuleEntrypoints: [],
            sri: false,
            ...buildOptions,
            // My addition
            place,
            attributes,
            hash: hash || builderParameters.baseWebpackConfig.mode === 'production',
            outputDir
        };


        const addAssetIndexPluginOptions: AddAssetIndexPluginOptions = {} as any;

        for (const [ k, v ] of Object.entries(options)) {
            if (isDefined(v))
                addAssetIndexPluginOptions[ k ] = v;
        }

        return addAssetIndexPluginOptions;
    }

    initAssets() {
        this.assets = this.assetsOption.map(
            // merge global option with individual asset option
            option => new Asset(this.compilation, this.root, assignDefaultOption(this.option as unknown as AssetOption, option))
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
            if (compilation.assets[ this.option.output ] === undefined)
                throw new Error(`AddAssetIndexPlugin can not be used before index.html has been emited by another plugin. In angular, the plugin is:
                 angular-cli/packages/angular_devkit/build_angular/src/angular-cli-files/plugins/index-html-webpack-plugin.ts`);

            await this.handleEmit(compilation);
        });
    }

    async handleEmit(compilation: Compilation): Promise<void> {
        this.compilation = compilation;
        this.initAssets();

        this.indexWriter = new IndexWriter(this.compilation, {
            indexInputPath: this.option.input,
            indexOutputPath: this.option.output
        });

        const assetsResolved = await this.addAllAssetsToCompilation();
        this.indexWriter.writeInIndex(assetsResolved);
    }

    async addAllAssetsToCompilation(): Promise<AssetResolved[]> {

        const assetsResolved: AssetResolved[] = [];


        const resolved$ = this.assets.map(asset => {
            return asset.addFileToAssets().then(resolvedPaths => ({ asset, resolvedPaths }));
        });

        await Promise.all(resolved$).then(resolved => {
            for (const { asset, resolvedPaths } of resolved) {

                for (const resolvedPath of resolvedPaths)
                    assetsResolved.push({ asset, resolvedPath });
            }
        });

        return assetsResolved;
    }
}
