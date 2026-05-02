'use client';

// =============================================================
// Center Pizza · Configurações — Gestão da Loja e Entregas
// Rota: /admin/configuracoes
// =============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  PlusIcon,
  TrashIcon,
  EditIcon,
  AlertIcon,
} from '@/components/admin/icons';
import Button from '@/components/ui/Button';

// -------------------------------------------------------------
// Supabase client
// -------------------------------------------------------------
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// -------------------------------------------------------------
// Tipos
// -------------------------------------------------------------
type DBConfig = {
  id: string;
  aberta: boolean;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
};

type DBTaxaEntrega = {
  id: string;
  distancia_min: number;
  distancia_max: number;
  valor: number;
};

// -------------------------------------------------------------
// Componentes de UI Reutilizados
// -------------------------------------------------------------
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="text-[10px] font-black tracking-[0.12em] uppercase flex items-center gap-1 mb-1.5" style={{ color: 'var(--cp-ink)' }}>
      {label}
      {required && <span style={{ color: 'var(--cp-red)' }}>*</span>}
    </label>
  );
}

function FieldInput({ value, onChange, placeholder, type = 'text', required }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full py-2.5 px-3 rounded-lg border-2 text-[14px] font-semibold outline-none transition-colors"
      style={{
        borderColor: 'var(--cp-line-strong)',
        backgroundColor: 'var(--cp-flour)',
        fontFamily: 'var(--font-body)',
        color: 'var(--cp-ink)',
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--cp-red)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--cp-line-strong)')}
    />
  );
}

function formatCurrency(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const cents = parseInt(digits);
  return (cents / 100).toFixed(2).replace('.', ',');
}

function FieldCurrencyInput({ value, onChange, placeholder, required }: { value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold opacity-40">R$</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(formatCurrency(e.target.value))}
        placeholder={placeholder}
        required={required}
        className="w-full py-2.5 pl-9 pr-3 rounded-lg border-2 text-[14px] font-semibold outline-none transition-colors"
        style={{
          borderColor: 'var(--cp-line-strong)',
          backgroundColor: 'var(--cp-flour)',
          fontFamily: 'var(--font-body)',
          color: 'var(--cp-ink)',
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--cp-red)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--cp-line-strong)')}
      />
    </div>
  );
}

