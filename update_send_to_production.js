const fs = require('fs');

let content = fs.readFileSync('src/components/SalesModule.tsx', 'utf8');

const oldFunc = `  const handleSendSelectedToProduction = (orderInput?: Order) => {
    const targetOrder = orderInput || activeOrder;
    if (!targetOrder) return;
    
    const selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
      return item && item.productCode === prodCode;
    });

    if (selectedKeys.length === 0) {
      alert("Lütfen üretime gönderilecek kalemleri seçin.");
      return;
    }
    
    if (orderInput) setActiveOrderId(orderInput.id);

    selectedKeys.forEach(key => {
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
      if (!item) return;

      const remaining = item.quantity - (item.shippedQuantity || 0);
      const qty = actionQuantities[key] || remaining;
      const orderNo = \`EMR-2026-\${Math.floor(100 + Math.random() * 900)}\`;
      const runId = \`PRD-2026-\${Math.floor(100 + Math.random() * 900)}\`;

      // Create ProductionRun leaving operator blank and saving selected processes list
      addProductionRun({
        id: runId,
        productionOrderNo: orderNo,
        date: new Date().toISOString().split('T')[0],
        productCode: prodCode,
        quantity: qty,
        operator: '', // Leave blank as requested
        pdfFile: \`Uretim_Formu_\${orderNo}.pdf\`,
        firstCheckStatus: 'Bekliyor',
        inProcessChecks: [],
        status: 'İlk Kontrol Bekliyor',
        notes: 'Seri üretim emri otomatik oluşturuldu.',
        orderId: targetOrder.id,
        processes: ['Kesme', 'Delme', 'Bükme']
      });
    });

    // Update item statuses to 'Üretimde'
    const updatedItems = targetOrder.items.map((item, idx) => {
      const key = \`\${item.productCode}-\${idx}\`;
      if (selectedItems[key]) {
        return { ...item, status: 'Üretimde' as const };
      }
      return item;
    });

    updateOrder(targetOrder.id, {
      items: updatedItems,
      status: 'ÜRETİMDE'
    });

    alert("[ERP PROSES] Seçilen kalemler için üretim emirleri başarıyla oluşturuldu ve üretime gönderildi.");
    setSelectedItems({});
  };`;

const newFunc = `  const handleSendSelectedToProduction = (orderInput?: Order, forceAll: boolean = false) => {
    const targetOrder = orderInput || activeOrder;
    if (!targetOrder) return;
    
    let selectedKeys = Object.keys(selectedItems).filter(key => {
      if (!selectedItems[key]) return false;
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
      return item && item.productCode === prodCode;
    });

    // IF NO ITEMS ARE CHECKED OR FORCE ALL IS TRUE -> AUTOMATICALLY SELECT ALL ITEMS IN THE ORDER!
    if (forceAll || selectedKeys.length === 0) {
      selectedKeys = targetOrder.items.map((item, idx) => \`\${item.productCode}-\${idx}\`);
    }

    if (orderInput) setActiveOrderId(orderInput.id);

    selectedKeys.forEach(key => {
      const lastDashIndex = key.lastIndexOf('-');
      const prodCode = key.substring(0, lastDashIndex);
      const itemIdx = parseInt(key.substring(lastDashIndex + 1));
      const item = targetOrder.items[itemIdx];
      if (!item) return;

      const remaining = item.quantity - (item.shippedQuantity || 0);
      const qty = actionQuantities[key] || remaining;
      const orderNo = \`EMR-2026-\${Math.floor(100 + Math.random() * 900)}\`;
      const runId = \`PRD-2026-\${Math.floor(100 + Math.random() * 900)}\`;

      addProductionRun({
        id: runId,
        productionOrderNo: orderNo,
        date: new Date().toISOString().split('T')[0],
        productCode: prodCode,
        quantity: qty,
        operator: '',
        pdfFile: \`Uretim_Formu_\${orderNo}.pdf\`,
        firstCheckStatus: 'Bekliyor',
        inProcessChecks: [],
        status: 'İlk Kontrol Bekliyor',
        notes: 'Seri üretim emri otomatik oluşturuldu.',
        orderId: targetOrder.id,
        processes: ['Kesme', 'Delme', 'Bükme']
      });
    });

    // Update item statuses to 'Üretimde'
    const updatedItems = targetOrder.items.map((item, idx) => {
      const key = \`\${item.productCode}-\${idx}\`;
      if (selectedKeys.includes(key)) {
        return { ...item, status: 'Üretimde' as const };
      }
      return item;
    });

    updateOrder(targetOrder.id, {
      items: updatedItems,
      status: 'ÜRETİMDE'
    });

    // OPEN FR-009 FORM WITH ALL ITEMS SORTED BY MT-FIRST + ASCENDING STOK KODU!
    const sorted = sortProductionItems(updatedItems);
    const runs = sorted.map((item, idx) => ({
      id: \`PRD-\${targetOrder.id}-\${idx + 1}\`,
      productionOrderNo: targetOrder.id,
      productCode: item.productCode,
      quantity: item.quantity,
      date: targetOrder.createdAt || new Date().toISOString().split('T')[0],
      operator: 'Depo / Üretim Sorumlusu',
      unit: item.unit || 'AD',
      processes: ['Kesme', 'Delme', 'Bükme']
    }));

    handleOpenFR009(runs);
    setSelectedItems({});
  };`;

// Also update button in bottom action bar to say "TÜMÜNÜ ÜRETİME GÖNDER"
content = content.replace(oldFunc, newFunc);
content = content.replace(
  `onClick={() => handleSendSelectedToProduction(order)}\n                          className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all"\n                        >\n                          Üretime Gönder`,
  `onClick={() => handleSendSelectedToProduction(order, true)}\n                          className="bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 px-2 rounded-lg text-[9px] uppercase shadow-sm transition-all flex items-center justify-center gap-1"\n                        >\n                          <Play className="h-3 w-3 text-orange-400" /> Tümünü Üretime Gönder`
);

fs.writeFileSync('src/components/SalesModule.tsx', content);
console.log('Successfully updated handleSendSelectedToProduction to auto-select all items and open FR-009!');
