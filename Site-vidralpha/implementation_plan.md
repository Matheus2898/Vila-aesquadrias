# Implementação: Precificação Dinâmica (Sem Vidro) & Calculadora de Custos

O usuário solicitou duas novas mecânicas de negócio na plataforma:
1. **Opção de Venda Sem Vidro:** Permitir que o cliente opte por comprar apenas a esquadria (sem o preenchimento de vidro), o que reduz o valor da compra.
2. **Calculadora de Formação de Preço Base (Markup):** Ferramenta no Painel Admin que utiliza Custo, Impostos e Margem de Lucro (Markup) para sugerir e autopreencher o preço do produto de forma técnica.

## User Review Required

> [!IMPORTANT]
> Antes de executar alterações profundas no banco de dados ou no fluxo de checkout, preciso que você valide as premissas deste plano de negócios e responda as perguntas em aberto abaixo.

## Proposed Changes

---

### Página `AdminProducts.jsx` (Painel Administrativo)

**1. Variação de Preço Sem Vidro (Medidas):**
- **O que muda:** Como o tamanho (medida) impacta diretamente na quantidade de vidro gasto, a lógica de "Com Vidro" vs "Sem Vidro" precisa ser por medida.
- Na lista de medidas adicionadas ao produto, incluiremos um novo campo: **"Preço SEM Vidro (R$)"**. 
- O campo já existente **"Preço (R$)"** passa a tratar explicitamente do **Preço COM Vidro**.

**2. Calculadora de Precificação:**
- **O que muda:** Criaremos um novo bloco auxiliar (toggle expansível) ao lado do "Preço (A partir de)", chamado "Calculadora de Precificação".
- O Administrador informará: `Custo de Produção (R$)`, `Margem (Markup %)` e `Impostos (%)`.
- Haverá um botão "✅ Aplicar ao Preço Base". Ao clicar, o sistema fará a matemática e injetará o valor final direto no campo oficial "Preço (A partir de)". 

#### [MODIFY] `src/pages/AdminProducts.jsx`
- Adição dos campos `price_without_glass` na lógica de JSON `measures`.
- Injeção da UI de Calculadora de Markup.

---

### Página `ProductDetail.jsx` (Visualização Pública e Compra)

**3. Seleção de Variação de Vidro (Cliente):**
- **O que muda:** Abaixo das medidas do produto, adicionaremos uma nova seleção para o cliente:
  - `Com Vidro (Produto Completo)` - mantém o sistema atual exibindo os dropdowns de Tipo, Espessura e Cor.
  - `Sem Vidro (Apenas Esquadria)` - esconde os dropdowns (já que não há vidro) e altera o valor de exibição do preço final do produto descontando o custo do vidro estabelecido no Admin.
- A configuração atualizada viaja para o Carrinho marcando se o produto está acompanhado de vidro ou não.

#### [MODIFY] `src/pages/ProductDetail.jsx`
- Novo estado `buyWithGlass` (boolean, default: true).
- Atualização do cálculo do `selectedPrice` injetando o novo switch de "Apenas Esquadria".
- Esconder Dropdowns (Espessura, Cor e Tipo) caso `buyWithGlass` seja falso.
- Inclusão do dado modificado na prop `addToCart`.

---

## Open Questions

> [!WARNING]
> Responda as perguntas matemáticas abaixo para que a calculadora fiscal funcione como esperado na sua vida real.

1. **Fórmula do Markup:** Existem várias formas contábeis de aplicar isso. A forma contábil mais comum (Cálculo por Dentro) é:  
   `Preço Final = Custo / (1 - (Markup/100) - (Impostos/100))`.  
   Ou você prefere uma simples adição?  
   `Preço Final = Custo + (Custo * Markup/100) + (Custo * Impostos/100)`?
2. **Calculadora e Medidas:** A calculadora será usada APENAS para calcular o "Preço Base" (Aquela vitrine inicial *"A partir de R$..."*) ou você quer que exista um botão de "Calculadora" individual dentro de *cada* "Nova Medida" que você cadastra no produto?
3. **Se o cliente compra 'Sem Vidro'**, os drop-downs de "Tipo de Vidro, Cor e Espessura" devem sumir totalmente da tela dele? (Atualmente eles existem para todo produto).

## Verification Plan

### Manual Verification
- Testarei a criação de um produto usando a calculadora no Mobile Mockup do sistema.
- Inserirei preços diferenciados de Medida x Sem Vidro.
- Verificarei em `ProductDetail.jsx` simulando a seleção de cliente para checar se o preço corta automaticamente os valores das esquadrias.
