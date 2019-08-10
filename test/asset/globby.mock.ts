import  path from 'path';

export function globbyMock(filepath: string) {
    const split = filepath.split('**');
    const base = split[ 0 ];
    const end = split[ 1 ].split('*')[ 1 ];
    const fakeDir = path.join('path', 'to', 'fake');
    const fakePaths = [
        path.join(base, fakeDir, 'fake0' + end),
        path.join(base, fakeDir, 'fake1' + end),
        path.join(base, fakeDir, 'fake2' + end) ];


    return fakePaths;
}
