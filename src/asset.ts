import { pluginName } from './common';

import { assignDefaultOption } from '../linked_modules/@mt/util';

import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';

import { promisify } from 'util';
const fsStatAsync = promisify(fs.stat);
const fsReadFileAsync = promisify(fs.readFile);

import { Path } from '@angular-devkit/core';
import { compilation } from 'webpack';
type Compilation = compilation.Compilation;


export class AssetOption {
    filepath: string;
    hash?: boolean = true;
    deployUrl?: string = ''; // to overwrite BuilderParametersOption.deployUrl
    sri?: boolean; // to overwrite BuilderParametersOption.subresourceIntegrity
    attributes?: { [atrributeName: string]: string } = {};
    place: 'head' | 'body' = 'head';
}



export class Asset {
    public option: AssetOption;

    constructor(public compilation: Compilation, public root: Path, option: AssetOption) {
        this.option = assignDefaultOption(new AssetOption(), option);
    }



    async addFileToAssets(): Promise<string> {

        const { filepath } = this.option;

        if (!filepath) {
            const error = new Error('No filepath defined');
            this.compilation.errors.push(error);
            throw error;
        }

        /*
            const fileFilters = Array.isArray(files) ? files : [files];
            // every file entry can be a glob

            if (fileFilters.length > 0) {
                const shouldSkip = !fileFilters.some(file =>
                    micromatch.isMatch(htmlPluginData.outputName, file),
                );

                if (shouldSkip) {
                    return;
                }
            }
         */


        const resolvedPath = await this.addFileToWebpackAssets();
        return resolvedPath;
        // this.assetResolved.push({ asset/* , basename */, resolvedPath });
    }


    private addFileToWebpackAssets() {
        // compiler: Compiler
        // const filenameWithContext = path.resolve(compiler.options.context, filepath);
        // here filepath is already an absolute path
        // line  path.resolve(root, buildOptions.index) in @angular_devkit/build_angular/src/angular-cli-files/models/webpack-configs/browser.ts

        const { filepath, hash, deployUrl } = this.option;
        // const deployUrl = asset.deployUrl || this.option.deployUrl || '';

        return Promise.all([
            fsStatAsync(filepath),
            fsReadFileAsync(filepath)
        ])
            .then(([stats, source]) => {
                return {
                    stats,
                    source
                };
            })
            .catch(() => Promise.reject(new Error(pluginName + ': could not load file ' + filepath)))
            .then(results => {

                const hashClipped = hash ? this.getSourceHash(results.source).substr(0, 20) : '';
                const rootFilePathDiffDir = filepath.startsWith('/') ? path.relative(this.root, filepath) : path.dirname(filepath);
                const basename = path.basename(filepath);
                const extWithPoint = path.extname(basename);
                const filename = basename.split(extWithPoint)[0];

                const resolvedPath = path.join(deployUrl, rootFilePathDiffDir, `${filename}.${hashClipped}${extWithPoint}`);

                this.compilation.assets[resolvedPath] = {
                    source: () => results.source,
                    size: () => results.stats.size
                };

                return resolvedPath;
            });
    }

    getSourceHash(source: Buffer) {
        const algo = 'sha384';
        const hash = crypto.createHash(algo);
        hash.update(source);
        return hash.digest('hex');
    }
}
