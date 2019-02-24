export type ReadFileCallback = (err: Error, data: Buffer) => void;


export interface WebpackAsset {
    source: () => Buffer;
    size: () => number;
}


export class WebpackCompilation {
    inputFileSystem = { readFile: undefined };
    errors: Array<Error> = [];
    assets: { [ filepath: string ]: WebpackAsset } = {};
} 
