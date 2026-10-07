const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

const docHubCode = `                  {/* Right Column: Documents Timeline Ledger */}
                  <div className="col-span-5 flex flex-col h-full bg-slate-100 overflow-y-auto p-5 space-y-5 border-l border-slate-200">
                    
                    {/* TÜM SİPARİŞ BELGELERİ & EVRAKLARI (6 DÖKÜMAN HUBS) */}
                    <div className="bg-white border-2 border-slate-300 rounded-xl shadow-md p-4 space-y-3 print:hidden">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-orange-600" /> Tüm Sipariş Belgeleri & Evrakları (6 Döküman)
                        </h4>
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 uppercase">AKTİF EVRAKLAR</span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-[9px]">
                        {/* 1. ÜRETİM FORMU & İŞ EMRİ (FR-009) */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition-all">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded text-[9px]">FR-009</span>
                              <span className="font-black text-slate-900 text-xs">1. Üretim Formu & İş Emri</span>
                            </div>
                            <span className="text-slate-500 text-[9px] block mt-0.5">İmalat takip & proses muayene kartı</span>
                          </div>
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
                            className="bg-slate-900 hover:bg-slate-800 text-white font-black px-3 py-1.5 rounded text-[10px] uppercase shadow-xs flex items-center gap-1 shrink-0"
                          >
                            <Printer className="h-3.5 w-3.5 text-orange-400" /> Üretim Formu Bas
                          </button>
                        </div>

                        {/* 2. SEVKİYAT İRSALİYESİ */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition-all">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded text-[9px]">İRSALİYE</span>
                              <span className="font-black text-slate-900 text-xs">2. Sevkiyat İrsaliyesi</span>
                            </div>
                            <span className="text-slate-500 text-[9px] block mt-0.5">Resmi sevk irsaliyesi dökümanı</span>
                          </div>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                setActiveDispatchToShow(order.dispatches[order.dispatches.length - 1]);
                              } else {
                                alert("Henüz oluşturulmuş sevk irsaliyesi bulunmuyor. Sol paneldeki 'Sevk Et' butonundan irsaliye oluşturabilirsiniz.");
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3 py-1.5 rounded text-[10px] uppercase shadow-xs flex items-center gap-1 shrink-0"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" /> İrsaliye Bas / Aç
                          </button>
                        </div>

                        {/* 3. SON KONTROL FORMU (FR-10) */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition-all">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded text-[9px]">FR-10</span>
                              <span className="font-black text-slate-900 text-xs">3. Son Kontrol Formu</span>
                            </div>
                            <span className="text-slate-500 text-[9px] block mt-0.5">Ölçüm & muayene kontrol raporu</span>
                          </div>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                handleOpenFR12(order.dispatches[order.dispatches.length - 1].dispatchNoteNo);
                              } else {
                                alert("Son Kontrol Formu (FR-10) doldurmak için öncelikle bir sevk irsaliyesi oluşturmalısınız.");
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded text-[10px] uppercase shadow-xs flex items-center gap-1 shrink-0"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" /> FR-10 Doldur / Bas
                          </button>
                        </div>

                        {/* 4. KALİTE TEST SERTİFİKASI (3.1 TEST) */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition-all">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded text-[9px]">3.1 TEST</span>
                              <span className="font-black text-slate-900 text-xs">4. Kalite Test Sertifikası</span>
                            </div>
                            <span className="text-slate-500 text-[9px] block mt-0.5">EN 10204 3.1 Test Raporu</span>
                          </div>
                          <button 
                            onClick={() => {
                              if (order.dispatches && order.dispatches.length > 0) {
                                handleOpenCertModal(order.dispatches[order.dispatches.length - 1].dispatchNoteNo);
                              } else {
                                alert("3.1 Sertifikası almak için öncelikle sevk irsaliyesi ve FR-10 son kontrol onayının tamamlanması gerekir.");
                              }
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-black px-3 py-1.5 rounded text-[10px] uppercase shadow-xs flex items-center gap-1 shrink-0"
                          >
                            <Award className="h-3.5 w-3.5" /> 3.1 Sertifikası Al
                          </button>
                        </div>

                        {/* 5. SİPARİŞ BELGESİ / TEKLİF (FR-013) */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition-all">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded text-[9px]">FR-013</span>
                              <span className="font-black text-slate-900 text-xs">5. Sipariş Belgesi / Teklif</span>
                            </div>
                            <span className="text-slate-500 text-[9px] block mt-0.5">Teklif formu & yüklenen evrak</span>
                          </div>
                          <button 
                            onClick={() => {
                              alert(\`Sipariş / Teklif No: \${order.id}\\nMüşteri: \${order.customerName}\\nDurum: \${order.status}\`);
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-black px-3 py-1.5 rounded text-[10px] uppercase shadow-xs flex items-center gap-1 shrink-0"
                          >
                            <FileText className="h-3.5 w-3.5" /> Teklif / Belge Aç
                          </button>
                        </div>

                        {/* 6. SEVKİYAT & ÜRÜN ETİKETİ */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition-all">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded text-[9px]">ETİKET</span>
                              <span className="font-black text-slate-900 text-xs">6. Sevkiyat & Ürün Etiketi</span>
                            </div>
                            <span className="text-slate-500 text-[9px] block mt-0.5">Barkodlu koli & palet etiketi (Honeywell 50x100mm)</span>
                          </div>
                          <button 
                            onClick={() => handleOpenLabels(order)}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-black px-3 py-1.5 rounded text-[10px] uppercase shadow-xs flex items-center gap-1 shrink-0"
                          >
                            <Tag className="h-3.5 w-3.5" /> Etiket Yazdır
                          </button>
                        </div>
                      </div>
                    </div>`;

const searchStr = '{/* Right Column: Documents Timeline Ledger */}';
const pos = content.indexOf(searchStr);

if (pos !== -1) {
  const lineEndPos = content.indexOf('>', pos) + 1;
  const secondLineEndPos = content.indexOf('>', lineEndPos) + 1;
  
  content = content.slice(0, pos) + docHubCode + '\n' + content.slice(secondLineEndPos);
  fs.writeFileSync('src/components/SalesModule.tsx', content);
  console.log('Successfully injected 6-Document Hub at pos:', pos);
} else {
  console.error('searchStr not found!');
}
