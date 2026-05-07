'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User, Bike, CreditCard, Banknote, ChevronDown, Package, Clock, CheckCircle2, MapPin, Navigation, X, Printer, MessageCircle, Map, Ban } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

type Pedido = {
  id: string;
  numero_pedido: number;
  cliente_nome: string;
  cliente_telefone: string;
  tipo_entrega: string;
  endereco_entrega: string | null;
  taxa_entrega: number;
  subtotal: number;
  total: number;
  metodo_pagamento: string;
  troco_para: number | null;
  status: 'pendente' | 'aceito' | 'pronto' | 'entrega' | 'concluido' | 'cancelado';
  justificativa_cancelamento?: string | null;
  itens: any[];
  criado_em: string;
};

const formatPrice = (price: number) => {
  return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Agora mesmo';
  if (diffInMinutes < 60) return `Recebido há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  return `Recebido há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
};

const statusOptions = [
  { value: 'pendente', label: 'Pendente', color: 'bg-orange-500', text: 'text-white' },
  { value: 'aceito', label: 'Aceito', color: 'bg-blue-500', text: 'text-white' },
  { value: 'pronto', label: 'Pronto', color: 'bg-green-600', text: 'text-white' },
  { value: 'entrega', label: 'Em entrega', color: 'bg-indigo-500', text: 'text-white' },
  { value: 'concluido', label: 'Concluído', color: 'bg-green-500', text: 'text-white' },
];

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Pedido['status']>('pendente');
  const [now, setNow] = useState(Date.now());
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    // Atualizar tempo relativo a cada minuto
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchPedidos = async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('criado_em', { ascending: false });
    
    if (data) {
      setPedidos(data as Pedido[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPedidos();

    // Subscribe para atualizações em tempo real
    const channel = supabase
      .channel('pedidos_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        (payload) => {
          console.log('Realtime Update:', payload);
          fetchPedidos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, novoStatus: string) => {
    // Optimistic update
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status: novoStatus as any } : p));
    
    const { error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', id);
      
    if (error) {
      console.error('Erro ao atualizar status', error);
      fetchPedidos(); // reverter se der erro
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedPedido) return;
    if (!cancelReason.trim()) {
      alert('Por favor, informe uma justificativa para o cancelamento.');
      return;
    }

    // Optimistic update
    setPedidos(prev => prev.map(p => 
      p.id === selectedPedido.id 
        ? { ...p, status: 'cancelado', justificativa_cancelamento: cancelReason } 
        : p
    ));

    const { error } = await supabase
      .from('pedidos')
      .update({ 
        status: 'cancelado',
        justificativa_cancelamento: cancelReason
      })
      .eq('id', selectedPedido.id);

    if (error) {
      console.error('Erro ao cancelar pedido', error);
      fetchPedidos();
      alert('Ocorreu um erro ao cancelar. Tente novamente.');
      return;
    }

    const telefone = selectedPedido.cliente_telefone.replace(/\D/g, '');
    const mensagem = `Olá ${selectedPedido.cliente_nome}, infelizmente seu pedido #${selectedPedido.numero_pedido} na Center Pizza foi cancelado.\n\n*Motivo:* ${cancelReason}\n\nPedimos desculpas pelo transtorno.`;
    const waUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(waUrl, '_blank');

    setIsCanceling(false);
    setCancelReason('');
    setSelectedPedido(null);
  };

  const tabs = [
    { id: 'pendente', label: 'Pendentes' },
    { id: 'aceito', label: 'Aceito' },
    { id: 'pronto', label: 'Pronto' },
    { id: 'entrega', label: 'Em entrega' },
    { id: 'concluido', label: 'Concluído' },
    { id: 'cancelado', label: 'Cancelado' }
  ];

  const counts = useMemo(() => {
    const acc = { pendente: 0, aceito: 0, pronto: 0, entrega: 0, concluido: 0, cancelado: 0 };
    pedidos.forEach(p => {
      if (acc[p.status as keyof typeof acc] !== undefined) {
        acc[p.status as keyof typeof acc]++;
      }
    });
    return acc;
  }, [pedidos]);

  const filteredPedidos = pedidos.filter(p => p.status === activeTab);

  if (loading) return <LoadingScreen message="Carregando pedidos..." />;

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)] relative" style={{ backgroundColor: 'var(--bg-1)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .receipt-cut {
          background-color: white;
          --mask: 
            linear-gradient(#000 0 0) top/100% calc(100% - 6px) no-repeat,
            radial-gradient(4.24px at 50% 100%, #0000 99%, #000 101%) bottom/12px 6px repeat-x;
          -webkit-mask: var(--mask);
          mask: var(--mask);
          padding-bottom: 14px;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-modal, .printable-modal * {
            visibility: visible;
          }
          .printable-modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important; /* Tamanho comum de cupom */
            margin: 0 !important;
            padding: 10px !important;
            box-shadow: none !important;
            background: white !important;
            border: none !important;
            -webkit-mask: none !important;
            mask: none !important;
            overflow: visible !important;
            max-height: none !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
        }
      `}} />

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-10">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Pedido['status'])}
            className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border-2 cursor-pointer transition-all font-black text-[13px] uppercase tracking-wider active:translate-y-[3px] active:shadow-none
              ${activeTab === tab.id 
                ? 'bg-[var(--cp-red)] text-white hover:brightness-110' 
                : 'bg-[var(--cp-dough)] text-[var(--cp-ink)] hover:brightness-95'
              }`}
            style={{
              borderColor: 'var(--cp-ink)',
              boxShadow: activeTab === tab.id ? '0 4px 0 0 var(--cp-ink)' : '0 3px 0 0 var(--cp-ink)'
            }}
          >
            {tab.label}
            <span className={`flex items-center justify-center min-w-[24px] h-6 px-2 rounded-lg border-2 text-[12px] font-black
              ${activeTab === tab.id ? 'bg-[var(--cp-ink)] text-white border-[var(--cp-ink)]' : 'bg-white border-[var(--cp-ink)] text-[var(--cp-ink)]'}`}>
              {counts[tab.id as keyof typeof counts]}
            </span>
          </button>
        ))}
      </div>

      {/* Grid de Pedidos */}
      {filteredPedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-40">
          <Package size={64} className="mb-4" />
          <p className="text-[20px] font-black uppercase tracking-widest text-center" style={{ fontFamily: 'var(--font-display-alt)' }}>
            Nenhum pedido nesta etapa
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPedidos.map(pedido => {
            const statusOpt = statusOptions.find(s => s.value === pedido.status) || statusOptions[0];
            
            return (
              <div 
                key={pedido.id} 
                style={{ filter: 'drop-shadow(0px 6px 16px rgba(0,0,0,0.06))' }}
                className="mt-2"
              >
                <div 
                  className="receipt-cut px-6 pt-5 relative flex flex-col h-full rounded-t-xl cursor-pointer hover:brightness-95 transition-all"
                  style={{ borderTop: '8px solid var(--cp-ink)' }}
                  onClick={() => setSelectedPedido(pedido)}
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between mb-5 mt-1">
                    <span className="text-[20px] font-black" style={{ color: 'var(--cp-ink)' }}>
                      #{pedido.numero_pedido}
                    </span>
                    
                    {/* Select Status */}
                    <div className="relative group">
                      <select
                        value={pedido.status}
                        onChange={(e) => { e.stopPropagation(); updateStatus(pedido.id, e.target.value); }}
                        onClick={(e) => e.stopPropagation()}
                        className="appearance-none outline-none cursor-pointer pl-3 pr-8 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-transform active:translate-y-[2px] active:shadow-none bg-[var(--cp-red)] text-white hover:brightness-90"
                        style={{
                          border: '2px solid var(--cp-ink)',
                          boxShadow: '0 2px 0 0 var(--cp-ink)',
                          fontFamily: 'var(--font-body)'
                        }}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-white text-[var(--cp-ink)] font-bold">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white" style={{ marginTop: '-1px' }} />
                    </div>
                  </div>

                  {/* Info Cliente */}
                  <div className="space-y-3 mb-5 flex-1">
                    <div className="flex items-start gap-3" style={{ color: 'var(--cp-ink)' }}>
                      <div className="w-5 flex justify-center flex-none mt-0.5">
                        <User size={18} strokeWidth={2.5} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-black leading-none">{pedido.cliente_nome}</span>
                        <span className="text-[11px] font-medium text-[#8B7E74] mt-1">{pedido.cliente_telefone}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3" style={{ color: 'var(--cp-ink)' }}>
                      <div className="w-5 flex justify-center flex-none mt-0.5">
                        {pedido.tipo_entrega === 'entrega' ? <Bike size={21} strokeWidth={2.5} /> : <Package size={18} strokeWidth={2.5} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold capitalize leading-none">{pedido.tipo_entrega}</span>
                        {pedido.tipo_entrega === 'entrega' && pedido.endereco_entrega && (
                          <span className="text-[11px] font-medium text-[#8B7E74] mt-1 line-clamp-1">{pedido.endereco_entrega}</span>
                        )}
                        {pedido.tipo_entrega === 'retirada' && (
                          <span className="text-[11px] font-medium text-[#8B7E74] mt-1">Retirada no balcão</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3" style={{ color: 'var(--cp-ink)' }}>
                      <div className="w-5 flex justify-center flex-none mt-0.5">
                        {pedido.metodo_pagamento === 'dinheiro' ? <Banknote size={18} strokeWidth={2.5} /> : <CreditCard size={18} strokeWidth={2.5} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold capitalize leading-none">{pedido.metodo_pagamento}</span>
                        {pedido.metodo_pagamento === 'dinheiro' && pedido.troco_para && (
                          <span className="text-[12px] font-medium text-[#6B5D56] mt-1">Troco p/ R$ {formatPrice(pedido.troco_para)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Linha Divisória */}
                  <div className="border-b-2 border-dashed border-[#EBE3DB] w-full mb-4"></div>

                  {/* Rodapé do Card */}
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-[12px] font-medium text-[#8B7E74]">
                      {getRelativeTime(pedido.criado_em)}
                    </span>
                    
                    <div className="flex items-baseline gap-1" style={{ color: 'var(--cp-red)' }}>
                      <span className="text-[14px] font-black">R$</span>
                      <span className="text-[20px] font-black leading-none" style={{ fontFamily: 'var(--font-display-alt)' }}>
                        {formatPrice(pedido.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes do Pedido */}
      {selectedPedido && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#1F1B1A]/60 backdrop-blur-sm no-print"
            onClick={() => { setSelectedPedido(null); setIsCanceling(false); setCancelReason(''); }}
          ></div>
          
          {/* Modal Content - Receipt Style */}
          <div 
            className="printable-modal receipt-cut relative w-full max-w-[420px] max-h-[90vh] rounded-t-xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{ backgroundColor: 'white', borderTop: '8px solid var(--cp-ink)' }}
          >
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 pt-5 pb-4 flex-none">
              <div className="flex items-center gap-3">
                <span className="text-[20px] font-black" style={{ color: 'var(--cp-ink)' }}>#{selectedPedido.numero_pedido}</span>
                <span className="text-[13px] font-medium text-[#8B7E74]">
                  {getRelativeTime(selectedPedido.criado_em)}
                </span>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button 
                  onClick={() => window.print()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border-2 cursor-pointer hover:brightness-95 active:translate-y-[2px] active:shadow-none transition-all flex-none"
                  style={{
                    backgroundColor: 'var(--cp-dough)',
                    borderColor: 'var(--cp-ink)',
                    color: 'var(--cp-ink)',
                    boxShadow: '0 2px 0 0 var(--cp-ink)'
                  }}
                  title="Imprimir Comanda"
                >
                  <Printer size={15} strokeWidth={3} style={{ marginTop: '-1px' }} />
                </button>
                <button 
                  onClick={() => { setSelectedPedido(null); setIsCanceling(false); setCancelReason(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 cursor-pointer hover:brightness-95 text-[11px] font-black uppercase tracking-wider active:translate-y-[2px] active:shadow-none transition-all"
                  style={{
                    backgroundColor: 'var(--cp-dough)',
                    borderColor: 'var(--cp-ink)',
                    color: 'var(--cp-ink)',
                    boxShadow: '0 2px 0 0 var(--cp-ink)'
                  }}
                >
                  <X size={14} strokeWidth={3} style={{ marginTop: '-1px' }} /> Fechar
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-2">
              
              {/* Cards de Info */}
              <div className="space-y-4 mb-6">
                {/* Cliente */}
                <div 
                  className="flex items-center p-3.5 rounded-xl border-2 gap-3.5"
                  style={{ backgroundColor: 'white', borderColor: 'var(--cp-ink)' }}
                >
                  <div 
                    className="w-11 h-11 rounded-lg border-2 flex items-center justify-center flex-none"
                    style={{ backgroundColor: 'var(--cp-dough)', borderColor: 'var(--cp-ink)', boxShadow: '0 2px 0 0 var(--cp-ink)', color: 'var(--cp-ink)' }}
                  >
                    <User size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[14px] font-black truncate pr-2" style={{ color: 'var(--cp-ink)' }}>{selectedPedido.cliente_nome}</span>
                    <span className="text-[11px] font-medium text-[#8B7E74] leading-tight mt-0.5">
                      {new Date(selectedPedido.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {new Date(selectedPedido.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-col items-end justify-center pr-1">
                    <span className="text-[12px] font-bold" style={{ color: 'var(--cp-ink)' }}>{selectedPedido.cliente_telefone}</span>
                  </div>
                  <a 
                    href={`https://wa.me/55${selectedPedido.cliente_telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 flex items-center justify-center rounded-lg border-2 cursor-pointer hover:brightness-95 active:translate-y-[2px] active:shadow-none transition-all flex-none no-print"
                    style={{ backgroundColor: '#25D366', borderColor: 'var(--cp-ink)', boxShadow: '0 2px 0 0 var(--cp-ink)', color: 'white' }}
                  >
                    <MessageCircle size={18} strokeWidth={2.5} />
                  </a>
                </div>

                {/* Pagamento */}
                <div 
                  className="flex items-center p-3.5 rounded-xl border-2 gap-3.5"
                  style={{ backgroundColor: 'white', borderColor: 'var(--cp-ink)' }}
                >
                  <div 
                    className="w-11 h-11 rounded-lg border-2 flex items-center justify-center flex-none"
                    style={{ backgroundColor: 'var(--cp-dough)', borderColor: 'var(--cp-ink)', boxShadow: '0 2px 0 0 var(--cp-ink)', color: 'var(--cp-ink)' }}
                  >
                    {selectedPedido.metodo_pagamento === 'dinheiro' ? <Banknote size={20} strokeWidth={2.5} /> : <CreditCard size={20} strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[14px] font-black capitalize leading-tight" style={{ color: 'var(--cp-ink)' }}>{selectedPedido.metodo_pagamento}</span>
                    {selectedPedido.metodo_pagamento === 'dinheiro' && selectedPedido.troco_para && (
                      <span className="text-[12px] font-medium text-[#6B5D56] mt-0.5">Troco para: R$ {formatPrice(selectedPedido.troco_para)}</span>
                    )}
                  </div>
                </div>

                {/* Entrega/Endereço */}
                <div 
                  className="flex items-center p-3.5 rounded-xl border-2 gap-3.5"
                  style={{ backgroundColor: 'white', borderColor: 'var(--cp-ink)' }}
                >
                  <div 
                    className="w-11 h-11 rounded-lg border-2 flex items-center justify-center flex-none"
                    style={{ backgroundColor: 'var(--cp-dough)', borderColor: 'var(--cp-ink)', boxShadow: '0 2px 0 0 var(--cp-ink)', color: 'var(--cp-ink)' }}
                  >
                    {selectedPedido.tipo_entrega === 'entrega' ? <Bike size={23} strokeWidth={2.5} /> : <Package size={20} strokeWidth={2.5} />}
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
                    <span className="text-[14px] font-black capitalize leading-none mb-1" style={{ color: 'var(--cp-ink)' }}>
                      {selectedPedido.tipo_entrega}
                    </span>
                    <span className="text-[11px] font-medium text-[#8B7E74] leading-tight line-clamp-2">
                      {selectedPedido.tipo_entrega === 'entrega' ? selectedPedido.endereco_entrega : 'O cliente virá retirar no balcão'}
                    </span>
                  </div>
                  {selectedPedido.tipo_entrega === 'entrega' && selectedPedido.endereco_entrega && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedPedido.endereco_entrega)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 flex items-center justify-center rounded-lg border-2 cursor-pointer hover:brightness-95 active:translate-y-[2px] active:shadow-none transition-all flex-none no-print"
                      style={{ backgroundColor: 'var(--cp-dough)', borderColor: 'var(--cp-ink)', boxShadow: '0 2px 0 0 var(--cp-ink)', color: 'var(--cp-ink)' }}
                    >
                      <Map size={18} strokeWidth={2.5} />
                    </a>
                  )}
                </div>
              </div>

              {/* Itens Lista */}
              <div>
                {selectedPedido.itens?.map((item: any, idx: number) => (
                  <div key={idx} className="py-3 border-b border-dashed border-[#EBE3DB]">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-[13px] font-bold text-[#1F1B1A]">{item.quantidade}x {item.nome}</span>
                      <span className="text-[13px] font-bold text-[#1F1B1A]">R$ {formatPrice(item.total)}</span>
                    </div>
                    
                    {item.opcoes && item.opcoes.length > 0 && (
                      <div className="space-y-0.5 mt-1">
                        {item.opcoes.map((opt: any, oIdx: number) => {
                          const optionPrice = opt.itens?.reduce((acc: number, i: any) => acc + (Number(i.valor) || 0), 0) * item.quantidade;
                          return (
                            <div key={oIdx} className="flex justify-between items-center text-[12px] text-[#6B5D56] font-medium">
                              <span>
                                {item.quantidade}x {opt.itens?.map((i: any) => i.nome).join(opt.is_meio_a_meio ? ' / ' : ', ')}
                              </span>
                              <span>{optionPrice > 0 ? `+ R$ ${formatPrice(optionPrice)}` : ''}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {item.observacao && (
                      <div className="text-[12px] text-[#8B7E74] italic mt-1">- {item.observacao}</div>
                    )}
                  </div>
                ))}

                {/* Taxa de Entrega */}
                <div className="py-3.5 flex justify-between items-center border-b border-dashed border-[#EBE3DB]">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-[#1F1B1A]">
                    <Bike size={16} strokeWidth={2.5} /> Taxa de entrega
                  </div>
                  <span className="text-[13px] font-bold text-[#1F1B1A]">
                    {selectedPedido.taxa_entrega > 0 ? `+ R$ ${formatPrice(selectedPedido.taxa_entrega)}` : 'Grátis'}
                  </span>
                </div>
              </div>

              {/* Footer Fixo Modal */}
              <div className="pt-5 pb-3">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-[16px] font-black" style={{ color: 'var(--cp-ink)' }}>Total</span>
                  <span className="text-[20px] font-black leading-none" style={{ fontFamily: 'var(--font-display-alt)', color: 'var(--cp-red)' }}>
                    R$ {formatPrice(selectedPedido.total)}
                  </span>
                </div>
                
                {isCanceling ? (
                  <div className="no-print space-y-3 w-full animate-in fade-in zoom-in-95 duration-200">
                    <textarea 
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Motivo do cancelamento (ex: Falta de ingrediente, fora da área de entrega)..."
                      className="w-full p-3 rounded-lg border-2 text-[13px] font-bold outline-none focus:border-[#E28743] resize-none"
                      style={{ borderColor: 'var(--cp-ink)', backgroundColor: 'white', color: 'var(--cp-ink)' }}
                      rows={2}
                    />
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => { setIsCanceling(false); setCancelReason(''); }}
                        className="px-4 py-2 rounded-lg font-bold text-[13px] text-[#6B5D56] hover:bg-[#EBE3DB] transition-colors"
                      >
                        Voltar
                      </button>
                      <button 
                        onClick={handleCancelOrder}
                        className="px-6 py-2 border-2 rounded-lg cursor-pointer hover:brightness-90 text-[13px] font-black text-white uppercase tracking-wider active:translate-y-[3px] active:shadow-none transition-all"
                        style={{ backgroundColor: 'var(--cp-red)', borderColor: 'var(--cp-ink)', boxShadow: '0 3px 0 0 var(--cp-ink)' }}
                      >
                        Confirmar Cancelamento
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 no-print w-full">
                    {selectedPedido.status === 'pendente' && (
                      <button 
                        onClick={() => setIsCanceling(true)}
                        className="w-[46px] h-[46px] flex items-center justify-center rounded-lg border-2 cursor-pointer hover:brightness-95 active:translate-y-[3px] active:shadow-none transition-all flex-none"
                        style={{
                          backgroundColor: 'var(--cp-dough)',
                          borderColor: 'var(--cp-ink)',
                          color: 'var(--cp-red)',
                          boxShadow: '0 3px 0 0 var(--cp-ink)'
                        }}
                        title="Cancelar Pedido"
                      >
                        <Ban size={22} strokeWidth={2.5} />
                      </button>
                    )}
                    
                    {selectedPedido.status !== 'cancelado' && (
                      <button 
                        onClick={() => {
                          const nextStatus = selectedPedido.status === 'pendente' ? 'aceito' : 
                                           selectedPedido.status === 'aceito' ? 'pronto' : 
                                           selectedPedido.status === 'pronto' ? 'entrega' : 'concluido';
                          updateStatus(selectedPedido.id, nextStatus);
                          setSelectedPedido(null);
                        }}
                        className="flex-1 px-6 py-2.5 border-2 rounded-lg cursor-pointer hover:brightness-90 text-[13px] font-black text-white uppercase tracking-wider active:translate-y-[3px] active:shadow-none transition-all"
                        style={{
                          backgroundColor: 'var(--cp-red)',
                          borderColor: 'var(--cp-ink)',
                          boxShadow: '0 3px 0 0 var(--cp-ink)'
                        }}
                      >
                        {selectedPedido.status === 'pendente' ? 'Aceitar Pedido' : 
                         selectedPedido.status === 'aceito' ? 'Pedido Pronto' : 
                         selectedPedido.status === 'pronto' ? 'Enviar para Entrega' : 
                         selectedPedido.status === 'entrega' ? 'Concluir Pedido' : 'Pedido Concluído'}
                      </button>
                    )}
                    
                    {selectedPedido.status === 'cancelado' && (
                      <div className="w-full bg-[#FFE5E5] border-2 border-[var(--cp-red)] rounded-xl p-3 text-center">
                        <span className="text-[14px] font-black text-[var(--cp-red)]">PEDIDO CANCELADO</span>
                        {selectedPedido.justificativa_cancelamento && (
                          <p className="text-[12px] font-medium text-[var(--cp-red)] mt-1">
                            Motivo: {selectedPedido.justificativa_cancelamento}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
