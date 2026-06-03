import { useEffect, useRef, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { Loader2, Plus, Edit, Trash2, Box, X, UploadCloud, Power, Copy, ChevronDown, Check, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomDropdown from '../components/CustomDropdown'
import ConfirmModal from '../components/ConfirmModal'

// ─── Gerador de SKU Aleatório e Único ─────────────────────────────────────────
// Cada cadastro de produto (mesmo produto mas medidas ou vidros diferentes)
// recebe um SKU diferente, aleatório e único.
// Formato: [PREFIXO_CAT][TIMESTAMP_PARCIAL][RANDOM_CHARS]
// Ex: PD-K3X9-A7F2, J-M2P1-B8C4
const CAT_PREFIX_MAP = {
  'Portas Deslizantes': 'PD',
  'Portas de Giro': 'PG',
  'Portas Pivotantes': 'PP',
  'Janelas': 'JN',
  'Vitro': 'VT',
  'Brises': 'BR',
}

const generateUniqueSKU = (category = '') => {
  const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem O,I,0,1 (evita confusão visual)
  const getRand = (len) => Array.from({ length: len }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')

  const catCode = CAT_PREFIX_MAP[category] || (category.substring(0, 2).toUpperCase() || 'PR')
  // Timestamp parcial: últimos 4 hex do Date.now() para criar variação temporal
  const tsPart = Date.now().toString(36).slice(-4).toUpperCase()
  const randPart = getRand(4)

  return `${catCode}-${tsPart}-${randPart}`
}

// Verifica unicidade no banco e regera até encontrar um SKU livre
const generateNewUniqueSKU = async (category = '', supabaseClient) => {
  let attempts = 0
  while (attempts < 10) {
    const code = generateUniqueSKU(category)
    const { data } = await supabaseClient
      .from('products')
      .select('id')
      .eq('sku_code', code)
      .maybeSingle()
    if (!data) return code // nenhum produto com esse SKU → está livre
    attempts++
  }
  // Fallback: gera com timestamp completo (virtualmente impossível colidir)
  return `PR-${Date.now().toString(36).toUpperCase()}`
}

// ─── Normalização de Texto ──────────────────────────────────────────────────
const standardizeCase = (str) => {
  if (!str) return str
  // Se estiver tudo em maiúsculo, convertemos. Se não, mantemos como está (pode ser Case-sensitive intencional)
  if (str === str.toUpperCase() && str !== str.toLowerCase()) {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
  }
  return str
}

export default function AdminProducts() {
  const { profile, user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const modalBodyRef = useRef(null)
  const idCounter = useRef(0)

  const getNextId = () => {
    idCounter.current += 1
    return idCounter.current
  }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)

  // Batch Clone State
  const [isBatchCloneMode, setIsBatchCloneMode] = useState(false)
  const [selectedForClone, setSelectedForClone] = useState([])
  const [isBatchCloning, setIsBatchCloning] = useState(false)

  // Filter State
  const [filterSearch, setFilterSearch] = useState('')
  const [filterLine, setFilterLine] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('') // '' | 'active' | 'inactive'
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false })

  // Media State (up to 5 max)
  const [imageFiles, setImageFiles] = useState([]) // Arrays de { file, preview }
  const [existingImages, setExistingImages] = useState([]) // Arrays de strings (URLs)

  // Measures Variantes
  const [measures, setMeasures] = useState([]) // Arrays de { id, size, price, old_price, weight }
  const [costMap, setCostMap] = useState({}) // Cache de custos para a categoria atual { '1200x2100': 500 }
  const [glassCostMap, setGlassCostMap] = useState({}) // Cache de custos de vidro { 'Comum|4mm|Incolor': 150 }

  const [newProduct, setNewProduct] = useState({
    name: '',
    line: '', // Iniciará vazio para forçar seleção ou vir do primeiro metadado
    category: '',
    markup: '',
    taxes: '',
    description: '',
    specs: '',
    warranty: '',
    sku_code: '',
    glass_types: [],
    glass_thickness: [],
    glass_colors: []
  })

  // ── Metadados dinâmicos do banco ─────────────────────────────────────────────
  const [availableLines, setAvailableLines] = useState([])
  const [availableCategories, setAvailableCategories] = useState([])
  const [categoriesByLine, setCategoriesByLine] = useState({}) // { 'Linha Suprema': Set(['Portas', 'Janelas']) }
  const [lineTypeMap, setLineTypeMap] = useState({}) // { [linha]: 'esquadria' | 'acessorio' }
  const [availableGlassTypes, setAvailableGlassTypes] = useState({}) // { 'Comum': ['4mm', '6mm'], 'Temperado': [...] }
  const [availableColors, setAvailableColors] = useState([])

  const currentLineType = lineTypeMap[newProduct.line] || 'esquadria'
  const isEsquadria = currentLineType === 'esquadria'
  const isAcessorio = currentLineType === 'acessorio'
  const isVidro = currentLineType === 'vidro'
  const isPadrao = currentLineType === 'padrao'

  const fetchMetadata = async () => {
    try {
      const { data: lineRecords } = await supabase.from('product_lines').select('name, is_accessory, accessory_type')
      const { data: costRecords } = await supabase.from('item_costs').select('line, category, measure')

      if (lineRecords) {
        const uniqueLines = lineRecords.map(r => r.name).sort()
        setAvailableLines(uniqueLines)

        const typeMap = {}
        lineRecords.forEach(r => {
          typeMap[r.name] = r.line_type || (r.is_accessory ? 'acessorio' : 'esquadria')
        })
        setLineTypeMap(typeMap)

        const catsByLine = {}
        const allCatsSet = new Set()
        if (costRecords) {
          costRecords.forEach(r => {
            if (!catsByLine[r.line]) catsByLine[r.line] = new Set()
            catsByLine[r.line].add(r.category)
            allCatsSet.add(r.category)
          })
        }

        const allCats = Array.from(allCatsSet).sort()
        setAvailableCategories(allCats)
        setCategoriesByLine(catsByLine)

        if (!newProduct.line && uniqueLines.length > 0) {
          const firstLine = uniqueLines[0]
          const firstCat = catsByLine[firstLine] ? Array.from(catsByLine[firstLine]).sort()[0] : (allCats[0] || '')
          setNewProduct(prev => ({ ...prev, line: firstLine, category: firstCat }))
          fetchCostMap(firstLine, firstCat)
        }
      }

      // 2. Tipos de Vidro e Espessuras
      const { data: glassRecords } = await supabase.from('glass_type_costs').select('glass_type, thickness')
      if (glassRecords) {
        const grouped = {}
        glassRecords.forEach(r => {
          if (!grouped[r.glass_type]) grouped[r.glass_type] = []
          if (!grouped[r.glass_type].includes(r.thickness)) grouped[r.glass_type].push(r.thickness)
        })
        setAvailableGlassTypes(grouped)
      }

      // 3. Cores
      const { data: colorRecords } = await supabase.from('glass_colors').select('name')
      if (colorRecords) {
        setAvailableColors(colorRecords.map(c => c.name).sort())
      }
    } catch (err) {
      console.error('Erro ao carregar metadados:', err)
    }
  }

  // ── Estado SKU – não mais determinístico, sempre aleatório ──────────────────
  const [skuLocked, setSkuLocked] = useState(false)
  const [isGeneratingSku, setIsGeneratingSku] = useState(false)

  // Gera e aplica um novo SKU único assincronamente
  const applyNewSKU = async (category = '') => {
    setIsGeneratingSku(true)
    const code = await generateNewUniqueSKU(category || newProduct.category, supabase)
    setNewProduct(prev => ({ ...prev, sku_code: code }))
    setIsGeneratingSku(false)
    return code
  }

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) {
      setProducts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const initData = async () => {
      await fetchMetadata()
      await fetchGlassCosts() // Carregar custos de vidro
      await fetchProducts()
    }
    initData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Masks
  const parseCurrency = (strValue) => {
    if (!strValue) return null
    return parseFloat(strValue.replace(/\./g, '').replace(',', '.'))
  }

  const handlePriceChange = (e, field) => {
    let val = e.target.value.replace(',', '.')
    if (isNaN(val) && val !== '.') val = '0'
    const formatted = val

    setNewProduct(prev => {
      const updated = { ...prev, [field]: formatted }

      if (['markup', 'taxes'].includes(field)) {
        const mark = parseFloat(updated.markup) || 0
        const tax = parseFloat(updated.taxes) || 0

        setMeasures(old => old.map(m => {
          const mCost = parseCurrency(m.cost_price || '0') || 0

          const parts = m.size.toLowerCase().split('x')
          let area = 0
          if (parts.length === 2) {
            let w = parseFloat(parts[0].replace(',', '.'))
            let h = parseFloat(parts[1].replace(',', '.'))
            if (w > 50) w = w / 1000
            if (h > 50) h = h / 1000
            area = w * h
          }
          // Usar custo dinâmico do vidro em vez de valor hardcoded
          const glassType = updated.glass_types?.[0] || 'Comum'
          const glassThickness = updated.glass_thickness?.[0] || '4mm'
          const glassColor = updated.glass_colors?.[0] || 'Incolor'
          const glassCost = calculateGlassCost(area, glassType, glassThickness, glassColor)
          const frameCost = Math.max(0, mCost - glassCost)

          const mFinal = mCost + (mCost * (mark / 100)) + (mCost * (tax / 100))
          const mFinalWithout = frameCost + (frameCost * (mark / 100)) + (frameCost * (tax / 100))

          return {
            ...m,
            price: mFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            price_without_glass: mFinalWithout.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        }))
      }
      return updated
    })
  }

  const fetchCostMap = async (line, category) => {
    const { data } = await supabase.from('item_costs').select('*').eq('line', line).eq('category', category)
    const newMap = {}
    if (data) data.forEach(c => newMap[c.measure] = c.cost)
    setCostMap(newMap)
    return newMap
  }

  // Buscar custos de vidro do banco para cálculos dinâmicos
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

  // Calcular custo de vidro dinamicamente baseado no tipo, espessura e cor
  const calculateGlassCost = (area, glassType = 'Comum', thickness = '4mm', color = 'Incolor') => {
    const key = `${glassType}|${thickness}|${color}`
    const costPerM2 = glassCostMap[key] || 0
    return area * costPerM2
  }

  const handleLineCategoryChange = async (field, val) => {
    const updated = { ...newProduct, [field]: val }

    // Se a linha mudou, atualizar a categoria para a primeira disponível nessa linha
    if (field === 'line') {
      const lineCats = categoriesByLine[val]
      if (lineCats) {
        const sortedCats = Array.from(lineCats).sort()
        // Se a categoria atual não pertence a essa linha, selecionar a primeira
        if (!lineCats.has(updated.category)) {
          updated.category = sortedCats[0] || ''
        }
      }
      // LIMPEZA: ao trocar de uma linha de esquadria para acessório (ou vice-versa),
      // zerar os campos de vidro para não deixar rastros incoerentes
      const novoTipo = lineTypeMap[val] || 'esquadria'
      if (novoTipo !== 'esquadria') {
        updated.glass_types = []
        updated.glass_thickness = []
        updated.glass_colors = []
        updated.category = 'Padrão'
      }
    }

    setNewProduct(updated)
    await fetchCostMap(updated.line, updated.category)

    // Limpar medidas apenas na criação e só quando a LINHA mudar
    // (muda de linha = estrutura completamente diferente; muda só categoria = pode manter as medidas)
    if (!editingId && field === 'line') {
      setMeasures([])
    }
  }

  const toggleMeasure = (size) => {
    const isSelected = measures.some(m => m.size === size)
    if (isSelected) {
      setMeasures(measures.filter(m => m.size !== size))
    } else {
      const cost = costMap[size] || 0
      const mark = parseFloat(newProduct.markup) || 0
      const tax = parseFloat(newProduct.taxes) || 0

      const parts = size.toLowerCase().split('x')
      let area = 0
      if (parts.length === 2) {
        let w = parseFloat(parts[0].replace(',', '.'))
        let h = parseFloat(parts[1].replace(',', '.'))
        if (w > 50) w = w / 1000
        if (h > 50) h = h / 1000
        area = w * h
      }
      // Usar custo dinâmico do vidro em vez de valor hardcoded
      const glassType = newProduct.glass_types?.[0] || 'Comum'
      const glassThickness = newProduct.glass_thickness?.[0] || '4mm'
      const glassColor = newProduct.glass_colors?.[0] || 'Incolor'
      const glassCost = calculateGlassCost(area, glassType, glassThickness, glassColor)
      const frameCost = Math.max(0, cost - glassCost)

      const isNotEsquadria = (lineTypeMap[newProduct.line] || 'esquadria') !== 'esquadria'
      const finalPrice = isNotEsquadria ? cost : cost + (cost * (mark / 100)) + (cost * (tax / 100))
      const finalWithout = isNotEsquadria ? cost : frameCost + (frameCost * (mark / 100)) + (frameCost * (tax / 100))
      const measureId = getNextId()

      setMeasures([...measures, {
        id: measureId,
        size: size,
        cost_price: Number(cost).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        price: finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        price_without_glass: finalWithout.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        old_price: '',
        weight: '10'
      }])
    }
  }

  const addMeasure = () => setMeasures([...measures, { id: getNextId(), size: '', cost_price: '', price: '', price_without_glass: '', old_price: '', weight: '' }])
  const removeMeasure = (id) => setMeasures(measures.filter(m => m.id !== id))
  const updateMeasure = (id, field, value) => setMeasures(measures.map(m => m.id === id ? { ...m, [field]: value } : m))

  const handleMeasurePriceChange = (e, id, field) => {
    let val = e.target.value.replace(/\D/g, '')
    if (!val) {
      updateMeasure(id, field, '')
      return
    }
    const numberValue = parseFloat(val) / 100
    const formatted = numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    setMeasures(prev => prev.map(m => {
      if (m.id === id) {
        const updatedMeasure = { ...m, [field]: formatted }

        if (field === 'cost_price') {
          const c = parseCurrency(formatted) || 0
          const mark = parseFloat(newProduct.markup) || 0
          const tax = parseFloat(newProduct.taxes) || 0

          const isNotEsquadria = (lineTypeMap[newProduct.line] || 'esquadria') !== 'esquadria'

          if (!isNotEsquadria) {
            const parts = m.size.toLowerCase().split('x')
            let area = 0
            if (parts.length === 2) {
              let w = parseFloat(parts[0].replace(',', '.'))
              let h = parseFloat(parts[1].replace(',', '.'))
              if (w > 50) w = w / 1000
              if (h > 50) h = h / 1000
              area = w * h
            }
            // Usar custo dinâmico do vidro em vez de valor hardcoded
            const glassType = newProduct.glass_types?.[0] || 'Comum'
            const glassThickness = newProduct.glass_thickness?.[0] || '4mm'
            const glassColor = newProduct.glass_colors?.[0] || 'Incolor'
            const glassCost = calculateGlassCost(area, glassType, glassThickness, glassColor)
            const frameCost = Math.max(0, c - glassCost)

            const finalP = c + (c * (mark / 100)) + (c * (tax / 100))
            const finalWithout = frameCost + (frameCost * (mark / 100)) + (frameCost * (tax / 100))

            updatedMeasure.price = finalP.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            updatedMeasure.price_without_glass = finalWithout.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        }
        return updatedMeasure
      }
      return m
    }))
  }

  // Upload Logic (Up to 5)
  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      const currentTotal = existingImages.length + imageFiles.length

      if (currentTotal + filesArray.length > 5) {
        toast.error('Você só pode adicionar até 5 fotos por produto!')
        return
      }

      // CORREÇÃO: Validação de formato e tamanho
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

      const newImageFiles = validFiles.map(f => ({
        file: f,
        preview: URL.createObjectURL(f)
      }))

      setImageFiles([...imageFiles, ...newImageFiles])
    }
  }

  const removeFile = (index) => {
    const newFiles = [...imageFiles]
    newFiles.splice(index, 1)
    setImageFiles(newFiles)
  }

  const removeExistingImage = (index) => {
    const newExisting = [...existingImages]
    newExisting.splice(index, 1)
    setExistingImages(newExisting)
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id)
    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p))
    }
  }
  const openNew = async () => {
    setEditingId(null)
    setSkuLocked(false)
    // Usar primeiro valor disponível do banco em vez de hardcoded
    const defaultLine = availableLines[0] || ''
    const lineCats = categoriesByLine[defaultLine]
    const defaultCategory = lineCats ? Array.from(lineCats).sort()[0] : (availableCategories[0] || '')
    const defaultDefaults = {
      name: '',
      line: defaultLine,
      category: defaultCategory,
      cost_price: '',
      markup: '30,00',
      taxes: '15,00',
      price: '',
      old_price: '',
      description: '',
      specs: '',
      warranty: '',
      sku_code: '',
      glass_types: [],
      glass_thickness: [],
      glass_colors: []
    }
    setNewProduct(defaultDefaults)
    setExistingImages([])
    setImageFiles([])  // garante que fotos de uma sessão anterior não aparecem
    setMeasures([])
    if (defaultLine && defaultCategory) {
      await fetchCostMap(defaultLine, defaultCategory)
    }
    // Gera SKU único novo para este produto
    setIsGeneratingSku(true)
    const newSku = await generateNewUniqueSKU(defaultCategory, supabase)
    setNewProduct(prev => ({ ...prev, sku_code: newSku }))
    setSkuLocked(true)
    setIsGeneratingSku(false)
    setIsModalOpen(true)
  }

  const openDuplicate = async (p) => {
    if (modalBodyRef.current) modalBodyRef.current.scrollTop = 0
    setEditingId(null)
    setSkuLocked(false)
    setNewProduct({
      name: p.name + ' (Cópia)',
      line: p.line,
      category: p.category,
      cost_price: p.cost_price ? Number(p.cost_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      markup: p.markup ? Number(p.markup).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '30,00',
      taxes: p.taxes ? Number(p.taxes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '15,00',
      price: p.price ? Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      old_price: p.old_price ? Number(p.old_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      description: p.description || '',
      specs: p.specs || '',
      warranty: p.warranty || '',
      ncm: p.ncm || '',
      icms: p.icms || '',
      ipi: p.ipi || '',
      ii: p.ii || '',
      sku_code: '', // SKU provisório, será substituído
      glass_types: p.glass_types || [],
      glass_thickness: p.glass_thickness || [],
      glass_colors: p.glass_colors || []
    })
    const urls = p.image_urls && p.image_urls.length > 0 ? p.image_urls : (p.image_url && p.image_url !== '/img-porta.png' ? [p.image_url] : [])
    setExistingImages(urls)
    setImageFiles([])
    if (p.measures && p.measures.length > 0) {
      setMeasures(p.measures.map(m => ({
        id: getNextId(),
        size: m.size,
        price: m.price ? Number(m.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        price_without_glass: m.price_without_glass ? Number(m.price_without_glass).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        old_price: m.old_price ? Number(m.old_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        cost_price: m.cost_price ? Number(m.cost_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        weight: m.weight || ''
      })))
    } else {
      setMeasures([])
    }
    await fetchCostMap(p.line, p.category)
    // Duplicata sempre recebe um SKU NOVO e único (nunca copia o SKU do original)
    setIsGeneratingSku(true)
    const newSku = await generateNewUniqueSKU(p.category, supabase)
    setNewProduct(prev => ({ ...prev, sku_code: newSku }))
    setSkuLocked(true)
    setIsGeneratingSku(false)
    setIsModalOpen(true)
  }

  const openEdit = async (p) => {
    if (modalBodyRef.current) modalBodyRef.current.scrollTop = 0
    setEditingId(p.id)
    setSkuLocked(true) // Edição sempre mantém o SKU existente travado
    setNewProduct({
      name: p.name,
      line: p.line,
      category: p.category,
      cost_price: p.cost_price ? Number(p.cost_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      markup: p.markup ? Number(p.markup).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      taxes: p.taxes ? Number(p.taxes).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      price: Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      old_price: p.old_price ? Number(p.old_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      description: p.description || '',
      specs: p.specs || '',
      warranty: p.warranty || '',
      ncm: p.ncm || '',
      icms: p.icms || '',
      ipi: p.ipi || '',
      ii: p.ii || '',
      sku_code: p.sku_code || '',
      glass_types: p.glass_types || [],
      glass_thickness: p.glass_thickness || [],
      glass_colors: p.glass_colors || []
    })
    const urls = p.image_urls && p.image_urls.length > 0 ? p.image_urls : (p.image_url && p.image_url !== '/img-porta.png' ? [p.image_url] : [])
    setExistingImages(urls)
    setImageFiles([])
    if (p.measures && p.measures.length > 0) {
      setMeasures(p.measures.map(m => ({
        id: getNextId(),
        size: m.size,
        price: m.price ? Number(m.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        price_without_glass: m.price_without_glass ? Number(m.price_without_glass).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        old_price: m.old_price ? Number(m.old_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        cost_price: m.cost_price ? Number(m.cost_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        weight: m.weight || ''
      })))
    } else {
      setMeasures([])
    }
    await fetchCostMap(p.line, p.category)
    setIsModalOpen(true)
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    // Fazer o upload de todos os novos arquivos para o Storage
    const uploadedUrls = []

    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i].file
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        toast.error('Erro no upload da imagem ' + (i + 1) + ': ' + uploadError.message)
        setIsSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      uploadedUrls.push(publicUrlData.publicUrl)
    }

    // Junta as midias que já existiam e que nao foram excluidas com as que subimos agora
    const finalImagesArray = [...existingImages, ...uploadedUrls]
    // A primeira imagem servirá como fallback da thumbnail legacy
    const primaryThumbnail = finalImagesArray.length > 0 ? finalImagesArray[0] : '/img-porta.png'

    const payload = {
      name: newProduct.name,
      line: newProduct.line,
      category: newProduct.category,
      markup: parseFloat(newProduct.markup) || 0,
      taxes: parseFloat(newProduct.taxes) || 0,
      price: measures.length > 0 ? parseCurrency(measures[0].price) : 0,
      old_price: (measures.length > 0 && measures[0].old_price) ? parseCurrency(measures[0].old_price) : null,
      image_url: primaryThumbnail,
      image_urls: finalImagesArray,
      description: newProduct.description || null,
      specs: newProduct.specs || null,
      warranty: newProduct.warranty || null,
      ncm: newProduct.ncm || '',
      icms: newProduct.icms || '',
      ipi: newProduct.ipi || '',
      ii: newProduct.ii || '',
      measures: measures.map(m => ({
        size: m.size,
        price: parseCurrency(m.price) || 0,
        price_without_glass: parseCurrency(m.price_without_glass) || null,
        old_price: parseCurrency(m.old_price) || null,
        cost_price: parseCurrency(m.cost_price) || 0,
        weight: parseFloat(m.weight) || 0
      })),
      glass_types: newProduct.glass_types || [],
      glass_thickness: newProduct.glass_thickness || [],
      glass_colors: newProduct.glass_colors || [],
      sku_code: newProduct.sku_code || ''
    }

    // Se for linha de acessório, garantir que campos de vidro sejam nulos
    const tipoLinha = lineTypeMap[newProduct.line] || 'esquadria'
    if (tipoLinha === 'acessorio') {
      payload.glass_types = []
      payload.glass_thickness = []
      payload.glass_colors = []
    }

    const saveAction = async () => {
      let res
      if (editingId) {
        res = await supabase.from('products').update(payload).eq('id', editingId).select()
      } else {
        payload.is_active = true
        res = await supabase.from('products').insert([payload]).select()
      }
      if (res.error) throw res.error
      return res.data[0]
    }

    toast.promise(saveAction(), {
      loading: editingId ? 'Atualizando produto...' : 'Criando produto...',
      success: (data) => {
        if (editingId) {
          setProducts(products.map(p => p.id === editingId ? data : p))
        } else {
          setProducts([data, ...products])
        }
        setIsModalOpen(false)
        setIsSaving(false)
        return editingId ? 'Produto atualizado!' : 'Produto criado!'
      },
      error: (err) => {
        setIsSaving(false)
        return 'Erro ao salvar: ' + err.message
      }
    })
  }

  const handleDelete = async (id) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja deletar permanentemente este produto? Esta ação não pode ser desfeita.',
      type: 'danger',
      onConfirm: async () => {
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (!error) {
          setProducts(products.filter(p => p.id !== id))
          toast.success('Produto excluído!')
        } else {
          toast.error('Erro ao excluir: ' + error.message)
        }
      }
    })
  }

  const toggleCloneSelection = (id) => {
    setSelectedForClone(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleBatchCloneSelection = async () => {
    if (selectedForClone.length === 0) return
    setIsBatchCloning(true)

    const itemsToClone = products.filter(p => selectedForClone.includes(p.id))

    // Gerar SKUs únicos para cada clone
    const clones = []
    for (const p of itemsToClone) {
      // eslint-disable-next-line no-unused-vars
      const { id, created_at, sku_code, ...rest } = p
      const newSku = await generateNewUniqueSKU(p.category, supabase)
      clones.push({
        ...rest,
        name: p.name + ' (NOVO CLONE)',
        sku_code: newSku
      })
    }

    const { data, error } = await supabase.from('products').insert(clones).select()
    setIsBatchCloning(false)

    if (!error && data) {
      setProducts([...data, ...products])
      setIsBatchCloneMode(false)
      setSelectedForClone([])
    } else {
      toast.error('Erro ao clonar em lote: ' + (error?.message || ''))
    }
  }

  const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin' || user?.email === 'matheusmatos2898@gmail.com'
  if (!isAdmin) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 className="t-h1">Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta área.</p>
      </div>
    )
  }

  const totalPhotos = existingImages.length + imageFiles.length;

  // Filtros client-side — calculado sobre o array ja carregado, sem novo fetch
  const filteredProducts = products.filter(p => {
    if (filterStatus === 'active' && !p.is_active) return false
    if (filterStatus === 'inactive' && p.is_active) return false
    if (filterLine && p.line !== filterLine) return false
    if (filterCategory && p.category !== filterCategory) return false
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      const matchName = p.name?.toLowerCase().includes(q)
      const matchSku = p.sku_code?.toLowerCase().includes(q)
      const matchCat = p.category?.toLowerCase().includes(q)
      const matchLine = p.line?.toLowerCase().includes(q)
      if (!matchName && !matchSku && !matchCat && !matchLine) return false
    }
    return true
  })

  // Categorias disponíveis conforme a linha selecionada no filtro
  const filterCategoryOptions = filterLine
    ? (categoriesByLine[filterLine] ? Array.from(categoriesByLine[filterLine]).sort() : [])
    : availableCategories

  const hasActiveFilters = filterSearch || filterLine || filterCategory || filterStatus

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .admin-products-header {
            flex-direction: column;
            align-items: stretch !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .admin-products-actions {
            display: flex;
            flex-direction: row !important;
            width: 100%;
            gap: 8px !important;
          }
          .admin-products-actions > button,
          .admin-products-actions > div > button {
            flex: 1;
            justify-content: center;
            padding: 12px 8px !important;
            font-size: 13px !important;
            white-space: nowrap;
          }
        }
      `}</style>
      <div className="admin-products-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="t-h1" style={{ fontSize: window.innerWidth <= 768 ? '22px' : '32px', margin: 0 }}>Gestão de Produtos</h1>
        </div>
        <div className="admin-products-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {isBatchCloneMode ? (
            <>
              <button onClick={() => { setIsBatchCloneMode(false); setSelectedForClone([]) }} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', fontWeight: 600, cursor: 'pointer', outline: 'none' }}>Cancelar</button>
              <button onClick={handleBatchCloneSelection} disabled={selectedForClone.length === 0 || isBatchCloning} style={{ background: 'var(--color-navy-900)', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: (selectedForClone.length === 0 || isBatchCloning) ? 0.5 : 1 }}>
                {isBatchCloning ? <Loader2 size={18} className="animate-spin" /> : <Copy size={18} />}
                Confirmar ({selectedForClone.length})
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsBatchCloneMode(true)} style={{ background: 'white', color: 'var(--color-navy-900)', border: '1px solid #CBD5E1', padding: '12px 24px', borderRadius: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Copy size={18} /> Clonagem em Lote
              </button>
              <button onClick={openNew} style={{ background: 'var(--color-amber-500)', color: 'var(--color-navy-900)', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Plus size={18} /> Novo Produto
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ flex: '2 1 220px', minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Pesquisar</label>
          <div style={{ position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="2" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input type="text" value={filterSearch} onChange={e => setFilterSearch(e.target.value)} placeholder="Nome, SKU, categoria..." style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1.5px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#FAFAF8' }} />
          </div>
        </div>
        <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Linha</label>
          <CustomDropdown
            value={filterLine}
            onChange={val => { setFilterLine(val); setFilterCategory('') }}
            placeholder="Todas as linhas"
            options={[
              { value: '', label: 'Todas as linhas' },
              ...availableLines.map(l => ({ value: l, label: l }))
            ]}
          />
        </div>
        <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Categoria</label>
          <CustomDropdown
            value={filterCategory}
            onChange={val => setFilterCategory(val)}
            placeholder="Todas as categorias"
            options={[
              { value: '', label: 'Todas as categorias' },
              ...filterCategoryOptions.map(c => ({ value: c, label: standardizeCase(c) }))
            ]}
          />
        </div>
        <div style={{ flex: '1 1 130px', minWidth: '120px' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Status</label>
          <CustomDropdown
            value={filterStatus}
            onChange={val => setFilterStatus(val)}
            placeholder="Todos"
            options={[
              { value: '', label: 'Todos' },
              { value: 'active', label: 'Ativos' },
              { value: 'inactive', label: 'Inativos' }
            ]}
          />
        </div>
        {hasActiveFilters && (
          <button onClick={() => { setFilterSearch(''); setFilterLine(''); setFilterCategory(''); setFilterStatus('') }} style={{ padding: '10px 16px', border: '1.5px solid #FECACA', borderRadius: '10px', background: '#FEF2F2', color: '#B91C1C', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            ✕ Limpar
          </button>
        )}
      </div>

      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#888', fontWeight: 500 }}>
          {filteredProducts.length === products.length
            ? `${products.length} produto${products.length !== 1 ? 's' : ''} cadastrado${products.length !== 1 ? 's' : ''}`
            : `${filteredProducts.length} de ${products.length} produto${products.length !== 1 ? 's' : ''}`}
        </span>
        {hasActiveFilters && <span style={{ fontSize: '11px', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>Filtros ativos</span>}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E8E8E0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
            <Box size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            {products.length === 0
              ? 'Nenhum produto cadastrado no banco de dados.'
              : 'Nenhum produto encontrado com os filtros selecionados.'}
          </div>
        ) : (
          <div className="admin-products-list">
            <table className="desktop-only-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8E8E0', color: '#888' }}>
                  {isBatchCloneMode && <th style={{ padding: '16px 8px 16px 24px', width: '40px' }}></th>}
                  <th style={{ padding: '16px 24px' }}>Produto</th>
                  <th style={{ padding: '16px 24px' }}>Categoria</th>
                  <th style={{ padding: '16px 24px' }}>Preço</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center' }}>Estoque</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F0F0EA', opacity: p.is_active ? 1 : 0.6 }}>
                    {isBatchCloneMode && (
                      <td style={{ padding: '16px 8px 16px 24px', width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedForClone.includes(p.id)}
                          onChange={() => toggleCloneSelection(p.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </td>
                    )}
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--color-navy-900)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={p.image_url || '/img-porta.png'} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #E8E8E0' }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {p.name}
                            {p.name.includes('(NOVO CLONE)') && (
                              <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, border: '1px solid #FECACA' }}>
                                ⚠️ REQUER EDIÇÃO
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#888', fontWeight: 400 }}>Linha: {p.line}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>{p.category}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 700 }}>R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleStatus(p.id, p.is_active)}
                        style={{
                          background: p.is_active ? '#ECFDF5' : '#F3F4F6',
                          color: p.is_active ? '#15803D' : '#6B7280',
                          padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                          border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                        }}
                      >
                        <Power size={12} />
                        {p.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => openDuplicate(p)} title="Duplicar" style={{ background: '#FFFBEB', color: '#B45309', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Copy size={16} /></button>
                        <button onClick={() => openEdit(p)} title="Editar" style={{ background: '#F0F9FF', color: '#0369A1', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Edit size={16} /></button>
                        <button onClick={() => handleDelete(p.id)} title="Excluir" style={{ background: '#FEF2F2', color: '#B91C1C', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-only-cards" style={{ display: 'none' }}>
              {filteredProducts.map(p => (
                <div key={p.id} style={{ padding: '20px', borderBottom: '1px solid #F0F0EA', opacity: p.is_active ? 1 : 0.6 }}>
                  {isBatchCloneMode && (
                    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '12px', borderBottom: '1px dashed #E2E8F0' }}>
                      <input
                        type="checkbox"
                        checked={selectedForClone.includes(p.id)}
                        onChange={() => toggleCloneSelection(p.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Selecionar para clonar</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <img src={p.image_url || '/img-porta.png'} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-navy-900)', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        {p.name}
                        {p.name.includes('(NOVO CLONE)') && (
                          <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, border: '1px solid #FECACA' }}>
                            ⚠️ REQUER EDIÇÃO
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{p.category} • {p.line}</div>
                      <div style={{ fontWeight: 800, color: 'var(--color-navy-900)', marginTop: '4px' }}>R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(p.id, p.is_active)}
                      style={{
                        background: p.is_active ? '#ECFDF5' : '#F3F4F6',
                        color: p.is_active ? '#15803D' : '#6B7280',
                        padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, border: 'none'
                      }}
                    >
                      {p.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openDuplicate(p)} style={{ background: '#FFFBEB', color: '#B45309', border: 'none', padding: '8px', borderRadius: '8px' }}><Copy size={16} /></button>
                      <button onClick={() => openEdit(p)} style={{ background: '#F0F9FF', color: '#0369A1', border: 'none', padding: '8px', borderRadius: '8px' }}><Edit size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} style={{ background: '#FEF2F2', color: '#B91C1C', border: 'none', padding: '8px', borderRadius: '8px' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
          onWheel={(e) => { if (modalBodyRef.current) { modalBodyRef.current.scrollBy({ top: e.deltaY, behavior: 'smooth' }); e.preventDefault() } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '24px',
          }}>
          <div
            data-lenis-prevent="true"
            style={{
              background: 'white', width: '100%', maxWidth: '560px', borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              maxHeight: 'calc(100vh - 48px)',
              flexShrink: 0,
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
            {/* ── Header fixo do modal ── */}
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #F0F0EA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAFAF8', flexShrink: 0, borderRadius: '20px 20px 0 0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#000' }}>
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'white', border: '1px solid #E8E8E0', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <X size={16} />
              </button>
            </div>

            {/* ── Corpo scrollável ── */}
            <div ref={modalBodyRef} className="modal-scroll" style={{ overflowY: 'auto', flex: 1, padding: '32px' }}>
              <form id="product-form" onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Galeria de Fotos Multi-Upload */}
                <div className="gallery-box-mobile-fix">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#444' }}>Galeria de Fotos <span style={{ color: '#E11D48' }}>*</span></label>
                    <span style={{ fontSize: '11px', color: '#888', fontWeight: 600 }}>{totalPhotos} de 5 limites</span>
                  </div>

                  {/* Miniaturas */}
                  {(existingImages.length > 0 || imageFiles.length > 0) && (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {/* Já hospedadas */}
                      {existingImages.map((url, i) => (
                        <div key={'ext-' + i} style={{ width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '2px solid #E5E7EB' }}>
                          <img src={url} alt="Galeria" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeExistingImage(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {/* Novas (arquivos nativos preview) */}
                      {imageFiles.map((fileObj, i) => (
                        <div key={'file-' + i} style={{ width: '72px', height: '72px', borderRadius: '10px', overflow: 'hidden', position: 'relative', border: '2px dashed #0369A1' }}>
                          <img src={fileObj.preview} alt="Galeria" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeFile(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,0,0,0.8)', border: 'none', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Botão Giga de Upload (Oculta ao chegar em 5) */}
                  {totalPhotos < 5 && (
                    <div style={{
                      width: '100%', height: totalPhotos === 0 ? '140px' : '60px', border: '2px dashed #D1D5DB', borderRadius: '12px', background: '#F9FAFB',
                      display: 'flex', flexDirection: totalPhotos === 0 ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', transition: 'all 0.2s',
                    }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        style={{ opacity: 0, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, cursor: 'pointer' }}
                      />
                      <div style={{ textAlign: 'center', color: '#6B7280', display: 'flex', flexDirection: totalPhotos === 0 ? 'column' : 'row', gap: totalPhotos === 0 ? '0' : '12px', alignItems: 'center' }}>
                        <UploadCloud size={totalPhotos === 0 ? 24 : 18} style={totalPhotos === 0 ? { margin: '0 auto 8px' } : {}} color="var(--color-navy-900)" />
                        <div style={{ fontSize: totalPhotos === 0 ? '14px' : '13px', fontWeight: 600, color: 'var(--color-navy-900)' }}>Adicionar Fotos</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Grid 2 Columns for Inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>Nome do Produto <span style={{ color: '#E11D48' }}>*</span></label>
                    <input required type="text" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Ex: Porta Pivotante Premium" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAF8' }} />
                  </div>

                  <div className="ds-two-col" style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>Linha <span style={{ color: '#E11D48' }}>*</span></label>
                      <CustomDropdown
                        value={newProduct.line}
                        onChange={val => handleLineCategoryChange('line', val)}
                        placeholder="Selecione uma linha"
                        options={availableLines.map(line => {
                          const type = lineTypeMap[line] || 'esquadria'
                          let TypeIcon = <span style={{ fontSize: '11px', background: '#DBEAFE', color: '#1E40AF', padding: '1px 6px', borderRadius: '6px', fontWeight: 700, whiteSpace: 'nowrap' }}>Esquadria</span>
                          if (type === 'acessorio') TypeIcon = <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: '6px', fontWeight: 700, whiteSpace: 'nowrap' }}>Acessório</span>
                          if (type === 'vidro') TypeIcon = <span style={{ fontSize: '11px', background: '#E0E7FF', color: '#4338CA', padding: '1px 6px', borderRadius: '6px', fontWeight: 700, whiteSpace: 'nowrap' }}>Vidro</span>
                          if (type === 'padrao') TypeIcon = <span style={{ fontSize: '11px', background: '#F3F4F6', color: '#4B5563', padding: '1px 6px', borderRadius: '6px', fontWeight: 700, whiteSpace: 'nowrap' }}>Padrão</span>
                          return {
                            value: line,
                            label: line.replace('Linha ', ''),
                            icon: TypeIcon
                          }
                        })}
                      />
                      {/* Badge indicador do tipo da linha selecionada */}
                      {newProduct.line && (
                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '11px', padding: '2px 8px', borderRadius: '6px', fontWeight: 700,
                            background: isEsquadria ? '#DBEAFE' : (isVidro ? '#E0E7FF' : (isAcessorio ? '#FEF3C7' : '#F3F4F6')),
                            color: isEsquadria ? '#1E40AF' : (isVidro ? '#4338CA' : (isAcessorio ? '#92400E' : '#4B5563'))
                          }}>
                            {isAcessorio && '📦 Linha de Acessórios'}
                            {isEsquadria && '🏭 Linha de Esquadrias'}
                            {isVidro && '🪟 Vidros Avulsos'}
                            {isPadrao && '📦 Produto Comum'}
                          </span>
                          {!isEsquadria && <span style={{ fontSize: '11px', color: '#888' }}>Formulário simplificado (Modo direto)</span>}
                        </div>
                      )}
                    </div>
                    {isEsquadria && (
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>Categoria <span style={{ color: '#E11D48' }}>*</span></label>
                        <CustomDropdown
                          value={newProduct.category}
                          onChange={val => handleLineCategoryChange('category', val)}
                          placeholder="Selecione uma categoria"
                          options={(() => {
                            const lineCats = categoriesByLine[newProduct.line]
                            const filteredCats = lineCats ? Array.from(lineCats).sort() : availableCategories
                            return filteredCats.map(cat => ({ value: cat, label: cat }))
                          })()}
                        />
                      </div>
                    )}
                  </div>

                  <div className="ds-three-col" style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                    {isEsquadria && (
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>Markup (%)</label>
                        <input type="text" value={newProduct.markup} onChange={e => handlePriceChange(e, 'markup')} placeholder="Ex: 30" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAF8' }} />
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>Impostos (%)</label>
                      <input type="text" value={newProduct.taxes} onChange={e => handlePriceChange(e, 'taxes')} placeholder="Ex: 15" style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAF8' }} />
                    </div>
                  </div>

                  {/* Variações de Medidas */}
                  <div style={{ borderTop: '1px solid #F0F0EA', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="measure-title-mobile-fix" style={{ fontSize: '13px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {!isEsquadria ? 'Variações de Produto' : 'Variações de Medidas e Pesos'}
                      </div>

                      {/* Chips de Seleção de Medidas (Sugestões Dinâmicas do Banco) */}
                      {Object.keys(costMap).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                          {Object.keys(costMap).sort().map(size => {
                            const active = measures.some(m => m.size === size)
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => toggleMeasure(size)}
                                style={{
                                  padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                  background: active ? 'var(--color-amber-500)' : 'white',
                                  color: active ? 'var(--color-navy-900)' : '#666',
                                  border: active ? '1px solid var(--color-amber-500)' : '1px solid #E5E7EB',
                                  display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                              >
                                {active ? <Plus size={14} style={{ transform: 'rotate(45deg)' }} /> : <Plus size={14} />}
                                {size}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      <button type="button" onClick={addMeasure} className="add-measure-btn" style={{ alignSelf: 'flex-start' }}>
                        <Plus className="add-measure-icon" size={14} />
                        <span className="desktop-text">{!isEsquadria ? 'Add Variação' : 'Add Medida Personalizada'}</span>
                        <span className="mobile-text">{!isEsquadria ? 'Add Variação' : 'Medida Personalizada'}</span>
                      </button>
                    </div>

                    {measures.map((m) => (
                      <div key={m.id} style={{ background: '#FAFAF8', padding: '16px', borderRadius: '8px', border: '1px solid #E5E7EB', position: 'relative' }}>
                        <div className="ds-grid-mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>

                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#666', marginBottom: '4px' }}>
                              {!isEsquadria ? 'Variação / Unidade' : 'Tamanho'} <span style={{ color: '#E11D48' }}>*</span>
                            </label>
                            <input required type="text" value={m.size} onChange={e => updateMeasure(m.id, 'size', e.target.value)} placeholder={!isEsquadria ? 'Ex: Unidade, Par...' : 'Ex: 1.50x2.10'} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#666', marginBottom: '4px' }}>Custo Base (R$)</label>
                            <input type="text" value={m.cost_price || ''} onChange={e => handleMeasurePriceChange(e, m.id, 'cost_price')} placeholder="0,00" style={{ width: '100%', padding: '8px 12px', border: '1px solid #A5B4FC', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#666', marginBottom: '4px' }}>
                              {!isEsquadria ? 'Preço Final de Venda (R$)' : 'Preço COM Vidro (R$)'} <span style={{ color: '#E11D48' }}>*</span>
                            </label>
                            <input required type="text" readOnly={isEsquadria} value={m.price} onChange={e => {
                              // se NÃO for esquadria, permitir edicao manual de preço e não usar markup
                              if (!isEsquadria) handleMeasurePriceChange(e, m.id, 'price')
                            }} placeholder="0,00" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', outline: 'none', background: isEsquadria ? '#F1F1F1' : 'white', color: isEsquadria ? '#666' : 'black' }} />
                          </div>
                        </div>
                        <div className="ds-grid-mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px', marginTop: '12px' }}>

                          {isEsquadria && (
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#666', marginBottom: '4px' }}>Preço SEM Vidro (R$)</label>
                              <input type="text" value={m.price_without_glass} onChange={e => handleMeasurePriceChange(e, m.id, 'price_without_glass')} placeholder="0,00" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                            </div>
                          )}
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#666', marginBottom: '4px' }}>Promocional</label>
                            <input type="text" value={m.old_price} onChange={e => handleMeasurePriceChange(e, m.id, 'old_price')} placeholder="0,00" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#666', marginBottom: '4px' }}>Peso (kg) <span style={{ color: '#E11D48' }}>*</span></label>
                            <input required type="number" step="0.1" value={m.weight} onChange={e => updateMeasure(m.id, 'weight', e.target.value)} placeholder="0.0" style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                          </div>
                          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button type="button" onClick={() => removeMeasure(m.id)} style={{ color: '#E11D48', background: 'transparent', border: 'none', display: 'flex', gap: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, alignItems: 'center' }}><Trash2 size={14} /> Excluir variação</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {measures.length === 0 && <div style={{ fontSize: '13px', color: '#888' }}>Nenhuma medida extra cadastrada. O produto usará apenas o preço base.</div>}
                  </div>

                </div>

                {/* Especificações de Vidro — OCULTA para produtos que não são de esquadria */}
                {isEsquadria && (
                  <div style={{ borderTop: '1px solid #F0F0EA', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Configuração de Vidro</div>

                    {/* Tipo de Vidro */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '12px' }}>Tipo do Vidro</label>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {Object.keys(availableGlassTypes).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const current = newProduct.glass_types || []
                              const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type]
                              setNewProduct({ ...newProduct, glass_types: next })
                            }}
                            style={{
                              padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                              background: newProduct.glass_types?.includes(type) ? 'var(--color-navy-900)' : 'white',
                              color: newProduct.glass_types?.includes(type) ? 'white' : '#444',
                              border: newProduct.glass_types?.includes(type) ? '1px solid var(--color-navy-900)' : '1px solid #E5E7EB'
                            }}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Espessuras Dinâmicas */}
                    {newProduct.glass_types?.length > 0 && (
                      <div style={{ background: '#FAFAF8', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {newProduct.glass_types.map(type => (
                            <div key={type}>
                              <span style={{ display: 'block', fontSize: '12px', color: '#666', fontWeight: 800, marginBottom: '8px', textTransform: 'uppercase' }}>Opções Vidro {type}</span>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {(availableGlassTypes[type] || []).map(t => (
                                  <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'white', padding: '6px 12px', borderRadius: '6px', border: '1px solid #DDD', cursor: 'pointer', fontSize: '13px' }}>
                                    <input
                                      type="checkbox"
                                      checked={newProduct.glass_thickness?.includes(t)}
                                      onChange={() => {
                                        const cur = newProduct.glass_thickness || []
                                        const nxt = cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t]
                                        setNewProduct({ ...newProduct, glass_thickness: nxt })
                                      }}
                                    /> {t}
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cores de Vidro */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '12px' }}>Cores de Vidro</label>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {availableColors.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => {
                              const current = newProduct.glass_colors || []
                              const next = current.includes(color) ? current.filter(c => c !== color) : [...current, color]
                              setNewProduct({ ...newProduct, glass_colors: next })
                            }}
                            style={{
                              padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                              background: newProduct.glass_colors?.includes(color) ? 'var(--color-navy-900)' : 'white',
                              color: newProduct.glass_colors?.includes(color) ? 'white' : '#444',
                              border: newProduct.glass_colors?.includes(color) ? '1px solid var(--color-navy-900)' : '1px solid #E5E7EB'
                            }}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Seção de Conteúdo do Produto */}
                <div style={{ borderTop: '1px solid #F0F0EA', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conteúdo do Produto</div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>Descrição do Produto</label>
                    <textarea
                      rows={4}
                      value={newProduct.description}
                      onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                      placeholder="Descreva o produto: materiais, diferenciais, aplicações..."
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAF8', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>Especificações Técnicas</label>
                    <textarea
                      rows={4}
                      value={newProduct.specs}
                      onChange={e => setNewProduct({ ...newProduct, specs: e.target.value })}
                      placeholder="Ex: Espessura do Perfil - 3.2mm | Fechadura - Rolete multiponto | Peso Médio - 45kg/m²"
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAF8', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
                    />
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>Separe cada especificação com <strong>-</strong> ou em linhas separadas.</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>Garantia e Instalação</label>
                    <textarea
                      rows={4}
                      value={newProduct.warranty}
                      onChange={e => setNewProduct({ ...newProduct, warranty: e.target.value })}
                      placeholder="Ex: Garantia de Fábrica - 5 anos | Instalação Gratuita - Raio de 100km | Manutenção Preventiva - 1 visita gratuita no 1º ano"
                      style={{ width: '100%', padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAF8', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
                    />
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>Separe cada item com <strong>-</strong> ou em linhas separadas.</p>
                  </div>
                </div>

                {/* Informações Fiscais (Nota Fiscal) */}
                <div style={{ borderTop: '1px solid #F0F0EA', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informações Fiscais (Nota Fiscal)</div>

                  {/* Informações Fiscais */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>

                    {/* ─ Código do Produto (SKU) ─ */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>
                        SKU Base (Prefixo)
                      </label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type="text"
                            value={isGeneratingSku ? 'Gerando...' : newProduct.sku_code}
                            readOnly={skuLocked || isGeneratingSku}
                            onChange={e => {
                              if (!skuLocked && !isGeneratingSku) setNewProduct(prev => ({ ...prev, sku_code: e.target.value.toUpperCase() }))
                            }}
                            placeholder="Gerando código único..."
                            style={{
                              width: '100%', padding: '10px 14px',
                              border: '1.5px solid',
                              borderColor: isGeneratingSku ? '#FDE68A' : skuLocked ? '#D1FAE5' : '#BFDBFE',
                              borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                              outline: 'none',
                              background: isGeneratingSku ? '#FFFBEB' : skuLocked ? '#F0FDF4' : '#EFF6FF',
                              color: isGeneratingSku ? '#92400E' : skuLocked ? '#065F46' : '#1E40AF',
                              letterSpacing: '1.5px', fontFamily: 'monospace',
                              cursor: (skuLocked || isGeneratingSku) ? 'default' : 'text',
                              boxSizing: 'border-box'
                            }}
                          />
                          {skuLocked && !isGeneratingSku && (
                            <span style={{
                              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                              fontSize: '10px', fontWeight: 800, color: '#059669',
                              background: '#D1FAE5', padding: '2px 8px', borderRadius: '999px'
                            }}>✓ ÚNICO</span>
                          )}
                          {isGeneratingSku && (
                            <span style={{
                              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                              fontSize: '10px', fontWeight: 800, color: '#92400E',
                              background: '#FDE68A', padding: '2px 8px', borderRadius: '999px'
                            }}>⟳ Gerando...</span>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isGeneratingSku}
                          onClick={async () => {
                            if (skuLocked) {
                              // Desbloqueia para edição manual
                              setSkuLocked(false)
                            } else {
                              // Regera um novo SKU aleatório e único
                              await applyNewSKU(newProduct.category)
                              setSkuLocked(true)
                            }
                          }}
                          title={skuLocked ? 'Clique para editar manualmente' : 'Clique para gerar novo código único'}
                          style={{
                            padding: '10px 14px', borderRadius: '10px', border: '1px solid #E5E7EB',
                            background: isGeneratingSku ? '#F3F4F6' : skuLocked ? '#FEF9C3' : 'var(--color-navy-900)',
                            color: isGeneratingSku ? '#9CA3AF' : skuLocked ? '#713F12' : 'white',
                            fontWeight: 700, fontSize: '12px', cursor: isGeneratingSku ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0
                          }}
                        >
                          {isGeneratingSku ? '⟳ Aguarde' : skuLocked ? '✏️ Editar' : '🎲 Novo SKU'}
                        </button>
                      </div>
                      <p style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                        {isGeneratingSku
                          ? 'Verificando unicidade no banco de dados...'
                          : skuLocked
                            ? `SKU Base travado: ${newProduct.sku_code}. Este código será a raiz da variação na NF-e.`
                            : 'SKU Base desbloqueado. Edite manualmente ou gere um novo código.'}
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>NCM</label>
                      <input type="text" value={newProduct.ncm} onChange={e => setNewProduct({ ...newProduct, ncm: e.target.value })} placeholder="Ex: 7610.10.00" style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAF8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>ICMS (%)</label>
                      <input type="text" value={newProduct.icms} onChange={e => setNewProduct({ ...newProduct, icms: e.target.value })} placeholder="Ex: 18.0" style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAF8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>IPI (%)</label>
                      <input type="text" value={newProduct.ipi} onChange={e => setNewProduct({ ...newProduct, ipi: e.target.value })} placeholder="0.0" style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAF8' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>II (%)</label>
                      <input type="text" value={newProduct.ii} onChange={e => setNewProduct({ ...newProduct, ii: e.target.value })} placeholder="0.0" style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAF8' }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '-8px' }}>Utilizado caso sua loja exija integração direta de emissão de NF-e, opcional para exibição no catálogo.</p>
                </div>


              </form>
            </div>

            {/* ── Footer fixo — sempre visível independente do scroll ── */}
            <div style={{
              padding: '18px 32px',
              borderTop: '1px solid #E8E8E0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: '#FAFAF8',
              flexShrink: 0,
              borderRadius: '0 0 20px 20px'
            }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '12px 24px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: '#444' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isSaving}
                style={{ padding: '12px 32px', background: '#000', color: 'white', border: 'none', borderRadius: '10px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : (editingId ? 'Atualizar Produto' : 'Salvar Novo Produto')}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        {...confirmConfig}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  )
}
