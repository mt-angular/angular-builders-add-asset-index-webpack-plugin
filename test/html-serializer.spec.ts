import { HtmlSerializer, SerializerClass } from '../src/html-serializer';
import * as Parse5Serializer from 'parse5/lib/serializer';
import * as defaultTreeAdapter from 'parse5/lib/tree-adapters/default';


describe('Test suite for html-serializer', () => {

    function getSerializer(attrs: { name: string; value: string | boolean; }[]) {
        const link = defaultTreeAdapter.createElement('link', undefined, attrs);
        const fragment = defaultTreeAdapter.createDocumentFragment();


        defaultTreeAdapter.appendChild(fragment, link);

        const htmlSerializer = new HtmlSerializer(fragment, { treeAdapter: defaultTreeAdapter });
        const parse5Serializer: SerializerClass = new Parse5Serializer(fragment, { treeAdapter: defaultTreeAdapter });

        return { htmlSerializer, parse5Serializer };
    }



    test('HtmlSerializer inherits from Serializer', () => {
        const { htmlSerializer } = getSerializer([]);

        expect(htmlSerializer instanceof Parse5Serializer).toBe(true);
    });


    test('HtmlSerializer.serialize should serialize the same as parse5.serialize for non boolean attributes', () => {
        const attrs = [
            { name: 'href', value: 'link/to/href' },
            { name: 'rel', value: 'preload' },
            { name: 'as', value: 'font' }
        ];


        const { htmlSerializer, parse5Serializer } = getSerializer(attrs);

        expect(htmlSerializer.serialize()).toBe(parse5Serializer.serialize());
    });

    test('HtmlSerializer.serialize should serialize boolean attributes without value', () => {
        const parse5Attrs = [
            { name: 'href', value: 'link/to/href' },
            { name: 'rel', value: 'preload' },
            { name: 'as', value: 'font' }
        ];

        const booleantAttrs = [
            { name: 'boolean-attr', value: '' },
            { name: 'boolean-attr2', value: true },
            { name: 'boolean-attr-skipped', value: false }
        ];


        const { htmlSerializer } = getSerializer([ ...parse5Attrs, ...booleantAttrs ]);
        const { parse5Serializer } = getSerializer(parse5Attrs);

        const parse5Html = parse5Serializer.serialize();

        const expectedHtml = `${parse5Html.slice(0, -1)} ${booleantAttrs.filter(attr => attr.value !== false).map(attr => attr.name).join(' ')}>`;
        expect(htmlSerializer.serialize()).toBe(expectedHtml);
    });

});
