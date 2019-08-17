import { AssetResolved } from '../../src/add-asset-index-plugin';
import { LocationInIndex } from '../../src/asset';


export function assetResolved(option?: { sri?: boolean }) {
    const { sri, place } = Object.assign({ sri: false, place: 'head' }, option);

    const asset: AssetResolved = {
        resolvedPath: {
            relative: 'asset/font.123456.woff2',
            absolute: '/root/dist/asset/font.123456.woff2'
        },
        asset: {
            place: place as LocationInIndex,
            sri,
            attributes: {
                rel: 'preload',
                as: 'font',
                crossorigin: true
            },
            filepath: ''
        }
    };


    const linkAttrs = [
        { name: 'href', value: 'asset/font.123456.woff2' },
        { name: 'rel', value: 'preload' },
        { name: 'as', value: 'font' },
        { name: 'crossorigin', value: true }
    ];

    return { asset, linkAttrs };
}

export function assetsResolved() {
    const assets: AssetResolved[] = [
        {
            resolvedPath: {
                relative: 'asset/font.123456.woff2',
                absolute: '/root/dist/asset/font.123456.woff2'
            },
            asset: {
                place: 'head',
                sri: false,
                attributes: {
                    rel: 'preload',
                    as: 'font',
                    crossorigin: true
                },
                filepath: ''
            }
        },
        {
            resolvedPath: {
                relative: 'asset/img.abcdef.png',
                absolute: '/root/dist/asset/img.abcdef.png'
            },
            asset: {
                place: 'head',
                sri: false,
                attributes: {
                    rel: 'prefetch',
                    as: 'image',
                    crossorigin: true
                },
                filepath: ''
            }
        }
    ];

    const indexSourceReplacements = [
        '<link href="asset/font.123456.woff2" rel="preload" as="font" crossorigin>',
        '<link href="asset/img.abcdef.png" rel="prefetch" as="image" crossorigin>'
    ];

    return { assets, indexSourceReplacements };
}
