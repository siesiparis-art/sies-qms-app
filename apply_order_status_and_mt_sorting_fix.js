const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// 1. Replace isMtUnit and getOrderCategory at the top of file
const oldHelpersRegex = /const isMtUnit = [\s\S]*?const getOrderCategory = [\s\S]*?\n\};/;

const newHelpers = `const isMtUnit = (unit?: string, code?: string) => {
  if (unit) {
    const u = unit.trim().toLowerCase();
    if (u === 'mt' || u === 'm' || u === 'metre' || u === 'metrik') return true;
  }
  if (code) {
    const c = code.trim().toUpperCase();
    if (c.startsWith('SU') || c.startsWith('KBL') || c.startsWith('CT') || c.includes('KANAL')) return true;
  }
  return false;
};

const sortProductionItems = <T extends { unit?: string; productCode?: string }>(items: T[]): T[] => {
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
    const qty = item.quantity || 0;
    const shipped = item.shippedQuantity || 0;
    totalQty += qty;
    totalShipped += shipped;

    if (shipped > 0) hasShippedItems = true;
    if (item.status === 'Üretimde' || (item.producedQuantity || 0) > 0) hasProdItems = true;
    if (item.status === 'Kaplamada' || (item.coatingQuantity || 0) > 0) hasCoatingItems = true;
    if (item.status === 'Boyada' || (item.paintQuantity || 0) > 0) hasPaintItems = true;
    if (item.status === 'Paketlemede' || (item.packagedQuantity || 0) > 0) hasPackItems = true;
  }

  // ONLY FULLY SHIPPED IF ALL ITEMS ARE 100% SHIPPED
  if (totalQty > 0 && totalShipped >= totalQty) {
    return 'SEVK EDİLDİ';
  }

  // IF PARTIALLY SHIPPED -> AÇIK SİPARİŞ / KISMİ SEVK EDİLDİ
  if (hasShippedItems && totalShipped < totalQty) {
    return 'KISMİ SEVK EDİLDİ';
  }

  if (hasPackItems) return 'PAKETLEMEDE';
  if (hasPaintItems) return 'BOYADA';
  if (hasCoatingItems) return 'KAPLAMADA';
  if (hasProdItems || order.status === 'ÜRETİMDE') return 'ÜRETİMDE';

  return 'YENİ SİPARİŞ';
};`;

content = content.replace(oldHelpersRegex, newHelpers);

// 2. Update statusColor and Status Badge inside OrderDetailModal
const oldModalStatusLogic = `const statusColor = order.status === 'SEVK EDİLDİ' 
            ? 'bg-green-600 text-white'
            : order.status === 'KISMİ SEVK EDİLDİ'
            ? 'bg-amber-600 text-white'
            : order.status === 'BOYADA'
            ? 'bg-purple-600 text-white'
            : order.status === 'KAPLAMADA'
            ? 'bg-teal-600 text-white'
            : order.status === 'ÜRETİMDE'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-white';`;

const newModalStatusLogic = `const calculatedCategory = getOrderCategory(order);
          const effectiveStatus = calculatedCategory === 'SEVK EDİLDİ' 
            ? 'SEVK EDİLDİ'
            : calculatedCategory === 'KISMİ SEVK EDİLDİ'
            ? 'KISMİ SEVK EDİLDİ (AÇIK SİPARİŞ)'
            : calculatedCategory === 'ÜRETİMDE'
            ? 'ÜRETİMDE (AÇIK SİPARİŞ)'
            : calculatedCategory === 'KAPLAMADA'
            ? 'KAPLAMADA (AÇIK SİPARİŞ)'
            : calculatedCategory === 'BOYADA'
            ? 'BOYADA (AÇIK SİPARİŞ)'
            : calculatedCategory === 'PAKETLEMEDE'
            ? 'PAKETLEMEDE (AÇIK SİPARİŞ)'
            : 'YENİ SİPARİŞ (AÇIK SİPARİŞ)';

          const statusColor = calculatedCategory === 'SEVK EDİLDİ' 
            ? 'bg-green-600 text-white shadow-sm'
            : calculatedCategory === 'KISMİ SEVK EDİLDİ'
            ? 'bg-amber-600 text-white shadow-sm'
            : calculatedCategory === 'BOYADA'
            ? 'bg-purple-600 text-white shadow-sm'
            : calculatedCategory === 'KAPLAMADA'
            ? 'bg-teal-600 text-white shadow-sm'
            : calculatedCategory === 'ÜRETİMDE'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-amber-500 text-white shadow-sm';`;

content = content.replace(oldModalStatusLogic, newModalStatusLogic);

// Replace order.status display in header badge with effectiveStatus
content = content.replace(`{order.status || 'BEKLEMEDE'}`, `{effectiveStatus}`);

// 3. Ensure table rows in OrderDetailModal use isMtUnit(item.unit, item.productCode)
content = content.replace(
  `const isMt = isMtUnit(item.unit);`,
  `const isMt = isMtUnit(item.unit, item.productCode);`
);

content = content.replace(
  `<span className="text-[9px] uppercase font-bold text-slate-500">{item.unit || 'AD'}</span>`,
  `<span className="text-[9px] uppercase font-bold text-slate-500">{isMt ? 'MT' : (item.unit || 'AD')}</span>`
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Successfully applied status calculation and MT sorting fixes!');
