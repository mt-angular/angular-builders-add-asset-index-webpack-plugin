import { commonWebpackConfiguration } from './webpack.common';
import { addAssetIndexPluginList } from './add-asset-index-plugin-configurations';
import { Configuration as WebpackConfiguration } from 'webpack';
// I use util-dist instead of util because in this tsconfig I didn't put a outDir, then it would compile close to the original file
import { PlainObj } from '@upradata/browser-util';

/* export */ // const webpackConfig = {
export default function webpackConfig(env: PlainObj, argv: PlainObj): WebpackConfiguration[] {

    const AddAssetIndexPluginConfigs = addAssetIndexPluginList(argv as any);
    const webpackConfigs: WebpackConfiguration[] = [];


    for (const config of AddAssetIndexPluginConfigs) {
        const webpackConfiguration = commonWebpackConfiguration(argv as any);

        webpackConfiguration.output.path = config.outputDir;
        webpackConfiguration.plugins.push(config.configuration);

        webpackConfigs.push(webpackConfiguration);
    }

    return webpackConfigs;
}

// export = webpackConfig;
