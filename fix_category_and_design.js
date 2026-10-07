const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// 1. Ensure helper functions are present
const helperCode = `
const isMtUnit = (unit?: string) => {
  if (!unit) return false;
  const u = unit.trim().toLowerCase();
  return u === 'mt' || u === 'm' || u === 'metre' || u === 'metrik';
};

const sortProductionItems = <T extends { unit?: string; productCode?: string }>(items: T[]): T[] => {
  if (!items) return [];
  return [...items].sort((a, b) => {
    const aMt = isMtUnit(a.unit);
    const bMt = isMtUnit(b.unit);
    if (aMt && !bMt) return -1;
    if (!aMt && bMt) return 1;
    return (a.productCode || '').localeCompare(b.productCode || '', undefined, { numeric: true, sensitivity: 'base' });
  });
};

const getOrderCategory = (order: any): string => {
  if (!order || !order.items || order.items.length === 0) return 'YENİ SİPARİŞ';
  if (order.status === 'SEVK EDİLDİ' || order.status === 'SHIPPED') return 'SEVK EDİLDİ';
  
  let allShipped = true;
  let hasPackaging = false;
  let hasCoating = false;
  let hasPaint = false;
  let hasProd = false;
  
  for (const item of order.items) {
    const total = item.quantity || 0;
    const shipped = item.shippedQuantity || 0;
    const pack = item.packagedQuantity || 0;
    const coating = item.coatingQuantity || 0;
    const paint = item.paintQuantity || 0;
    const prod = item.producedQuantity || 0;
    
    if (shipped < total) allShipped = false;
    if (pack > shipped) hasPackaging = true;
    if (coating > pack) hasCoating = true;
    if (paint > coating) hasPaint = true;
    if (prod > paint) hasProd = true;
  }
  
  if (allShipped) return 'SEVK EDİLDİ';
  if (hasPackaging) return 'PAKETLEMEDE';
  if (hasPaint) return 'BOYADA';
  if (hasCoating) return 'KAPLAMADA';
  if (hasProd) return 'ÜRETİMDE';
  return 'YENİ SİPARİŞ';
};
`;

if (!content.includes('const isMtUnit =')) {
  const insertPos = content.indexOf("export default function SalesModule");
  content = content.slice(0, insertPos) + helperCode + '\n' + content.slice(insertPos);
}

// 2. Ensure activeCategoryTab state is declared inside component
if (!content.includes('activeCategoryTab')) {
  const searchStatePos = content.indexOf("const [searchQuery, setSearchQuery] = useState('');");
  content = content.slice(0, searchStatePos) + "const [activeCategoryTab, setActiveCategoryTab] = useState('AKTİF SİPARİŞLER');\n  " + content.slice(searchStatePos);
}

// 3. Replace the Sies-style Filters section with Category Tabs + Search Bar
const filtersSectionRegex = /\{\/\* Sies-style Filters \*\/\}\s*<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">[\s\S]*?<\/div>\s*<\/div>/;

const newCategoryTabsAndSearch = `{/* Category Tabs & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col gap-3 print:hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                {[
                  { id: 'AKTİF SİPARİŞLER', label: '⚡ AKTİF SİPARİŞLER', color: 'bg-slate-900 text-white shadow-sm' },
                  { id: 'YENİ SİPARİŞ', label: '📋 YENİ SİPARİŞ', color: 'bg-amber-600 text-white shadow-sm' },
                  { id: 'ÜRETİMDE', label: '⚙️ ÜRETİMDE', color: 'bg-blue-600 text-white shadow-sm' },
                  { id: 'KAPLAMADA', label: '🛡️ KAPLAMADA', color: 'bg-teal-600 text-white shadow-sm' },
                  { id: 'BOYADA', label: '🎨 BOYADA', color: 'bg-purple-600 text-white shadow-sm' },
                  { id: 'PAKETLEMEDE', label: '📦 PAKETLEMEDE', color: 'bg-pink-600 text-white shadow-sm' },
                  { id: 'SEVK EDİLDİ', label: '🚚 SEVK EDİLDİ', color: 'bg-emerald-600 text-white shadow-sm' },
                  { id: 'TÜMÜ', label: '📊 TÜM SİPARİŞLER', color: 'bg-slate-700 text-white shadow-sm' }
                ].map(tab => {
                  const isActive = activeCategoryTab === tab.id;
                  
                  // Calculate count for each category
                  let count = 0;
                  if (tab.id === 'AKTİF SİPARİŞLER') {
                    count = orders.filter(o => getOrderCategory(o) !== 'SEVK EDİLDİ').length;
                  } else if (tab.id === 'TÜMÜ') {
                    count = orders.length;
                  } else {
                    count = orders.filter(o => getOrderCategory(o) === tab.id).length;
                  }

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategoryTab(tab.id)}
                      className={\`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 \${
                        isActive 
                          ? \`\${tab.color} scale-105 ring-2 ring-orange-400/50\` 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }\`}
                    >
                      <span>{tab.label}</span>
                      <span className={\`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold \${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                      }\`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative shrink-0 self-end lg:self-auto">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="MÜŞTERİ VEYA SİPARİŞ NO ARA..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-64 bg-slate-50 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all uppercase shadow-2xs"
                />
              </div>
            </div>
          </div>`;

if (filtersSectionRegex.test(content)) {
  content = content.replace(filtersSectionRegex, newCategoryTabsAndSearch);
} else {
  // Fallback search
  const oldFiltersTarget = `<div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">`;
  const idx = content.indexOf(oldFiltersTarget);
  if (idx !== -1) {
    const endIdx = content.indexOf(`</div>\n          </div>`, idx) + 18;
    content = content.slice(0, idx) + newCategoryTabsAndSearch + content.slice(endIdx);
  }
}

// 4. Replace filteredOrders logic inside accordion loop to filter by activeCategoryTab
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
                if (activeCategoryTab === 'TÜMÜ') return true;
                return cat === activeCategoryTab;
              });`;

content = content.replace(oldFilteredOrdersCode, newFilteredOrdersCode);

// 5. Enhance Customer Accordion Header & Table Header for sharp high-contrast design
const oldAccordionHeader = `<div 
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [custName]: !isExpanded }))}
                      className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/70 transition-colors print:hidden"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-200 text-slate-800 font-mono font-black px-2 py-0.5 rounded text-[10px]">
                          {customerOrders.length} Sipariş
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">{custName}</span>
                      </div>
                      
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>`;

const newAccordionHeader = `<div 
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [custName]: !isExpanded }))}
                      className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800 transition-colors print:hidden shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building className="h-4 w-4 text-orange-400" />
                        <span className="font-black text-sm uppercase tracking-wide text-white">{custName}</span>
                        <span className="bg-orange-500 text-white font-mono font-black px-2 py-0.5 rounded text-[10px] shadow-2xs">
                          {customerOrders.length} SİPARİŞ
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-300 uppercase hidden sm:inline">
                          {isExpanded ? 'Gizle' : 'Göster'}
                        </span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
                      </div>
                    </div>`;

content = content.replace(oldAccordionHeader, newAccordionHeader);

// 6. Enhance Table Header background inside Customer Accordion
const oldTableHeader = `<tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase">`;
const newTableHeader = `<tr className="bg-slate-800 text-slate-200 border-b border-slate-700 text-[10px] font-black uppercase tracking-wider">`;
content = content.replace(oldTableHeader, newTableHeader);

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Category Tabs & High-Contrast Design Applied Successfully!');
