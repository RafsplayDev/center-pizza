'use client';

// =============================================================
// Center Pizza · Gestão de Entrega
// Rota: /admin/entrega
// =============================================================

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createBrowserClient } from '@supabase/ssr';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  PlusIcon,
  TrashIcon,
  EditIcon,
  SaveIcon,
  ChevronDownIcon,
} from '@/components/admin/icons';
import Button from '@/components/ui/Button';
import { MapPin, Truck, Store, CreditCard, X as XIcon } from 'lucide-react';

const DeliveryMap = dynamic(() => import('@/components/admin/DeliveryMap'), { ssr: false });

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Tipos
type DBConfig = { 
  id: string; 
  endereco: string | null; 
  latitude: number | null; 
  longitude: number | null; 
  cidade_uf: string | null; 
  cep: string | null; 
  entrega_ativa: boolean; 
  retirada_ativa: boolean;
  tempo_estimado_padrao: number; 
  pedido_minimo: number; 
  raio_maximo_km: number; 
  modo_entrega: 'raio' | 'bairro' | 'hibrido'; 
  formas_pagamento_entrega: string[];
};

type DBTaxaEntrega = { id: string; distancia_min: number; distancia_max: number; valor: number; tempo_estimado?: number; ativo: boolean; };
type DBBairro = { id: string; nome: string; valor: number; tempo_estimado: number; ativo: boolean; bloqueado: boolean; };

const ZONE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-bold text-[var(--cp-ink)] block">{label}</span>
        {desc && <span className="text-[11px] text-zinc-400 block mt-0.5">{desc}</span>}
      </div>
      <div className="flex-none">{children}</div>
    </div>
  );
}

