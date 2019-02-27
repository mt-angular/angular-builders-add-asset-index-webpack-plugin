import * as path from 'path';
import { AssetOption } from '../../src/asset';
import { BuilderParameters, AddAssetIndexPlugin, BuilderParametersOptions } from '../../src/add-asset-index-plugin';
import { AddAssetIndexPluginPrivate } from './add-asset-index-plugin.private';
import { isDefined, isArray } from '../../linked_modules/@mt/util/is';
import { assignRecursive } from '../../linked_modules/@mt/util/assign';
import { PartialRecursive } from '../../linked_modules/@mt/util/type';

export interface CreateOptionParam<T> {
    param: PartialRecursive<T>;
    noDefault?: boolean;
}


export const root = '/path/to/root';
export const defaultAssetOption = { filepath: 'assets/font/**/*.woff2' };
export const defaultBuilderOption = {
    options: {
        index: path.join(root, 'src/index.html'),
        subresourceIntegrity: false,
        baseHref: undefined as string,
        deployUrl: undefined as string,
        place: 'head',
        hash: false
    },
    webpackConfiguration: {
        mode: 'development'
    }
};


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

    const builderParametersO = assignRecursive(
        { root },
        !builderParameters || !builderParameters.noDefault ? defaultBuilderOption : {},
        builderParameters ? builderParameters.param : {}
    ) as BuilderParameters;

    return new AddAssetIndexPlugin(assetsO, builderParametersO) as any;
}
