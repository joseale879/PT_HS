const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const roots = [path.join(projectRoot, 'src'), path.join(projectRoot, 'server.js')];
const files = [];

function collect(entry) {
  if (!fs.existsSync(entry)) return;
  const stats = fs.statSync(entry);
  if (stats.isFile()) {
    if (entry.endsWith('.js')) files.push(entry);
    return;
  }

  for (const child of fs.readdirSync(entry, { withFileTypes: true })) {
    if (child.name === 'node_modules' || child.name.startsWith('.')) continue;
    collect(path.join(entry, child.name));
  }
}

for (const root of roots) collect(root);
files.sort();

const failures = [];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push({ file, output: `${result.stdout || ''}${result.stderr || ''}`.trim() });
}

if (failures.length) {
  for (const failure of failures) console.error(`${path.relative(projectRoot, failure.file)}\n${failure.output}`);
  process.exitCode = 1;
} else {
  console.log(`JavaScript syntax OK: ${files.length} archivos de producción revisados.`);
}
