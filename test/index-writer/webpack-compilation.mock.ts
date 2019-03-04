import { WebpackCompilation, ReadFileCallback } from '../webpack.mock';
import { indexHtmlMock } from './index.html.mock';

export class MocksData {
    readFileContent?: string | Error = indexHtmlMock;
}

export class WebpackCompilationMock {
    compilation = new WebpackCompilation();

    constructor() { }

    init(mocksData: MocksData = {}) {
        const mocks = { ...new MocksData(), ...mocksData };

        this.createReadFileMock(mocks.readFileContent);

        return this;
    }

    createReadFileMock(content: string | Error) {

        const readFileMock = jest.fn((input: string, callback: ReadFileCallback) => {
            if (content instanceof Error) {
                callback(content, undefined);
            }
            else
                callback(undefined, Buffer.from(content));
        });

        this.compilation.inputFileSystem.readFile = readFileMock;

        return readFileMock;
    }
}
