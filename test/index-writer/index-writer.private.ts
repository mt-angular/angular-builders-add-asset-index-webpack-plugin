import { WebpackCompilation } from '../webpack.mock';
import { IndexWriterOption, FragmentData } from '../../src/index-writer';
import { AssetResolved } from '../../src/add-asset-index-plugin';
import { LocationInIndex } from '../../src/asset';
import * as parse5 from 'parse5';
import { ReplaceSource } from 'webpack-sources';
import { SerializerOption } from '../../src/html-serializer';

export interface IndexWriterPrivate {
    head: FragmentData;
    body: FragmentData;
    indexSource: ReplaceSource;
    initDone: boolean;
    compilation: WebpackCompilation;
    option: IndexWriterOption;


    (compilation: WebpackCompilation, option: IndexWriterOption): IndexWriterPrivate;


    init(): void;
    writeInIndex(assetResolved: AssetResolved[]): void;
    createLink(assetResolved: AssetResolved): parse5.DefaultTreeElement;
    appendLinkToFragment(place: LocationInIndex, link: parse5.DefaultTreeElement);
    insertFragmentsInIndex(): void;
    readFile(): Promise<string>;
    getInputContent(): string;
    generateSriAttributes(content: string, algo?: string): { name: string; value: string }[];
    serializeHtml(node: parse5.Node, options: SerializerOption): string;
}
