const fs = require('fs');
const filePath = 'C:/Users/Pc/.gemini/antigravity/scratch/qms-os/client/src/components/SalesModule.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states
const stateMarker = "const [showCoatingAcceptModal, setShowCoatingAcceptModal] = useState(false);";
const newStates = `const [showCoatingAcceptModal, setShowCoatingAcceptModal] = useState(false);
  
  // Work Order (Üretim İş Emri FR-009) Modal States
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [workOrderOrder, setWorkOrderOrder] = useState<Order | null>(null);
  const [workOrderGeneralNotes, setWorkOrderGeneralNotes] = useState('');
  const [workOrderItemNotes, setWorkOrderItemNotes] = useState<Record<string, string>>({});`;

content = content.replace(stateMarker, newStates);

// 2. Add Work Order Handlers
const handlerMarker = "  // Action: Send Selected to Production (Direct execution, no modal!)";
const newHandlers = `  // Action: Open Work Order Form (FR-009) & Send to Production
  const handleOpenWorkOrder = (orderInput?: Order) => {
    const targetOrder = orderInput || selectedOrderDetailOrder || activeOrder;
    if (!targetOrder) return;

    setWorkOrderOrder(targetOrder);
    setWorkOrderGeneralNotes(targetOrder.notes || '');

    const initialItemNotes: Record<string, string> = {};
    targetOrder.items.forEach((item, idx) => {
      const key = \`\${item.productCode}-\${idx}\`;
      initialItemNotes[key] = (item as any).itemNotes || workOrderItemNotes[key] || '';
    });
    setWorkOrderItemNotes(initialItemNotes);
    setShowWorkOrderModal(true);
  };

  const handleConfirmWorkOrderAndSendToProduction = () => {
    if (!workOrderOrder) return;

    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = workOrderOrder.items[itemIdx];
      return item && item.productCode === prodCode;
    });

    const targetKeys = selectedKeys.length > 0 ? selectedKeys : workOrderOrder.items.map((it, idx) => \`\${it.productCode}-\${idx}\`);

    targetKeys.forEach(key => {
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = workOrderOrder.items[itemIdx];
      if (!item) return;

      const remaining = item.quantity - (item.shippedQuantity || 0);
      const qty = actionQuantities[key] || remaining;
      if (qty <= 0) return;

      const orderNo = \`EMR-2026-\${Math.floor(100 + Math.random() * 900)}\`;
      const runId = \`PRD-2026-\${Math.floor(100 + Math.random() * 900)}\`;
      const noteForThisItem = workOrderItemNotes[key] || '';

      addProductionRun({
        id: runId,
        productionOrderNo: orderNo,
        date: new Date().toISOString().split('T')[0],
        productCode: prodCode,
        quantity: qty,
        operator: '',
        pdfFile: \`Uretim_Is_Emri_\${orderNo}.pdf\`,
        firstCheckStatus: 'Bekliyor',
        inProcessChecks: [],
        status: 'İlk Kontrol Bekliyor',
        notes: noteForThisItem || workOrderGeneralNotes || 'İş emri oluşturuldu.',
        orderId: workOrderOrder.id,
        processes: ['Kesme', 'Delme', 'Bükme']
      });
    });

    const updatedItems = workOrderOrder.items.map((item, idx) => {
      const key = \`\${item.productCode}-\${idx}\`;
      const noteForThisItem = workOrderItemNotes[key] || (item as any).itemNotes || '';
      if (targetKeys.includes(key)) {
        return { ...item, status: 'Üretimde' as const, itemNotes: noteForThisItem };
      }
      return { ...item, itemNotes: noteForThisItem };
    });

    updateOrder(workOrderOrder.id, {
      items: updatedItems,
      status: 'ÜRETİMDE',
      notes: workOrderGeneralNotes
    });

    alert(\`[İŞ EMRİ BAŞARILI] \${workOrderOrder.id} nolu sipariş için Üretim İş Emri oluşturuldu ve imalat başlatıldı!\`);
    setShowWorkOrderModal(false);
    setSelectedItems({});
  };

  // Action: Send Selected to Production (Direct execution, no modal!)`;

content = content.replace(handlerMarker, newHandlers);

// 3. Update Üretime Gönder button to call handleOpenWorkOrder
content = content.replace(
  "onClick={() => handleSendSelectedToProduction(order)}",
  "onClick={() => handleOpenWorkOrder(order)}"
);

