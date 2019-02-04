const util = require('util');
const exec = util.promisify(require('child_process').exec);

// ../node_modules/.bin/webpack-cli
async function webpackCli() {
    const { stdout, stderr } = await exec('webpack-cli --mode=development');
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
}
webpackCli();
