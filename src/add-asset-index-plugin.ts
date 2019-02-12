// import { BuildOptions } from '@angular-devkit/build-angular/src/angular-cli-files/models/build-options';
import { IndexHtmlWebpackPluginOptions } from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin';
import { BuilderParameters, NormalizedCustomWebpackBrowserBuildSchema } from '../linked_modules/@mt/custom-webpack-builder/custom-webpack-builder';
import * as path from 'path';
import * as globby from 'globby';

import { Compiler, compilation } from 'webpack';

import { isArray, isDefined } from '../linked_modules/@mt/util';


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
    place?: AssetOption['place'];
}


export interface BuilderParameters {
    root: Path;
    options: BuilderParametersOption;
}


type AddAssetIndexPluginOptions = Pick<IndexHtmlWebpackPluginOptions, Exclude<keyof IndexHtmlWebpackPluginOptions, 'entrypoints' | 'noModuleEntrypoints'>>;


export interface AssetResolved {
    asset: Asset;
    // basename: string;
    resolvedPath: string;
}

export class AddAssetIndexPlugin {
    private assetResolved: AssetResolved[] = [];
    private assetsOption: AssetOption[];
    private root: Path;
    private option: AddAssetIndexPluginOptions;
    private assets: Asset[];
    private indexWriter: IndexWriter;
    private compilation: Compilation;
    private compiler: Compiler;


    constructor(assetsOption: AssetOption | AssetOption[] = [], builderParameters: BuilderParameters) {
        // '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin'
        // new IndexHtmlWebpackPlugin(); if one day we need. Like we could overwrite
        this.root = builderParameters.root;
        this.option = this.getAngularOptions(builderParameters);// Object.assign(new Option(), option);
        this.assetsOption = isArray<AssetOption>(assetsOption) ? assetsOption : [assetsOption];
    }


    private getAngularOptions(builderParameters: BuilderParameters): AddAssetIndexPluginOptions {

        const root = getSystemPath(builderParameters.root);
        const angularBuildOptions = builderParameters.options as NormalizedCustomWebpackBrowserBuildSchema;

        // copied from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin'
        const buildOptions = {
            input: path.resolve(root, angularBuildOptions.index),
            output: path.basename(angularBuildOptions.index),
            baseHref: angularBuildOptions.baseHref,
            // entrypoints: generateEntryPoints(angularBuildOptions),
            deployUrl: angularBuildOptions.deployUrl,
            sri: angularBuildOptions.subresourceIntegrity,
            // noModuleEntrypoints: ['es2015-polyfills'],
        };

        // copied from @angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.ts
        const indexHtmlWebpackPluginOptions = {
            input: 'index.html',
            output: 'index.html',
            // entrypoints: ['polyfills', 'main'],
            // noModuleEntrypoints: [],
            sri: false,
            ...buildOptions,
        };

        return indexHtmlWebpackPluginOptions;
    }

    initAssets() {
        this.assets = this.assetsOption.map(option => new Asset(this.compilation, this.root, Object.assign(option, this.option)));
    }

    apply(compiler: Compiler) {
        this.compiler = compiler;

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
            this.indexWriter = new IndexWriter(this.compilation, { indexInputPath: this.option.input, indexOutputPath: this.option.output });


            this.getAssetsOptionsWithGlobFetch();
            this.initAssets();

            await this.addAllAssetsToCompilation();
            await this.indexWriter.writeInIndex(this.assetResolved);
        });
    }

    async addAllAssetsToCompilation() {

        for (const asset of this.assets) {
            const resolvedPath = await asset.addFileToAssets();
            this.assetResolved.push({ asset, resolvedPath });
        }
    }


    private async getAssetsOptionsWithGlobFetch() {
        const globbyAssets = [];
        const normalAssets = [];

        // if filepath is null or undefined, just bubble up.
        for (const assetO of this.assetsOption) {
            if (isDefined(assetO.filepath) && globby.hasMagic(assetO.filepath))
                globbyAssets.push(assetO);
            else
                normalAssets.push(assetO);
        }


        const assetOptions: AssetOption[] = [];

        await Promise.all(
            globbyAssets.map(asset =>
                globby(asset.filepath).then(paths =>
                    paths.forEach(filepath =>
                        assetOptions.push(Object.assign({}, asset, { filepath })),
                    ),
                ),
            ),
        );

        return this.assetsOption = assetOptions.concat(normalAssets);
    }

}
