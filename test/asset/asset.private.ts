import { AssetOption, ResolvedPath } from '../../src/asset';
import { Path } from '@angular-devkit/core';
import { Compilation } from '../../src/common';


export interface AssetPrivate {
    option: AssetOption;
    compilation: Compilation;
    root: Path;

    (compilation: Compilation, root: Path, option: AssetOption): AssetPrivate;

    getAssetsOptionsWithGlobFetch(): Promise<string[]>;
    getPathsFromGlob(globPattern: string): Promise<string[]>;
    addFileToAssets(): Promise<ResolvedPath[]>;
    addFileToWebpackAssets(filepath: string): Promise<ResolvedPath>;
    getSourceHash(source: Buffer): string;
}