// -------------------------------------------------------------
// PÁGINA PRINCIPAL
// -------------------------------------------------------------
export default function ConfiguracoesPage() {
  const [config, setConfig] = useState<DBConfig | null>(null);
  const [taxas, setTaxas] = useState<DBTaxaEntrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [savingTaxa, setSavingTaxa] = useState(false);

  // Form states for Taxa
  const [showTaxaModal, setShowTaxaModal] = useState(false);
  const [taxaMin, setTaxaMin] = useState('');
  const [taxaMax, setTaxaMax] = useState('');
  const [taxaValor, setTaxaValor] = useState('');
  const [editTaxaId, setEditTaxaId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: configData } = await supabase.from('configuracoes').select('*').eq('id', 'loja').single();
      const { data: taxasData } = await supabase.from('taxas_entrega').select('*').order('distancia_min', { ascending: true });

      if (configData) setConfig(configData);
      if (taxasData) setTaxas(taxasData);
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleValidateAddress = async () => {
    if (!config?.endereco) return;
    
    setIsValidatingAddress(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(config.endereco)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setConfig(prev => prev ? { ...prev, latitude: lat, longitude: lon } : null);
        alert(`Localização encontrada!\nLatitude: ${lat}\nLongitude: ${lon}`);
      } else {
        alert('Endereço não encontrado. Tente ser mais específico (inclua cidade e estado).');
      }
    } catch (err) {
      console.error('Erro ao validar endereço:', err);
      alert('Erro ao consultar serviço de mapas.');
    } finally {
      setIsValidatingAddress(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSavingConfig(true);
    try {
      const { error } = await supabase
        .from('configuracoes')
        .update({
          endereco: config.endereco,
          latitude: config.latitude,
          longitude: config.longitude,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'loja');

      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (err: any) {
      console.error('Erro detalhado ao salvar config:', err);
      const errorMsg = err?.message || 'Erro desconhecido ao salvar configuração.';
      alert(`Erro: ${errorMsg}. Verifique se você executou o código SQL no Supabase.`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveTaxa = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTaxa(true);

    const payload = {
      distancia_min: parseFloat(taxaMin.replace(',', '.')),
      distancia_max: parseFloat(taxaMax.replace(',', '.')),
      valor: parseFloat(taxaValor.replace(',', '.')),
    };

    try {
      if (editTaxaId) {
        const { error } = await supabase.from('taxas_entrega').update(payload).eq('id', editTaxaId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('taxas_entrega').insert(payload);
        if (error) throw error;
      }
      
      setShowTaxaModal(false);
      resetTaxaForm();
      fetchData();
    } catch (err: any) {
      console.error('Erro detalhado ao salvar taxa:', err);
      const errorMsg = err?.message || 'Erro desconhecido ao salvar taxa.';
      alert(`Erro: ${errorMsg}. Verifique se você executou o código SQL no Supabase.`);
    } finally {
      setSavingTaxa(false);
    }
  };

  const handleDeleteTaxa = async (id: string) => {
    if (!confirm('Excluir esta taxa?')) return;
    try {
      await supabase.from('taxas_entrega').delete().eq('id', id);
      fetchData();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const resetTaxaForm = () => {
    setTaxaMin('');
    setTaxaMax('');
    setTaxaValor('');
    setEditTaxaId(null);
  };

  const openEditTaxa = (taxa: DBTaxaEntrega) => {
    setTaxaMin(taxa.distancia_min.toString().replace('.', ','));
    setTaxaMax(taxa.distancia_max.toString().replace('.', ','));
    setTaxaValor(taxa.valor.toFixed(2).replace('.', ','));
    setEditTaxaId(taxa.id);
    setShowTaxaModal(true);
  };

  if (loading) return <LoadingScreen message="Carregando configurações..." fullScreen />;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="text-[32px] font-black tracking-tight" style={{ fontFamily: 'var(--font-display-alt)', color: 'var(--cp-ink)' }}>
          Configurações da Loja
        </h1>
        <p className="text-[14px] text-zinc-500 font-medium">Configure o endereço da pizzaria e as taxas de entrega por distância.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Endereço da Pizzaria */}
        <section className="bg-white rounded-3xl p-8 border-2 border-[var(--cp-line-strong)] shadow-sm">
          <h2 className="text-[20px] font-black mb-6 uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-body)' }}>
            <span className="w-8 h-8 rounded-lg bg-[var(--cp-red)] text-white flex items-center justify-center text-sm">📍</span>
            Endereço da Pizzaria
          </h2>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div>
              <FieldLabel label="Endereço Completo" required />
                <FieldInput 
                  value={config?.endereco || ''} 
                  onChange={(v) => setConfig(prev => prev ? { ...prev, endereco: v } : null)} 
                  placeholder="Ex: Rua das Pizzas, 123, São Paulo - SP" 
                  required 
                />
                <button
                  type="button"
                  onClick={handleValidateAddress}
                  disabled={isValidatingAddress || !config?.endereco}
                  className="mt-2 w-full py-2 bg-[var(--cp-dough)] border-2 border-[var(--cp-ink)] rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
                >
                  {isValidatingAddress ? 'Buscando Coordenadas...' : '🔍 Buscar Coordenadas Automaticamente'}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel label="Latitude" required />
                <FieldInput 
                  value={config?.latitude?.toString() || ''} 
                  onChange={(v) => setConfig(prev => prev ? { ...prev, latitude: parseFloat(v) || 0 } : null)} 
                  placeholder="-23.5505" 
                  type="number"
                  required 
                />
              </div>
              <div>
                <FieldLabel label="Longitude" required />
                <FieldInput 
                  value={config?.longitude?.toString() || ''} 
                  onChange={(v) => setConfig(prev => prev ? { ...prev, longitude: parseFloat(v) || 0 } : null)} 
                  placeholder="-46.6333" 
                  type="number"
                  required 
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200 flex gap-3 items-start">
              <AlertIcon size={20} className="text-orange-500 flex-none mt-0.5" />
              <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider leading-relaxed">
                As coordenadas (Latitude/Longitude) são cruciais para o cálculo automático da distância. Use ferramentas como Google Maps para obter esses valores.
              </p>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              loading={savingConfig}
              className="w-full h-12"
            >
              Salvar Endereço
            </Button>
          </form>
        </section>

        {/* Taxas de Entrega */}
        <section className="bg-white rounded-3xl p-8 border-2 border-[var(--cp-line-strong)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-black uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-body)' }}>
              <span className="w-8 h-8 rounded-lg bg-[var(--cp-red)] text-white flex items-center justify-center text-sm">🚚</span>
              Taxas de Entrega
            </h2>
            <button 
              onClick={() => { resetTaxaForm(); setShowTaxaModal(true); }}
              className="w-10 h-10 rounded-xl border-2 border-[var(--cp-ink)] bg-white flex items-center justify-center hover:bg-[var(--cp-dough)] transition-all shadow-[0_3px_0_0_var(--cp-line-strong)] active:shadow-none active:translate-y-1"
            >
              <PlusIcon size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {taxas.length === 0 ? (
              <div className="py-10 text-center opacity-30 italic text-sm font-bold">Nenhuma taxa cadastrada</div>
            ) : (
              taxas.map((taxa) => (
                <div key={taxa.id} className="flex items-center justify-between p-4 rounded-2xl border-2 border-[var(--cp-line)] hover:border-[var(--cp-ink)] transition-all group">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-black text-[var(--cp-ink)]">
                      {taxa.distancia_min}km até {taxa.distancia_max}km
                    </span>
                    <span className="text-[12px] font-bold text-[var(--cp-red)]">
                      R$ {taxa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditTaxa(taxa)} className="w-8 h-8 rounded-lg border-2 border-zinc-200 flex items-center justify-center hover:bg-zinc-50">
                      <EditIcon size={14} />
                    </button>
                    <button onClick={() => handleDeleteTaxa(taxa.id)} className="w-8 h-8 rounded-lg border-2 border-zinc-200 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200">
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Modal Taxa */}
      {showTaxaModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 border-4 border-[var(--cp-ink)] shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-[24px] font-black mb-6 uppercase tracking-tight" style={{ fontFamily: 'var(--font-display-alt)' }}>
              {editTaxaId ? 'Editar Taxa' : 'Nova Taxa'}
            </h3>
            
            <form onSubmit={handleSaveTaxa} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel label="Distância Mín (km)" required />
                  <FieldInput value={taxaMin} onChange={setTaxaMin} placeholder="0,0" required />
                </div>
                <div>
                  <FieldLabel label="Distância Máx (km)" required />
                  <FieldInput value={taxaMax} onChange={setTaxaMax} placeholder="2,0" required />
                </div>
              </div>
              <div>
                <FieldLabel label="Valor da Taxa" required />
                <FieldCurrencyInput value={taxaValor} onChange={setTaxaValor} placeholder="0,00" required />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setShowTaxaModal(false)}>Cancelar</Button>
                <Button type="submit" variant="primary" className="flex-1" loading={savingTaxa}>
                  {editTaxaId ? 'Salvar Alterações' : 'Adicionar Taxa'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
