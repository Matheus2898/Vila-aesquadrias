import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'
import { Plus, Edit2, Trash2, Image as ImageIcon, Check, Loader2, X, GripVertical, AlignLeft, AlignCenter, AlignRight, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import CustomDropdown from '../components/CustomDropdown'

export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: () => { } })

  // Formulário Modal
  const [formData, setFormData] = useState({
    image_url: '',
    badge_text: '',
    title_line1: '',
    title_highlight: '',
    subtitle: '',
    button_text: 'Saiba Mais',
    button_link: '/produtos',
    button_bg_color: '#ffed0c',
    button_text_color: '#000000',
    content_align: 'left',
    content_offset_x: 0,
    title_size: 75,
    is_active: true,
    order_index: 0
  })

  const [imageFile, setImageFile] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [isDragging, setIsDragging] = useState(false)



  async function fetchBanners() {
    setLoading(true)
    const { data, error } = await supabase
      .from('home_banners')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) {
      toast.error('Erro ao buscar banners: ' + error.message)
    } else {
      setBanners(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const initFetch = async () => {
      await fetchBanners()
    }
    initFetch()
  }, [])

  const handleOpenNew = () => {
    setFormData({
      image_url: '',
      badge_text: '',
      title_line1: '',
      title_highlight: '',
      subtitle: '',
      button_text: 'Ver Catálogo',
      button_link: '/produtos',
      button_bg_color: '#ffed0c',
      button_text_color: '#000000',
      content_align: 'left',
      content_offset_x: 0,
      title_size: 75,
      is_active: true,
      order_index: banners.length
    })
    setEditingId(null)
    setImageFile(null)
    setPreviewImage(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (banner) => {
    setFormData({
      image_url: banner.image_url || '',
      badge_text: banner.badge_text || '',
      title_line1: banner.title_line1 || '',
      title_highlight: banner.title_highlight || '',
      subtitle: banner.subtitle || '',
      button_text: banner.button_text || '',
      button_link: banner.button_link || '',
      button_bg_color: banner.button_bg_color || '#ffed0c',
      button_text_color: banner.button_text_color || '#000000',
      content_align: banner.content_align || 'left',
      content_offset_x: banner.content_offset_x || 0,
      title_size: banner.title_size || 75,
      is_active: banner.is_active,
      order_index: banner.order_index
    })
    setEditingId(banner.id)
    setImageFile(null)
    setPreviewImage(banner.image_url)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    setConfirmModal({
      show: true,
      title: 'Excluir Banner',
      message: 'Deseja realmente excluir este banner permanentemente?',
      onConfirm: async () => {
        const { error } = await supabase.from('home_banners').delete().eq('id', id)
        if (error) {
          toast.error('Erro ao excluir: ' + error.message)
        } else {
          toast.success('Banner excluído!')
          setBanners(banners.filter(b => b.id !== id))
        }
        setConfirmModal(prev => ({ ...prev, show: false }))
      }
    })
  }

  const handleToggleActive = async (id, currentStatus) => {
    const { error } = await supabase.from('home_banners').update({ is_active: !currentStatus }).eq('id', id)
    if (error) {
      toast.error('Erro ao atualizar status: ' + error.message)
    } else {
      setBanners(banners.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b))
    }
  }

  // Refs para Drag and Drop
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const handleDragStart = (e, index) => {
    dragItem.current = index
    e.dataTransfer.effectAllowed = 'move'
    // Tornar a linha semi-transparente ao arrastar
    setTimeout(() => {
      if (e.target) e.target.style.opacity = '0.4'
    }, 0)
  }

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index
  }

  const handleDragEnd = async (e) => {
    if (e.target) e.target.style.opacity = '1'

    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      dragItem.current = null
      dragOverItem.current = null
      return
    }

    const newBanners = [...banners]
    const draggedItemContent = newBanners.splice(dragItem.current, 1)[0]
    newBanners.splice(dragOverItem.current, 0, draggedItemContent)

    dragItem.current = null
    dragOverItem.current = null

    // Atualizar order_index localmente
    const updatedBanners = newBanners.map((b, i) => ({ ...b, order_index: i }))
    setBanners(updatedBanners)

    // Atualizar no banco fazendo loop de updates para não quebrar Constraints Not-Null do upsert
    try {
      const promises = updatedBanners.map(b =>
        supabase.from('home_banners').update({ order_index: b.order_index }).eq('id', b.id)
      )
      await Promise.all(promises)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao salvar nova ordem no banco.')
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('image/')) {
        setImageFile(file)
        setPreviewImage(URL.createObjectURL(file))
      } else {
        toast.error('O arquivo precisa ser uma imagem.')
      }
    }
  }

  const handleRemoveImage = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setImageFile(null)
    setPreviewImage(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
  }

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    let finalImageUrl = formData.image_url

    // Fazer upload de nova imagem se selecionada
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `banner-${Date.now()}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile)

      if (uploadError) {
        toast.error('Erro no upload: ' + uploadError.message)
        setIsSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName)

      finalImageUrl = publicUrlData.publicUrl
    }

    if (!finalImageUrl) {
      toast.error('Uma imagem é obrigatória!')
      setIsSaving(false)
      return
    }

    const payload = {
      ...formData,
      image_url: finalImageUrl
    }

    let error
    if (editingId) {
      const { error: updateError } = await supabase.from('home_banners').update(payload).eq('id', editingId)
      error = updateError
    } else {
      const { error: insertError } = await supabase.from('home_banners').insert([payload])
      error = insertError
    }

    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
    } else {
      toast.success('Banner salvo com sucesso!')
      setIsModalOpen(false)
      fetchBanners()
    }

    setIsSaving(false)
  }

  return (
    <div>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="t-h1" style={{ fontSize: window.innerWidth <= 768 ? '22px' : '32px' }}>Gestão de Banners</h1>
          <p style={{ color: '#666', fontSize: window.innerWidth <= 768 ? '13px' : '14px' }}>Gerencie o carrossel principal da página inicial.</p>
        </div>
        <button
          onClick={handleOpenNew}
          style={{
            background: 'var(--color-amber-500)', color: 'var(--color-navy-900)',
            padding: '12px 24px', borderRadius: '8px', border: 'none',
            fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
          }}>
          <Plus size={18} /> Novo Banner
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E8E8E0', overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: '#666' }} />
          </div>
        ) : banners.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#888' }}>
            Nenhum banner cadastrado. Clique em Novo Banner parar criar.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8E8E0', color: '#888', fontSize: '14px' }}>
                <th style={{ padding: '16px 20px', width: '60px' }}>Ordem</th>
                <th style={{ padding: '16px 20px', width: '120px' }}>Imagem</th>
                <th style={{ padding: '16px 20px' }}>Conteúdo Principal</th>
                <th style={{ padding: '16px 20px', width: '100px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '16px 20px', width: '120px', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b, index) => (
                <tr
                  key={b.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  style={{ borderBottom: '1px solid #E8E8E0', opacity: b.is_active ? 1 : 0.6, cursor: 'grab', backgroundColor: 'white' }}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <GripVertical size={20} color="#CBD5E1" />
                      <span style={{ fontWeight: 800, fontSize: '15px', color: '#64748B' }}>{index + 1}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ width: '100px', height: '56px', borderRadius: '4px', backgroundImage: `url("${b.image_url}")`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #DDD' }} />
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {b.badge_text && <div style={{ fontSize: '10px', fontWeight: 800, background: '#FFF7ED', color: '#C2410C', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>{b.badge_text}</div>}
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#111' }}>{b.title_line1} <span style={{ color: 'var(--color-amber-500)' }}>{b.title_highlight}</span></div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{b.subtitle ? (b.subtitle.length > 50 ? b.subtitle.substring(0, 50) + '...' : b.subtitle) : 'Sem subtítulo'}</div>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleActive(b.id, b.is_active)}
                      style={{ background: b.is_active ? '#ECFDF5' : '#F3F4F6', color: b.is_active ? '#15803D' : '#6B7280', padding: '6px 12px', border: 'none', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {b.is_active ? <><Check size={14} /> Ativo</> : 'Inativo'}
                    </button>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenEdit(b)} style={{ padding: '8px', background: '#F3F4F6', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#4B5563' }} title="Editar"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(b.id)} style={{ padding: '8px', background: '#FEF2F2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#B91C1C' }} title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            style={{ background: '#FFFFFF', padding: '32px 40px', borderRadius: '24px', width: '100%', maxWidth: '720px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            className="custom-scrollbar"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.5px' }}>{editingId ? 'Editar Banner' : 'Novo Banner'}</h2>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', background: formData.is_active ? '#ECFDF5' : '#F1F5F9', color: formData.is_active ? '#059669' : '#64748B', padding: '6px 12px', borderRadius: '999px', transition: 'all 0.2s', border: `1px solid ${formData.is_active ? '#A7F3D0' : '#E2E8F0'}` }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: formData.is_active ? '#10B981' : '#94A3B8' }} />
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} style={{ display: 'none' }} />
                  {formData.is_active ? 'ATIVO' : 'PAUSADO'}
                </label>
              </div>
              <button type="button" disabled={isSaving} onClick={() => setIsModalOpen(false)} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; }} onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px', color: '#475569' }}>Imagem de Fundo do Banner <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      height: '180px', width: '100%',
                      border: isDragging ? '2px dashed #3B82F6' : '2px dashed #CBD5E1',
                      borderRadius: '16px', cursor: 'pointer',
                      background: previewImage ? `url("${previewImage}") center/cover` : (isDragging ? '#EFF6FF' : '#F8FAFC'),
                      color: previewImage ? 'white' : '#64748B',
                      textShadow: previewImage ? '0 2px 4px rgba(0,0,0,0.8)' : 'none',
                      transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                    }}
                    onMouseEnter={e => { if (!previewImage && !isDragging) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#94A3B8'; } }}
                    onMouseLeave={e => { if (!previewImage && !isDragging) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; } }}
                  >
                    {previewImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />}
                    <ImageIcon size={isDragging ? 48 : 36} strokeWidth={1.5} style={{ marginBottom: '12px', opacity: previewImage ? 1 : 0.6, position: 'relative', zIndex: 2, transition: 'all 0.2s', color: isDragging ? '#3B82F6' : undefined }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, position: 'relative', zIndex: 2, color: isDragging ? '#3B82F6' : undefined }}>
                      {isDragging ? 'Solte a imagem aqui...' : (previewImage ? 'Clique ou arraste para trocar a imagem' : 'Arraste uma imagem ou clique para fazer upload')}
                    </span>
                    {!previewImage && !isDragging && <span style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px', fontWeight: 500 }}>Resolução ideal para não haver cortes: 1920x850px</span>}
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>

                  {previewImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title="Excluir imagem selecionada"
                      style={{
                        position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                        background: 'rgba(255, 255, 255, 0.95)', color: '#EF4444',
                        border: 'none', borderRadius: '50%', width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Tag Localizadora (Badge)</label>
                  <input type="text" value={formData.badge_text} onChange={e => setFormData({ ...formData, badge_text: e.target.value })} placeholder="Ex: LANÇAMENTOS PREMIUM" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', backgroundColor: '#F8FAFC', transition: 'border 0.2s', color: '#0F172A' }} onFocus={e => e.currentTarget.style.borderColor = '#94A3B8'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Texto Principal (Linha 1)</label>
                  <input type="text" value={formData.title_line1} onChange={e => setFormData({ ...formData, title_line1: e.target.value })} placeholder="Ex: Esquadrias a" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', backgroundColor: '#F8FAFC', transition: 'border 0.2s', color: '#0F172A' }} onFocus={e => e.currentTarget.style.borderColor = '#94A3B8'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Texto Destaque (Ficará logo abaixo do Texto Principal)</label>
                <input type="text" value={formData.title_highlight} onChange={e => setFormData({ ...formData, title_highlight: e.target.value })} placeholder="Ex: Pronta entrega" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '14px', backgroundColor: '#F8FAFC', transition: 'border 0.2s', color: '#0F172A' }} onFocus={e => e.currentTarget.style.borderColor = '#94A3B8'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Descrição / Subtítulo</label>
                <textarea value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} placeholder="Ex: Design patenteado com conforto térmico e acústico superior..." rows={3} style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', resize: 'vertical', fontSize: '14px', backgroundColor: '#F8FAFC', transition: 'border 0.2s', color: '#0F172A' }} onFocus={e => e.currentTarget.style.borderColor = '#94A3B8'} onBlur={e => e.currentTarget.style.borderColor = '#E2E8F0'} />
              </div>

              <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', marginTop: '8px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', marginBottom: '20px', letterSpacing: '1px' }}>Layout e Tipografia</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#475569' }}>Ancoragem Horizontal</label>
                    <CustomDropdown
                      value={formData.content_align}
                      onChange={val => setFormData({ ...formData, content_align: val })}
                      options={[
                        { value: 'left', label: 'Alinhar à Esquerda', icon: <AlignLeft size={16} /> },
                        { value: 'center', label: 'Centralizar Conteúdo', icon: <AlignCenter size={16} /> },
                        { value: 'right', label: 'Alinhar à Direita', icon: <AlignRight size={16} /> }
                      ]}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                      <span>Deslocamento (Gap Lateral)</span>
                      <span style={{ fontWeight: 700, color: '#3B82F6' }}>{formData.content_offset_x}%</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '42px' }}>
                      <span style={{ fontSize: '20px', color: '#94A3B8', fontWeight: 'bold' }}>-</span>
                      <input type="range" min="-50" max="50" value={formData.content_offset_x} onChange={e => setFormData({ ...formData, content_offset_x: Number(e.target.value) })} style={{ flex: 1, accentColor: '#3B82F6', cursor: 'pointer' }} title="Valores negativos empurram para fora (esquerda/direita), positivos empurram para dentro." />
                      <span style={{ fontSize: '20px', color: '#94A3B8', fontWeight: 'bold' }}>+</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#475569' }}>
                    <span>Tamanho Máximo do Título (Pixels)</span>
                    <span style={{ fontWeight: 700, color: '#3B82F6' }}>{formData.title_size}px</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '32px' }}>
                    <input type="range" min="40" max="130" value={formData.title_size} onChange={e => setFormData({ ...formData, title_size: Number(e.target.value) })} style={{ flex: 1, accentColor: '#3B82F6', cursor: 'pointer' }} />
                  </div>
                  <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>O texto será redimensionado automaticamente no celular para não quebrar a tela.</p>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', marginTop: '0px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', marginBottom: '20px', letterSpacing: '1px' }}>Call to Action (Botão)</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#475569' }}>Texto do Botão</label>
                    <input type="text" value={formData.button_text} onChange={e => setFormData({ ...formData, button_text: e.target.value })} placeholder="Ex: Explorar Linha" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', color: '#0F172A' }} onFocus={e => e.currentTarget.style.borderColor = '#94A3B8'} onBlur={e => e.currentTarget.style.borderColor = '#CBD5E1'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 500, color: '#475569' }}>Link de Destino</label>
                    <input type="text" value={formData.button_link} onChange={e => setFormData({ ...formData, button_link: e.target.value })} placeholder="Ex: /produtos" style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px', color: '#0F172A' }} onFocus={e => e.currentTarget.style.borderColor = '#94A3B8'} onBlur={e => e.currentTarget.style.borderColor = '#CBD5E1'} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '32px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Cor de Fundo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <input type="color" value={formData.button_bg_color} onChange={e => setFormData({ ...formData, button_bg_color: e.target.value })} style={{ width: '150%', height: '150%', border: 'none', padding: 0, cursor: 'pointer', outline: 'none', background: 'none' }} />
                      </label>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, fontFamily: 'monospace' }}>{formData.button_bg_color.toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>Cor do Texto</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <input type="color" value={formData.button_text_color} onChange={e => setFormData({ ...formData, button_text_color: e.target.value })} style={{ width: '150%', height: '150%', border: 'none', padding: 0, cursor: 'pointer', outline: 'none', background: 'none' }} />
                      </label>
                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500, fontFamily: 'monospace' }}>{formData.button_text_color.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid #F1F5F9' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '14px 28px', borderRadius: '12px', border: '1px solid #CBD5E1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }} onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="btn-ds" style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px', justifyContent: 'center', background: '#0F172A', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: isSaving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }} onMouseEnter={e => { if (!isSaving) e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'; }}>
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (editingId ? 'Salvar Alterações' : 'Criar Banner')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* Confirm Modal Custom */}
      {confirmModal.show && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 120000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px', color: 'var(--color-navy-900)' }}>{confirmModal.title}</h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
