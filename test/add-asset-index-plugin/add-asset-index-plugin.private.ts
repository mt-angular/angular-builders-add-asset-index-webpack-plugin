import { AssetResolved, AddAssetIndexPluginOptions, BuilderParametersNeeded } from '../../src/add-asset-index-plugin';
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
    builderParameters: BuilderParametersNeeded;

    (assetsOption: AssetOption | AssetOption[], builderParameters: BuilderParametersNeeded): AddAssetIndexPluginPrivate;


    getBuilderOptions(): AddAssetIndexPluginOptions;
    initAssets();
    apply(compiler: Compiler);
    handleEmit(compilation: Compilation): Promise<void>;
    addAllAssetsToCompilation(): Promise<void>;
    getAssetsOptionsWithGlobFetch(): Promise<void>;
    getPathsFromGlob(globPattern: string): Promise<string[]>;
}
