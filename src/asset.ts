import { pluginName, hash, Compilation } from './common';

import { assignDefaultOption } from '../linked_modules/@mt/util/assign';

import * as path from 'path';
import * as fs from 'fs';
import * as globby from 'globby';

import { promisify } from 'util';
const fsStatAsync = promisify(fs.stat);
const fsReadFileAsync = promisify(fs.readFile);

import { Path } from '@angular-devkit/core';

export type LocationInIndex = 'head' | 'body';

export class AssetOption {
    filepath: string; // can be a glob
    deployUrl?: string = ''; // to overwrite BuilderParametersOption.deployUrl
    sri?: boolean; // to overwrite BuilderParametersOption.subresourceIntegrity
    attributes?: { [ atrributeName: string ]: string } = {};
    hash?: boolean = false;
    place?: LocationInIndex = 'head';
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

        const { hash, deployUrl } = this.option;

        return Promise.all([
            Asset.statFile(filepath),
            Asset.readFile(filepath)
        ])
            .catch(() => Promise.reject(new Error(pluginName + ': could not load file ' + filepath)))
            .then(([ stats, source ]) => {

                const hashClipped = hash ? '.' + this.getSourceHash(source) : '';
                const filepathRelDirFromRoot = filepath.startsWith('/')
                    ? path.relative(this.root, path.dirname(filepath))
                    : path.dirname(filepath);
                const basename = path.basename(filepath);
                const ext = path.extname(basename); // ext includes the dot
                const filename = basename.split(ext)[ 0 ];

                const resolvedPath = path.join(deployUrl, filepathRelDirFromRoot, `${filename}${hashClipped}${ext}`);

                this.compilation.assets[ resolvedPath ] = {
                    source: () => source,
                    size: () => stats.size
                };

                return resolvedPath;
            });
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
