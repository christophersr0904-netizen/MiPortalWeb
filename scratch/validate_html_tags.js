const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && (f.startsWith('View_') || f.startsWith('Modal_')));
let errors = 0;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const tags = ['div', 'form', 'section', 'button', 'select'];
  let fileOk = true;
  tags.forEach(t => {
    const openRe = new RegExp('<' + t + '\\b', 'gi');
    const closeRe = new RegExp('</' + t + '>', 'gi');
    const openCount = (content.match(openRe) || []).length;
    const closeCount = (content.match(closeRe) || []).length;
    if (openCount !== closeCount) {
      console.error(`[TAG MISMATCH] ${f}: <${t}> open=${openCount}, close=${closeCount}`);
      fileOk = false;
      errors++;
    }
  });
  if (fileOk) {
    console.log(`[TAGS OK] ${f}`);
  }
});

console.log(`\nChecked HTML tag balances. Errors: ${errors}`);
if (errors > 0) process.exit(1);
