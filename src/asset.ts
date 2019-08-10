import { pluginName, hash, Compilation } from './common';

import { Path } from '@angular-devkit/core';
import { isDefined, assignDefaultOption } from '@upradata/browser-util';
import { colors } from '@upradata/node-util';
import path from 'path';
import fs from 'fs';
import globby from 'globby';

import { promisify } from 'util';
const fsStatAsync = promisify(fs.stat);
const fsReadFileAsync = promisify(fs.readFile);



export type LocationInIndex = 'head' | 'body';

export type OutputPathCallback = (path: string) => string;
export type OutputPath = string | OutputPathCallback;


export class AssetGlobalOption {
    deployUrl?: string = ''; // to overwrite BuilderParametersOption.deployUrl
    sri?: boolean = false; // to overwrite BuilderParametersOption.subresourceIntegrity
    attributes?: { [ atrributeName: string ]: string | boolean } = {};
    hash?: boolean = false;
    place?: LocationInIndex = 'head';
    outputDir?: OutputPath = undefined;
}

export class AssetOption extends AssetGlobalOption {
    filepath: string; // can be a glob
}

export class Asset {
    public option: AssetOption;

    constructor(public compilation: Compilation, public root: Path, option: AssetOption) {
        this.option = assignDefaultOption(new AssetOption(), option);
    }

    private async getAssetsOptionsWithGlobFetch(): Promise<string[]> {
        const { filepath } = this.option;

        // if filepath is null or undefined, just bubble up.
        if (!globby.hasMagic(filepath))
            return [ filepath ];

        return await this.getPathsFromGlob(filepath);
    }

    private async getPathsFromGlob(globPattern: string): Promise<string[]> {
        return globby(globPattern);
    }

    async addFileToAssets(): Promise<string[]> {
        const paths = await this.getAssetsOptionsWithGlobFetch();

        const resolvedPaths = [];

        for (const filepath of paths) {
            const resolvedPath = await this.addFileToWebpackAssets(filepath);
            resolvedPaths.push(resolvedPath);
        }

        return resolvedPaths;
    }

    // from https://github.com/jantimon/html-webpack-plugin/blob/master/index.js
    private async addFileToWebpackAssets(filepath: string): Promise<string> {
        // filepath is not a glob. It was already Resolved

        // const filenameWithContext = path.resolve(compiler.options.context, filepath);
        // here filepath is already an absolute path
        // line  path.resolve(root, buildOptions.index) in @angular_devkit/build_angular/src/angular-cli-files/models/webpack-configs/browser.ts

        const { hash, deployUrl, outputDir } = this.option;

        return Promise.all([
            Asset.statFile(filepath),
            Asset.readFile(filepath)
        ])
            .catch(() => Promise.reject(new Error(pluginName + ': could not load file ' + filepath)))
            .then(([ stats, source ]) => {

                const hashClipped = hash ? '.' + this.getSourceHash(source) : '';

                let outputDirectory: string = undefined;

                if (isDefined(outputDir)) {
                    if (typeof outputDir === 'string')
                        outputDirectory = outputDir;
                    else
                        outputDirectory = outputDir(filepath);
                } else {
                    const filepathRelDirFromRoot = filepath.startsWith('/')
                        ? path.relative(this.root, path.dirname(filepath))
                        : path.dirname(filepath);

                    outputDirectory = path.join(deployUrl, filepathRelDirFromRoot);
                }

                const basename = path.basename(filepath);
                const ext = path.extname(basename); // ext includes the dot
                const filename = basename.split(ext)[ 0 ];

                let resolvedPath: string = undefined;
                const assetAlreadyExists = this.findAsset(filename, ext);

                /* if (isDefined(assetAlreadyExists))
                    resolvedPath = assetAlreadyExists;
                else */
                // we could make a symbolic link if assetAlreadyExists
                // Now, if asset already exist, it will be copied also on outputDirectory because asset has been
                // emitted already and apparently it is too late. Maybe we can stop the asset emition?
                resolvedPath = path.join(outputDirectory, `${filename}${hashClipped}${ext}`);

                if (assetAlreadyExists) {
                    console.warn(colors.yellow.$`${filename}${ext} already exist`);
                    console.warn(colors.yellow.$`It will be duplicated in ${outputDirectory}`);
                }
                // console.log(Object.keys(this.compilation.assets));
                // console.log(filepath, this.findAsset(filename, ext));

                this.compilation.assets[ resolvedPath ] = {
                    source: () => source,
                    size: () => stats.size
                };

                return resolvedPath;
            });
    }


    private findAsset(fileName: string, fileExt: string): string {

        const assetName = Object.keys(this.compilation.assets).find(assetName => {
            const basename = path.basename(assetName);
            const ext = path.extname(assetName);

            return basename.includes(fileName) && ext === fileExt;
        });

        return assetName;
    }

    private getSourceHash(source: Buffer) {
        return hash(source, { algo: 'sha384', digest: 'hex' }).substr(0, 20);
    }

    static async statFile(filepath: string): Promise<fs.Stats> {
        return fsStatAsync(filepath);
    }

    static async readFile(filepath: string): Promise<Buffer> {
        return fsReadFileAsync(filepath);
    }
}
