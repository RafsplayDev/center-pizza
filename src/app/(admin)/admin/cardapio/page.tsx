'use client';

// =============================================================
// Center Pizza · Cardápio — Edição do Cardápio
// Rota: /admin/cardapio  (funcional com Supabase)
// =============================================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  SearchIcon,
  PlusIcon,
  DragIcon,
  EditIcon,
  TrashIcon,
  ChevronUpIcon,
  ExpandIcon,
  LayersIcon,
  AlertIcon,
  TagIcon,
  ClockIcon,
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
// Tipos (DB)
// -------------------------------------------------------------
type DBCategoria = {
  id: string;
  nome: string;
  descricao: string;
  posicao: number;
  ativa: boolean;
  active_days: number[];
  created_at: string;
};

type DBProduto = {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string;
  preco_venda: number;
  imagem_url: string | null;
  visivel: boolean;
  posicao: number;
  created_at: string;
};

type CategoriaComProdutos = DBCategoria & { produtos: DBProduto[] };

type DBComplementoOpcao = {
  id?: string;
  nome: string;
  descricao: string;
  valor: string; // Keep as string for input
  posicao?: number;
  ativo?: boolean;
  modelo_opcao_origem_id?: string;
};

type DBComplemento = {
  id: string;
  produto_id: string;
  nome: string;
  descricao: string;
  tipo: 'simples' | 'multiplo';
  valor: number;
  min_opcoes: number;
  max_opcoes: number;
  posicao: number;
  created_at?: string;
  is_modelo: boolean;
  ativo: boolean;
  modelo_origem_id?: string;
  is_meio_a_meio?: boolean;
  complemento_opcoes?: DBComplementoOpcao[];
};

type DBTag = {
  id: string;
  nome: string;
};

type DBProdutoTag = {
  produto_id: string;
  tag_id: string;
};

// -------------------------------------------------------------
// IconBtn
// -------------------------------------------------------------
function IconBtn({
  children, title, onClick, variant = 'subtle',
}: {
  children: React.ReactNode; title: string; onClick?: () => void; variant?: 'subtle' | 'square' | 'danger';
}) {
  const isAction = variant === 'square' || variant === 'danger';
  
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`w-8 h-8 grid place-items-center rounded-lg border-2 cursor-pointer transition-all duration-200`}
      style={{ 
        backgroundColor: variant === 'square' ? 'var(--cp-dough)' : variant === 'danger' ? 'var(--cp-flour)' : 'transparent',
        borderColor: isAction ? 'var(--cp-ink)' : 'transparent',
        color: 'var(--cp-ink)',
        boxShadow: isAction ? '0 2px 0 0 var(--cp-line-strong)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (isAction) {
          e.currentTarget.style.backgroundColor = variant === 'danger' ? 'rgba(227,6,19,0.08)' : 'var(--cp-flour)';
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 3px 0 0 var(--cp-line-strong)';
          if (variant === 'danger') e.currentTarget.style.color = 'var(--cp-red)';
        }
      }}
      onMouseLeave={(e) => {
        if (isAction) {
          e.currentTarget.style.backgroundColor = variant === 'square' ? 'var(--cp-dough)' : 'var(--cp-flour)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 0 0 var(--cp-line-strong)';
          e.currentTarget.style.color = 'var(--cp-ink)';
        }
      }}
    >
      {children}
    </button>
  );
}

// -------------------------------------------------------------
// Modal genérica
// -------------------------------------------------------------
function Modal({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ backgroundColor: 'rgba(31,27,26,0.55)' }}
    >
      <div
        className="w-full max-w-[520px] max-h-[90vh] rounded-3xl p-6 mx-4 animate-fade-in-up flex flex-col"
        style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 flex-none">
          <span
            className="text-[22px] font-black tracking-tight"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--cp-ink)' }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            className="w-10 h-10 grid place-items-center rounded-full border-2 bg-transparent cursor-pointer transition-all"
            style={{ color: 'var(--cp-ink-muted)', borderColor: 'var(--cp-line)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cp-ink)'; e.currentTarget.style.color = 'var(--cp-ink)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--cp-line)'; e.currentTarget.style.color = 'var(--cp-ink-muted)'; }}
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 pr-2 -mr-2 pb-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {children}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Label + Input helpers
// -------------------------------------------------------------
const formatPrice = (price: number | string | null) => {
  const p = Number(price);
  if (p === 0) return 'Grátis';
  return `R$ ${p.toFixed(2).replace('.', ',')}`;
};

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label
      className="text-[10px] font-black tracking-[0.12em] uppercase flex items-center gap-1"
      style={{ color: 'var(--cp-ink)' }}
    >
      {label}
      {required && <span style={{ color: 'var(--cp-red)' }}>*</span>}
    </label>
  );
}

function formatCurrency(value: string) {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  
  // Converte para centavos
  const cents = parseInt(digits);
  const formatted = (cents / 100).toFixed(2).replace('.', ',');
  
  // Adiciona separador de milhar se necessário
  if (formatted.length > 6) {
    const parts = formatted.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(',');
  }
  
  return formatted;
}

