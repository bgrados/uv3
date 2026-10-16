/**
 * Parche local para sistemas de archivos sin soporte de symlinks (FAT32/exFAT).
 *
 * En FAT32, `fs.readlink()` sobre un archivo normal devuelve EISDIR en lugar de
 * EINVAL (como en NTFS). Next.js ignora EINVAL/ENOENT/UNKNOWN al trazar archivos
 * de build, pero no EISDIR, por lo que `next build` falla con:
 *
 *   Error: EISDIR: illegal operation on a directory, readlink '<archivo>'
 *
 * Este script agrega EISDIR a esa lista de tolerancia en los 4 archivos afectados.
 * Es idempotente: si el parche ya está aplicado, no hace nada.
 * Es inofensivo en NTFS/Linux (EISDIR simplemente nunca ocurre ahí).
 */
const fs = require('fs');
const path = require('path');

const NEXT_DIST = path.join(__dirname, '..', 'node_modules', 'next', 'dist');

const TARGETS = [
  'build/webpack/plugins/next-trace-entrypoints-plugin.js',
  'build/collect-build-traces.js',
  'esm/build/collect-build-traces.js',
  'esm/build/webpack/plugins/next-trace-entrypoints-plugin.js',
];

const OLD_SNIPPET = /e\.code === 'EINVAL' \|\| e\.code === 'ENOENT' \|\| e\.code === 'UNKNOWN'/;
const NEW_SNIPPET =
  "e.code === 'EINVAL' || e.code === 'ENOENT' || e.code === 'UNKNOWN' || e.code === 'EISDIR'";

if (!fs.existsSync(NEXT_DIST)) {
  console.log('[patch-next-fat32] next/dist no existe; se omite (aún no hay node_modules).');
  process.exit(0);
}

let patched = 0;
let already = 0;
let missing = 0;

for (const rel of TARGETS) {
  const file = path.join(NEXT_DIST, rel);
  if (!fs.existsSync(file)) {
    missing += 1;
    continue;
  }
  const before = fs.readFileSync(file, 'utf8');
  // Si el patrón original ya no existe, el parche ya está aplicado.
  if (!OLD_SNIPPET.test(before)) {
    already += 1;
    continue;
  }
  const after = before.replace(OLD_SNIPPET, NEW_SNIPPET);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    patched += 1;
  } else {
    missing += 1;
  }
}

console.log(
  `[patch-next-fat32] parcheados: ${patched}, ya parcheados: ${already}, sin cambios/no encontrados: ${missing}`
);
