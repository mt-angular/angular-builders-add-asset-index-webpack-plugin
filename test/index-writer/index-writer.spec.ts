import { IndexWriter, IndexWriterOption } from '../../src/index-writer';
import { WebpackCompilation } from '../webpack.mock';
import { hash } from '../../src/common';
import { IndexWriterPrivate } from './index-writer.private';
import { WebpackCompilationMock, MocksData } from './webpack-compilation.mock';
import { assetResolved, assetsResolved } from './asset-resolved.mock';
import { assignDefaultOption } from '../../linked_modules/@mt/browser-util/assign';


function createIndexWriter(compilation: WebpackCompilation, option: IndexWriterOption): IndexWriterPrivate {
    // const o: IndexWriterOption = Object.assign({ indexInputPath: '/a/b/index.html', indexOutputPath: 'index.html' }, option);

    return new IndexWriter(compilation as any, option) as any;
}



function createMocks(mocksData?: MocksData, indexWriterOption?: Partial<IndexWriterOption>) {

    const indexWriterOpt = assignDefaultOption(new IndexWriterOption(), indexWriterOption as IndexWriterOption);

    const compilation = new WebpackCompilationMock(indexWriterOpt).init(mocksData).compilation;

    const indexWriter = createIndexWriter(compilation, indexWriterOpt);

    /* const o = assignDefaultOption(new IndexWriterOption(), {} as IndexWriterOption);
    const i = o.indexInputPath;
    console.log(compilation.assets[ i ].source().toString()); */
    return { compilation, indexWriter };
}


