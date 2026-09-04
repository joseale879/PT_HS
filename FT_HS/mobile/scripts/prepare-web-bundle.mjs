import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(mobileRoot, '..');
const webRoot = path.join(repoRoot, 'Web');
const distRoot = path.join(mobileRoot, '.web-dist');
const outFile = path.join(mobileRoot, 'src', 'webBundle.js');

const mimeTypes = new Map([
  ['.css', 'text/css'],
  ['.js', 'text/javascript'],
  ['.mjs', 'text/javascript'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf', 'font/ttf']
]);

function assertPathExists(target, label) {
  if (!fs.existsSync(target)) {
    throw new Error(`${label} no existe: ${target}`);
  }
}

function toDataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = mimeTypes.get(ext) ?? 'application/octet-stream';
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:${mime};base64,${data}`;
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAssetReferences(content, assets) {
  let output = content;
  for (const asset of assets) {
    const relative = path.relative(distRoot, asset).replace(/\\/g, '/');
    const dataUri = toDataUri(asset);
    const variants = [`/${relative}`, `./${relative}`, relative];
    for (const variant of variants) {
      output = output.replace(new RegExp(escapeRegExp(variant), 'g'), dataUri);
    }
  }
  return output;
}

assertPathExists(webRoot, 'Proyecto web');
if (process.platform === 'win32') {
  execFileSync(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', `npm run build -- --outDir ../mobile/.web-dist --emptyOutDir`], {
    cwd: webRoot,
    stdio: 'inherit'
  });
} else {
  execFileSync('npm', ['run', 'build', '--', '--outDir', distRoot, '--emptyOutDir'], {
    cwd: webRoot,
    stdio: 'inherit'
  });
}
assertPathExists(path.join(distRoot, 'index.html'), 'Build web');

const allDistFiles = listFiles(distRoot);
const assetFiles = allDistFiles.filter((file) => path.relative(distRoot, file).replace(/\\/g, '/').startsWith('assets/'));
let html = fs.readFileSync(path.join(distRoot, 'index.html'), 'utf8');

html = html.replace(/<link\s+rel="stylesheet"\s+crossorigin\s+href="([^"]+)">/g, (_, href) => {
  const cssPath = path.join(distRoot, href.replace(/^\//, ''));
  let css = fs.readFileSync(cssPath, 'utf8');
  css = replaceAssetReferences(css, assetFiles);
  return `<style>${css}</style>`;
});

html = html.replace(/<script\s+type="module"\s+crossorigin\s+src="([^"]+)"><\/script>/g, (_, src) => {
  const jsPath = path.join(distRoot, src.replace(/^\//, ''));
  let js = fs.readFileSync(jsPath, 'utf8');
  js = replaceAssetReferences(js, assetFiles);
  return `<script type="module">${js}</script>`;
});

html = replaceAssetReferences(html, assetFiles);
html = html.replace('</head>', '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"></head>');

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, `const webBundle = ${JSON.stringify(html)};\n\nexport default webBundle;\n`, 'utf8');
console.log(`Bundle web generado en ${outFile}`);
