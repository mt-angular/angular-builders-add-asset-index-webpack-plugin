// import { BuildOptions } from '@angular-devkit/build-angular/src/angular-cli-files/models/build-options';
import { IndexHtmlWebpackPluginOptions } from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin';
import {
	/* BuilderParameters, */ NormalizedCustomWebpackBrowserBuildSchema
} from '../linked_modules/@mt/custom-webpack-builder-src/custom-webpack-builder';

import * as path from 'path';
import { isArray, isDefined } from '../linked_modules/@mt/browser-util/is';
import { assignDefaultOption } from '../linked_modules/@mt/browser-util/assign';

import { Compiler, Configuration as WebpackConfiguration } from 'webpack';
import { Tap } from 'tapable';
import { getSystemPath, Path } from '@angular-devkit/core';
import { Asset, AssetOption, AssetGlobalOption } from './asset';
import { IndexWriter } from './index-writer';
import { pluginName, Compilation } from './common';


export type BuilderParametersOptions = {
    index: NormalizedCustomWebpackBrowserBuildSchema[ 'index' ];
    baseHref?: NormalizedCustomWebpackBrowserBuildSchema[ 'baseHref' ]; // not necessary. I will delete it certainely
    // deployUrl?: NormalizedCustomWebpackBrowserBuildSchema[ 'deployUrl' ]; // already in AssetGlobalOption
    subresourceIntegrity?: NormalizedCustomWebpackBrowserBuildSchema[ 'subresourceIntegrity' ]; // will be sri in AssetGlobalOption
} & Pick<
    AssetGlobalOption,
    Exclude<keyof AssetGlobalOption, 'sri'>
>;


export interface BuilderParameters {
    root: Path;
    options: BuilderParametersOptions;
    webpackConfiguration: { mode: WebpackConfiguration[ 'mode' ] };
}

export type AddAssetIndexPluginOptions = Pick<
    IndexHtmlWebpackPluginOptions,
    Exclude<keyof IndexHtmlWebpackPluginOptions, 'entrypoints' | 'noModuleEntrypoints'>
> & AssetGlobalOption;

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

        const { index, baseHref, deployUrl, subresourceIntegrity, hash, place, attributes, outputDir } = builderParameters.options;

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
            hash: hash || builderParameters.webpackConfiguration.mode === 'production',
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


const root = path.resolve(__dirname, '../e2e');
new AddAssetIndexPlugin(
    [ {
        filepath: path.resolve(root, '../e2e/assets/font/**/*.woff2'),
        attributes: {
            as: 'font',
            rel: 'preload',
        },
        outputDir: (filepath: string) => {
            const split = filepath.split('assets/font/');
            return path.join('bust-cache-asset/font', split[ 1 ]);
        }
    } ],
    {
        root: root as any,
        options: {
            index: path.join(root, 'src/index.html'),
        },
        webpackConfiguration: {
            mode: 'development'
        }
    });
