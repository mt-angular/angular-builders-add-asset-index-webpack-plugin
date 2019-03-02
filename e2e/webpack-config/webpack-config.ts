import { commonWebpackConfiguration } from './webpack.common';
import { addAssetIndexPlugin } from './add-asset-index-plugin-configurations';
// I use util-dist instead of util because in this tsconfig I didn't put a outDir, then it would compile close to the original file
import { PlainObj } from '../../linked_modules/@mt/util-dist/type';
import { Configuration } from 'webpack';


/* export */ // const webpackConfig = {
export default function webpackConfig(env: PlainObj, argv: PlainObj) {

    const AddAssetIndexPluginConfigs = addAssetIndexPlugin(argv as any);
    const webpackConfigs: Configuration[] = [];


    for (const config of AddAssetIndexPluginConfigs) {
        const webpackConfiguration = commonWebpackConfiguration(argv as any);

        webpackConfiguration.output.path = config.outputDir;
        webpackConfiguration.plugins.push(config.configuration);

        webpackConfigs.push(webpackConfiguration);
    }

    return webpackConfigs;
}

// export = webpackConfig;
