import { WebpackCompilation } from '../webpack.mock';
import { indexHtmlMock } from './index.html.mock';
import { IndexWriterOption } from '../../src/index-writer';
import { assignDefaultOption } from '@upradata/browser-util';

export class MocksData {
    assetOutputContent?: string = indexHtmlMock;
}

export class WebpackCompilationMock {
    compilation = new WebpackCompilation();

    constructor(private indexWriterOption?: IndexWriterOption) {
        this.indexWriterOption = assignDefaultOption(new IndexWriterOption(), indexWriterOption as IndexWriterOption);
    }

    init(mocksData: MocksData = {}) {
        const mocks = { ...new MocksData(), ...mocksData };

        this.createReadFileMock(mocks.assetOutputContent);

        return this;
    }

    createReadFileMock(content: string) {

        /* const readFileMock = jest.fn((input: string, callback: ReadFileCallback) => {
            if (content instanceof Error) {
                callback(content, undefined);
            }
            else
                callback(undefined, Buffer.from(content));
        });

        this.compilation.inputFileSystem.readFile = readFileMock;

        return readFileMock; */
        const bufferContent = Buffer.from(content);

        this.compilation.assets[ 'index.html' ] = {
            source: () => bufferContent,
            size: () => bufferContent.length
        };
    }
}
