const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// 1. Add Helper Functions after imports
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
  if (order.status === 'SHIPPED') return 'SEVK EDİLDİ';
  
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

// 2. Add activeCategoryTab state inside component
if (!content.includes('activeCategoryTab')) {
  const statePos = content.indexOf("const [searchQuery, setSearchQuery] = useState('');");
  content = content.slice(0, statePos) + "const [activeCategoryTab, setActiveCategoryTab] = useState('AKTİF SİPARİŞLER');\n  " + content.slice(statePos);
}

// 3. Update handleOpenFR009 to attach unit and sort
const oldHandleFR009 = `const handleOpenFR009 = (runs: any[]) => {
    // Deduplicate runs by productCode so we show at most one row per product code in the table
    const uniqueRuns: any[] = [];
    const seen = new Set();
    [...runs].reverse().forEach(r => {
      const code = (r.productCode || '').toUpperCase().trim();
      if (!seen.has(code)) {
        seen.add(code);
        uniqueRuns.push(r);
      }
    });
    uniqueRuns.reverse();

    setActiveFR009ToShow(uniqueRuns);`;

const newHandleFR009 = `const handleOpenFR009 = (runs: any[]) => {
    const targetOrder = selectedOrderDetailOrder || activeOrder;
    const runsWithUnit = runs.map(r => {
      const match = targetOrder?.items?.find((it: any) => it.productCode === r.productCode);
      return { ...r, unit: match?.unit || r.unit || 'AD' };
    });

    const sortedRuns = sortProductionItems(runsWithUnit);

    const uniqueRuns: any[] = [];
    const seen = new Set();
    sortedRuns.forEach(r => {
      const code = (r.productCode || '').toUpperCase().trim();
      if (!seen.has(code)) {
        seen.add(code);
        uniqueRuns.push(r);
      }
    });

    setActiveFR009ToShow(uniqueRuns);`;

content = content.replace(oldHandleFR009, newHandleFR009);

// 4. Update Customer Creation select to editable input with datalist
const oldCustomerSelect = `<select
                  value={coCustomerName}
                  onChange={e => setCoCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="">Müşteri seçin veya oluşturun</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>`;

const newCustomerInput = `<input
                  type="text"
                  list="customer-datalist"
                  value={coCustomerName}
                  onChange={e => setCoCustomerName(e.target.value)}
                  placeholder="Müşteri Adı Girin veya Seçin..."
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
                <datalist id="customer-datalist">
                  {customers.map(c => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>`;

content = content.replace(oldCustomerSelect, newCustomerInput);

// 5. Update handleCreateOrderSubmit to add new customer automatically
const oldSubmitCustomerCheck = `const newOrder: Order = {`;
const newSubmitCustomerCheck = `const existingCust = customers.find(c => c.name.trim().toLowerCase() === coCustomerName.trim().toLowerCase());
    if (!existingCust && coCustomerName.trim()) {
      addCustomer({
        id: \`CUST-\${Date.now()}\`,
        name: coCustomerName.trim().toUpperCase(),
        code: \`CST-\${Math.floor(100 + Math.random() * 900)}\`,
        taxNo: '1111111111',
        phone: '02160000000',
        email: 'info@musteri.com',
        address: 'İstanbul / Türkiye',
        balance: 0,
        status: 'Aktif'
      });
    }

    const newOrder: Order = {`;

content = content.replace(oldSubmitCustomerCheck, newSubmitCustomerCheck);

// 6. Inject Category Tabs UI
const oldFiltersBar = `{/* Sies-style Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="MÜŞTERİ VEYA SİPARİŞ NO ARA..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all uppercase"
                />
              </div>
            </div>
          </div>`;

