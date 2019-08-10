import crypto from 'crypto';
import { compilation } from 'webpack';

export type Compilation = compilation.Compilation;

export const pluginName = 'AddAssetIndexPlugin';


export class HashOption {
    algo?: string = 'sha384';
    digest?: crypto.HexBase64Latin1Encoding = 'base64';
}

export function hash(content: string | Buffer, option?: HashOption): string {
    const { algo, digest } = Object.assign(new HashOption(), option);

    const hasher = crypto.createHash(algo);
    const hash = typeof content === 'string' ? hasher.update(content, 'utf8') : hasher.update(content);

    return hash.digest(digest);
}
