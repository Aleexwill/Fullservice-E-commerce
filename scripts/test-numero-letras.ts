// Pruebas de numeroALetras (neto en letras del recibo). Ejecutar: npm run test:rrhh
import { numeroALetras as n } from '../src/lib/rrhh/numero-letras';
const casos: [number, string][] = [
  [0, 'cero'], [1, 'uno'], [15, 'quince'], [21, 'veintiuno'], [30, 'treinta'], [99, 'noventa y nueve'], [100, 'cien'], [101, 'ciento uno'], [555, 'quinientos cincuenta y cinco'],
  [1000, 'mil'], [1001, 'mil uno'], [21000, 'veintiún mil'], [31000, 'treinta y un mil'], [100000, 'cien mil'], [2548000, 'dos millones quinientos cuarenta y ocho mil'],
  [1000000, 'un millón'], [21000000, 'veintiún millones'], [3400000, 'tres millones cuatrocientos mil'], [270000, 'doscientos setenta mil'], [1500500, 'un millón quinientos mil quinientos'], [12345678, 'doce millones trescientos cuarenta y cinco mil seiscientos setenta y ocho'],
];
let f = 0; for (const [x, w] of casos) { const g = n(x); if (g !== w) { f++; console.log('FALLA', x, '→', g, '| esperaba', w); } }
console.log(f ? f + ' fallos' : 'numeroALetras OK (' + casos.length + ' casos)');