// Página
export default function EntregaPage() {
  const [activeTab, setActiveTab] = useState<'geral' | 'taxas' | 'pagamento'>('geral');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DBConfig | null>(null);
  const [taxas, setTaxas] = useState<DBTaxaEntrega[]>([]);
  const [bairros, setBairros] = useState<DBBairro[]>([]);
  const [showTaxaModal, setShowTaxaModal] = useState(false);
  const [editTaxa, setEditTaxa] = useState<Partial<DBTaxaEntrega>>({});
  const [showBairroModal, setShowBairroModal] = useState(false);
  const [editBairro, setEditBairro] = useState<Partial<DBBairro>>({});
  const [bairroSearch, setBairroSearch] = useState('');
  const [bairroResults, setBairroResults] = useState<{ name: string; display: string }[]>([]);
  const [searchingBairro, setSearchingBairro] = useState(false);
  const [currentView, setCurrentView] = useState<'raio' | 'bairro'>('raio');
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [raioExpanded, setRaioExpanded] = useState(true);
  const [bairrosExpanded, setBairrosExpanded] = useState(true);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBairroResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: c } = await supabase.from('configuracoes').select('*').eq('id', 'loja').single();
      const { data: t } = await supabase.from('taxas_entrega').select('*').order('distancia_min', { ascending: true });
      const { data: b } = await supabase.from('bairros_entrega').select('*').order('nome', { ascending: true });
      if (c) {
        setConfig({
          ...c,
          formas_pagamento_entrega: c.formas_pagamento_entrega || ['pix', 'cartao', 'dinheiro']
        });
      }
      if (t) setTaxas(t);
      if (b) setBairros(b);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        entrega_ativa: config.entrega_ativa,
        retirada_ativa: config.retirada_ativa,
        pedido_minimo: config.pedido_minimo,
        endereco: config.endereco,
        cidade_uf: config.cidade_uf,
        cep: config.cep,
        latitude: config.latitude,
        longitude: config.longitude,
        modo_entrega: config.modo_entrega || 'raio',
        formas_pagamento_entrega: config.formas_pagamento_entrega,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('configuracoes').update(payload).eq('id', 'loja');
      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (err: any) { alert('Erro: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleSaveTaxa = async () => {
    try {
      const data = { ...editTaxa, ativo: editTaxa.ativo ?? true };
      if (editTaxa.id) await supabase.from('taxas_entrega').update(data).eq('id', editTaxa.id);
      else await supabase.from('taxas_entrega').insert(data);
      setShowTaxaModal(false); fetchData();
    } catch (err) { console.error(err); }
  };
  const handleDeleteTaxa = async (id: string) => { if (!confirm('Excluir esta área?')) return; await supabase.from('taxas_entrega').delete().eq('id', id); fetchData(); };

  const handleSaveBairro = async () => {
    try {
      const data = { ...editBairro, ativo: editBairro.ativo ?? true, bloqueado: editBairro.bloqueado ?? false };
      if (editBairro.id) await supabase.from('bairros_entrega').update(data).eq('id', editBairro.id);
      else await supabase.from('bairros_entrega').insert(data);
      setShowBairroModal(false); fetchData();
    } catch (err) { console.error(err); }
  };
  const handleDeleteBairro = async (id: string) => { if (!confirm('Excluir este bairro?')) return; await supabase.from('bairros_entrega').delete().eq('id', id); fetchData(); };

  const toggleStatusTaxa = async (id: string, current: boolean) => {
    await supabase.from('taxas_entrega').update({ ativo: !current }).eq('id', id);
    fetchData();
  };

  const toggleStatusBairro = async (id: string, current: boolean) => {
    await supabase.from('bairros_entrega').update({ ativo: !current }).eq('id', id);
    fetchData();
  };

  const togglePayment = (id: string) => {
    if (!config) return;
    const current = config.formas_pagamento_entrega || [];
    const updated = current.includes(id) 
      ? current.filter(p => p !== id) 
      : [...current, id];
    setConfig({ ...config, formas_pagamento_entrega: updated });
  };

  // Busca de bairros via Nominatim
  const searchBairros = (query: string) => {
    setBairroSearch(query);
    setEditBairro(p => ({...p, nome: query}));
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 2) { setBairroResults([]); return; }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearchingBairro(true);
      try {
        const cityUF = config?.cidade_uf || '';
        const city = cityUF.split('-')[0].trim();
        
        // Busca estruturada limitando ao país e cidade da loja
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&countrycodes=br&limit=10&addressdetails=1`);
        const data = await res.json();
        
        const results = data
          .filter((i: any) => i.address?.suburb || i.address?.neighbourhood || i.address?.city_district || i.address?.quarter)
          .map((i: any) => {
            const name = i.address.suburb || i.address.neighbourhood || i.address.city_district || i.address.quarter || '';
            const c = i.address.city || i.address.town || '';
            return { name, display: c ? `${name}, ${c}` : name };
          })
          .filter((i: any) => i.name.length > 0)
          .filter((i: any, idx: number, arr: any[]) => arr.findIndex((a: any) => a.name === i.name) === idx);
          
        setBairroResults(results);
      } catch { setBairroResults([]); }
      finally { setSearchingBairro(false); }
    }, 400);
  };

  const selectBairro = (name: string) => {
    setEditBairro(p => ({...p, nome: name}));
    setBairroSearch(name);
    setBairroResults([]);
  };

  const parseCurrency = (s: string): number => {
    const clean = s.replace(/[^\d]/g, '');
    return clean ? parseInt(clean) / 100 : 0;
  };

  if (loading) return <LoadingScreen message="Carregando configurações..." fullScreen />;

  const logicMode = config?.modo_entrega || 'raio';
  const modo = logicMode === 'hibrido' ? currentView : logicMode;
  const ic = "py-2 px-3 rounded-lg border-2 border-[var(--cp-line-strong)] bg-[var(--cp-flour)] text-[13px] font-semibold outline-none focus:border-[var(--cp-red)] transition-colors w-full";

  return (
    <div className="p-8 max-w-[1000px] mx-auto pb-24">
      {/* Ações do topo */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex flex-wrap items-center gap-3">
          {[
            { id: 'geral', label: 'Delivery e retirada', icon: Truck },
            { id: 'taxas', label: 'Taxa de entrega', icon: MapPin },
            { id: 'pagamento', label: 'Formas de pagamento', icon: CreditCard },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border-2 cursor-pointer transition-all font-black text-[11px] uppercase tracking-wider active:translate-y-[3px] active:shadow-none ${
                  isActive 
                  ? 'bg-[var(--cp-red)] text-white' 
                  : 'bg-[var(--cp-dough)] text-[var(--cp-ink)] hover:brightness-95'
                }`}
                style={{
                  borderColor: 'var(--cp-ink)',
                  boxShadow: isActive ? '0 4px 0 0 var(--cp-ink)' : '0 3px 0 0 var(--cp-ink)'
                }}
              >
                <tab.icon size={16} strokeWidth={3} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <button onClick={handleSave} disabled={saving} className="h-11 px-6 bg-[var(--cp-ink)] text-white rounded-2xl flex items-center gap-3 font-black uppercase tracking-wider text-[11px] hover:opacity-90 active:translate-y-0.5 transition-all disabled:opacity-50 shadow-[0_4px_0_0_var(--cp-red)]">
          <SaveIcon size={16} />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Tab: Delivery e Retirada */}
      {activeTab === 'geral' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-[13px] font-black uppercase tracking-widest text-[var(--cp-ink-muted)] mb-4 font-sans">Funcionamento e Prazos</div>
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border-2 border-[var(--cp-ink)] border-t-[6px] border-t-[var(--cp-ink)] p-5 flex items-center justify-between shadow-[0_4px_0_0_var(--cp-line-strong)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--cp-dough)] rounded-xl flex items-center justify-center text-[var(--cp-ink)] border-2 border-[var(--cp-ink)] shadow-[0_3px_0_0_var(--cp-line-strong)]">
                  <Truck size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-[14px] font-black text-[var(--cp-ink)] block" style={{ fontFamily: 'var(--font-display-alt)' }}>Serviço de Entrega</span>
                  <div className="px-2 py-0.5 rounded-lg border-2 border-[var(--cp-ink)] bg-white text-[var(--cp-ink-faint)] text-[9px] font-black uppercase inline-block mt-1">Delivery no site</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Status</span>
                <div onClick={() => setConfig(prev => prev ? {...prev, entrega_ativa: !prev.entrega_ativa} : null)}
                  className="w-[48px] h-[28px] rounded-lg relative cursor-pointer transition-all duration-200 border-2 flex items-center px-1 shadow-[0_2px_0_0_var(--cp-line-strong)]"
                  style={{ backgroundColor: config?.entrega_ativa ? 'var(--cp-red)' : 'var(--cp-flour)', borderColor: 'var(--cp-ink)' }}>
                  <div className="w-[16px] h-[16px] rounded-md transition-all duration-200"
                    style={{ transform: config?.entrega_ativa ? 'translateX(22px)' : 'translateX(0)', backgroundColor: config?.entrega_ativa ? 'white' : 'var(--cp-ink)' }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-[var(--cp-ink)] border-t-[6px] border-t-[var(--cp-ink)] p-5 flex items-center justify-between shadow-[0_4px_0_0_var(--cp-line-strong)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--cp-dough)] rounded-xl flex items-center justify-center text-[var(--cp-ink)] border-2 border-[var(--cp-ink)] shadow-[0_3px_0_0_var(--cp-line-strong)]">
                  <Store size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-[14px] font-black text-[var(--cp-ink)] block" style={{ fontFamily: 'var(--font-display-alt)' }}>Retirada no Balcão</span>
                  <div className="px-2 py-0.5 rounded-lg border-2 border-[var(--cp-ink)] bg-white text-[var(--cp-ink-faint)] text-[9px] font-black uppercase inline-block mt-1">Cliente retira na loja</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter">Status</span>
                <div onClick={() => setConfig(prev => prev ? {...prev, retirada_ativa: !prev.retirada_ativa} : null)}
                  className="w-[48px] h-[28px] rounded-lg relative cursor-pointer transition-all duration-200 border-2 flex items-center px-1 shadow-[0_2px_0_0_var(--cp-line-strong)]"
                  style={{ backgroundColor: config?.retirada_ativa ? 'var(--cp-red)' : 'var(--cp-flour)', borderColor: 'var(--cp-ink)' }}>
                  <div className="w-[16px] h-[16px] rounded-md transition-all duration-200"
                    style={{ transform: config?.retirada_ativa ? 'translateX(22px)' : 'translateX(0)', backgroundColor: config?.retirada_ativa ? 'white' : 'var(--cp-ink)' }} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-[var(--cp-ink)] border-t-[6px] border-t-[var(--cp-ink)] p-5 flex items-center justify-between shadow-[0_4px_0_0_var(--cp-line-strong)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--cp-dough)] rounded-xl flex items-center justify-center text-[var(--cp-ink)] border-2 border-[var(--cp-ink)] font-black text-[18px] shadow-[0_3px_0_0_var(--cp-line-strong)]">R$</div>
                <div>
                  <span className="text-[14px] font-black text-[var(--cp-ink)] block" style={{ fontFamily: 'var(--font-display-alt)' }}>Pedido Mínimo</span>
                  <div className="px-2 py-0.5 rounded-lg border-2 border-[var(--cp-ink)] bg-white text-[var(--cp-ink-faint)] text-[9px] font-black uppercase inline-block mt-1">Valor p/ aceitar entrega</div>
                </div>
              </div>
              <div className="relative w-32">
                <input type="text"
                  value={config?.pedido_minimo ? config.pedido_minimo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                  onChange={(e) => { const n = parseFloat(e.target.value.replace(/[^\d]/g, '')) / 100; setConfig(prev => prev ? {...prev, pedido_minimo: isNaN(n) ? 0 : n} : null); }}
                  placeholder="0,00"
                  className="py-3 px-4 rounded-xl border-2 border-[var(--cp-ink)] bg-[var(--cp-flour)] text-[16px] font-black outline-none focus:border-[var(--cp-red)] transition-colors w-full text-right text-[var(--cp-ink)] shadow-[0_3px_0_0_var(--cp-line-strong)]"
                />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="text-[13px] font-black uppercase tracking-widest text-[var(--cp-ink-muted)] mb-4 font-sans">Endereço de Origem</div>
            <div className="space-y-3">
              <input type="text" value={config?.endereco || ''} onChange={(e) => setConfig(prev => prev ? {...prev, endereco: e.target.value} : null)} placeholder="Rua, Número e Bairro" className={ic} />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={config?.cidade_uf || ''} onChange={(e) => setConfig(prev => prev ? {...prev, cidade_uf: e.target.value} : null)} placeholder="Cidade - UF" className={ic} />
                <input type="text" value={config?.cep || ''} onChange={(e) => setConfig(prev => prev ? {...prev, cep: e.target.value} : null)} placeholder="CEP" className={ic} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Taxa de Entrega */}
      {activeTab === 'taxas' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-[13px] font-black uppercase tracking-widest text-[var(--cp-ink-muted)] mb-4 font-sans">Modo de Cálculo</div>
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex rounded-xl border-2 border-[var(--cp-ink)] overflow-hidden bg-white shadow-[0_3px_0_0_var(--cp-line-strong)] w-fit">
              {(['raio', 'bairro', 'hibrido'] as const).map((m) => (
                <button key={m} onClick={async () => { 
                  if (!config) return;
                  const newModo = m;
                  setConfig({ ...config, modo_entrega: newModo });
                  await supabase.from('configuracoes').update({ modo_entrega: newModo }).eq('id', config.id);
                }} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${logicMode === m ? 'bg-[var(--cp-red)] text-white' : 'bg-white text-[var(--cp-ink)] hover:bg-[var(--cp-dough)] border-r-2 last:border-r-0 border-[var(--cp-ink)]'}`}>
                  {m === 'raio' ? 'Distância' : m === 'bairro' ? 'Bairro Fixo' : 'Híbrido'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Seção de Raio */}
            {(logicMode === 'raio' || logicMode === 'hibrido') && (
              <div className="bg-white rounded-2xl border-2 border-[var(--cp-ink)] shadow-[0_4px_0_0_var(--cp-line-strong)] overflow-hidden transition-all">
                <div 
                  className={`flex items-center justify-between p-4 bg-zinc-50 border-b-2 border-[var(--cp-ink)] ${logicMode === 'hibrido' ? 'cursor-pointer hover:bg-zinc-100' : ''}`}
                  onClick={() => logicMode === 'hibrido' && setRaioExpanded(!raioExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--cp-red)] flex items-center justify-center text-white">
                      <MapPin size={18} strokeWidth={3} />
                    </div>
                    <div>
                      <div className="text-[12px] font-black uppercase tracking-tight text-[var(--cp-ink)]">Configuração de Raio</div>
                      <div className="text-[9px] font-bold text-zinc-400 uppercase">Cálculo baseado em distância (KM)</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={(e) => { e.stopPropagation(); setEditTaxa({}); setShowTaxaModal(true); }}
                      className="px-3 py-1.5 bg-white border-2 border-[var(--cp-ink)] rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--cp-red)] hover:bg-[var(--cp-dough)] transition-all flex items-center gap-2 shadow-[0_2px_0_0_var(--cp-line-strong)] active:translate-y-[1px] active:shadow-none">
                      <PlusIcon size={12} strokeWidth={3} /> Adicionar Faixa
                    </button>
                    {logicMode === 'hibrido' && (
                      <ChevronDownIcon 
                        size={20} 
                        className={`transition-transform duration-300 ${raioExpanded ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </div>
                </div>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${logicMode === 'hibrido' && !raioExpanded ? 'max-h-0' : 'max-h-[2000px]'}`}>
                  {taxas.length === 0 ? <p className="py-12 text-center text-[11px] text-zinc-300 font-bold italic">Nenhuma faixa de distância cadastrada</p> : (
                    <div className="divide-y-2 divide-[var(--cp-line)]">
                      {taxas.map((taxa, idx) => (
                        <div key={taxa.id} className={`flex items-center justify-between p-4 transition-colors ${!taxa.ativo ? 'bg-zinc-50/50' : 'hover:bg-[var(--cp-flour)]'}`}>
                          <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: ZONE_COLORS[idx % ZONE_COLORS.length] }} />
                            <div>
                              <div className={`text-[14px] font-black ${!taxa.ativo ? 'text-zinc-400' : 'text-[var(--cp-ink)]'}`}>
                                {taxa.distancia_min} – {taxa.distancia_max} km
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{taxa.tempo_estimado || 45} min</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-200" />
                                <span className="text-[10px] font-black text-[var(--cp-red)] uppercase tracking-tighter">R$ {taxa.valor.toFixed(2).replace('.', ',')}</span>
                                {!taxa.ativo && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-400 text-[8px] font-black uppercase border border-zinc-200">Inativo</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-black text-zinc-300 uppercase tracking-tighter">Status</span>
                              <div onClick={() => toggleStatusTaxa(taxa.id, taxa.ativo)}
                                className="w-[36px] h-[20px] rounded-md relative cursor-pointer transition-all duration-200 border-2 flex items-center px-0.5"
                                style={{ backgroundColor: taxa.ativo ? 'var(--cp-red)' : 'var(--cp-flour)', borderColor: 'var(--cp-ink)' }}>
                                <div className="w-[10px] h-[10px] rounded-sm transition-all duration-200"
                                  style={{ transform: taxa.ativo ? 'translateX(18px)' : 'translateX(0)', backgroundColor: taxa.ativo ? 'white' : 'var(--cp-ink)' }} />
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              <button onClick={() => { setEditTaxa(taxa); setShowTaxaModal(true); }} className="w-8 h-8 rounded-lg border-2 border-[var(--cp-ink)] bg-white flex items-center justify-center text-[var(--cp-ink)] hover:bg-[var(--cp-dough)] transition-all shadow-[0_2px_0_0_var(--cp-line-strong)] active:translate-y-0.5 active:shadow-none">
                                <EditIcon size={14} />
                              </button>
                              <button onClick={() => handleDeleteTaxa(taxa.id)} className="w-8 h-8 rounded-lg border-2 border-[var(--cp-ink)] bg-white flex items-center justify-center text-[var(--cp-red)] hover:bg-rose-50 transition-all shadow-[0_2px_0_0_var(--cp-line-strong)] active:translate-y-0.5 active:shadow-none">
                                <TrashIcon size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seção de Bairros */}
            {(logicMode === 'bairro' || logicMode === 'hibrido') && (
              <div className="bg-white rounded-2xl border-2 border-[var(--cp-ink)] shadow-[0_4px_0_0_var(--cp-line-strong)] overflow-hidden transition-all">
                <div 
                  className={`flex items-center justify-between p-4 bg-zinc-50 border-b-2 border-[var(--cp-ink)] ${logicMode === 'hibrido' ? 'cursor-pointer hover:bg-zinc-100' : ''}`}
                  onClick={() => logicMode === 'hibrido' && setBairrosExpanded(!bairrosExpanded)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-white">
                      <Truck size={18} strokeWidth={3} />
                    </div>
                    <div>
                      <div className="text-[12px] font-black uppercase tracking-tight text-[var(--cp-ink)]">Configuração de Bairros</div>
                      <div className="text-[9px] font-bold text-zinc-400 uppercase">Taxas fixas e áreas bloqueadas</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {bairros.some(b => b.bloqueado) && (
                      <div className="bg-zinc-800 text-white text-[8px] px-2 py-1 rounded-full font-black animate-pulse">
                        {bairros.filter(b => b.bloqueado).length} BLOQUEIOS
                      </div>
                    )}
                    {logicMode === 'hibrido' && (
                      <ChevronDownIcon 
                        size={20} 
                        className={`transition-transform duration-300 ${bairrosExpanded ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </div>
                </div>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${logicMode === 'hibrido' && !bairrosExpanded ? 'max-h-0' : 'max-h-[2000px]'}`}>
                  <div className="divide-y-4 divide-[var(--cp-line)]">
                    {/* Sub-seção: Atendidos */}
                    <div className="p-4 bg-[var(--cp-flour)]/30 flex items-center justify-between border-b-2 border-[var(--cp-line)]">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Bairros Atendidos</span>
                      <button onClick={(e) => { e.stopPropagation(); setEditBairro({ bloqueado: false }); setBairroSearch(''); setBairroResults([]); setShowBairroModal(true); }}
                        className="px-3 py-1.5 bg-white border-2 border-[var(--cp-ink)] rounded-lg text-[9px] font-black uppercase tracking-widest text-[var(--cp-ink)] hover:bg-[var(--cp-dough)] transition-all flex items-center gap-2 shadow-[0_2px_0_0_var(--cp-line-strong)] active:translate-y-[1px] active:shadow-none">
                        <PlusIcon size={12} strokeWidth={3} /> Adicionar Taxa
                      </button>
                    </div>
                    <div className="divide-y-2 divide-[var(--cp-line)]">
                      {bairros.filter(b => !b.bloqueado).length === 0 ? <p className="py-8 text-center text-[10px] text-zinc-300 font-bold italic">Nenhum bairro cadastrado</p> : (
                        bairros.filter(b => !b.bloqueado).map((b) => (
                          <div key={b.id} className={`flex items-center justify-between p-4 transition-colors ${!b.ativo ? 'bg-zinc-50/50' : 'hover:bg-[var(--cp-flour)]'}`}>
                            <div className="flex items-center gap-4">
                              <div className="w-1.5 h-8 rounded-full bg-[var(--cp-red)]" />
                              <div>
                                <div className={`text-[14px] font-black ${!b.ativo ? 'text-zinc-400' : 'text-[var(--cp-ink)]'}`}>{b.nome}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{b.tempo_estimado || 45} min</span>
                                  <span className="w-1 h-1 rounded-full bg-zinc-200" />
                                  <span className="text-[10px] font-black text-[var(--cp-red)] uppercase tracking-tighter">R$ {b.valor.toFixed(2).replace('.', ',')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditBairro(b); setBairroSearch(b.nome); setBairroResults([]); setShowBairroModal(true); }} className="w-7 h-7 rounded border-2 border-[var(--cp-ink)] bg-white flex items-center justify-center text-[var(--cp-ink)] hover:bg-[var(--cp-dough)] shadow-[0_2px_0_0_var(--cp-line-strong)]">
                                <EditIcon size={12} />
                              </button>
                              <button onClick={() => handleDeleteBairro(b.id)} className="w-7 h-7 rounded border-2 border-[var(--cp-ink)] bg-white flex items-center justify-center text-[var(--cp-red)] hover:bg-rose-50 shadow-[0_2px_0_0_var(--cp-line-strong)]">
                                <TrashIcon size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Sub-seção: Bloqueados */}
                    <div className="p-4 bg-zinc-100 flex items-center justify-between border-b-2 border-[var(--cp-line)] border-t-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Áreas Bloqueadas (Ex: CDHU)</span>
                      <button onClick={(e) => { e.stopPropagation(); setEditBairro({ bloqueado: true }); setBairroSearch(''); setBairroResults([]); setShowBairroModal(true); }}
                        className="px-3 py-1.5 bg-zinc-800 border-2 border-zinc-950 rounded-lg text-[9px] font-black uppercase tracking-widest text-white hover:bg-zinc-900 transition-all flex items-center gap-2 shadow-[0_2px_0_0_zinc-950] active:translate-y-[1px] active:shadow-none">
                        <XIcon size={12} strokeWidth={3} className="text-white" /> Bloquear Área
                      </button>
                    </div>
                    <div className="divide-y-2 divide-[var(--cp-line)] bg-zinc-50/50">
                      {bairros.filter(b => b.bloqueado).length === 0 ? <p className="py-8 text-center text-[10px] text-zinc-300 font-bold italic">Nenhuma área bloqueada</p> : (
                        bairros.filter(b => b.bloqueado).map((b) => (
                          <div key={b.id} className="flex items-center justify-between p-4 hover:bg-zinc-100/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-1.5 h-8 rounded-full bg-zinc-800" />
                              <div className="text-[14px] font-black text-zinc-400">{b.nome}</div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => { setEditBairro(b); setBairroSearch(b.nome); setBairroResults([]); setShowBairroModal(true); }} className="w-7 h-7 rounded border-2 border-zinc-800 bg-white flex items-center justify-center text-zinc-800 shadow-[0_2px_0_0_zinc-800]">
                                <EditIcon size={12} />
                              </button>
                              <button onClick={() => handleDeleteBairro(b.id)} className="w-7 h-7 rounded border-2 border-zinc-800 bg-white flex items-center justify-center text-[var(--cp-red)] shadow-[0_2px_0_0_zinc-800]">
                                <TrashIcon size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Localização e Mapa unificados em um card */}
            {(logicMode === 'raio' || logicMode === 'hibrido') && (
              <div className="mt-12">
                <div className="text-[13px] font-black uppercase tracking-widest text-[var(--cp-ink-muted)] mb-4 font-sans">Geolocalização da Loja</div>
                <div className="bg-white rounded-2xl border-2 border-[var(--cp-ink)] border-t-[6px] border-t-[var(--cp-ink)] p-6 shadow-[0_4px_0_0_var(--cp-line-strong)]">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="relative">
                      <input type="number" step="any" value={config?.latitude ?? ''} onChange={(e) => { const v = parseFloat(e.target.value); setConfig(prev => prev ? {...prev, latitude: isNaN(v) ? null : v} : null); }} placeholder="Latitude" className={ic} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30 pointer-events-none">LAT</span>
                    </div>
                    <div className="relative">
                      <input type="number" step="any" value={config?.longitude ?? ''} onChange={(e) => { const v = parseFloat(e.target.value); setConfig(prev => prev ? {...prev, longitude: isNaN(v) ? null : v} : null); }} placeholder="Longitude" className={ic} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30 pointer-events-none">LNG</span>
                    </div>
                  </div>

                  {config?.latitude && config?.longitude ? (
                    <div className="border-2 border-[var(--cp-ink)] rounded-xl overflow-hidden shadow-sm">
                      <DeliveryMap latitude={config.latitude} longitude={config.longitude} areas={taxas} />
                    </div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-[var(--cp-line-strong)] rounded-xl text-center bg-[var(--cp-flour)]">
                      <p className="text-[12px] font-bold text-zinc-400 italic">Insira as coordenadas para visualizar o mapa</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Formas de Pagamento */}
      {activeTab === 'pagamento' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-[13px] font-black uppercase tracking-widest text-[var(--cp-ink-muted)] mb-4 font-sans">Pagamento na Entrega</div>
          <div className="space-y-3">
            {[
              { id: 'pix', label: 'Pix', icon: 'PIX' },
              { id: 'dinheiro', label: 'Dinheiro', icon: 'R$' },
              { id: 'credito', label: 'Cartão de Crédito', icon: <CreditCard size={18} /> },
              { id: 'debito', label: 'Cartão de Débito', icon: <CreditCard size={18} /> },
              { id: 'vr', label: 'Vale Refeição (VR)', icon: 'VR' },
            ].map((p) => {
              const isSelected = config?.formas_pagamento_entrega?.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border-2 border-[var(--cp-line-strong)] p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[var(--cp-dough)] rounded-xl flex items-center justify-center text-[11px] font-black border-2 border-[var(--cp-ink)] uppercase">
                      {p.icon}
                    </div>
                    <span className="text-[13px] font-bold text-[var(--cp-ink)]">{p.label}</span>
                  </div>
                  <div onClick={() => togglePayment(p.id)}
                    className="w-[44px] h-[26px] rounded-lg relative cursor-pointer transition-all duration-200 border-2 flex items-center px-1 shadow-[0_2px_0_0_var(--cp-line-strong)]"
                    style={{ backgroundColor: isSelected ? 'var(--cp-red)' : 'var(--cp-flour)', borderColor: 'var(--cp-ink)' }}>
                    <div className="w-[14px] h-[14px] rounded-md transition-all duration-200"
                      style={{ transform: isSelected ? 'translateX(20px)' : 'translateX(0)', backgroundColor: isSelected ? 'white' : 'var(--cp-ink)' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10">
            <div className="text-[12px] font-bold uppercase tracking-wider text-zinc-500 mb-4">Pagamento via Aplicativo</div>
            <div className="bg-white rounded-2xl border-2 border-[var(--cp-line-strong)] p-5 flex items-center gap-4 opacity-50 shadow-sm border-dashed">
              <div className="w-10 h-10 bg-[var(--cp-dough)] rounded-xl flex items-center justify-center text-zinc-400 border-2 border-zinc-200">
                <CreditCard size={20} />
              </div>
              <div>
                <span className="text-[13px] font-bold text-[var(--cp-ink)] block">Em construção...</span>
                <span className="text-[11px] text-[var(--cp-ink-faint)] font-bold uppercase tracking-tighter block mt-0.5">Pagamento online em breve</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Taxa */}
      {showTaxaModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border-2 border-[var(--cp-ink)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-[18px] font-black mb-5 uppercase tracking-tight" style={{ fontFamily: 'var(--font-display-alt)' }}>
              {editTaxa.id ? 'Editar Área' : 'Nova Área'}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input type="text" value={String(editTaxa.distancia_min || '')} onChange={(e) => setEditTaxa(p => ({...p, distancia_min: parseFloat(e.target.value)}))} placeholder="Km inicial" className={ic} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30 pointer-events-none">km</span>
                </div>
                <div className="relative">
                  <input type="text" value={String(editTaxa.distancia_max || '')} onChange={(e) => setEditTaxa(p => ({...p, distancia_max: parseFloat(e.target.value)}))} placeholder="Km final" className={ic} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30 pointer-events-none">km</span>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold opacity-30">R$</span>
                <input type="text"
                  value={editTaxa.valor ? editTaxa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                  onChange={(e) => setEditTaxa(p => ({...p, valor: parseCurrency(e.target.value)}))}
                  placeholder="0,00" className={ic + " pl-8"} />
              </div>
              <div className="relative">
                <input type="text"
                  value={editTaxa.tempo_estimado ? String(editTaxa.tempo_estimado) : ''}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setEditTaxa(p => ({...p, tempo_estimado: v ? parseInt(v) : undefined})); }}
                  placeholder="Tempo estimado" className={ic} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30 pointer-events-none">min</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setShowTaxaModal(false)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={handleSaveTaxa}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bairro */}
      {showBairroModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 border-2 border-[var(--cp-ink)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-[18px] font-black mb-5 uppercase tracking-tight" style={{ fontFamily: 'var(--font-display-alt)' }}>
              {editBairro.bloqueado ? (editBairro.id ? 'Editar Bloqueio' : 'Novo Bloqueio') : (editBairro.id ? 'Editar Bairro' : 'Novo Bairro')}
            </h3>
            <div className="space-y-4">
              {/* Busca de bairro com autocomplete */}
              <div className="relative" ref={dropdownRef}>
                <div className="flex justify-between items-center mb-1 px-1">
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tight">Nome da Área / Bairro</span>
                  <span className="text-[9px] font-bold text-[var(--cp-red)] bg-rose-50 px-1.5 py-0.5 rounded italic">Pode digitar manualmente</span>
                </div>
                <input type="text" value={bairroSearch} onChange={(e) => searchBairros(e.target.value)}
                  placeholder="Ex: CDHU, Centro, Bloco B..." className={ic} autoFocus />
                {searchingBairro && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-300 animate-pulse">Buscando...</span>}
                
                {/* Sugestões: Apenas obrigatórias se NÃO for bloqueado */}
                {bairroResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border-2 border-[var(--cp-ink)] shadow-xl z-[60] overflow-hidden max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 bg-zinc-50 border-b border-[var(--cp-line)] text-[8px] font-black text-zinc-400 uppercase tracking-tighter">Sugestões em {config?.cidade_uf}</div>
                    {bairroResults.map((r, i) => (
                      <button key={i} onClick={() => selectBairro(r.name)}
                        className="w-full text-left px-3 py-2.5 text-[13px] font-semibold hover:bg-[var(--cp-dough)] transition-colors border-b last:border-b-0 border-[var(--cp-line)]">
                        <span className="font-black text-[var(--cp-ink)]">{r.name}</span>
                        {r.display !== r.name && <span className="text-[11px] text-zinc-400 ml-2">{r.display}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {!editBairro.bloqueado && bairroResults.length === 0 && bairroSearch.length > 2 && !searchingBairro && (
                   <p className="mt-1 text-[9px] text-orange-600 font-bold px-1 italic">Recomendado selecionar uma sugestão para garantir o match no CEP.</p>
                )}
              </div>

              {!editBairro.bloqueado && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold opacity-30">R$</span>
                    <input type="text"
                      value={editBairro.valor ? editBairro.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                      onChange={(e) => setEditBairro(p => ({...p, valor: parseCurrency(e.target.value)}))}
                      placeholder="0,00" className={ic + " pl-8"} />
                  </div>
                  <div className="relative">
                    <input type="text"
                      value={editBairro.tempo_estimado ? String(editBairro.tempo_estimado) : ''}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, ''); setEditBairro(p => ({...p, tempo_estimado: v ? parseInt(v) : undefined})); }}
                      placeholder="Tempo" className={ic} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30 pointer-events-none">min</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setShowBairroModal(false)}>Cancelar</Button>
              <Button variant="primary" className="flex-1" onClick={handleSaveBairro}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
