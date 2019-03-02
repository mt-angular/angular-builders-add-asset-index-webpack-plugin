import * as Parse5Serializer from 'parse5/lib/serializer';
import { TreeAdapter, Node } from 'parse5';
import * as HTML from 'parse5/lib/common/html';

const NS = HTML.NAMESPACES;

export interface SerializerOption {
    treeAdapter: TreeAdapter;
}

export declare class SerializerClass {
    static escapeString(str: string, attrMode: boolean);
    treeAdapter: TreeAdapter;
    html: string;

    constructor(node: Node, options: SerializerOption);
    serialize(): string;
}


const Serializer: typeof SerializerClass = Parse5Serializer;

export class HtmlSerializer extends Serializer {

    constructor(node: Node, options: SerializerOption) {
        super(node, options);
    }

    // overwriten from Serializer
    // tslint:disable-next-line: function-name
    _serializeAttributes(node: Node) {
        const attrs = this.treeAdapter.getAttrList(node);

        for (let i = 0, attrsLength = attrs.length; i < attrsLength; i++) {
            const attr = attrs[ i ];

            let value: string = undefined;
            if (typeof attr.value === 'boolean') { // here we handle the case if the value is a boolean (for boolean html attribute)
                if (attr.value) attr.value = '';
                else continue;
            }

            value = Serializer.escapeString(attr.value, true);

            this.html += ' ';

            if (!attr.namespace) {
                this.html += attr.name;
            } else if (attr.namespace === NS.XML) {
                this.html += 'xml:' + attr.name;
            } else if (attr.namespace === NS.XMLNS) {
                if (attr.name !== 'xmlns') {
                    this.html += 'xmlns:';
                }

                this.html += attr.name;
            } else if (attr.namespace === NS.XLINK) {
                this.html += 'xlink:' + attr.name;
            } else {
                this.html += attr.prefix + ':' + attr.name;
            }

            if (value !== '') // the only diff is the if
                this.html += '="' + value + '"';
        }
    }
}
