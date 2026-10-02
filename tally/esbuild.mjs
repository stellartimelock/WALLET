import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const outdir = path.join(here, '../landing/t/hhkbu88gx5i4');

await esbuild.build({
  entryPoints: [path.join(here, 'src/main.js')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2022'],
  outfile: path.join(outdir, 'tally.js'),
  minify: true,
  legalComments: 'eof',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
