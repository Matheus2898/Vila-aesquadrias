import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'

const CartContext = createContext({})

const LS_KEY = 'vilaca_cart'

// ─── Helpers de LocalStorage ──────────────────────────────────────
const lsGet = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
const lsSet = (items) => localStorage.setItem(LS_KEY, JSON.stringify(items))
const lsClear = () => localStorage.removeItem(LS_KEY)

// ─── Provider ─────────────────────────────────────────────────────
export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // ── Carrega o carrinho quando muda o status de auth
  useEffect(() => {
    if (user) {
      loadFromSupabase()
    } else {
      setItems(lsGet())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // ── Salva no localStorage sempre que items mudar (para visitantes)
  useEffect(() => {
    if (!user) {
      lsSet(items)
    }
  }, [items, user])

  // ── Carrega do Supabase e mescla com localStorage
  const loadFromSupabase = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cart_items')
      .select('*, products(id, name, price, old_price, image_url, is_active, measures)')
      .eq('user_id', user.id)

    if (error) {
      console.error('Erro ao carregar carrinho:', error)
      setLoading(false)
      return
    }

    // Mapeia para formato interno usando options_hash para identificar itens únicos
    const dbItems = (data || []).map(row => ({
      id: row.product_id,
      cart_id: row.id, // Usar ID do banco agora (suporte a variações)
      name: row.products?.name || '',
      price: Number(row.products?.price || 0),
      image: row.products?.image_url || '/img-porta.png',
      quantity: row.quantity,
      options: row.selected_options || {},
      measures: row.products?.measures || []
    }))

    // Mescla carrinho do localStorage (visitante que acabou de logar)
    const localItems = lsGet()
    if (localItems.length > 0) {
      const merged = [...dbItems]
      for (const local of localItems) {
        // Merge baseado em product_id + options (não apenas product_id)
        const existing = merged.find(i =>
          i.id === local.id &&
          JSON.stringify(i.options) === JSON.stringify(local.options)
        )
        if (existing) {
          existing.quantity += local.quantity
        } else {
          merged.push(local)
        }
      }
      lsClear()
      setItems(merged)
      // Sincroniza merge de volta ao Supabase
      await syncAllToSupabase(merged)
    } else {
      setItems(dbItems)
    }
    setLoading(false)
  }

  // ── Sincroniza todos os items ao banco (upsert com suporte a variações)
  const syncAllToSupabase = async (itemsToSync) => {
    if (!user) return

    const payload = itemsToSync.map(i => ({
      user_id: user.id,
      product_id: i.id,
      quantity: i.quantity,
      selected_options: i.options || {},
      updated_at: new Date().toISOString(),
    }))

    // CORREÇÃO: O banco usa unique constraint 'cart_items_user_product_options_unique'
    // que inclui o options_hash (gerado no banco).
    const { error } = await supabase
      .from('cart_items')
      .upsert(payload, { onConflict: 'cart_items_user_product_options_unique' })

    if (error) {
      console.error('Erro ao sincronizar carrinho:', error)
    }
  }

  // ── Adicionar ao carrinho (COM await e suporte a variações)
  const addToCart = useCallback(async (productData) => {
    const qty = productData.quantity || 1

    // Usar o variant_sku enviado pelo ProductDetail, ou o sku base como fallback
    const variantSku = productData.variant_sku || productData.sku_code || `P${(productData.id || '').toString().slice(0, 4).toUpperCase()}`

    const options = {
      size: productData.selectedSize,
      color: productData.selectedColor,
      side: productData.selectedSide,
      glass_type: productData.selectedGlassType,
      glass_thickness: productData.selectedGlassThickness,
      glass_color: productData.selectedGlassColor,
      freight: productData.selectedFreight,
      variant_sku: variantSku
    }

    // CORREÇÃO: Identificar item por product_id + options (suporte a variações)
    const existingItem = items.find(i =>
      i.id === productData.id &&
      JSON.stringify(i.options) === JSON.stringify(options)
    )

    if (existingItem) {
      // Atualizar quantidade do item existente
      const newQty = existingItem.quantity + qty

      // Atualizar estado local imediatamente
      setItems(prev => prev.map(i =>
        i.id === existingItem.id && JSON.stringify(i.options) === JSON.stringify(options)
          ? { ...i, quantity: newQty }
          : i
      ))

      // CORREÇÃO: Agora com await para garantir sync
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('id', existingItem.cart_id)

        if (error) {
          console.error('Erro ao atualizar carrinho:', error)
          // Reverter em caso de erro
          setItems(prev => prev.map(i =>
            i.id === existingItem.id && JSON.stringify(i.options) === JSON.stringify(options)
              ? { ...i, quantity: existingItem.quantity }
              : i
          ))
        }
      }
    } else {
      // Criar novo item no carrinho
      const newItem = {
        id: productData.id,
        cart_id: null, // Será preenchido após insert
        name: productData.name,
        price: Number(productData.price),
        image: productData.image_url || productData.image || '/img-porta.png',
        quantity: qty,
        options: options
      }

      // Atualizar estado local imediatamente
      setItems(prev => [...prev, newItem])

      // CORREÇÃO: Agora com await para garantir insert
      if (user) {
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: productData.id,
            quantity: qty,
            selected_options: options
          })
          .select()
          .single()

        if (error) {
          console.error('Erro ao inserir no carrinho:', error)
          // Reverter em caso de erro
          setItems(prev => prev.filter(i => i.cart_id !== null || i.id !== productData.id))
        } else if (data) {
          // Atualizar cart_id com o ID real do banco
          setItems(prev => prev.map(i =>
            i.cart_id === null && i.id === productData.id && JSON.stringify(i.options) === JSON.stringify(options)
              ? { ...i, cart_id: data.id }
              : i
          ))
        }
      }
    }

    setIsOpen(true)
  }, [user, items])

  // ── Remover item (COM await e suporte a variações)
  const removeFromCart = useCallback(async (cartItemId) => {
    // CORREÇÃO: Remover por cart_id (ID único do item no carrinho)
    const itemToRemove = items.find(i => i.cart_id === cartItemId || i.id === cartItemId)

    // Atualizar estado local imediatamente
    setItems(prev => prev.filter(i => i.cart_id !== cartItemId && i.id !== cartItemId))

    if (user && itemToRemove) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemToRemove.cart_id)

      if (error) {
        console.error('Erro ao remover do carrinho:', error)
        // Reverter em caso de erro
        if (itemToRemove) {
          setItems(prev => [...prev, itemToRemove])
        }
      }
    }
  }, [user, items])

  // ── Atualizar quantidade (COM await e suporte a variações)
  const updateQty = useCallback(async (cartItemId, delta) => {
    // CORREÇÃO: Atualizar por cart_id para suportar variações
    const itemToUpdate = items.find(i => i.cart_id === cartItemId)

    if (!itemToUpdate) {
      console.error('Item não encontrado no carrinho:', cartItemId)
      return
    }

    const newQty = Math.max(1, itemToUpdate.quantity + delta)

    // Atualizar estado local imediatamente
    setItems(prev => prev.map(i =>
      i.cart_id === cartItemId ? { ...i, quantity: newQty } : i
    ))

    // CORREÇÃO: Agora com await para garantir sync
    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq('id', itemToUpdate.cart_id)

      if (error) {
        console.error('Erro ao atualizar quantidade:', error)
        // Reverter em caso de erro
        setItems(prev => prev.map(i =>
          i.cart_id === cartItemId ? { ...i, quantity: itemToUpdate.quantity } : i
        ))
      }
    }
  }, [user, items])

  // ── Limpar carrinho
  const clearCart = useCallback(async () => {
    setItems([])
    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      if (error) {
        console.error('Erro ao limpar carrinho:', error)
      }
    } else {
      lsClear()
    }
  }, [user])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, loading, isOpen, setIsOpen,
      addToCart, removeFromCart, updateQty, clearCart,
      totalItems, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext)
