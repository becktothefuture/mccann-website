/**
 * ==================================================
 *  McCann Website — Build Config (esbuild)
 *  Purpose: Single-file IIFE bundle for Webflow
 *  Dev URL: http://127.0.0.1:3000/app.js
 *  Date: 2025-10-28
 * ==================================================
 */

import { build, context } from 'esbuild';

const isDev = process.argv.includes('--dev');

const shared = {
  entryPoints: ['src/app.js'],
  bundle: true,
  outfile: 'dist/app.js',
  format: 'iife',
  target: ['es2019'],
  minify: !isDev,
  sourcemap: isDev ? 'inline' : false,
};

async function run(){
  if (isDev) {
    const ctx = await context(shared);
    await ctx.watch();
    await ctx.serve({ host: '127.0.0.1', port: 3000, servedir: 'dist' });
    console.log('Dev at http://127.0.0.1:3000/app.js');
  } else {
    await build(shared);
  }
}

run().catch((err)=>{ console.error(err); process.exit(1); });


