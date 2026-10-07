const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// 1. Ensure Tag and ClipboardCheck are imported from lucide-react
if (!content.includes('ClipboardCheck')) {
  content = content.replace('ClipboardList, ListChecks', 'ClipboardList, ListChecks, Tag, ClipboardCheck');
}

// 2. Fix order.createdAt to order.date in runs mapping
content = content.replace(/order\.createdAt \|\| new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, "order.date || new Date().toISOString().split('T')[0]");

// 3. Fix handleOpenFR12 -> setActiveFR012ToShow
content = content.replace(/handleOpenFR12\(([^)]+)\)/g, 'setActiveFR012ToShow($1)');

// 4. Fix handleOpenCertModal -> handleLaunchCertCreator
content = content.replace(/handleOpenCertModal\(([^)]+)\)/g, 'handleLaunchCertCreator($1)');

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Successfully fixed imports and handlers in SalesModule.tsx!');