// 4. Update İMALAT TAKİP KARTLARI header to add İş Emri Formu button
const headerMarker = `<h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1 pb-2 border-b border-slate-150">
                        <Play className="h-4 w-4 text-orange-500" /> İmalat Takip Kartları (FR-009)
                      </h4>`;
const newHeader = `<div className="flex justify-between items-center pb-2 border-b border-slate-150">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                          <Play className="h-4 w-4 text-orange-500" /> İmalat Takip Kartları (FR-009)
                        </h4>
                        <button
                          onClick={() => handleOpenWorkOrder(order)}
                          className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold px-2 py-0.5 rounded text-[9px] uppercase shadow-xs flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3 text-orange-600" /> İş Emri Formu
                        </button>
                      </div>`;

content = content.replace(headerMarker, newHeader);

// 5. Display itemNotes in Items table description column
const descCellMarker = `<td className="p-3 font-sans text-xs text-slate-700 leading-normal font-semibold">{descStr}</td>`;
const newDescCell = `<td className="p-3 font-sans text-xs text-slate-700 leading-normal font-semibold">
                                    <div>{descStr}</div>
                                    {item.itemNotes && (
                                      <div className="text-[10px] text-orange-700 font-bold bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded w-fit mt-1">
                                        📌 Not: {item.itemNotes}
                                      </div>
                                    )}
                                  </td>`;

content = content.replace(descCellMarker, newDescCell);

// 6. Add Work Order Modal JSX right after showOrderDetailModal closing brace
const modalEndMarker = "        {isEditingNewQuote && (";

