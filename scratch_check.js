const fs = require('fs');
const code = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

let stack = [];
let inString = false;
let stringChar = '';
let inCommentLine = false;
let inCommentBlock = false;

const lines = code.split('\n');
for (let l = 0; l < lines.length; l++) {
  const line = lines[l];
  inCommentLine = false;
  for (let c = 0; c < line.length; c++) {
    const ch = line[c];
    const next = line[c + 1] || '';

    if (inCommentLine) continue;
    if (inCommentBlock) {
      if (ch === '*' && next === '/') {
        inCommentBlock = false;
        c++;
      }
      continue;
    }
    if (inString) {
      if (ch === '\\') { c++; continue; }
      if (ch === stringChar) { inString = false; }
      continue;
    }
    if (ch === '/' && next === '/') {
      inCommentLine = true;
      continue;
    }
    if (ch === '/' && next === '*') {
      inCommentBlock = true;
      c++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === '(' || ch === '{' || ch === '[') {
      stack.push({ ch, line: l + 1, col: c + 1 });
    } else if (ch === ')' || ch === '}' || ch === ']') {
      if (stack.length === 0) {
        console.log('Unmatched closing', ch, 'at L' + (l + 1) + ':' + (c + 1));
      } else {
        const top = stack.pop();
        const expected = { '(': ')', '{': '}', '[': ']' }[top.ch];
        if (ch !== expected) {
          console.log('Mismatch: opened', top.ch, 'at L' + top.line + ':' + top.col, 'closed', ch, 'at L' + (l + 1) + ':' + (c + 1));
        }
      }
    }
  }
}
console.log('Unclosed stack count:', stack.length);
stack.forEach(item => console.log('Unclosed:', item));
