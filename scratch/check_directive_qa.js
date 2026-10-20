const fs = require('fs');

const jsCore = fs.readFileSync('JS_Core.html', 'utf8');
const jsNotas = fs.readFileSync('JS_Notas.html', 'utf8');
const indexHtml = fs.readFileSync('Index.html', 'utf8');
const viewNotas = fs.readFileSync('View_Notas.html', 'utf8');
const modalNotas = fs.readFileSync('Modal_Notas.html', 'utf8');

console.log('1. generarBadgeNotasVinculadas has data-tooltip instead of title:', !jsCore.includes("'title=\"'") && jsCore.includes('data-tooltip='));
console.log('2. mostrarPopoverNotaHover strips title dynamically:', jsNotas.includes("event.currentTarget.removeAttribute('title')"));
console.log('3. formatearContenidoPopover present and cleans escapes/markers:', jsNotas.includes('function formatearContenidoPopover') && jsNotas.includes('formatearContenidoPopover(cuerpoRaw)'));
console.log('4. Index.html has sticky-note icon & popover formatting:', indexHtml.includes('M15.5 3H5a2 2 0 0 0-2 2v14') && indexHtml.includes('max-h-48 overflow-hidden'));
console.log('5. View_Notas.html has no segmented format dock:', !viewNotas.includes('chip-nota-solo-notas') && !viewNotas.includes('chip-nota-wishlist'));
console.log('6. Modal_Notas.html has no modal-tipo-btn format switcher:', !modalNotas.includes('modal-tipo-btn-normal') && !modalNotas.includes('modal-tipo-btn-wishlist'));
console.log('7. Modal_Notas.html has 3 subdivisions:', modalNotas.includes('Sección A: Contenido General') && modalNotas.includes('Sección B: Checklist Procedural') && modalNotas.includes('Sección C: WishList / Ítems Deseados'));
console.log('8. Modal_Notas.html has NO static catalogue tags:', !modalNotas.includes('modal-nota-catalogo-tags-wrap'));
console.log('9. Tag-input keydown handler supports Enter or comma:', jsNotas.includes("e.key === 'Enter' || e.key === ','"));
