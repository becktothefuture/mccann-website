/**
 * ==================================================
 *  McCann Website — Build Config (esbuild)
 *  Purpose: Single-file IIFE bundle for Webflow
 *  Dev URL: http://127.0.0.1:3000/app.js
 *  Date: 2025-10-28
 * ==================================================
 */

import { build, context } from 'esbuild';
import { copyFileSync, mkdirSync, watchFile } from 'fs';

const isDev = process.argv.includes('--dev');

const shared = {
  entryPoints: ['src/app.js'],
  bundle: true,
  outfile: 'dist/app.js',
  format: 'iife',
  target: ['es2019'],
  minify: !isDev,
  sourcemap: isDev ? 'inline' : false,
  loader: {
    '.json': 'json'  // Enable JSON imports
  }
};

function copyCSS(){
  const cssSource = 'style.css';
  const cssDest = 'dist/style.css';
  try {
    mkdirSync('dist', { recursive: true });
    copyFileSync(cssSource, cssDest);
    console.log(`✓ Copied ${cssSource} → ${cssDest}`);
  } catch (err) {
    console.warn(`[build] Could not copy CSS: ${err.message}`);
  }
}

// JSON is now bundled into app.js, no need to copy separately
// function copyJSON() removed - data is imported directly in lightbox.js

async function run(){
  // Copy CSS file to dist (JSON is bundled into app.js)
  copyCSS();
  
  if (isDev) {
    // Watch CSS file and copy on changes
    watchFile('style.css', { interval: 500 }, () => {
      copyCSS();
    });
    
    // JSON changes will trigger esbuild rebuild automatically
    
    const ctx = await context(shared);
    await ctx.watch();
    const host = process.env.HOST || '127.0.0.1';
    const basePort = Number(process.env.PORT) || 3000;
    const info = await startServer(ctx, host, basePort);
    console.log(`CSS available at http://${host}:${info.port}/style.css`);
    return;
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


