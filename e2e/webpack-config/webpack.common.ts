
import * as CleanWebpackPlugin from 'clean-webpack-plugin';
import * as path from 'path';
import { pathNormalize } from '../../linked_modules/@mt/util-dist/path-normalize';
// I use util-dist instead of util because in this tsconfig I didn't put a outDir, then it would compile close to the original file

export type Mode = 'development' | 'production';

export const root = path.resolve(__dirname, '..');
export const distRelative = (mode: Mode) => path.join('dist', mode);
export const dist = (mode: Mode) => path.join(root, distRelative(mode));


export function commonWebpackConfiguration(option: { mode: Mode }) {
    return {
        entry: path.resolve(root, pathNormalize('src/index.js')),
        output: {
            path: dist(option.mode), // to be overriden afterwards
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
            new CleanWebpackPlugin([ distRelative(option.mode) ], { root, verbose: true }),
        ],
    };
}
