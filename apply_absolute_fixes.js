const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// 1. Helpers at top of file
const helpersCode = `
const fixTurkishEncoding = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/AŞ[\uFFFD\?]*\s*R/gi, 'AĞIR')
    .replace(/AŞR/gi, 'AĞIR')
    .replace(/BAŸL[\uFFFD\?]* /gi, 'BAŞLI ')
    .replace(/BAŸL/gi, 'BAŞLI')
    .replace(/BAŸ/gi, 'BAŞ')
    .replace(/KELEP‡ESİ/gi, 'KELEPÇESİ')
    .replace(/KELEP‡E/gi, 'KELEPÇE')
    .replace(/KANALLAR[\uFFFD\?]/gi, 'KANALLARI')
    .replace(/KANALLAR\b/gi, 'KANALLARI')
    .replace(/[\uFFFD]/g, '');
};

const getItemUnit = (item: { unit?: string; productCode?: string; description?: string }): string => {
  if (!item) return 'AD';
  const c = (item.productCode || '').trim().toUpperCase();
  const d = (item.description || '').trim().toUpperCase();
  const u = (item.unit || '').trim().toUpperCase();
  
  if (c.startsWith('SU') || c.startsWith('KBL') || c.startsWith('CT') || d.includes('KANAL') || u === 'MT' || u === 'M' || u === 'METRE') {
    return 'MT';
  }
  return (u && u !== 'PCS') ? u : (u === 'PCS' ? 'PCS' : 'AD');
};

const isMtUnit = (unit?: string, code?: string) => {
  if (code) {
    const c = code.trim().toUpperCase();
    if (c.startsWith('SU') || c.startsWith('KBL') || c.startsWith('CT') || c.includes('KANAL')) return true;
  }
  if (unit) {
    const u = unit.trim().toLowerCase();
    if (u === 'mt' || u === 'm' || u === 'metre' || u === 'metrik') return true;
  }
  return false;
};

const sortProductionItems = <T extends { unit?: string; productCode?: string; description?: string }>(items: T[]): T[] => {
  if (!items) return [];
  return [...items].sort((a, b) => {
    const aMt = isMtUnit(a.unit, a.productCode);
    const bMt = isMtUnit(b.unit, b.productCode);
    if (aMt && !bMt) return -1;
    if (!aMt && bMt) return 1;
    return (a.productCode || '').localeCompare(b.productCode || '', undefined, { numeric: true, sensitivity: 'base' });
  });
};

const getOrderCategory = (order: any): string => {
  if (!order || !order.items || order.items.length === 0) return 'YENİ SİPARİŞ';
  
  let totalQty = 0;
  let totalShipped = 0;
  let hasShippedItems = false;
  let hasProdItems = false;
  let hasCoatingItems = false;
  let hasPaintItems = false;
  let hasPackItems = false;

  for (const item of order.items) {
    const qty = Number(item.quantity) || 0;
    const shipped = Number(item.shippedQuantity) || 0;
    totalQty += qty;
    totalShipped += shipped;

    if (shipped > 0) hasShippedItems = true;
    if (item.status === 'Üretimde' || (item.producedQuantity || 0) > 0) hasProdItems = true;
    if (item.status === 'Kaplamada' || (item.coatingQuantity || 0) > 0) hasCoatingItems = true;
    if (item.status === 'Boyada' || (item.paintQuantity || 0) > 0) hasPaintItems = true;
    if (item.status === 'Paketlemede' || (item.packagedQuantity || 0) > 0) hasPackItems = true;
  }

  // 100% FULLY SHIPPED ONLY IF ALL ITEMS ARE SHIPPED
  if (totalQty > 0 && totalShipped >= totalQty) {
    return 'SEVK EDİLDİ';
  }

  // PARTIALLY SHIPPED
  if (hasShippedItems && totalShipped < totalQty) {
    return 'KISMİ SEVK EDİLDİ';
  }

  if (hasPackItems) return 'PAKETLEMEDE';
  if (hasPaintItems) return 'BOYADA';
  if (hasCoatingItems) return 'KAPLAMADA';
  if (hasProdItems || order.status === 'ÜRETİMDE') return 'ÜRETİMDE';

  return 'YENİ SİPARİŞ';
};
`;

const oldHelpersRegex = /const fixTurkishEncoding = [\s\S]*?const getOrderCategory = [\s\S]*?\n\};/;
if (oldHelpersRegex.test(content)) {
  content = content.replace(oldHelpersRegex, helpersCode);
} else {
  const insertPos = content.indexOf('export default function SalesModule');
  content = content.slice(0, insertPos) + helpersCode + '\n' + content.slice(insertPos);
}

// 2. Fix filteredOrders line 3400
const oldFilteredOrdersCode = `const filteredOrders = orders.filter(o => 
                o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.id.toLowerCase().includes(searchQuery.toLowerCase())
              );`;

