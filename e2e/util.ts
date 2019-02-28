import { promisify } from 'util';
import { execSync, exec } from 'child_process';
import { readFile } from 'fs';


const execAsync = promisify(exec);


export const execSyncCommand = promisify(execSync);
export const readFileAsync = promisify(readFile);

export async function execAsyncCommand(command: string, verbose: boolean = false) {
    const { stdout, stderr } = await execAsync(command);

    if (verbose) {
        console.log('stdout:', stdout);
        console.log('stderr:', stderr);
    }
}
