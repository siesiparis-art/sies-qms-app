const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

const startMarker = `{showOrderDetailModal && selectedOrderDetailOrder && (() => {`;
const endMarker = `{isEditingNewQuote && (`;

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found!');
  process.exit(1);
}

console.log('Found start at:', startIdx, 'end at:', endIdx);

const newModalCode = `{showOrderDetailModal && selectedOrderDetailOrder && (() => {
          const order = selectedOrderDetailOrder;
          const quote = quotes.find(q => q.id === order.quoteId);
          const statusColor = order.status === 'SEVK EDİLDİ' 
            ? 'bg-green-600 text-white'
            : order.status === 'KISMİ SEVK EDİLDİ'
            ? 'bg-amber-600 text-white'
            : order.status === 'BOYADA'
            ? 'bg-purple-600 text-white'
            : order.status === 'KAPLAMADA'
            ? 'bg-teal-600 text-white'
            : order.status === 'ÜRETİMDE'
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-white';
          
          return (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-50 p-2 sm:p-4 overflow-hidden">
              <div className="w-full h-full max-w-[1700px] max-h-[96vh] flex flex-col bg-slate-100 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                
                {/* Modal Header */}
                <div className="bg-slate-950 text-white px-6 py-3.5 flex justify-between items-center shadow-md shrink-0">
                  <div className="flex items-center gap-3.5">
                    <div className="bg-orange-600 p-2 rounded-xl text-white shadow-sm">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">SİPARİŞ DOKÜMANTASYON & OPERASYON MERKEZİ</h3>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">SIES Kalite Yönetim Sistemi (QMS-OS)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">SİPARİŞ NO:</span>
                      <span className="font-mono font-black text-xs text-orange-400">
                        {order.id}
                      </span>
                    </div>
                    
                    <span className={\`px-3 py-1 rounded-lg text-xs font-black tracking-wide uppercase shadow-2xs \${statusColor}\`}>
                      {order.status || 'BEKLEMEDE'}
                    </span>
                    
                    <button 
                      onClick={() => {
                        setShowOrderDetailModal(false);
                        setSelectedOrderDetailOrder(null);
                      }} 
                      className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition-all ml-2"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Sub-header meta strip */}
                <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-6 py-2.5 text-[11px] font-sans flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-orange-400 shrink-0" />
                    <span className="text-slate-400 font-bold uppercase text-[10px]">MÜŞTERİ:</span>
                    <span className="font-black text-white text-xs uppercase tracking-wide">{order.customerName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-400 shrink-0" />
                    <span className="text-slate-400 font-bold uppercase text-[10px]">TARİH & VADE:</span>
                    <span className="font-bold text-white">{order.date}</span>
                    <span className="text-slate-500">|</span>
                    <span className="font-extrabold text-amber-400">{quote?.paymentTerms || '45 GÜN VADELİ'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-400 font-bold uppercase text-[10px]">ADRES / PROJE:</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[200px]">{quote?.customerAddress || 'TESİS TESLİM'}</span>
                    <span className="text-slate-500">|</span>
                    <span className="font-mono font-bold text-orange-300">PROJE: {order.projectNo || 'NB1129'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="text-slate-400 font-bold uppercase text-[10px]">KDV & FİNANS:</span>
                    <span className="font-extrabold text-slate-200">{quote?.taxPercent === 0 ? "KDV'DEN MUAFTIR" : "MUAFİYET YOKTUR"}</span>
                  </div>
                </div>

                {/* Main Workspace Body */}
                <div className="flex-1 min-h-0 grid grid-cols-12 overflow-hidden">
                  
                  {/* Left Column: Items and Process stations */}
                  <div className="col-span-7 flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden">
                    
                    {/* Left Header */}
                    <div className="p-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white shrink-0">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-orange-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">Sipariş Kalemleri & İmalat İstasyon Havuzu</h4>
                      </div>
                      <span className="text-[10px] text-slate-300 font-bold bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                        ⚡ Birim: MT En Üstte + Stok Kodu Artan
                      </span>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-y-auto p-3">
                      <table className="w-full border-collapse border border-slate-200 text-left text-[11px] font-sans">
                        <thead>
                          <tr className="bg-slate-800 text-slate-100 uppercase text-[10px] font-black tracking-wider border-b border-slate-700">
                            <th className="p-2.5 text-center w-10">
                              <input 
                                type="checkbox" 
                                checked={order.items.length > 0 && order.items.every((i, idx) => selectedItems[\`\${i.productCode}-\${idx}\`] || (i.quantity - (i.shippedQuantity || 0)) <= 0)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const allKeys: Record<string, boolean> = { ...selectedItems };
                                    order.items.forEach((i, idx) => {
                                      const remaining = i.quantity - (i.shippedQuantity || 0);
                                      if (remaining > 0) {
                                        allKeys[\`\${i.productCode}-\${idx}\`] = true;
                                      }
                                    });
                                    setSelectedItems(allKeys);
                                  } else {
                                    const nextSelection = { ...selectedItems };
                                    order.items.forEach((i, idx) => {
                                      delete nextSelection[\`\${i.productCode}-\${idx}\`];
                                    });
                                    setSelectedItems(nextSelection);
                                  }
                                }}
                                className="rounded border-slate-500 text-orange-600 focus:ring-orange-500 h-4 w-4 cursor-pointer"
                              />
                            </th>
                            <th className="p-2.5 w-28">Stok Kodu</th>
                            <th className="p-2.5">Malın Tanımı / Ürün Açıklaması</th>
                            <th className="p-2.5 text-right w-24">Sipariş</th>
                            <th className="p-2.5 text-right w-24">Sevk Edilen</th>
                            <th className="p-2.5 text-right w-20">Kalan</th>
                            <th className="p-2.5 text-center w-24">İşlem Miktarı</th>
                            <th className="p-2.5 text-center w-24">Durum</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {sortProductionItems(order.items).map((item, idx) => {
                            const remaining = item.quantity - (item.shippedQuantity || 0);
                            const isSelected = !!selectedItems[\`\${item.productCode}-\${idx}\`];
                            
                            const prodCatalog = products.find(p => p.code.toUpperCase() === item.productCode.toUpperCase());
                            const descStr = prodCatalog ? prodCatalog.name : item.description || 'KABLO TAŞIYICI ELEMANI';
                            const isMt = isMtUnit(item.unit);
                            
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
                                <td className="p-2.5 text-right text-slate-900 font-mono font-bold">{item.quantity} <span className="text-[9px] uppercase font-bold text-slate-500">{item.unit || 'AD'}</span></td>
                                <td className="p-2.5 text-right text-green-700 font-mono font-bold">{item.shippedQuantity || 0} <span className="text-[9px] uppercase font-bold text-slate-500">{item.unit || 'AD'}</span></td>
                                <td className="p-2.5 text-right text-orange-700 font-mono font-bold">{remaining} <span className="text-[9px] uppercase font-bold text-slate-500">{item.unit || 'AD'}</span></td>
                                <td className="p-2.5 text-center">
                                  <input 
                                    type="number" 
                                    min="1" 
                                    max={remaining}
                                    value={actionQuantities[\`\${item.productCode}-\${idx}\`] ?? remaining}
                                    onChange={(e) => setActionQuantities({ ...actionQuantities, [\`\${item.productCode}-\${idx}\`]: parseInt(e.target.value) || 0 })}
                                    disabled={remaining <= 0}
                                    className="w-20 text-center bg-slate-50 border border-slate-300 rounded py-1 px-1.5 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none"
                                  />
                                </td>
                                <td className="p-2.5 text-center">
                                  {item.status === 'Sevk Edildi' ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block shadow-2xs">SEVK EDİLDİ</span>
                                  ) : item.status === 'Üretimde' ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-blue-100 text-blue-800 border border-blue-300 inline-block shadow-2xs">ÜRETİMDE</span>
                                  ) : item.status === 'Kaplamada' ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-teal-100 text-teal-800 border border-teal-300 inline-block shadow-2xs">KAPLAMADA</span>
                                  ) : item.status === 'Boyada' ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-purple-100 text-purple-800 border border-purple-300 inline-block shadow-2xs">BOYADA</span>
                                  ) : item.status === 'Paketlemede' ? (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-pink-100 text-pink-800 border border-pink-300 inline-block shadow-2xs">PAKETLEMEDE</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[9px] uppercase font-black bg-slate-100 text-slate-700 border border-slate-300 inline-block shadow-2xs">BEKLEMEDE</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Action Panel */}
                    <div className="p-3.5 border-t border-slate-200 bg-slate-100 flex flex-col gap-2.5 shrink-0">
                      
                      <div className="grid grid-cols-6 gap-2">
                        <button 
                          onClick={() => handleSendSelectedToProduction(order, true)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all flex items-center justify-center gap-1"
                          title="Tüm kalemleri üretime gönderir ve FR-009 formunu açar"
                        >
                          <Play className="h-3 w-3 text-orange-400" /> Tümünü Üretime Gönder
                        </button>
                        <button 
                          onClick={() => handleSendSelectedToCoating(order)}
                          className="bg-teal-600 hover:bg-teal-700 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Kaplamaya Gönder
                        </button>
                        <button 
                          onClick={() => handleReceiveFromCoating(order)}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Kaplamadan Kabul
                        </button>
                        <button 
                          onClick={() => handleSendSelectedToPainting(order)}
                          className="bg-orange-600 hover:bg-orange-700 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Boyaya Gönder
                        </button>
                        <button 
                          onClick={() => handleSendSelectedToPackaging(order)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"
                        >
                          Paketlemeye Git
                        </button>
                        <button 
                          onClick={() => handleOpenLabels(order)}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all flex items-center justify-center gap-1"
                        >
                          <Tag className="h-3 w-3 text-amber-400" /> Etiket Yazdır
                        </button>
                      </div>

                      <button 
                        onClick={() => handleShipSelected(order)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs uppercase shadow-md transition-all flex items-center justify-center gap-2 w-full tracking-wide"
                      >
                        <Truck className="h-4 w-4" /> Sevk Et (Yeni Resmi İrsaliye Kes)
                      </button>
                    </div>
                  </div>
                  
                  {/* Right Column: Documents Timeline Ledger */}
                  <div className="col-span-5 flex flex-col h-full bg-slate-100 overflow-y-auto p-4 space-y-4 border-l border-slate-200">
                    
                    {/* SECTION 1: TÜM SİPARİŞ BELGELERİ & EVRAKLARI (6 DÖKÜMAN HUBS) */}
                    <div className="bg-white border border-slate-300 rounded-xl shadow-md p-4 space-y-3 shrink-0">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-orange-600" /> Tüm Sipariş Belgeleri & Evrakları (6 Döküman)
                        </h4>
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 uppercase">AKTİF EVRAKLAR</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        {/* 1. ÜRETİM FORMU & İŞ EMRİ (FR-009) */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">1. Üretim Formu & İş Emri</span>
                            <span className="font-mono font-bold text-orange-600 bg-orange-100 px-1 rounded text-[8px]">FR-009</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">İmalat takip & proses muayene kartı</p>
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
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <Printer className="h-3 w-3 text-orange-400" /> Üretim Formu Bas
                          </button>
                        </div>

                        {/* 2. SEVKİYAT İRSALİYESİ */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">2. Sevkiyat İrsaliyesi</span>
                            <span className="font-mono font-bold text-blue-600 bg-blue-100 px-1 rounded text-[8px]">İRSALİYE</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Resmi sevk irsaliyesi dökümanı</p>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                setActiveDispatchToShow(order.dispatches[order.dispatches.length - 1]);
                              } else {
                                alert("Henüz oluşturulmuş sevk irsaliyesi bulunmuyor. Sol paneldeki 'Sevk Et' butonundan irsaliye oluşturabilirsiniz.");
                              }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <FileSpreadsheet className="h-3 w-3" /> İrsaliye Bas / Aç
                          </button>
                        </div>

                        {/* 3. SON KONTROL FORMU (FR-10) */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">3. Son Kontrol Formu</span>
                            <span className="font-mono font-bold text-emerald-600 bg-emerald-100 px-1 rounded text-[8px]">FR-10</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Ölçüm & muayene kontrol raporu</p>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                handleOpenFR12(order.dispatches[order.dispatches.length - 1].dispatchNoteNo);
                              } else {
                                alert("Son Kontrol Formu (FR-10) doldurmak için öncelikle bir sevk irsaliyesi oluşturmalısınız.");
                              }
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <ClipboardCheck className="h-3 w-3" /> FR-10 Doldur / Bas
                          </button>
                        </div>

                        {/* 4. KALİTE TEST SERTİFİKASI (3.1 TEST) */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">4. Kalite Test Sertifikası</span>
                            <span className="font-mono font-bold text-purple-600 bg-purple-100 px-1 rounded text-[8px]">3.1 TEST</span>
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
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <Award className="h-3 w-3" /> 3.1 Sertifikası Al
                          </button>
                        </div>

                        {/* 5. SİPARİŞ BELGESİ / TEKLİF (FR-013) */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">5. Sipariş Belgesi / Teklif</span>
                            <span className="font-mono font-bold text-amber-600 bg-amber-100 px-1 rounded text-[8px]">FR-013</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Teklif formu & yüklenen evrak</p>
                          <button 
                            onClick={() => {
                              alert(\`Sipariş / Teklif No: \${order.id}\\nMüşteri: \${order.customerName}\\nDurum: \${order.status}\`);
                            }}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <FileText className="h-3 w-3" /> Teklif / Belge Aç
                          </button>
                        </div>

                        {/* 6. SEVKİYAT & ÜRÜN ETİKETİ */}
                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50 flex flex-col justify-between space-y-1.5 hover:bg-slate-100 transition-all">
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-slate-900 text-[10px]">6. Sevkiyat & Ürün Etiketi</span>
                            <span className="font-mono font-bold text-teal-600 bg-teal-100 px-1 rounded text-[8px]">ETİKET</span>
                          </div>
                          <p className="text-slate-500 text-[8px] leading-tight">Barkodlu koli & palet etiketi (Honeywell)</p>
                          <button 
                            onClick={() => handleOpenLabels(order)}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black py-1.5 rounded text-[9px] uppercase shadow-xs flex items-center justify-center gap-1"
                          >
                            <Tag className="h-3 w-3" /> Etiket Yazdır
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: SEVKİYAT İRSALİYELERİ & KALİTE EVRAKLARI GEÇMİŞİ */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-150">
                        <Truck className="h-4 w-4 text-orange-500" /> Sevkiyat Geçmişi & Kalite Evrakları (FR-10 & 3.1)
                      </h4>
                      {order.dispatches && order.dispatches.length > 0 ? (
                        <div className="space-y-4">
                          {order.dispatches.map((dispatch) => {
                            const savedInspections = localStorage.getItem('qms_fr12_inspections');
                            const inspections = savedInspections ? JSON.parse(savedInspections) : {};
                            const inspection = inspections[dispatch.dispatchNoteNo];
                            const isApproved = inspection && inspection.status === 'ONAYLANDI';
                            const existingCert = certificates.find(c => c.dispatchNoteNo === dispatch.dispatchNoteNo);
                            
                            return (
                              <div key={dispatch.dispatchNoteNo} className="border border-slate-200 rounded-xl p-4 space-y-3.5 bg-slate-50 shadow-sm relative overflow-hidden">
                                
                                <div className={\`absolute top-0 left-0 right-0 h-1.5 \${isApproved ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}\`} />

                                <div className="flex justify-between items-center border-b border-slate-200 pb-2 pt-1">
                                  <span className="font-mono font-black text-slate-900 text-xs flex items-center gap-1.5">
                                    <FileSpreadsheet className="h-4 w-4 text-slate-500" /> {dispatch.dispatchNoteNo}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-bold bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-sm">{dispatch.date}</span>
                                </div>
                                
                                <div className="bg-white border border-slate-150 rounded-lg p-2.5 space-y-1.5">
                                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">Sevk Edilen Mal Listesi</span>
                                  <div className="text-[10px] text-slate-700 font-sans leading-relaxed space-y-1">
                                    {dispatch.items.map((di, diIdx) => {
                                      const prodCatalog = products.find(p => p.code.toUpperCase() === di.productCode.toUpperCase());
                                      const descStr = prodCatalog ? prodCatalog.name : 'KABLO MALZEMESİ';
                                      return (
                                        <div key={diIdx} className="flex justify-between border-b border-slate-50 last:border-0 pb-1 last:pb-0">
                                          <span className="font-semibold text-slate-900">{di.productCode}</span>
                                          <span className="text-slate-500 truncate max-w-[180px]" title={descStr}>{descStr}</span>
                                          <span className="font-mono font-bold text-slate-950">{di.quantity} AD</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-1">
                                  <button
                                    onClick={() => setActiveDispatchToShow(dispatch)}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-2 py-1.5 rounded text-[9px] uppercase transition-all flex items-center justify-center gap-1"
                                  >
                                    <Printer className="h-3 w-3" /> İrsaliye Bas
                                  </button>

                                  <button
                                    onClick={() => handleOpenFR12(dispatch.dispatchNoteNo)}
                                    className={\`font-bold px-2 py-1.5 rounded text-[9px] uppercase transition-all flex items-center justify-center gap-1 \${
                                      isApproved 
                                        ? 'bg-green-100 text-green-800 border border-green-300' 
                                        : 'bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-300'
                                    }\`}
                                  >
                                    <ClipboardCheck className="h-3 w-3" /> {isApproved ? 'FR-10 (Onaylandı)' : 'FR-10 Doldur'}
                                  </button>

                                  <button
                                    onClick={() => handleOpenCertModal(dispatch.dispatchNoteNo)}
                                    className={\`font-bold px-2 py-1.5 rounded text-[9px] uppercase transition-all flex items-center justify-center gap-1 \${
                                      existingCert 
                                        ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                                    }\`}
                                  >
                                    <Award className="h-3 w-3" /> {existingCert ? '3.1 Sertifikası' : '3.1 Hazırla'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 font-mono uppercase text-[9px]">
                          Henüz sevk irsaliyesi oluşturulmamış.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}`;

content = content.slice(0, startIdx) + newModalCode + content.slice(endIdx);
fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Successfully applied complete high-end redesign of OrderDetailModal!');
