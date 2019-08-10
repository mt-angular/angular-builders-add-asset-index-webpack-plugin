import { execAsyncCommand, readFileAsync } from './util';
import path from 'path';
import { pathNormalize } from '@upradata/node-util';

const angularDir = path.join(__dirname, pathNormalize('../angular-test'));

describe(
    // tslint:disable-next-line: max-line-length
    'Angular test suite snapshots: angular.json set with architect.build.builder: "./linked_modules/custom-webpack-builder-dist-copy:browser and builder.options.customWebpackConfig.path: "./extra-webpack.config.js"', () => {

        beforeAll(() => {
            jest.setTimeout(30000);
        });

        const configs = [
            { title: 'development build', command: `(cd ${angularDir} && ng build)` },
            { title: 'production build', command: `(cd ${angularDir} && ng build --prod)` }
        ].map(c => [ c.title, c.command ]);

        test.each(configs)(
            'Snapshot index.html: %s', async (title: string, command: string) => {
                await execAsyncCommand(command);

                const indexHTML = await readFileAsync(
                    path.resolve(__dirname, angularDir, pathNormalize('dist/angular-test/index.html')),
                    { encoding: 'utf8' });

                expect(indexHTML).toMatchSnapshot();
            });

    });
