const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// 1. Update lucide-react imports to include Tag and ClipboardCheck
content = content.replace(
  "Search, Trash2, Calendar, AlertCircle, Zap, Palette, Package, Edit, ChevronDown, ChevronUp, ClipboardList, ListChecks",
  "Search, Trash2, Calendar, AlertCircle, Zap, Palette, Package, Edit, ChevronDown, ChevronUp, ClipboardList, ListChecks, Tag, ClipboardCheck"
);

// 2. Update handleSendSelectedToProduction signature to accept (orderInput?: Order, forceAll: boolean = false)
content = content.replace(
  "const handleSendSelectedToProduction = (orderInput?: Order) => {",
  "const handleSendSelectedToProduction = (orderInput?: Order, forceAll: boolean = false) => {"
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Successfully updated imports and function signature!');
