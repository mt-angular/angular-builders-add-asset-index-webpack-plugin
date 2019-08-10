import { AssetOption } from '../../src/asset';
import { Path } from '@angular-devkit/core';
import { Compilation } from '../../src/common';


export interface AssetPrivate {
    option: AssetOption;
    compilation: Compilation;
    root: Path;

    (compilation: Compilation, root: Path, option: AssetOption): AssetPrivate;

    getAssetsOptionsWithGlobFetch(): Promise<string[]>;
    getPathsFromGlob(globPattern: string): Promise<string[]>;
    addFileToAssets(): Promise<string[]>;
    addFileToWebpackAssets(filepath: string): Promise<string>;
    getSourceHash(source: Buffer): string;
}
