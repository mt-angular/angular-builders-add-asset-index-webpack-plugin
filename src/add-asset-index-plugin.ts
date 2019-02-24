// import { BuildOptions } from '@angular-devkit/build-angular/src/angular-cli-files/models/build-options';
import { IndexHtmlWebpackPluginOptions } from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin';
import {
	/* BuilderParameters, */ NormalizedCustomWebpackBrowserBuildSchema
} from '../linked_modules/@mt/custom-webpack-builder/custom-webpack-builder';
import * as path from 'path';

import { Compiler, Configuration as WebpackConfiguration } from 'webpack';

import { isArray } from '../linked_modules/@mt/util/is';

// import micromatch from 'micromatch';

import { Tap } from 'tapable';
import { getSystemPath, Path } from '@angular-devkit/core';
import { Asset, AssetOption } from './asset';
import { IndexWriter } from './index-writer';
import { pluginName, Compilation } from './common';
import { assignDefaultOption } from '../linked_modules/@mt/util/assign';


export interface BuilderParametersOptions {
    index: NormalizedCustomWebpackBrowserBuildSchema[ 'index' ];
    baseHref?: NormalizedCustomWebpackBrowserBuildSchema[ 'baseHref' ];
    deployUrl?: NormalizedCustomWebpackBrowserBuildSchema[ 'deployUrl' ];
    subresourceIntegrity?: NormalizedCustomWebpackBrowserBuildSchema[ 'subresourceIntegrity' ];
    attributes?: AssetOption[ 'attributes' ];
    place?: AssetOption[ 'place' ];
    hash?: boolean;
}

export interface BuilderParameters {
    root: Path;
    options: BuilderParametersOptions;
    webpackConfiguration: { mode: WebpackConfiguration[ 'mode' ] };
}

export type AddAssetIndexPluginOptions = Pick<
    IndexHtmlWebpackPluginOptions,
    Exclude<keyof IndexHtmlWebpackPluginOptions, 'entrypoints' | 'noModuleEntrypoints'>
> & {
    attributes?: AssetOption[ 'attributes' ];
    place?: AssetOption[ 'place' ];
    hash?: boolean;
    sri?: boolean;
};

export interface AssetResolved {
    asset: Asset;
    // basename: string;
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
            baseHref,
            // entrypoints: generateEntryPoints(builderParameters.options),
            deployUrl,
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
            place: builderParameters.options.place,
            attributes: builderParameters.options.attributes,
            hash: hash || builderParameters.webpackConfiguration.mode === 'production'
        };

        return options;
    }

    initAssets() {
        this.assets = this.assetsOption.map(
            // merge global option with individual asset option
            option => new Asset(this.compilation, this.root, assignDefaultOption(this.option, option))
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
        await this.indexWriter.writeInIndex(assetsResolved);
    }

    async addAllAssetsToCompilation(): Promise<AssetResolved[]> {

        /* const resolved$ = this.assets.map(asset => {
            return asset.addFileToAssets().then(resolvedPaths => ({ asset, resolvedPaths }));
        }); */


        const assetsResolved: AssetResolved[] = [];

        /* await Promise.all(resolved$).then(resolved => {
            for (const { asset, resolvedPaths } of resolved) {

                for (const resolvedPath of resolvedPaths)
                    assetsResolved.push({ asset, resolvedPath });
            }
        }); */
        for (const asset of this.assets) {
            const resolvedPaths = await asset.addFileToAssets();
            for (const resolvedPath of resolvedPaths)
                assetsResolved.push({ asset, resolvedPath });
        }

        return assetsResolved;
    }
}
