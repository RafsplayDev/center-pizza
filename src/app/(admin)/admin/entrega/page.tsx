'use client';

// =============================================================
// Center Pizza · Gestão de Entrega
// Rota: /admin/entrega
// Layout baseado no design premium enviado
// =============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  PlusIcon,
  TrashIcon,
  EditIcon,
  SaveIcon,
  MapIcon,
} from '@/components/admin/icons';
import Button from '@/components/ui/Button';
import { MapPin, Truck, Target, Clock, Info } from 'lucide-react';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// -------------------------------------------------------------
// Tipos
// -------------------------------------------------------------
type DBConfig = {
  id: string;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  cidade_uf: string | null;
  cep: string | null;
  entrega_ativa: boolean;
  tempo_estimado_padrao: number;
  pedido_minimo: number;
  raio_maximo_km: number;
};

type DBTaxaEntrega = {
  id: string;
  distancia_min: number;
  distancia_max: number;
  valor: number;
  tempo_estimado?: number;
};

// -------------------------------------------------------------
// Componentes de UI (Estilo Premium)
// -------------------------------------------------------------
function Card({ title, subtitle, icon: Icon, children, className = "" }: { title: string; subtitle: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border-2 border-[var(--cp-ink)] shadow-[0_3px_0_0_rgba(0,0,0,0.05)] overflow-hidden flex flex-col ${className}`} style={{ borderTop: '8px solid var(--cp-ink)' }}>
      <div className="px-5 py-4 border-b-2 border-[var(--cp-line-strong)] flex items-center gap-3 bg-white">
        <div className="w-8 h-8 rounded-lg bg-[var(--cp-dough)] border-2 border-[var(--cp-ink)] flex items-center justify-center flex-none">
          <Icon size={16} className="text-[var(--cp-ink)]" />
        </div>
        <div>
          <h3 className="text-[14px] font-black uppercase tracking-tight leading-none mb-0.5" style={{ fontFamily: 'var(--font-body)' }}>{title}</h3>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 flex-1 bg-[var(--cp-flour)]/20">
        {children}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", suffix }: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--cp-ink)] opacity-50 ml-1">{label}</label>
      <div className="relative">
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 px-3 rounded-lg border-2 border-[var(--cp-line-strong)] bg-[var(--cp-dough)]/30 text-[13px] font-bold outline-none focus:border-[var(--cp-red)] transition-all"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30 pointer-events-none uppercase">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function SwitchField({ label, description, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex flex-col">
        <span className="text-[13px] font-black text-[var(--cp-ink)] leading-none">{label}</span>
        <span className="text-[10px] font-medium text-zinc-400 mt-1">{description}</span>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-lg relative transition-all duration-300 border-2 border-[var(--cp-ink)] shadow-[0_2px_0_0_var(--cp-ink)] active:translate-y-0.5 active:shadow-none ${checked ? 'bg-[var(--cp-red)]' : 'bg-zinc-200'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-md bg-white border-2 border-[var(--cp-ink)] transition-all duration-300 ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

// -------------------------------------------------------------
// Página Principal
// -------------------------------------------------------------
export default function EntregaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DBConfig | null>(null);
  const [taxas, setTaxas] = useState<DBTaxaEntrega[]>([]);
  const [activeTab, setActiveTab] = useState<'endereco' | 'areas'>('areas');
  
  // Modal Taxa
  const [showTaxaModal, setShowTaxaModal] = useState(false);
  const [editTaxa, setEditTaxa] = useState<Partial<DBTaxaEntrega>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: configData } = await supabase.from('configuracoes').select('*').eq('id', 'loja').single();
      const { data: taxasData } = await supabase.from('taxas_entrega').select('*').order('distancia_min', { ascending: true });
      
      if (configData) setConfig(configData);
      if (taxasData) setTaxas(taxasData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('configuracoes')
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'loja');

      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTaxa = async () => {
    try {
      if (editTaxa.id) {
        await supabase.from('taxas_entrega').update(editTaxa).eq('id', editTaxa.id);
      } else {
        await supabase.from('taxas_entrega').insert(editTaxa);
      }
      setShowTaxaModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTaxa = async (id: string) => {
    if (!confirm('Deseja excluir esta área?')) return;
    await supabase.from('taxas_entrega').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <LoadingScreen message="Carregando configurações..." fullScreen />;

  const tabs = [
    { id: 'areas', label: 'Áreas de Entrega', icon: Target },
    { id: 'endereco', label: 'Endereço da Loja', icon: MapPin },
  ];

  return (
    <div className="p-8 max-w-[900px] mx-auto min-h-screen">
      
      {/* Tabs e Botão de Salvar em uma linha compacta */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2 bg-[var(--cp-dough)]/50 p-1 rounded-xl border-2 border-[var(--cp-line-strong)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                ${activeTab === tab.id 
                  ? 'bg-white border-2 border-[var(--cp-ink)] shadow-[0_2px_0_0_var(--cp-ink)] text-[var(--cp-ink)]' 
                  : 'text-zinc-400 hover:text-[var(--cp-ink)]'}`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-6 bg-[var(--cp-red)] text-white rounded-lg border-2 border-[var(--cp-ink)] shadow-[0_3px_0_0_var(--cp-ink)] flex items-center gap-2 font-black uppercase tracking-wider hover:brightness-110 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 text-[11px]"
        >
          <SaveIcon size={16} />
          {saving ? 'Gravando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="animate-in fade-in zoom-in-95 duration-300">
        
        {/* Aba: Áreas (Zonas + Regras Essenciais) */}
        {activeTab === 'areas' && (
          <div className="space-y-6">
            {/* Mini Card de Regras Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border-2 border-[var(--cp-ink)] shadow-[0_3px_0_0_rgba(0,0,0,0.05)]">
                <SwitchField 
                  label="Serviço de Entrega" 
                  description="Ativar delivery no site"
                  checked={config?.entrega_ativa}
                  onChange={(v: boolean) => setConfig(prev => prev ? {...prev, entrega_ativa: v} : null)}
                />
              </div>
              <div className="bg-white p-4 rounded-xl border-2 border-[var(--cp-ink)] shadow-[0_3px_0_0_rgba(0,0,0,0.05)] flex flex-col justify-center">
                <InputField 
                  label="Pedido Mínimo (R$)" 
                  value={config?.pedido_minimo || ''} 
                  onChange={(v: string) => setConfig(prev => prev ? {...prev, pedido_minimo: parseFloat(v.replace(',', '.'))} : null)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <Card 
              title="Áreas de Atendimento" 
              subtitle="Gerencie preços e tempos por distância"
              icon={Target}
            >
              <div className="space-y-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      <th className="pb-4 px-2">Raio (Km)</th>
                      <th className="pb-4 px-2">Taxa (R$)</th>
                      <th className="pb-4 px-2">Tempo</th>
                      <th className="pb-4 px-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-dashed divide-zinc-50">
                    {taxas.map((taxa, idx) => (
                      <tr key={taxa.id} className="group">
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-orange-500' : 'bg-red-500'}`} />
                            <span className="text-[13px] font-black text-[var(--cp-ink)]">{taxa.distancia_min} a {taxa.distancia_max}km</span>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-[13px] font-black text-[var(--cp-red)]">R$ {taxa.valor.toFixed(2).replace('.', ',')}</span>
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-[13px] font-bold text-zinc-500">{taxa.tempo_estimado || 45} min</span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => { setEditTaxa(taxa); setShowTaxaModal(true); }}
                              className="w-8 h-8 rounded-lg bg-[var(--cp-dough)] border-2 border-[var(--cp-ink)] flex items-center justify-center hover:bg-white transition-all shadow-[0_2px_0_0_var(--cp-ink)] active:shadow-none active:translate-y-0.5"
                            >
                              <EditIcon size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteTaxa(taxa.id)}
                              className="w-8 h-8 rounded-lg bg-white border-2 border-zinc-200 flex items-center justify-center hover:border-rose-500 hover:text-rose-500 transition-all"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button 
                  onClick={() => { setEditTaxa({}); setShowTaxaModal(true); }}
                  className="w-full mt-6 h-11 border-2 border-dashed border-zinc-300 rounded-xl text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:border-[var(--cp-ink)] hover:text-[var(--cp-ink)] transition-all flex items-center justify-center gap-2"
                >
                  <PlusIcon size={16} />
                  Nova Área
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Aba: Endereço */}
        {activeTab === 'endereco' && (
          <Card 
            title="Localização da Pizzaria" 
            subtitle="Endereço usado como ponto de origem"
            icon={MapPin}
          >
            <div className="grid grid-cols-1 gap-5">
              <InputField 
                label="Rua, Número e Bairro" 
                value={config?.endereco || ''} 
                onChange={(v: string) => setConfig(prev => prev ? {...prev, endereco: v} : null)}
                placeholder="Ex: Rua das Pizzas, 123, Centro"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Cidade / UF" 
                  value={config?.cidade_uf || ''} 
                  onChange={(v: string) => setConfig(prev => prev ? {...prev, cidade_uf: v} : null)}
                  placeholder="Ex: São Paulo - SP"
                />
                <InputField 
                  label="CEP" 
                  value={config?.cep || ''} 
                  onChange={(v: string) => setConfig(prev => prev ? {...prev, cep: v} : null)}
                  placeholder="00000-000"
                />
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--cp-ink)] opacity-50 ml-1">Coordenadas de GPS</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30">LAT</span>
                    <input 
                      type="number"
                      value={config?.latitude || ''}
                      onChange={(e) => setConfig(prev => prev ? {...prev, latitude: parseFloat(e.target.value)} : null)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-[var(--cp-line-strong)] bg-[var(--cp-dough)]/30 text-[14px] font-bold outline-none"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30">LNG</span>
                    <input 
                      type="number"
                      value={config?.longitude || ''}
                      onChange={(e) => setConfig(prev => prev ? {...prev, longitude: parseFloat(e.target.value)} : null)}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-[var(--cp-line-strong)] bg-[var(--cp-dough)]/30 text-[14px] font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 aspect-video rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center justify-center gap-3 grayscale opacity-40">
                <MapIcon size={40} />
                <p className="text-[11px] font-black uppercase tracking-widest text-center">Pré-visualização Desativada</p>
              </div>
            </div>
          </Card>
        )}

      </div>

      {/* Modal Nova/Editar Área */}
      {showTaxaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-[24px] border-4 border-[var(--cp-ink)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <h3 className="text-[20px] font-black uppercase tracking-tight mb-6" style={{ fontFamily: 'var(--font-display-alt)' }}>
                {editTaxa.id ? 'Editar Área' : 'Nova Área'}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField 
                    label="Km Inicial" 
                    value={editTaxa.distancia_min || ''} 
                    onChange={(v: string) => setEditTaxa(p => ({...p, distancia_min: parseFloat(v)}))}
                    placeholder="0"
                  />
                  <InputField 
                    label="Km Final" 
                    value={editTaxa.distancia_max || ''} 
                    onChange={(v: string) => setEditTaxa(p => ({...p, distancia_max: parseFloat(v)}))}
                    placeholder="2"
                  />
                </div>
                <InputField 
                  label="Taxa de Entrega (R$)" 
                  value={editTaxa.valor || ''} 
                  onChange={(v: string) => setEditTaxa(p => ({...p, valor: parseFloat(v.replace(',', '.'))}))}
                  placeholder="5,00"
                />
                <InputField 
                  label="Tempo Estimado (Min)" 
                  value={editTaxa.tempo_estimado || ''} 
                  onChange={(v: string) => setEditTaxa(p => ({...p, tempo_estimado: parseInt(v)}))}
                  placeholder="30"
                />
              </div>

              <div className="flex gap-3 mt-8">
                <Button variant="ghost" className="flex-1" onClick={() => setShowTaxaModal(false)}>Cancelar</Button>
                <Button variant="primary" className="flex-1" onClick={handleSaveTaxa}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