const workOrderModalJSX = `        {/* MODAL: ÜRETİM İŞ EMRİ FORMU (WORK ORDER / FR-009) */}
        {showWorkOrderModal && workOrderOrder && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex justify-center items-center z-50 p-4 print:p-0 print:bg-white print:static">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[1000px] max-h-[92vh] overflow-y-auto flex flex-col p-6 font-sans print:shadow-none print:border-none print:max-w-full print:p-0">
              
              {/* Printable Area Wrapper */}
              <div className="print-area print-portrait space-y-5">
                
                {/* Corporate Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <img src="/sies_logo.png" alt="SIES Logo" className="h-14 object-contain" />
                    <div>
                      <h2 className="font-extrabold text-base text-slate-950 uppercase tracking-tight">SİES ELEKTRİK MÜH. SAN. TİC. LTD. ŞTİ.</h2>
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">ÜRETİM İŞ EMRİ FORMU & İMALAT TALİMATI</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-900 text-white font-mono font-bold text-xs px-3 py-1 rounded inline-block">FR-009 / REV-02</span>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Düzenleme Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>

                {/* Metadata Summary Box */}
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">SİPARİŞ NO</span>
                    <span className="font-mono font-black text-slate-900 text-sm">{workOrderOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">MÜŞTERİ ÜNVANI</span>
                    <span className="font-bold text-slate-900 uppercase truncate block">{workOrderOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">PROJE / ONAY NO</span>
                    <span className="font-mono font-bold text-slate-900">{workOrderOrder.projectNo || 'PRJ-2025-001'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">SİPARİŞ TARİHİ</span>
                    <span className="font-bold text-slate-900">{workOrderOrder.date}</span>
                  </div>
                </div>

                {/* Genel Sipariş / İmalat Notları Input Area */}
                <div className="space-y-1.5 print:hidden">
                  <label className="text-xs font-extrabold text-slate-800 uppercase flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-orange-600" /> Genel Sipariş / İmalat Notları & Talimatlar:
                  </label>
                  <textarea
                    rows={2}
                    value={workOrderGeneralNotes}
                    onChange={e => setWorkOrderGeneralNotes(e.target.value)}
                    placeholder="Üretim ekibi ve atölye sorumluları için genel notlar, özel çapak temizliği, ambar sevkiyat notları..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-sans font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                {workOrderGeneralNotes && (
                  <div className="hidden print:block bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-xs text-slate-800">
                    <strong>İMALAT GENEL TALİMATI:</strong> {workOrderGeneralNotes}
                  </div>
                )}

                {/* Items Table with Editable Notes */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center justify-between">
                    <span>📋 ÜRETİME ALINACAK İMALAT KALEMLERİ VE KALEM NOTLARI</span>
                    <span className="text-[10px] text-slate-500 font-bold font-mono">Toplam {workOrderOrder.items.length} Kalem</span>
                  </h3>
                  
                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full border-collapse text-left text-xs font-sans">
                      <thead>
                        <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                          <th className="p-2.5 text-center w-10 border-r border-slate-800">NO</th>
                          <th className="p-2.5 w-28 border-r border-slate-800">SİPARİŞ KODU</th>
                          <th className="p-2.5 border-r border-slate-800">MALIN TANIMI / AÇIKLAMASI</th>
                          <th className="p-2.5 text-right w-20 border-r border-slate-800">MİKTAR</th>
                          <th className="p-2.5 text-center w-16 border-r border-slate-800">BİRİM</th>
                          <th className="p-2.5">SİPARİŞ / İMALAT ÖZEL NOTLARI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {workOrderOrder.items.map((item, idx) => {
                          const key = \`\${item.productCode}-\${idx}\`;
                          const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                          const descStr = prodCatalog ? prodCatalog.name : item.description || 'KABLO TAŞIYICI ELEMANLARI';
                          const unitStr = item.unit || 'AD';
                          const currentNote = workOrderItemNotes[key] || '';

                          return (
                            <tr key={key} className="hover:bg-slate-50/80 font-sans">
                              <td className="p-2.5 text-center font-bold font-mono text-slate-500 border-r border-slate-200">{idx + 1}</td>
                              <td className="p-2.5 font-mono font-black text-slate-900 border-r border-slate-200">{item.productCode}</td>
                              <td className="p-2.5 font-bold text-slate-800 text-[11px] leading-snug border-r border-slate-200">{descStr}</td>
                              <td className="p-2.5 text-right font-mono font-black text-slate-950 text-sm border-r border-slate-200">{item.quantity}</td>
                              <td className="p-2.5 text-center font-bold text-slate-600 border-r border-slate-200">{unitStr}</td>
                              <td className="p-2 text-slate-800">
                                <input
                                  type="text"
                                  value={currentNote}
                                  onChange={e => setWorkOrderItemNotes({ ...workOrderItemNotes, [key]: e.target.value })}
                                  placeholder="Kalem notu yazın (örn: 1.5mm galvaniz sac, boy kesim...)"
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs font-semibold text-slate-900 focus:bg-white focus:border-orange-500 focus:outline-none print:bg-transparent print:border-none print:p-0"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signature Box for Print */}
                <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs font-sans text-slate-700">
                  <div className="border border-slate-300 rounded-lg p-3 h-24 flex flex-col justify-between bg-slate-50/50">
                    <span className="font-extrabold uppercase text-[10px] text-slate-500">SİPARİŞİ VEREN / İŞ EMRİ YAZAN</span>
                    <span className="font-bold text-slate-900 text-xs">Satış & Planlama Departmanı</span>
                  </div>
                  <div className="border border-slate-300 rounded-lg p-3 h-24 flex flex-col justify-between bg-slate-50/50">
                    <span className="font-extrabold uppercase text-[10px] text-slate-500">İMALAT SORUMLUSU / OPERATÖR</span>
                    <span className="font-bold text-slate-900 text-xs">Atölye Üretim Amiri</span>
                  </div>
                  <div className="border border-slate-300 rounded-lg p-3 h-24 flex flex-col justify-between bg-slate-50/50">
                    <span className="font-extrabold uppercase text-[10px] text-slate-500">KALİTE KONTROL ONAYI</span>
                    <span className="font-bold text-slate-900 text-xs">QMS Kalite Temsilcisi</span>
                  </div>
                </div>

              </div>

              {/* Modal Buttons (Hidden in print) */}
              <div className="flex justify-between items-center pt-6 border-t border-slate-200 mt-6 print:hidden">
                <button
                  onClick={() => setShowWorkOrderModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all"
                >
                  Kapat / İptal
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs uppercase flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Printer className="h-4 w-4" /> İş Emrini Yazdır (PDF)
                  </button>
                  <button
                    onClick={handleConfirmWorkOrderAndSendToProduction}
                    className="px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs uppercase flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Üretime Başlat & İmalat Kartlarını Oluştur
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
        
        {isEditingNewQuote && (`;

content = content.replace(modalEndMarker, workOrderModalJSX);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Work Order modal and handlers added successfully!');
