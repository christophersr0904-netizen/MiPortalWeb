const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

console.log('=== INVENTARIO COMPLETO DE MODALES RAIZ ===\n');

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Look for any overlay: id="..." class="...fixed inset-0..."
  const regex = /<div\s+[^>]*id=["']([^"']+)["'][^>]*class=["']([^"']*(?:fixed|inset-0|z-\[|z-50)[^"']*)["'][^>]*>/gi;
  let match;
  const modalsInFile = [];
  while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const overlayClass = match[2];
    
    // find inner card
    const postSnippet = content.substring(match.index + match[0].length, match.index + match[0].length + 1500);
    const cardMatch = postSnippet.match(/<div\s+[^>]*class=["']([^"']*(?:max-w-|w-|portal-surface|rounded-|bg-white)[^"']*)["'][^>]*>/i);
    
    modalsInFile.push({
      id,
      overlayClass: overlayClass.replace(/\s+/g, ' ').trim(),
      cardClass: cardMatch ? cardMatch[1].replace(/\s+/g, ' ').trim() : '(No card div detected)'
    });
  }

  if (modalsInFile.length > 0) {
    console.log(`📁 ${f}:`);
    modalsInFile.forEach(m => {
      console.log(`  🔹 #${m.id}`);
      console.log(`     Overlay: ${m.overlayClass}`);
      console.log(`     Card:    ${m.cardClass}`);
    });
    console.log('');
  }
});
