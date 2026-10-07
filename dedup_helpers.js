const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

const startMarker = "const isMtUnit =";
const endMarker = "export default function SalesModule";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const cleanHelpers = `const fixTurkishEncoding = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/AŞ[\uFFFD\?]*\s*R/gi, 'AĞIR')
    .replace(/AŞR/gi, 'AĞIR')
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
  const u = (item.unit || '').trim().toUpperCase();
  const c = (item.productCode || '').trim().toUpperCase();
  const d = (item.description || '').trim().toUpperCase();
  
  if (c.startsWith('SU') || c.startsWith('KBL') || c.startsWith('CT') || d.includes('KANAL')) {
    return 'MT';
  }
  return u || 'AD';
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

  // FULLY SHIPPED ONLY IF ALL ITEMS ARE 100% SHIPPED
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
};\n\n`;

  content = content.slice(0, startIdx) + cleanHelpers + content.slice(endIdx);
  fs.writeFileSync('src/components/SalesModule.tsx', content);
  console.log('Successfully deduplicated helper functions!');
}
