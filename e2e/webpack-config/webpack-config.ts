import { commonWebpackConfiguration } from './webpack.common';
import { addAssetIndexPlugin } from './add-asset-index-plugin-configurations';
import { PlainObj } from '../../linked_modules/@mt/util/type';
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
