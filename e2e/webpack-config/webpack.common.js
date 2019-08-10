"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clean_webpack_plugin_1 = require("clean-webpack-plugin");
const path_1 = __importDefault(require("path"));
const node_util_1 = require("@upradata/node-util");
const html_webpack_plugin_1 = __importDefault(require("html-webpack-plugin"));
exports.root = path_1.default.resolve(__dirname, '..');
exports.distRelative = (mode) => path_1.default.join('dist', mode);
exports.dist = (mode) => path_1.default.join(exports.root, exports.distRelative(mode));
function commonWebpackConfiguration(option) {
    return {
        entry: path_1.default.resolve(exports.root, node_util_1.pathNormalize('src/index.js')),
        output: {
            path: exports.dist(option.mode),
            filename: 'index_bundle.js',
        },
        plugins: [
            new clean_webpack_plugin_1.CleanWebpackPlugin({
                cleanOnceBeforeBuildPatterns: [exports.dist(option.mode)],
                verbose: true,
                dangerouslyAllowCleanPatternsOutsideProject: true
            }),
            new html_webpack_plugin_1.default({
                template: path_1.default.join(exports.root, 'src/index.html'),
                filename: 'index.html'
            })
        ],
    };
}
exports.commonWebpackConfiguration = commonWebpackConfiguration;
//# sourceMappingURL=webpack.common.js.map