describe('Test suite of (all) IndexWriter public/private fields', () => {

    test('indexWriter.option should be overriden by the construction option', () => {
        const indexWriterOption: IndexWriterOption = {
            indexOutputPath: 'dist/index.html',
            indexInputPath: '/home/user/Project/src/index.html',
        };

        const { indexWriter } = createMocks(undefined, indexWriterOption);

        expect(indexWriter.option).toEqual(indexWriterOption);
    });

    /* test('readFile should read option.indexInputPath and return a Promise of the content', () => {
        const readFileContent = 'test';
        const indexInputPath = '/a/b/index.html';

        const { indexWriter, compilation } = createMocks({ assetInputContent: readFileContent }, { indexInputPath });

        const content = indexWriter.readFile();

        expect(compilation.inputFileSystem.readFile).toHaveBeenCalledWith(indexInputPath, expect.any(Function));
        expect(content).toBe(readFileContent);
    }); */


    /* test('readFile should throw if indexInputPath does not exist', () => {
        const readFileContent = new Error('file does not exist');

        const { indexWriter } = createMocks({ assetInputContent: readFileContent });

        expect.assertions(1);
        expect(indexWriter.readFile()).rejects.toThrow(readFileContent);
    }); */

    test('init should create this.{head, body, indexSource}', () => {
        const { indexWriter } = createMocks();
        // console.log(indexWriter.option.indexInputPath, indexWriter.compilation.assets);
        indexWriter.init();

        expect(indexWriter.head.location).toBeGreaterThanOrEqual(0);
        expect(indexWriter.body.location).toBeGreaterThanOrEqual(0);
        expect(indexWriter.indexSource).toBeDefined();
    });


    test('appendLinkToFragment should throw if place=head/body does not exist in index.html and write in compilation.errors', () => {
        expect.assertions(3);

        const { indexWriter, compilation } = createMocks({ assetOutputContent: '' });
        indexWriter.init();

        expect(indexWriter.head.location).toBe(undefined);

        const errorMsg = `Missing head element in ${indexWriter.option.indexInputPath}`;

        expect(() => indexWriter.appendLinkToFragment('head', undefined))
            .toThrow(errorMsg);

        expect(compilation.errors[ 0 ]).toEqual(new Error(errorMsg));
    });


    test('init should be called in writeInIndex if init not called previously', () => {
        const { indexWriter } = createMocks();

        const initMock = indexWriter.init = jest.fn();
        indexWriter.writeInIndex([]);

        expect(indexWriter.initDone).toBe(true);

        indexWriter.writeInIndex([]);

        expect(initMock).toHaveBeenCalledTimes(1);
    });


    test('createLink should create a link tag with the specific attributes of asset resolved', () => {
        const { indexWriter } = createMocks();

        const { asset, linkAttrs } = assetResolved();

        const link = indexWriter.createLink(asset);

        const expectedLink = {
            nodeName: 'link',
            tagName: 'link',
            attrs: linkAttrs,
            namespaceURI: undefined,
            childNodes: [],
            parentNode: null
        };

        expect(link.tagName).toBe(expectedLink.tagName);
        expect(link.attrs).toEqual(expectedLink.attrs);
    });


    test('appendLinkToFragment should append to head or body depending the option', () => {
        const { indexWriter } = createMocks();
        indexWriter.init();

        const { asset } = assetResolved();

        const link = indexWriter.createLink(asset);

        indexWriter.appendLinkToFragment('head', link);
        const linkInHead = indexWriter.head.fragment.childNodes[ 0 ];
        expect(link).toEqual(linkInHead);

        indexWriter.appendLinkToFragment('body', link);
        const linkInBody = indexWriter.body.fragment.childNodes[ 0 ];
        expect(link).toEqual(linkInBody);
    });


    test('writeInIndex should call createLink, appendLinkToFragment, insertFragmentsInIndex', () => {
        const { indexWriter } = createMocks();

        indexWriter.createLink = jest.fn();
        indexWriter.appendLinkToFragment = jest.fn();
        indexWriter.insertFragmentsInIndex = jest.fn();

        const { assets } = assetsResolved();

        indexWriter.writeInIndex(assets);

        expect(indexWriter.createLink).toHaveBeenCalledTimes(2);
        expect(indexWriter.appendLinkToFragment).toHaveBeenCalledTimes(2);
        expect(indexWriter.insertFragmentsInIndex).toHaveBeenCalledTimes(1);
    });

    test('insertFragmentsInIndex should call serializeHtml', () => {
        const { indexWriter } = createMocks();


        const { assets, indexSourceReplacements } = assetsResolved();

        const insertFragmentsInIndexMock = jest.spyOn(indexWriter, 'insertFragmentsInIndex');
        const serializeHtmlMock = jest.spyOn(indexWriter, 'serializeHtml');

        indexWriter.writeInIndex([ assets[ 0 ] ]);

        expect(insertFragmentsInIndexMock).toHaveBeenCalledTimes(1);
        expect(serializeHtmlMock).toHaveBeenCalledTimes(1);
        expect(serializeHtmlMock).toHaveBeenCalledWith(indexWriter.head.fragment, expect.any(Object));
        expect(serializeHtmlMock).toHaveReturnedWith(indexSourceReplacements[ 0 ]);
    });

    test('writeInIndex should write in indexSource', () => {
        const { indexWriter } = createMocks();

        const { assets, indexSourceReplacements } = assetsResolved();

        indexWriter.writeInIndex(assets);

        const indexSourceReplacement = indexSourceReplacements.join('');

        expect((indexWriter.indexSource.replacements[ 0 ] as any).content).toBe(indexSourceReplacement);
    });

    test('generateSriAttributes should generate the right attributes to insert in a link tag', () => {
        const { indexWriter } = createMocks();

        const assetContent = 'test';
        const algo = 'sha384';

        const sriAttributes = indexWriter.generateSriAttributes(assetContent, algo);

        const contentHash = hash(assetContent, { algo });

        const expectedSriAttributes = [
            { name: 'integrity', value: `${algo}-${contentHash}` },
            { name: 'crossorigin', value: 'anonymous' },
        ];

        expect(sriAttributes).toEqual(expect.arrayContaining(expectedSriAttributes));
    });

    test('sri option should generate the right attribute in the link tag', () => {
        const { indexWriter, compilation } = createMocks();

        const { asset } = assetResolved({ sri: true });

        const assetContent = 'test';
        const assetBuffer = Buffer.from(assetContent);


        compilation.assets[ asset.resolvedPath ] = {
            source: () => assetBuffer,
            size: () => assetBuffer.length
        };

        const link = indexWriter.createLink(asset);

        const algo = 'sha384';
        const contentHash = hash(assetContent, { algo });

        const expectedSriAttributes = [
            { name: 'integrity', value: `${algo}-${contentHash}` },
            { name: 'crossorigin', value: 'anonymous' },
        ];


        expect(link.attrs).toEqual(expect.arrayContaining(expectedSriAttributes));
    });


    test('writeInIndex should insert indexSource in compilation.assets', () => {
        const { indexWriter, compilation } = createMocks();

        const { assets } = assetsResolved();

        indexWriter.writeInIndex(assets);
        expect(compilation.assets[ indexWriter.option.indexOutputPath ]).toBe(indexWriter.indexSource);
    });
});