const newFiltersBar = `{/* Category Tabs & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-3 print:hidden">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Category Tab Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {[
                  { id: 'AKTİF SİPARİŞLER', label: 'AKTİF SİPARİŞLER', color: 'bg-slate-900 text-white' },
                  { id: 'YENİ SİPARİŞ', label: 'YENİ SİPARİŞ', color: 'bg-amber-600 text-white' },
                  { id: 'ÜRETİMDE', label: 'ÜRETİMDE', color: 'bg-blue-600 text-white' },
                  { id: 'KAPLAMADA', label: 'KAPLAMADA', color: 'bg-teal-600 text-white' },
                  { id: 'BOYADA', label: 'BOYADA', color: 'bg-purple-600 text-white' },
                  { id: 'PAKETLEMEDE', label: 'PAKETLEMEDE', color: 'bg-pink-600 text-white' },
                  { id: 'SEVK EDİLDİ', label: 'SEVK EDİLDİ', color: 'bg-green-600 text-white' },
                  { id: 'TÜMÜ', label: 'TÜM SİPARİŞLER', color: 'bg-slate-700 text-white' }
                ].map(tab => {
                  const isActive = activeCategoryTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategoryTab(tab.id)}
                      className={\`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap \${
                        isActive 
                          ? \`\${tab.color} shadow-xs scale-105\` 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }\`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative shrink-0">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="MÜŞTERİ VEYA SİPARİŞ NO ARA..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-60 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all uppercase"
                />
              </div>
            </div>
          </div>`;

content = content.replace(oldFiltersBar, newFiltersBar);

// 7. Update filteredOrders to use activeCategoryTab
const oldFilteredOrders = `const filteredOrders = orders.filter(o => 
                o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.id.toLowerCase().includes(searchQuery.toLowerCase())
              );`;

const newFilteredOrders = `const filteredOrders = orders.filter(o => {
                const matchesSearch = o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      o.id.toLowerCase().includes(searchQuery.toLowerCase());
                if (!matchesSearch) return false;

                const cat = getOrderCategory(o);
                if (activeCategoryTab === 'AKTİF SİPARİŞLER') return cat !== 'SEVK EDİLDİ';
                if (activeCategoryTab === 'TÜMÜ') return true;
                return cat === activeCategoryTab;
              });`;

content = content.replace(oldFilteredOrders, newFilteredOrders);

// 8. Order Detail Modal left table sorting
const oldOrderItemsMap = `{order.items.map((item, idx) => {`;
const newOrderItemsMap = `{sortProductionItems(order.items).map((item, idx) => {`;
content = content.replace(oldOrderItemsMap, newOrderItemsMap);

// 9. Inject 6-Document Hub at top of right panel in Order Detail Modal
const oldRightPanelHeader = `{/* Dispatches Timeline List */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">`;

