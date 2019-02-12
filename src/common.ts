import * as crypto from 'crypto';

export const pluginName = 'AddAssetIndexPlugin';

export function hash(content: string, option?: { algo?: string, digest?: crypto.HexBase64Latin1Encoding }) {
    const { algo, digest } = Object.assign({ algo: 'sha384', digest: 'base64' }, option);

    const hash = crypto.createHash(algo)
        .update(content, 'utf8')
        .digest(digest);

    return hash;
}
