# Correções e Melhorias - Backend Vidralpha

## Data: 2026-04-14

Este documento descreve todas as correções e melhorias implementadas no backend do projeto Vidralpha.

---

## 📋 RESUMO DAS CORREÇÕES

### ✅ 1. Schema do Banco de Dados (Migração SQL)
**Arquivo:** `migrations/001_initial_schema.sql`

**Descrição:**
- Criado schema completo com todas as tabelas documentadas
- Adicionado Row Level Security (RLS) policies em TODAS as tabelas
- Criado índices para otimização de consultas frequentes
- Adicionado triggers para atualização automática de `updated_at`
- Criado constraint UNIQUE para prevenir duplicatas

**Tabelas incluídas:**
1. `profiles` - Perfis de usuários
2. `item_costs` - Custos de linhas, categorias e medidas
3. `glass_type_costs` - Custos de tipos de vidro e espessuras
4. `glass_colors` - Cores de vidro
5. `glass_color_costs` - Custos por cor de vidro
6. `products` - Produtos/esquadrias
7. `cart_items` - Carrinho de compras (**CORRIGIDO**)
8. `quotes` - Orçamentos/pedidos

**Correção Crítica na tabela `cart_items`:**
```sql
-- ANTES: PK (user_id, product_id) - Não suportava variações
-- DEPOIS: PK (user_id, product_id, options_hash) - Suporta variações

options_hash TEXT GENERATED ALWAYS AS (
  md5(
    product_id || '-' || 
    COALESCE(selected_options->>'size', '') || '-' ||
    COALESCE(selected_options->>'color', '') || '-' ||
    COALESCE(selected_options->>'glass_type', '') || '-' ||
    COALESCE(selected_options->>'glass_thickness', '') || '-' ||
    COALESCE(selected_options->>'glass_color', '')
  )
) STORED,
UNIQUE(user_id, product_id, options_hash)
```

---

### ✅ 2. Cálculo Dinâmico de Preço de Vidros
**Arquivo:** `src/pages/AdminProducts.jsx`

**Problema:**
- Custo de vidro era hardcoded: `const glassCost = area * 30` (R$30/m² fixo)
- Ignorava tipo, espessura e cor do vidro configurados no banco

**Solução:**
```javascript
// Novo estado para armazenar custos de vidro
const [glassCostMap, setGlassCostMap] = useState({})

// Função para buscar custos do banco
const fetchGlassCosts = async () => {
  const { data } = await supabase.from('glass_color_costs').select('*')
  if (data) {
    const newMap = {}
    data.forEach(r => {
      const key = `${r.glass_type}|${r.thickness}|${r.color_name}`
      newMap[key] = r.cost_per_m2
    })
    setGlassCostMap(newMap)
  }
}

// Função de cálculo dinâmico
const calculateGlassCost = (area, glassType, thickness, color) => {
  const key = `${glassType}|${thickness}|${color}`
  const costPerM2 = glassCostMap[key] || 0
  return area * costPerM2
}

// Substituído em 3 locais:
// DE: const glassCost = area * 30
// PARA: const glassCost = calculateGlassCost(area, glassType, glassThickness, glassColor)
```

---

### ✅ 3. Await nas Chamadas do Supabase (Carrinho)
**Arquivo:** `src/context/CartContext.jsx`

**Problema:**
- Chamadas ao Supabase eram assíncronas mas NÃO awaitadas
- Podia causar perda de dados se usuário navegasse rápido
- Inconsistência entre localStorage e banco

**Solução:**
```javascript
// ANTES: Sem await
if (user) {
  supabase.from('cart_items').insert({...})  // ← SEM await!
}

// DEPOIS: Com await e tratamento de erro
if (user) {
  const { data, error } = await supabase
    .from('cart_items')
    .insert({...})
    .select()
    .single()
  
  if (error) {
    console.error('Erro ao inserir no carrinho:', error)
    // Reverter em caso de erro
    setItems(prev => prev.filter(i => i.cart_id !== null || i.id !== productData.id))
  }
}
```

**Outras melhorias no CartContext:**
- Identificação de itens por `cart_id` (ID do banco) em vez de apenas `product_id`
- Suporte a múltiplas variações do mesmo produto (ex: mesma porta com vidros diferentes)
- Rollback em caso de erro para manter consistência

---

### ✅ 4. Linhas e Categorias Dinâmicas no Catálogo
**Arquivo:** `src/pages/Catalog.jsx`

**Problema:**
- Linhas e categorias eram hardcoded no frontend
- Inconsistência com AdminProducts (que buscava do banco)

**Solução:**
```javascript
// ANTES: Hardcoded
const availableLines = ['Suprema', 'Gold', 'Brises']
const availableCategories = ['Portas Deslizantes', 'Portas de Giro', ...]

// DEPOIS: Dinâmico do banco
const [availableLines, setAvailableLines] = useState([])
const [availableCategories, setAvailableCategories] = useState([])

useEffect(() => {
  const fetchMetadata = async () => {
    const { data } = await supabase.from('item_costs').select('line, category')
    if (data) {
      const uniqueLines = Array.from(new Set(data.map(r => r.line))).sort()
      const uniqueCats = Array.from(new Set(data.map(r => r.category))).sort()
      setAvailableLines(uniqueLines)
      setAvailableCategories(uniqueCats)
    }
  }
  fetchMetadata()
}, [])
```

