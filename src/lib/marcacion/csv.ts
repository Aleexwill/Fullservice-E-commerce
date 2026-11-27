/** CSV compatible con Excel (BOM UTF-8, separador ';' como en Paraguay/Latinoamérica, comillas escapadas). */
export function aCsv(cabeceras: string[], filas: (string | number)[][]): string {
  const esc = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s) && typeof v === 'string') s = `'${s}`; // evita ejecución de fórmulas al abrir en Excel
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + [cabeceras, ...filas].map(f => f.map(esc).join(';')).join('\r\n');
}

export function descargarCsv(nombre: string, contenido: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
