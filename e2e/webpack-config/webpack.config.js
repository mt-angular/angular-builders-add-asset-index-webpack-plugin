"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_common_1 = require("./webpack.common");
const add_asset_index_plugin_configurations_1 = require("./add-asset-index-plugin-configurations");
/* export */ // const webpackConfig = {
function webpackConfig(env, argv) {
    const AddAssetIndexPluginConfigs = add_asset_index_plugin_configurations_1.addAssetIndexPluginList(argv);
    const webpackConfigs = [];
    for (const config of AddAssetIndexPluginConfigs) {
        const webpackConfiguration = webpack_common_1.commonWebpackConfiguration(argv);
        webpackConfiguration.output.path = config.outputDir;
        webpackConfiguration.plugins.push(config.configuration);
        webpackConfigs.push(webpackConfiguration);
    }
    return webpackConfigs;
}
exports.default = webpackConfig;
// export = webpackConfig;
//# sourceMappingURL=webpack.config.js.map