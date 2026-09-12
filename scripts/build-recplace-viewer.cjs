const { build } = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
build({
  absWorkingDir: root,
  entryPoints: ['js/3d/viewer.js'],
  outfile: 'js/3d/recplace-viewer.bundle.js',
  bundle: true,
  format: 'esm',
  minify: true,
  target: ['es2020'],
  legalComments: 'eof',
}).then(() => {
  fs.copyFileSync(path.join(root, 'node_modules/three/LICENSE'), path.join(root, 'js/3d/THREE-LICENSE.txt'));
  console.log('Built self-hosted RECPLACE viewer. Three.js 0.180.0, MIT license.');
}).catch(() => process.exit(1));
