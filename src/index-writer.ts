import * as crypto from 'crypto';
import * as parse5 from 'parse5';
import * as defaultTreeAdapter from 'parse5/lib/tree-adapters/default';
import { RawSource, ReplaceSource } from 'webpack-sources';
import { compilation } from 'webpack';
import { AssetResolved } from './add-asset-index-plugin';
import { isDefined, isUndefined } from '../linked_modules/@mt/util';

type Compilation = compilation.Compilation;

export interface IndexWriterOption {
    indexInputPath: string;
    indexOutputPath: string;
}

export class IndexWriter {
    // partially copied from @angular_devkit/build_angular/src/angular-cli-files/plugins/index-html-webpack-plugin.ts
    // updated from version 4 to 5 for parse5

    private headInsertionPoint: number;
    private bodyInsertionPoint: number;
    private indexSource: ReplaceSource;
    private assetHeadFragment: DocumentFragment;
    private assetBodyFragment: DocumentFragment;


    constructor(public compilation: Compilation, public option: IndexWriterOption) { }

    async initReadIndex() {
        const indexContent = await this.readFile(); // option.input = index.html or something else

        const document = parse5.parse(indexContent, { treeAdapter: defaultTreeAdapter, sourceCodeLocationInfo: true }) as parse5.DefaultTreeDocument;

        let headElement: parse5.DefaultTreeElement
        let bodyElement: parse5.DefaultTreeElement

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


        if (!headElement || !bodyElement) {
            const error = new Error('Missing head and/or body elements');
            this.compilation.errors.push(error);
            throw error;
        }


        const headElementLocation = headElement.sourceCodeLocation;
        if (isDefined(headElementLocation) && headElementLocation.endTag) {
            this.headInsertionPoint = headElementLocation.endTag.startOffset;
        } else {
            // Less accurate fallback
            // parse5 4.x does not provide locations if malformed html is present
            this.headInsertionPoint = indexContent.indexOf('</head>');
        }


        const bodyElementLocation = headElement.sourceCodeLocation;
        if (isDefined(bodyElementLocation) && bodyElementLocation.endTag) {
            this.bodyInsertionPoint = bodyElementLocation.endTag.startOffset;
        } else {
            // Less accurate fallback
            // parse5 4.x does not provide locations if malformed html is present
            this.bodyInsertionPoint = indexContent.indexOf('</body>');
        }


        // Inject into the html
        this.indexSource = new ReplaceSource(new RawSource(indexContent), this.option.indexInputPath);
    }


    async writeInIndex(assetResolved: AssetResolved[]) {

        const assetHeadElements = { exist: false, fragment: defaultTreeAdapter.createDocumentFragment() };
        const assetBodyElements = { exist: false, fragment: defaultTreeAdapter.createDocumentFragment() };

        for (const resolved of assetResolved) {
            const { resolvedPath } = resolved;
            const { sri, attributes, place } = resolved.asset.option;

            const attrs = [
                { name: 'rel', value: 'preload' },
                { name: 'href', value: resolvedPath },
            ];

            if (sri) {
                const content = this.compilation.assets[resolvedPath].source();
                attrs.push(...this.generateSriAttributes(content));
            }

            if (attributes) {
                for (const [name, value] of Object.entries(attributes))
                    attrs.push({ name, value });
            }

            const element = defaultTreeAdapter.createElement('link', undefined, attrs);
            if (place === 'head')
                assetHeadElements.exist = true && defaultTreeAdapter.appendChild(assetHeadElements.fragment, element);
            else
                assetBodyElements.exist = true && defaultTreeAdapter.appendChild(assetBodyElements.fragment, element);
        }

        if (assetHeadElements.exist) {
            this.indexSource.insert(
                this.headInsertionPoint,
                parse5.serialize(assetHeadElements.fragment, { treeAdapter: defaultTreeAdapter }),
            );
        }

        if (assetBodyElements.exist) {
            this.indexSource.insert(
                this.bodyInsertionPoint,
                parse5.serialize(assetBodyElements.fragment, { treeAdapter: defaultTreeAdapter }),
            );
        }

        // Add to compilation assets
        this.compilation.assets[this.option.indexOutputPath || 'index.html'] = this.indexSource;
    }


    private createLink(assetResolved: AssetResolved) {
        const { resolvedPath } = assetResolved;
        const { sri, attributes, place } = assetResolved.asset.option;

        const attrs = [
            { name: 'rel', value: 'preload' },
            { name: 'href', value: resolvedPath },
        ];

        if (sri) {
            const content = this.compilation.assets[resolvedPath].source();
            attrs.push(...this.generateSriAttributes(content));
        }

        if (attributes) {
            for (const [name, value] of Object.entries(attributes))
                attrs.push({ name, value });
        }

        const link: parse5.DefaultTreeElement = defaultTreeAdapter.createElement('link', undefined, attrs);
        this.appendLinkToIndex(assetResolved, link);
    }

    private appendLinkToIndex(assetResolved: AssetResolved, link: parse5.DefaultTreeElement) {
        const place = assetResolved.asset.option.place;
        let fragment = place === 'head' ? this.assetHeadFragment : this.assetBodyFragment;

        if (isUndefined(fragment))
            fragment = defaultTreeAdapter.createDocumentFragment();


        defaultTreeAdapter.appendChild(fragment, link);
    }



    private readFile(): Promise<string> {
        const { indexInputPath } = this.option;

        return new Promise<string>((resolve, reject) => {
            this.compilation.inputFileSystem.readFile(indexInputPath, (err: Error, data: Buffer) => {
                if (err) {
                    reject(err);

                    return;
                }

                let content;
                if (data.length >= 3 && data[0] === 0xEF && data[1] === 0xBB && data[2] === 0xBF) {
                    // Strip UTF-8 BOM
                    content = data.toString('utf8', 3);
                } else if (data.length >= 2 && data[0] === 0xFF && data[1] === 0xFE) {
                    // Strip UTF-16 LE BOM
                    content = data.toString('utf16le', 2);
                } else {
                    content = data.toString();
                }

                resolve(content);
            });
        });
    }


    private generateSriAttributes(content: string) {
        const algo = 'sha384';
        const hash = crypto.createHash(algo)
            .update(content, 'utf8')
            .digest('base64');

        return [
            { name: 'integrity', value: `${algo}-${hash}` },
            { name: 'crossorigin', value: 'anonymous' },
        ];
    }
}
