
import { Configuration as WebpackConfiguration } from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import path from 'path';
import { pathNormalize } from '@upradata/node-util';
import HtmlWebpackPlugin from 'html-webpack-plugin';

// I use util-dist instead of util because in this tsconfig I didn't put a outDir, then it would compile close to the original file
// import { AddAssetIndexPlugin } from '../../dist/src/add-asset-index-plugin';

export type Mode = 'development' | 'production';

export const root = path.resolve(__dirname, '..');
export const distRelative = (mode: Mode) => path.join('dist', mode);
export const dist = (mode: Mode) => path.join(root, distRelative(mode));


export function commonWebpackConfiguration(option: { mode: Mode }): WebpackConfiguration {
    return {
        entry: path.resolve(root, pathNormalize('src/index.js')),
        output: {
            path: dist(option.mode), // to be overriden afterwards
            filename: 'index_bundle.js',
        },
        plugins: [
            new CleanWebpackPlugin({
                cleanOnceBeforeBuildPatterns: [ dist(option.mode) ],
                verbose: true,
                dangerouslyAllowCleanPatternsOutsideProject: true
            }),
            new HtmlWebpackPlugin({
                template: path.join(root, 'src/index.html'),
                filename: 'index.html'
            })
        ],
    };
}