function FieldCurrencyInput({
  value, onChange, placeholder, required,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold opacity-40">R$</span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
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

function FieldInput({
  value, onChange, placeholder, type = 'text', required,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
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

function FieldTextarea({
  value, onChange, placeholder, required,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      rows={3}
      className="w-full py-2.5 px-3 rounded-lg border-2 text-[14px] font-semibold outline-none transition-colors resize-y"
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

// -------------------------------------------------------------
// Switch Component
// -------------------------------------------------------------
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--cp-ink-faint)' }}>{label}</span>}
      <div 
        onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
        className="w-[44px] h-[26px] rounded-lg relative cursor-pointer transition-all duration-200 border-2 flex items-center px-1"
        style={{ 
          backgroundColor: checked ? 'var(--cp-red)' : 'var(--cp-flour)',
          borderColor: 'var(--cp-ink)',
          boxShadow: checked ? '0 2px 0 0 var(--cp-red-deep)' : '0 2px 0 0 var(--cp-line-strong)',
        }}
      >
        <div 
          className="w-[14px] h-[14px] rounded-md transition-all duration-200"
          style={{ 
            transform: checked ? 'translateX(20px)' : 'translateX(0)',
            backgroundColor: checked ? 'white' : 'var(--cp-ink)',
          }}
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Product Row
// -------------------------------------------------------------
function ProductRow({
  produto, onDelete, onEdit, onEditImage, onAddComplemento, onAddTag, onToggleVisivel, index, complementosProduto, tagCount, isSearchActive,
}: {
  produto: DBProduto; 
  onDelete: (id: string) => void; 
  onEdit: (produto: DBProduto) => void; 
  onEditImage: (produto: DBProduto) => void;
  onAddComplemento: (id: string) => void;
  onAddTag: (id: string) => void;
  onToggleVisivel: (produto: DBProduto) => void;
  index: number;
  complementosProduto: DBComplemento[];
  tagCount: number;
  isSearchActive: boolean;
}) {
  const startingPrice = calculateStartingPrice(produto, complementosProduto);
  const isFromPrice = startingPrice > Number(produto.preco_venda);
  return (
    <Draggable draggableId={produto.id} index={index} isDragDisabled={isSearchActive}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-center gap-4 py-4 px-4 rounded-2xl transition-all duration-300 group border border-transparent ${snapshot.isDragging ? 'shadow-xl scale-[1.01] z-50 bg-white border-[var(--cp-ink)]' : 'hover:shadow-md hover:border-[var(--cp-line)]'}`}
          style={{ 
            ...provided.draggableProps.style,
            backgroundColor: snapshot.isDragging ? '#fff' : 'transparent' 
          }}
          onMouseEnter={(e) => { if (!snapshot.isDragging) e.currentTarget.style.backgroundColor = '#fff'; }}
          onMouseLeave={(e) => { if (!snapshot.isDragging) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {/* Drag */}
          <span 
            {...provided.dragHandleProps}
            className="flex-none cursor-grab opacity-40 group-hover:opacity-70 transition-opacity" 
            style={{ color: 'var(--cp-ink-muted)' }}
          >
            <DragIcon size={14} />
          </span>

          {/* Image with pencil overlay */}
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden flex-none relative group/img cursor-pointer"
            style={{ backgroundColor: 'var(--cp-dough)', border: '2px solid var(--cp-line)' }}
            onClick={() => onEditImage(produto)}
          >
            {produto.imagem_url ? (
              <Image src={produto.imagem_url} alt={produto.nome} fill sizes="80px" style={{ objectFit: 'cover' }} className="transition-transform duration-500 group-hover/img:scale-110" />
            ) : (
              <div className="w-full h-full grid place-items-center text-3xl opacity-30">📷</div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                <EditIcon size={14} />
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <span
              className="text-[15px] font-bold truncate block"
              style={{ fontFamily: 'var(--font-body)', color: 'var(--cp-ink)' }}
            >
              {produto.nome}
            </span>
            <p className="text-[12px] m-0 mt-0.5 line-clamp-2" style={{ color: 'var(--cp-ink-muted)', maxWidth: '400px' }}>
              {produto.descricao}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex flex-col">
                {isFromPrice && (
                  <span className="text-[9px] font-black uppercase tracking-wider opacity-40 leading-none mb-1">A partir de</span>
                )}
                <span className="text-[14px] font-black" style={{ color: 'var(--cp-red)', fontFamily: 'var(--font-body)' }}>
                  {formatPrice(startingPrice)}
                </span>
              </div>
              {!produto.visivel && (
                <span 
                  className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-[4px] border-2 ml-2 flex-none"
                  style={{
                    backgroundColor: 'var(--cp-red)',
                    color: '#fff',
                    borderColor: 'var(--cp-ink)',
                    boxShadow: '2px 2px 0 0 var(--cp-ink)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  OCULTO
                </span>
              )}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex-none px-2">
            <Switch 
              checked={produto.visivel} 
              onChange={() => onToggleVisivel(produto)} 
              label={produto.visivel ? "" : "Oculto"}
            />
          </div>

          {/* Actions (Square buttons) */}
          <div className="flex items-center gap-2 flex-none">
            <div className="relative group/comp">
              <IconBtn title="Adicionar opcional" variant="square" onClick={() => onAddComplemento(produto.id)}>
                <LayersIcon size={15} />
              </IconBtn>
              {complementosProduto.length > 0 && (
                <span 
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-transform group-hover/comp:scale-110"
                  style={{ 
                    backgroundColor: 'var(--cp-red)', 
                    color: '#fff', 
                    borderColor: '#fff' 
                  }}
                >
                  {complementosProduto.length}
                </span>
              )}
            </div>
            <IconBtn title="Editar" variant="square" onClick={() => onEdit(produto)}>
              <EditIcon size={15} />
            </IconBtn>
            <IconBtn title="Tags" variant="square" onClick={() => onAddTag(produto.id)}>
              <div className="relative">
                <TagIcon size={15} />
                {tagCount > 0 && (
                  <span 
                    className="absolute -top-3 -right-3 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border-2"
                    style={{ backgroundColor: 'var(--cp-ink)', color: '#fff', borderColor: '#fff' }}
                  >
                    {tagCount}
                  </span>
                )}
              </div>
            </IconBtn>
            <IconBtn title="Excluir" variant="danger" onClick={() => onDelete(produto.id)}>
              <TrashIcon size={15} />
            </IconBtn>
          </div>
        </div>
      )}
    </Draggable>
  );
}

// -------------------------------------------------------------
// Botão tracejado "Adicionar"
// -------------------------------------------------------------
function DashedAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl border-2 cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: '#fff',
        borderColor: 'var(--cp-ink)',
        color: 'var(--cp-ink)',
        boxShadow: '0 3px 0 0 var(--cp-line-strong)',
        fontFamily: 'var(--font-body)',
        fontWeight: 800,
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--cp-flour)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 0 0 var(--cp-line-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#fff';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 3px 0 0 var(--cp-line-strong)';
      }}
    >
      <PlusIcon size={14} />
      {label}
    </button>
  );
}

const calculateStartingPrice = (prod: DBProduto, comps: DBComplemento[]) => {
  let base = Number(prod.preco_venda);
  
  if (comps && comps.length > 0) {
    // Apenas complementos ativos
    const activeComps = comps.filter(c => c.ativo !== false);
    
    activeComps.forEach(comp => {
      // Ignora complementos simples para o preço "A partir de", pois agora são sempre opcionais
      if (comp.min_opcoes > 0 && comp.tipo !== 'simples') {
        if (comp.tipo === 'multiplo' && comp.complemento_opcoes) {
          // Se é múltiplo e obrigatório, soma as N opções mais baratas (onde N = min_opcoes)
          const activeOptions = comp.complemento_opcoes.filter(o => o.ativo !== false);
          const sortedOptions = [...activeOptions].sort((a, b) => Number(a.valor) - Number(b.valor));
          
          if (comp.is_meio_a_meio) {
            // Se o admin exige 2 sabores, o preço mínimo é o do 2º sabor mais barato (pois cobra o maior)
            if (comp.min_opcoes === 2 && sortedOptions.length >= 2) {
              base += Number(sortedOptions[1].valor);
            } else {
              base += Number(sortedOptions[0]?.valor || 0);
            }
          } else {
            const count = Math.min(comp.min_opcoes, sortedOptions.length);
            for (let i = 0; i < count; i++) {
              base += Number(sortedOptions[i].valor);
            }
          }
        }
      }
    });
  }
  
  return base;
};

// -------------------------------------------------------------
// Category Section
// -------------------------------------------------------------
function CategorySection({
  categoria,
  onDeleteCategoria,
  onEditCategoria,
  onDeleteProduto,
  onEditProduto,
  onEditImageProduto,
  onAddProduto,
  onAddComplemento,
  onAddTag,
  onToggleAtiva,
  onToggleVisivelProduto,
  index,
  complementos,
  produtoTags,
  expanded,
  onToggleExpand,
  onScheduleCategoria,
  isSearchActive,
}: {
  categoria: CategoriaComProdutos;
  onDeleteCategoria: (id: string) => void;
  onEditCategoria: (categoria: CategoriaComProdutos) => void;
  onDeleteProduto: (id: string) => void;
  onEditProduto: (produto: DBProduto) => void;
  onEditImageProduto: (produto: DBProduto) => void;
  onAddProduto: (categoriaId: string) => void;
  onAddComplemento: (produtoId: string) => void;
  onAddTag: (produtoId: string) => void;
  onToggleAtiva: (categoria: DBCategoria) => void;
  onToggleVisivelProduto: (prod: DBProduto) => void;
  index: number;
  complementos: DBComplemento[];
  produtoTags: Record<string, string[]>;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onScheduleCategoria: (categoria: DBCategoria) => void;
  isSearchActive: boolean;
}) {

  return (
    <Draggable draggableId={categoria.id} index={index} isDragDisabled={isSearchActive}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`rounded-3xl overflow-hidden transition-all duration-300 ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] z-50 border-2 border-[var(--cp-ink)]' : 'shadow-sm hover:shadow-md border border-[var(--cp-line-strong)]'}`}
          style={{ 
            ...provided.draggableProps.style,
            backgroundColor: '#fff', 
            borderTop: snapshot.isDragging ? '5px solid var(--cp-ink)' : '5px solid var(--cp-ink-muted)'
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-4 px-6 py-5 cursor-pointer select-none"
            onClick={() => onToggleExpand(categoria.id)}
            style={{ borderBottom: expanded ? '1px solid var(--cp-line)' : 'none' }}
          >
            <span 
              {...provided.dragHandleProps}
              className="flex-none opacity-50 cursor-grab" 
              style={{ color: 'var(--cp-ink-muted)' }}
            >
              <DragIcon size={14} />
            </span>

            <div className="flex flex-col">
              <span
                className="text-[19px] font-black tracking-tight"
                style={{ fontFamily: 'var(--font-display-alt)', color: 'var(--cp-ink)' }}
              >
                {categoria.nome}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <div 
                  className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-[4px] border-2 transition-all cursor-pointer flex-none"
                  style={{
                    backgroundColor: categoria.ativa ? 'var(--cp-green)' : 'var(--cp-dough)',
                    color: categoria.ativa ? '#fff' : 'var(--cp-ink)',
                    borderColor: 'var(--cp-ink)',
                    boxShadow: '2px 2px 0 0 var(--cp-ink)',
                    fontFamily: 'var(--font-body)',
                  }}
                  onClick={(e) => { e.stopPropagation(); onToggleAtiva(categoria); }}
                >
                  {categoria.ativa ? '● ATIVA' : '○ INATIVA'}
                </div>
                
                {/* Item Count Tag */}
                <span
                  className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-[4px] border-2 flex-none"
                  style={{
                    backgroundColor: 'var(--cp-flour)',
                    color: 'var(--cp-ink)',
                    borderColor: 'var(--cp-ink)',
                    boxShadow: '2px 2px 0 0 var(--cp-ink)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {categoria.produtos.length} {categoria.produtos.length === 1 ? 'ITEM' : 'ITENS'}
                </span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <div className="flex items-center gap-2 mr-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--cp-ink-faint)]">Status</span>
                <Switch checked={!!categoria.ativa} onChange={() => onToggleAtiva(categoria)} />
              </div>

              <IconBtn title="Programar dias" variant="square" onClick={() => onScheduleCategoria(categoria)}>
                <div className="relative">
                  <ClockIcon size={15} />
                  {categoria.active_days && categoria.active_days.length < 7 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--cp-red)] border border-white" />
                  )}
                </div>
              </IconBtn>
              <IconBtn title="Editar categoria" variant="square" onClick={() => onEditCategoria(categoria)}>
                <EditIcon size={15} />
              </IconBtn>
              <IconBtn title="Excluir categoria" variant="danger" onClick={() => onDeleteCategoria(categoria.id)}>
                <TrashIcon size={15} />
              </IconBtn>
              <span
                className="w-8 h-8 grid place-items-center opacity-40 ml-2"
                style={{
                  transform: expanded ? 'rotate(0)' : 'rotate(180deg)',
                  transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ChevronUpIcon size={18} />
              </span>
            </div>
          </div>

          {/* Products */}
          {expanded && (
            <Droppable droppableId={categoria.id} type="PRODUCT">
              {(providedProd) => (
                <div 
                  ref={providedProd.innerRef}
                  {...providedProd.droppableProps}
                  className="px-4 py-3 bg-gray-50/30"
                >
                  {categoria.produtos.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {categoria.produtos.map((p, idx) => (
                        <ProductRow 
                          key={p.id} 
                          produto={p} 
                          onDelete={onDeleteProduto} 
                          onEdit={onEditProduto} 
                          onEditImage={onEditImageProduto}
                          onAddComplemento={onAddComplemento}
                          onAddTag={onAddTag}
                          onToggleVisivel={onToggleVisivelProduto}
                          index={idx}
                          complementosProduto={complementos.filter(c => c.produto_id === p.id)}
                          tagCount={produtoTags[p.id]?.length || 0}
                          isSearchActive={isSearchActive}
                        />
                      ))}
                      {providedProd.placeholder}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs font-bold opacity-30 italic">
                      Nenhum produto nesta categoria
                    </div>
                  )}

                  <div className="mt-4 pb-2">
                    <DashedAddButton
                      label="Adicionar novo produto"
                      onClick={() => onAddProduto(categoria.id)}
                    />
                  </div>
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
}

// =============================================================
// PÁGINA PRINCIPAL
// =============================================================
export default function CardapioPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter'); // 'ativos' or 'inativos'

  const [categorias, setCategorias] = useState<CategoriaComProdutos[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Reset filters on page refresh (initial mount)
    if (filterParam) {
      router.replace(pathname);
    }
  }, []);

  // Complementos
  const [complementos, setComplementos] = useState<DBComplemento[]>([]);
  const [showCompModal, setShowCompModal] = useState(false);
  const [compStep, setCompStep] = useState<number>(0);
  const [compProdutoId, setCompProdutoId] = useState<string | null>(null);
  const [editCompId, setEditCompId] = useState<string | null>(null);
  const [compIsModelo, setCompIsModelo] = useState(false);
  const [compNome, setCompNome] = useState('');
  const [compDescricao, setCompDescricao] = useState('');
  const [compTipo, setCompTipo] = useState<'simples' | 'multiplo'>('simples');
  const [compValor, setCompValor] = useState('');
  const [compMinOpcoes, setCompMinOpcoes] = useState('0');
  const [compMaxOpcoes, setCompMaxOpcoes] = useState('1');
  const [compOpcoes, setCompOpcoes] = useState<DBComplementoOpcao[]>([]);
  const [compSaving, setCompSaving] = useState(false);
  const [compList, setCompList] = useState<DBComplemento[]>([]);
  const [modelosOpcionais, setModelosOpcionais] = useState<DBComplemento[]>([]);
  const [loadingComps, setLoadingComps] = useState(false);
  const [compIsMeioAMeio, setCompIsMeioAMeio] = useState(false);

  // Tags
  const [tags, setTags] = useState<DBTag[]>([]);
  const [produtoTags, setProdutoTags] = useState<Record<string, string[]>>({}); // produtoId -> [tagIds]
  const [showTagModal, setShowTagModal] = useState(false);
  const [selectedProdForTag, setSelectedProdForTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [tagSaving, setTagSaving] = useState(false);

  const addCompOpcao = () => {
    setCompOpcoes([...compOpcoes, { nome: '', descricao: '', valor: '', ativo: true }]);
  };

  const updateCompOpcao = (index: number, key: keyof DBComplementoOpcao, value: any) => {
    const newOpcoes = [...compOpcoes];
    if (key === 'ativo') {
      newOpcoes[index] = { ...newOpcoes[index], ativo: value };
    } else {
      let finalValue = value;
      if (key === 'valor') {
        finalValue = formatCurrency(value);
      }
      newOpcoes[index] = { ...newOpcoes[index], [key]: finalValue };
    }
    setCompOpcoes(newOpcoes);
  };

  const onDragEndOpcoes = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(compOpcoes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setCompOpcoes(items);
  };

  const removeCompOpcao = (index: number) => {
    const newOpcoes = [...compOpcoes];
    newOpcoes.splice(index, 1);
    setCompOpcoes(newOpcoes);
  };

  // Modais
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showProdModal, setShowProdModal] = useState(false);
  const [prodCategoriaId, setProdCategoriaId] = useState<string | null>(null);

  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editProdId, setEditProdId] = useState<string | null>(null);

  // Form categoria
  const [catNome, setCatNome] = useState('');
  const [catDescricao, setCatDescricao] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  // Form produto
  const [prodNome, setProdNome] = useState('');
  const [prodDescricao, setProdDescricao] = useState('');
  const [prodPrecoVenda, setProdPrecoVenda] = useState('');
  const [prodImagemFile, setProdImagemFile] = useState<File | null>(null);
  const [prodImagemPreview, setProdImagemPreview] = useState<string | null>(null);
  const [prodSaving, setProdSaving] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showPriceZeroModal, setShowPriceZeroModal] = useState(false);

  // Agendamento de categoria
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCatForSchedule, setSelectedCatForSchedule] = useState<DBCategoria | null>(null);
  const [tempActiveDays, setTempActiveDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [affectedProducts, setAffectedProducts] = useState<{ id: string, nome: string }[]>([]);
  const [initialCompOpcoes, setInitialCompOpcoes] = useState<DBComplementoOpcao[]>([]);
  const [syncHasAvailabilityChanges, setSyncHasAvailabilityChanges] = useState(false);

  // Estados para Modal de Troca de Imagem
  const [showImgModal, setShowImgModal] = useState(false);
  const [selectedProdForImg, setSelectedProdForImg] = useState<DBProduto | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgSaving, setImgSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // -----------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Confirm Modal state
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({ 
    title: '', 
    message: '', 
    onConfirm: () => {},
    danger: true
  });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const isInitialFetch = useRef(true);

  const askConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmData({ title, message, onConfirm, danger: true });
    setShowConfirm(true);
  };



  const toggleAll = () => {
    if (expandedIds.size === categorias.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(categorias.map(c => c.id)));
    }
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const fetchData = useCallback(async () => {
    const { data: cats } = await supabase
      .from('categorias')
      .select('*')
      .order('posicao', { ascending: true });
    
    const { data: prods } = await supabase
      .from('produtos')
      .select('*')
      .order('posicao', { ascending: true });

    const { data: tagsData } = await supabase.from('tags').select('*');
    const { data: prodTagsData } = await supabase.from('produto_tags').select('*');

    if (tagsData) setTags(tagsData);
    if (prodTagsData) {
      const map: Record<string, string[]> = {};
      prodTagsData.forEach((pt: DBProdutoTag) => {
        if (!map[pt.produto_id]) map[pt.produto_id] = [];
        map[pt.produto_id].push(pt.tag_id);
      });
      setProdutoTags(map);
    }

    const { data: comps } = await supabase
      .from('complementos')
      .select('*, complemento_opcoes(*)')
      .order('posicao', { ascending: true })
      .order('posicao', { referencedTable: 'complemento_opcoes', ascending: true });

    const categoriasList: CategoriaComProdutos[] = (cats || []).map((c: DBCategoria) => ({
      ...c,
      produtos: (prods || []).filter((p: DBProduto) => p.categoria_id === c.id),
    }));

    setCategorias(categoriasList);
    
    // Expansão inicial (apenas no primeiro carregamento bem-sucedido)
    if (isInitialFetch.current && categoriasList.length > 0) {
      setExpandedIds(new Set(categoriasList.map(c => c.id)));
      isInitialFetch.current = false;
    }

    if (comps) {
      setComplementos(comps.filter(c => !c.is_modelo));
      setModelosOpcionais(comps.filter(c => c.is_modelo));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  // -----------------------------------------------------------
  // Busca/Filtro
  // -----------------------------------------------------------
  const filteredCategorias = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    
    return categorias.map(cat => {
      const matchingProds = cat.produtos.filter(p => {
        // 1. Filtro de texto
        const matchesSearch = !searchLower || 
                             p.nome.toLowerCase().includes(searchLower) || 
                             p.descricao.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;

        // 2. Filtro de status (Ativos/Inativos)
        if (filterParam === 'ativos') return p.visivel;
        if (filterParam === 'inativos') return !p.visivel;

        return true;
      });

      // Se o texto buscar a categoria, retorna ela inteira (respeitando o filtro de status)
      const catMatch = searchLower && cat.nome.toLowerCase().includes(searchLower);
      
      if (catMatch || matchingProds.length > 0 || (!searchLower && cat.produtos.length === 0)) {
        return { ...cat, produtos: matchingProds };
      }
      return null;
    }).filter(Boolean) as CategoriaComProdutos[];
  }, [categorias, search, filterParam]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    const searchLower = val.toLowerCase().trim();
    
    if (searchLower) {
      const matchIds = new Set<string>();
      categorias.forEach(cat => {
        const catMatch = cat.nome.toLowerCase().includes(searchLower);
        const hasMatchingProd = cat.produtos.some(p => 
          p.nome.toLowerCase().includes(searchLower) || 
          p.descricao.toLowerCase().includes(searchLower)
        );
        if (catMatch || hasMatchingProd) matchIds.add(cat.id);
      });

      if (matchIds.size > 0) {
        setExpandedIds(prev => {
          const next = new Set(prev);
          let changed = false;
          matchIds.forEach(id => {
            if (!next.has(id)) {
              next.add(id);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }
    }
  };



  // -----------------------------------------------------------
  // CRUD complemento
  // -----------------------------------------------------------
  const fetchComplementos = async (produtoId: string) => {
    setLoadingComps(true);
    const { data, error } = await supabase
      .from('complementos')
      .select('*, complemento_opcoes(*)')
      .eq('produto_id', produtoId)
      .order('posicao', { ascending: true })
      .order('posicao', { referencedTable: 'complemento_opcoes', ascending: true });
    
    if (!error && data) {
      setCompList(data);
    }
    setLoadingComps(false);
  };

  const resetCompForm = () => {
    setEditCompId(null);
    setCompNome('');
    setCompDescricao('');
    setCompTipo('simples');
    setCompValor('');
    setCompMinOpcoes('0');
    setCompMaxOpcoes('1');
    setCompOpcoes([]);
    setCompIsMeioAMeio(false);
    setInitialCompOpcoes([]);
  };

  const openEditComplemento = (comp: DBComplemento) => {
    setEditCompId(comp.id);
    setCompProdutoId(comp.produto_id);
    setCompNome(comp.nome);
    setCompDescricao(comp.descricao || '');
    setCompTipo(comp.tipo);
    setCompValor(comp.valor ? comp.valor.toString() : '');
    setCompMinOpcoes(comp.min_opcoes ? comp.min_opcoes.toString() : '0');
    setCompMaxOpcoes(comp.max_opcoes ? comp.max_opcoes.toString() : '1');
    setCompIsModelo(comp.is_modelo);
    setCompIsMeioAMeio(comp.is_meio_a_meio || false);
    const ops = comp.complemento_opcoes?.map(o => ({ ...o, valor: o.valor.toString() })) || [];
    setCompOpcoes(ops);
    setInitialCompOpcoes(ops);
    setCompStep(2);
    setShowCompModal(true);
  };

  const openAddComplementoProduto = (produtoId: string) => {
    setCompProdutoId(produtoId);
    setCompStep(0); // View list
    setShowCompModal(true);
    fetchComplementos(produtoId);
  };

  const handleCreateComplemento = async () => {
    if (!compNome.trim() || (!compProdutoId && !compIsModelo)) return;
    
    const minVal = parseInt(compMinOpcoes) || 0;
    const maxVal = parseInt(compMaxOpcoes) || 1;
    
    if (compTipo === 'multiplo' && minVal > maxVal) {
      alert('O número mínimo de escolhas não pode ser maior que o máximo.');
      return;
    }

    // Check if we need to show sync modal
    if (compIsModelo && editCompId) {
      setCompSaving(true);
      const { data: clones } = await supabase.from('complementos').select('id, produto_id').eq('modelo_origem_id', editCompId);
      
      if (clones && clones.length > 0) {
        // Detect if there are changes in 'ativo' status
        const hasChanges = compOpcoes.some(op => {
          const initial = initialCompOpcoes.find(i => i.id === op.id);
          return initial ? initial.ativo !== op.ativo : true; // New options or changed ones
        }) || compOpcoes.length !== initialCompOpcoes.length;

        setSyncHasAvailabilityChanges(hasChanges);

        const prodIds = clones.map(c => c.produto_id).filter(Boolean);
        const { data: prods } = await supabase.from('produtos').select('id, nome').in('id', prodIds);
        setAffectedProducts(prods || []);
        setShowSyncModal(true);
        setCompSaving(false);
        return;
      }
    }

    await processSaveComplemento(false);
  };

  const processSaveComplemento = async (sync: boolean) => {
    setCompSaving(true);
    
    let novoCompId = editCompId;

    if (editCompId) {
      await supabase.from('complementos').update({
        produto_id: compProdutoId,
        nome: compNome.trim(),
        descricao: compDescricao.trim(),
        tipo: compTipo,
        valor: parseFloat(compValor.replace(',', '.')) || 0,
        min_opcoes: parseInt(compMinOpcoes) || 0,
        max_opcoes: parseInt(compMaxOpcoes) || 1,
        is_meio_a_meio: compIsMeioAMeio,
      }).eq('id', editCompId);
    } else {
      const prodsComps = complementos.filter(c => c.produto_id === compProdutoId);
      const maxPos = prodsComps.length > 0 ? Math.max(...prodsComps.map((c) => c.posicao)) + 1 : 0;
      const { data: newComp } = await supabase.from('complementos').insert({
        produto_id: compProdutoId,
        nome: compNome.trim(),
        descricao: compDescricao.trim(),
        tipo: compTipo,
        valor: parseFloat(compValor.replace(',', '.')) || 0,
        min_opcoes: parseInt(compMinOpcoes) || 0,
        max_opcoes: parseInt(compMaxOpcoes) || 1,
        posicao: maxPos,
        is_modelo: compIsModelo,
        is_meio_a_meio: compIsMeioAMeio,
      }).select().single();
      
      if (newComp) novoCompId = newComp.id;
    }

    if (compTipo === 'multiplo' && novoCompId) {
      if (editCompId) {
        // More robust update: delete only what was removed, update the rest
        const currentOpIds = compOpcoes.map(op => op.id).filter(Boolean);
        await supabase.from('complemento_opcoes').delete()
          .eq('complemento_id', novoCompId)
          .not('id', 'in', `(${currentOpIds.join(',') || '00000000-0000-0000-0000-000000000000'})`);
        
        for (const [i, op] of compOpcoes.entries()) {
          const opData = {
            complemento_id: novoCompId,
            nome: op.nome.trim(),
            descricao: op.descricao.trim(),
            valor: parseFloat(op.valor.replace(',', '.')) || 0,
            posicao: i,
            ativo: op.ativo ?? true,
            modelo_opcao_origem_id: op.modelo_opcao_origem_id
          };

          let finalOpId = op.id;

          if (op.id) {
            await supabase.from('complemento_opcoes').update(opData).eq('id', op.id);
          } else {
            const { data: inserted } = await supabase.from('complemento_opcoes').insert(opData).select().single();
            if (inserted) finalOpId = inserted.id;
          }

          // Propagate ONLY 'ativo' status to clones if sync is requested
          if (compIsModelo && sync && finalOpId) {
            await supabase.from('complemento_opcoes')
              .update({ ativo: op.ativo ?? true }) // Explicitly ONLY update 'ativo'
              .eq('modelo_opcao_origem_id', finalOpId);
          }
        }
      } else {
        // New record, simple insert
        if (compOpcoes.length > 0) {
          await supabase.from('complemento_opcoes').insert(
            compOpcoes.map((op, i) => ({
               complemento_id: novoCompId,
               nome: op.nome.trim(),
               descricao: op.descricao.trim(),
               valor: parseFloat(op.valor.replace(',', '.')) || 0,
               posicao: i,
               ativo: op.ativo ?? true,
               modelo_opcao_origem_id: op.modelo_opcao_origem_id
            }))
          );
        }
      }
    }

    const wasModeloGlobal = compIsModelo && !compProdutoId;
    setCompSaving(false);
    setShowSyncModal(false);

    resetCompForm();
    setCompStep(0);

    if (wasModeloGlobal) {
      setShowCompModal(false);
      alert('Modelo de opcional salvo com sucesso!');
    } else {
      if (compProdutoId) fetchComplementos(compProdutoId);
    }

    fetchData();
  };

  const handleDeleteComplemento = (id: string) => {
    askConfirm(
      'Excluir Opcional',
      'Tem certeza que deseja excluir este opcional? Esta ação não pode ser desfeita.',
      async () => {
        setConfirmLoading(true);
        await supabase.from('complementos').delete().eq('id', id);
        if (compProdutoId) fetchComplementos(compProdutoId);
        setConfirmLoading(false);
        setShowConfirm(false);
        fetchData();
      }
    );
  };

  const handleToggleComplementoAtivo = async (comp: DBComplemento) => {
    const novoStatus = !comp.ativo;
    await supabase.from('complementos').update({ ativo: novoStatus }).eq('id', comp.id);
    if (comp.produto_id) fetchComplementos(comp.produto_id);
    fetchData();
  };

  const onDragEndComps = async (result: DropResult) => {
    if (!result.destination || !compProdutoId) return;
    if (result.destination.index === result.source.index) return;

    const newOrderedComps = Array.from(compList);
    const [removed] = newOrderedComps.splice(result.source.index, 1);
    newOrderedComps.splice(result.destination.index, 0, removed);

    // Update local state for immediate feedback
    setCompList(newOrderedComps);

    // Persist to DB
    const updates = newOrderedComps.map((c, idx) => ({ id: c.id, posicao: idx }));
    for (const update of updates) {
      await supabase.from('complementos').update({ posicao: update.posicao }).eq('id', update.id);
    }
    
    fetchComplementos(compProdutoId);
    fetchData();
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'CATEGORY') {
      const listToUse = search.trim() ? filteredCategorias : categorias;
      const newOrderedList = Array.from(listToUse);
      const [removed] = newOrderedList.splice(source.index, 1);
      newOrderedList.splice(destination.index, 0, removed);
      
      const updates: { id: string; posicao: number }[] = [];
      
      if (search.trim()) {
        newOrderedList.forEach((cat, idx) => {
          updates.push({ id: cat.id, posicao: idx });
        });
      } else {
        newOrderedList.forEach((cat, idx) => {
          updates.push({ id: cat.id, posicao: idx });
        });
        setCategorias(newOrderedList as CategoriaComProdutos[]);
      }

      for (const update of updates) {
        await supabase.from('categorias').update({ posicao: update.posicao }).eq('id', update.id);
      }
      
      if (search.trim()) fetchData();
    } else if (type === 'PRODUCT') {
      const catId = source.droppableId;
      const catIndex = categorias.findIndex(c => c.id === catId);
      if (catIndex === -1) return;

      const targetCat = categorias[catIndex];
      const prodsToUse = search.trim() 
        ? targetCat.produtos.filter(p => 
            p.nome.toLowerCase().includes(search.toLowerCase()) || 
            p.descricao.toLowerCase().includes(search.toLowerCase())
          )
        : targetCat.produtos;

      const newOrderedProds = Array.from(prodsToUse);
      const [removed] = newOrderedProds.splice(source.index, 1);
      newOrderedProds.splice(destination.index, 0, removed);

      const updates = newOrderedProds.map((prod, idx) => ({ id: prod.id, posicao: idx }));
      
      for (const update of updates) {
        await supabase.from('produtos').update({ posicao: update.posicao }).eq('id', update.id);
      }
      
      fetchData();
    }
  };

  const onScheduleCategoria = (cat: DBCategoria) => {
    setSelectedCatForSchedule(cat);
    setTempActiveDays(cat.active_days || [0, 1, 2, 3, 4, 5, 6]);
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedCatForSchedule) return;
    setScheduleSaving(true);
    
    const { error } = await supabase
      .from('categorias')
      .update({ active_days: tempActiveDays })
      .eq('id', selectedCatForSchedule.id);

    if (error) {
      console.error('Erro ao salvar agendamento:', error);
    } else {
      await fetchData();
      setShowScheduleModal(false);
    }
    setScheduleSaving(false);
  };

  // -----------------------------------------------------------
  // CRUD categoria
  // -----------------------------------------------------------
  const openEditCategoria = (cat: CategoriaComProdutos) => {
    setEditCatId(cat.id);
    setCatNome(cat.nome);
    setCatDescricao(cat.descricao || '');
    setShowCatModal(true);
  };

  const handleCreateCategoria = async () => {
    if (!catNome.trim()) return;
    setCatSaving(true);
    
    if (editCatId) {
      await supabase.from('categorias').update({
        nome: catNome.trim(),
        descricao: catDescricao.trim(),
      }).eq('id', editCatId);
    } else {
      const maxPos = categorias.length > 0 ? Math.max(...categorias.map((c) => c.posicao)) + 1 : 0;
      await supabase.from('categorias').insert({
        nome: catNome.trim(),
        descricao: catDescricao.trim(),
        posicao: maxPos,
      });
    }

    setCatNome('');
    setCatDescricao('');
    setEditCatId(null);
    setCatSaving(false);
    setShowCatModal(false);
    fetchData();
  };

  const handleDeleteCategoria = (id: string) => {
    askConfirm(
      'Excluir Categoria',
      'Tem certeza que deseja excluir esta categoria e todos os produtos vinculados a ela? Esta ação não pode ser desfeita.',
      async () => {
        setConfirmLoading(true);
        await supabase.from('categorias').delete().eq('id', id);
        setConfirmLoading(false);
        setShowConfirm(false);
        fetchData();
      }
    );
  };

  // -----------------------------------------------------------
  // CRUD produto
  // -----------------------------------------------------------
  const openEditProduto = (prod: DBProduto) => {
    setEditProdId(prod.id);
    setProdCategoriaId(prod.categoria_id);
    setProdNome(prod.nome);
    setProdDescricao(prod.descricao || '');
    setProdPrecoVenda(prod.preco_venda.toString());
    setProdImagemFile(null);
    setProdImagemPreview(prod.imagem_url);
    setShowProdModal(true);
  };

  const openProdutoModal = (categoriaId: string) => {
    setEditProdId(null);
    setProdCategoriaId(categoriaId);
    setProdNome('');
    setProdDescricao('');
    setProdPrecoVenda('');
    setProdImagemFile(null);
    setProdImagemPreview(null);
    setShowProdModal(true);
  };

  const handleCreateProduto = async () => {
    if (!prodNome.trim() || !prodPrecoVenda.trim() || !prodCategoriaId) return;
    
    const precoNum = parseFloat(prodPrecoVenda.replace(/\./g, '').replace(',', '.'));
    const isPriceZero = precoNum === 0;
    
    // Se o preço for zero, precisamos verificar se tem opcionais
    if (isPriceZero) {
      const hasComps = editProdId ? complementos.some(c => c.produto_id === editProdId && c.ativo !== false) : false;
      if (!hasComps) {
        setShowPriceZeroModal(true);
        return;
      }
    }

    await processSaveProduto();
  };

  const processSaveProduto = async () => {
    setProdSaving(true);
    let finalImageUrl: string | null = null;
    let savedId: string | null = null;

    if (prodImagemFile) {
      const fileExt = prodImagemFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, prodImagemFile);

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('produtos')
          .getPublicUrl(uploadData.path);
        finalImageUrl = publicUrlData.publicUrl;
      }
    }

    if (editProdId) {
      const { data, error } = await supabase.from('produtos').update({
        categoria_id: prodCategoriaId!,
        nome: prodNome.trim(),
        descricao: prodDescricao.trim(),
        preco_venda: parseFloat(prodPrecoVenda.replace(/\./g, '').replace(',', '.')),
        ...(finalImageUrl ? { imagem_url: finalImageUrl } : {}),
      }).eq('id', editProdId).select().single();
      
      if (!error && data) savedId = data.id;
    } else {
      const catProds = categorias.find((c) => c.id === prodCategoriaId)?.produtos || [];
      const maxPos = catProds.length > 0 ? Math.max(...catProds.map((p) => p.posicao)) + 1 : 0;
      const { data, error } = await supabase.from('produtos').insert({
        categoria_id: prodCategoriaId!,
        nome: prodNome.trim(),
        descricao: prodDescricao.trim(),
        preco_venda: parseFloat(prodPrecoVenda.replace(/\./g, '').replace(',', '.')),
        imagem_url: finalImageUrl,
        posicao: maxPos,
      }).select().single();

      if (!error && data) savedId = data.id;
    }

    setEditProdId(null);
    setProdSaving(false);
    setShowProdModal(false);
    window.dispatchEvent(new Event('product-status-changed'));
    fetchData();
    return savedId;
  };

  const handleDeleteProduto = (id: string) => {
    askConfirm(
      'Excluir Produto',
      'Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.',
      async () => {
        setConfirmLoading(true);
        await supabase.from('produtos').delete().eq('id', id);
        setConfirmLoading(false);
        setShowConfirm(false);
        window.dispatchEvent(new Event('product-status-changed'));
        fetchData();
      }
    );
  };

  // -----------------------------------------------------------
  // Troca de Imagem (Modal Simples)
  // -----------------------------------------------------------
  const openEditImage = (prod: DBProduto) => {
    setSelectedProdForImg(prod);
    setImgFile(null);
    setImgPreview(prod.imagem_url);
    setShowImgModal(true);
  };

  const handleUpdateProductImage = async () => {
    if (!selectedProdForImg || !imgFile) return;
    setImgSaving(true);
    
    try {
      const fileExt = imgFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(filePath, imgFile);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('produtos')
        .getPublicUrl(uploadData.path);
      
      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.from('produtos')
        .update({ imagem_url: publicUrl })
        .eq('id', selectedProdForImg.id);

      if (updateError) throw updateError;

      setShowImgModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar imagem');
    } finally {
      setImgSaving(false);
    }
  };

  const handleToggleProdutoVisibilidade = async (prod: DBProduto) => {
    const { error } = await supabase
      .from('produtos')
      .update({ visivel: !prod.visivel })
      .eq('id', prod.id);
    
    if (error) {
      console.error('Erro ao alternar visibilidade:', error);
      return;
    }
    window.dispatchEvent(new Event('product-status-changed'));
    fetchData();
  };

  const handleToggleCategoriaAtiva = async (cat: DBCategoria) => {
    const { error } = await supabase
      .from('categorias')
      .update({ ativa: !cat.ativa })
      .eq('id', cat.id);
    
    if (error) {
      console.error('Erro ao alternar status da categoria:', error);
      return;
    }
    fetchData();
  };

  // -----------------------------------------------------------
  // Totais
  // -----------------------------------------------------------
  const allProducts = categorias.flatMap(c => c.produtos);
  const totalItems = allProducts.length;
  const activeItems = allProducts.filter(p => p.visivel).length;
  const inactiveItems = allProducts.filter(p => !p.visivel).length;
  const totalCategories = categorias.length;

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------
  if (loading) {
    return <LoadingScreen message="Carregando cardápio..." />;
  }

  return (
    <>
      <div className="px-7 py-6 flex flex-col gap-5">


        {/* Filters + botão Novo Item */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 max-w-[320px]"
            style={{ borderColor: 'var(--cp-line)', backgroundColor: 'var(--cp-flour)' }}
          >
            <SearchIcon size={15} />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-xs font-semibold"
              style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
            />
          </div>

          {/* Expand all / Collapse all */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border cursor-pointer text-[11px] font-black tracking-wider uppercase bg-transparent transition-colors"
            style={{ borderColor: 'var(--cp-line-strong)', color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cp-dough)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {expandedIds.size === categorias.length ? (
              <><ChevronUpIcon size={13} /> Recolher todos</>
            ) : (
              <><ExpandIcon size={13} /> Expandir todos</>
            )}
          </button>

          {/* Novo Item Dropdown */}
          <div className="ml-auto relative">
            <Button size="sm" icon={<PlusIcon size={14} />} onClick={() => setMenuOpen(!menuOpen)}>
              Novo Item
            </Button>
            
            {menuOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-48 rounded-xl border flex flex-col overflow-hidden z-10 shadow-lg animate-fade-in-up"
                style={{ backgroundColor: '#fff', borderColor: 'var(--cp-line)' }}
              >
                <button
                  onClick={() => { setMenuOpen(false); setShowCatModal(true); }}
                  className="text-left px-4 py-2.5 text-[13px] font-bold transition-colors border-0 bg-transparent cursor-pointer"
                  style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--cp-dough)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Nova Categoria
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (categorias.length === 0) {
                      alert('Crie uma categoria antes de adicionar um produto.');
                      return;
                    }
                    openProdutoModal(categorias[0].id);
                  }}
                  className="text-left px-4 py-2.5 text-[13px] font-bold transition-colors border-0 bg-transparent cursor-pointer"
                  style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--cp-dough)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Novo Produto
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditCompId(null);
                    setCompNome('');
                    setCompDescricao('');
                    setCompTipo('simples');
                    setCompValor('');
                    setCompIsModelo(true);
                    setCompProdutoId(null);
                    setCompStep(1); // Selection screen
                    setShowCompModal(true);
                  }}
                  className="text-left px-4 py-2.5 text-[13px] font-bold transition-colors border-0 bg-transparent cursor-pointer"
                  style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--cp-dough)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Novo Complemento
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span
                className="text-[9px] font-black tracking-[0.18em] uppercase"
                style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
              >
                Categorias do cardápio
              </span>
            </div>
            <span className="text-[9px] font-black tracking-[0.16em] uppercase opacity-30" style={{ color: 'var(--cp-ink)' }}>
              {totalCategories} categorias cadastradas
            </span>
          </div>
          <span
            className="text-[10px] font-bold tracking-wider uppercase block"
            style={{ color: 'var(--cp-ink-faint)' }}
          >
            Arraste ⠿ para reordenar · Clique para expandir
          </span>
          {filterParam && (
            <div className="flex items-center gap-2.5 mt-1 animate-fade-in">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: filterParam === 'ativos' ? 'var(--cp-green)' : 'var(--cp-red)' }} />
              <span className="text-[11px] font-bold" style={{ color: 'var(--cp-ink-muted)' }}>
                Filtro ativo: Mostrando apenas <span className="uppercase font-black" style={{ color: filterParam === 'ativos' ? 'var(--cp-green)' : 'var(--cp-red)', fontSize: '12px' }}>{filterParam}</span>
              </span>
              <button 
                onClick={() => router.push(pathname)}
                className="text-[10px] font-black uppercase opacity-40 hover:opacity-100 transition-opacity border-0 bg-transparent cursor-pointer ml-2"
                style={{ color: 'var(--cp-ink)' }}
              >
                [ Limpar Filtro ]
              </button>
            </div>
          )}
        </div>

        {/* Category list */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="categories" type="CATEGORY">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-col gap-4"
              >
                {filteredCategorias.map((cat, idx) => (
                  <CategorySection
                    key={cat.id}
                    categoria={cat}
                    onDeleteCategoria={handleDeleteCategoria}
                    onEditCategoria={openEditCategoria}
                    onDeleteProduto={handleDeleteProduto}
                    onEditProduto={openEditProduto}
                    onEditImageProduto={openEditImage}
                    onAddProduto={openProdutoModal}
                    onAddComplemento={openAddComplementoProduto}
                    onAddTag={(id) => { setSelectedProdForTag(id); setShowTagModal(true); }}
                    onToggleAtiva={handleToggleCategoriaAtiva}
                    onToggleVisivelProduto={handleToggleProdutoVisibilidade}
                    onScheduleCategoria={onScheduleCategoria}
                    index={idx}
                    complementos={complementos}
                    produtoTags={produtoTags}
                    expanded={expandedIds.has(cat.id)}
                    onToggleExpand={toggleExpand}
                    isSearchActive={!!search.trim() || !!filterParam}
                  />
                ))}
                {provided.placeholder}
                {filteredCategorias.length === 0 && search.trim() && (
                  <div className="py-20 text-center flex flex-col items-center gap-3 opacity-40">
                    <SearchIcon size={40} />
                    <p className="text-sm font-bold uppercase tracking-widest">Nenhum produto ou categoria encontrado</p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Adicionar nova categoria (botão tracejado no final) */}
        <DashedAddButton
          label="Adicionar nova categoria"
          onClick={() => {
            setEditCatId(null);
            setCatNome('');
            setCatDescricao('');
            setShowCatModal(true);
          }}
        />

        {/* Complementos section label */}
        <div className="mt-6">
          <span
            className="text-[9px] font-black tracking-[0.18em] uppercase block mb-4"
            style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
          >
            Modelos de opcionais
          </span>
          <div className="flex flex-col gap-3">
            {modelosOpcionais.map((comp) => (
              <div
                key={comp.id}
                className="flex items-center gap-4 py-5 px-6 rounded-3xl transition-all shadow-sm hover:shadow-md border border-[var(--cp-line-strong)] group"
                style={{ backgroundColor: '#fff', borderTop: '5px solid var(--cp-ink-muted)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[17px] font-black tracking-tight" style={{ fontFamily: 'var(--font-body)', color: 'var(--cp-ink)' }}>
                      {comp.nome}
                    </span>
                    <span className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-[4px] border-2" style={{ backgroundColor: 'var(--cp-dough)', color: 'var(--cp-ink)', borderColor: 'var(--cp-ink)', boxShadow: '2px 2px 0 0 var(--cp-ink)' }}>
                      {comp.tipo === 'simples' ? 'SIMPLES' : 'MÚLTIPLO'}
                    </span>
                  </div>
                  <p className="text-[12px] m-0 truncate text-[var(--cp-ink-muted)] mt-1">{comp.descricao}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {comp.tipo === 'simples' ? (
                      <>
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-40">Valor Sugerido:</span>
                        <span className="text-[14px] font-black" style={{ color: 'var(--cp-red)', fontFamily: 'var(--font-body)' }}>
                          R$ {Number(comp.valor).toFixed(2).replace('.', ',')}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-wider opacity-40 bg-[var(--cp-flour)] px-2 py-0.5 rounded border border-[var(--cp-line)]">
                        {comp.complemento_opcoes?.length || 0} opções de escolha
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-none">
                  <div className="flex items-center gap-2 mr-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--cp-ink-faint)]">Status</span>
                    <Switch checked={!!comp.ativo} onChange={(val) => handleToggleComplementoAtivo(comp)} />
                  </div>
                  <IconBtn title="Editar" variant="square" onClick={() => openEditComplemento(comp)}>
                    <EditIcon size={15} />
                  </IconBtn>
                  <IconBtn title="Excluir" variant="square" onClick={() => handleDeleteComplemento(comp.id)}>
                    <TrashIcon size={15} />
                  </IconBtn>
                </div>
              </div>
            ))}
            {modelosOpcionais.length === 0 && (
              <div className="py-6 text-center text-[13px] font-bold opacity-50" style={{ color: 'var(--cp-ink-muted)' }}>
                Nenhum modelo cadastrado
              </div>
            )}
            <div className="mt-2">
              <DashedAddButton 
                label="Criar novo modelo de opcional" 
                onClick={() => {
                  resetCompForm();
                  setCompIsModelo(true);
                  setCompStep(1);
                  setShowCompModal(true);
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============ Modal: Nova/Editar Categoria ============ */}
      <Modal open={showCatModal} onClose={() => setShowCatModal(false)} title={editCatId ? "Editar Categoria" : "Nova Categoria"}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Nome da categoria" required />
            <FieldInput
              value={catNome}
              onChange={setCatNome}
              placeholder="Ex: Pizzas Salgadas"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Descrição (opcional)" />
            <FieldTextarea
              value={catDescricao}
              onChange={setCatDescricao}
              placeholder="Breve descrição da categoria..."
            />
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" size="sm" onClick={() => setShowCatModal(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateCategoria}
              loading={catSaving}
              disabled={!catNome.trim()}
            >
              {editCatId ? "Salvar Categoria" : "Criar Categoria"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============ Modal: Novo/Editar Produto ============ */}
      <Modal open={showProdModal} onClose={() => setShowProdModal(false)} title={editProdId ? "Editar Produto" : "Novo Produto"}>
        <div className="flex flex-col gap-4">
          {/* Categoria destino */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Categoria" required />
            <select
              value={prodCategoriaId || ''}
              onChange={(e) => setProdCategoriaId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border-2 text-[14px] font-semibold outline-none"
              style={{
                borderColor: 'var(--cp-line-strong)',
                backgroundColor: 'var(--cp-flour)',
                fontFamily: 'var(--font-body)',
                color: 'var(--cp-ink)',
              }}
            >
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Foto (não obrigatório) */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Foto do produto (opcional)" />
            <div className="flex items-center gap-3">
              <div 
                className="w-24 h-24 rounded-xl overflow-hidden flex-none relative grid place-items-center"
                style={{ backgroundColor: 'var(--cp-flour)', border: '2px solid var(--cp-line-strong)' }}
              >
                {prodImagemPreview ? (
                  <Image src={prodImagemPreview} alt="Preview" fill sizes="96px" style={{ objectFit: 'cover' }} />
                ) : (
                  <span className="text-3xl opacity-40">📷</span>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProdImagemFile(file);
                      setProdImagemPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="block w-full text-sm font-semibold cursor-pointer file:cursor-pointer
                    file:mr-3 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-[11px] file:font-black file:uppercase file:tracking-wider
                    hover:file:opacity-80 transition-opacity"
                  style={{ 
                    color: 'var(--cp-ink-muted)', 
                    fontFamily: 'var(--font-body)' 
                  }}
                />
                <style>{`
                  input[type=file]::file-selector-button {
                    background-color: var(--cp-dough);
                    color: var(--cp-ink);
                  }
                `}</style>
              </div>
            </div>
          </div>

          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Nome do produto" required />
            <FieldInput
              value={prodNome}
              onChange={setProdNome}
              placeholder="Ex: Calabresa"
              required
            />
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Descrição (opcional)" />
            <FieldTextarea
              value={prodDescricao}
              onChange={setProdDescricao}
              placeholder="Ingredientes ou descrição do produto..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel label="Valor de venda" required />
            <FieldCurrencyInput
              value={prodPrecoVenda}
              onChange={setProdPrecoVenda}
              placeholder="Ex: 49,90"
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" size="sm" onClick={() => setShowProdModal(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateProduto}
              loading={prodSaving}
              disabled={!prodNome.trim() || !prodPrecoVenda.trim()}
            >
              {editProdId ? "Salvar Produto" : "Criar Produto"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============ Modal: Novo/Editar Complemento ============ */}
      <Modal 
        open={showCompModal} 
        onClose={() => setShowCompModal(false)} 
        title={compStep === 0 ? "Opcionais do Produto" : compStep === 3 ? "Escolher do Modelo" : editCompId ? "Editar Complemento" : "Novo Complemento"}
      >
        {compStep === 0 ? (
          <div className="flex flex-col gap-4">
            {loadingComps ? (
              <div className="py-10 text-center text-xs font-bold opacity-30">Carregando opcionais...</div>
            ) : compList.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto pr-1">
                <DragDropContext onDragEnd={onDragEndComps}>
                  <Droppable droppableId="comps">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-2">
                        {compList.map((comp, idx) => (
                          <Draggable key={comp.id} draggableId={comp.id} index={idx}>
                            {(providedDrag, snapshot) => {
                              const style = {
                                ...providedDrag.draggableProps.style,
                              };

                              const child = (
                                <div 
                                  ref={providedDrag.innerRef}
                                  {...providedDrag.draggableProps}
                                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${snapshot.isDragging ? 'shadow-2xl z-[9999] border-[var(--cp-ink)] bg-white' : ''}`}
                                  style={{ 
                                    ...style,
                                    borderColor: snapshot.isDragging ? 'var(--cp-ink)' : 'var(--cp-line)', 
                                    backgroundColor: snapshot.isDragging ? '#fff' : 'var(--cp-flour)',
                                    width: snapshot.isDragging ? '400px' : 'auto' // Mantém largura fixa ao arrastar
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <span {...providedDrag.dragHandleProps} className="cursor-grab opacity-30 hover:opacity-100 transition-opacity">
                                      <DragIcon size={12} />
                                    </span>
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[13px] font-bold" style={{ color: 'var(--cp-ink)' }}>{comp.nome}</span>
                                        <span 
                                          className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] border"
                                          style={{ 
                                            backgroundColor: comp.tipo === 'simples' ? 'var(--cp-dough)' : 'var(--cp-ink)',
                                            color: comp.tipo === 'simples' ? 'var(--cp-ink)' : '#fff',
                                            borderColor: 'var(--cp-ink)'
                                          }}
                                        >
                                          {comp.tipo}
                                        </span>
                                        {comp.tipo === 'simples' && (
                                           <span className="text-[10px] font-bold" style={{ color: 'var(--cp-red)' }}>
                                              {formatPrice(comp.valor)}
                                           </span>
                                        )}
                                      </div>
                                      <span className="text-[11px] opacity-60 truncate max-w-[180px]">{comp.descricao}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 mr-1 scale-90 origin-right">
                                       <span className="text-[10px] font-black uppercase tracking-wider text-[var(--cp-ink-faint)]">Ativo</span>
                                       <Switch checked={!!comp.ativo} onChange={(val) => handleToggleComplementoAtivo(comp)} />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <IconBtn title="Editar" variant="square" onClick={() => openEditComplemento(comp)}>
                                        <EditIcon size={13} />
                                      </IconBtn>
                                      <IconBtn title="Excluir" variant="square" onClick={() => handleDeleteComplemento(comp.id)}>
                                        <TrashIcon size={13} />
                                      </IconBtn>
                                    </div>
                                  </div>
                                </div>
                              );

                              if (snapshot.isDragging) {
                                return createPortal(child, document.body);
                              }
                              return child;
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[12px] font-bold opacity-40 uppercase tracking-widest">Nenhum opcional cadastrado</p>
              </div>
            )}

            <Button 
              size="sm" 
              className="mt-2"
              onClick={() => {
                resetCompForm();
                setCompStep(1);
              }}
            >
              Criar Novo Opcional
            </Button>
          </div>
        ) : compStep === 1 ? (
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-bold text-center mb-3" style={{ color: 'var(--cp-ink-muted)' }}>
              Qual o tipo de adicional você quer criar?
            </span>
            <button
              onClick={() => { setCompTipo('simples'); setCompStep(2); }}
              className="flex flex-col items-center p-5 rounded-2xl border-2 text-left cursor-pointer transition-all duration-200"
              style={{ 
                borderColor: 'var(--cp-ink)', 
                backgroundColor: '#fff', 
                color: 'var(--cp-ink)',
                boxShadow: '4px 4px 0 0 var(--cp-line-strong)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '6px 6px 0 0 var(--cp-line-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '4px 4px 0 0 var(--cp-line-strong)';
              }}
            >
              <span className="text-[17px] font-extrabold" style={{ fontFamily: 'var(--font-display-alt)' }}>Adicional Simples</span>
              <span className="text-[12px] opacity-70 mt-1 text-center font-medium">Um item que o cliente pode adicionar por um valor fixo. (Ex: Borda Recheada)</span>
            </button>

            <button
              onClick={() => { setCompTipo('multiplo'); setCompStep(2); }}
              className="flex flex-col items-center p-5 rounded-2xl border-2 text-left cursor-pointer transition-all duration-200"
              style={{ 
                borderColor: 'var(--cp-ink)', 
                backgroundColor: '#fff', 
                color: 'var(--cp-ink)',
                boxShadow: '4px 4px 0 0 var(--cp-line-strong)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '6px 6px 0 0 var(--cp-line-strong)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '4px 4px 0 0 var(--cp-line-strong)';
              }}
            >
              <span className="text-[17px] font-extrabold" style={{ fontFamily: 'var(--font-display-alt)' }}>Grupo de Opções (Múltiplo)</span>
              <span className="text-[12px] opacity-70 mt-1 text-center font-medium">Um grupo onde o cliente escolhe entre várias opções. (Ex: Escolha o sabor da borda)</span>
            </button>

            {!compIsModelo && (
              <button
                onClick={() => { setCompStep(3); }}
                className="flex flex-col items-center p-5 rounded-2xl border-2 text-left cursor-pointer transition-all duration-200"
                style={{ 
                  borderColor: 'var(--cp-ink)', 
                  backgroundColor: 'var(--cp-dough)', 
                  color: 'var(--cp-ink)',
                  boxShadow: '4px 4px 0 0 var(--cp-line-strong)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '6px 6px 0 0 var(--cp-line-strong)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '4px 4px 0 0 var(--cp-line-strong)';
                }}
              >
                <span className="text-[17px] font-extrabold" style={{ fontFamily: 'var(--font-display-alt)' }}>Usar de um Modelo</span>
                <span className="text-[12px] opacity-70 mt-1 text-center font-medium">Importar um modelo já criado e personalizar para este produto.</span>
              </button>
            )}
          </div>
        ) : compStep === 3 ? (
          <div className="flex flex-col gap-3">
             <button
                onClick={() => setCompStep(1)}
                className="text-[10px] uppercase font-black px-2 py-1 rounded bg-transparent border-0 cursor-pointer w-fit"
                style={{ color: 'var(--cp-ink-muted)' }}
              >
                ← Voltar
              </button>
             {modelosOpcionais.length > 0 ? (
               <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                 {modelosOpcionais.map((mod) => (
                   <div 
                    key={mod.id}
                    onClick={async () => {
                      if (!compProdutoId) return;
                      setCompSaving(true);
                      
                      // Clone model
                      const prodsComps = complementos.filter(c => c.produto_id === compProdutoId);
                      const maxPos = prodsComps.length > 0 ? Math.max(...prodsComps.map((c) => c.posicao)) + 1 : 0;
                      
                      const { data: newComp } = await supabase.from('complementos').insert({
                        produto_id: compProdutoId,
                        nome: mod.nome,
                        descricao: mod.descricao,
                        tipo: mod.tipo,
                        valor: mod.valor,
                        min_opcoes: mod.min_opcoes,
                        max_opcoes: mod.max_opcoes,
                        posicao: maxPos,
                        is_modelo: false,
                        modelo_origem_id: mod.id // Store reference
                      }).select().single();

                      if (newComp && mod.tipo === 'multiplo') {
                         const { data: modelOps } = await supabase.from('complemento_opcoes').select('*').eq('complemento_id', mod.id);
                         if (modelOps && modelOps.length > 0) {
                            await supabase.from('complemento_opcoes').insert(
                              modelOps.map(op => ({
                                 complemento_id: newComp.id,
                                 nome: op.nome,
                                 descricao: op.descricao,
                                 valor: op.valor,
                                 posicao: op.posicao,
                                 modelo_opcao_origem_id: op.id,
                                 ativo: op.ativo,
                              }))
                            );
                         }
                      }

                      fetchComplementos(compProdutoId);
                      fetchData();
                      setCompStep(0);
                      setCompSaving(false);
                    }}
                    className="p-3 rounded-xl border-2 cursor-pointer transition-all hover:bg-red-50 hover:border-red-200"
                    style={{ borderColor: 'var(--cp-line)', backgroundColor: '#fff' }}
                   >
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{mod.nome}</span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-gray-100">{mod.tipo}</span>
                     </div>
                     <p className="text-[11px] opacity-60 m-0 mt-1 truncate">{mod.descricao}</p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="py-10 text-center">
                 <p className="text-xs font-bold opacity-40">Nenhum modelo cadastrado.</p>
                  <Button size="sm" variant="ghost" onClick={() => { resetCompForm(); setCompIsModelo(true); setCompStep(2); }}>Criar meu primeiro modelo</Button>
               </div>
             )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setCompStep(1)}
                className="text-[10px] uppercase font-black px-2 py-1 rounded bg-transparent border-0 cursor-pointer"
                style={{ color: 'var(--cp-ink-muted)' }}
              >
                ← Voltar
              </button>
              <span 
                className="text-[10px] uppercase font-black px-2 py-1 rounded-[4px] border-2" 
                style={{ 
                  backgroundColor: 'var(--cp-dough)', 
                  borderColor: 'var(--cp-ink)', 
                  color: 'var(--cp-ink)', 
                  boxShadow: '2px 2px 0 0 var(--cp-ink)' 
                }}
              >
                {compTipo === 'simples' ? 'SIMPLES' : 'MÚLTIPLO'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel label={compTipo === 'simples' ? 'Nome do adicional' : 'Nome do grupo'} required />
              <FieldInput value={compNome} onChange={setCompNome} placeholder={compTipo === 'simples' ? 'Ex: Borda Recheada' : 'Ex: Escolha a Borda'} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Descrição" />
              <FieldTextarea value={compDescricao} onChange={setCompDescricao} placeholder={compTipo === 'simples' ? 'Ex: Catupiry original' : 'Ex: Escolha até 2 sabores para a borda'} />
            </div>

            {compTipo === 'simples' ? (
              <div className="flex flex-col gap-1.5">
                <FieldLabel label={compIsModelo ? "Valor Sugerido (Opcional)" : "Valor (R$)"} required={!compIsModelo} />
                <FieldCurrencyInput value={compValor} onChange={setCompValor} placeholder="Ex: 5,00" required={!compIsModelo} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel label="Mínimo de escolhas" required />
                    <FieldInput 
                      value={compMinOpcoes} 
                      onChange={(v) => {
                        const val = parseInt(v);
                        if (isNaN(val)) { setCompMinOpcoes(''); return; }
                        if (val < 0) return;
                        if (val > parseInt(compMaxOpcoes)) return;
                        setCompMinOpcoes(v);
                      }} 
                      placeholder="Ex: 0" 
                      type="number" 
                      required 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel label="Máximo de escolhas" required />
                    <FieldInput 
                      value={compMaxOpcoes} 
                      onChange={(v) => {
                        const val = parseInt(v);
                        if (isNaN(val)) { setCompMaxOpcoes(''); return; }
                        if (val < 0) return;
                        if (val < parseInt(compMinOpcoes)) return;
                        setCompMaxOpcoes(v);
                      }} 
                      placeholder="Ex: 1" 
                      type="number" 
                      required 
                    />
                  </div>
                </div>

                {compMaxOpcoes === '2' && (
                  <div className="flex flex-col gap-3 p-4 rounded-2xl bg-[var(--cp-dough)] border-2 border-[var(--cp-ink)] shadow-[4px_4px_0_0_var(--cp-ink)] animate-fade-in-up">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] font-black uppercase tracking-tight" style={{ fontFamily: 'var(--font-display-alt)' }}>Lógica Meio a Meio?</span>
                        <p className="text-[11px] font-medium opacity-60 m-0">O preço será o da opção mais cara entre as duas selecionadas.</p>
                      </div>
                      <Switch checked={compIsMeioAMeio} onChange={setCompIsMeioAMeio} />
                    </div>
                  </div>
                )}

                {parseInt(compMinOpcoes) === parseInt(compMaxOpcoes) && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--cp-ink-muted)] bg-[var(--cp-dough)] p-3 rounded-xl border-2 border-[var(--cp-line-strong)] flex items-center gap-2">
                    O cliente deverá escolher exatamente {compMaxOpcoes} {parseInt(compMaxOpcoes) === 1 ? 'opção' : 'opções'}
                  </span>
                )}

                <div className="flex flex-col gap-2 mt-2">
                   <DragDropContext onDragEnd={onDragEndOpcoes}>
                     <Droppable droppableId="opcoes">
                       {(provided) => (
                         <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-3">
                            {compOpcoes.map((opcao, idx) => (
                              <Draggable key={`op-${idx}`} draggableId={`op-${idx}`} index={idx}>
                                {(providedDrag, snapshot) => {
                                  const style = {
                                    ...providedDrag.draggableProps.style,
                                  };

                                  const child = (
                                    <div 
                                      ref={providedDrag.innerRef}
                                      {...providedDrag.draggableProps}
                                      className={`flex flex-col gap-3 p-4 rounded-xl border-2 transition-all relative group/opcao ${snapshot.isDragging ? 'shadow-2xl z-[9999] border-[var(--cp-ink)] bg-white' : ''}`} 
                                      style={{ 
                                        ...style,
                                        borderColor: snapshot.isDragging ? 'var(--cp-ink)' : 'var(--cp-line)', 
                                        backgroundColor: snapshot.isDragging ? '#fff' : 'var(--cp-flour)',
                                        width: snapshot.isDragging ? '450px' : 'auto'
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span {...providedDrag.dragHandleProps} className="cursor-grab opacity-30 hover:opacity-100 transition-opacity">
                                            <DragIcon size={14} />
                                          </span>
                                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Opção {idx + 1}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-2 mr-2 scale-75 origin-right">
                                             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Ativa</span>
                                             <Switch 
                                               checked={opcao.ativo !== false} 
                                               onChange={(val) => updateCompOpcao(idx, 'ativo', val)} 
                                             />
                                          </div>
                                          <button 
                                            onClick={() => removeCompOpcao(idx)} 
                                            className="w-7 h-7 grid place-items-center rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors cursor-pointer border-0"
                                          >
                                            <TrashIcon size={12} />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-[1fr_100px] gap-3">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] font-bold uppercase opacity-50 ml-1">Nome</span>
                                          <input 
                                            value={opcao.nome} 
                                            onChange={(e) => updateCompOpcao(idx, 'nome', e.target.value)} 
                                            placeholder="Ex: Catupiry" 
                                            className="w-full py-2 px-3 text-[13px] font-bold border-2 rounded-lg outline-none transition-colors" 
                                            style={{ borderColor: 'var(--cp-line-strong)', backgroundColor: '#fff' }}
                                            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--cp-red)'}
                                            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--cp-line-strong)'}
                                            required 
                                          />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] font-bold uppercase opacity-50 ml-1">{compIsModelo ? "Sugerido" : "Preço"}</span>
                                          <div className="relative">
                                             <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-30">R$</span>
                                             <input 
                                                value={opcao.valor} 
                                                onChange={(e) => updateCompOpcao(idx, 'valor', e.target.value)} 
                                                placeholder="0,00" 
                                                className="w-full py-2 pl-8 pr-2 text-[13px] font-bold border-2 rounded-lg outline-none transition-colors" 
                                                style={{ borderColor: 'var(--cp-line-strong)', backgroundColor: '#fff' }}
                                                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--cp-red)'}
                                                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--cp-line-strong)'}
                                             />
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-bold uppercase opacity-50 ml-1">Descrição (opcional)</span>
                                        <input 
                                          value={opcao.descricao} 
                                          onChange={(e) => updateCompOpcao(idx, 'descricao', e.target.value)} 
                                          placeholder="Ex: Recheio cremoso original" 
                                          className="w-full py-2 px-3 text-[12px] font-medium border-2 rounded-lg outline-none transition-colors italic" 
                                          style={{ borderColor: 'var(--cp-line-strong)', backgroundColor: '#fff' }}
                                          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--cp-red)'}
                                          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--cp-line-strong)'}
                                        />
                                      </div>
                                    </div>
                                  );

                                  if (snapshot.isDragging) {
                                    return createPortal(child, document.body);
                                  }
                                  return child;
                                }}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                         </div>
                       )}
                     </Droppable>
                   </DragDropContext>
                   <DashedAddButton label="Adicionar Opção" onClick={addCompOpcao} />
                </div>
              </div>
            )}

            {compIsModelo && editCompId && (
              <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-[var(--cp-line)] bg-[var(--cp-flour)] mb-4 opacity-50 italic">
                <span className="text-[10px] font-medium">As opções de sincronização aparecerão ao clicar em salvar.</span>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" size="sm" onClick={() => setShowCompModal(false)}>Cancelar</Button>
              <Button 
                size="sm" 
                onClick={handleCreateComplemento} 
                loading={compSaving} 
                disabled={
                  !compNome.trim() || 
                  (!compIsModelo && compTipo === 'simples' && !compValor.trim()) || 
                  (compTipo === 'multiplo' && parseInt(compMinOpcoes) > parseInt(compMaxOpcoes))
                }
              >
                {editCompId ? "Salvar" : "Salvar Modelo"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============ Modal: Confirmar Sincronização Global ============ */}
      <Modal open={showSyncModal} onClose={() => !compSaving && setShowSyncModal(false)} title="Sincronizar Alterações?">
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-2xl bg-[var(--cp-flour)] border-2 border-[var(--cp-line)]">
             <p className="text-[13px] font-bold mb-3 uppercase tracking-tight" style={{ color: 'var(--cp-ink)' }}>
               Este modelo é utilizado em {affectedProducts.length} {affectedProducts.length === 1 ? 'produto' : 'produtos'}:
             </p>
             <div className="max-h-[120px] overflow-y-auto flex flex-wrap gap-2">
                {affectedProducts.map(p => (
                  <span key={p.id} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-[var(--cp-line-strong)] text-[var(--cp-ink-muted)]">
                    {p.nome}
                  </span>
                ))}
             </div>
          </div>
          
          {syncHasAvailabilityChanges ? (
            <>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertIcon size={16} className="text-amber-600 mt-0.5 flex-none" />
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  <strong>Aviso:</strong> Apenas mudanças de <strong>disponibilidade (ativar/desativar)</strong> serão sincronizadas. Alterações em nomes, preços ou posições feitas no modelo não afetarão os produtos listados para preservar suas customizações locais.
                </p>
              </div>
              
              <p className="text-[12px] font-medium opacity-70 leading-relaxed">
                Deseja aplicar as mudanças de <strong>disponibilidade</strong> em todos os produtos listados acima ou apenas salvar o modelo?
              </p>

              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  fullWidth 
                  onClick={() => processSaveComplemento(true)}
                  loading={compSaving}
                >
                  Sim, aplicar em todos os produtos
                </Button>
                <Button 
                  fullWidth 
                  variant="ghost" 
                  onClick={() => processSaveComplemento(false)}
                  loading={compSaving}
                  disabled={compSaving}
                >
                  Não, salvar apenas no modelo
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <AlertIcon size={16} className="text-blue-600 mt-0.5 flex-none" />
                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                  <strong>Nota:</strong> Como não houve mudanças na disponibilidade dos itens, as alterações feitas (nomes, preços, etc.) serão aplicadas <strong>apenas ao modelo</strong> e não afetarão os produtos existentes.
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  fullWidth 
                  onClick={() => processSaveComplemento(false)}
                  loading={compSaving}
                >
                  Entendido e Salvar Modelo
                </Button>
                <Button 
                  fullWidth 
                  variant="ghost" 
                  onClick={() => setShowSyncModal(false)}
                  disabled={compSaving}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ============ Modal: Confirmação de Exclusão ============ */}
      <Modal open={showConfirm} onClose={() => !confirmLoading && setShowConfirm(false)} title={confirmData.title}>
        <div className="flex flex-col gap-4">
          <p className="text-[15px] font-medium leading-relaxed" style={{ color: 'var(--cp-ink-muted)' }}>
            {confirmData.message}
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)} disabled={confirmLoading}>
              Cancelar
            </Button>
            <Button 
              size="sm" 
              variant="danger" 
              onClick={confirmData.onConfirm} 
              loading={confirmLoading}
            >
              Excluir permanentemente
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============ Modal: Apenas Troca de Imagem ============ */}
      <Modal open={showImgModal} onClose={() => setShowImgModal(false)} title="Trocar imagem do produto">
        <div className="flex flex-col gap-6 py-2">
          {selectedProdForImg && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--cp-flour)', border: '1px solid var(--cp-line)' }}>
              <div className="w-10 h-10 rounded-lg overflow-hidden relative flex-none" style={{ backgroundColor: 'var(--cp-dough)' }}>
                {selectedProdForImg.imagem_url && <Image src={selectedProdForImg.imagem_url} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-black" style={{ color: 'var(--cp-ink)' }}>{selectedProdForImg.nome}</span>
                <span className="text-[11px] opacity-60">Substituir imagem atual</span>
              </div>
            </div>
          )}

          {/* Área de Drop / Seleção */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) {
                setImgFile(file);
                setImgPreview(URL.createObjectURL(file));
              }
            }}
            className={`
              relative min-h-[220px] rounded-3xl border-2 border-dashed transition-all duration-300
              flex flex-col items-center justify-center p-6 text-center cursor-pointer
              ${isDragging ? 'border-[var(--cp-red)] bg-red-50/50' : 'border-[var(--cp-line-strong)] bg-gray-50/30 hover:bg-gray-50'}
            `}
            onClick={() => document.getElementById('image-upload-input')?.click()}
          >
            <input
              id="image-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImgFile(file);
                  setImgPreview(URL.createObjectURL(file));
                }
              }}
            />

            {imgPreview ? (
              <div className="relative w-full h-40 group/prev">
                <Image src={imgPreview} alt="Preview" fill sizes="400px" style={{ objectFit: 'contain' }} className="rounded-xl" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/prev:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                   <span className="bg-white px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider shadow-md">Trocar</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center border-2 border-[var(--cp-line)]">
                   <div className="w-6 h-6 border-2 border-[var(--cp-line-strong)] rounded-md opacity-40" />
                </div>
                <div>
                  <p className="text-[14px] font-bold m-0" style={{ color: 'var(--cp-ink)' }}>Arraste uma imagem ou clique para selecionar</p>
                  <p className="text-[11px] opacity-50 mt-1 uppercase tracking-widest font-black">PNG, JPG ou WEBP até 5MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowImgModal(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleUpdateProductImage}
              loading={imgSaving}
              disabled={!imgFile}
            >
              Salvar Nova Imagem
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL TAGS */}
      <Modal 
        open={showTagModal} 
        onClose={() => { setShowTagModal(false); setNewTagName(''); }} 
        title="Tags do Produto"
      >
        <div className="flex flex-col gap-6">
          <div>
            <FieldLabel label="Criar Nova Tag" />
            <div className="flex gap-2 mt-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  maxLength={20}
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Ex: Picante, Vegano..."
                  className="w-full py-2.5 pl-3 pr-12 rounded-lg border-2 text-[14px] font-semibold outline-none transition-colors"
                  style={{ borderColor: 'var(--cp-line-strong)', backgroundColor: 'var(--cp-flour)', color: 'var(--cp-ink)' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--cp-red)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--cp-line-strong)')}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black transition-opacity ${newTagName.length > 0 ? 'opacity-40' : 'opacity-0'}`}>
                  {newTagName.length}/20
                </span>
              </div>
              <Button 
                onClick={async () => {
                  if (!newTagName.trim()) return;
                  setTagSaving(true);
                  const { data, error } = await supabase.from('tags').insert({ nome: newTagName.trim() }).select().single();
                  if (!error && data) {
                    setTags([...tags, data]);
                    setNewTagName('');
                  }
                  setTagSaving(false);
                }}
                disabled={tagSaving || !newTagName.trim()}
              >
                Criar
              </Button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <FieldLabel label="Escolher Tags (Máx 3)" />
              <span className="text-[9px] font-black uppercase tracking-wider opacity-30">Clique para ativar</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {tags.map(tag => {
                const isSelected = selectedProdForTag && (produtoTags[selectedProdForTag] || []).includes(tag.id);
                const currentCount = (selectedProdForTag && (produtoTags[selectedProdForTag] || []).length) || 0;
                
                return (
                  <button
                    key={tag.id}
                    onClick={async () => {
                      if (!selectedProdForTag) return;
                      if (isSelected) {
                        await supabase.from('produto_tags').delete().match({ produto_id: selectedProdForTag, tag_id: tag.id });
                        setProdutoTags({
                          ...produtoTags,
                          [selectedProdForTag]: (produtoTags[selectedProdForTag] || []).filter(tid => tid !== tag.id)
                        });
                      } else {
                        if (currentCount >= 3) return;
                        await supabase.from('produto_tags').insert({ produto_id: selectedProdForTag, tag_id: tag.id });
                        setProdutoTags({
                          ...produtoTags,
                          [selectedProdForTag]: [...(produtoTags[selectedProdForTag] || []), tag.id]
                        });
                      }
                    }}
                    className={`py-2 px-3 rounded-lg border-2 text-[12px] font-bold transition-all text-left ${isSelected ? 'bg-[var(--cp-ink)] text-white border-[var(--cp-ink)]' : 'bg-white text-[var(--cp-ink)] border-[var(--cp-line-strong)]'}`}
                  >
                    {tag.nome}
                    {isSelected && <span className="float-right">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* ============ Modal: Aviso de Preço Zero ============ */}
      <Modal 
        open={showPriceZeroModal} 
        onClose={() => setShowPriceZeroModal(false)} 
        title="Produto sem valor?"
      >
        <div className="flex flex-col gap-5">
          <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200 flex gap-4">
            <AlertIcon className="text-amber-600 flex-none mt-1" size={24} />
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-black text-amber-900 uppercase tracking-tight">Obrigatório Opcionais</span>
              <p className="text-[13px] font-medium text-amber-800 leading-relaxed m-0">
                Produtos com valor <strong>R$ 0,00</strong> precisam ter pelo menos um opcional cadastrado para serem exibidos corretamente no cardápio.
              </p>
            </div>
          </div>
          
          <p className="text-[14px] text-[var(--cp-ink-muted)] font-medium leading-relaxed px-1">
            Deseja salvar o produto agora e já abrir a tela de adição de opcionais?
          </p>

          <div className="flex flex-col gap-3 mt-4">
            <Button 
              fullWidth 
              onClick={async () => {
                const newId = await processSaveProduto();
                if (newId) {
                  setShowPriceZeroModal(false);
                  openAddComplementoProduto(newId);
                }
              }}
            >
              Salvar e Adicionar Opcional
            </Button>
            <Button 
              fullWidth 
              variant="ghost" 
              onClick={() => setShowPriceZeroModal(false)}
            >
              Voltar e corrigir preço
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============ Modal: Agendamento de Categoria ============ */}
      <Modal 
        open={showScheduleModal} 
        onClose={() => setShowScheduleModal(false)} 
        title="Agendar Categoria"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'var(--cp-flour)', border: '1px solid var(--cp-line)' }}>
            <div className="flex flex-col">
              <span className="text-[14px] font-black" style={{ color: 'var(--cp-ink)' }}>{selectedCatForSchedule?.nome}</span>
              <span className="text-[12px] opacity-60">Selecione os dias em que esta categoria ficará ativa no cardápio.</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { id: 1, label: 'Segunda-feira' },
              { id: 2, label: 'Terça-feira' },
              { id: 3, label: 'Quarta-feira' },
              { id: 4, label: 'Quinta-feira' },
              { id: 5, label: 'Sexta-feira' },
              { id: 6, label: 'Sábado' },
              { id: 0, label: 'Domingo' },
            ].map((day) => (
              <label 
                key={day.id}
                className="flex items-center justify-between p-3.5 px-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-gray-50/50"
                style={{ 
                  borderColor: tempActiveDays.includes(day.id) ? 'var(--cp-ink)' : 'var(--cp-line-strong)',
                  backgroundColor: tempActiveDays.includes(day.id) ? 'white' : 'transparent',
                  boxShadow: tempActiveDays.includes(day.id) ? '0 3px 0 0 var(--cp-line-strong)' : 'none',
                  transform: tempActiveDays.includes(day.id) ? 'translateY(-1px)' : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-md border-2 grid place-items-center transition-all"
                    style={{ 
                      backgroundColor: tempActiveDays.includes(day.id) ? 'var(--cp-red)' : 'transparent',
                      borderColor: tempActiveDays.includes(day.id) ? 'var(--cp-ink)' : 'var(--cp-line-strong)'
                    }}
                  >
                    {tempActiveDays.includes(day.id) && <span className="text-white text-[10px] font-black">✓</span>}
                  </div>
                  <span className="text-[14px] font-bold" style={{ color: 'var(--cp-ink)' }}>{day.label}</span>
                </div>
                
                <input 
                  type="checkbox"
                  className="hidden"
                  checked={tempActiveDays.includes(day.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTempActiveDays([...tempActiveDays, day.id]);
                    } else {
                      setTempActiveDays(tempActiveDays.filter(d => d !== day.id));
                    }
                  }}
                />
                
                <span className={`text-[9px] font-black uppercase tracking-wider transition-opacity ${tempActiveDays.includes(day.id) ? 'opacity-100 text-[var(--cp-red)]' : 'opacity-20'}`}>
                  {tempActiveDays.includes(day.id) ? 'Ativo' : 'Inativo'}
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSchedule}
              loading={scheduleSaving}
            >
              Salvar Programação
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