---

### ✅ 5. Alertas de Custos Zerados
**Arquivo:** `src/pages/AdminItemCosts.jsx`

**Problema:**
- Novos itens eram criados com custo R$ 0,00 sem alerta
- Produtos podiam ser vendidos sem custo configurado

**Solução:**
```javascript
// Alerta ao criar nova linha
alert(`⚠️ Linha "${lineName}" criada com sucesso!

IMPORTANTE: ${inserts.length} medida(s) foram inicializadas com custo R$ 0,00. 
Configure os valores corretos antes de liberar para venda.`)

// Alerta ao criar novo tipo de vidro
alert(`⚠️ Tipo de vidro "${name}" criado com sucesso!

IMPORTANTE: Os custos foram inicializados com R$ 0,00. 
Não esqueça de configurar os valores corretos na edição.`)
```

---

### ✅ 6. Validação de Duplicidade no Backend
**Arquivo:** `src/pages/AdminItemCosts.jsx`

**Problema:**
- Validação de duplicidade era apenas no frontend
- Race condition se dois admins criassem ao mesmo tempo

**Solução:**
```javascript
const { error } = await supabase.from('glass_type_costs').upsert(inserts, {
  onConflict: 'glass_type,thickness'
})
if (error) {
  // CORREÇÃO: Tratar erro de duplicidade do banco (código 23505)
  if (error.code === '23505') {
    alert(`⚠️ O tipo de vidro "${name}" ou uma de suas espessuras já existe no banco.`)
  } else {
    alert('Erro ao salvar tipo de vidro: ' + error.message)
  }
  return
}
```

---

### ✅ 7. Sistema de Toast Notifications
**Arquivos:** `src/App.jsx`, `src/pages/AdminProducts.jsx`

**Instalação:**
```bash
npm install react-hot-toast
```

**Configuração no App.jsx:**
```javascript
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#363636',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
              },
              success: {
                iconTheme: { primary: '#15803D', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#E11D48', secondary: '#fff' },
              },
            }}
          />
          {/* ... */}
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

**Substituição de alerts:**
```javascript
// ANTES
alert('Erro ao salvar produto: ' + error.message)

// DEPOIS
toast.error('Erro ao salvar produto: ' + error.message)
toast.success('Produto criado com sucesso!')
```

---

### ✅ 8. Validação de Upload de Imagens
**Arquivo:** `src/pages/AdminProducts.jsx`

**Problema:**
- Imagens eram uploadadas sem validação
- Sem controle de tamanho ou formato

**Solução:**
```javascript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const validFiles = filesArray.filter(file => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.error(`Formato inválido: ${file.name}. Use JPEG, PNG ou WebP.`)
    return false
  }
  if (file.size > MAX_SIZE) {
    toast.error(`Imagem muito grande: ${file.name}. Máximo: 5MB.`)
    return false
  }
  return true
})
```

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

### Imediato (Antes do Deploy)
1. **Executar migração SQL no Supabase:**
   - Acesse Supabase Dashboard → SQL Editor
   - Execute o arquivo `migrations/001_initial_schema.sql`
   
2. **Configurar RLS Policies:**
   - Verificar se todas as policies foram aplicadas
   - Testar acesso de usuário não-admin

3. **Testar carrinho:**
   - Adicionar variações do mesmo produto
   - Verificar sync entre localStorage e banco

### Curto Prazo
1. Adicionar testes unitários (Vitest/Jest)
2. Implementar paginação no catálogo
3. Adicionar índices no Supabase para consultas frequentes

### Médio Prazo
1. Migrar para TypeScript para type safety
2. Implementar Edge Functions para validação no backend
3. Adicionar cache com React Query ou SWR

---

## 📝 NOTAS TÉCNNICAS

### Breaking Changes
- **Tabela `cart_items`:** Se já houver dados, a migração adicionará a coluna `options_hash` automaticamente
- **Cálculo de preços:** Certifique-se de que `glass_color_costs` tem dados configurados antes de liberar para produção

### Variáveis de Ambiente
Nenhuma mudança necessária.

### Dependências Adicionadas
- `react-hot-toast@^4.x`

---

## ✅ CHECKLIST DE VALIDAÇÃO

- [x] Schema SQL criado com todas as tabelas
- [x] RLS policies configuradas
- [x] Cálculo de vidros corrigido (3 locais)
- [x] CartContext com await em todas as chamadas
- [x] Catalog.jsx com linhas/categorias dinâmicas
- [x] Alertas de custos zerados
- [x] Validação de duplicidade no backend
- [x] Toast notifications configuradas
- [x] Validação de upload de imagens
- [x] Testes manuais pendentes

---

## 📞 SUPORTE

Para dúvidas ou problemas, consulte:
- Arquivo de migração: `migrations/001_initial_schema.sql`
- Arquivos modificados: Ver git diff
- Documentação Supabase: https://supabase.com/docs
