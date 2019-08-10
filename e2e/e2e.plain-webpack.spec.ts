import { addAssetIndexPluginList } from './webpack-config/add-asset-index-plugin-configurations';
import path from 'path';
import { execSyncCommand, readFileAsync } from './util';



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
    development: Array<string>[]
    production: Array<string>[]
} = {} as any;

for (const mode of modes) {
    console.log('Execute Webpack', commands.runWebpack(mode));
    execSyncCommand(commands.runWebpack(mode));

    const webpackConfigurations = addAssetIndexPluginList({ mode });
    configs[ mode ] = webpackConfigurations.map(config => [ config.title, config.outputDir ]);
}


describe.each(modes)(
    'Test suite for e2e webpack config with AddAssetIndexPlugin. Webpack mode = %s End2End',
    (mode: 'development' | 'production') => {


        /* beforeAll(() => {
             jest.setTimeout(30000);
        }); */
        test.each(configs[ mode ])(
            'Snapshot index.html: %s', async (title: string, outputDir: string) => {
                const indexHTML = await readFileAsync(path.join(outputDir, 'index.html'), { encoding: 'utf8' });
                expect(indexHTML).toMatchSnapshot();
            });

    }
);
