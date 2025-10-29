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
    const host = process.env.HOST || '127.0.0.1';
    const basePort = Number(process.env.PORT) || 3000;
    await startServer(ctx, host, basePort);
  } else {
    await build(shared);
  }
}

run().catch((err)=>{ console.error(err); process.exit(1); });


async function startServer(ctx, host, basePort){
  for (let p = basePort; p < basePort + 20; p++) {
    try {
      const info = await ctx.serve({ host, port: p, servedir: 'dist' });
      console.log(`Dev at http://${host}:${info.port}/app.js`);
      return info;
    } catch (err) {
      const msg = String(err && err.message || err);
      if (msg.includes('address already in use') || msg.includes('EADDRINUSE')) continue;
      throw err;
    }
  }
  console.error(`[dev] No free port in range ${basePort}..${basePort+19}`);
  process.exit(1);
}


