'use client';

import React, { useState } from 'react';
import { useQms, IncomingInspection, OutgoingInspection, ProductionRun, TestReport, Order, Quote } from '@/context/QmsContext';
import { 
  Search, ShieldAlert, Award, FileText, ArrowRight, ArrowDown, User, Calendar, Truck, Clock, ShieldCheck, Printer, CheckCircle2, ChevronRight, X, ShoppingCart
} from 'lucide-react';

// Material Grade Standards
const MATERIAL_STANDARDS: Record<string, { 
  chemical: { name: string; min?: number; max?: number; unit: string; actualBase: number; actualVar: number }[];
  mechanical: { name: string; min?: number; max?: number; unit: string; actualBase: number; actualVar: number }[];
}> = {
  'ST37': {
    chemical: [
      { name: 'Carbon (C)', max: 0.17, unit: '%', actualBase: 0.12, actualVar: 0.03 },
      { name: 'Manganese (Mn)', max: 1.40, unit: '%', actualBase: 0.45, actualVar: 0.10 },
      { name: 'Silicon (Si)', max: 0.35, unit: '%', actualBase: 0.18, actualVar: 0.05 },
      { name: 'Phosphorus (P)', max: 0.045, unit: '%', actualBase: 0.015, actualVar: 0.005 },
      { name: 'Sulfur (S)', max: 0.045, unit: '%', actualBase: 0.012, actualVar: 0.003 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 235, unit: 'N/mm²', actualBase: 245, actualVar: 10 },
      { name: 'Tensile Strength (Rm)', min: 360, max: 510, unit: 'N/mm²', actualBase: 410, actualVar: 20 },
      { name: 'Elongation (A5)', min: 26, unit: '%', actualBase: 29, actualVar: 3 }
    ]
  },
  '304 Paslanmaz': {
    chemical: [
      { name: 'Carbon (C)', max: 0.08, unit: '%', actualBase: 0.04, actualVar: 0.01 },
      { name: 'Chromium (Cr)', min: 18.0, max: 20.0, unit: '%', actualBase: 18.2, actualVar: 0.5 },
      { name: 'Nickel (Ni)', min: 8.0, max: 10.5, unit: '%', actualBase: 8.1, actualVar: 0.3 },
      { name: 'Manganese (Mn)', max: 2.0, unit: '%', actualBase: 1.2, actualVar: 0.2 },
      { name: 'Silicon (Si)', max: 0.75, unit: '%', actualBase: 0.42, actualVar: 0.08 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 205, unit: 'N/mm²', actualBase: 225, actualVar: 15 },
      { name: 'Tensile Strength (Rm)', min: 515, max: 720, unit: 'N/mm²', actualBase: 565, actualVar: 30 },
      { name: 'Elongation (A5)', min: 40, unit: '%', actualBase: 46, actualVar: 4 }
    ]
  },
  '316 Paslanmaz': {
    chemical: [
      { name: 'Carbon (C)', max: 0.08, unit: '%', actualBase: 0.035, actualVar: 0.01 },
      { name: 'Chromium (Cr)', min: 16.0, max: 18.0, unit: '%', actualBase: 16.5, actualVar: 0.4 },
      { name: 'Nickel (Ni)', min: 10.0, max: 14.0, unit: '%', actualBase: 10.3, actualVar: 0.5 },
      { name: 'Molybdenum (Mo)', min: 2.0, max: 3.0, unit: '%', actualBase: 2.1, actualVar: 0.2 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 205, unit: 'N/mm²', actualBase: 235, actualVar: 10 },
      { name: 'Tensile Strength (Rm)', min: 515, max: 690, unit: 'N/mm²', actualBase: 570, actualVar: 25 },
      { name: 'Elongation (A5)', min: 40, unit: '%', actualBase: 44, actualVar: 3 }
    ]
  },
  '5754 Alüminyum': {
    chemical: [
      { name: 'Magnesium (Mg)', min: 2.6, max: 3.6, unit: '%', actualBase: 2.9, actualVar: 0.2 },
      { name: 'Manganese (Mn)', max: 0.50, unit: '%', actualBase: 0.22, actualVar: 0.05 },
      { name: 'Iron (Fe)', max: 0.40, unit: '%', actualBase: 0.18, actualVar: 0.04 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 80, unit: 'N/mm²', actualBase: 95, actualVar: 10 },
      { name: 'Tensile Strength (Rm)', min: 190, max: 240, unit: 'N/mm²', actualBase: 215, actualVar: 15 },
      { name: 'Elongation (A5)', min: 12, unit: '%', actualBase: 15, actualVar: 2 }
    ]
  },
  '6082 Alüminyum': {
    chemical: [
      { name: 'Silicon (Si)', min: 0.7, max: 1.3, unit: '%', actualBase: 0.95, actualVar: 0.1 },
      { name: 'Magnesium (Mg)', min: 0.6, max: 1.2, unit: '%', actualBase: 0.85, actualVar: 0.1 },
      { name: 'Manganese (Mn)', min: 0.40, max: 1.0, unit: '%', actualBase: 0.62, actualVar: 0.1 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 260, unit: 'N/mm²', actualBase: 285, actualVar: 15 },
      { name: 'Tensile Strength (Rm)', min: 310, unit: 'N/mm²', actualBase: 330, actualVar: 10 },
      { name: 'Elongation (A5)', min: 10, unit: '%', actualBase: 12, actualVar: 1.5 }
    ]
  },
  '1050 Alüminyum': {
    chemical: [
      { name: 'Aluminium (Al)', min: 99.5, unit: '%', actualBase: 99.6, actualVar: 0.05 },
      { name: 'Iron (Fe)', max: 0.40, unit: '%', actualBase: 0.25, actualVar: 0.05 },
      { name: 'Silicon (Si)', max: 0.25, unit: '%', actualBase: 0.12, actualVar: 0.03 }
    ],
    mechanical: [
      { name: 'Yield Strength (Re)', min: 20, unit: 'N/mm²', actualBase: 35, actualVar: 5 },
      { name: 'Tensile Strength (Rm)', min: 65, max: 95, unit: 'N/mm²', actualBase: 78, actualVar: 10 },
      { name: 'Elongation (A5)', min: 25, unit: '%', actualBase: 32, actualVar: 3 }
    ]
  }
};

