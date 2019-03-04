import * as parse5 from 'parse5';
import * as defaultTreeAdapter from 'parse5/lib/tree-adapters/default';
import { RawSource, ReplaceSource } from 'webpack-sources';
import { compilation } from 'webpack';
import { AssetResolved } from './add-asset-index-plugin';
import { LocationInIndex } from './asset';
import { hash, HashOption } from './common';
import { HtmlSerializer, SerializerOption } from './html-serializer';
import { isDefined, isUndefined, isNull, isNil } from '../linked_modules/@mt/browser-util/is';
import { pathNormalize } from '../linked_modules/@mt/node-util/path-normalize';


type Compilation = compilation.Compilation;

export class FragmentData {
    location: number = undefined;
    fragment: DocumentFragment = undefined;
}

export class IndexWriterOption {
    indexInputPath: string = pathNormalize('src/index.html');
    indexOutputPath: string = 'index.html';
}

export class IndexWriter {
    // partially copied from @angular_devkit/build_angular/src/angular-cli-files/plugins/index-html-webpack-plugin.ts
    // updated from version 4 to 5 for parse5
    public option: IndexWriterOption;
    private head = new FragmentData();
    private body = new FragmentData();
    private indexSource: ReplaceSource;
    private initDone: boolean = false;

    constructor(public compilation: Compilation, option: IndexWriterOption) {
        this.option = Object.assign(new IndexWriterOption(), option);
    }

    public async init() {
        const indexContent = await this.readFile();

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
        this.indexSource = new ReplaceSource(new RawSource(indexContent), this.option.indexInputPath);
    }


    public async writeInIndex(assetResolved: AssetResolved[]) {
        if (!this.initDone) {
            this.initDone = true;
            await this.init();
        }

        for (const resolved of assetResolved) {

            const { place } = resolved.asset.option;

            const link = this.createLink(resolved);
            this.appendLinkToFragment(place, link);
        }

        this.insertFragmentsInIndex();

        // Add to compilation assets
        this.compilation.assets[ this.option.indexOutputPath ] = this.indexSource;
    }


    private createLink(assetResolved: AssetResolved): parse5.DefaultTreeElement {
        const { resolvedPath } = assetResolved;
        const { sri, attributes } = assetResolved.asset.option;

        const attrs = [
            { name: 'href', value: resolvedPath },
        ];

        if (sri) {
            const content = this.compilation.assets[ resolvedPath ].source();
            attrs.push(...this.generateSriAttributes(content));
        }

        if (attributes) {
            // can be { name: 'rel', value: 'preload' }, { name: 'as', value: 'font' },
            for (const [ name, value ] of Object.entries(attributes))
                attrs.push({ name, value });
        }

        const link: parse5.DefaultTreeElement = defaultTreeAdapter.createElement('link', undefined, attrs);
        return link;
    }


    private appendLinkToFragment(place: LocationInIndex, link: parse5.DefaultTreeElement) {

        const fragmentData = place === 'head' ? this.head : this.body;

        if (isUndefined(fragmentData.location)) {
            const error = new Error(`Missing ${place} element in ${this.option.indexInputPath}`);
            this.compilation.errors.push(error);
            throw error;
        }

        if (isUndefined(fragmentData.fragment))
            fragmentData.fragment = defaultTreeAdapter.createDocumentFragment();


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

    private async readFile(): Promise<string> {
        const { indexInputPath } = this.option;

        return new Promise<string>((resolve, reject) => {
            this.compilation.inputFileSystem.readFile(indexInputPath, (err: Error, data: Buffer) => {
                if (!isNil(err)) {
                    reject(err);
                    return;
                }

                let content: string = undefined;

                if (data.length >= 3 && data[ 0 ] === 0xEF && data[ 1 ] === 0xBB && data[ 2 ] === 0xBF) {
                    // Strip UTF-8 BOM
                    content = data.toString('utf8', 3);
                } else if (data.length >= 2 && data[ 0 ] === 0xFF && data[ 1 ] === 0xFE) {
                    // Strip UTF-16 LE BOM
                    content = data.toString('utf16le', 2);
                } else {
                    content = data.toString();
                }

                resolve(content);
            });
        });
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
