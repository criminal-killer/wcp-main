const fs = require('fs');
const path = require('path');

const replacements = {
  'â€”': '—',
  'â€“': '–',
  'â†’': '→',
  'Â·': '·',
  'âœ…': '✅',
  'Â©': '©',
  'â€™': "'",
  'â€œ': '"',
  'â€': '"'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const [bad, good] of Object.entries(replacements)) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['.next', 'node_modules', '.git'].includes(file)) traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

traverse(path.join(__dirname, 'src'));
console.log('Done.');