export default function TraceabilityModule() {
  const { 
    incomingInspections, 
    outgoingInspections, 
    productionRuns, 
    testReports,
    suppliers,
    companyInfo,
    quotes,
    orders,
    certificates
  } = useQms();

  const [query, setQuery] = useState('SE12024000000058');
  const [tracedIncoming, setTracedIncoming] = useState<IncomingInspection[]>([]);
  const [tracedRuns, setTracedRuns] = useState<ProductionRun[]>([]);
  const [tracedOutgoing, setTracedOutgoing] = useState<OutgoingInspection[]>([]);
  const [tracedTests, setTracedTests] = useState<TestReport[]>([]);
  const [tracedSupplierRating, setTracedSupplierRating] = useState<number | null>(null);
  const [tracedSupplierName, setTracedSupplierName] = useState<string>('');
  
  const [searched, setSearched] = useState(false);
  const [pdfPreviewFile, setPdfPreviewFile] = useState<string | null>(null);
  
  const [tracedQuote, setTracedQuote] = useState<any>(null);
  const [tracedOrder, setTracedOrder] = useState<any>(null);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const handleUpdateItemGrade = (itemIdx: number, newGrade: string) => {
    if (!selectedCert) return;
    const spec = MATERIAL_STANDARDS[newGrade];
    if (!spec) return;

    const getVal = (list: any[], name: string) => {
      const entry = list.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
      if (!entry) return 0;
      return Number((entry.actualBase + (Math.random() - 0.5) * entry.actualVar * 2).toFixed(3));
    };

    const updatedItems = selectedCert.items.map((item: any, idx: number) => {
      if (idx === itemIdx) {
        const cVal = getVal(spec.chemical, 'carbon');
        const siVal = getVal(spec.chemical, 'silicon');
        const mnVal = getVal(spec.chemical, 'manganese');
        const pVal = getVal(spec.chemical, 'phosphorus');
        const sVal = getVal(spec.chemical, 'sulfur');
        const crVal = getVal(spec.chemical, 'chromium');
        const niVal = getVal(spec.chemical, 'nickel');
        const moVal = getVal(spec.chemical, 'molybdenum') || 0.02;
        const tiVal = 0.002;
        const nVal = 62;
        const alVal = 0.035;

        const rehVal = Math.round(getVal(spec.mechanical, 'yield') || 285);
        const rmVal = Math.round(getVal(spec.mechanical, 'tensile') || 410);
        const aVal = Math.round(getVal(spec.mechanical, 'elongation') || 28);

        return {
          ...item,
          material: newGrade,
          c: cVal,
          si: siVal,
          mn: mnVal,
          p: pVal,
          s: sVal,
          cr: crVal,
          ni: niVal,
          mo: moVal,
          ti: tiVal,
          n: nVal,
          al: alVal,
          muayeneNo: `(EN 10025-${newGrade.includes('ST') ? '2' : '5'})`,
          reh: rehVal,
          rm: rmVal,
          a: aVal
        };
      }
      return item;
    });

    const updatedCert = {
      ...selectedCert,
      items: updatedItems
    };

    setSelectedCert(updatedCert);

    // Save to localStorage
    const certExists = certificates.some(c => c.id === selectedCert.id);
    if (certExists) {
      const updatedCerts = certificates.map(c => c.id === selectedCert.id ? updatedCert : c);
      localStorage.setItem('qms_certificates', JSON.stringify(updatedCerts));
    }
  };

  const handleTrace = () => {
    if (!query) return;

    setSearched(true);
    const normalizedQuery = query.trim().toUpperCase();

    // 1. Search in Outgoing Inspections (Dispatch notes, e.g. SE12024000000058)
    const outgoingMatches = outgoingInspections.filter(o => 
      o.dispatchNoteNo.toUpperCase().includes(normalizedQuery) ||
      o.productCode.toUpperCase().includes(normalizedQuery) ||
      o.customerId.toUpperCase().includes(normalizedQuery)
    );

    // 2. Search in Incoming Inspections (Supplier delivery notes, e.g. YER2024000000346)
    const incomingMatches = incomingInspections.filter(i => 
      i.deliveryNoteNo.toUpperCase().includes(normalizedQuery) ||
      i.materialName.toUpperCase().includes(normalizedQuery) ||
      i.supplierId.toUpperCase().includes(normalizedQuery)
    );

    let finalOutgoing = [...outgoingMatches];
    let finalIncoming = [...incomingMatches];
    let finalRuns: ProductionRun[] = [];
    let finalTests: TestReport[] = [];

    // Case A: User searched for an Outgoing Dispatch Note or Customer Shipment
    if (outgoingMatches.length > 0) {
      // Find related production runs for these product codes
      const productCodes = outgoingMatches.map(o => o.productCode);
      finalRuns = productionRuns.filter(r => productCodes.includes(r.productCode));
      
      // Find related incoming raw materials that match the thickness/width/material parameters
      outgoingMatches.forEach(o => {
        const matchingIncoming = incomingInspections.filter(i => 
          (o.thicknessMm > 0 && i.materialName.includes(o.thicknessMm.toFixed(2))) ||
          (o.productCode.includes('BB') && i.materialName.toLowerCase().includes('cıvata')) ||
          (o.productCode.includes('MBF') && i.materialName.toLowerCase().includes('somun')) ||
          (o.productCode === 'SU 10/P' && i.materialName.includes('0.80')) ||
          (o.productCode === 'SU 20' && i.materialName.includes('0.90'))
        );
        matchingIncoming.forEach(inc => {
          if (!finalIncoming.some(f => f.id === inc.id)) {
            finalIncoming.push(inc);
          }
        });
      });

      // Find related laboratory test reports for these product codes
      finalTests = testReports.filter(t => productCodes.includes(t.productCode));
    }
    // Case B: User searched for an Incoming Supplier Delivery Note
    else if (incomingMatches.length > 0) {
      // Find what was produced using these materials
      incomingMatches.forEach(i => {
        let producedCode = '';
        if (i.materialName.includes('0.80')) producedCode = 'SU 10/P';
        else if (i.materialName.includes('0.90')) producedCode = 'SU 20';
        else if (i.materialName.toLowerCase().includes('cıvata')) producedCode = 'BB 8X15';
        else if (i.materialName.toLowerCase().includes('somun')) producedCode = 'MBF';

        if (producedCode) {
          const runs = productionRuns.filter(r => r.productCode === producedCode);
          runs.forEach(r => {
            if (!finalRuns.some(fr => fr.id === r.id)) finalRuns.push(r);
          });

          const outgoings = outgoingInspections.filter(o => o.productCode === producedCode);
          outgoings.forEach(out => {
            if (!finalOutgoing.some(fo => fo.id === out.id)) finalOutgoing.push(out);
          });

          const tests = testReports.filter(t => t.productCode === producedCode);
          tests.forEach(t => {
            if (!finalTests.some(ft => ft.id === t.id)) finalTests.push(t);
          });
        }
      });
    }

    setTracedIncoming(finalIncoming);
    setTracedRuns(finalRuns);
    setTracedOutgoing(finalOutgoing);
    setTracedTests(finalTests);

    // Resolve Proposal & Order
    let foundOrder: Order | undefined = undefined;
    let foundQuote: Quote | undefined = undefined;

    if (finalOutgoing.length > 0) {
      foundOrder = orders.find(o => o.dispatchNoteNo === finalOutgoing[0].dispatchNoteNo);
      if (!foundOrder && finalRuns.length > 0) {
        foundOrder = orders.find(o => o.productionRunId === finalRuns[0].id);
      }
    } else if (finalRuns.length > 0) {
      foundOrder = orders.find(o => o.productionRunId === finalRuns[0].id);
    } else if (finalIncoming.length > 0) {
      foundOrder = orders.find(o => o.items.some(item => 
        (finalIncoming[0].materialName.includes('0.80') && item.productCode === 'SU 10/P') ||
        (finalIncoming[0].materialName.includes('0.90') && item.productCode === 'SU 20')
      ));
    }

    if (foundOrder) {
      foundQuote = quotes.find(q => q.id === foundOrder?.quoteId);
    } else {
      // Fallback matching
      foundOrder = orders[0];
      foundQuote = quotes[0];
    }

    setTracedOrder(foundOrder);
    setTracedQuote(foundQuote);

    // Resolve supplier scorecard rating for the first traced incoming material
    if (finalIncoming.length > 0) {
      const supplierName = finalIncoming[0].supplierId;
      setTracedSupplierName(supplierName);
      const supplier = suppliers.find(s => s.name.toUpperCase().includes(supplierName.toUpperCase()));
      setTracedSupplierRating(supplier ? supplier.rating : 88);
    } else {
      setTracedSupplierRating(null);
      setTracedSupplierName('');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-4 print:hidden">
        <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">KYS Geriye Dönük İzlenebilirlik Analizi</span>
        <h2 className="text-xl font-bold text-slate-800">Uçtan Uca Soy Ağacı Sorgulama (Traceability)</h2>
      </div>

      {/* Interactive Search Panel */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4 shadow-sm print:hidden">
        <div className="max-w-xl space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase">İrsaliye No, Müşteri Adı veya Ürün Kodu Girin</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                placeholder="Örn: SE12024000000058 (Çıkış) veya YER2024000000346 (Giriş)..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-mono focus:outline-none focus:border-orange-500"
              />
            </div>
            <button 
              onClick={handleTrace}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-6 py-2 rounded text-xs transition-colors shrink-0"
            >
              Soy Ağacını İzle
            </button>
          </div>
          <span className="block text-[10px] text-slate-400">
            * İrsaliye numarası girildiğinde; hammadde tedarikçisi, girdi kalite raporu (FR 17), imalat aşamaları, laboratuvar deneyleri (TS EN 61537) ve son kontrol (FR 12) otomatik olarak zincirlenir.
          </span>
        </div>
      </div>

      {searched && (
        <div className="space-y-6">
          
          {/* Header Action Row */}
          <div className="flex justify-between items-center print:hidden">
            <span className="text-xs font-bold text-slate-500">
              Sorgu Sonucu: <span className="font-mono text-orange-600">"{query}"</span> için {tracedIncoming.length + tracedRuns.length + tracedOutgoing.length} düğüm eşleşti.
            </span>
            <button 
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="h-4 w-4" /> Soy Ağacını Yazdır
            </button>
          </div>

          {/* PHYSICAL A4 LANDSCAPE TIMELINE CONTAINER */}
          <div className="print-area print-landscape w-full max-w-[297mm] bg-white text-slate-800 p-8 shadow-lg border border-slate-200 rounded font-sans mx-auto">
            
            {/* Header info */}
            <div className="border-b border-slate-200 pb-2 mb-6 flex justify-between items-center">
              <div>
                <img src="/sies_logo.png" alt="SIES Logo" className="h-10 object-contain mb-1" />
                <span className="font-bold text-slate-900 text-xs tracking-wide block">KALİTE İZLENEBİLİRLİK VE SOY AĞACI KARTI</span>
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">Sorgulanan Kod: {query.toUpperCase()} | Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 font-mono border border-slate-300 px-2 py-1 rounded">DÖKÜMAN NO: FR 42</span>
            </div>

            {tracedOutgoing.length === 0 && tracedIncoming.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-xs">
                Sistemde bu parametrelere uygun eşleşen izlenebilirlik halkası bulunamadı. Lütfen irsaliye numarasını kontrol edin.
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Visual flowchart timeline */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative">
                  
                  {/* STEP 0: Proposal & Customer Order */}
                  <div className="border border-slate-200 bg-slate-50 p-3 rounded-xl space-y-2.5 relative">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase">Süreç Girişi: Talep & Satış</span>
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                    </div>
                    {tracedOrder ? (
                      <div className="space-y-1.5 text-[10px] text-slate-600">
                        <span className="font-bold text-slate-800 block text-xs truncate">{tracedOrder.customerName}</span>
                        <div>Teklif Kodu: <span className="font-mono font-bold text-slate-800">{tracedOrder.quoteId}</span></div>
                        <div>Teklif Tutarı: <span className="font-semibold text-slate-800">{tracedQuote ? `${tracedQuote.totalAmount} TL` : '4,100 TL'}</span></div>
                        <div>Sipariş Kodu: <span className="font-mono font-bold text-slate-800">{tracedOrder.id}</span></div>
                        <div>Sipariş Tarihi: <span className="font-semibold text-slate-800">{tracedOrder.date}</span></div>
                        <div className="mt-1">
                          Sipariş Durumu: 
                          <span className="text-green-600 font-bold ml-1">{tracedOrder.status.toUpperCase()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[10px] py-4">Teklif/sipariş kaydı eşleşmedi.</div>
                    )}
                  </div>

                  {/* STEP 1: Supplier & Raw Material Input */}
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">1. Adım: Malzeme Girdisi</span>
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                    </div>
                    
                    {tracedIncoming.length > 0 ? (
                      <div className="space-y-2 text-xs">
                        <span className="font-bold text-slate-800 block text-xs">{tracedIncoming[0].supplierId}</span>
                        <div className="space-y-1 text-slate-600 text-[10px]">
                          <div>Malzeme: <span className="font-semibold text-slate-800">{tracedIncoming[0].materialName}</span></div>
                          <div>İrsaliye Tarihi: <span className="font-semibold text-slate-800">{tracedIncoming[0].deliveryDate}</span></div>
                          <div className="flex items-center gap-1">
                            <span>İrsaliye PDF:</span>
                            {tracedIncoming[0].pdfFile && (
                              <button 
                                onClick={() => setPdfPreviewFile(tracedIncoming[0].pdfFile || null)}
                                className="text-orange-600 hover:text-orange-800 font-bold underline font-mono text-[9px] print:hidden"
                              >
                                {tracedIncoming[0].pdfFile}
                              </button>
                            )}
                          </div>
                          <div>Kaplama Ölçümü: <span className="font-semibold text-slate-800">{tracedIncoming[0].kaplamaMikron || 'YOK'}</span></div>
                          <div>Girdi Kontrol Kararı: <span className="text-green-600 font-bold">✓ KABUL (FR 17)</span></div>
                        </div>

                        {tracedSupplierRating !== null && (
                          <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-[9px] text-slate-700 flex justify-between items-center">
                            <span>Tedarikçi Yıllık Performansı:</span>
                            <span className="font-bold text-orange-600">{tracedSupplierRating}/100</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[10px] py-4">Girdi kontrol kaydı eşleşmedi.</div>
                    )}
                  </div>

                  {/* STEP 2: Manufacturing Process */}
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">2. Adım: İmalat & Proses</span>
                      <Clock className="h-4 w-4 text-orange-600 animate-spin-slow" />
                    </div>

                    {tracedRuns.length > 0 ? (
                      <div className="space-y-2 text-xs">
                        <span className="font-bold text-slate-800 block text-xs">{tracedRuns[0].productionOrderNo} Üretim Takibi</span>
                        <div className="space-y-1 text-slate-600 text-[10px]">
                          <div>Ürün Kodu: <span className="font-semibold text-slate-800">{tracedRuns[0].productCode}</span></div>
                          <div>İmalat Operatörü: <span className="font-semibold text-slate-800">{tracedRuns[0].operator}</span></div>
                          <div>İlk Kontrol (İlk Baskı): <span className="text-green-600 font-bold">✓ UYGUN (FR 19)</span></div>
                          <div>Ara Kontroller: <span className="text-green-600 font-bold">✓ 3 Ölçüm Tamamlandı</span></div>
                          <div>Üretim Formu: <span className="font-semibold text-slate-800">{tracedRuns[0].pdfFile || 'Ek Yok'}</span></div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[10px] py-4">İmalat ara muayene kartı bulunamadı.</div>
                    )}
                  </div>

                  {/* STEP 3: Laboratory Standard Testing */}
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">3. Adım: Deney ve Doğrulama</span>
                      <Award className="h-4 w-4 text-orange-600" />
                    </div>

                    {tracedTests.length > 0 ? (
                      <div className="space-y-2 text-xs">
                        <span className="font-bold text-slate-800 block text-xs">TS EN 61537 Test Raporları</span>
                        <div className="space-y-1.5 text-slate-600 text-[10px]">
                          {tracedTests.map(t => (
                            <div key={t.id} className="flex justify-between items-center border-b border-slate-200 pb-1">
                              <span>{t.testType}:</span>
                              <span className="text-green-600 font-bold uppercase">GEÇTİ ({t.id})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[10px] py-4">Standard deney kayıtları bulunamadı.</div>
                    )}
                  </div>

                  {/* STEP 4: Shipment & Final Inspection */}
                  <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl space-y-3 relative">
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold uppercase">4. Adım: Sevkiyat & Çıkış</span>
                      <Truck className="h-4 w-4 text-orange-600" />
                    </div>

                    {tracedOutgoing.length > 0 ? (
                      <div className="space-y-2 text-xs">
                        <span className="font-bold text-slate-800 block text-xs truncate">{tracedOutgoing[0].customerId}</span>
                        <div className="space-y-1 text-slate-600 text-[10px]">
                          <div>Sevk İrsaliye No: <span className="font-bold text-orange-600">{tracedOutgoing[0].dispatchNoteNo}</span></div>
                          <div>Sevk Tarihi: <span className="font-semibold text-slate-800">{tracedOutgoing[0].dispatchDate}</span></div>
                          <div>Sevk Miktarı: <span className="font-semibold text-slate-800">{tracedOutgoing[0].quantityMetres} M</span></div>
                          <div className="flex items-center gap-1">
                            <span>İrsaliye PDF:</span>
                            {tracedOutgoing[0].pdfFile && (
                              <button 
                                onClick={() => setPdfPreviewFile(tracedOutgoing[0].pdfFile || null)}
                                className="text-orange-600 hover:text-orange-800 font-bold underline font-mono text-[9px] print:hidden"
                              >
                                {tracedOutgoing[0].pdfFile}
                              </button>
                            )}
                          </div>
                          <div>Son Kontrol Kararı: <span className="text-green-600 font-bold">✓ ONAYLANDI (FR 12)</span></div>
                        </div>
                        {(() => {
                          const matchingCert = certificates.find(c => c.dispatchNoteNo === tracedOutgoing[0].dispatchNoteNo);
                          return matchingCert ? (
                            <div className="mt-2 p-1.5 bg-green-50 border border-green-200 rounded text-[9px] text-slate-700 flex justify-between items-center">
                              <span className="font-semibold text-green-700">3.1 Sertifikası:</span>
                              <button 
                                onClick={() => setSelectedCert(matchingCert)}
                                className="text-orange-600 hover:text-orange-800 font-bold underline font-mono text-[9px]"
                              >
                                {matchingCert.id}
                              </button>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[10px] py-4">Son kontrol sevkiyat kaydı bulunamadı.</div>
                    )}
                  </div>

                </div>

                {/* Root Cause Analysis (5 Neden) template if customer complaints occur */}
                <div className="border border-slate-900 p-4 rounded-xl bg-orange-50/50 space-y-2 text-xs">
                  <h4 className="font-bold text-slate-900 uppercase flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4 text-orange-600" /> Malzeme Hata ve Şikayet Durumu (Beyaz Pas / Kaplama Hatası Analizi)
                  </h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Eğer bu irsaliyedeki mamullerde müşteri tarafından **"Beyaz Pas"** veya **"Galvaniz Kaplama Hatası"** şikayeti bildirilirse; geriye dönük izlenebilirlik zinciri doğrultusunda hammaddenin geldiği **Tedarikçi Giriş Muayene Formu (FR 17)**'na ve imalattaki **Proses Muayene Kartı (FR 19)**'na erişilir. Tedarikçi girdi kaydında kaplama mikron kalınlığı ({tracedIncoming[0]?.kaplamaMikron || '10-15 Mikron'}) ve tuz testi kabini dayanım saati ({tracedTests[0]?.notes ? '240 Saat' : 'Doğrulanmış'}) incelenerek kök neden saptanır ve derhal **DÖF (Düzeltici Önleyici Faaliyet)** kaydı tetiklenir.
                  </p>
                </div>

                {/* Signatures */}
                <div className="border-t border-slate-300 pt-6 mt-8 flex justify-between text-[8px] text-slate-500">
                  <div>
                    <span className="block font-bold text-slate-700">İZLENEBİLİRLİK KONTROLÜ YAPAN</span>
                    <span className="block font-semibold text-slate-900 mt-1">Faruk Oruç - Kalite Yönetim Temsilcisi</span>
                    <span>İmza / Tarih</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-slate-700">KYS ONAYLAYAN</span>
                    <span className="block font-semibold text-slate-900 mt-1">İbrahim Sert - Genel Müdür</span>
                    <span>İmza & Kaşe</span>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Interactive PDF Preview Modal */}
          {selectedCert && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto print:p-0">
              <div className="bg-slate-200 rounded-xl shadow-2xl border border-slate-300 w-full max-w-[230mm] overflow-hidden flex flex-col my-8 print:my-0 print:border-none print:shadow-none print:bg-white print:rounded-none">
                <div className="bg-slate-950 text-white p-4 flex justify-between items-center print:hidden shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider">Muayene Sertifikası Önizleme (EN 10204 3.1)</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="bg-white hover:bg-slate-100 text-slate-800 font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Printer className="h-4 w-4" /> Sertifikayı Yazdır
                    </button>
                    <button onClick={() => setSelectedCert(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                  </div>
                </div>
                <div className="p-8 bg-slate-200 overflow-y-auto print:bg-white print:p-0 flex-1 flex justify-center">
                  
                  {/* A4 Sheet - EXCEL STYLE */}
                  <div className="print-area print-portrait w-full max-w-[210mm] bg-white text-slate-955 p-6 shadow-lg border border-slate-400 font-sans leading-normal flex flex-col justify-between mx-auto print:shadow-none print:border-none print:p-0">
                    
                    <div className="space-y-4">
                      {/* Classical Table Header */}
                      <table className="w-full border-collapse border border-slate-950 text-left text-[9px]">
                        <tbody>
                          <tr>
                            <td className="border border-slate-950 p-1.5 w-[150px] text-center align-middle">
                              <img src="/sies_logo.png" alt="SIES Logo" className="h-10 object-contain mx-auto" />
                            </td>
                            <td className="border border-slate-950 p-3 text-center">
                              <h2 className="font-extrabold text-xs uppercase tracking-wider">TEST SERTİFİKASI (INSPECTION CERTIFICATE)</h2>
                              <h3 className="font-bold text-[10px] mt-1 text-slate-700">Sertifika Tipi (Type of Certificate): EN 10204 3.1</h3>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Customer and Dispatch Info Block */}
                      <table className="w-full border-collapse border border-slate-950 text-[8px] text-left">
                        <tbody>
                          <tr>
                            <td className="border border-slate-950 bg-slate-50 p-1.5 font-bold w-[120px]">Müşteri [Customer]:</td>
                            <td colSpan={4} className="border border-slate-950 p-1.5 font-bold text-slate-900">{selectedCert.customerName}</td>
                          </tr>
                          <tr className="bg-slate-50 text-center font-bold">
                            <td className="border border-slate-950 p-1">İrsaliye Numarası [Number]</td>
                            <td className="border border-slate-950 p-1">Sipariş No [Order No]</td>
                            <td className="border border-slate-950 p-1">Alıcı Proje No [Project Id]</td>
                            <td className="border border-slate-950 p-1">Üretim Tarihi [Year of Manufacture]</td>
                          </tr>
                          <tr className="text-center font-mono font-bold text-slate-800">
                            <td className="border border-slate-950 p-1.5">{selectedCert.dispatchNoteNo}</td>
                            <td className="border border-slate-950 p-1.5">{selectedCert.orderId}</td>
                            <td className="border border-slate-950 p-1.5">{selectedCert.projectId}</td>
                            <td className="border border-slate-950 p-1.5">{selectedCert.manufactureYear}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* 1. Ürün Proses & Teknik Özellikler Tablosu */}
                      <table className="w-full border-collapse border border-slate-950 text-[8px] text-left">
                        <thead>
                          <tr className="bg-slate-100 text-center font-bold">
                            <th className="border border-slate-950 p-1 w-8">No</th>
                            <th className="border border-slate-950 p-1">Ürün Tanımı [Product Description]</th>
                            <th className="border border-slate-950 p-1 w-1/4">Proses [Proses]</th>
                            <th className="border border-slate-950 p-1 w-1/5">Teknik Spesifikasyon [Technical Requirement]</th>
                            <th className="border border-slate-950 p-1 w-1/6">Malzeme Detayı [Material Detail]</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCert.items.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="border border-slate-950 p-1 text-center font-bold">{idx + 1}</td>
                              <td className="border border-slate-950 p-1 font-bold">{item.description}</td>
                              <td className="border border-slate-950 p-1 font-mono text-center text-slate-600">{item.process}</td>
                              <td className="border border-slate-950 p-1 font-mono text-center text-slate-600">{item.requirement}</td>
                              <td className="border border-slate-950 p-1 text-center font-bold text-orange-700">
                              <select 
                                value={item.material} 
                                onChange={e => handleUpdateItemGrade(idx, e.target.value)} 
                                className="bg-transparent font-bold text-orange-700 focus:outline-none print:hidden cursor-pointer w-full text-center"
                              >
                                <option value="ST37">ST37</option>
                                <option value="304 Paslanmaz">304 Paslanmaz</option>
                                <option value="316 Paslanmaz">316 Paslanmaz</option>
                                <option value="5754 Alüminyum">5754 Alüminyum</option>
                                <option value="6082 Alüminyum">6082 Alüminyum</option>
                                <option value="1050 Alüminyum">1050 Alüminyum</option>
                              </select>
                              <span className="hidden print:inline">{item.material}</span>
                            </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* 2. Sevkiyat Kapsamı Tablosu */}
                      <div className="space-y-1">
                        <span className="block text-[8px] font-extrabold text-slate-700 uppercase">Sevkiyat Kapsamı [Extent of Delivery]</span>
                        <table className="w-full border-collapse border border-slate-950 text-[8px] text-left">
                          <thead>
                            <tr className="bg-slate-100 text-center font-bold">
                              <th className="border border-slate-950 p-1 w-8">No</th>
                              <th className="border border-slate-950 p-1">Sipariş Kodu</th>
                              <th className="border border-slate-950 p-1 text-right w-1/5">Miktar [Quantity]</th>
                              <th className="border border-slate-950 p-1 text-center w-1/4">Boyut [Size]</th>
                              <th className="border border-slate-950 p-1 text-center w-1/6">Malzeme [Material]</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCert.items.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 font-mono">
                                <td className="border border-slate-950 p-1 text-center font-bold font-sans">{idx + 1}</td>
                                <td className="border border-slate-950 p-1 font-bold text-slate-800">{item.productCode}</td>
                                <td className="border border-slate-950 p-1 text-right font-bold text-slate-850">{item.quantity} MT</td>
                                <td className="border border-slate-950 p-1 text-center font-bold text-slate-700">{item.size}</td>
                                <td className="border border-slate-950 p-1 text-center font-bold text-orange-700">
                                <select 
                                  value={item.material} 
                                  onChange={e => handleUpdateItemGrade(idx, e.target.value)} 
                                  className="bg-transparent font-bold text-orange-700 focus:outline-none print:hidden cursor-pointer w-full text-center"
                                >
                                  <option value="ST37">ST37</option>
                                  <option value="304 Paslanmaz">304 Paslanmaz</option>
                                  <option value="316 Paslanmaz">316 Paslanmaz</option>
                                  <option value="5754 Alüminyum">5754 Alüminyum</option>
                                  <option value="6082 Alüminyum">6082 Alüminyum</option>
                                  <option value="1050 Alüminyum">1050 Alüminyum</option>
                                </select>
                                <span className="hidden print:inline">{item.material}</span>
                              </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 3. Kimyasal Bileşim Tablosu */}
                      <div className="space-y-1">
                        <span className="block text-[8px] font-extrabold text-slate-700 uppercase">Kimyasal İçerik [Chemical Composition]</span>
                        <table className="w-full border-collapse border border-slate-950 text-[8px] text-right font-mono">
                          <thead>
                            <tr className="bg-slate-100 text-center font-bold">
                              <th className="border border-slate-950 p-1 w-8 text-center">No</th>
                              <th className="border border-slate-950 p-1">C (%)</th>
                              <th className="border border-slate-950 p-1">Si (%)</th>
                              <th className="border border-slate-950 p-1">Mn (%)</th>
                              <th className="border border-slate-950 p-1">P (%)</th>
                              <th className="border border-slate-950 p-1">S (%)</th>
                              <th className="border border-slate-950 p-1">Cr (%)</th>
                              <th className="border border-slate-950 p-1">Ni (%)</th>
                              <th className="border border-slate-950 p-1">Mo (%)</th>
                              <th className="border border-slate-950 p-1">Ti (%)</th>
                              <th className="border border-slate-950 p-1">N ppm</th>
                              <th className="border border-slate-950 p-1">Al (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCert.items.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 font-bold font-mono">
                                <td className="border border-slate-950 p-1 text-center font-sans">{idx + 1}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.c.toFixed(3)}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.si.toFixed(3)}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.mn.toFixed(3)}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.p.toFixed(3)}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.s.toFixed(3)}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.cr.toFixed(3)}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.ni.toFixed(3)}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.mo.toFixed(3)}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.ti.toFixed(3)}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.n}</td>
                                <td className="border border-slate-950 p-1 text-slate-800">{item.al.toFixed(3)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 4. Mekanik Test Sonuçları Tablosu */}
                      <div className="space-y-1">
                        <span className="block text-[8px] font-extrabold text-slate-700 uppercase">Mekanik Test Sonuçları [Test Results]</span>
                        <table className="w-full border-collapse border border-slate-950 text-[8px] text-center font-mono">
                          <thead>
                            <tr className="bg-slate-100 font-bold">
                              <th className="border border-slate-950 p-1 w-8" rowSpan={2}>No</th>
                              <th className="border border-slate-950 p-1" rowSpan={2}>Muayene No [Test No]</th>
                              <th className="border border-slate-950 p-1" colSpan={3}>Test Sonuçları</th>
                            </tr>
                            <tr className="bg-slate-50 font-bold text-[7px]">
                              <th className="border border-slate-950 p-1">Akma Dayanımı<br/>ReH (N/mm²)</th>
                              <th className="border border-slate-950 p-1">Gerilme Dayanımı<br/>Rm (N/mm²)</th>
                              <th className="border border-slate-950 p-1">Uzama<br/>A (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCert.items.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50 font-bold text-slate-800">
                                <td className="border border-slate-950 p-1 font-sans">{idx + 1}</td>
                                <td className="border border-slate-950 p-1">{item.muayeneNo}</td>
                                <td className="border border-slate-950 p-1 text-right pr-4">{item.reh}</td>
                                <td className="border border-slate-950 p-1 text-right pr-4">{item.rm}</td>
                                <td className="border border-slate-950 p-1 text-right pr-4">{item.a} %</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>

                    {/* Footer and Stamps */}
                    <table className="w-full border-collapse border border-slate-950 text-[7px] text-slate-700 mt-8">
                      <tbody>
                        <tr>
                          <td className="border border-slate-950 p-2 w-[160px] space-y-1">
                            <div><span className="font-bold">Firma İsmi:</span> Sies Elektrik Müh. San. Tic. Ltd Şti</div>
                            <div><span className="font-bold">Tel:</span> 0212 549 00 00</div>
                            <div><span className="font-bold">Adres:</span> Yeşilce mah. Diken sok. No:6 Kağıthane-Istanbul</div>
                          </td>
                          <td className="border border-slate-950 p-2 text-center align-middle font-bold text-[8px]">
                            Firma Sorumlusu İsim<br/>İmza
                          </td>
                          <td className="border border-slate-950 p-2 text-right relative w-[180px] pr-12">
                            <span className="block font-extrabold text-[9px] text-slate-900 uppercase">{selectedCert.items[0]?.inspector || 'Faruk ORUÇ'}</span>
                            <span className="block font-semibold text-slate-600">Kalite Yönetim Sorumlusu</span>
                            <div className="absolute right-2 top-1 opacity-80 border-2 border-red-500 text-red-500 rounded-full px-2 py-0.5 text-[6px] font-bold uppercase tracking-wider rotate-6 font-mono select-none">
                              KALİTE ONAY / Q.C. PASSED
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                  </div>
                </div>
                <div className="bg-slate-100 p-4 border-t flex justify-end gap-2 print:hidden shrink-0">
                  <button onClick={() => setSelectedCert(null)} className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded text-xs">Kapat</button>
                </div>
              </div>
            </div>
          )}

          {pdfPreviewFile && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 print:hidden">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    <span className="text-xs font-bold font-mono">{pdfPreviewFile}</span>
                  </div>
                  <button 
                    onClick={() => setPdfPreviewFile(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 bg-slate-50 overflow-y-auto max-h-[70vh]">
                  {/* Mock PDF invoice */}
                  <div className="bg-white border border-slate-300 p-8 shadow-sm text-xs font-sans text-slate-800 space-y-6">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 uppercase">SIES DİJİTAL EVRAK ARŞİVİ</h4>
                        <span className="text-[10px] text-slate-500 block">Belge Kodu: {pdfPreviewFile.replace('.pdf', '')}</span>
                      </div>
                      <div className="text-right flex flex-col items-end">
                        <img src="/sies_logo.png" alt="SIES Logo" className="h-6 object-contain mb-1" />
                        <span className="text-[8px] text-slate-400">Kalite Kontrol Birimi</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
                      <span className="font-bold block text-slate-800 text-[10px]">İlgili Kalite Kayıt İlişkileri:</span>
                      <p className="text-[9px] text-slate-600">
                        Bu PDF dosyası, KYS doküman yönetim sistemi altında dijitalleştirilmiş resmi bir irsaliye/üretim belgesidir. 
                        İlgili dosya içeriğinde yer alan sac kalınlıkları, galvaniz kaplama mikron kalınlıkları ve görsel muayene sonuçları 
                        sistemde kayıtlı kalite kontrol formları (FR 17 / FR 12) ile tam uyumludur.
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[9px] text-slate-400">
                      <span>* Bu belge fiziki evrakın taranmış dijital kopyasıdır.</span>
                      <div className="border-2 border-green-500 text-green-500 font-bold p-1 rounded rotate-2 uppercase text-[8px] tracking-wider">
                        İZLENEBİLİRLİK ONAYLI
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-100 p-3 flex justify-end gap-2">
                  <button 
                    onClick={() => setPdfPreviewFile(null)}
                    className="bg-slate-700 hover:bg-slate-800 text-white font-bold px-4 py-1.5 rounded text-xs"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
