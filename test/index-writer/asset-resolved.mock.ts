import { AssetResolved } from '../../src/add-asset-index-plugin';


export function assetResolved(option?: { sri?: boolean }) {
    const { sri, place } = Object.assign({ sri: false, place: 'head' }, option);

    const asset: AssetResolved = {
        resolvedPath: 'asset/font.123456.woff2',
        asset: {
            option: {
                place,
                sri,
                attributes: {
                    rel: 'preload',
                    as: 'font',
                    crossorigin: true
                }
            }
        }
    } as any;


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
            resolvedPath: 'asset/font.123456.woff2',
            asset: {
                option: {
                    place: 'head',
                    sri: false,
                    attributes: {
                        rel: 'preload',
                        as: 'font',
                        crossorigin: true
                    }
                }
            }
        },
        {
            resolvedPath: 'asset/img.abcdef.png',
            asset: {
                option: {
                    place: 'head',
                    sri: false,
                    attributes: {
                        rel: 'prefetch',
                        as: 'image',
                        crossorigin: true
                    }
                }
            }
        }
    ] as any;

    const indexSourceReplacements = [
        '<link href="asset/font.123456.woff2" rel="preload" as="font" crossorigin>',
        '<link href="asset/img.abcdef.png" rel="prefetch" as="image" crossorigin>'
    ];

    return { assets, indexSourceReplacements };
}
