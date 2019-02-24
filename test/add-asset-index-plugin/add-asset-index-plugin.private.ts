import { AssetResolved, AddAssetIndexPluginOptions, BuilderParameters } from '../../src/add-asset-index-plugin';
import { AssetOption, Asset } from '../../src/asset';
import { Path } from '@angular-devkit/core';
import { IndexWriter } from '../../src/index-writer';
import { Compilation } from '../../src/common';
import { Compiler } from 'webpack';

export interface AddAssetIndexPluginPrivate {
    assetsResolved: AssetResolved[];
    assetsOption: AssetOption[];
    root: Path;
    option: AddAssetIndexPluginOptions;
    assets: Asset[];
    indexWriter: IndexWriter;
    compilation: Compilation;

    (assetsOption: AssetOption | AssetOption[], builderParameters: BuilderParameters): AddAssetIndexPluginPrivate;


    getBuilderOptions(builderParameters: BuilderParameters): AddAssetIndexPluginOptions;
    initAssets();
    apply(compiler: Compiler);
    handleEmit(compilation: Compilation): Promise<void>;
    addAllAssetsToCompilation(): Promise<void>;
    getAssetsOptionsWithGlobFetch(): Promise<void>;
    getPathsFromGlob(globPattern: string): Promise<string[]>;
}
