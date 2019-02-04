import * as path from 'path';
import * as fs from 'fs';
import * as globby from 'globby';
import { Compiler, compilation } from 'webpack';
import { promisify } from 'util';

type Compilation = compilation.Compilation;

const fsStatAsync = promisify(fs.stat);
const fsReadFileAsync = promisify(fs.readFile);

export const pluginName = 'AddAssetIndexPlugin';

export function ensureTrailingSlash(string: string) {
    if (string.length && string.substr(-1, 1) !== '/') {
        return `${string}/`;
    }

    return string;
}

// Copied from html-webpack-plugin
export function resolvePublicPath(compiler: Compiler, filename: string) {

    const publicPath =
        typeof compiler.options.output.publicPath !== 'undefined'
            ? compiler.options.output.publicPath
            : path.relative(path.dirname(filename), '.'); // TODO: How to test this? I haven't written this logic, unsure what it does

    return ensureTrailingSlash(publicPath);
}

export function resolveOutput(compilation: Compilation, addedFilename: string, outputPath: string) {
    if (outputPath && outputPath.length) {

        compilation.assets[`${outputPath}/${addedFilename}`] = compilation.assets[addedFilename];
        delete compilation.assets[addedFilename];
    }
}

/**
 * handle globby filepath and return an array with all matched assets.
 *
 * @export
 * @param {Array} assets
 * @returns
 */
export async function getAssetsWithGlobFetch(assets: { filepath: string }[]) {
    const globbyAssets = [];
    const normalAssets = [];
    // if filepath is null or undefined, just bubble up.
    assets.forEach(asset =>
        asset.filepath && globby.hasMagic(asset.filepath)
            ? globbyAssets.push(asset)
            : normalAssets.push(asset),
    );
    const ret = [];
    await Promise.all(
        globbyAssets.map(asset =>
            globby(asset.filepath).then(paths =>
                paths.forEach(filepath =>
                    ret.push(Object.assign({}, asset, { filepath })),
                ),
            ),
        ),
    );

    return ret.concat(normalAssets);
}


// from https://github.com/jantimon/html-webpack-plugin/blob/master/index.js
export function addFileToAssets(filepath: string, compilation: Compilation) {
    // compiler: Compiler
    // const filenameWithContext = path.resolve(compiler.options.context, filepath);
    // here filepath is already an absolute path
    // line  path.resolve(root, buildOptions.index) in @angular_devkit/build_angular/src/angular-cli-files/models/webpack-configs/browser.ts

    return Promise.all([
        fsStatAsync(filepath),
        fsReadFileAsync(filepath)
    ])
        .then(([size, source]) => {
            return {
                size,
                source
            };
        })
        .catch(() => Promise.reject(new Error(pluginName + ': could not load file ' + filepath)))
        .then(results => {
            const basename = path.basename(filepath);
            compilation.fileDependencies.add(filepath);
            compilation.assets[basename] = {
                source: () => results.source,
                size: () => results.size.size
            };
            return basename;
        });
}
