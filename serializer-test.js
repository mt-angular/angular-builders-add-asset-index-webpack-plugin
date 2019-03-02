const parse5 = require('parse5');
const defaultTreeAdapter = require('parse5/lib/tree-adapters/default');
const { RawSource, ReplaceSource } = require('webpack-sources');
const { HtmlSerializer } = require('./dist/src/html-serializer');

const indexContent = require('fs').readFileSync('caca.html', { encoding: 'utf8' });
const document = parse5.parse(indexContent,
    { treeAdapter: defaultTreeAdapter, sourceCodeLocationInfo: true });


let headElement = undefined;

const childNodes = document.childNodes;

for (const docChild of childNodes) {
    if (docChild.tagName === 'html') {
        const docChildNodes = docChild.childNodes;

        for (const htmlChild of docChildNodes) {
            if (htmlChild.tagName === 'head') {
                headElement = htmlChild;
            }
        }
    }
}

const fragmentData = { location: '', fragment: undefined };
fragmentData.location = headElement.sourceCodeLocation.endTag.startOffset;

this.indexSource = new ReplaceSource(new RawSource(indexContent), 'caca.html');



const attrs = [
    { name: 'href', value: 'caca' },
    { name: 'prop', value: '' },
    { name: 'prop2', value: true }
];


const link = defaultTreeAdapter.createElement('link', undefined, attrs);
fragmentData.fragment = defaultTreeAdapter.createDocumentFragment();


defaultTreeAdapter.appendChild(fragmentData.fragment, link);




const serialize = function (node, options) {
    const serializer = new HtmlSerializer(node, options);

    return serializer.serialize();
};

this.indexSource.insert(
    fragmentData.location,
    /* parse5.serialize */
    serialize(fragmentData.fragment, { treeAdapter: defaultTreeAdapter }),
);


console.log(fragmentData.location);
console.log(fragmentData.fragment.childNodes[0].attrs);
console.log(this.indexSource);
