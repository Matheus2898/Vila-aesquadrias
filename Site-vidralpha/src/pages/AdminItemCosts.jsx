import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import {
    Save, Loader2, CheckCircle2, DollarSign, ChevronDown, ChevronRight,
    Plus, Palette, Layers, X, Trash2, Check, Pipette, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../components/ConfirmModal'
import AdminCostsItemsTab from '../components/Admin/AdminCostsItemsTab'
import AdminCostsGlassTab from '../components/Admin/AdminCostsGlassTab'
import AdminCostsAluminumTab from '../components/Admin/AdminCostsAluminumTab'
import { NewLineModal, LineModal } from '../components/Admin/ItemsModals'
import { NewGlassTypeModal, GlassModal, SelectingColorsModal } from '../components/Admin/GlassModals'
import { GlobalColorsModal, GlobalAlumColorsModal } from '../components/Admin/GlobalModals'
import { AluminumModal, SelectingAlumColorsModal } from '../components/Admin/AluminumModals'

export default function AdminItemCosts() {
    const { profile, user } = useAuth()

    const [activeTab, setActiveTab] = useState('items')
    const [lines, setLines] = useState([])
    const [structure, setStructure] = useState({})
    const [glassTypesList, setGlassTypesList] = useState([])
    const [itemLoading, setItemLoading] = useState(true)
    const [glassLoading, setGlassLoading] = useState(true)
    const [costs, setCosts] = useState({})
    const [isCreatingLine, setIsCreatingLine] = useState(false)
    const [isCreatingGlassType, setIsCreatingGlassType] = useState(false)
    const [activeColorsByThick, setActiveColorsByThick] = useState({})
    const [selectingColorsFor, setSelectingColorsFor] = useState(null)
    const [showNewLineModal, setShowNewLineModal] = useState(false)
    const [showNewMeasureModal, setShowNewMeasureModal] = useState(null)
    const [showNewGlassTypeModal, setShowNewGlassTypeModal] = useState(false)
    const [newMeasureW, setNewMeasureW] = useState('')
    const [newMeasureH, setNewMeasureH] = useState('')
    const [newGlassTypeName, setNewGlassTypeName] = useState('')
    const [newGlassThickInput, setNewGlassThickInput] = useState('')
    const [newGlassThicknesses, setNewGlassThicknesses] = useState([])
    const [newLineName, setNewLineName] = useState('')
    const [newLineTipoVenda, setNewLineTipoVenda] = useState('medida')
    const [newLineCatName, setNewLineCatName] = useState('')
    const [newLineCats, setNewLineCats] = useState([])
    const [newLineMeasureInputs, setNewLineMeasureInputs] = useState({})
    const [activeLineModal, setActiveLineModal] = useState(null)
    const [newLineType, setNewLineType] = useState('esquadria')
    const [newLineAccessoryType, setNewLineAccessoryType] = useState('Nenhum')
    const [showNewCatInlineModal, setShowNewCatInlineModal] = useState(false)
    const [newCatInlineName, setNewCatInlineName] = useState('')
    const [pendingModalCosts, setPendingModalCosts] = useState({})
    const [isSavingModal, setIsSavingModal] = useState(false)
    const [glassTypeCosts, setGlassTypeCosts] = useState({})
    const [activeGlassModal, setActiveGlassModal] = useState(null)
    const [pendingGlassCosts, setPendingGlassCosts] = useState({})
    const [isSavingGlassModal, setIsSavingGlassModal] = useState(false)
    const [colors, setColors] = useState([])
    const [colorCosts, setColorCosts] = useState({})
    const [newColorName, setNewColorName] = useState('')
    const [newColorHex, setNewColorHex] = useState('#CCCCCC')
    const [addingColor, setAddingColor] = useState(false)
    const [showNewGlassThickModal, setShowNewGlassThickModal] = useState(false)
    const [newGlassThickValue, setNewGlassThickValue] = useState('')
    const [showGlobalColorsModal, setShowGlobalColorsModal] = useState(false)
    const globalColorsModalBodyRef = useRef(null)
    const [alumColors, setAlumColors] = useState([])
    const [alumColorCosts, setAlumColorCosts] = useState({})
    const [newAlumColorName, setNewAlumColorName] = useState('')
    const [newAlumColorHex, setNewAlumColorHex] = useState('#704214')
    const [addingAlumColor, setAddingAlumColor] = useState(false)
    const [showAlumColorsModal, setShowAlumColorsModal] = useState(false)
    const [alumLoading, setAlumLoading] = useState(true)
    const [pendingAlumCosts, setPendingAlumCosts] = useState({})
    const [isSavingAlumModal, setIsSavingAlumModal] = useState(false)
    const [selectingAlumColorsFor, setSelectingAlumColorsFor] = useState(null)
    const [activeAlumColorsByKey, setActiveAlumColorsByKey] = useState({})
    const globalAlumColorsModalBodyRef = useRef(null)
    const [activeAlumLine, setActiveAlumLine] = useState(null)
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false })

    useEffect(() => {
        const fetch = async () => {
            setItemLoading(true)
            const [{ data: objCosts }, { data: objLines }] = await Promise.all([
                supabase.from('item_costs').select('*'),
                supabase.from('product_lines').select('name')
            ])
            const map = {}; const foundLines = new Set(); const foundStructureMap = {}
            if (objCosts) {
                objCosts.forEach(r => {
                    map[`${r.line}|${r.category}|${r.measure}`] = r.cost; foundLines.add(r.line)
                    if (!foundStructureMap[r.line]) foundStructureMap[r.line] = {}
                    if (!foundStructureMap[r.line][r.category]) foundStructureMap[r.line][r.category] = new Set()
                    foundStructureMap[r.line][r.category].add(r.measure)
                })
            }
            if (objLines) {
                objLines.forEach(r => foundLines.add(r.name))
            }
            setCosts(map); setLines(Array.from(foundLines).sort())
            const finalStructure = {}
            Object.entries(foundStructureMap).forEach(([line, catMap]) => {
                finalStructure[line] = Object.entries(catMap)
                    .map(([category, measSet]) => ({ category, measures: Array.from(measSet).sort() }))
                    .sort((a, b) => a.category.localeCompare(b.category))
            })
            setStructure(finalStructure)
            setItemLoading(false)
        }
        fetch()
    }, [])

    const fetchGlassData = useCallback(async () => {
        setGlassLoading(true)
        const [typeCostsRes, colorsRes, colorCostsRes] = await Promise.all([
            supabase.from('glass_type_costs').select('*'),
            supabase.from('glass_colors').select('*').order('name'),
            supabase.from('glass_color_costs').select('*'),
        ])
        if (typeCostsRes.data) {
            const map = {}; const typesMap = {}
            typeCostsRes.data.forEach(r => {
                map[`${r.glass_type}|${r.thickness}`] = r.cost_per_m2
                if (!typesMap[r.glass_type]) typesMap[r.glass_type] = []
                if (!typesMap[r.glass_type].includes(r.thickness)) typesMap[r.glass_type].push(r.thickness)
            })
            setGlassTypeCosts(map); setGlassTypesList(Object.entries(typesMap).map(([type, thicknesses]) => ({ type, thicknesses })))
        }
        if (colorsRes.data) setColors(colorsRes.data)
        if (colorCostsRes.data) {
            const map = {}; const activeMap = {}
            colorCostsRes.data.forEach(r => {
                const key = `${r.glass_type}|${r.thickness}`; map[`${key}|${r.color_name}`] = r.cost_per_m2
                if (!activeMap[key]) activeMap[key] = []; if (!activeMap[key].includes(r.color_name)) activeMap[key].push(r.color_name)
            })
            setColorCosts(map); setActiveColorsByThick(activeMap)
        }
        setGlassLoading(false)
    }, [])

    useEffect(() => { fetchGlassData() }, [fetchGlassData])

    const fetchAluminumData = useCallback(async () => {
        setAlumLoading(true)
        try {
            const [colorsRes, costsRes] = await Promise.all([
                supabase.from('aluminum_colors').select('*').order('name'),
                supabase.from('aluminum_color_costs').select('*'),
            ])
            if (colorsRes.data) setAlumColors(colorsRes.data)
            if (costsRes.data) {
                const map = {}; const activeMap = {}
                costsRes.data.forEach(r => {
                    const key = `${r.line}|${r.category}`; map[`${key}|${r.color_name}`] = r.cost_per_unit
                    if (!activeMap[key]) activeMap[key] = []; if (!activeMap[key].includes(r.color_name)) activeMap[key].push(r.color_name)
                })
                setAlumColorCosts(map); setActiveAlumColorsByKey(activeMap)
            }
        } catch (err) { console.error(err) } finally { setAlumLoading(false) }
    }, [])

    useEffect(() => { fetchAluminumData() }, [fetchAluminumData])

    useEffect(() => {
        const channel = supabase.channel('admin_costs_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'item_costs' }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const r = payload.new; setCosts(prev => ({ ...prev, [`${r.line}|${r.category}|${r.measure}`]: r.cost }))
                    setStructure(prev => {
                        const newStructure = { ...prev };
                        if (!newStructure[r.line]) newStructure[r.line] = [];
                        else newStructure[r.line] = [...newStructure[r.line]];

                        const lineCats = newStructure[r.line];
                        const catIdx = lineCats.findIndex(c => c.category === r.category);

                        if (catIdx === -1) {
                            lineCats.push({ category: r.category, measures: [r.measure] });
                        } else {
                            const updatedCat = { ...lineCats[catIdx] };
                            updatedCat.measures = [...updatedCat.measures];
                            if (!updatedCat.measures.includes(r.measure)) {
                                updatedCat.measures.push(r.measure);
                                updatedCat.measures.sort();
                            }
                            lineCats[catIdx] = updatedCat;
                        }
                        return newStructure;
                    })
                } else if (payload.eventType === 'DELETE') {
                    const r = payload.old
                    if (r.line && r.category && r.measure) {
                        const key = `${r.line}|${r.category}|${r.measure}`;
                        setCosts(prev => { const next = { ...prev }; delete next[key]; return next })
                        setStructure(prev => {
                            const newStructure = { ...prev };
                            if (newStructure[r.line]) {
                                newStructure[r.line] = newStructure[r.line].map(cat => {
                                    if (cat.category === r.category) {
                                        return { ...cat, measures: cat.measures.filter(m => m !== r.measure) };
                                    }
                                    return cat;
                                }).filter(cat => cat.measures.length > 0);
                            }
                            return newStructure;
                        });
                    } else {
                        console.warn('Realtime DELETE received but fields missing (Line/Cat/Measure). Check REPLICA IDENTITY FULL.', r);
                    }
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'glass_type_costs' }, (payload) => {
                const r = payload.eventType === 'DELETE' ? payload.old : payload.new; const key = `${r.glass_type}|${r.thickness}`
                if (payload.eventType === 'DELETE') setGlassTypeCosts(prev => { const n = { ...prev }; delete n[key]; return n })
                else setGlassTypeCosts(prev => ({ ...prev, [key]: r.cost_per_m2 }))
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'glass_color_costs' }, (payload) => {
                const r = payload.eventType === 'DELETE' ? payload.old : payload.new; const key = `${r.glass_type}|${r.thickness}`; const fullKey = `${key}|${r.color_name}`
                if (payload.eventType === 'DELETE') {
                    setColorCosts(prev => { const n = { ...prev }; delete n[fullKey]; return n }); setActiveColorsByThick(prev => ({ ...prev, [key]: (prev[key] || []).filter(c => c !== r.color_name) }))
                } else {
                    setColorCosts(prev => ({ ...prev, [fullKey]: r.cost_per_m2 }))
                    setActiveColorsByThick(prev => { const current = prev[key] || []; if (!current.includes(r.color_name)) return { ...prev, [key]: [...current, r.color_name] }; return prev })
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'glass_colors' }, (payload) => {
                const r = payload.eventType === 'DELETE' ? payload.old : payload.new
                if (payload.eventType === 'INSERT') setColors(prev => [...prev, r].sort((a, b) => a.name.localeCompare(b.name)))
                else if (payload.eventType === 'UPDATE') setColors(prev => prev.map(c => c.id === r.id ? r : c))
                else if (payload.eventType === 'DELETE') setColors(prev => prev.filter(c => c.name !== r.name))
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const handleAddColor = async () => {
        if (!newColorName.trim()) return; setAddingColor(true)
        const { error } = await supabase.from('glass_colors').insert([{ name: newColorName.trim(), hex_code: newColorHex }])
        if (error) toast.error('Erro ao adicionar cor: ' + error.message); else { setNewColorName(''); setNewColorHex('#CCCCCC') }; setAddingColor(false)
    }
    const handleDeleteColor = async (name) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Excluir Cor',
            message: `Deseja realmente excluir a cor "${name}"?`,
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('glass_colors').delete().eq('name', name);
                if (error) toast.error('Erro ao excluir cor: ' + error.message);
                else toast.success('Cor excluída com sucesso!');
            }
        });
    }
    const handleAddAlumColor = async () => {
        if (!newAlumColorName.trim()) return; setAddingAlumColor(true)
        const { error } = await supabase.from('aluminum_colors').insert([{ name: newAlumColorName.trim(), hex_code: newAlumColorHex }])
        if (error) toast.error('Erro ao adicionar cor: ' + error.message); else { setNewAlumColorName(''); setNewAlumColorHex('#704214'); fetchAluminumData() }; setAddingAlumColor(false)
    }
    const handleDeleteAlumColor = async (name) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Excluir Cor de Alumínio',
            message: `Deseja realmente excluir a cor "${name}"?`,
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('aluminum_colors').delete().eq('name', name);
                if (error) toast.error('Erro ao excluir cor: ' + error.message);
                else {
                    toast.success('Cor excluída com sucesso!');
                    fetchAluminumData();
                }
            }
        });
    }
    const handleBatchSaveCosts = async () => {
        const updates = Object.entries(pendingModalCosts).map(([key, cost]) => {
            const [line, category, measure] = key.split('|');
            return { line, category, measure, cost }
        });

        if (updates.length === 0) {
            toast.success('Alterações concluídas!');
            setActiveLineModal(null);
            return;
        }

        setIsSavingModal(true);
        const savePromise = (async () => {
            const { error } = await supabase.from('item_costs').upsert(updates, { onConflict: 'line,category,measure' });
            if (error) throw error;

            setCosts(prev => ({ ...prev, ...pendingModalCosts }));
            setPendingModalCosts({});
            setIsSavingModal(false);
            setActiveLineModal(null);
            return 'Custos salvos com sucesso!';
        })();

        toast.promise(savePromise, {
            loading: 'Salvando alterações...',
            success: (msg) => msg,
            error: (err) => {
                setIsSavingModal(false);
                return 'Erro ao salvar: ' + err.message;
            }
        });
    }
    const handleBatchSaveGlassCosts = async () => {
        setIsSavingGlassModal(true);
        const updatesType = [];
        const updatesColor = [];

        Object.entries(pendingGlassCosts).forEach(([key, cost]) => {
            const parts = key.split('|');
            if (parts.length === 2) updatesType.push({ glass_type: parts[0], thickness: parts[1], cost_per_m2: cost });
            else updatesColor.push({ glass_type: parts[0], thickness: parts[1], color_name: parts[2], cost_per_m2: cost });
        });

        const saveAction = async () => {
            if (updatesType.length > 0) {
                const { error } = await supabase.from('glass_type_costs').upsert(updatesType, { onConflict: 'glass_type,thickness' });
                if (error) throw error;
            }
            if (updatesColor.length > 0) {
                const { error } = await supabase.from('glass_color_costs').upsert(updatesColor, { onConflict: 'glass_type,thickness,color_name' });
                if (error) throw error;
            }
        };

        toast.promise(saveAction(), {
            loading: 'Salvando custos de vidro...',
            success: () => {
                setPendingGlassCosts({});
                setIsSavingGlassModal(false);
                fetchGlassData();
                setActiveGlassModal(null);
                return 'Custos de vidro salvos!';
            },
            error: (err) => {
                setIsSavingGlassModal(false);
                return 'Erro ao salvar: ' + err.message;
            }
        });
    }
    const handleBatchSaveAlumCosts = async () => {
        const updates = Object.entries(pendingAlumCosts).map(([key, cost]) => {
            const [line, category, color_name] = key.split('|');
            return { line, category, color_name, cost_per_unit: cost }
        });

        if (updates.length === 0) {
            setActiveAlumLine(null);
            return;
        }

        setIsSavingAlumModal(true);
        const savePromise = supabase.from('aluminum_color_costs').upsert(updates, { onConflict: 'line,category,color_name' });

        toast.promise(savePromise, {
            loading: 'Salvando custos de alumínio...',
            success: (res) => {
                if (res.error) throw res.error;
                setAlumColorCosts(prev => ({ ...prev, ...pendingAlumCosts }));
                setPendingAlumCosts({});
                setIsSavingAlumModal(false);
                setActiveAlumLine(null);
                return 'Custos de alumínio salvos!';
            },
            error: (err) => {
                setIsSavingAlumModal(false);
                return 'Erro ao salvar: ' + err.message;
            }
        });
    }
    const handleCloseGlassModal = () => {
        if (Object.keys(pendingGlassCosts).length > 0) {
            setConfirmConfig({
                isOpen: true,
                title: 'Descartar Alterações',
                message: 'Existem alterações não salvas. Deseja descartar?',
                type: 'warning',
                onConfirm: () => {
                    setActiveGlassModal(null);
                    setPendingGlassCosts({});
                }
            });
        } else {
            setActiveGlassModal(null);
            setPendingGlassCosts({});
        }
    }
    const handleAddGlassThick = async () => {
        if (!newGlassThickValue.trim() || !activeGlassModal) return;
        const thick = newGlassThickValue.trim();
        const { error } = await supabase.from('glass_type_costs').insert([{ glass_type: activeGlassModal, thickness: thick, cost_per_m2: 0 }]);
        if (error) toast.error('Erro ao adicionar espessura: ' + error.message);
        else {
            setNewGlassThickValue('');
            setShowNewGlassThickModal(false);
            toast.success('Espessura adicionada!');
            fetchGlassData();
        }
    }
    const handleDeleteThickness = async (thick) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Excluir Espessura',
            message: `Excluir a espessura ${thick}?`,
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('glass_type_costs').delete().eq('glass_type', activeGlassModal).eq('thickness', thick);
                if (error) toast.error('Erro ao excluir espessura: ' + error.message);
                else {
                    toast.success('Espessura excluída!');
                    fetchGlassData();
                }
            }
        });
    }
    const handleDeleteColorCost = async (type, thick, color) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Remover Cor',
            message: `Remover a cor ${color}?`,
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('glass_color_costs').delete().eq('glass_type', type).eq('thickness', thick).eq('color_name', color);
                if (error) toast.error('Erro ao remover cor: ' + error.message);
                else {
                    toast.success('Cor removida!');
                    fetchGlassData();
                }
            }
        });
    }
    const addGlassType = async () => { if (!newGlassTypeName.trim() || newGlassThicknesses.length === 0) return; setIsCreatingGlassType(true); const inserts = newGlassThicknesses.map(thick => ({ glass_type: newGlassTypeName.trim(), thickness: thick, cost_per_m2: 0 })); const { error } = await supabase.from('glass_type_costs').insert(inserts); if (error) toast.error('Erro ao criar tipo de vidro: ' + error.message); else { setNewGlassTypeName(''); setNewGlassThicknesses([]); setShowNewGlassTypeModal(false); fetchGlassData() }; setIsCreatingGlassType(false) }
    const handleGlassModalAddThick = () => { if (newGlassThickInput.trim() && !newGlassThicknesses.includes(newGlassThickInput.trim())) setNewGlassThicknesses(prev => [...prev, newGlassThickInput.trim()]); setNewGlassThickInput('') }
    const handleGlassModalRemoveThick = (t) => { setNewGlassThicknesses(prev => prev.filter(x => x !== t)) }
    const removeLine = async (lineName) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Excluir Linha',
            message: `Deseja realmente excluir a linha "${lineName}"? Esta ação removerá todos os custos associados.`,
            type: 'danger',
            onConfirm: async () => {
                const { error: err1 } = await supabase.from('item_costs').delete().eq('line', lineName);
                const { error: err2 } = await supabase.from('product_lines').delete().eq('name', lineName);
                if (err1 || err2) toast.error('Erro ao excluir linha: ' + ((err1 || err2).message));
                else {
                    setLines(prev => prev.filter(l => l !== lineName));
                    toast.success('Linha excluída com sucesso!');
                }
            }
        });
    }
    const handleDeleteCategory = async (line, category) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Excluir Categoria',
            message: `Tem certeza que deseja excluir toda a categoria "${category}" e todas as suas medidas?`,
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('item_costs').delete().eq('line', line).eq('category', category);
                if (error) toast.error('Erro ao excluir categoria: ' + error.message);
                else {
                    toast.success('Categoria excluída!');
                    // Backup manual update in case Realtime is slow
                    setStructure(prev => {
                        const next = { ...prev };
                        if (next[line]) {
                            next[line] = next[line].filter(c => c.category !== category);
                        }
                        return next;
                    });
                    setCosts(prev => {
                        const next = { ...prev };
                        Object.keys(next).forEach(key => {
                            if (key.startsWith(`${line}|${category}|`)) delete next[key];
                        });
                        return next;
                    });
                }
            }
        });
    }

    const handleAddInlineCat = async () => {
        if (!newCatInlineName.trim() || !activeLineModal) return;
        const line = activeLineModal;
        const category = newCatInlineName.trim();

        // Check if category already exists in this line (local check first)
        const lineStructure = structure[line] || [];
        if (lineStructure.find(c => c.category.toLowerCase() === category.toLowerCase())) {
            toast.error('Esta categoria já existe nesta linha!');
            return;
        }

        const { error } = await supabase.from('item_costs').insert([{ line, category, measure: 'Padrão', cost: 0 }]);

        if (error) {
            if (error.code === '23505') {
                toast.error('Esta categoria já existe nesta linha!');
            } else {
                toast.error('Erro ao adicionar categoria: ' + error.message);
            }
        } else {
            toast.success('Categoria adicionada!');
            setNewCatInlineName('');
            setShowNewCatInlineModal(false);
            // Manual backup update
            setStructure(prev => {
                const next = { ...prev };
                if (next[line]) {
                    if (!next[line].find(c => c.category === category)) {
                        const updated = [...next[line], { category, measures: ['Padrão'] }];
                        next[line] = updated.sort((a, b) => a.category.localeCompare(b.category));
                    }
                }
                return next;
            });
            setCosts(prev => ({ ...prev, [`${line}|${category}|Padrão`]: 0 }));
        }
    }
    const addMeasure = async (category) => {
        if (!newMeasureW || !newMeasureH || !activeLineModal) return;
        const line = activeLineModal;
        const measure = `${newMeasureW}X${newMeasureH}`;
        const { error } = await supabase.from('item_costs').insert([{ line, category, measure, cost: 0 }]);
        if (error) toast.error('Erro ao adicionar medida: ' + error.message);
        else {
            toast.success('Medida adicionada!');
            setNewMeasureW('');
            setNewMeasureH('');
            setShowNewMeasureModal(null);
            // Manual backup update
            setStructure(prev => {
                const next = { ...prev };
                if (next[line]) {
                    next[line] = next[line].map(c => {
                        if (c.category === category && !c.measures.includes(measure)) {
                            return { ...c, measures: [...c.measures, measure] };
                        }
                        return c;
                    });
                }
                return next;
            });
            setCosts(prev => ({ ...prev, [`${line}|${category}|${measure}`]: 0 }));
        }
    }
    const removeMeasure = async (category, measure) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Excluir Medida',
            message: `Excluir a medida ${measure}?`,
            type: 'danger',
            onConfirm: async () => {
                const { error } = await supabase.from('item_costs').delete().eq('line', activeLineModal).eq('category', category).eq('measure', measure);
                if (error) toast.error('Erro ao excluir medida: ' + error.message);
                else {
                    toast.success('Medida removida!');
                    // Manual backup for UI responsiveness
                    const line = activeLineModal;
                    setStructure(prev => {
                        const next = { ...prev };
                        if (next[line]) {
                            next[line] = next[line].map(c => {
                                if (c.category === category) {
                                    return { ...c, measures: c.measures.filter(m => m !== measure) };
                                }
                                return c;
                            }).filter(c => c.measures.length > 0);
                        }
                        return next;
                    });
                    const key = `${line}|${category}|${measure}`;
                    setCosts(prev => { const next = { ...prev }; delete next[key]; return next; });
                }
            }
        });
    }
    const handleModalAddCat = () => { if (newLineCatName.trim()) { setNewLineCats(prev => [...prev, { targetLine: newLineName, category: newLineCatName.trim(), measures: [] }]); setNewLineCatName('') } }
    const handleModalRemoveCat = (line, cat) => { setNewLineCats(prev => prev.filter(c => c.category !== cat)) }
    const handleModalAddMeasure = (line, cat) => { const key = `${line}|${cat}`; const val = newLineMeasureInputs[key]; if (val) { setNewLineCats(prev => prev.map(c => c.category === cat ? { ...c, measures: [...c.measures, val] } : c)); setNewLineMeasureInputs(prev => ({ ...prev, [key]: '' })) } }
    const handleModalRemoveMeasure = (line, cat, m) => { setNewLineCats(prev => prev.map(c => c.category === cat ? { ...c, measures: c.measures.filter(x => x !== m) } : c)) }
    const handleModalSubmit = async () => {
        setIsCreatingLine(true);

        const { error: lineError } = await supabase.from('product_lines').insert([{
            name: newLineName.trim(),
            line_type: newLineType,
            is_accessory: newLineType === 'acessorio', // backward config for old db structure if any
            accessory_type: newLineType === 'acessorio' ? newLineAccessoryType : null
        }]);

        if (lineError && lineError.code !== '23505') { // ignore unique constraint if it exists
            toast.error('Erro ao criar linha (metadata): ' + lineError.message);
            setIsCreatingLine(false);
            return;
        }

        if (newLineType === 'esquadria') {
            const inserts = [];
            newLineCats.forEach(c => {
                if (c.measures.length > 0) c.measures.forEach(m => inserts.push({ line: newLineName, category: c.category, measure: m, cost: 0 }));
                else inserts.push({ line: newLineName, category: c.category, measure: 'Padrão', cost: 0 })
            });
            const { error } = await supabase.from('item_costs').insert(inserts);
            if (error) toast.error('Erro ao criar linha em custos: ' + error.message);
            else {
                setLines(prev => {
                    const newName = newLineName.trim();
                    if (!prev.includes(newName)) return [...prev, newName].sort();
                    return prev;
                });
                setShowNewLineModal(false);
                setNewLineName('');
                setNewLineCats([]);
                setNewLineType('esquadria');
                setNewLineAccessoryType('Nenhum');
            };
        } else {
            setLines(prev => {
                const newName = newLineName.trim();
                if (!prev.includes(newName)) return [...prev, newName].sort();
                return prev;
            });
            setShowNewLineModal(false);
            setNewLineName('');
            setNewLineCats([]);
            setNewLineType('esquadria');
            setNewLineAccessoryType('Nenhum');
        }
        setIsCreatingLine(false)
    }
    const handleCloseLineModal = () => {
        if (Object.keys(pendingModalCosts).length > 0) {
            setConfirmConfig({
                isOpen: true,
                title: 'Descartar Alterações',
                message: 'Deseja descartar as alterações não salvas?',
                type: 'warning',
                onConfirm: () => {
                    setActiveLineModal(null);
                    setPendingModalCosts({});
                }
            });
            return;
        }
        setActiveLineModal(null);
        setPendingModalCosts({});
    }
    const handleCloseAlumModal = () => {
        if (Object.keys(pendingAlumCosts).length > 0) {
            setConfirmConfig({
                isOpen: true,
                title: 'Descartar Alterações',
                message: 'Deseja descartar as alterações não salvas?',
                type: 'warning',
                onConfirm: () => {
                    setActiveAlumLine(null);
                    setPendingAlumCosts({});
                }
            });
            return;
        }
        setActiveAlumLine(null);
        setPendingAlumCosts({});
    }

    const isAdmin = profile?.role === 'admin' || user?.user_metadata?.role === 'admin' || user?.email === 'matheusmatos2898@gmail.com'
    if (!isAdmin) return <div style={{ padding: '40px', textAlign: 'center' }}><h1>Acesso Negado</h1></div>

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--color-amber-500) 0%, #F59E0B 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}><DollarSign size={22} color="var(--color-navy-900)" /></div>
                <div><h1 className="t-h1" style={{ fontSize: '28px', marginBottom: '4px' }}>Custo dos Itens</h1><p style={{ color: '#666', fontSize: '14px' }}>Defina custos por medida, tipo e cor de vidro.</p></div>
            </div>
            <style>{`
                .admin-costs-actions {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 28px;
                    gap: 16px;
                }
                @media (max-width: 768px) {
                    .admin-costs-actions {
                        flex-direction: column-reverse;
                        align-items: stretch;
                    }
                    .admin-costs-tabs {
                        overflow-x: auto;
                        width: 100% !important;
                        justify-content: flex-start;
                    }
                    .admin-costs-actions > button {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
            <div className="admin-costs-actions">
                <div className="admin-costs-tabs" style={{ display: 'flex', gap: '4px', background: 'white', padding: '6px', borderRadius: '12px', border: '1px solid #E8E8E0', width: 'fit-content' }}>
                    {[{ id: 'items', label: 'Produtos / Medidas', icon: Layers }, { id: 'glass', label: 'Vidros e Cores', icon: Palette }, { id: 'aluminum', label: 'Perfis de Alumínio', icon: Pipette }].map(tab => { const Icon = tab.icon; const active = activeTab === tab.id; return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: active ? 700 : 500, background: active ? 'var(--color-navy-900)' : 'transparent', color: active ? 'var(--color-amber-500)' : '#666', transition: 'all 0.2s', whiteSpace: 'nowrap' }}><Icon size={16} /> {tab.label}</button>) })}
                </div>
                {activeTab === 'items' && <button onClick={() => setShowNewLineModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--color-navy-900)', color: 'var(--color-amber-500)', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}><Plus size={18} /> Nova Linha</button>}
                {activeTab === 'glass' && <button onClick={() => setShowNewGlassTypeModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--color-navy-900)', color: 'var(--color-amber-500)', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}><Plus size={18} /> Novo Vidro</button>}
            </div>
            {activeTab === 'items' && <AdminCostsItemsTab loading={itemLoading} lines={lines} removeLine={removeLine} setActiveLineModal={setActiveLineModal} />}
            {activeTab === 'glass' && <AdminCostsGlassTab loading={glassLoading} colors={colors} setShowGlobalColorsModal={setShowGlobalColorsModal} glassTypesList={glassTypesList} setActiveGlassModal={setActiveGlassModal} />}
            {activeTab === 'aluminum' && <AdminCostsAluminumTab loading={alumLoading} alumColors={alumColors} setShowAlumColorsModal={setShowAlumColorsModal} lines={lines} structure={structure} activeAlumColorsByKey={activeAlumColorsByKey} setActiveAlumLine={setActiveAlumLine} />}
            <NewLineModal show={showNewLineModal} onClose={() => setShowNewLineModal(false)} newLineName={newLineName} setNewLineName={setNewLineName} newLineTipoVenda={newLineTipoVenda} setNewLineTipoVenda={setNewLineTipoVenda} newLineCatName={newLineCatName} setNewLineCatName={setNewLineCatName} newLineCats={newLineCats} handleModalAddCat={handleModalAddCat} handleModalRemoveCat={handleModalRemoveCat} newLineMeasureInputs={newLineMeasureInputs} setNewLineMeasureInputs={setNewLineMeasureInputs} handleModalAddMeasure={handleModalAddMeasure} handleModalRemoveMeasure={handleModalRemoveMeasure} handleModalSubmit={handleModalSubmit} loading={isCreatingLine} newLineType={newLineType} setNewLineType={setNewLineType} newLineAccessoryType={newLineAccessoryType} setNewLineAccessoryType={setNewLineAccessoryType} />
            <LineModal activeLine={activeLineModal} onClose={handleCloseLineModal} structure={structure} pendingModalCosts={pendingModalCosts} setPendingModalCosts={setPendingModalCosts} costs={costs} onSaveBatch={handleBatchSaveCosts} isSaving={isSavingModal} setShowNewCatInlineModal={setShowNewCatInlineModal} showNewCatInlineModal={showNewCatInlineModal} newCatInlineName={newCatInlineName} setNewCatInlineName={setNewCatInlineName} handleAddInlineCat={handleAddInlineCat} setShowNewMeasureModal={setShowNewMeasureModal} showNewMeasureModal={showNewMeasureModal} newMeasureW={newMeasureW} setNewMeasureW={setNewMeasureW} newMeasureH={newMeasureH} setNewMeasureH={setNewMeasureH} addMeasure={addMeasure} removeMeasure={removeMeasure} handleDeleteCategory={handleDeleteCategory} />
            <NewGlassTypeModal show={showNewGlassTypeModal} onClose={() => setShowNewGlassTypeModal(false)} newGlassTypeName={newGlassTypeName} setNewGlassTypeName={setNewGlassTypeName} newGlassThickInput={newGlassThickInput} setNewGlassThickInput={setNewGlassThickInput} handleGlassModalAddThick={handleGlassModalAddThick} newGlassThicknesses={newGlassThicknesses} handleGlassModalRemoveThick={handleGlassModalRemoveThick} addGlassType={addGlassType} loading={isCreatingGlassType} />
            <GlassModal
                activeGlass={activeGlassModal}
                onClose={handleCloseGlassModal}
                glassTypesList={glassTypesList}
                pendingGlassCosts={pendingGlassCosts}
                setPendingGlassCosts={setPendingGlassCosts}
                glassTypeCosts={glassTypeCosts}
                activeColorsByThick={activeColorsByThick}
                setActiveColorsByThick={setActiveColorsByThick}
                colorCosts={colorCosts}
                setColorCosts={setColorCosts}
                setSelectingColorsFor={setSelectingColorsFor}
                handleDeleteThickness={handleDeleteThickness}
                handleDeleteColorCost={handleDeleteColorCost}
                handleBatchSaveGlassCosts={handleBatchSaveGlassCosts}
                isSaving={isSavingGlassModal}
                colors={colors}
                setShowNewThickModal={setShowNewGlassThickModal}
                showNewThickModal={showNewGlassThickModal}
                newThickValue={newGlassThickValue}
                setNewThickValue={setNewGlassThickValue}
                addThickness={handleAddGlassThick}
            />
            <SelectingColorsModal show={!!selectingColorsFor} targetKey={selectingColorsFor} onClose={() => setSelectingColorsFor(null)} colors={colors} activeList={activeColorsByThick[selectingColorsFor] || []} onToggle={(key, colorName) => setActiveColorsByThick(prev => { const current = prev[key] || []; return { ...prev, [key]: current.includes(colorName) ? current.filter(x => x !== colorName) : [...current, colorName] } })} />
            <GlobalColorsModal show={showGlobalColorsModal} onClose={() => setShowGlobalColorsModal(false)} colors={colors} newColorName={newColorName} setNewColorName={setNewColorName} newColorHex={newColorHex} setNewColorHex={setNewColorHex} handleAddColor={handleAddColor} handleDeleteColor={handleDeleteColor} addingColor={addingColor} modalRef={globalColorsModalBodyRef} />
            <GlobalAlumColorsModal show={showAlumColorsModal} onClose={() => setShowAlumColorsModal(false)} colors={alumColors} newColorName={newAlumColorName} setNewColorName={setNewAlumColorName} newColorHex={newAlumColorHex} setNewColorHex={setNewAlumColorHex} handleAddColor={handleAddAlumColor} handleDeleteColor={handleDeleteAlumColor} addingColor={addingAlumColor} modalRef={globalAlumColorsModalBodyRef} />
            <AluminumModal activeLine={activeAlumLine} onClose={handleCloseAlumModal} structure={structure} activeAlumColorsByKey={activeAlumColorsByKey} alumColors={alumColors} alumColorCosts={alumColorCosts} pendingAlumCosts={pendingAlumCosts} setPendingAlumCosts={setPendingAlumCosts} setSelectingAlumColorsFor={setSelectingAlumColorsFor} setActiveAlumColorsByKey={setActiveAlumColorsByKey} handleBatchSaveAlumCosts={handleBatchSaveAlumCosts} isSaving={isSavingAlumModal} />
            <SelectingAlumColorsModal
                show={!!selectingAlumColorsFor}
                onClose={() => setSelectingAlumColorsFor(null)}
                targetKey={selectingAlumColorsFor}
                colors={alumColors}
                activeList={activeAlumColorsByKey[selectingAlumColorsFor] || []}
                onToggle={(key, name) => {
                    setActiveAlumColorsByKey(prev => {
                        const current = prev[key] || [];
                        if (current.includes(name)) return { ...prev, [key]: current.filter(c => c !== name) };
                        return { ...prev, [key]: [...current, name] };
                    })
                }}
            />

            <ConfirmModal
                {...confirmConfig}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
            />
            <div style={{ marginTop: '24px', padding: '14px 20px', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)', fontSize: '13px', color: '#92400E', display: 'flex', gap: '8px', alignItems: 'flex-start' }}><span style={{ fontWeight: 700 }}>💡</span><span>{activeTab === 'items' ? 'Clique no campo, digite o valor e pressione Enter ou clique em Salvar.' : activeTab === 'glass' ? 'Defina o custo base e o custo por cor. Valores em R$/m².' : 'Configure o custo por cor em cada linha/categoria.'}</span></div>
        </div>
    )
}
