'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Image from 'next/image';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { createBrowserClient } from '@supabase/ssr';
import { SearchIcon, PlusIcon, MinusIcon, XIcon, ChevronRightIcon, InfoIcon, ShoppingBagIcon, ArrowLeftIcon, StarIcon, CheckIcon, AlertCircle } from 'lucide-react';

// -------------------------------------------------------------
// Supabase client
// -------------------------------------------------------------
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// -------------------------------------------------------------
// Tipos
// -------------------------------------------------------------
type DBComplementoOpcao = {
  id: string;
  nome: string;
  valor: number;
  posicao: number;
  ativo?: boolean;
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
  ativo?: boolean;
  is_meio_a_meio?: boolean;
  complemento_opcoes?: DBComplementoOpcao[];
};

type DBProduto = {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string;
  preco_venda: number;
  preco_anterior?: number;
  imagem_url: string | null;
  visivel: boolean;
  posicao: number;
  complementos?: DBComplemento[];
  tags?: string[];
};

type DBCategoria = {
  id: string;
  nome: string;
  descricao: string;
  posicao: number;
  ativa: boolean;
  active_days?: number[];
  produtos: DBProduto[];
};

type CartItem = {
  cart_item_id: string; // ID único para cada item/combinação no carrinho
  produto_id: string;
  nome: string;
  imagem_url: string | null;
  quantidade: number;
  preco_unitario: number;
  total: number;
  observacao: string;
  opcoes: {
    complemento_id: string;
    complemento_nome: string;
    is_meio_a_meio?: boolean;
    itens: {
      id: string;
      nome: string;
      valor: number;
    }[];
  }[];
};

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------
const formatPrice = (price: number) => {
  if (price === 0) return 'Grátis';
  return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const calculateStartingPrice = (prod: DBProduto) => {
  let base = Number(prod.preco_venda);
  
  if (prod.complementos) {
    // Apenas complementos ativos
    const activeComps = prod.complementos.filter(c => c.ativo !== false);
    
    activeComps.forEach(comp => {
      // Ignora complementos simples para o preço "A partir de", pois agora são sempre opcionais
      if (comp.min_opcoes > 0 && comp.tipo !== 'simples') {
        if (comp.tipo === 'multiplo' && comp.complemento_opcoes) {
          // Se é múltiplo e obrigatório, soma as N opções mais baratas (onde N = min_opcoes)
          const activeOptions = comp.complemento_opcoes.filter(o => o.ativo !== false);
          const sortedOptions = [...activeOptions].sort((a, b) => Number(a.valor) - Number(b.valor));
          
          if (comp.is_meio_a_meio) {
            // Se o admin exige 2 sabores, o preço mínimo é o do 2º sabor mais barato (pois cobra o maior)
            // Se aceita 1 sabor (Único), o preço mínimo é o do sabor mais barato.
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
// Componente de Preço Estilizado
// -------------------------------------------------------------
function PriceDisplay({ price, originalPrice, label, size = 'md', align = 'left' }: { price: number; originalPrice?: number; label?: string; size?: 'md' | 'lg', align?: 'left' | 'right' }) {
  const isLg = size === 'lg';
  const hasPromo = !!originalPrice && Number(originalPrice) > Number(price);
  
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
      {label && (
        <span className="text-[10px] font-black text-[var(--cp-ink-faint)] uppercase tracking-wider mb-0.5 opacity-60">
          {label}
        </span>
      )}
      
      {!!hasPromo && !!originalPrice && (
        <span className="text-[12px] font-bold text-[var(--cp-ink-faint)] line-through opacity-70 leading-none mb-1">
          R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )}
      
      {price <= 0 ? (
        <span className="text-[20px] font-black text-[var(--cp-green)] uppercase tracking-widest py-1">Grátis</span>
      ) : (
        <div className={`flex items-baseline gap-0.5 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[15px] font-black text-[var(--cp-red)]">R$</span>
          <span className="text-[30px] font-black text-[var(--cp-red)] leading-none" style={{ fontFamily: 'var(--font-display-alt)' }}>
            {Math.floor(price)}
          </span>
          <span className="text-[15px] font-black text-[var(--cp-red)]">
            ,{(price % 1).toFixed(2).slice(2)}
          </span>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Componente de Descrição Expansível
// -------------------------------------------------------------
function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      const { scrollHeight, clientHeight } = textRef.current;
      setIsTruncated(scrollHeight > clientHeight);
    }
  }, [text]);

  if (!text) return null;

  return (
    <div className="flex flex-col items-start gap-1 mb-4">
      <p 
        ref={textRef}
        className={`text-[13px] text-[var(--cp-ink-muted)] m-0 font-medium leading-relaxed opacity-80 transition-all duration-300 ${isExpanded ? '' : 'line-clamp-2'}`}
      >
        {text}
      </p>
      {isTruncated && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="text-[10px] font-black uppercase tracking-widest text-[var(--cp-red)] hover:opacity-70 transition-opacity"
        >
          {isExpanded ? 'Ver menos' : 'Ver mais'}
        </button>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Componente de Tag
// -------------------------------------------------------------
function ProductTag({ label, type = 'default' }: { label: string; type?: 'default' | 'highlight' | 'success' | 'warning' }) {
  const styles = {
    default: 'bg-[var(--cp-flour)] text-[var(--cp-ink)]',
    highlight: 'bg-[var(--cp-red)] text-white',
    success: 'bg-[var(--cp-green)] text-white',
    warning: 'bg-orange-100 text-orange-600'
  };

  return (
    <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-md border-2 border-[var(--cp-ink)] shadow-[2px_2px_0_0_var(--cp-ink)] ${styles[type]}`}>
      {label}
    </span>
  );
}

// -------------------------------------------------------------
// Main Component
// -------------------------------------------------------------
export default function ClientHome() {
  const [categorias, setCategorias] = useState<DBCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(true);
  
  // Checkout States
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form'>('cart');
  const [userData, setUserData] = useState({
    nome: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    referencia: '',
    pagamento: 'pix' as 'pix' | 'cartao' | 'dinheiro',
    troco: '',
    entregaTipo: 'entrega' as 'entrega' | 'retirada',
    deliveryFee: 0
  });
  const [taxasEntrega, setTaxasEntrega] = useState<any[]>([]);
  const [storeConfig, setStoreConfig] = useState<any>(null);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  // Coordenadas obtidas direto pelo CEP (BrasilAPI v2). Quando disponíveis,
  // pulamos a busca no Nominatim (cuja cobertura para ruas residenciais BR é fraca).
  const [cepCoords, setCepCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Carrinho
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Modal Produto
  const [selectedProduct, setSelectedProduct] = useState<DBProduto | null>(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [meioAMeioModes, setMeioAMeioModes] = useState<Record<string, 'unico' | 'meio'>>({});
  const [observation, setObservation] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: cats, error: catsError } = await supabase
        .from('categorias')
        .select('*')
        .eq('ativa', true)
        .order('posicao', { ascending: true });

      if (catsError) throw catsError;

      const { data: prods, error: prodsError } = await supabase
        .from('produtos')
        .select('*')
        .eq('visivel', true)
        .order('posicao', { ascending: true });

      if (prodsError) throw prodsError;

      const { data: comps, error: compsError } = await supabase
        .from('complementos')
        .select('*, complemento_opcoes(*)')
        .order('posicao', { ascending: true });

      if (compsError) throw compsError;

      const compsByProduct = comps?.reduce((acc: any, comp: any) => {
        if (!acc[comp.produto_id]) acc[comp.produto_id] = [];
        acc[comp.produto_id].push(comp);
        return acc;
      }, {});

      const { data: allTags, error: tagsError } = await supabase.from('tags').select('*');
      const { data: prodTags, error: prodTagsError } = await supabase.from('produto_tags').select('*');

      const tagsMap = allTags?.reduce((acc: any, tag: any) => {
        acc[tag.id] = tag.nome;
        return acc;
      }, {});

      const tagsByProduct = prodTags?.reduce((acc: any, pt: any) => {
        if (!acc[pt.produto_id]) acc[pt.produto_id] = [];
        const tagName = tagsMap[pt.tag_id];
        if (tagName) acc[pt.produto_id].push(tagName);
        return acc;
      }, {});

      const prodsByCat = prods?.reduce((acc: any, prod: any) => {
        const prodWithExtras = {
          ...prod,
          complementos: compsByProduct?.[prod.id] || [],
          tags: tagsByProduct?.[prod.id] || []
        };
        if (!acc[prod.categoria_id]) acc[prod.categoria_id] = [];
        acc[prod.categoria_id].push(prodWithExtras);
        return acc;
      }, {});

      const today = new Date().getDay();

      const formattedCats = cats.map((cat: any, catIdx: number) => ({
        ...cat,
        produtos: (prodsByCat?.[cat.id] || []).map((p: any, pIdx: number) => {
          // EXEMPLO PARA VISUALIZAÇÃO: Forçando estado de promoção no primeiro item
          if (catIdx === 0 && pIdx === 0) {
            return { ...p, preco_anterior: Number(p.preco_venda) * 1.25 };
          }
          return p;
        })
      })).filter((cat: any) => {
        const hasProducts = cat.produtos.length > 0;
        const isActiveToday = !cat.active_days || cat.active_days.length === 0 || cat.active_days.includes(today);
        return hasProducts && isActiveToday;
      });
      const { data: config } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('id', 'loja')
        .single();

      const { data: taxas } = await supabase
        .from('taxas_entrega')
        .select('*')
        .order('distancia_min', { ascending: true });

      setCategorias(formattedCats);
      if (formattedCats.length > 0) setActiveCategory(formattedCats[0].id);
      if (config) {
        setIsStoreOpen(config.aberta);
        setStoreConfig(config);
      }
      if (taxas) setTaxasEntrega(taxas);
    } catch (err) {
      console.error('Error fetching menu:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Carregar dados do usuário salvos no navegador
    const savedData = localStorage.getItem('cp_user_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setUserData(prev => ({
          ...prev,
          nome: parsed.nome || '',
          telefone: parsed.telefone || '',
          endereco: parsed.endereco || '',
          numero: parsed.numero || '',
          bairro: parsed.bairro || '',
          referencia: parsed.referencia || ''
        }));
      } catch (e) {
        console.error('Erro ao carregar dados salvos:', e);
      }
    }
  }, [fetchData]);

  // Filtering
  const filteredCategorias = useMemo(() => {
    if (!search) return categorias;
    return categorias.map(cat => ({
      ...cat,
      produtos: cat.produtos.filter(p => 
        p.nome.toLowerCase().includes(search.toLowerCase()) || 
        p.descricao.toLowerCase().includes(search.toLowerCase())
      )
    })).filter(cat => cat.produtos.length > 0);
  }, [categorias, search]);

  // Product Selection Handlers
  const handleOpenProduct = (product: DBProduto) => {
    setSelectedProduct(product);
    setProductQuantity(1);
    setSelectedOptions({});
    
    // Inicializa modos meio a meio baseado no min_opcoes
    const initialModes: Record<string, 'unico' | 'meio'> = {};
    product.complementos?.forEach(c => {
      if (c.is_meio_a_meio) {
        initialModes[c.id] = c.min_opcoes === 2 ? 'meio' : 'unico';
      }
    });
    setMeioAMeioModes(initialModes);
    
    setObservation('');
    setModalVisible(true);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseProduct = () => {
    setModalVisible(false);
    setTimeout(() => {
      setSelectedProduct(null);
    }, 300);
  };

  useEffect(() => {
    if (modalVisible || isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [modalVisible, isCartOpen]);

  const toggleMeioAMeioMode = (compId: string, mode: 'unico' | 'meio') => {
    setMeioAMeioModes(prev => ({ ...prev, [compId]: mode }));
    // Se mudar para único, mantém apenas a primeira opção selecionada
    if (mode === 'unico') {
      setSelectedOptions(prev => ({
        ...prev,
        [compId]: (prev[compId] || []).slice(0, 1)
      }));
    }
  };

  const toggleOption = (comp: DBComplemento, optionId: string, isSingle: boolean) => {
    const current = selectedOptions[comp.id] || [];
    
    // Ajuste de limite para Meio a Meio
    let effectiveMax = comp.max_opcoes;
    if (comp.is_meio_a_meio) {
      const mode = meioAMeioModes[comp.id] || 'unico';
      effectiveMax = mode === 'unico' ? 1 : 2;
    }
    const isActuallySingle = (isSingle || effectiveMax === 1) && comp.tipo !== 'simples';

    if (isActuallySingle) {
      setSelectedOptions({
        ...selectedOptions,
        [comp.id]: [optionId]
      });
    } else {
      if (current.includes(optionId)) {
        setSelectedOptions({
          ...selectedOptions,
          [comp.id]: current.filter(id => id !== optionId)
        });
      } else {
        if (effectiveMax === 0 || current.length < effectiveMax) {
          setSelectedOptions({
            ...selectedOptions,
            [comp.id]: [...current, optionId]
          });
        }
      }
    }
  };

  const totalPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    let base = Number(selectedProduct.preco_venda);
    
    selectedProduct.complementos?.forEach(comp => {
      const selected = selectedOptions[comp.id] || [];
      if (comp.tipo === 'simples') {
        if (selected.length > 0) base += Number(comp.valor);
      } else {
        if (comp.is_meio_a_meio && selected.length > 0) {
          // Lógica Meio a Meio: pega o valor da opção mais cara
          const prices = selected.map(optId => {
            const opt = comp.complemento_opcoes?.find(o => o.id === optId);
            return Number(opt?.valor || 0);
          });
          base += Math.max(...prices);
        } else {
          selected.forEach(optId => {
            const opt = comp.complemento_opcoes?.find(o => o.id === optId);
            if (opt) base += Number(opt.valor);
          });
        }
      }
    });

    return base * productQuantity;
  }, [selectedProduct, selectedOptions, productQuantity]);

  const isMandatoryFulfilled = useMemo(() => {
    if (!selectedProduct) return true;
    return selectedProduct.complementos?.every(comp => {
      // Opcionais simples nunca são obrigatórios para a validação do botão
      if (comp.tipo === 'simples') return true;
      if (comp.min_opcoes === 0) return true;
      const selected = selectedOptions[comp.id] || [];
      
      let effectiveMin = comp.min_opcoes;
      if (comp.is_meio_a_meio) {
        const mode = meioAMeioModes[comp.id] || 'unico';
        effectiveMin = mode === 'unico' ? 1 : 2;
      }
      
      return selected.length >= effectiveMin;
    });
  }, [selectedProduct, selectedOptions, meioAMeioModes]);

  // Gestão de quantidade simples (para produtos sem opcionais)
  const updateSimpleQuantity = (prod: DBProduto, delta: number) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.produto_id === prod.id && item.opcoes.length === 0);
      
      if (existingIndex > -1) {
        const newItems = [...prev];
        const newQty = Math.max(0, newItems[existingIndex].quantidade + delta);
        
        if (newQty === 0) {
          newItems.splice(existingIndex, 1);
        } else {
          newItems[existingIndex].quantidade = newQty;
          newItems[existingIndex].total = newQty * newItems[existingIndex].preco_unitario;
        }
        return newItems;
      } else if (delta > 0) {
        const newItem: CartItem = {
          cart_item_id: Math.random().toString(36).substring(7),
          produto_id: prod.id,
          nome: prod.nome,
          imagem_url: prod.imagem_url,
          quantidade: 1,
          preco_unitario: Number(prod.preco_venda),
          total: Number(prod.preco_venda),
          observacao: '',
          opcoes: []
        };
        return [...prev, newItem];
      }
      return prev;
    });
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    
    // Gerar objeto de opções selecionadas
    const selectedOptionsList: CartItem['opcoes'] = [];
    selectedProduct.complementos?.forEach(comp => {
      const selected = selectedOptions[comp.id] || [];
      if (selected.length > 0) {
        const compOptions: { id: string; nome: string; valor: number; }[] = [];
        
        if (comp.tipo === 'simples') {
          compOptions.push({
            id: 'selected',
            nome: comp.nome,
            valor: Number(comp.valor)
          });
        } else {
          selected.forEach(optId => {
            const opt = comp.complemento_opcoes?.find(o => o.id === optId);
            if (opt) {
              compOptions.push({
                id: opt.id,
                nome: opt.nome,
                valor: Number(opt.valor)
              });
            }
          });
        }
        
        if (compOptions.length > 0) {
          selectedOptionsList.push({
            complemento_id: comp.id,
            complemento_nome: comp.nome,
            is_meio_a_meio: comp.is_meio_a_meio,
            itens: compOptions
          });
        }
      }
    });

    const precoUnitario = totalPrice / productQuantity;

    const newItem: CartItem = {
      cart_item_id: Math.random().toString(36).substring(7),
      produto_id: selectedProduct.id,
      nome: selectedProduct.nome,
      imagem_url: selectedProduct.imagem_url,
      quantidade: productQuantity,
      preco_unitario: precoUnitario,
      total: totalPrice,
      observacao: observation,
      opcoes: selectedOptionsList
    };

    setCartItems(prev => [...prev, newItem]);
    handleCloseProduct();
    setIsCartOpen(true); // Abre o carrinho ao adicionar
  };

  // Lógica de Distância e Taxa de Entrega
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCalculateDelivery = async () => {
    if (!userData.endereco || !userData.numero || !userData.bairro) {
      return;
    }
    if (!storeConfig?.latitude || !storeConfig?.longitude) {
      setDeliveryError('Loja sem coordenadas configuradas. Avise o estabelecimento.');
      return;
    }

    setIsCalculatingDistance(true);
    setDeliveryError(null);

    // Atalho: se já temos coordenadas do CEP (via BrasilAPI v2), usamos direto.
    // É mais rápido, mais confiável e dispensa a busca no Nominatim.
    if (cepCoords) {
      try {
        const distance = getDistance(
          storeConfig.latitude,
          storeConfig.longitude,
          cepCoords.lat,
          cepCoords.lon
        );
        const taxa = taxasEntrega.find(
          t => distance >= t.distancia_min && distance <= t.distancia_max
        );
        if (taxa) {
          setUserData(prev => ({ ...prev, deliveryFee: Number(taxa.valor) }));
          setDeliveryError(null);
        } else {
          setUserData(prev => ({ ...prev, deliveryFee: 0 }));
          setDeliveryError('Desculpe, não entregamos nesta distância.');
        }
      } catch (err) {
        console.error('Erro ao calcular distância (cepCoords):', err);
        setDeliveryError('Erro ao calcular taxa de entrega.');
      } finally {
        setIsCalculatingDistance(false);
      }
      return;
    }

    try {
      let citySuffix = "";
      let city = userData.cidade || "";
      let state = userData.uf || "";

      // Fallback para a cidade da loja se o usuário não preencheu/buscou CEP
      if (!city && storeConfig?.endereco) {
        const parts = storeConfig.endereco.split(',');
        if (parts.length >= 3) {
          city = parts[parts.length - 2].trim().replace(/ - [A-Z]{2}$/, '');
          const stateMatch = parts[parts.length - 1].match(/([A-Z]{2})/);
          if (stateMatch && !state) state = stateMatch[1];
        }
      }

      if (city && state) {
        citySuffix = `, ${city} - ${state}`;
      } else if (city) {
        citySuffix = `, ${city}`;
      }

      // Busca estruturada (mais precisa quando bate). Nominatim não tem campo "neighborhood"
      // na busca estruturada, então o bairro só entra nas queries free-form (q=).
      let structuredQuery = `https://nominatim.openstreetmap.org/search?format=json&limit=1`;
      if (userData.cep) structuredQuery += `&postalcode=${userData.cep.replace(/\D/g, '')}`;
      let structuredQueryWithNum = structuredQuery + `&street=${encodeURIComponent(`${userData.numero} ${userData.endereco}`)}`;
      let structuredQueryWithoutNum = structuredQuery + `&street=${encodeURIComponent(userData.endereco)}`;

      if (city) {
        structuredQueryWithNum += `&city=${encodeURIComponent(city)}`;
        structuredQueryWithoutNum += `&city=${encodeURIComponent(city)}`;
      }
      if (state) {
        structuredQueryWithNum += `&state=${encodeURIComponent(state)}`;
        structuredQueryWithoutNum += `&state=${encodeURIComponent(state)}`;
      }
      structuredQueryWithNum += `&country=Brazil`;
      structuredQueryWithoutNum += `&country=Brazil`;

      const buildFreeForm = (parts: string[]) =>
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(parts.filter(Boolean).join(', '))}`;

      // Ordem da mais específica (rua + número + bairro) para a mais ampla (só bairro)
      const queries = [
        structuredQueryWithNum,
        structuredQueryWithoutNum,
        buildFreeForm([`${userData.endereco}, ${userData.numero}`, userData.bairro, city, state, 'Brasil']),
        buildFreeForm([userData.endereco, userData.bairro, city, state, 'Brasil']),
        buildFreeForm([`${userData.endereco}${citySuffix}`]),
        buildFreeForm([userData.bairro, city, state, 'Brasil']),
      ];

      let data = null;
      for (let i = 0; i < queries.length; i++) {
        try {
          const response = await fetch(queries[i]);
          const result = await response.json();
          if (result && result.length > 0) {
            data = result;
            break;
          }
        } catch (e) {
          console.error(`Erro na query "${queries[i]}":`, e);
        }

        // Pausa de 1.1s entre requisições (política do OpenStreetMap: max 1 req/s)
        if (i < queries.length - 1 && !data) {
          await new Promise(resolve => setTimeout(resolve, 1100));
        }
      }

      if (data && data.length > 0) {
        const userLat = parseFloat(data[0].lat);
        const userLon = parseFloat(data[0].lon);
        
        const distance = getDistance(storeConfig.latitude, storeConfig.longitude, userLat, userLon);
        
        const taxa = taxasEntrega.find(t => distance >= t.distancia_min && distance <= t.distancia_max);
        
        if (taxa) {
          setUserData(prev => ({ ...prev, deliveryFee: Number(taxa.valor) }));
          setDeliveryError(null);
        } else {
          setUserData(prev => ({ ...prev, deliveryFee: 0 }));
          setDeliveryError('Desculpe, não entregamos nesta distância.');
        }
      } else {
        setDeliveryError('Endereço não localizado para cálculo de entrega.');
      }
    } catch (err) {
      console.error('Erro ao calcular distância:', err);
      setDeliveryError('Erro ao calcular taxa de entrega.');
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  // Busca de CEP: tenta BrasilAPI v2 (que já traz coordenadas) e cai para ViaCEP.
  // Salvar as coordenadas direto do CEP evita depender do Nominatim, que tem
  // cobertura muito limitada para ruas residenciais brasileiras.
  const handleCepSearch = async (cepStr: string) => {
    const cleanCep = cepStr.replace(/\D/g, '');
    setUserData(prev => ({ ...prev, cep: cepStr }));
    // Reset das coordenadas anteriores quando o CEP muda
    setCepCoords(null);

    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
       let logradouro = '';
       let bairro = '';
       let cidade = '';
       let uf = '';
       let coords: { lat: number; lon: number } | null = null;

      // 1) BrasilAPI v2 — retorna address + coordenadas (quando disponíveis)
      try {
        const resp = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
        if (resp.ok) {
          const data = await resp.json();
          logradouro = data.street || '';
          bairro = data.neighborhood || '';
          cidade = data.city || '';
          uf = data.state || '';
          const lat = data?.location?.coordinates?.latitude;
          const lon = data?.location?.coordinates?.longitude;
          if (lat && lon) {
            coords = { lat: parseFloat(lat), lon: parseFloat(lon) };
          }
        }
      } catch (err) {
        console.warn('BrasilAPI v2 falhou, tentando ViaCEP:', err);
      }

      // 2) ViaCEP — fallback para logradouro/bairro caso BrasilAPI não tenha
      if (!logradouro || !bairro) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            logradouro = logradouro || data.logradouro || '';
            bairro = bairro || data.bairro || '';
            cidade = cidade || data.localidade || '';
            uf = uf || data.uf || '';
          }
        } catch (err) {
          console.error('Erro ao buscar CEP no ViaCEP:', err);
        }
      }

      setUserData(prev => ({
        ...prev,
        endereco: logradouro || prev.endereco,
        bairro: bairro || prev.bairro,
        cidade: cidade || prev.cidade,
        uf: uf || prev.uf,
      }));
      if (coords) setCepCoords(coords);
      setIsSearchingCep(false);
    }
  };

  // Cálculo automático ao digitar
  useEffect(() => {
    if (userData.entregaTipo === 'retirada') {
      setUserData(prev => ({ ...prev, deliveryFee: 0 }));
      setDeliveryError(null);
      return;
    }

    if (userData.endereco.length > 5 && userData.numero.length > 0 && userData.bairro.length > 3) {
      // Se já temos coords do CEP, calcula imediatamente; senão aguarda 1s para o usuário terminar de digitar
      const debounce = cepCoords ? 100 : 1000;
      const timer = setTimeout(() => {
        handleCalculateDelivery();
      }, debounce);
      return () => clearTimeout(timer);
    } else {
      setUserData(prev => ({ ...prev, deliveryFee: 0 }));
      setDeliveryError(null);
    }
  }, [userData.endereco, userData.numero, userData.bairro, userData.cidade, userData.uf, userData.entregaTipo, cepCoords]);

  const totalCartItems = cartItems.reduce((acc, item) => acc + item.quantidade, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.total, 0);
  const cartTotal = cartSubtotal + userData.deliveryFee;

  const getProductQuantity = (prodId: string) => {
    return cartItems
      .filter(item => item.produto_id === prodId)
      .reduce((acc, item) => acc + item.quantidade, 0);
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCartItems(prev => {
      const index = prev.findIndex(item => item.cart_item_id === cartItemId);
      if (index === -1) return prev;
      
      const newItems = [...prev];
      const newQty = Math.max(0, newItems[index].quantidade + delta);
      
      if (newQty === 0) {
        newItems.splice(index, 1);
      } else {
        newItems[index].quantidade = newQty;
        newItems[index].total = newQty * newItems[index].preco_unitario;
      }
      return newItems;
    });
  };

  const handleSendOrder = () => {
    const phone = '5516981886165';
    
    let message = `*NOVO PEDIDO - CENTER PIZZA*\n`;
    message += `------------------------------\n\n`;
    
    message += `*CLIENTE:* ${userData.nome}\n`;
    message += `*CONTATO:* ${userData.telefone}\n`;
    
    if (userData.entregaTipo === 'entrega') {
      message += `*TIPO:* ENTREGA\n`;
      if (userData.cep) message += `*CEP:* ${userData.cep}\n`;
      message += `*ENDEREÇO:* ${userData.endereco}, ${userData.numero}\n`;
      message += `*BAIRRO:* ${userData.bairro}\n`;
      if (userData.referencia) message += `*REF:* ${userData.referencia}\n`;
    } else {
      message += `*TIPO:* RETIRADA NA LOJA\n`;
    }
    message += `\n------------------------------\n\n`;
    
    message += `*ITENS:*\n`;
    cartItems.forEach(item => {
      message += `${item.quantidade}x *${item.nome}* - R$ ${formatPrice(item.total)}\n`;
      if (item.opcoes.length > 0) {
        item.opcoes.forEach(opt => {
          const separator = opt.is_meio_a_meio ? ' / ' : ', ';
          message += `  _> ${opt.complemento_nome}: ${opt.itens.map(i => i.nome).join(separator)}_\n`;
        });
      }
      if (item.observacao) message += `  _Obs: ${item.observacao}_\n`;
      message += `\n`;
    });
    
    message += `------------------------------\n`;
    message += `*SUBTOTAL:* R$ ${formatPrice(cartSubtotal)}\n`;
    if (userData.deliveryFee > 0) {
      message += `*TAXA DE ENTREGA:* R$ ${formatPrice(userData.deliveryFee)}\n`;
    } else {
      message += `*TAXA DE ENTREGA:* Grátis\n`;
    }
    message += `*TOTAL DO PEDIDO:* R$ ${formatPrice(cartTotal)}\n`;
    message += `*FORMA DE PAGAMENTO:* ${userData.pagamento.toUpperCase()}\n`;
    if (userData.pagamento === 'dinheiro' && userData.troco) {
      message += `*TROCO PARA:* R$ ${userData.troco}\n`;
    }
    message += `\n------------------------------\n`;
    message += `_Pedido gerado via Center Pizza Digital_`;

    // Salvar dados no navegador para futuras compras
    localStorage.setItem('cp_user_data', JSON.stringify({
      nome: userData.nome,
      telefone: userData.telefone,
      endereco: userData.endereco,
      numero: userData.numero,
      bairro: userData.bairro,
      referencia: userData.referencia
    }));

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    
    // Reset states after sending
    setIsCartOpen(false);
    setCheckoutStep('cart');
    setShowPixModal(false);
  };

  const onConfirmOrder = () => {
    if (userData.pagamento === 'pix') {
      setShowPixModal(true);
    } else {
      handleSendOrder();
    }
  };

  if (loading) {
    return <LoadingScreen message="Aquecendo o forno..." fullScreen />;
  }

  return (
    <main className="min-h-screen bg-[var(--bg-1)] pb-28 font-sans text-[var(--cp-ink)]">
      {/* Banner de Loja Fechada */}
      {!isStoreOpen && (
        <div className="bg-[var(--cp-red)] text-white py-3 px-6 text-center sticky top-0 z-[100] shadow-lg flex items-center justify-center gap-3">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-[12px] font-black uppercase tracking-[0.2em]">Estamos fechados no momento</span>
        </div>
      )}
      {/* Main Content Area */}
      <div className="px-6 py-6 flex flex-col gap-10">
        {filteredCategorias.map((cat, catIdx) => (
          <section key={cat.id} id={cat.id} className="scroll-mt-48">
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="text-[28px] font-black m-0" style={{ fontFamily: 'var(--font-display-alt)' }}>
                {cat.nome}
              </h2>
              <div className="h-0.5 flex-1 bg-[var(--cp-ink)] opacity-10"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10">
              {cat.produtos.map((prod, prodIdx) => {
                const activeComps = prod.complementos?.filter(c => c.ativo !== false) || [];
                const hasComps = activeComps.length > 0;
                const qty = getProductQuantity(prod.id);
                const hasPromo = prod.preco_anterior && Number(prod.preco_anterior) > Number(prod.preco_venda);

                return hasComps ? (
                  /* VERSÃO VERTICAL (COM OPCIONAIS) */
                  <div 
                    key={prod.id}
                    onClick={() => handleOpenProduct(prod)}
                    className="flex flex-col bg-[var(--cp-dough)] rounded-lg border-y-2 border-x-0 border-[var(--cp-line-strong)] transition-all duration-300 group cursor-pointer relative overflow-hidden"
                  >
                    <div 
                      className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-300 z-10 ${hasPromo ? 'h-7 bg-[var(--cp-red)]' : 'h-1.5 bg-[var(--cp-ink)]'}`}
                    >
                      {hasPromo && (
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">
                          PROMOÇÃO
                        </span>
                      )}
                    </div>

                    <div className={`relative w-full overflow-hidden transition-all duration-300 ${hasPromo ? 'h-36' : 'h-40'}`}>
                      {prod.imagem_url ? (
                        <Image 
                          src={prod.imagem_url} 
                          alt={prod.nome}
                          fill
                          priority={catIdx === 0 && prodIdx === 0}
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-4xl opacity-10">🍕</div>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      {prod.tags && prod.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {prod.tags.map(tag => (
                            <ProductTag key={tag} label={tag} />
                          ))}
                        </div>
                      )}

                      <h3 className="text-[24px] font-black mb-1 m-0 leading-tight text-[var(--cp-ink)]" style={{ fontFamily: 'var(--font-display-alt)' }}>
                        {prod.nome}
                      </h3>
                      
                      <p className="text-[13px] text-[var(--cp-ink-muted)] m-0 mb-4 font-medium leading-relaxed opacity-80 line-clamp-2">
                        {prod.descricao}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-3">
                        <PriceDisplay 
                          price={calculateStartingPrice(prod)} 
                          originalPrice={prod.preco_anterior}
                          label="A partir de"
                          align="left"
                        />
                        <div className={`px-6 py-2 h-11 rounded-md flex items-center justify-center transition-all duration-300
                          ${isStoreOpen 
                            ? 'bg-[var(--cp-ink)] text-white shadow-[4px_4px_0_0_var(--cp-red)] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px] group-hover:shadow-[6px_6px_0_0_var(--cp-red)]' 
                            : 'bg-zinc-200 text-zinc-400 border-2 border-zinc-300 shadow-none'
                          }`}
                        >
                          <span className="text-[11px] font-black uppercase tracking-[0.1em]">
                            {isStoreOpen ? 'MONTAR' : 'FECHADO'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* VERSÃO HORIZONTAL (SEM OPCIONAIS) */
                  <div 
                    key={prod.id}
                    className="flex flex-row items-center gap-4 p-5 bg-[var(--cp-dough)] border-y-2 border-x-0 border-[var(--cp-line-strong)] group transition-all rounded-lg relative overflow-hidden"
                  >
                    <div 
                      className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-300 z-10 ${hasPromo ? 'h-7 bg-[var(--cp-red)]' : 'h-1.5 bg-[var(--cp-ink)]'}`}
                    >
                      {hasPromo && (
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">
                          PROMOÇÃO
                        </span>
                      )}
                    </div>

                    <div className="relative w-24 h-24 flex-none overflow-hidden rounded-lg">
                      {prod.imagem_url ? (
                        <Image 
                          src={prod.imagem_url} 
                          alt={prod.nome}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-2xl opacity-10">🍕</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 py-1">
                      <h3 className="text-[20px] font-black mb-1 m-0 leading-tight text-[var(--cp-ink)]" style={{ fontFamily: 'var(--font-display-alt)' }}>
                        {prod.nome}
                      </h3>
                      
                      {prod.descricao && (
                        <p className="text-[12px] text-[var(--cp-ink-muted)] m-0 mb-3 font-medium leading-relaxed opacity-70 line-clamp-1">
                          {prod.descricao}
                        </p>
                      )}

                      {prod.tags && prod.tags.length > 0 && (
                        <div className={`flex flex-wrap gap-2 mb-3 ${!prod.descricao ? '-mt-0.5' : ''}`}>
                          {prod.tags.map(tag => (
                            <ProductTag key={tag} label={tag} />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <PriceDisplay price={prod.preco_venda} originalPrice={prod.preco_anterior} align="left" />
                        <div className={`flex items-center rounded-md transition-all h-9 overflow-hidden
                          ${isStoreOpen 
                            ? 'bg-[var(--cp-ink)] shadow-[3px_3px_0_0_var(--cp-red)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]' 
                            : 'bg-zinc-200 border-2 border-zinc-300'
                          }`}
                        >
                          {isStoreOpen ? (
                            <>
                              {qty > 0 ? (
                                <>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); updateSimpleQuantity(prod, -1); }}
                                    className="w-9 h-9 text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                                  >
                                    <MinusIcon size={16} />
                                  </button>
                                  <div className="w-8 h-full border-x border-white/10 flex items-center justify-center text-sm font-black text-white">
                                    {qty}
                                  </div>
                                </>
                              ) : null}
                              <button 
                                onClick={(e) => { e.stopPropagation(); updateSimpleQuantity(prod, 1); }}
                                className="w-9 h-9 text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                              >
                                <PlusIcon size={18} />
                              </button>
                            </>
                          ) : (
                            <span className="px-3 text-[9px] font-black uppercase text-zinc-400">Indisponível</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Product Detail Bottom Sheet */}
      {selectedProduct && (
        <div className={`fixed inset-0 z-[100] flex flex-col justify-end transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div 
            className={`absolute inset-0 bg-[var(--cp-ink)]/60 backdrop-blur-sm transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={handleCloseProduct}
          />
          
          <div className={`relative bg-[var(--cp-flour)] w-full h-screen flex flex-col transition-transform duration-300 ease-out ${modalVisible ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="relative h-[32vh] flex-none overflow-hidden bg-[var(--cp-red)] flex items-center justify-center p-8">
              <button 
                onClick={handleCloseProduct}
                className="absolute top-6 left-6 w-11 h-11 rounded-md bg-white text-[var(--cp-ink)] flex items-center justify-center shadow-[4px_4px_0_0_var(--cp-ink)] transition-all active:shadow-none active:translate-x-[2px] active:translate-y-[2px] z-30"
              >
                <ArrowLeftIcon size={24} />
              </button>

              <div className="absolute inset-0">
                {selectedProduct.imagem_url ? (
                  <Image src={selectedProduct.imagem_url} alt={selectedProduct.nome} fill className="object-cover" priority sizes="100vw" />
                ) : (
                  <div className="w-full h-full bg-[var(--cp-dough)] grid place-items-center text-[120px]">🍕</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-8 left-0 right-0 text-center">
                <span className="text-[18px] text-white/90 italic" style={{ fontFamily: 'var(--font-chalk)' }}>feito com paixão</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pt-10 px-8 pb-40">
              <div className="mb-6">
                <h3 className="text-[32px] font-black leading-[1.1] text-[var(--cp-ink)] mb-2" style={{ fontFamily: 'var(--font-display-alt)' }}>
                  {selectedProduct.nome}
                </h3>
                
                {/* Tags reais do banco de dados */}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {selectedProduct.tags.map(tag => (
                      <ProductTag key={tag} label={tag} />
                    ))}
                  </div>
                )}

                <p className="text-[14px] text-[var(--cp-ink)] opacity-60 m-0 leading-tight">
                  {selectedProduct.descricao}
                </p>
              </div>

              {selectedProduct.complementos?.filter(c => c.ativo !== false).sort((a, b) => a.posicao - b.posicao).map(comp => {
                const selectedCount = (selectedOptions[comp.id] || []).length;
                const isFulfilled = comp.min_opcoes === 0 || selectedCount >= comp.min_opcoes;
                const mode = meioAMeioModes[comp.id] || 'unico';

                return (
                  <div key={comp.id} className="mb-8">
                    <div className="flex items-end justify-between mb-4 pb-2 border-b-2 border-[var(--cp-ink)]">
                      <div className="leading-none">
                        <h4 className="text-[20px] font-black m-0 uppercase tracking-tight leading-none" style={{ fontFamily: 'var(--font-display-alt)' }}>
                          {comp.nome}
                        </h4>
                        {comp.descricao && (
                          <span className="text-[11px] opacity-40 font-bold block leading-none mt-1.5 uppercase italic tracking-tighter">
                            {comp.descricao}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mb-0.5">
                        {comp.min_opcoes > 0 && !isFulfilled && comp.tipo !== 'simples' && (
                          <span className="text-[9px] font-black px-2 py-1 rounded-md bg-[var(--cp-red)] text-white uppercase tracking-widest">
                            OBRIGATÓRIO
                          </span>
                        )}
                      </div>
                    </div>

                    {comp.is_meio_a_meio && comp.min_opcoes < 2 && (
                      <div className="mb-6 flex justify-center">
                        <div className="flex bg-[var(--cp-dough)] p-1 rounded-xl border-2 border-[var(--cp-ink)] w-fit">
                          <button 
                            onClick={() => toggleMeioAMeioMode(comp.id, 'unico')}
                            className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${mode === 'unico' ? 'bg-[var(--cp-ink)] text-white shadow-md' : 'text-[var(--cp-ink)] opacity-40'}`}
                          >
                            Sabor Único
                          </button>
                          <button 
                            onClick={() => toggleMeioAMeioMode(comp.id, 'meio')}
                            className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${mode === 'meio' ? 'bg-[var(--cp-ink)] text-white shadow-md' : 'text-[var(--cp-ink)] opacity-40'}`}
                          >
                            Meio a Meio
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      {comp.tipo === 'simples' ? (
                        <label className={`flex items-center justify-between p-5 rounded-md border-2 transition-all cursor-pointer ${selectedCount > 0 ? 'bg-[var(--cp-dough)] border-[var(--cp-red)]' : 'bg-white border-[var(--cp-line)] hover:border-[var(--cp-ink)]'}`}>
                          <div className="flex flex-col">
                            <span className="text-[16px] font-black text-[var(--cp-ink)]">{comp.nome}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {Number(comp.valor) > 0 ? (
                              <span className="text-sm font-black text-[var(--cp-red)]">+{formatPrice(Number(comp.valor))}</span>
                            ) : (
                              <span className="text-sm font-black text-[var(--cp-green)] uppercase tracking-widest text-[11px]">Grátis</span>
                            )}
                            <div className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${selectedCount > 0 ? 'bg-[var(--cp-red)] border-[var(--cp-red)] shadow-[2px_2px_0_0_var(--cp-ink)] text-white' : 'border-[var(--cp-ink)]'}`}>
                              {selectedCount > 0 && <CheckIcon size={16} strokeWidth={4} />}
                            </div>
                          </div>
                          <input type="checkbox" className="hidden" checked={selectedCount > 0} onChange={() => toggleOption(comp, 'selected', false)} />
                        </label>
                      ) : (
                        comp.complemento_opcoes?.filter(o => o.ativo !== false).sort((a, b) => a.posicao - b.posicao).map(opt => {
                          const selected = selectedOptions[comp.id] || [];
                          const isSelected = selected.includes(opt.id);
                          const selectionIndex = selected.indexOf(opt.id) + 1;
                          
                          let displayPrice = Number(opt.valor);
                          let showPrice = false;
                          
                          if (comp.is_meio_a_meio && mode === 'meio' && selected.length > 0 && !isSelected) {
                            const firstPrice = Number(comp.complemento_opcoes?.find(o => o.id === selected[0])?.valor || 0);
                            if (displayPrice > firstPrice) {
                              displayPrice = displayPrice - firstPrice;
                              showPrice = true;
                            }
                          } else if (!isSelected) {
                            showPrice = Number(opt.valor) > 0;
                          }

                          return (
                            <label key={opt.id} className={`flex items-center justify-between p-5 rounded-md border-2 transition-all cursor-pointer ${isSelected ? 'bg-[var(--cp-dough)] border-[var(--cp-red)]' : 'bg-white border-[var(--cp-line)] hover:border-[var(--cp-ink)]'}`}>
                              <div className="flex flex-col">
                                <span className="text-[16px] font-black text-[var(--cp-ink)]">{opt.nome}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                {!isSelected && (
                                  <>
                                    {showPrice ? (
                                      <span className="text-sm font-black text-[var(--cp-red)]">
                                        {comp.is_meio_a_meio ? `R$ ${formatPrice(displayPrice)}` : `+ ${formatPrice(displayPrice)}`}
                                      </span>
                                    ) : (
                                      !comp.is_meio_a_meio && (
                                        <span className="text-sm font-black text-[var(--cp-green)] uppercase tracking-widest text-[11px]">Grátis</span>
                                      )
                                    )}
                                  </>
                                )}
                                <div className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--cp-red)] border-[var(--cp-red)] shadow-[2px_2px_0_0_var(--cp-ink)] text-white' : 'border-[var(--cp-ink)]'}`}>
                                  {isSelected ? (
                                    comp.is_meio_a_meio && mode === 'meio' ? (
                                      <span className="text-[13px] font-black">{selectionIndex}</span>
                                    ) : comp.max_opcoes === 1 ? (
                                      <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                                    ) : (
                                      <CheckIcon size={16} strokeWidth={4} />
                                    )
                                  ) : null}
                                </div>
                              </div>
                              <input type={comp.max_opcoes === 1 ? "radio" : "checkbox"} name={comp.id} className="hidden" checked={isSelected} onChange={() => toggleOption(comp, opt.id, comp.max_opcoes === 1)} />
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="mt-12">
                <h4 className="text-[20px] font-black m-0 uppercase tracking-tight mb-6 pb-2 border-b-2 border-[var(--cp-ink)]" style={{ fontFamily: 'var(--font-display-alt)' }}>Alguma observação?</h4>
                <textarea 
                  className="w-full h-32 p-5 rounded-md border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all text-[16px] font-bold placeholder:opacity-20 resize-none"
                  placeholder="Ex: Sem cebola, remover orégano..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-none p-5 bg-white border-t-2 border-[var(--cp-line)] flex items-center gap-3 z-50">
              <div className="flex items-center bg-[var(--cp-dough)] rounded-lg border-2 border-[var(--cp-ink)] h-[56px] px-1">
                <button onClick={() => setProductQuantity(Math.max(1, productQuantity - 1))} className="w-10 h-10 flex items-center justify-center text-[var(--cp-ink)] hover:opacity-50 transition-all active:scale-90">
                  <MinusIcon size={18} strokeWidth={3} />
                </button>
                <span className="w-8 text-center text-[18px] font-black text-[var(--cp-ink)]">{productQuantity}</span>
                <button onClick={() => setProductQuantity(productQuantity + 1)} className="w-10 h-10 flex items-center justify-center text-[var(--cp-ink)] hover:opacity-50 transition-all active:scale-90">
                  <PlusIcon size={18} strokeWidth={3} />
                </button>
              </div>

              <button 
                onClick={handleAddToCart}
                disabled={!isMandatoryFulfilled || !isStoreOpen}
                className={`flex-1 h-[56px] rounded-lg border-2 border-[var(--cp-ink)] flex items-center justify-between px-6 transition-all relative
                  ${(isMandatoryFulfilled && isStoreOpen)
                    ? 'bg-[var(--cp-ink)] text-white shadow-[4px_4px_0_0_var(--cp-red)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer' 
                    : 'bg-zinc-50 text-zinc-300 border-zinc-200 cursor-not-allowed shadow-none'
                  }`}
              >
                <span className="text-[13px] font-black uppercase tracking-[0.1em]">
                  {!isStoreOpen ? 'Loja Fechada' : isMandatoryFulfilled ? 'Adicionar' : 'Escolha os sabores'}
                </span>
                {isMandatoryFulfilled && isStoreOpen && (
                  <span className="text-[16px] font-black opacity-90">{formatPrice(totalPrice)}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t-2 border-[var(--cp-line)] flex items-center justify-between z-50 px-6 safe-bottom shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--cp-ink)] flex items-center justify-center relative shadow-[0_4px_0_0_var(--cp-red)]">
             <ShoppingBagIcon size={20} className="text-white" />
             {totalCartItems > 0 && (
               <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--cp-red)] text-white text-[11px] font-black flex items-center justify-center border-2 border-white animate-bounce">
                {totalCartItems}
               </span>
             )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-wider opacity-40 leading-none mb-1">Seu Pedido</span>
            <span className="text-sm font-black leading-none">{totalCartItems > 0 ? 'Pronto para finalizar' : 'Carrinho vazio'}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="h-12 px-6 bg-[var(--cp-ink)] text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] flex items-center gap-2 shadow-[0_4px_0_0_var(--cp-red)] active:shadow-none active:translate-y-1 transition-all"
        >
          Ver Carrinho
          <ChevronRightIcon size={14} />
        </button>
      </div>

      {/* Cart Drawer */}
      <div className={`fixed inset-0 z-[110] flex flex-col justify-end transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-[var(--cp-ink)]/60 backdrop-blur-sm transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsCartOpen(false)}
        />
        
        <div className={`relative bg-[var(--cp-flour)] w-full h-[90vh] sm:h-[85vh] flex flex-col transition-transform duration-300 ease-out rounded-t-[32px] overflow-hidden ${isCartOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          {/* Header */}
          <div className="flex-none p-6 flex items-center justify-between border-b-2 border-[var(--cp-line)] bg-white">
            <div className="flex items-center gap-3">
              {checkoutStep === 'form' && (
                <button 
                  onClick={() => setCheckoutStep('cart')}
                  className="w-8 h-8 rounded-full bg-[var(--cp-dough)] flex items-center justify-center text-[var(--cp-ink)]"
                >
                  <ArrowLeftIcon size={18} />
                </button>
              )}
              <div className="flex flex-col">
                <h2 className="text-[24px] font-black m-0 leading-none" style={{ fontFamily: 'var(--font-display-alt)' }}>
                  {checkoutStep === 'cart' ? 'Seu Pedido' : 'Finalizar Pedido'}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-40 mt-1">
                  {checkoutStep === 'cart' ? `${totalCartItems} ${totalCartItems === 1 ? 'item' : 'itens'} selecionados` : 'Preencha seus dados'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => { setIsCartOpen(false); setCheckoutStep('cart'); }}
              className="w-10 h-10 rounded-full bg-[var(--cp-dough)] flex items-center justify-center text-[var(--cp-ink)] hover:bg-[var(--cp-red)] hover:text-white transition-all"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            {checkoutStep === 'cart' ? (
              <div className="space-y-6">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                    <p className="text-[16px] font-black uppercase tracking-widest">Seu carrinho está vazio</p>
                    <p className="text-[12px] font-medium mt-2">Adicione delícias para continuar</p>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.cart_item_id} className="flex gap-4 pb-6 border-b border-[var(--cp-line)] last:border-0">
                      {/* Image/Icon */}
                      <div className="w-20 h-20 flex-none rounded-xl bg-[var(--cp-dough)] border-2 border-[var(--cp-ink)] overflow-hidden relative shadow-[4px_4px_0_0_var(--cp-red)] flex items-center justify-center">
                        {item.imagem_url ? (
                          <Image src={item.imagem_url} alt={item.nome} fill className="object-cover" sizes="80px" />
                        ) : (
                          <div className="text-[10px] font-black opacity-10 uppercase tracking-tighter">Sem foto</div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3 className="text-[18px] font-black leading-tight text-[var(--cp-ink)] truncate" style={{ fontFamily: 'var(--font-display-alt)' }}>
                            {item.nome}
                          </h3>
                          <span className="text-[16px] font-black text-[var(--cp-red)] whitespace-nowrap">
                            R$ {formatPrice(item.total)}
                          </span>
                        </div>

                        {/* Options Summary */}
                        {item.opcoes.length > 0 && (
                          <div className="flex flex-wrap gap-x-2 gap-y-1 mb-3">
                            {item.opcoes.map((comp) => (
                              <span key={comp.complemento_id} className="text-[11px] font-bold text-[var(--cp-ink-muted)] opacity-60">
                                {comp.itens.map(i => i.nome).join(', ')}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.observacao && (
                          <p className="text-[11px] italic text-[var(--cp-ink-muted)] mb-3 line-clamp-1">"{item.observacao}"</p>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-[var(--cp-dough)] rounded-lg border-2 border-[var(--cp-ink)] h-9 px-1">
                            <button 
                              onClick={() => updateCartItemQuantity(item.cart_item_id, -1)} 
                              className="w-7 h-7 flex items-center justify-center text-[var(--cp-ink)] hover:opacity-50 transition-all active:scale-90"
                            >
                              <MinusIcon size={14} strokeWidth={3} />
                            </button>
                            <span className="w-7 text-center text-[14px] font-black text-[var(--cp-ink)]">{item.quantidade}</span>
                            <button 
                              onClick={() => updateCartItemQuantity(item.cart_item_id, 1)} 
                              className="w-7 h-7 flex items-center justify-center text-[var(--cp-ink)] hover:opacity-50 transition-all active:scale-90"
                            >
                              <PlusIcon size={14} strokeWidth={3} />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => updateCartItemQuantity(item.cart_item_id, -item.quantidade)}
                            className="text-[10px] font-black uppercase tracking-widest text-[var(--cp-red)] opacity-40 hover:opacity-100 transition-opacity"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              /* Formulário de Finalização */
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <section>
                  <h3 className="text-[16px] font-black uppercase tracking-widest text-[var(--cp-ink)] mb-4 pb-2 border-b-2 border-[var(--cp-ink)]">Como deseja receber?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'entrega', label: 'Entrega' },
                      { id: 'retirada', label: 'Retirada' }
                    ].map((type) => (
                      <label 
                        key={type.id}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${userData.entregaTipo === type.id ? 'bg-[var(--cp-ink)] border-[var(--cp-ink)] text-white shadow-[4px_4px_0_0_var(--cp-red)]' : 'bg-white border-[var(--cp-line)] hover:border-[var(--cp-ink)] text-[var(--cp-ink)]'}`}
                      >
                        <span className="text-[12px] font-black uppercase tracking-wider">{type.label}</span>
                        <input type="radio" name="entregaTipo" className="hidden" checked={userData.entregaTipo === type.id} onChange={() => setUserData({...userData, entregaTipo: type.id as any})} />
                      </label>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[16px] font-black uppercase tracking-widest text-[var(--cp-ink)] mb-4 pb-2 border-b-2 border-[var(--cp-ink)]">Dados Pessoais</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider opacity-40 ml-1">Seu Nome</label>
                      <input 
                        type="text" 
                        placeholder="Como devemos te chamar?"
                        className="w-full h-14 px-5 rounded-xl border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all font-bold text-[15px]"
                        value={userData.nome}
                        onChange={(e) => setUserData({...userData, nome: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider opacity-40 ml-1">Telefone / WhatsApp</label>
                      <input 
                        type="tel" 
                        placeholder="(00) 00000-0000"
                        className="w-full h-14 px-5 rounded-xl border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all font-bold text-[15px]"
                        value={userData.telefone}
                        onChange={(e) => setUserData({...userData, telefone: e.target.value})}
                      />
                    </div>
                  </div>
                </section>

                {userData.entregaTipo === 'entrega' && (
                  <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="text-[16px] font-black uppercase tracking-widest text-[var(--cp-ink)] mb-4 pb-2 border-b-2 border-[var(--cp-ink)]">Endereço de Entrega</h3>
                    <div className="grid grid-cols-1 gap-4">
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider opacity-40 ml-1">CEP</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="00000-000"
                            maxLength={9}
                            className="w-full h-14 px-5 rounded-xl border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all font-bold text-[15px]"
                            value={userData.cep}
                            onChange={(e) => handleCepSearch(e.target.value)}
                          />
                          {isSearchingCep && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <div className="w-5 h-5 border-2 border-[var(--cp-ink)] border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider opacity-40 ml-1">Rua / Logradouro</label>
                        <input 
                          type="text" 
                          placeholder="Nome da rua"
                          className="w-full h-14 px-5 rounded-xl border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all font-bold text-[15px]"
                          value={userData.endereco}
                          onChange={(e) => setUserData({...userData, endereco: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider opacity-40 ml-1">Número</label>
                          <input 
                            type="text" 
                            placeholder="Ex: 123"
                            className="w-full h-14 px-5 rounded-xl border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all font-bold text-[15px]"
                            value={userData.numero}
                            onChange={(e) => setUserData({...userData, numero: e.target.value})}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider opacity-40 ml-1">Bairro</label>
                          <input 
                            type="text" 
                            placeholder="Seu bairro"
                            className="w-full h-14 px-5 rounded-xl border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all font-bold text-[15px]"
                            value={userData.bairro}
                            onChange={(e) => setUserData({...userData, bairro: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-[1fr_80px] gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider opacity-40 ml-1">Cidade</label>
                          <input 
                            type="text" 
                            placeholder="Cidade"
                            className="w-full h-14 px-5 rounded-xl border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all font-bold text-[15px]"
                            value={userData.cidade}
                            onChange={(e) => setUserData({...userData, cidade: e.target.value})}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider opacity-40 ml-1">UF</label>
                          <input 
                            type="text" 
                            placeholder="UF"
                            maxLength={2}
                            className="w-full h-14 px-5 rounded-xl border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all font-bold text-[15px] text-center uppercase"
                            value={userData.uf}
                            onChange={(e) => setUserData({...userData, uf: e.target.value.toUpperCase()})}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider opacity-40 ml-1">Ponto de Referência</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Próximo ao mercado..."
                          className="w-full h-14 px-5 rounded-xl border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all font-bold text-[15px]"
                          value={userData.referencia}
                          onChange={(e) => setUserData({...userData, referencia: e.target.value})}
                        />
                      </div>

                      {/* Status do Cálculo Automático */}
                      <div className="min-h-[48px] flex items-center">
                        {isCalculatingDistance ? (
                          <div className="flex items-center gap-3 px-4 py-2 bg-[var(--cp-dough)] rounded-xl border-2 border-[var(--cp-ink)] animate-pulse">
                            <div className="w-4 h-4 border-2 border-[var(--cp-ink)] border-t-transparent rounded-full animate-spin" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Calculando distância...</span>
                          </div>
                        ) : deliveryError ? (
                          <div className="w-full p-3 bg-rose-50 border-2 border-rose-200 rounded-xl flex gap-2 items-center">
                            <AlertCircle size={16} className="text-rose-500 flex-none" />
                            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-tight">{deliveryError}</span>
                          </div>
                        ) : userData.deliveryFee > 0 ? (
                          <div className="w-full p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex gap-2 items-center">
                            <CheckIcon size={16} className="text-emerald-500 flex-none" />
                            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-tight">
                              Taxa de entrega: R$ {formatPrice(userData.deliveryFee)}
                            </span>
                          </div>
                        ) : userData.endereco && (
                          <div className="w-full p-3 bg-zinc-50 border-2 border-zinc-200 rounded-xl flex gap-2 items-center">
                            <InfoIcon size={16} className="text-zinc-400 flex-none" />
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">Insira número e bairro para calcular</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                <section>
                  <h3 className="text-[16px] font-black uppercase tracking-widest text-[var(--cp-ink)] mb-4 pb-2 border-b-2 border-[var(--cp-ink)]">Pagamento</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'pix', label: 'Pix' },
                      { id: 'cartao', label: 'Cartão (na entrega)' },
                      { id: 'dinheiro', label: 'Dinheiro' }
                    ].map((method) => (
                      <label 
                        key={method.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${userData.pagamento === method.id ? 'bg-[var(--cp-ink)] border-[var(--cp-ink)] text-white shadow-[4px_4px_0_0_var(--cp-red)]' : 'bg-white border-[var(--cp-line)] hover:border-[var(--cp-ink)] text-[var(--cp-ink)]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[14px] font-black uppercase tracking-wider">{method.label}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${userData.pagamento === method.id ? 'border-white bg-white' : 'border-[var(--cp-ink)]'}`}>
                          {userData.pagamento === method.id && <div className="w-2.5 h-2.5 bg-[var(--cp-red)] rounded-full" />}
                        </div>
                        <input type="radio" name="payment" className="hidden" checked={userData.pagamento === method.id} onChange={() => setUserData({...userData, pagamento: method.id as any})} />
                      </label>
                    ))}
                    
                    {userData.pagamento === 'dinheiro' && (
                      <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[10px] font-black uppercase tracking-wider opacity-40 ml-1">Troco para quanto?</label>
                        <input 
                          type="text" 
                          placeholder="Ex: 100,00"
                          className="w-full h-12 px-5 rounded-xl border-2 border-[var(--cp-ink)] bg-white outline-none focus:bg-[var(--cp-dough)] transition-all font-bold text-[15px]"
                          value={userData.troco}
                          onChange={(e) => setUserData({...userData, troco: e.target.value})}
                        />
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="flex-none p-6 bg-white border-t-2 border-[var(--cp-line)] space-y-4 safe-bottom shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
              <div className="space-y-1 mb-2">
                <div className="flex items-center justify-between opacity-60">
                  <span className="text-[12px] font-bold uppercase tracking-widest">Subtotal</span>
                  <span className="text-[14px] font-black">R$ {formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between opacity-60">
                  <span className="text-[12px] font-bold uppercase tracking-widest">Entrega</span>
                  <span className="text-[14px] font-black">
                    {userData.entregaTipo === 'retirada' ? 'Grátis (Retirada)' : (userData.deliveryFee > 0 ? `R$ ${formatPrice(userData.deliveryFee)}` : 'A calcular')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[14px] font-black uppercase tracking-widest opacity-40">Total</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[16px] font-black text-[var(--cp-red)]">R$</span>
                    <span className="text-[32px] font-black text-[var(--cp-red)] leading-none" style={{ fontFamily: 'var(--font-display-alt)' }}>
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {checkoutStep === 'cart' ? (
                <button 
                  onClick={() => setCheckoutStep('form')}
                  className="w-full h-[64px] bg-[var(--cp-ink)] text-white rounded-2xl flex items-center justify-center gap-3 shadow-[0_6px_0_0_var(--cp-red)] active:shadow-none active:translate-y-1 transition-all"
                >
                  <span className="text-[14px] font-black uppercase tracking-[0.2em]">Finalizar Pedido</span>
                  <ChevronRightIcon size={18} />
                </button>
              ) : (
                <button 
                  onClick={onConfirmOrder}
                  disabled={!userData.nome || !userData.telefone || (userData.entregaTipo === 'entrega' && (!userData.endereco || !userData.numero || !userData.bairro || !!deliveryError || isCalculatingDistance))}
                  className={`w-full h-[64px] rounded-2xl flex items-center justify-center gap-3 transition-all relative
                    ${(userData.nome && userData.telefone && (userData.entregaTipo === 'retirada' || (userData.endereco && userData.numero && userData.bairro && !deliveryError && !isCalculatingDistance)))
                      ? 'bg-[var(--cp-green)] text-white shadow-[0_6px_0_0_var(--cp-ink)] active:shadow-none active:translate-y-1 cursor-pointer' 
                      : 'bg-zinc-100 text-zinc-300 border-2 border-zinc-200 cursor-not-allowed shadow-none'
                    }`}
                >
                  <ShoppingBagIcon size={20} />
                  <span className="text-[14px] font-black uppercase tracking-[0.2em]">Enviar via WhatsApp</span>
                </button>
              )}
              
              <button 
                onClick={() => {
                  if (checkoutStep === 'form') {
                    setCheckoutStep('cart');
                  } else {
                    setIsCartOpen(false);
                  }
                }}
                className="w-full py-2 text-[11px] font-black uppercase tracking-widest text-[var(--cp-ink)] opacity-40 hover:opacity-60 transition-opacity"
              >
                {checkoutStep === 'form' ? 'Voltar para o carrinho' : 'Continuar Comprando'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pix Modal */}
      <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ${showPixModal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-[var(--cp-ink)]/80 backdrop-blur-md" onClick={() => setShowPixModal(false)} />
        
        <div className={`relative bg-white w-full max-w-[360px] max-h-[90vh] rounded-[24px] border-4 border-[var(--cp-ink)] shadow-[8px_8px_0_0_var(--cp-red)] transition-transform duration-300 overflow-y-auto no-scrollbar ${showPixModal ? 'scale-100' : 'scale-95'}`}>
          <div className="p-6">
            <div className="text-center mb-5">
              <h3 className="text-[24px] font-black leading-tight" style={{ fontFamily: 'var(--font-display-alt)' }}>Pagamento via Pix</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Copie a chave abaixo</p>
            </div>

            <div className="space-y-4">
              <div className="bg-[var(--cp-dough)] rounded-2xl p-5 border-2 border-[var(--cp-ink)] relative overflow-hidden text-center">
                <div className="flex flex-col gap-0.5 mb-3">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Chave Pix (CPF)</span>
                  <span className="text-[18px] font-black text-[var(--cp-ink)] select-all leading-none">05370274592</span>
                </div>
                
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText('05370274592');
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className={`w-full h-10 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2 border-[var(--cp-ink)]
                    ${copySuccess 
                      ? 'bg-[var(--cp-green)] text-white border-[var(--cp-green)] shadow-none' 
                      : 'bg-white text-[var(--cp-ink)] shadow-[4px_4px_0_0_var(--cp-ink)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5'
                    }`}
                >
                  {copySuccess ? 'Copiado com sucesso!' : 'Copiar Chave'}
                </button>
              </div>

              <div className="space-y-2.5 bg-zinc-50 rounded-2xl p-4 border-2 border-dashed border-zinc-200">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Recebedor</span>
                  <span className="text-[13px] font-black text-[var(--cp-ink)] leading-tight">Edvaldo Santana Santos</span>
                </div>
                <div className="h-px bg-zinc-200" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Valor Total</span>
                  <span className="text-[16px] font-black text-[var(--cp-red)]">R$ {formatPrice(cartTotal)}</span>
                </div>
              </div>

              <div className="bg-orange-50 rounded-2xl p-4 border-2 border-orange-200">
                <p className="text-[11px] font-bold text-orange-800 leading-relaxed text-center">
                  Após o Pix, você deve <span className="underline">enviar o comprovante</span> no WhatsApp para confirmar o pedido.
                </p>
              </div>
              
              <button 
                onClick={handleSendOrder}
                className="w-full h-[56px] bg-[var(--cp-ink)] text-white rounded-2xl flex items-center justify-center gap-3 shadow-[0_4px_0_0_var(--cp-red)] active:shadow-none active:translate-y-1 transition-all mt-2"
              >
                <span className="text-[13px] font-black uppercase tracking-[0.2em]">Entendi, Enviar</span>
                <ChevronRightIcon size={16} />
              </button>

              <button 
                onClick={() => setShowPixModal(false)}
                className="w-full py-1 text-[10px] font-black uppercase tracking-widest text-[var(--cp-ink)] opacity-30 hover:opacity-60 transition-opacity"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .safe-bottom { padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
      `}</style>
    </main>
  );
}
