// import { BuildOptions } from '@angular-devkit/build-angular/src/angular-cli-files/models/build-options';
import { IndexHtmlWebpackPluginOptions } from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin';
import { CustomWebpackBrowserSchema, BuilderParameters } from '@ud-angular-builders/custom-webpack';
import path from 'path';
import { isArray, isDefined, assignDefaultOption, isUndefined } from '@upradata/browser-util';

import { Compiler, Configuration as WebpackConfiguration } from 'webpack';
import { Tap } from 'tapable';
import { getSystemPath, Path } from '@angular-devkit/core';
import { Asset, AssetOption, AssetGlobalOption, ResolvedPath } from './asset';
import { IndexWriter } from './index-writer';
import { pluginName, Compilation } from './common';
import { BuilderContext } from '@angular-devkit/architect';
import { WriteIndexHtmlOptions } from '@angular-devkit/build-angular/src/angular-cli-files/utilities/index-file/write-index-html';

import { tmpdir } from 'os';
import { mkdtemp, writeFile, readFile } from 'fs';
import { promisify } from 'util';
import { Transforms } from '@ud-angular-builders/custom-webpack/dist/transforms';

const tmpDir = tmpdir();
const makeTmpDir = promisify(mkdtemp);
const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);

// We need only these properties. Not all angular.json builder configuration
export type BuilderOptionsNeeded = {
    baseHref?: CustomWebpackBrowserSchema[ 'baseHref' ]; // not necessary. I will delete it certainely
    // deployUrl?: NormalizedCustomWebpackBrowserBuildSchema[ 'deployUrl' ]; // already in AssetGlobalOption
    subresourceIntegrity?: CustomWebpackBrowserSchema[ 'subresourceIntegrity' ]; // will be sri in AssetGlobalOption
    indexTransforms: Transforms

} & Omit<AssetGlobalOption, 'sri'>;


// We need only these properties. Not all @ud-angular-builders/custom-webpack BuilderParameters
export interface BuilderParametersNeeded {
    builderContext: { workspaceRoot: BuilderContext[ 'workspaceRoot' ] };
    buildOptions: BuilderOptionsNeeded;
    baseWebpackConfig: { mode: WebpackConfiguration[ 'mode' ] };
}

export type AddAssetIndexPluginOptions = Partial<WriteIndexHtmlOptions & AssetGlobalOption>;

export interface AssetResolved {
    asset: AssetOption;
    resolvedPath: ResolvedPath;
}

export interface Extra {
    tmpFile?: string;
}

export class AddAssetIndexPlugin {
    private assetsOption: AssetOption[];
    private root: string;
    private option: AddAssetIndexPluginOptions;
    private assets: Asset[];
    private indexWriter: IndexWriter;
    private compilation: Compilation;
    private tmpFile: string;

    constructor(assetsOption: AssetOption | AssetOption[], private builderParameters: BuilderParametersNeeded, extra: Extra = {}) {
        // @angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin
        // new IndexHtmlWebpackPlugin(); if one day we need. Like we could overwrite
        this.root = builderParameters.builderContext.workspaceRoot;
        this.option = this.getBuilderOptions();
        this.assetsOption = isArray<AssetOption>(assetsOption) ? assetsOption : [ assetsOption ];

        this.builderParameters.buildOptions.indexTransforms.addIndexTransform(this.writeIndex.bind(this));
        this.tmpFile = extra.tmpFile;
    }

    private getBuilderOptions(): AddAssetIndexPluginOptions {
        const { baseHref, deployUrl, subresourceIntegrity, hash, place, attributes, outputDir } = this.builderParameters.buildOptions;


        // copied from '@angular-devkit/build-angular/src/angular-cli-files/plugins/index-html-webpack-plugin'
        const buildOptions = {
            baseHref,
            // entrypoints: generateEntryPoints(builderParameters.options),
            deployUrl,
            sri: subresourceIntegrity
            // noModuleEntrypoints: ['es2015-polyfills'],
        };

        // copied from @angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.ts
        const options: AddAssetIndexPluginOptions = {
            // entrypoints: ['polyfills', 'main'],
            // noModuleEntrypoints: [],
            sri: false,
            ...buildOptions,
            // My addition
            place,
            attributes,
            hash: hash || this.builderParameters.baseWebpackConfig.mode === 'production',
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
            /*  if (compilation.assets[ this.option.output ] === undefined)
                 throw new Error(`AddAssetIndexPlugin can not be used before index.html has been emited by another plugin. In angular, the plugin is:
                  angular-cli/packages/angular_devkit/build_angular/src/angular-cli-files/plugins/index-html-webpack-plugin.ts`); */

            await this.handleEmit(compilation);
        });
    }

    async handleEmit(compilation: Compilation): Promise<void> {
        this.compilation = compilation;
        this.initAssets();

        const assetsResolved = await this.addAllAssetsToCompilation();
        this.writeAssets(assetsResolved);
    }

    private getTmpdir(): Promise<string> {
        return makeTmpDir(`${tmpDir}${path.sep}`).catch(e => {
            throw new Error(`An error occured while creating a tmp directory in ${`${tmpDir}${path.sep}`}: ${e}`);
        });
    }

    private async writeAssets(assetsResolved: AssetResolved[]): Promise<void> {
        if (isUndefined(this.tmpFile)) {
            const tmpDir = await this.getTmpdir();
            this.tmpFile = path.join(tmpDir, 'assets.json');
        }

        await writeFileAsync(this.tmpFile, JSON.stringify(assetsResolved), { encoding: 'utf8' });
    }


    private async readAssets(): Promise<AssetResolved[]> {
        const json = await readFileAsync(this.tmpFile, { encoding: 'utf8' });
        return JSON.parse(json);
    }

    private async writeIndex(indexHtmlContent: string) {
        const assetsResolved = await this.readAssets();

        this.indexWriter = new IndexWriter({ indexHtmlContent });
        return this.indexWriter.writeInIndex(assetsResolved);
    }

    async addAllAssetsToCompilation(): Promise<AssetResolved[]> {

        const assetsResolved: AssetResolved[] = [];


        const resolved$ = this.assets.map(asset => {
            return asset.addFileToAssets().then(resolvedPaths => ({ asset, resolvedPaths }));
        });

        await Promise.all(resolved$).then(resolved => {
            for (const { asset, resolvedPaths } of resolved) {

                for (const resolvedPath of resolvedPaths)
                    assetsResolved.push({ asset: asset.option, resolvedPath });
            }
        });

        return assetsResolved;
    }
}