const new6DocHub = `{/* TÜM SİPARİŞ BELGELERİ & EVRAKLARI (6 DÖKÜMAN) */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-orange-500" /> Tüm Sipariş Belgeleri & Evrakları (6 Döküman)
                        </h4>
                        <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">AKTİF EVRAKLAR</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        {/* 1. ÜRETİM FORMU & İŞ EMRİ (FR-009) */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex flex-col justify-between space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">1. Üretim Formu & İş Emri</span>
                            <span className="font-mono font-bold text-orange-600 bg-orange-50 px-1 rounded text-[8px]">FR-009</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">İmalat takip & proses kartı</p>
                          <button 
                            onClick={() => {
                              const sorted = sortProductionItems(order.items);
                              const runs = sorted.map((item, idx) => ({
                                id: \`PRD-\${order.id}-\${idx + 1}\`,
                                productionOrderNo: order.id,
                                productCode: item.productCode,
                                quantity: item.quantity,
                                date: order.createdAt || new Date().toISOString().split('T')[0],
                                operator: 'Depo / Üretim Sorumlusu',
                                unit: item.unit || 'AD',
                                processes: ['Kesme', 'Delme', 'Bükme']
                              }));
                              handleOpenFR009(runs);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <Printer className="h-3 w-3" /> Üretim Formu Bas
                          </button>
                        </div>

                        {/* 2. SEVKİYAT İRSALİYESİ */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex flex-col justify-between space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">2. Sevkiyat İrsaliyesi</span>
                            <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1 rounded text-[8px]">İRSALİYE</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Resmi sevk irsaliyesi</p>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                setActiveDispatchToShow(order.dispatches[order.dispatches.length - 1]);
                              } else {
                                alert("Henüz oluşturulmuş sevk irsaliyesi bulunmuyor. Sol paneldeki 'Sevk Et' butonundan irsaliye oluşturabilirsiniz.");
                              }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <FileSpreadsheet className="h-3 w-3" /> İrsaliye Bas / Aç
                          </button>
                        </div>

                        {/* 3. SON KONTROL FORMU (FR-10) */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex flex-col justify-between space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">3. Son Kontrol Formu</span>
                            <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1 rounded text-[8px]">FR-10</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Ölçüm & muayene raporu</p>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                handleOpenFR12(order.dispatches[order.dispatches.length - 1].dispatchNoteNo);
                              } else {
                                alert("Son Kontrol Formu (FR-10) doldurmak için öncelikle bir sevk irsaliyesi oluşturmalısınız.");
                              }
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <ClipboardCheck className="h-3 w-3" /> FR-10 Doldur / Bas
                          </button>
                        </div>

                        {/* 4. KALİTE TEST SERTİFİKASI (3.1) */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex flex-col justify-between space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">4. Kalite Test Sertifikası</span>
                            <span className="font-mono font-bold text-purple-600 bg-purple-50 px-1 rounded text-[8px]">3.1 TEST</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">EN 10204 3.1 Test Raporu</p>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                handleOpenCertModal(order.dispatches[order.dispatches.length - 1].dispatchNoteNo);
                              } else {
                                alert("3.1 Sertifikası almak için öncelikle sevk irsaliyesi ve FR-10 son kontrol onayının tamamlanması gerekir.");
                              }
                            }}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <Award className="h-3 w-3" /> 3.1 Sertifikası Al
                          </button>
                        </div>

                        {/* 5. SİPARİŞ BELGESİ / TEKLİF (FR-013) */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex flex-col justify-between space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">5. Sipariş Belgesi / Teklif</span>
                            <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1 rounded text-[8px]">FR-013</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Teklif formu & yüklenen belge</p>
                          <button 
                            onClick={() => {
                              alert(\`Sipariş / Teklif No: \${order.id}\\nMüşteri: \${order.customerName}\\nDurum: \${order.status}\`);
                            }}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <FileText className="h-3 w-3" /> Teklif / Belge Aç
                          </button>
                        </div>

                        {/* 6. SEVKİYAT & ÜRÜN ETİKETİ */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex flex-col justify-between space-y-1.5">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">6. Sevkiyat & Ürün Etiketi</span>
                            <span className="font-mono font-bold text-teal-600 bg-teal-50 px-1 rounded text-[8px]">ETİKET</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Barkodlu koli & palet etiketi</p>
                          <button 
                            onClick={() => handleOpenLabels(order)}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <Tag className="h-3 w-3" /> Etiket Yazdır
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dispatches Timeline List */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">`;

content = content.replace(oldRightPanelHeader, new6DocHub);

// 10. Honeywell Label Card Replacement with SIES Logo, Larger Text & Correct Unit
const oldLabelCard = `<div key={key} className="honeywell-label-50-100 bg-white text-black p-3 border-2 border-black rounded shadow-md font-sans w-[100mm] h-[50mm] flex flex-col justify-between shrink-0 box-border print:shadow-none print:border-black print:rounded-none print:my-0 print:mx-auto print:page-break-after-always">
                      <div className="flex justify-between items-start border-b border-black pb-1">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-sm uppercase tracking-wider leading-none">SIES ELEKTRİK</span>
                          <span className="text-[6px] text-slate-500 leading-none mt-0.5">MADE IN TURKEY / KALİTE GÜVENCE</span>
                        </div>
                        <span className="font-mono font-black text-xs border border-black px-1 py-0.5 bg-black text-white">{prodCode}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 text-[8px] my-1 leading-tight flex-1">
                        <div>
                          <span className="text-slate-400 block text-[6px] uppercase font-bold">Müşteri / Proje:</span>
                          <span className="font-extrabold text-[9px] block truncate">{targetOrder.customerName}</span>
                          <span className="text-slate-700 block truncate">{targetOrder.projectNo || 'NB1129'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[6px] uppercase font-bold">Sipariş / İrsaliye No:</span>
                          <span className="font-bold text-[9px] block">{targetOrder.id}</span>
                        </div>
                        <div className="col-span-2 border-t border-dotted border-slate-300 pt-1">
                          <span className="text-slate-400 block text-[6px] uppercase font-bold">Ürün Detayı:</span>
                          <span className="font-semibold block truncate">{item.description || 'GLV ME TİPİ KABLO KANALI'}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end border-t border-black pt-1">
                        <div className="flex flex-col">
                          <span className="text-[6px] text-slate-500 uppercase leading-none">Miktar (Qty):</span>
                          <span className="font-black text-base leading-none mt-0.5">{qty} <span className="text-[9px] uppercase font-bold">AD</span></span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-black text-white text-[7px] font-mono px-1 rounded font-bold uppercase tracking-wider">QC PASSED</div>
                          <span className="text-[5px] text-slate-400 mt-0.5 font-mono">BATCH: {new Date().toISOString().split('T')[0].replace(/-/g, '')}</span>
                        </div>
                      </div>
                    </div>`;

