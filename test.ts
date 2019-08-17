

function paire<A, B>(a: A, b: B) {
    return (proj: (x: A, y: B) => A) => proj(a, b);
}

type Proj<A, B = A> = (x: A, y: B) => A;
type Paire<A> = (a: A) => Proj<A>;

type P = Paire<Paire<Paire<Paire<Paire<Paire<Paire<Paire<Paire<Paire<Paire<string>>>>>>>>>>>;
type P2 = Paire<P>;
/* let p1 = paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(paire(1))))))))))))))))))))));
 */
// Rovnosti 241, Demänová, 031 01, Liptovský Mikuláš
