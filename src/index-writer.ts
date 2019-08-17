import parse5, { DocumentFragment } from 'parse5';
import defaultTreeAdapter from 'parse5/lib/tree-adapters/default';
import { RawSource, ReplaceSource } from 'webpack-sources';
import { AssetResolved } from './add-asset-index-plugin';
import { LocationInIndex } from './asset';
import { hash, HashOption, Compilation } from './common';
import { HtmlSerializer, SerializerOption } from './html-serializer';
import { isDefined, isUndefined, isNull, isNil } from '@upradata/browser-util';
import { promisify } from 'util';
import { readFile } from 'fs';

const readFileAsync = promisify(readFile);

export class FragmentData {
    location: number = undefined;
    fragment: DocumentFragment = undefined;
}

export class IndexWriterOption {
    indexHtmlContent: string = '';
}

export class IndexWriter {
    // partially copied from @angular_devkit/build_angular/src/angular-cli-files/plugins/index-html-webpack-plugin.ts
    // updated from version 4 to 5 for parse5
    public option: IndexWriterOption;
    private head = new FragmentData();
    private body = new FragmentData();
    private indexSource: ReplaceSource;
    private initDone: boolean = false;

    constructor(option: IndexWriterOption) {
        this.option = Object.assign(new IndexWriterOption(), option);
    }

    public init() {
        const indexContent = this.option.indexHtmlContent;

        const document = parse5.parse(indexContent, { treeAdapter: defaultTreeAdapter, sourceCodeLocationInfo: true }) as parse5.DefaultTreeDocument;

        let headElement: parse5.DefaultTreeElement = undefined;
        let bodyElement: parse5.DefaultTreeElement = undefined;

        const childNodes = document.childNodes as parse5.DefaultTreeElement[];

        for (const docChild of childNodes) {
            if (docChild.tagName === 'html') {
                const docChildNodes = docChild.childNodes as parse5.DefaultTreeElement[];

                for (const htmlChild of docChildNodes) {
                    if (htmlChild.tagName === 'head') {
                        headElement = htmlChild;
                    }
                    if (htmlChild.tagName === 'body') {
                        bodyElement = htmlChild;
                    }
                }
            }
        }


        for (const { location, tagName } of [
            // sourceCodeLocation is null if indexContent does not contain the tag (head/body). So it is better
            // to return null to be compliant
            { location: isDefined(headElement) ? headElement.sourceCodeLocation : null, tagName: 'head' },
            { location: isDefined(bodyElement) ? bodyElement.sourceCodeLocation : null, tagName: 'body' },
        ]) {
            // I do not know if endTag is null or undefined if it does not exist
            if (!isNull(location) && !isNil(location.endTag)) {
                this[ tagName ].location = location.endTag.startOffset;
            } else {
                // Less accurate fallback
                // parse5 4.x does not provide locations if malformed html is present
                const index = indexContent.indexOf(`</${tagName}>`);
                this[ tagName ].location = index !== -1 ? index : undefined;
            }
        }

        // Inject into the html
        this.indexSource = new ReplaceSource(new RawSource(indexContent), this.option.indexHtmlContent);
    }


    public async writeInIndex(assetResolved: AssetResolved[]): Promise<string> {
        if (!this.initDone) {
            this.initDone = true;
            this.init();
        }

        const links$: Promise<void>[] = [];

        for (const resolved of assetResolved) {

            const { place } = resolved.asset;


            const link$ = this.createLink(resolved).then(link => this.appendLinkToFragment(place, link));
            links$.push(link$);
        }

        await Promise.all(links$);
        this.insertFragmentsInIndex();

        // Add to compilation assets
        return this.indexSource.source();
    }

    private getAssetContent(path: string): Promise<string> {
        return readFileAsync(path, { encoding: 'utf8' });
    }

    private async createLink(assetResolved: AssetResolved): Promise<parse5.DefaultTreeElement> {
        const { resolvedPath } = assetResolved;
        const { sri, attributes } = assetResolved.asset;

        const attrs = [
            { name: 'href', value: resolvedPath.relative },
        ];

        if (sri) {
            const content = await this.getAssetContent(resolvedPath.absolute);
            attrs.push(...this.generateSriAttributes(content));
        }

        if (attributes) {
            // can be { name: 'rel', value: 'preload' }, { name: 'as', value: 'font' },
            for (const [ name, value ] of Object.entries(attributes))
                attrs.push({ name, value: value as any }); // value can be string or boolean but the typing does not match my html-serializer
        }

        const link: parse5.DefaultTreeElement = defaultTreeAdapter.createElement('link', undefined, attrs);
        return link;
    }


    private appendLinkToFragment(place: LocationInIndex, link: parse5.DefaultTreeElement) {

        const fragmentData = place === 'head' ? this.head : this.body;

        if (isUndefined(fragmentData.location)) {
            throw new Error(`Missing ${place} element in index.html content: "${this.option.indexHtmlContent}"`);
        }

        if (isUndefined(fragmentData.fragment)) {
            fragmentData.fragment = defaultTreeAdapter.createDocumentFragment();
        }

        defaultTreeAdapter.appendChild(fragmentData.fragment, link);
    }


    private insertFragmentsInIndex() {

        for (const fragmentData of [ this.head, this.body ]) {
            if (isDefined(fragmentData.fragment)) {
                this.indexSource.insert(
                    fragmentData.location,
                    // parse5.serialize is not handling boolean attributes
                    this.serializeHtml(fragmentData.fragment, { treeAdapter: defaultTreeAdapter }),
                );
            }
        }

    }

    private serializeHtml(node: parse5.Node, options: SerializerOption): string {
        const serializer = new HtmlSerializer(node, options);

        return serializer.serialize();
    }


    private generateSriAttributes(content: string, hashOption?: HashOption): { name: string; value: string }[] {
        const hashOpt = Object.assign({ algo: 'sha384', digest: 'base64' }, hashOption);
        const contentHash = hash(content, hashOpt);

        const { algo } = hashOpt;

        return [
            { name: 'integrity', value: `${algo}-${contentHash}` },
            { name: 'crossorigin', value: 'anonymous' },
        ];
    }
}
