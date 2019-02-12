import { WebpackCompilation, ReadFileCallback } from '../webpack.mock';

export interface MocksData {
    readFileContent?: string;
}

export class WebpackCompilationMock {
    compilation = new WebpackCompilation();

    constructor() { }

    init(mocksData: MocksData = {}) {
        this.createReadFileMock(mocksData.readFileContent || 'test');

        return this;
    }

    createReadFileMock(content: string) {

        const readFileMock = jest.fn((input: string, callback: ReadFileCallback) => {
            callback(undefined, Buffer.from(content));
        });

        this.compilation.inputFileSystem.readFile = readFileMock;

        return readFileMock;
    }
}