const newFilteredOrdersCode = `const filteredOrders = orders.filter(o => {
                const matchesSearch = o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      o.id.toLowerCase().includes(searchQuery.toLowerCase());
                if (!matchesSearch) return false;

                const cat = getOrderCategory(o);
                if (activeCategoryTab === 'AKTİF SİPARİŞLER') return cat !== 'SEVK EDİLDİ';
                if (activeCategoryTab === 'YENİ SİPARİŞ') return cat === 'YENİ SİPARİŞ';
                if (activeCategoryTab === 'ÜRETİMDE') return cat === 'ÜRETİMDE';
                if (activeCategoryTab === 'KAPLAMADA') return cat === 'KAPLAMADA';
                if (activeCategoryTab === 'BOYADA') return cat === 'BOYADA';
                if (activeCategoryTab === 'PAKETLEMEDE') return cat === 'PAKETLEMEDE';
                if (activeCategoryTab === 'SEVK EDİLDİ') return cat === 'SEVK EDİLDİ';
                if (activeCategoryTab === 'TÜMÜ') return true;
                return cat === activeCategoryTab;
              });`;

content = content.replace(oldFilteredOrdersCode, newFilteredOrdersCode);

// 3. Fix Customer Accordion Order Status badge
const oldStatusBadgeLogic = `let statusColor = 'bg-slate-100 text-slate-700 border border-slate-200';
                              let displayStatus = 'BEKLEMEDE';

                              if (order.status === 'SEVK EDİLDİ') {
                                statusColor = 'bg-green-100 text-green-700 border border-green-200 font-extrabold';
                                displayStatus = 'SEVK EDİLDİ';
                              } else if (order.status === 'KISMİ SEVK EDİLDİ') {
                                statusColor = 'bg-amber-100 text-amber-700 border border-amber-200 font-extrabold';
                                displayStatus = 'KISMİ SEVK';
                              } else if (order.status === 'ÜRETİMDE') {
                                statusColor = 'bg-blue-100 text-blue-700 border border-blue-200 font-bold';
                                displayStatus = 'ÜRETİMDE';
                              } else if (order.status === 'KAPLAMADA') {
                                statusColor = 'bg-teal-100 text-teal-700 border border-teal-200 font-bold';
                                displayStatus = 'KAPLAMA';
                              } else if (order.status === 'BOYADA') {
                                statusColor = 'bg-purple-100 text-purple-700 border border-purple-200 font-bold';
                                displayStatus = 'BOYADA';
                              } else if (order.status === 'PAKETLEMEDE') {
                                statusColor = 'bg-pink-100 text-pink-700 border border-pink-200 font-bold';
                                displayStatus = 'PAKET';
                              }`;

const newStatusBadgeLogic = `const catStatus = getOrderCategory(order);
                              let statusColor = 'bg-amber-100 text-amber-800 border border-amber-300 font-bold';
                              let displayStatus = 'YENİ SİPARİŞ';

                              if (catStatus === 'SEVK EDİLDİ') {
                                statusColor = 'bg-green-100 text-green-800 border border-green-300 font-extrabold';
                                displayStatus = 'SEVK EDİLDİ';
                              } else if (catStatus === 'KISMİ SEVK EDİLDİ') {
                                statusColor = 'bg-amber-100 text-amber-800 border border-amber-300 font-extrabold';
                                displayStatus = 'KISMİ SEVK';
                              } else if (catStatus === 'ÜRETİMDE') {
                                statusColor = 'bg-blue-100 text-blue-800 border border-blue-300 font-bold';
                                displayStatus = 'ÜRETİMDE';
                              } else if (catStatus === 'KAPLAMADA') {
                                statusColor = 'bg-teal-100 text-teal-800 border border-teal-300 font-bold';
                                displayStatus = 'KAPLAMA';
                              } else if (catStatus === 'BOYADA') {
                                statusColor = 'bg-purple-100 text-purple-800 border border-purple-300 font-bold';
                                displayStatus = 'BOYADA';
                              } else if (catStatus === 'PAKETLEMEDE') {
                                statusColor = 'bg-pink-100 text-pink-800 border border-pink-300 font-bold';
                                displayStatus = 'PAKET';
                              }`;

content = content.replace(oldStatusBadgeLogic, newStatusBadgeLogic);

// 4. Update OrderDetailModal Table Row unit display & description
const oldModalRow = `const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                            const rawDesc = prodCatalog ? prodCatalog.name : item.description || 'KABLO TAŞIYICI ELEMANI';
                            const descStr = fixTurkishEncoding(rawDesc);
                            const displayUnit = getItemUnit(item);
                            const isMt = displayUnit === 'MT';
                            
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

const newModalRow = `const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                            const rawDesc = prodCatalog ? prodCatalog.name : item.description || 'KABLO TAŞIYICI ELEMANI';
                            const descStr = fixTurkishEncoding(rawDesc);
                            const unitStr = getItemUnit(item);
                            const isMt = unitStr === 'MT';
                            
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
                                <td className="p-2.5 text-right text-slate-900 font-mono font-bold">{item.quantity} <span className="text-[9px] uppercase font-bold text-slate-500">{unitStr}</span></td>
                                <td className="p-2.5 text-right text-green-700 font-mono font-bold">{item.shippedQuantity || 0} <span className="text-[9px] uppercase font-bold text-slate-500">{unitStr}</span></td>
                                <td className="p-2.5 text-right text-orange-700 font-mono font-bold">{remaining} <span className="text-[9px] uppercase font-bold text-slate-500">{unitStr}</span></td>`;

content = content.replace(oldModalRow, newModalRow);

// 5. Update Dispatch list item rendering in right column of OrderDetailModal
content = content.replace(
  `<span className="font-mono font-bold text-slate-950">{di.quantity} AD</span>`,
  `<span className="font-mono font-bold text-slate-950">{di.quantity} {getItemUnit(di)}</span>`
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Successfully applied absolute fixes!');
