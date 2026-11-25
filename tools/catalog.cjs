/* Read the studio's plain-script catalog and use its registered layer plan. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const catalog = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const studio = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const start = studio.indexOf('function layerList(');
const end = studio.indexOf('function conflict(', start);
if (start < 0 || end < 0) throw new Error('Studio layer-plan function unavailable');
const scope = {};
vm.runInNewContext(catalog + '\nconst CW=1360, CH=2048; const IT=Object.fromEntries(ITEMS.map(x=>[x.id,x]));\n'
  + studio.slice(start,end) + '\nglobalThis.catalog={items:ITEMS, looks:LOOKS, plans:LOOKS.map(x=>layerList(x))};', scope);
process.stdout.write(JSON.stringify(scope.catalog));
