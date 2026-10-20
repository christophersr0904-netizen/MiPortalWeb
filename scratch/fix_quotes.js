const fs = require('fs');
let code = fs.readFileSync('JS_Detalle360.html', 'utf8');

const target1 = `''<button type="button" onclick="desglosarTareasPaqueteIA(\\\\'' + idHitoKey + '\\\\', \\\\'' + escapeHtmlDetalle(nomElem).replace(/'/g, "\\\\'") + '\\\\')"`;
const replacement1 = `'<button type="button" onclick="desglosarTareasPaqueteIA(\\'' + idHitoKey + '\\', \\'' + escapeHtmlDetalle(nomElem).replace(/'/g, "\\\\'") + '\\')"`;

const target2 = `'<button type="button" onclick="confirmarEliminarHito(\\\\'' + idHitoKey + '\\\\')"`;
const replacement2 = `'<button type="button" onclick="confirmarEliminarHito(\\'' + idHitoKey + '\\')"`;

console.log('Found target 1:', code.includes(target1));
console.log('Found target 2:', code.includes(target2));

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);

fs.writeFileSync('JS_Detalle360.html', code, 'utf8');
console.log('Successfully fixed quotes in JS_Detalle360.html!');
