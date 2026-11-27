export interface RegresionLineal {
  pendiente: number;
  intercepto: number;
  r2: number;
  predecir: (x: number) => number;
}

export function regresionLineal(xs: number[], ys: number[]): RegresionLineal {
  const n = Math.min(xs.length, ys.length);
  if (n === 0) {
    return { pendiente: 0, intercepto: 0, r2: 0, predecir: () => 0 };
  }
  if (n === 1) {
    const intercepto = ys[0];
    return { pendiente: 0, intercepto, r2: 1, predecir: () => intercepto };
  }

  const mediaX = xs.reduce((s, v) => s + v, 0) / n;
  const mediaY = ys.reduce((s, v) => s + v, 0) / n;

  let numerador = 0;
  let denominador = 0;
  for (let i = 0; i < n; i++) {
    numerador += (xs[i] - mediaX) * (ys[i] - mediaY);
    denominador += (xs[i] - mediaX) ** 2;
  }

  const pendiente = denominador === 0 ? 0 : numerador / denominador;
  const intercepto = mediaY - pendiente * mediaX;

  const predecir = (x: number) => pendiente * x + intercepto;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (ys[i] - predecir(xs[i])) ** 2;
    ssTot += (ys[i] - mediaY) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return { pendiente, intercepto, r2, predecir };
}

export function correlacionPearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mediaX = xs.reduce((s, v) => s + v, 0) / n;
  const mediaY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mediaX) * (ys[i] - mediaY);
    denX += (xs[i] - mediaX) ** 2;
    denY += (ys[i] - mediaY) ** 2;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}
