const U = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const D = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const C = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function menorMil(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100), r = n % 100;
  const resto = r < 30 ? (r === 0 ? '' : U[r]) : D[Math.floor(r / 10)] + (r % 10 ? ' y ' + U[r % 10] : '');
  return [C[c], resto].filter(Boolean).join(' ');
}

/** Apócope de "uno" antes de mil o millón: "veintiún mil", "un millón". */
const apocope = (t: string) => t.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');

/** Número entero a letras en español (hasta billones). Ej.: 2548000 → "dos millones quinientos cuarenta y ocho mil". */
export function numeroALetras(n: number): string {
  n = Math.round(n);
  if (n === 0) return 'cero';
  if (n < 0) return 'menos ' + numeroALetras(-n);
  const partes: string[] = [];
  const billones = Math.floor(n / 1e12), millones = Math.floor((n % 1e12) / 1e6), miles = Math.floor((n % 1e6) / 1e3), resto = n % 1e3;
  if (billones) partes.push(billones === 1 ? 'un billón' : numeroALetras(billones) + ' billones');
  if (millones) partes.push(millones === 1 ? 'un millón' : apocope(numeroALetras(millones)) + ' millones');
  if (miles) partes.push(miles === 1 ? 'mil' : apocope(menorMil(miles)) + ' mil');
  if (resto) partes.push(menorMil(resto));
  return partes.join(' ');
}
