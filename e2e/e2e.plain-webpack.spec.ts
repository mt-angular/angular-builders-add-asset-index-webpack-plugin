import { addAssetIndexPluginList, assetDir } from './webpack-config/add-asset-index-plugin-configurations';
import path from 'path';
import { execSyncCommand, readFileAsync } from './util';
import { AddAssetIndexPlugin } from '../dist/add-asset-index-plugin';
import { Transforms } from '@ud-angular-builders/custom-webpack/dist/transforms';
import rimraf from 'rimraf';
import { writeFile } from 'fs';
import { promisify } from 'util';

const rmAsync = promisify(rimraf);
const writeFileAsync = promisify(writeFile);

const rootProject = path.resolve(__dirname, '..');

const directories = {
    webpackConfig: path.join(__dirname, 'webpack-config'),
    root: rootProject,
    dist: path.join(__dirname, 'dist')
};



const commands = {
    compileProject: `npx tsc --project ${rootProject}`,
    compileWebpackConfigs: `npx tsc --project ${directories.webpackConfig}`,
    runWebpack: mode => `npx webpack --mode ${mode} --config ${path.join(directories.webpackConfig, 'webpack.config.js')}`
};


console.log('Compile Project', commands.compileProject);
execSyncCommand(commands.compileProject);

console.log('Compile Webpack', commands.compileWebpackConfigs);
execSyncCommand(commands.compileWebpackConfigs);



const modes: Array<'development' | 'production'> = [ 'development', 'production' ];
const configs: {
    development: [ string, string, string, AddAssetIndexPlugin ][]
    production: [ string, string, string, AddAssetIndexPlugin ][]
} = {} as any;

for (const mode of modes) {
    console.log('Execute Webpack', commands.runWebpack(mode));
    execSyncCommand(commands.runWebpack(mode));

    const webpackConfigurations = addAssetIndexPluginList({ mode });
    configs[ mode ] = webpackConfigurations.map(config => [ config.title, config.outputDir, config.tmpFile, config.configuration ]);
}


afterAll(async () => {
    await rmAsync(assetDir);
});

describe.each(modes)(
    'Test suite for e2e webpack config with AddAssetIndexPlugin. Webpack mode = %s End2End',
    (mode: 'development' | 'production') => {


        /* beforeAll(() => {
             jest.setTimeout(30000);
        }); */

        test.each(configs[ mode ])(
            'Snapshot index.html: %s', async (title: string, outputDir: string, tmpFile: string, addAssetIndexPlugin: AddAssetIndexPlugin) => {

                const indexFile = path.join(outputDir, 'index.html');

                let indexHTMLContent = await readFileAsync(indexFile, { encoding: 'utf8' });
                const transforms: Transforms = (addAssetIndexPlugin as any).builderParameters.buildOptions.indexTransforms;
                (addAssetIndexPlugin as any).tmpFile = tmpFile;

                indexHTMLContent = await transforms.indexHtml(indexHTMLContent);
                await writeFileAsync(indexFile, indexHTMLContent, { encoding: 'utf8' });

                expect(indexHTMLContent).toMatchSnapshot();
            });

    }
);
