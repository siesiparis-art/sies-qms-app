const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// Add fixTurkishEncoding helper if not present
const encodingHelper = `
const fixTurkishEncoding = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/AŞ[\uFFFD\?]*R/gi, 'AĞIR')
    .replace(/AŞR/g, 'AĞIR')
    .replace(/BAŸL[\uFFFD\?]* /gi, 'BAŞLI ')
    .replace(/BAŸL/g, 'BAŞLI')
    .replace(/BAŸ/g, 'BAŞ')
    .replace(/KELEP‡ESİ/gi, 'KELEPÇESİ')
    .replace(/KELEP‡E/gi, 'KELEPÇE')
    .replace(/KANALLAR[\uFFFD\?]/gi, 'KANALLARI')
    .replace(/[\uFFFD]/g, '');
};
`;

if (!content.includes('const fixTurkishEncoding =')) {
  const insertPos = content.indexOf('export default function SalesModule');
  content = content.slice(0, insertPos) + encodingHelper + '\n' + content.slice(insertPos);
}

// Update table mapping in OrderDetailModal
const oldRowMapping = `const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                            const descStr = prodCatalog ? prodCatalog.name : item.description || 'KABLO TAŞIYICI ELEMANI';
                            const isMt = isMtUnit(item.unit, item.productCode);
                            
                            return (
                              <tr key={\`\${item.productCode}-\${idx}\`} className={\`hover:bg-amber-50/50 transition-colors \${isSelected ? 'bg-orange-50/30' : ''}\`}>
                                <td className="p-2.5 text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectItem(\`\${item.productCode}-\${idx}\`)}
                                    disabled={remaining <= 0}
                                    className="rounded border-slate-350 text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                                  />
                                </td>
                                <td className="p-2.5 font-mono font-black text-slate-900 text-xs flex items-center gap-1">
                                  {isMt && <span className="bg-orange-100 text-orange-800 text-[8px] font-bold px-1 rounded border border-orange-300">MT</span>}
                                  {item.productCode}
                                </td>
                                <td className="p-2.5 font-sans text-xs text-slate-800 leading-tight font-bold">{descStr}</td>
                                <td className="p-2.5 text-right text-slate-900 font-mono font-bold">{item.quantity} <span className="text-[9px] uppercase font-bold text-slate-500">{isMt ? 'MT' : (item.unit || 'AD')}</span></td>
                                <td className="p-2.5 text-right text-green-700 font-mono font-bold">{item.shippedQuantity || 0} <span className="text-[9px] uppercase font-bold text-slate-500">{isMt ? 'MT' : (item.unit || 'AD')}</span></td>
                                <td className="p-2.5 text-right text-orange-700 font-mono font-bold">{remaining} <span className="text-[9px] uppercase font-bold text-slate-500">{isMt ? 'MT' : (item.unit || 'AD')}</span></td>`;

const newRowMapping = `const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                            const rawDesc = prodCatalog ? prodCatalog.name : item.description || 'KABLO TAŞIYICI ELEMANI';
                            const descStr = fixTurkishEncoding(rawDesc);
                            const itemUnit = item.unit || 'AD';
                            const isMt = isMtUnit(itemUnit, item.productCode);
                            const displayUnit = isMt ? 'MT' : itemUnit;
                            
                            return (
                              <tr key={\`\${item.productCode}-\${idx}\`} className={\`hover:bg-amber-50/50 transition-colors \${isSelected ? 'bg-orange-50/30' : ''}\`}>
                                <td className="p-2.5 text-center">
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectItem(\`\${item.productCode}-\${idx}\`)}
                                    disabled={remaining <= 0}
                                    className="rounded border-slate-350 text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                                  />
                                </td>
                                <td className="p-2.5 font-mono font-black text-slate-900 text-xs flex items-center gap-1">
                                  {isMt && <span className="bg-orange-100 text-orange-800 text-[8px] font-bold px-1 rounded border border-orange-300">MT</span>}
                                  {item.productCode}
                                </td>
                                <td className="p-2.5 font-sans text-xs text-slate-800 leading-tight font-bold">{descStr}</td>
                                <td className="p-2.5 text-right text-slate-900 font-mono font-bold">{item.quantity} <span className="text-[9px] uppercase font-bold text-slate-500">{displayUnit}</span></td>
                                <td className="p-2.5 text-right text-green-700 font-mono font-bold">{item.shippedQuantity || 0} <span className="text-[9px] uppercase font-bold text-slate-500">{displayUnit}</span></td>
                                <td className="p-2.5 text-right text-orange-700 font-mono font-bold">{remaining} <span className="text-[9px] uppercase font-bold text-slate-500">{displayUnit}</span></td>`;

content = content.replace(oldRowMapping, newRowMapping);

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Successfully updated unit consistency and Turkish character encoding!');
