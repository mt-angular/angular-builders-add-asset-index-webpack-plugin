import { AssetResolved } from '../../src/add-asset-index-plugin';


export function assetResolved(option?: { sri?: boolean }) {
    const { sri } = Object.assign({ sri: false }, option);

    const asset: AssetResolved = {
        resolvedPath: 'asset/font.123456.woff2',
        asset: {
            option: {
                sri,
                attributes: {
                    rel: 'preload',
                    as: 'font'
                }
            }
        }
    } as any;


    const linkAttrs = [
        { name: 'href', value: 'asset/font.123456.woff2' },
        { name: 'rel', value: 'preload' },
        { name: 'as', value: 'font' }
    ];

    return { asset, linkAttrs };
}

export function assetsResolved() {
    const assets: AssetResolved[] = [
        {
            resolvedPath: 'asset/font.123456.woff2',
            asset: {
                option: {
                    sri: false,
                    attributes: {
                        rel: 'preload',
                        as: 'font'
                    }
                }
            }
        },
        {
            resolvedPath: 'asset/img.abcdef.png',
            asset: {
                option: {
                    sri: false,
                    attributes: {
                        rel: 'prefetch',
                        as: 'image'
                    }
                }
            }
        }
    ] as any;

    const indexSourceReplacements = [
        '<link href="asset/font.123456.woff2" rel="preload" as="font">',
        '<link href="asset/img.abcdef.png" rel="prefetch" as="image">'
    ];

    return { assets, indexSourceReplacements };
}
