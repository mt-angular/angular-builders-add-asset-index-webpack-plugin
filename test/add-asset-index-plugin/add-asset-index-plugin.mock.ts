import path from 'path';
import { AssetOption } from '../../src/asset';
import { AddAssetIndexPlugin, BuilderParametersNeeded } from '../../src/add-asset-index-plugin';
import { AddAssetIndexPluginPrivate } from './add-asset-index-plugin.private';
import { isDefined, isArray, assignRecursive, PartialRecursive, assignRecursiveArray } from '@upradata/browser-util';
import { BuilderParameters, CustomWebpackBuildSchema, CustomWebpackBrowserSchema } from '@ud-angular-builders/custom-webpack';
import { BuilderContext } from '@angular-devkit/architect';
import { Transforms } from '@ud-angular-builders/custom-webpack/dist/transforms';


export interface CreateOptionParam<T> {
    param: PartialRecursive<T>;
    noDefault?: boolean;
}


export const workspaceRoot = '/path/to/root';
export const builderContext = { workspaceRoot } as BuilderContext;
export const buildOptions = (): CustomWebpackBuildSchema => {

    const buildO: CustomWebpackBuildSchema = {
        index: path.join(workspaceRoot, 'src/index.html'),
        subresourceIntegrity: false,
        baseHref: undefined as string,
        deployUrl: undefined as string,
        place: 'head',
        hash: false
    } as any;

    // indexTransforms.options.indexTransforms === indexTransforms === buildOptions.indexTransforms;
    const indexTransforms = new Transforms(buildO, builderContext);

    return buildO;
};

export const defaultAssetOption: AssetOption = { filepath: 'assets/font/**/*.woff2' };

export const defaultBuilderOption = (): Partial<BuilderParameters> => {
    return {
        builderContext,
        buildOptions: buildOptions(),
        baseWebpackConfig: {
            mode: 'development'
        }
    };
}


export function createAddAssetIndexPlugin(
    assetsOption?: CreateOptionParam<AssetOption | AssetOption[]>,
    builderParameters?: CreateOptionParam<BuilderParameters>
): AddAssetIndexPluginPrivate {



    let assetsO: AssetOption | AssetOption[] = undefined;

    if (isDefined(assetsOption) && isArray(assetsOption.param))
        assetsO = assetsOption.param as AssetOption[];
    else {
        assetsO = assignRecursive(
            {},
            !assetsOption || !assetsOption.noDefault ? defaultAssetOption : {},
            assetsOption ? assetsOption.param : {}
        ) as AssetOption;
    }

    const builderParametersO = assignRecursiveArray({ builderContext }, [
        !builderParameters || !builderParameters.noDefault ? defaultBuilderOption() : {},
        builderParameters ? builderParameters.param : {}
    ], { depth: 2 } // defaultBuilderOption.buildOptions.indexTransform; is cyclic
    ) as BuilderParametersNeeded;

    return new AddAssetIndexPlugin(assetsO, builderParametersO) as any;
}
