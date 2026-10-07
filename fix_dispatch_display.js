const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

// Replace SECTION 2 in OrderDetailModal with realDispatches check
const oldSection2 = `{/* SECTION 2: SEVKİYAT İRSALİYELERİ & KALİTE EVRAKLARI GEÇMİŞİ */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-150">
                        <Truck className="h-4 w-4 text-orange-500" /> Sevkiyat Geçmişi & Kalite Evrakları (FR-10 & 3.1)
                      </h4>
                      {order.dispatches && order.dispatches.length > 0 ? (
                        <div className="space-y-4">
                          {order.dispatches.map((dispatch) => {`;

const newSection2 = `{/* SECTION 2: SEVKİYAT İRSALİYELERİ & KALİTE EVRAKLARI GEÇMİŞİ */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-200">
                        <Truck className="h-4 w-4 text-orange-600" /> Sevkiyat İrsaliyeleri Geçmişi & Kalite Evrakları
                      </h4>
                      {(() => {
                        // Only show dispatches if order actually has shipped quantity or valid dispatches
                        const realDispatches = (order.dispatches || []).filter(d => {
                          return d && d.items && d.items.length > 0 && order.items.some(i => (i.shippedQuantity || 0) > 0);
                        });

                        if (realDispatches.length === 0) {
                          return (
                            <div className="text-center py-8 px-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/80 text-slate-600 space-y-2.5">
                              <Truck className="h-8 w-8 text-slate-400 mx-auto" />
                              <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">Henüz Sevk İrsaliyesi Kesilmemiştir</h5>
                              <p className="text-[10px] text-slate-500 max-w-md mx-auto leading-relaxed font-sans">
                                Bu sipariş için henüz herhangi bir resmi sevk irsaliyesi oluşturulmamıştır. Sol paneldeki <span className="font-extrabold text-slate-800 font-mono">"Sevk Et (Yeni Resmi İrsaliye Kes)"</span> butonundan irsaliye kestiğinizde; <span className="font-extrabold text-slate-800 font-mono">İrsaliye Numarası</span>, <span className="font-extrabold text-slate-800 font-mono">İrsaliye Tarihi</span> ve <span className="font-extrabold text-slate-800 font-mono">Sevk Edilen Kalemler Listesi</span> burada otomatik olarak görüntülenecektir.
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {realDispatches.map((dispatch) => {`;

content = content.replace(oldSection2, newSection2);

// Replace end of mapping in SECTION 2
const oldSection2End = `                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-slate-400 font-mono uppercase text-[9px]">
                          Henüz sevk irsaliyesi oluşturulmamış.
                        </div>
                      )}`;

const newSection2End = `                            })}
                          </div>
                        );
                      })()}`;

content = content.replace(oldSection2End, newSection2End);

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Successfully updated dispatch history section!');