const newLabelCard = `<div key={key} className="honeywell-label-50-100 bg-white text-black p-3 border-2 border-black rounded shadow-md font-sans w-[100mm] h-[50mm] flex flex-col justify-between shrink-0 box-border print:shadow-none print:border-black print:rounded-none print:my-0 print:mx-auto print:page-break-after-always">
                      {/* Header with SIES Logo & Stok Kodu Badge */}
                      <div className="flex justify-between items-center border-b-2 border-black pb-1.5">
                        <div className="flex items-center gap-2">
                          <img src="/sies_logo.png" alt="SIES Logo" className="h-6 object-contain" />
                          <div className="flex flex-col">
                            <span className="font-black text-xs uppercase tracking-wider leading-none">SIES ELEKTRİK</span>
                            <span className="text-[6px] text-slate-500 font-bold leading-none mt-0.5">MADE IN TURKEY / KALİTE GÜVENCE</span>
                          </div>
                        </div>
                        <span className="font-mono font-black text-sm border-2 border-black px-2 py-0.5 bg-black text-white rounded shadow-2xs">{prodCode}</span>
                      </div>
                      
                      {/* Body with Larger Customer Name, Order ID, Product Description */}
                      <div className="grid grid-cols-2 gap-1.5 text-[9px] my-1 leading-tight flex-1">
                        <div>
                          <span className="text-slate-500 block text-[7px] uppercase font-bold">Müşteri / Proje:</span>
                          <span className="font-black text-[11px] text-slate-900 block truncate leading-tight">{targetOrder.customerName}</span>
                          <span className="text-slate-700 font-bold text-[9px] block truncate">{targetOrder.projectNo || 'NB1129'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[7px] uppercase font-bold">Sipariş / İrsaliye No:</span>
                          <span className="font-mono font-black text-[11px] text-slate-900 block">{targetOrder.id}</span>
                        </div>
                        <div className="col-span-2 border-t border-dashed border-slate-300 pt-1">
                          <span className="text-slate-500 block text-[7px] uppercase font-bold">Ürün Detayı:</span>
                          <span className="font-extrabold text-[11px] text-slate-900 block truncate leading-tight">{item.description || 'GLV ME TİPİ KABLO KANALI'}</span>
                        </div>
                      </div>

                      {/* Footer with Correct Item Unit (MT / AD) & Quantity */}
                      <div className="flex justify-between items-end border-t-2 border-black pt-1">
                        <div className="flex flex-col">
                          <span className="text-[7px] text-slate-600 uppercase font-bold leading-none">Miktar (Qty):</span>
                          <span className="font-black text-lg leading-none mt-0.5 font-mono text-black">
                            {qty} <span className="text-[11px] uppercase font-black text-slate-900 ml-0.5">{item.unit || 'AD'}</span>
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="bg-black text-white text-[7px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">QC PASSED</div>
                          <span className="text-[6px] text-slate-500 mt-0.5 font-mono font-bold">BATCH: {new Date().toISOString().split('T')[0].replace(/-/g, '')}</span>
                        </div>
                      </div>
                    </div>`;

content = content.replace(oldLabelCard, newLabelCard);

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Successfully applied all master clean replacements!');
