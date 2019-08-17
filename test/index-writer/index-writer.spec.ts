import { IndexWriter, IndexWriterOption } from '../../src/index-writer';
import { hash } from '../../src/common';
import { IndexWriterPrivate } from './index-writer.private';
import { assetResolved, assetsResolved } from './asset-resolved.mock';
import { assignDefaultOption } from '@upradata/browser-util';
import { DefaultTreeDocumentFragment } from 'parse5';
import { indexHtmlMock } from './index.html.mock';


function createIndexWriter(option: IndexWriterOption): IndexWriterPrivate {
    // const o: IndexWriterOption = Object.assign({ indexInputPath: '/a/b/index.html', indexOutputPath: 'index.html' }, option);

    return new IndexWriter(option) as any;
}



function createMocks(indexWriterOption?: Partial<IndexWriterOption>) {

    const indexWriterOpt = assignDefaultOption({ indexHtmlContent: indexHtmlMock }, indexWriterOption as IndexWriterOption);

    const indexWriter = createIndexWriter(indexWriterOpt);

    /* const o = assignDefaultOption(new IndexWriterOption(), {} as IndexWriterOption);
    const i = o.indexInputPath;
    console.log(compilation.assets[ i ].source().toString()); */
    return indexWriter;
}


describe('Test suite of (all) IndexWriter public/private fields', () => {

    test('indexWriter.option should be overriden by the construction option', () => {
        const indexWriterOption: IndexWriterOption = {
            indexHtmlContent: indexHtmlMock
        };

        const indexWriter = createMocks(indexWriterOption);

        expect(indexWriter.option).toEqual(indexWriterOption);
    });

    test('init should create this.{head, body, indexSource}', () => {
        const indexWriter = createMocks();
        // console.log(indexWriter.option.indexInputPath, indexWriter.compilation.assets);
        indexWriter.init();

        expect(indexWriter.head.location).toBeGreaterThanOrEqual(0);
        expect(indexWriter.body.location).toBeGreaterThanOrEqual(0);
        expect(indexWriter.indexSource).toBeDefined();
    });


    test('appendLinkToFragment should throw if place=head/body does not exist in index.html and write in compilation.errors', () => {
        expect.assertions(2);

        const indexWriter = createMocks({ indexHtmlContent: '' });
        indexWriter.init();

        expect(indexWriter.head.location).toBe(undefined);

        const errorMsg = `Missing head element in index.html content: "${indexWriter.option.indexHtmlContent}"`;

        expect(() => indexWriter.appendLinkToFragment('head', undefined))
            .toThrow(errorMsg);
    });


    test('init should be called in writeInIndex if init not called previously', async () => {
        const indexWriter = createMocks();

        const initMock = indexWriter.init = jest.fn();
        indexWriter.indexSource = { source: () => '' } as any;
        await indexWriter.writeInIndex([]);

        expect(indexWriter.initDone).toBe(true);

        await indexWriter.writeInIndex([]);

        expect(initMock).toHaveBeenCalledTimes(1);
    });


    test('createLink should create a link tag with the specific attributes of asset resolved', async () => {
        const indexWriter = createMocks();

        const { asset, linkAttrs } = assetResolved();

        const link = await indexWriter.createLink(asset);

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


    test('appendLinkToFragment should append to head or body depending the option', async () => {
        const indexWriter = createMocks();
        indexWriter.init();

        const { asset } = assetResolved();

        const link = await indexWriter.createLink(asset);

        indexWriter.appendLinkToFragment('head', link);
        const linkInHead = (indexWriter.head.fragment as DefaultTreeDocumentFragment).childNodes[ 0 ];
        expect(link).toEqual(linkInHead);

        indexWriter.appendLinkToFragment('body', link);
        const linkInBody = (indexWriter.body.fragment as DefaultTreeDocumentFragment).childNodes[ 0 ];
        expect(link).toEqual(linkInBody);
    });


    test('writeInIndex should call createLink, appendLinkToFragment, insertFragmentsInIndex', async () => {
        const indexWriter = createMocks();

        indexWriter.createLink = jest.fn(() => Promise.resolve() as any);
        indexWriter.appendLinkToFragment = jest.fn();
        indexWriter.insertFragmentsInIndex = jest.fn();

        const { assets } = assetsResolved();

        await indexWriter.writeInIndex(assets);

        expect(indexWriter.createLink).toHaveBeenCalledTimes(2);
        expect(indexWriter.appendLinkToFragment).toHaveBeenCalledTimes(2);
        expect(indexWriter.insertFragmentsInIndex).toHaveBeenCalledTimes(1);
    });

    test('insertFragmentsInIndex should call serializeHtml', async () => {
        const indexWriter = createMocks();


        const { assets, indexSourceReplacements } = assetsResolved();

        const insertFragmentsInIndexMock = jest.spyOn(indexWriter, 'insertFragmentsInIndex');
        const serializeHtmlMock = jest.spyOn(indexWriter, 'serializeHtml');

        await indexWriter.writeInIndex([ assets[ 0 ] ]);

        expect(insertFragmentsInIndexMock).toHaveBeenCalledTimes(1);
        expect(serializeHtmlMock).toHaveBeenCalledTimes(1);
        expect(serializeHtmlMock).toHaveBeenCalledWith(indexWriter.head.fragment, expect.any(Object));
        expect(serializeHtmlMock).toHaveReturnedWith(indexSourceReplacements[ 0 ]);
    });

    test('writeInIndex should write in indexSource', async () => {
        const indexWriter = createMocks();

        const { assets, indexSourceReplacements } = assetsResolved();

        await indexWriter.writeInIndex(assets);

        const indexSourceReplacement = indexSourceReplacements.join('');

        expect((indexWriter.indexSource.replacements[ 0 ] as any).content).toBe(indexSourceReplacement);
    });

    test('generateSriAttributes should generate the right attributes to insert in a link tag', async () => {
        const indexWriter = createMocks();

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

    test('sri option should generate the right attribute in the link tag', async () => {
        const indexWriter = createMocks();

        const { asset } = assetResolved({ sri: true });

        const assetContent = 'asset file to test';

        /* 
        const assetBuffer = Buffer.from(assetContent);
        compilation.assets[ asset.resolvedPath ] = {
             source: () => assetBuffer,
             size: () => assetBuffer.length
         }; */
        indexWriter.getAssetContent = jest.fn(() => Promise.resolve(assetContent));
        const link = await indexWriter.createLink(asset);

        const algo = 'sha384';
        const contentHash = hash(assetContent, { algo });

        const expectedSriAttributes = [
            { name: 'integrity', value: `${algo}-${contentHash}` },
            { name: 'crossorigin', value: 'anonymous' },
        ];


        expect(link.attrs).toEqual(expect.arrayContaining(expectedSriAttributes));
    });


    test('writeInIndex should return the transformed index.html content', async () => {
        const indexWriter = createMocks({ indexHtmlContent: indexHtmlMock });

        const { assets } = assetsResolved();

        const indexContent = await indexWriter.writeInIndex(assets);
        expect(indexContent).toBe(indexWriter.indexSource.source());
    });
});
