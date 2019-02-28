"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CleanWebpackPlugin = require("clean-webpack-plugin");
const path = require("path");
const path_normalize_1 = require("../../linked_modules/@mt/util/path-normalize");
exports.root = path.resolve(__dirname, '..');
exports.distRelative = (mode) => path.join('dist', mode);
exports.dist = (mode) => path.join(exports.root, exports.distRelative(mode));
function commonWebpackConfiguration(option) {
    return {
        entry: path.resolve(exports.root, path_normalize_1.pathNormlize('src/index.js')),
        output: {
            path: exports.dist(option.mode),
            filename: 'index_bundle.js',
        },
        module: {
            rules: [
                {
                    test: /\.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2|ani)$/,
                    loader: 'file-loader',
                    options: {
                        name: `[name][hash].[ext]`,
                    },
                }
            ],
        },
        plugins: [
            new CleanWebpackPlugin([exports.distRelative(option.mode)], { root: exports.root, verbose: true }),
        ],
    };
}
exports.commonWebpackConfiguration = commonWebpackConfiguration;
//# sourceMappingURL=webpack.common.js.map