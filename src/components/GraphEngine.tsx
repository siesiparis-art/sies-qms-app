'use client';

import React, { useState } from 'react';
import { useQms, QmsDocument } from '@/context/QmsContext';
import { Network, ArrowRight, Eye, RefreshCw, Layers } from 'lucide-react';

interface GraphEngineProps {
  onOpenDoc: (docId: string) => void;
}

export default function GraphEngine({ onOpenDoc }: GraphEngineProps) {
  const { documents, audits, capas, risks, measuringDevices, personnel } = useQms();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('QM-001');

  // Selected document
  const activeDoc = documents.find(d => d.id === selectedNodeId) || documents[0];

  // Derive relations dynamically
  const getRelations = (doc: QmsDocument) => {
    if (!doc) return [];

    const relations: { id: string; label: string; type: 'doc' | 'form' | 'record' | 'audit' | 'capa' | 'risk' | 'device' | 'personnel'; rawId: string }[] = [];

    // 1. Linked documents from content or relation field
    doc.relatedDocs?.forEach(id => {
      const target = documents.find(d => d.id === id);
      if (target) {
        relations.push({
          id,
          label: target.title,
          type: target.type === 'FR' ? 'form' : target.type === 'KR' ? 'record' : 'doc',
          rawId: id
        });
      }
    });

    // Parse the markdown content for references like doc://PR-xxx
    const regex = /doc:\/\/([A-Z0-9-]+)/g;
    let match;
    while ((match = regex.exec(doc.content)) !== null) {
      const matchId = match[1];
      if (!relations.some(r => r.id === matchId)) {
        const target = documents.find(d => d.id === matchId);
        if (target) {
          relations.push({
            id: matchId,
            label: target.title,
            type: target.type === 'FR' ? 'form' : target.type === 'KR' ? 'record' : 'doc',
            rawId: matchId
          });
        }
      }
    }

    // 2. Related Audits
    audits.forEach(a => {
      const referencesDoc = a.checklist.some(c => c.capaId?.includes(doc.id) || a.findingsReport?.includes(doc.id)) || a.id === doc.id;
      // Or if this document is IA-001 itself
      if ((referencesDoc || doc.id === 'PR-005') && !relations.some(r => r.id === a.id)) {
        relations.push({ id: a.id, label: a.title, type: 'audit', rawId: a.id });
      }
    });

    // 3. Related CAPA (DÖF)
    capas.forEach(c => {
      const isLinked = c.sourceId === doc.id || c.description.includes(doc.id) || c.id === doc.id;
      if (isLinked && !relations.some(r => r.id === c.id)) {
        relations.push({ id: c.id, label: c.title, type: 'capa', rawId: c.id });
      }
    });

    // 4. Related Risks
    risks.forEach(r => {
      const isLinked = r.description.includes(doc.title) || r.owner.includes(doc.preparedBy);
      if (isLinked && !relations.some(rNode => rNode.id === r.id)) {
        relations.push({ id: r.id, label: r.description, type: 'risk', rawId: r.id });
      }
    });

    // 5. Related Devices (measuring devices linked in PR-003 or TS EN test reports)
    if (doc.id === 'PR-003' || doc.id === 'KR-005' || doc.id === 'PR-012') {
      measuringDevices.slice(0, 3).forEach(d => {
        relations.push({ id: d.id, label: d.name, type: 'device', rawId: d.id });
      });
    }

    // 6. Related Personnel
    personnel.slice(0, 2).forEach(p => {
      if (p.name === doc.preparedBy || p.name === doc.approvedBy) {
        relations.push({ id: p.id, label: `${p.name} (${p.position})`, type: 'personnel', rawId: p.id });
      }
    });

    return relations;
  };

  const relatedNodes = getRelations(activeDoc);

  // SVG Coordinates for circular rendering
  const width = 600;
  const height = 400;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 140;

  // Render SVG nodes
  const nodes = relatedNodes.map((n, i) => {
    const angle = (i * 2 * Math.PI) / relatedNodes.length;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return {
      ...n,
      x,
      y
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      {/* Left Sidebar Info panel */}
      <div className="md:col-span-1 border border-[#1a1a1a] rounded-xl bg-[#0c0c0c] p-4 flex flex-col justify-between max-h-[600px] overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-[#1a1a1a] pb-2">
            <Network className="h-4 w-4 text-[#ff6b00]" /> Bağlantı Analiz Paneli
          </div>
          
          <div>
            <span className="block text-[10px] text-gray-500 uppercase font-semibold">Odaklanan Belge</span>
            <span className="bg-[#ff6b00]/10 text-[#ff6b00] px-1.5 py-0.5 rounded text-[10px] font-mono font-bold mt-1 inline-block">
              {activeDoc.id}
            </span>
            <h3 className="text-sm font-bold text-white mt-1">{activeDoc.title}</h3>
            <p className="text-[11px] text-gray-400 mt-1">İlişkili {relatedNodes.length} aktif düğüm bulundu. Haritadaki düğümlere tıklayarak odak değiştirebilirsiniz.</p>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#151515]">
            <span className="block text-[10px] text-gray-500 uppercase font-semibold">Bağlantı Listesi</span>
            <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
              {relatedNodes.map(r => (
                <button
                  key={r.id}
                  onClick={() => {
                    // If click on linked doc/form/record, focus graph node.
                    if (r.type === 'doc' || r.type === 'form' || r.type === 'record') {
                      setSelectedNodeId(r.rawId);
                    } else {
                      alert(`İlişkili Varlık: [${r.type.toUpperCase()}] ${r.label}`);
                    }
                  }}
                  className="w-full text-left px-2 py-1 rounded text-[10px] bg-[#121212] border border-[#1e1e1e] hover:border-[#ff6b00]/40 text-gray-300 hover:text-white truncate flex items-center justify-between"
                >
                  <span className="truncate">{r.id}: {r.label}</span>
                  <span className="text-[8px] bg-[#222] px-1 rounded text-gray-500 uppercase">{r.type}</span>
                </button>
              ))}
              {relatedNodes.length === 0 && (
                <span className="text-[11px] text-gray-600 italic block">İlişkili veri bulunamadı.</span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#1a1a1a]">
          <button 
            onClick={() => onOpenDoc(activeDoc.id)}
            className="w-full bg-[#ff6b00] hover:bg-[#e05e00] text-black font-bold py-2 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Eye className="h-4 w-4" /> Belgeyi Aç
          </button>
        </div>
      </div>

      {/* Interactive Visual Graph Canvas */}
      <div className="md:col-span-3 border border-[#1a1a1a] rounded-xl bg-[#0c0c0c] p-4 flex flex-col justify-between shadow-lg relative min-h-[500px]">
        <div className="flex justify-between items-center border-b border-[#1a1a1a] pb-3 mb-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#ff6b00]" /> Wikipedia İlişki Grafiği
            </h2>
            <p className="text-[10px] text-gray-500">Düğümler arası hiyerarşik bağların görsel haritası</p>
          </div>
          <button 
            onClick={() => setSelectedNodeId('QM-001')}
            className="text-xs text-gray-500 hover:text-white flex items-center gap-1 p-1 bg-[#121212] border border-[#1e1e1e] rounded"
          >
            <RefreshCw className="h-3 w-3" /> Sıfırla (QM-001)
          </button>
        </div>

        {/* SVG Drawing Canvas */}
        <div className="flex-1 flex items-center justify-center bg-[#070707] rounded-lg border border-[#121212] overflow-hidden min-h-[380px]">
          <svg width="100%" height="380" viewBox="0 0 600 400" className="max-w-full">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Link Connections (Lines drawn first so they sit behind nodes) */}
            {nodes.map((n, i) => (
              <g key={`line-${i}`}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={n.x}
                  y2={n.y}
                  stroke={selectedNodeId === n.id ? '#ff6b00' : '#333'}
                  strokeWidth={selectedNodeId === n.id ? '2' : '1.5'}
                  strokeDasharray={n.type === 'audit' || n.type === 'capa' ? '4 3' : '0'}
                  className="transition-all duration-500"
                />
              </g>
            ))}

            {/* Outer Related Nodes */}
            {nodes.map((n, i) => {
              // Color based on node type
              const nodeColors: Record<string, { bg: string; stroke: string; text: string }> = {
                doc: { bg: '#1c1917', stroke: '#ff6b00', text: '#fff' },
                form: { bg: '#0b132b', stroke: '#3a86c8', text: '#cbd5e1' },
                record: { bg: '#101f10', stroke: '#22c55e', text: '#cbd5e1' },
                audit: { bg: '#2b1029', stroke: '#d946ef', text: '#cbd5e1' },
                capa: { bg: '#2a1a08', stroke: '#f59e0b', text: '#cbd5e1' },
                risk: { bg: '#2d0f0f', stroke: '#ef4444', text: '#cbd5e1' },
                device: { bg: '#111b27', stroke: '#06b6d4', text: '#cbd5e1' },
                personnel: { bg: '#1e1b4b', stroke: '#818cf8', text: '#cbd5e1' }
              };
              
              const conf = nodeColors[n.type] || { bg: '#111', stroke: '#666', text: '#aaa' };

              return (
                <g 
                  key={`node-${i}`} 
                  transform={`translate(${n.x}, ${n.y})`}
                  className="cursor-pointer group"
                  onClick={() => {
                    if (n.type === 'doc' || n.type === 'form' || n.type === 'record') {
                      setSelectedNodeId(n.rawId);
                    } else {
                      alert(`[Süreç İzi] Seçilen varlık tip: ${n.type.toUpperCase()}\nİsim: ${n.label}`);
                    }
                  }}
                >
                  <circle
                    r="24"
                    fill={conf.bg}
                    stroke={conf.stroke}
                    strokeWidth="2"
                    className="transition-all duration-300 group-hover:scale-110 group-hover:stroke-white shadow-lg"
                  />
                  <text
                    textAnchor="middle"
                    y="4"
                    fill={conf.text}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {n.id.substring(0, 6)}
                  </text>
                  {/* Tooltip Label */}
                  <text
                    textAnchor="middle"
                    y="38"
                    fill="#9ca3af"
                    fontSize="8"
                    fontWeight="medium"
                    className="opacity-80 group-hover:opacity-100 group-hover:fill-white transition-opacity"
                  >
                    {n.label.length > 15 ? `${n.label.substring(0, 15)}...` : n.label}
                  </text>
                </g>
              );
            })}

            {/* Center Active Document Node */}
            <g transform={`translate(${cx}, ${cy})`} className="cursor-help">
              <circle
                r="32"
                fill="#1c0e01"
                stroke="#ff6b00"
                strokeWidth="3.5"
                filter="url(#glow)"
                className="pulse-glow-orange"
              />
              <text
                textAnchor="middle"
                y="4"
                fill="#ffffff"
                fontSize="11"
                fontWeight="extrabold"
                fontFamily="monospace"
              >
                {activeDoc.id}
              </text>
              <text
                textAnchor="middle"
                y="48"
                fill="#ff6b00"
                fontSize="9"
                fontWeight="bold"
              >
                ODAK BELGE
              </text>
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 items-center justify-center text-[9px] text-gray-500 border-t border-[#1a1a1a] pt-3 px-2">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#1c1917] border border-[#ff6b00]" /> El Kitabı / Prosedür</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#0b132b] border border-[#3a86c8]" /> Formlar</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#101f10] border border-[#22c55e]" /> Kayıtlar</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#2b1029] border border-[#d946ef]" /> Denetim</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#2a1a08] border border-[#f59e0b]" /> DÖF / CAPA</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#2d0f0f] border border-[#ef4444]" /> Risk</span>
        </div>

      </div>

    </div>
  );
}
