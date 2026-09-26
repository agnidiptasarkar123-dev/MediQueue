const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, '../app');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(directory);

const replacements = {
  'bg-white': 'bg-surface',
  'bg-slate-50': 'bg-background',
  'bg-slate-100': 'bg-border/30',
  'bg-slate-200': 'bg-border/60',
  'border-slate-200': 'border-border',
  'border-slate-100': 'border-border/50',
  'text-slate-900': 'text-text-main',
  'text-slate-800': 'text-text-main',
  'text-slate-700': 'text-text-main',
  'text-slate-600': 'text-muted',
  'text-slate-500': 'text-muted',
  'text-slate-400': 'text-muted',
  'text-blue-600': 'text-accent',
  'text-blue-500': 'text-accent',
  'bg-blue-50': 'bg-accent/10',
  'bg-blue-100': 'bg-accent/20',
  'border-blue-100': 'border-accent/20',
  'border-blue-200': 'border-accent/30',
  'text-blue-700': 'text-accent',
  'text-green-600': 'text-success',
  'text-green-500': 'text-success',
  'text-red-600': 'text-danger',
  'bg-red-50': 'bg-danger/10',
  'border-red-100': 'border-danger/20',
  'hover:bg-slate-50': 'hover:bg-border/30',
  'hover:bg-slate-100': 'hover:bg-border/50',
  'hover:text-slate-900': 'hover:text-text-main',
  'hover:text-slate-700': 'hover:text-text-main',
  'from-blue-50': 'from-accent/5',
  'to-indigo-50': 'to-primary/5',
  'via-white': 'via-surface',
};

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  for (const [key, value] of Object.entries(replacements)) {
    // We want to match exactly the class names, so we use word boundaries,
    // but classes can have characters like '-' so regex needs to be careful.
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    content = content.replace(regex, value);
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
