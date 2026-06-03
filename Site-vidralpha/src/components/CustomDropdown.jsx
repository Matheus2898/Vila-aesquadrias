import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomDropdown Premium
 * @param {string|object} value - O valor selecionado
 * @param {Array} options - Array de strings ou objetos { value: string, label: string, icon?: ReactNode }
 * @param {function} onChange - Callback ao selecionar
 * @param {string} placeholder - Texto caso não haja seleção
 * @param {string} label - Rótulo opcional
 * @param {boolean} fullWidth - Se deve ocupar 100% (padrão true)
 */
export default function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = 'Selecione...',
  label,
  fullWidth = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      const isInsideWrapper = wrapperRef.current && wrapperRef.current.contains(event.target);
      const isInsideList = listRef.current && listRef.current.contains(event.target);

      if (!isInsideWrapper && !isInsideList) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normalizar opções para sempre serem objetos { value, label, icon }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return opt;
  });

  // Encontrar o item selecionado para exibir o label correto
  const selectedItem = normalizedOptions.find(opt => opt.value === value);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#444', marginBottom: '8px' }}>
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '10px',
          border: isOpen ? '2px solid var(--color-navy-900)' : '1px solid #E2E8F0',
          background: 'white',
          color: value ? '#0F172A' : '#94A3B8',
          fontSize: '14px',
          fontWeight: value ? 600 : 500,
          outline: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 0 4px rgba(30,36,160,0.08)' : '0 1px 2px rgba(0,0,0,0.05)',
          textAlign: 'left'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {selectedItem?.icon && <span style={{ flexShrink: 0 }}>{selectedItem.icon}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedItem ? selectedItem.label : placeholder}
          </span>
        </span>

        <ChevronDown size={18} color="#94A3B8" style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.3s ease',
          flexShrink: 0
        }} />
      </button>

      {isOpen && createPortal(
        <ul
          ref={listRef}
          className="hide-scrollbar"
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: `${coords.top + 8}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            background: 'white',
            border: '1.5px solid #F1F5F9',
            borderRadius: '14px',
            boxShadow: '0 20px 48px rgba(0,0,0,0.18)',
            zIndex: 100000,
            listStyle: 'none',
            padding: '8px',
            margin: 0,
            maxHeight: '260px',
            overflowY: 'auto',
            animation: 'dropdownIn 0.2s ease-out',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'auto'
          }}>
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  background: isSelected ? 'var(--color-navy-900)' : 'transparent',
                  color: isSelected ? 'white' : '#334155',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '14px',
                  marginBottom: '2px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.color = '#000';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#334155';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {opt.icon && <span style={{ opacity: isSelected ? 1 : 0.7 }}>{opt.icon}</span>}
                  {opt.label}
                </div>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </li>
            );
          })}
          {normalizedOptions.length === 0 && (
            <li style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
              Nenhuma opção disponível
            </li>
          )}
        </ul>,
        document.body
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
