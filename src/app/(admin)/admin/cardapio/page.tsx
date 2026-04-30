'use client';

// =============================================================
// Center Pizza · Cardápio — Edição do Cardápio
// Rota: /admin/cardapio  (funcional com Supabase)
// =============================================================

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import {
  SearchIcon,
  PlusIcon,
  DragIcon,
  EditIcon,
  CopyIcon,
  TrashIcon,
  ChevronUpIcon,
  ExpandIcon,
} from '@/components/admin/icons';
import Button from '@/components/ui/Button';

// -------------------------------------------------------------
// Supabase client
// -------------------------------------------------------------
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  created_at: string;
};

type DBProduto = {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string;
  preco_venda: number;
  preco_original: number | null;
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
  complemento_opcoes?: DBComplementoOpcao[];
};

// -------------------------------------------------------------
// IconBtn
// -------------------------------------------------------------
function IconBtn({
  children, title, onClick, danger,
}: {
  children: React.ReactNode; title: string; onClick?: () => void; danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className="w-8 h-8 grid place-items-center rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
      style={{ color: 'var(--cp-ink-faint)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger ? 'rgba(227,6,19,0.08)' : 'var(--cp-dough)';
        e.currentTarget.style.color = danger ? 'var(--cp-red)' : 'var(--cp-ink)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--cp-ink-faint)';
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
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl p-6 mx-4 animate-fade-in-up"
        style={{ backgroundColor: '#fff', boxShadow: 'var(--shadow-3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <span
            className="text-lg font-black"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--cp-ink)' }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-full border-0 bg-transparent cursor-pointer text-lg"
            style={{ color: 'var(--cp-ink-muted)' }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Label + Input helpers
// -------------------------------------------------------------
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
// Product Row
// -------------------------------------------------------------
function ProductRow({
  produto, onDelete, onEdit, onAddComplemento,
}: {
  produto: DBProduto; onDelete: (id: string) => void; onEdit: (produto: DBProduto) => void; onAddComplemento: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 py-3 px-3 rounded-xl transition-colors group"
      style={{ borderBottom: '1px solid var(--cp-line)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(245,239,224,0.5)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Drag */}
      <span className="flex-none cursor-grab opacity-30 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--cp-ink-faint)' }}>
        <DragIcon size={14} />
      </span>

      {/* Image */}
      <div
        className="w-20 h-20 rounded-xl overflow-hidden flex-none relative"
        style={{ backgroundColor: 'var(--cp-dough)', border: '1px solid var(--cp-line)' }}
      >
        {produto.imagem_url ? (
          <Image src={produto.imagem_url} alt={produto.nome} fill sizes="80px" style={{ objectFit: 'cover' }} />
        ) : (
          <div className="w-full h-full grid place-items-center text-3xl opacity-40">📷</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span
          className="text-[14px] font-bold truncate block"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--cp-ink)' }}
        >
          {produto.nome}
        </span>
        <p className="text-[12px] m-0 truncate" style={{ color: 'var(--cp-ink-muted)', maxWidth: '500px' }}>
          {produto.descricao}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {produto.preco_original && (
            <span className="text-[11px] line-through" style={{ color: 'var(--cp-ink-faint)' }}>
              R$ {Number(produto.preco_original).toFixed(2).replace('.', ',')}
            </span>
          )}
          <span className="text-[14px] font-black" style={{ color: 'var(--cp-red)', fontFamily: 'var(--font-body)' }}>
            R$ {Number(produto.preco_venda).toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-none">
        <IconBtn title="Adicionar opcional" onClick={() => onAddComplemento(produto.id)}><PlusIcon size={15} /></IconBtn>
        <IconBtn title="Editar" onClick={() => onEdit(produto)}><EditIcon size={15} /></IconBtn>
        <IconBtn title="Duplicar"><CopyIcon size={15} /></IconBtn>
        <IconBtn title="Excluir" danger onClick={() => onDelete(produto.id)}>
          <TrashIcon size={15} />
        </IconBtn>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Botão tracejado "Adicionar"
// -------------------------------------------------------------
function DashedAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 py-3 px-5 rounded-2xl border-0 bg-transparent cursor-pointer transition-all"
      style={{
        border: '2px dashed var(--cp-crust)',
        backgroundColor: 'rgba(217,136,65,0.06)',
        color: 'var(--cp-crust)',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '13px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(217,136,65,0.14)';
        e.currentTarget.style.borderColor = 'var(--cp-crust-deep)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(217,136,65,0.06)';
        e.currentTarget.style.borderColor = 'var(--cp-crust)';
      }}
    >
      <span
        className="w-5 h-5 rounded-full grid place-items-center flex-none"
        style={{ backgroundColor: 'var(--cp-crust)', color: '#fff' }}
      >
        <PlusIcon size={12} />
      </span>
      {label}
    </button>
  );
}

// -------------------------------------------------------------
// Category Section
// -------------------------------------------------------------
function CategorySection({
  categoria,
  onDeleteCategoria,
  onEditCategoria,
  onDeleteProduto,
  onEditProduto,
  onAddProduto,
  onAddComplemento,
}: {
  categoria: CategoriaComProdutos;
  onDeleteCategoria: (id: string) => void;
  onEditCategoria: (categoria: CategoriaComProdutos) => void;
  onDeleteProduto: (id: string) => void;
  onEditProduto: (produto: DBProduto) => void;
  onAddProduto: (categoriaId: string) => void;
  onAddComplemento: (produtoId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: '#fff', border: '1px solid var(--cp-line)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
        style={{ borderBottom: expanded ? '1px solid var(--cp-line)' : 'none' }}
      >
        <span className="flex-none opacity-40 cursor-grab" style={{ color: 'var(--cp-ink-faint)' }}>
          <DragIcon size={14} />
        </span>

        <span
          className="w-9 h-9 rounded-xl grid place-items-center text-lg flex-none"
          style={{ backgroundColor: 'var(--cp-dough)' }}
        >
          🍕
        </span>

        <span
          className="text-[16px] font-black tracking-wide"
          style={{ fontFamily: 'var(--font-body)', color: 'var(--cp-ink)' }}
        >
          {categoria.nome}
        </span>

        <span
          className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md"
          style={{ backgroundColor: 'var(--cp-dough)', color: 'var(--cp-ink-muted)' }}
        >
          {categoria.produtos.length} itens
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn title="Editar categoria" onClick={() => onEditCategoria(categoria)}><EditIcon size={15} /></IconBtn>
          <IconBtn title="Duplicar categoria"><CopyIcon size={15} /></IconBtn>
          <IconBtn title="Excluir categoria" danger onClick={() => onDeleteCategoria(categoria.id)}>
            <TrashIcon size={15} />
          </IconBtn>
          <span
            className="w-8 h-8 grid place-items-center"
            style={{
              color: 'var(--cp-ink-muted)',
              transform: expanded ? 'rotate(0)' : 'rotate(180deg)',
              transition: 'transform 200ms ease',
            }}
          >
            <ChevronUpIcon size={16} />
          </span>
        </div>
      </div>

      {/* Products */}
      {expanded && (
        <div className="px-4 py-2">
          {categoria.produtos.length > 0 && (
            <span
              className="block text-[9px] font-black tracking-[0.18em] uppercase px-3 pt-2 pb-1"
              style={{ color: 'var(--cp-ink-faint)' }}
            >
              Produtos
            </span>
          )}
          {categoria.produtos.map((p) => (
            <ProductRow key={p.id} produto={p} onDelete={onDeleteProduto} onEdit={onEditProduto} onAddComplemento={onAddComplemento} />
          ))}

          {/* Adicionar novo produto (dentro da categoria) */}
          <div className="mt-3 mb-2">
            <DashedAddButton
              label="Adicionar novo produto"
              onClick={() => onAddProduto(categoria.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================
// PÁGINA PRINCIPAL
// =============================================================
export default function CardapioPage() {
  const [categorias, setCategorias] = useState<CategoriaComProdutos[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Complementos
  const [complementos, setComplementos] = useState<DBComplemento[]>([]);
  const [showCompModal, setShowCompModal] = useState(false);
  const [compStep, setCompStep] = useState<1 | 2>(1);
  const [compProdutoId, setCompProdutoId] = useState<string | null>(null);
  const [editCompId, setEditCompId] = useState<string | null>(null);
  const [compNome, setCompNome] = useState('');
  const [compDescricao, setCompDescricao] = useState('');
  const [compTipo, setCompTipo] = useState<'simples' | 'multiplo'>('simples');
  const [compValor, setCompValor] = useState('');
  const [compMinOpcoes, setCompMinOpcoes] = useState('0');
  const [compMaxOpcoes, setCompMaxOpcoes] = useState('1');
  const [compOpcoes, setCompOpcoes] = useState<DBComplementoOpcao[]>([]);
  const [compSaving, setCompSaving] = useState(false);

  const addCompOpcao = () => {
    setCompOpcoes([...compOpcoes, { nome: '', descricao: '', valor: '' }]);
  };

  const updateCompOpcao = (index: number, key: keyof DBComplementoOpcao, value: string) => {
    const newOpcoes = [...compOpcoes];
    newOpcoes[index] = { ...newOpcoes[index], [key]: value };
    setCompOpcoes(newOpcoes);
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
  const [prodPrecoOriginal, setProdPrecoOriginal] = useState('');
  const [prodImagemFile, setProdImagemFile] = useState<File | null>(null);
  const [prodImagemPreview, setProdImagemPreview] = useState<string | null>(null);
  const [prodSaving, setProdSaving] = useState(false);

  // -----------------------------------------------------------
  // Fetch
  // -----------------------------------------------------------
  const fetchData = useCallback(async () => {
    const { data: cats } = await supabase
      .from('categorias')
      .select('*')
      .order('posicao', { ascending: true });

    const { data: prods } = await supabase
      .from('produtos')
      .select('*')
      .order('posicao', { ascending: true });

    const { data: comps } = await supabase
      .from('complementos')
      .select('*, complemento_opcoes(*)')
      .order('posicao', { ascending: true });

    const categoriasList: CategoriaComProdutos[] = (cats || []).map((c: DBCategoria) => ({
      ...c,
      produtos: (prods || []).filter((p: DBProduto) => p.categoria_id === c.id),
    }));

    setCategorias(categoriasList);
    if (comps) setComplementos(comps);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -----------------------------------------------------------
  // CRUD complemento
  // -----------------------------------------------------------
  const openEditComplemento = (comp: DBComplemento) => {
    setEditCompId(comp.id);
    setCompProdutoId(comp.produto_id);
    setCompNome(comp.nome);
    setCompDescricao(comp.descricao || '');
    setCompTipo(comp.tipo);
    setCompValor(comp.valor ? comp.valor.toString() : '');
    setCompMinOpcoes(comp.min_opcoes ? comp.min_opcoes.toString() : '0');
    setCompMaxOpcoes(comp.max_opcoes ? comp.max_opcoes.toString() : '1');
    setCompOpcoes(comp.complemento_opcoes?.map(o => ({ ...o, valor: o.valor.toString() })) || []);
    setCompStep(2);
    setShowCompModal(true);
  };

  const openAddComplementoProduto = (produtoId: string) => {
    setEditCompId(null);
    setCompProdutoId(produtoId);
    setCompNome('');
    setCompDescricao('');
    setCompTipo('simples');
    setCompValor('');
    setCompMinOpcoes('0');
    setCompMaxOpcoes('1');
    setCompOpcoes([]);
    setCompStep(1);
    setShowCompModal(true);
  };

  const handleCreateComplemento = async () => {
    if (!compNome.trim() || !compProdutoId) return;
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
      }).select().single();
      
      if (newComp) novoCompId = newComp.id;
    }

    if (compTipo === 'multiplo' && novoCompId) {
      await supabase.from('complemento_opcoes').delete().eq('complemento_id', novoCompId);
      if (compOpcoes.length > 0) {
         await supabase.from('complemento_opcoes').insert(
           compOpcoes.map((op, i) => ({
              complemento_id: novoCompId,
              nome: op.nome.trim(),
              descricao: op.descricao.trim(),
              valor: parseFloat(op.valor.replace(',', '.')) || 0,
              posicao: i
           }))
         );
      }
    }

    setCompNome('');
    setCompDescricao('');
    setCompTipo('simples');
    setCompValor('');
    setCompOpcoes([]);
    setEditCompId(null);
    setCompProdutoId(null);
    setCompStep(1);
    setCompSaving(false);
    setShowCompModal(false);
    fetchData();
  };

  const handleDeleteComplemento = async (id: string) => {
    if (!confirm('Excluir este complemento?')) return;
    await supabase.from('complementos').delete().eq('id', id);
    fetchData();
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
    if (!catNome.trim() || !catDescricao.trim()) return;
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

  const handleDeleteCategoria = async (id: string) => {
    if (!confirm('Excluir esta categoria e todos os produtos dela?')) return;
    await supabase.from('categorias').delete().eq('id', id);
    fetchData();
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
    setProdPrecoOriginal(prod.preco_original ? prod.preco_original.toString() : '');
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
    setProdPrecoOriginal('');
    setProdImagemFile(null);
    setProdImagemPreview(null);
    setShowProdModal(true);
  };

  const handleCreateProduto = async () => {
    if (!prodNome.trim() || !prodDescricao.trim() || !prodPrecoVenda.trim() || !prodCategoriaId) return;
    setProdSaving(true);
    
    let finalImageUrl: string | null = null;

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
      await supabase.from('produtos').update({
        categoria_id: prodCategoriaId,
        nome: prodNome.trim(),
        descricao: prodDescricao.trim(),
        preco_venda: parseFloat(prodPrecoVenda.replace(',', '.')),
        preco_original: prodPrecoOriginal.trim()
          ? parseFloat(prodPrecoOriginal.replace(',', '.'))
          : null,
        ...(finalImageUrl ? { imagem_url: finalImageUrl } : {}),
      }).eq('id', editProdId);
    } else {
      const catProds = categorias.find((c) => c.id === prodCategoriaId)?.produtos || [];
      const maxPos = catProds.length > 0 ? Math.max(...catProds.map((p) => p.posicao)) + 1 : 0;
      await supabase.from('produtos').insert({
        categoria_id: prodCategoriaId,
        nome: prodNome.trim(),
        descricao: prodDescricao.trim(),
        preco_venda: parseFloat(prodPrecoVenda.replace(',', '.')),
        preco_original: prodPrecoOriginal.trim()
          ? parseFloat(prodPrecoOriginal.replace(',', '.'))
          : null,
        imagem_url: finalImageUrl,
        posicao: maxPos,
      });
    }

    setEditProdId(null);
    setProdSaving(false);
    setShowProdModal(false);
    fetchData();
  };

  const handleDeleteProduto = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    await supabase.from('produtos').delete().eq('id', id);
    fetchData();
  };

  // -----------------------------------------------------------
  // Totais
  // -----------------------------------------------------------
  const totalItems = categorias.reduce((s, c) => s + c.produtos.length, 0);
  const totalCategories = categorias.length;

  // -----------------------------------------------------------
  // Render
  // -----------------------------------------------------------
  if (loading) {
    return (
      <div className="px-7 py-20 text-center">
        <div
          className="w-8 h-8 border-[3px] rounded-full mx-auto mb-3"
          style={{
            borderColor: 'var(--cp-line)',
            borderTopColor: 'var(--cp-red)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p className="text-sm font-bold m-0" style={{ color: 'var(--cp-ink-muted)' }}>Carregando cardápio...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <div className="px-7 py-6 flex flex-col gap-5">
        {/* Header */}
        <div>
          <span
            className="text-[9px] font-black tracking-[0.16em] uppercase"
            style={{ color: 'var(--cp-red)', fontFamily: 'var(--font-body)' }}
          >
            {totalItems} itens · {totalCategories} categorias
          </span>
          <span
            className="text-[10px] font-bold tracking-wider uppercase mt-1 block"
            style={{ color: 'var(--cp-ink-faint)' }}
          >
            Arraste ⠿ para reordenar · Clique para expandir
          </span>
        </div>

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
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-0 outline-none text-xs font-semibold"
              style={{ color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
            />
          </div>

          {/* Expand all */}
          <button
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border cursor-pointer text-[11px] font-black tracking-wider uppercase bg-transparent transition-colors"
            style={{ borderColor: 'var(--cp-line-strong)', color: 'var(--cp-ink)', fontFamily: 'var(--font-body)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--cp-dough)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <ExpandIcon size={13} /> Expandir todos
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

        {/* Categories section label */}
        <span
          className="text-[9px] font-black tracking-[0.18em] uppercase"
          style={{ color: 'var(--cp-ink-faint)', fontFamily: 'var(--font-body)' }}
        >
          Categorias do cardápio
        </span>

        {/* Category list */}
        <div className="flex flex-col gap-4">
          {categorias.map((cat) => (
            <CategorySection
              key={cat.id}
              categoria={cat}
              onDeleteCategoria={handleDeleteCategoria}
              onEditCategoria={openEditCategoria}
              onDeleteProduto={handleDeleteProduto}
              onEditProduto={openEditProduto}
              onAddProduto={openProdutoModal}
              onAddComplemento={openAddComplementoProduto}
            />
          ))}
        </div>

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
            Complementos Globais
          </span>
          <div className="flex flex-col gap-3">
            {complementos.map((comp) => (
              <div
                key={comp.id}
                className="flex items-center gap-3 py-3 px-4 rounded-xl transition-colors group"
                style={{ backgroundColor: '#fff', border: '1px solid var(--cp-line)' }}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[14px] font-bold block" style={{ fontFamily: 'var(--font-body)', color: 'var(--cp-ink)' }}>
                    {comp.nome}
                    <span className="ml-2 text-[10px] uppercase font-black px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--cp-dough)', color: 'var(--cp-ink-muted)' }}>{comp.tipo}</span>
                  </span>
                  <p className="text-[12px] m-0 truncate text-[var(--cp-ink-muted)]">{comp.descricao}</p>
                  <span className="text-[13px] font-black text-[var(--cp-red)] block mt-1">
                    R$ {Number(comp.valor).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 flex-none">
                  <IconBtn title="Editar" onClick={() => openEditComplemento(comp)}><EditIcon size={15} /></IconBtn>
                  <IconBtn title="Excluir" danger onClick={() => handleDeleteComplemento(comp.id)}><TrashIcon size={15} /></IconBtn>
                </div>
              </div>
            ))}
            {complementos.length === 0 && (
              <div className="py-6 text-center text-[13px] font-bold opacity-50" style={{ color: 'var(--cp-ink-muted)' }}>
                Nenhum complemento cadastrado
              </div>
            )}
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
            <FieldLabel label="Descrição" required />
            <FieldTextarea
              value={catDescricao}
              onChange={setCatDescricao}
              placeholder="Breve descrição da categoria..."
              required
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCatModal(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateCategoria}
              loading={catSaving}
              disabled={!catNome.trim() || !catDescricao.trim()}
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
            <FieldLabel label="Descrição" required />
            <FieldTextarea
              value={prodDescricao}
              onChange={setProdDescricao}
              placeholder="Ingredientes ou descrição do produto..."
              required
            />
          </div>

          {/* Preços lado a lado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Valor original" />
              <FieldInput
                value={prodPrecoOriginal}
                onChange={setProdPrecoOriginal}
                placeholder="Ex: 59,90 (opcional)"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel label="Valor de venda" required />
              <FieldInput
                value={prodPrecoVenda}
                onChange={setProdPrecoVenda}
                placeholder="Ex: 49,90"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" size="sm" onClick={() => setShowProdModal(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateProduto}
              loading={prodSaving}
              disabled={!prodNome.trim() || !prodDescricao.trim() || !prodPrecoVenda.trim()}
            >
              {editProdId ? "Salvar Produto" : "Criar Produto"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============ Modal: Novo/Editar Complemento ============ */}
      <Modal open={showCompModal} onClose={() => setShowCompModal(false)} title={editCompId ? "Editar Complemento" : "Novo Complemento"}>
        {compStep === 1 ? (
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-bold text-center mb-3" style={{ color: 'var(--cp-ink-muted)' }}>
              Qual o tipo de adicional você quer criar?
            </span>
            <button
              onClick={() => { setCompTipo('simples'); setCompStep(2); }}
              className="flex flex-col items-center p-5 rounded-2xl border-2 text-left cursor-pointer transition-colors"
              style={{ borderColor: 'var(--cp-line)', backgroundColor: '#fff', color: 'var(--cp-ink)' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cp-red)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--cp-line)'}
            >
              <span className="text-[15px] font-black" style={{ fontFamily: 'var(--font-display)' }}>Adicional Simples</span>
              <span className="text-[12px] opacity-70 mt-1 text-center">Um item que o cliente pode adicionar por um valor fixo. (Ex: Borda Recheada)</span>
            </button>

            <button
              onClick={() => { setCompTipo('multiplo'); setCompStep(2); }}
              className="flex flex-col items-center p-5 rounded-2xl border-2 text-left cursor-pointer transition-colors"
              style={{ borderColor: 'var(--cp-line)', backgroundColor: '#fff', color: 'var(--cp-ink)' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cp-red)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--cp-line)'}
            >
              <span className="text-[15px] font-black" style={{ fontFamily: 'var(--font-display)' }}>Grupo de Opções (Múltiplo)</span>
              <span className="text-[12px] opacity-70 mt-1 text-center">Um grupo onde o cliente escolhe entre várias opções. (Ex: Escolha o sabor da borda)</span>
            </button>
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
              <span className="text-[10px] uppercase font-black px-2 py-1 rounded" style={{ backgroundColor: 'var(--cp-dough)', color: 'var(--cp-ink-muted)' }}>
                {compTipo === 'simples' ? 'Simples' : 'Múltiplo'}
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
                <FieldLabel label="Valor (R$)" required />
                <FieldInput value={compValor} onChange={setCompValor} placeholder="Ex: 5,00" required />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel label="Mínimo de escolhas" required />
                    <FieldInput value={compMinOpcoes} onChange={setCompMinOpcoes} placeholder="Ex: 0" type="number" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldLabel label="Máximo de escolhas" required />
                    <FieldInput value={compMaxOpcoes} onChange={setCompMaxOpcoes} placeholder="Ex: 1" type="number" required />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <FieldLabel label="Opções do Adicional" required />
                  {compOpcoes.map((opcao, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 rounded-lg border relative" style={{ borderColor: 'var(--cp-line)', backgroundColor: '#fafafa' }}>
                      <button onClick={() => removeCompOpcao(idx)} className="absolute top-2 right-2 text-red-500 font-bold bg-transparent border-0 cursor-pointer text-xs">Remover</button>
                      <div className="grid grid-cols-2 gap-2 pr-12">
                        <input value={opcao.nome} onChange={(e) => updateCompOpcao(idx, 'nome', e.target.value)} placeholder="Nome da opção" className="py-2 px-2 text-xs border rounded-md" required />
                        <input value={opcao.valor} onChange={(e) => updateCompOpcao(idx, 'valor', e.target.value)} placeholder="Valor (+ R$)" className="py-2 px-2 text-xs border rounded-md" />
                      </div>
                      <input value={opcao.descricao} onChange={(e) => updateCompOpcao(idx, 'descricao', e.target.value)} placeholder="Descrição da opção" className="py-2 px-2 text-xs border rounded-md" />
                    </div>
                  ))}
                  <DashedAddButton label="Adicionar Opção" onClick={addCompOpcao} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowCompModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleCreateComplemento} loading={compSaving} disabled={!compNome.trim() || (compTipo === 'simples' && !compValor.trim())}>
                {editCompId ? "Salvar" : "Continuar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
