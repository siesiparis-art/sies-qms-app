const fs = require('fs');
const filePath = 'C:/Users/Pc/.gemini/antigravity/scratch/qms-os/client/src/components/SalesModule.tsx';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace('key={${c.id}-}', 'key={`${c.id}-${idx}`}');
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully fixed key attribute!');
