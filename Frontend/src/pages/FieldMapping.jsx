import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import datasetService from '../services/datasetService';
import {
  Database,
  Target,
  Layers,
  ArrowRight,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  Link2,
  GripVertical,
  Check,
  CheckCircle2,
  AlertTriangle,
  Save,
  Wand2,
  Edit3,
  Undo2,
  Sparkles,
  Scissors,
  Type,
  Hash,
  ToggleLeft,
  X,
  Code,
  FileSpreadsheet,
} from 'lucide-react';

// ─── Available Transformation Types ──────────────────────────────────────────
const TRANSFORMATION_TYPES = [
  {
    id: 'none',
    label: 'None (Pass-through)',
    shortLabel: 'RAW',
    description: 'Keep value unchanged without alterations',
    icon: ToggleLeft,
    badgeStyle: 'bg-slate-900 text-slate-300 border-slate-700',
    color: 'slate',
  },
  {
    id: 'trim',
    label: 'Trim Whitespace',
    shortLabel: 'TRIM',
    description: 'Remove leading and trailing whitespace characters',
    icon: Scissors,
    badgeStyle: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
    color: 'cyan',
  },
  {
    id: 'uppercase',
    label: 'UPPERCASE',
    shortLabel: 'UPPER',
    description: 'Convert string characters to uppercase letters',
    icon: Type,
    badgeStyle: 'bg-violet-950 text-violet-300 border-violet-500/40',
    color: 'violet',
  },
  {
    id: 'lowercase',
    label: 'lowercase',
    shortLabel: 'LOWER',
    description: 'Convert string characters to lowercase letters',
    icon: Type,
    badgeStyle: 'bg-pink-950 text-pink-300 border-pink-500/40',
    color: 'pink',
  },
  {
    id: 'to_number',
    label: 'String to Number',
    shortLabel: 'NUM',
    description: 'Cast numeric text to integer or floating-point number',
    icon: Hash,
    badgeStyle: 'bg-amber-950 text-amber-300 border-amber-500/40',
    color: 'amber',
  },
  {
    id: 'to_boolean',
    label: 'Cast to Boolean',
    shortLabel: 'BOOL',
    description: 'Parse yes/no/true/false/1/0 into boolean values',
    icon: Check,
    badgeStyle: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
    color: 'emerald',
  },
  {
    id: 'remove_empty',
    label: 'Remove Empty Values',
    shortLabel: 'NON-EMPTY',
    description: 'Nullify empty strings and whitespace-only records',
    icon: X,
    badgeStyle: 'bg-rose-950 text-rose-300 border-rose-500/40',
    color: 'rose',
  },
];

// Helper to execute transformation on a single scalar value for live preview
const applyTransformation = (val, type) => {
  if (val === null || val === undefined) {
    if (type === 'remove_empty') return null;
    return val;
  }
  switch (type) {
    case 'trim':
      return typeof val === 'string' ? val.trim() : String(val).trim();
    case 'uppercase':
      return typeof val === 'string' ? val.toUpperCase() : String(val).toUpperCase();
    case 'lowercase':
      return typeof val === 'string' ? val.toLowerCase() : String(val).toLowerCase();
    case 'to_number': {
      if (val === '') return null;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const n = Number(cleaned);
      return isNaN(n) ? null : n;
    }
    case 'to_boolean': {
      const s = String(val).trim().toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(s)) return true;
      if (['false', '0', 'no', 'n'].includes(s)) return false;
      return Boolean(val);
    }
    case 'remove_empty':
      if (typeof val === 'string' && val.trim() === '') return null;
      return val;
    case 'none':
    default:
      return val;
  }
};

const FieldMapping = () => {
  const { id: routeDatasetId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 'workspace' | 'transformations' | 'preview' | 'config'
  const [activeTab, setActiveTab] = useState('workspace');

  // Datasets catalog state
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(
    routeDatasetId || searchParams.get('datasetId') || ''
  );
  const [currentDataset, setCurrentDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search filter in source column list
  const [sourceSearch, setSourceSearch] = useState('');

  // ─── Core Frontend State: Transformation & Mapping Configurations ────────
  // Array of: { id, sourceField, destField, transformation, isRenamed, isRemoved, customParams }
  const [mappingConfigs, setMappingConfigs] = useState([]);

  // Destination fields registry: [{ id, name, type }]
  const [destinationFields, setDestinationFields] = useState([]);
  const [newDestFieldName, setNewDestFieldName] = useState('');

  // Quick Map selection state (Source and Destination Column Selection)
  const [quickSourceCol, setQuickSourceCol] = useState('');
  const [quickDestCol, setQuickDestCol] = useState('');
  const [quickTransformation, setQuickTransformation] = useState('none');

  // Interactive selection for click-to-connect workflow
  const [selectedSourceCol, setSelectedSourceCol] = useState(null);
  const [selectedDestField, setSelectedDestField] = useState(null);

  // Inline rename editing state: { [configId]: string }
  const [editingRename, setEditingRename] = useState({});

  // Notification toast
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // ─── Initialize State From Loaded Dataset ─────────────────────────────────
  const loadDatasetState = useCallback((dataset) => {
    if (!dataset) return;

    const sourceCols = dataset.columns || [];
    const savedMapping = dataset.mapping || {};
    const savedConnections = savedMapping.connections || [];
    const savedDestinations = savedMapping.destinations || [];

    if (savedConnections.length > 0) {
      // Reconstruct mapping configurations from saved state
      const initialConfigs = savedConnections.map((conn, idx) => ({
        id: conn.id || `map-${conn.sourceField}-${conn.destField}-${idx}`,
        sourceField: conn.sourceField,
        destField: conn.destField,
        transformation: conn.transformation || 'none',
        isRenamed: conn.sourceField !== conn.destField,
        isRemoved: Boolean(conn.isRemoved),
      }));

      setMappingConfigs(initialConfigs);
      setDestinationFields(
        savedDestinations.length > 0
          ? savedDestinations
          : Array.from(new Set(savedConnections.map((c) => c.destField))).map((name) => ({
              id: `dest-${name}`,
              name,
              type: 'String',
            }))
      );
    } else {
      // Initialize 1-to-1 default mappings for all source columns
      const initialConfigs = sourceCols.map((c) => ({
        id: `map-${c.name}-${c.name}`,
        sourceField: c.name,
        destField: c.name,
        transformation: 'none',
        isRenamed: false,
        isRemoved: false,
      }));

      const initialDests = sourceCols.map((c) => ({
        id: `dest-${c.name}`,
        name: c.name,
        type: c.type || 'String',
      }));

      setMappingConfigs(initialConfigs);
      setDestinationFields(initialDests);
    }

    if (sourceCols.length > 0) {
      setQuickSourceCol(sourceCols[0].name);
      setQuickDestCol(sourceCols[0].name);
    }
  }, []);

  // ─── Fetch Datasets on Mount ──────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    datasetService
      .fetchDatasets()
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res.datasets || [];
        setDatasets(list);

        const paramId = routeDatasetId || searchParams.get('datasetId');
        const matched = list.find((d) => d.id === paramId || d.datasetId === paramId);
        const activeItem = matched || list[0] || null;

        if (activeItem) {
          setSelectedDatasetId(activeItem.id);
          setCurrentDataset(activeItem);
          loadDatasetState(activeItem);
        }
      })
      .catch((err) => {
        console.error('Error loading datasets for mapping:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [routeDatasetId, searchParams, loadDatasetState]);

  // Handle dataset change
  const handleSelectDataset = (datasetId) => {
    setSelectedDatasetId(datasetId);
    setSearchParams({ datasetId });
    const ds = datasets.find((d) => d.id === datasetId || d.datasetId === datasetId);
    if (ds) {
      setCurrentDataset(ds);
      loadDatasetState(ds);
      setSelectedSourceCol(null);
      setSelectedDestField(null);
    }
  };

  // ─── Computed Lookups and Filters ─────────────────────────────────────────
  const sourceColumns = useMemo(() => {
    return currentDataset?.columns || [];
  }, [currentDataset]);

  const filteredSourceColumns = useMemo(() => {
    if (!sourceSearch.trim()) return sourceColumns;
    const q = sourceSearch.toLowerCase().trim();
    return sourceColumns.filter((col) => col.name.toLowerCase().includes(q));
  }, [sourceColumns, sourceSearch]);

  // Active mappings (excluding removed columns)
  const activeMappings = useMemo(() => {
    return mappingConfigs.filter((c) => !c.isRemoved);
  }, [mappingConfigs]);

  // Removed/excluded mappings
  const removedMappings = useMemo(() => {
    return mappingConfigs.filter((c) => c.isRemoved);
  }, [mappingConfigs]);

  // Mapping lookup maps
  const sourceToConfigMap = useMemo(() => {
    const map = {};
    activeMappings.forEach((cfg) => {
      map[cfg.sourceField] = cfg;
    });
    return map;
  }, [activeMappings]);

  const destToConfigMap = useMemo(() => {
    const map = {};
    activeMappings.forEach((cfg) => {
      map[cfg.destField] = cfg;
    });
    return map;
  }, [activeMappings]);

  // Stats counters
  const totalSourceCount = sourceColumns.length;
  const mappedSourceCount = activeMappings.length;
  const unmappedSourceCount = Math.max(0, totalSourceCount - mappedSourceCount - removedMappings.length);
  const renamedCount = useMemo(() => activeMappings.filter((m) => m.isRenamed).length, [activeMappings]);
  const transformedCount = useMemo(
    () => activeMappings.filter((m) => m.transformation && m.transformation !== 'none').length,
    [activeMappings]
  );

  // ─── State Modifiers & Actions ────────────────────────────────────────────

  // 1. Add or Update Mapping via Selection
  const handleAddOrUpdateMapping = (sourceName, destName, transformation = 'none') => {
    if (!sourceName || !destName) return;

    setMappingConfigs((prev) => {
      // Remove previous mapping using this source or this destination
      const filtered = prev.filter(
        (m) => m.sourceField !== sourceName && m.destField !== destName
      );

      return [
        ...filtered,
        {
          id: `map-${sourceName}-${destName}-${Date.now()}`,
          sourceField: sourceName,
          destField: destName,
          transformation: transformation || 'none',
          isRenamed: sourceName !== destName,
          isRemoved: false,
        },
      ];
    });

    // Ensure destination field exists in registry
    setDestinationFields((prev) => {
      if (prev.some((d) => d.name.toLowerCase() === destName.toLowerCase())) return prev;
      return [...prev, { id: `dest-${Date.now()}`, name: destName, type: 'String' }];
    });

    setSelectedSourceCol(null);
    setSelectedDestField(null);
    showNotification('success', `Mapped "${sourceName}" → "${destName}".`);
  };

  // 2. Rename Column
  const handleRenameColumn = (configId, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setMappingConfigs((prev) =>
      prev.map((cfg) => {
        if (cfg.id !== configId) return cfg;
        return {
          ...cfg,
          destField: trimmed,
          isRenamed: cfg.sourceField !== trimmed,
        };
      })
    );

    // Update destination field registry name if matching
    setDestinationFields((prev) => {
      const targetCfg = mappingConfigs.find((c) => c.id === configId);
      if (!targetCfg) return prev;
      return prev.map((d) => (d.name === targetCfg.destField ? { ...d, name: trimmed } : d));
    });

    // Clear editing state
    setEditingRename((prev) => {
      const next = { ...prev };
      delete next[configId];
      return next;
    });

    showNotification('success', `Column destination renamed to "${trimmed}".`);
  };

  // 3. Remove / Exclude Column from output
  const handleRemoveColumn = (configId) => {
    setMappingConfigs((prev) =>
      prev.map((cfg) => (cfg.id === configId ? { ...cfg, isRemoved: true } : cfg))
    );
    showNotification('warning', 'Column marked as removed/excluded from output.');
  };

  // 4. Restore a Removed Column
  const handleRestoreColumn = (configId) => {
    setMappingConfigs((prev) =>
      prev.map((cfg) => (cfg.id === configId ? { ...cfg, isRemoved: false } : cfg))
    );
    showNotification('success', 'Column restored to mapping pipeline.');
  };

  // 5. Delete Mapping Connection permanently
  const handleDeleteConnection = (configId) => {
    setMappingConfigs((prev) => prev.filter((cfg) => cfg.id !== configId));
    showNotification('info', 'Mapping connection removed.');
  };

  // 6. Update Transformation Type
  const handleUpdateTransformation = (configId, transformation) => {
    setMappingConfigs((prev) =>
      prev.map((cfg) => (cfg.id === configId ? { ...cfg, transformation } : cfg))
    );
    const selectedTrans = TRANSFORMATION_TYPES.find((t) => t.id === transformation);
    showNotification('success', `Applied "${selectedTrans?.label || transformation}".`);
  };

  // 7. Click-to-Connect source column
  const handleSourceColumnClick = (colName) => {
    if (selectedDestField) {
      handleAddOrUpdateMapping(colName, selectedDestField, 'none');
    } else {
      setSelectedSourceCol((prev) => (prev === colName ? null : colName));
      setQuickSourceCol(colName);
      setQuickDestCol(colName);
    }
  };

  // 8. Click-to-Connect destination field
  const handleDestFieldClick = (destName) => {
    if (selectedSourceCol) {
      handleAddOrUpdateMapping(selectedSourceCol, destName, 'none');
    } else {
      setSelectedDestField((prev) => (prev === destName ? null : destName));
      setQuickDestCol(destName);
    }
  };

  // 9. Add new Destination Field to list
  const handleAddDestinationField = (e) => {
    if (e) e.preventDefault();
    const trimmed = newDestFieldName.trim();
    if (!trimmed) return;

    if (destinationFields.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      showNotification('warning', `Destination field "${trimmed}" already exists.`);
      return;
    }

    const newField = {
      id: `dest-${Date.now()}`,
      name: trimmed,
      type: 'String',
    };

    setDestinationFields((prev) => [...prev, newField]);
    setNewDestFieldName('');

    if (selectedSourceCol) {
      handleAddOrUpdateMapping(selectedSourceCol, trimmed, 'none');
    } else {
      showNotification('success', `Destination field "${trimmed}" added.`);
    }
  };

  // 10. Auto-Map All Remaining Source Fields
  const handleAutoMapAll = () => {
    const existingSources = new Set(activeMappings.map((m) => m.sourceField));
    const newConfigs = [...mappingConfigs];
    const newDests = [...destinationFields];

    sourceColumns.forEach((col) => {
      if (!existingSources.has(col.name)) {
        if (!newDests.some((d) => d.name.toLowerCase() === col.name.toLowerCase())) {
          newDests.push({ id: `dest-${col.name}`, name: col.name, type: col.type || 'String' });
        }
        newConfigs.push({
          id: `map-${col.name}-${col.name}-${Date.now()}`,
          sourceField: col.name,
          destField: col.name,
          transformation: 'none',
          isRenamed: false,
          isRemoved: false,
        });
      }
    });

    setDestinationFields(newDests);
    setMappingConfigs(newConfigs);
    showNotification('success', 'Auto-mapped all unmapped source columns.');
  };

  // 11. Discard Changes & Reset to initial dataset state
  const handleDiscardChanges = () => {
    if (currentDataset) {
      loadDatasetState(currentDataset);
      setSelectedSourceCol(null);
      setSelectedDestField(null);
      showNotification('info', 'Discarded uncommitted changes.');
    }
  };

  // 12. Clear All Mappings
  const handleClearAll = () => {
    setMappingConfigs([]);
    setSelectedSourceCol(null);
    setSelectedDestField(null);
    showNotification('warning', 'Cleared all field mappings.');
  };

  // 13. Batch apply transformation to all active mappings
  const handleBatchApplyTransformation = (transformationType) => {
    setMappingConfigs((prev) =>
      prev.map((cfg) => ({ ...cfg, transformation: transformationType }))
    );
    const transObj = TRANSFORMATION_TYPES.find((t) => t.id === transformationType);
    showNotification('success', `Batch applied "${transObj?.label}" to all mapped columns.`);
  };

  // 14. Save Pipeline Configuration to Backend / Service
  const handleSavePipeline = async () => {
    if (!currentDataset) return;
    setIsSaving(true);

    try {
      const payload = {
        connections: activeMappings.map((m) => ({
          id: m.id,
          sourceField: m.sourceField,
          destField: m.destField,
          transformation: m.transformation,
          isRenamed: m.isRenamed,
          isRemoved: false,
        })),
        destinations: destinationFields,
        removedColumns: removedMappings.map((m) => m.sourceField),
        transformationConfigs: mappingConfigs,
        updatedAt: new Date().toISOString(),
      };

      await datasetService.saveFieldMapping(currentDataset.id, payload);
      showNotification('success', `Pipeline configurations saved for "${currentDataset.name}".`);
    } catch (err) {
      console.error('Save error:', err);
      showNotification('error', `Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Live Output Preview computed synchronously via useMemo
  const previewRows = useMemo(() => {
    if (!currentDataset) return [];
    const sampleRows = currentDataset.sampleRows || currentDataset.previewData || [];
    return sampleRows.map((row) => {
      const out = {};
      activeMappings.forEach((cfg) => {
        const rawVal = row[cfg.sourceField];
        const val = applyTransformation(rawVal, cfg.transformation);
        out[cfg.destField] = val !== undefined ? val : null;
      });
      return out;
    });
  }, [currentDataset, activeMappings]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-4 bg-[#0c122b]/90 border border-cyan-500/20 min-h-[500px] flex flex-col items-center justify-center rounded-3xl shadow-2xl">
        <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading Field Mapping Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-slate-100">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-semibold transition-all backdrop-blur-xl border ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-900/30'
              : notification.type === 'warning'
              ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-amber-900/30'
              : notification.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 shadow-rose-900/30'
              : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-cyan-900/30'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOP HEADER & DATASET STATUS BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c122b]/95 border border-cyan-500/25 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-13 h-13 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentDataset?.name || 'Dataset'}
                </h1>
                <span className="text-slate-500">•</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 uppercase tracking-wide">
                  {currentDataset?.format || 'CSV'}
                </span>

                {/* Dataset Switcher Dropdown */}
                {datasets.length > 1 && (
                  <div className="relative inline-block ml-2">
                    <select
                      value={selectedDatasetId}
                      onChange={(e) => handleSelectDataset(e.target.value)}
                      className="text-xs bg-[#070b1c] border border-cyan-500/40 text-slate-200 rounded-xl px-3 py-1 font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer shadow-md"
                    >
                      {datasets.map((d) => (
                        <option key={d.id} value={d.id}>
                          Switch: {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Status Stats Badges */}
              <div className="flex items-center space-x-4 sm:space-x-6 text-xs text-slate-300 mt-2.5 flex-wrap gap-y-2 font-medium">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white">{mappedSourceCount}</strong> of{' '}
                    <strong className="text-white">{totalSourceCount}</strong> mapped
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-white">{renamedCount}</strong> renamed
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Wand2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    <strong className="text-white">{transformedCount}</strong> transformations
                  </span>
                </div>

                {removedMappings.length > 0 && (
                  <div className="flex items-center space-x-1.5">
                    <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      <strong className="text-white">{removedMappings.length}</strong> removed
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-3 shrink-0 self-start lg:self-auto">
            <button
              onClick={handleSavePipeline}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Pipeline'}</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#0d1636] hover:bg-[#121e4a] text-slate-200 border border-cyan-500/30 shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Preview Output</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK MAP / COLUMN SELECTION BAR (Source & Destination Selection + Transform Type) */}
      <div className="rounded-2xl bg-[#0a0f24] border border-cyan-500/30 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-cyan-300 uppercase tracking-wider shrink-0">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <span>Map Column Selection:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 flex-1">
            {/* 1. Source Column Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                1. Source Column
              </label>
              <select
                value={quickSourceCol}
                onChange={(e) => {
                  setQuickSourceCol(e.target.value);
                  setQuickDestCol(e.target.value);
                }}
                className="w-full bg-[#070b1c] border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="" disabled>Select Source Column...</option>
                {sourceColumns.map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.type || 'String'})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Destination Column Input / Select (Rename Column Option) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                2. Destination Column (Rename)
              </label>
              <input
                type="text"
                value={quickDestCol}
                onChange={(e) => setQuickDestCol(e.target.value)}
                placeholder="Target Column Name..."
                className="w-full bg-[#070b1c] border border-slate-700 text-cyan-300 placeholder-slate-500 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* 3. Transformation Type Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                3. Transformation Type
              </label>
              <select
                value={quickTransformation}
                onChange={(e) => setQuickTransformation(e.target.value)}
                className="w-full bg-[#070b1c] border border-slate-700 text-purple-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                {TRANSFORMATION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Map Column Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => handleAddOrUpdateMapping(quickSourceCol, quickDestCol, quickTransformation)}
                disabled={!quickSourceCol || !quickDestCol.trim()}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Map Column</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-cyan-500/15 pb-2 px-1 flex-wrap gap-y-2">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'workspace'
                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Field Mapping Workspace</span>
            <span className="w-5 h-5 rounded-full bg-[#070b1c] text-cyan-400 text-[10px] font-extrabold flex items-center justify-center border border-cyan-500/30">
              {activeMappings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transformations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'transformations'
                ? 'bg-purple-950/70 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Transformation Builder</span>
            {transformedCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-purple-900 text-purple-300 text-[10px] font-extrabold flex items-center justify-center">
                {transformedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-blue-950/70 text-blue-300 border border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Live Output Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pipeline State Config</span>
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-500">Nexora No-Code ETL</span>
      </div>

      {/* ─── TAB 1: FIELD MAPPING WORKSPACE (3-COLUMN VISUAL LAYOUT) ─────────── */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* COLUMN 1: SOURCE COLUMNS (lg:col-span-3) */}
          <div className="lg:col-span-3 rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-5 shadow-2xl backdrop-blur-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-white">
                  SOURCE COLUMNS
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                {mappedSourceCount}/{totalSourceCount}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                placeholder="Search source fields..."
                className="w-full bg-[#070b1c] text-xs text-white placeholder-slate-500 pl-8 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>

            {/* Source Column Cards List */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredSourceColumns.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No matching columns found
                </div>
              ) : (
                filteredSourceColumns.map((col) => {
                  const activeMapping = sourceToConfigMap[col.name];
                  const isMapped = Boolean(activeMapping);
                  const isRemoved = removedMappings.some((m) => m.sourceField === col.name);
                  const isSelected = selectedSourceCol === col.name;

                  return (
                    <div
                      key={col.name}
                      onClick={() => handleSourceColumnClick(col.name)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none group ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400 text-white'
                          : isRemoved
                          ? 'border-rose-900/60 bg-rose-950/20 text-slate-400 opacity-60'
                          : isMapped
                          ? 'border-slate-800 bg-[#080d22] hover:border-cyan-500/40 text-slate-200'
                          : 'border-slate-800 bg-[#080d22] hover:border-amber-500/40 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-semibold text-slate-200 truncate block">
                            {col.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {col.type || 'String'}
                          </span>
                        </div>
                      </div>

                      {isRemoved ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-[9px] font-bold">
                          Removed
                        </span>
                      ) : isMapped ? (
                        <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Mapped</span>
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                          Unmapped
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Auto-map helper button */}
            {unmappedSourceCount > 0 && (
              <button
                onClick={handleAutoMapAll}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auto-Map All Unmapped ({unmappedSourceCount})</span>
              </button>
            )}
          </div>

          {/* COLUMN 2: FIELD MAPPING & TRANSFORMATION CANVAS (lg:col-span-6) */}
          <div className="lg:col-span-6 rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-5 shadow-2xl backdrop-blur-xl flex flex-col space-y-4 min-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">
                    MAPPING & TRANSFORMATION CANVAS
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Map columns, select transformations, rename or remove fields
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                {activeMappings.length} Active Mappings
              </span>
            </div>

            {/* Click-to-Connect Indicator Banner */}
            {(selectedSourceCol || selectedDestField) && (
              <div className="px-3.5 py-2 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>
                    Connecting:{' '}
                    <strong className="text-white">{selectedSourceCol || `(Pick source)`}</strong> →{' '}
                    <strong className="text-white">{selectedDestField || `(Pick destination)`}</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedSourceCol(null);
                    setSelectedDestField(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer font-bold px-2 py-0.5 rounded-lg bg-slate-900"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Active Mappings Cards */}
            {activeMappings.length === 0 ? (
              <div className="my-auto py-16 px-6 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 bg-[#080d22]/50">
                <div className="w-12 h-12 rounded-2xl bg-[#0d1636] text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg">
                  <Link2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">No Mappings Configured</h3>
                  <p className="text-xs text-slate-400 max-w-sm font-medium">
                    Use the Map Column selector above or click a Source Column to create a mapping.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {activeMappings.map((cfg) => {
                  const isEditingThisRename = editingRename[cfg.id] !== undefined;
                  const currentRenameVal = editingRename[cfg.id] ?? cfg.destField;
                  const transDef = TRANSFORMATION_TYPES.find((t) => t.id === cfg.transformation) || TRANSFORMATION_TYPES[0];
                  const TransIcon = transDef.icon;

                  return (
                    <div
                      key={cfg.id}
                      className="p-3.5 rounded-2xl border border-slate-800 bg-[#080d22] hover:border-cyan-500/40 hover:bg-[#0c1433] shadow-md flex flex-col gap-2.5 transition-all group"
                    >
                      {/* Top Row: Source Column → Arrow → Destination Column (with Rename UI) */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Source Column Badge */}
                        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                          <GripVertical className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          <span
                            className="px-2.5 py-1 rounded-xl bg-slate-900 font-mono text-xs font-bold text-cyan-300 truncate border border-cyan-500/30"
                            title={cfg.sourceField}
                          >
                            {cfg.sourceField}
                          </span>
                        </div>

                        {/* Arrow */}
                        <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />

                        {/* Destination Column (Renamable Input or Badge) */}
                        <div className="flex items-center space-x-1.5 min-w-0 flex-1 justify-end">
                          {isEditingThisRename ? (
                            <div className="flex items-center space-x-1 w-full max-w-[190px]">
                              <input
                                type="text"
                                value={currentRenameVal}
                                onChange={(e) =>
                                  setEditingRename((prev) => ({ ...prev, [cfg.id]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameColumn(cfg.id, currentRenameVal);
                                  if (e.key === 'Escape') {
                                    setEditingRename((prev) => {
                                      const n = { ...prev };
                                      delete n[cfg.id];
                                      return n;
                                    });
                                  }
                                }}
                                autoFocus
                                className="w-full bg-[#070b1c] text-xs font-mono font-bold text-indigo-300 px-2 py-1 rounded-lg border border-indigo-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRenameColumn(cfg.id, currentRenameVal)}
                                className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                                title="Save Rename"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <span
                                className={`px-2.5 py-1 rounded-xl font-mono text-xs font-bold truncate border ${
                                  cfg.isRenamed
                                    ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                                    : 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                                }`}
                                title={cfg.destField}
                              >
                                {cfg.destField}
                              </span>

                              {/* Rename column button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingRename((prev) => ({ ...prev, [cfg.id]: cfg.destField }))
                                }
                                className="p-1 text-slate-500 hover:text-amber-400 hover:bg-amber-950/30 rounded-lg transition-colors cursor-pointer"
                                title="Rename destination column"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Transformation Selector + Remove Column Action */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        {/* Transformation Selection UI */}
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Transform:
                          </span>
                          <div className="relative">
                            <select
                              value={cfg.transformation || 'none'}
                              onChange={(e) => handleUpdateTransformation(cfg.id, e.target.value)}
                              className={`text-[11px] font-semibold pl-2 pr-6 py-1 rounded-lg border focus:outline-none cursor-pointer transition-colors ${transDef.badgeStyle}`}
                            >
                              {TRANSFORMATION_TYPES.map((t) => (
                                <option key={t.id} value={t.id} className="bg-[#0c122b] text-slate-200">
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <TransIcon className="w-3 h-3 text-slate-400" />
                        </div>

                        {/* Actions: Remove Column / Drop & Disconnect */}
                        <div className="flex items-center space-x-2">
                          {/* Remove Column Action */}
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(cfg.id)}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-rose-400 bg-rose-950/30 hover:bg-rose-950/70 border border-rose-500/30 hover:border-rose-500/60 transition-all flex items-center space-x-1 cursor-pointer"
                            title="Remove/exclude this column from destination schema"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Remove Column</span>
                          </button>

                          {/* Delete Connection */}
                          <button
                            type="button"
                            onClick={() => handleDeleteConnection(cfg.id)}
                            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Disconnect mapping"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMN 3: DESTINATION SCHEMA & EXCLUDED COLUMNS (lg:col-span-3) */}
          <div className="lg:col-span-3 rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-5 shadow-2xl backdrop-blur-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-white">
                  DESTINATION FIELDS
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                {activeMappings.length} output cols
              </span>
            </div>

            {/* Add Destination Field Form */}
            <form onSubmit={handleAddDestinationField} className="flex items-center space-x-2">
              <input
                type="text"
                value={newDestFieldName}
                onChange={(e) => setNewDestFieldName(e.target.value)}
                placeholder="Add destination field..."
                className="flex-1 bg-[#070b1c] text-xs text-white placeholder-slate-500 px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 font-medium"
              />
              <button
                type="submit"
                disabled={!newDestFieldName.trim()}
                className="w-8 h-8 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-40"
                title="Add Field"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Destination Fields List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {destinationFields.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No destination fields defined
                </div>
              ) : (
                destinationFields.map((field) => {
                  const conn = destToConfigMap[field.name];
                  const isConnected = Boolean(conn);
                  const isSelected = selectedDestField === field.name;

                  return (
                    <div
                      key={field.name}
                      onClick={() => handleDestFieldClick(field.name)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-950/60 shadow-[0_0_15px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400 text-white'
                          : isConnected
                          ? 'border-slate-800 bg-[#080d22] hover:border-cyan-500/40 text-slate-200'
                          : 'border-slate-800 bg-[#080d22] text-slate-400 hover:border-indigo-500/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-xs font-semibold text-slate-200 truncate block">
                          {field.name}
                        </span>
                        {isConnected && (
                          <span className="text-[10px] text-cyan-400 font-medium truncate block">
                            ← {conn.sourceField}
                          </span>
                        )}
                      </div>

                      {isConnected ? (
                        <div className="px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                          Mapped
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-500 text-[9px] font-semibold">
                          Empty
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Removed / Excluded Columns Section */}
            {removedMappings.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
                  <span className="flex items-center space-x-1">
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Excluded / Removed Columns ({removedMappings.length})</span>
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {removedMappings.map((m) => (
                    <div
                      key={m.id}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/20 border border-rose-900/40 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-slate-400 line-through truncate max-w-[140px]">
                        {m.sourceField}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRestoreColumn(m.id)}
                        className="text-[10px] font-bold text-cyan-300 hover:text-white flex items-center space-x-1 cursor-pointer"
                        title="Restore column to pipeline"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: TRANSFORMATION BUILDER MATRIX ────────────────────────────── */}
      {activeTab === 'transformations' && (
        <div className="rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-cyan-500/15 pb-4 gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Wand2 className="w-4 h-4 text-purple-400" />
                <span>Transformation Rule Matrix</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage column transformations: Trim whitespace, UPPERCASE, lowercase, Number casts, and Empty removal.
              </p>
            </div>

            {/* Batch actions */}
            <div className="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                type="button"
                onClick={() => handleBatchApplyTransformation('trim')}
                className="text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-3 py-1.5 rounded-xl hover:bg-cyan-900/60 cursor-pointer shadow-sm"
              >
                Trim All
              </button>
              <button
                type="button"
                onClick={() => handleBatchApplyTransformation('uppercase')}
                className="text-xs font-bold text-violet-300 bg-violet-950/70 border border-violet-500/40 px-3 py-1.5 rounded-xl hover:bg-violet-900/60 cursor-pointer shadow-sm"
              >
                UPPERCASE All
              </button>
              <button
                type="button"
                onClick={() => handleBatchApplyTransformation('none')}
                className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-800 cursor-pointer shadow-sm"
              >
                Reset to Raw
              </button>
            </div>
          </div>

          {activeMappings.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-medium">
              No active field mappings to transform. Map columns in the workspace first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeMappings.map((cfg) => {
                const transDef = TRANSFORMATION_TYPES.find((t) => t.id === cfg.transformation) || TRANSFORMATION_TYPES[0];
                const TransIcon = transDef.icon;

                return (
                  <div
                    key={cfg.id}
                    className="p-4 rounded-2xl border border-slate-800 bg-[#080d22] space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white truncate max-w-[180px]">
                        {cfg.sourceField} → {cfg.destField}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${transDef.badgeStyle}`}>
                        {transDef.shortLabel}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1.5">
                        <TransIcon className="w-3.5 h-3.5 text-purple-400" />
                        <span>Select Transformation:</span>
                      </label>
                      <select
                        value={cfg.transformation || 'none'}
                        onChange={(e) => handleUpdateTransformation(cfg.id, e.target.value)}
                        className="w-full text-xs bg-[#070b1c] border border-slate-700 text-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
                      >
                        {TRANSFORMATION_TYPES.map((opt) => (
                          <option key={opt.id} value={opt.id} className="bg-[#0c122b] text-slate-200">
                            {opt.label} — {opt.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    {cfg.isRenamed && (
                      <div className="text-[10px] text-amber-400 font-semibold flex items-center space-x-1">
                        <Edit3 className="w-3 h-3" />
                        <span>Output column renamed to "{cfg.destField}"</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: LIVE OUTPUT PREVIEW ──────────────────────────────────────── */}
      {activeTab === 'preview' && (
        <div className="rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-6 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span>Live Transformed Output Preview</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time preview of data records with renamed headers, transformations applied, and removed columns excluded.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-3 py-1 rounded-xl">
                ⚡ Reactive Live Sync
              </span>
            </div>
          </div>

          {previewRows.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs font-medium">
              No transformed rows to display. Ensure connections are mapped in the workspace.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#070b1c] border-b border-slate-800 text-cyan-300 font-bold">
                  <tr>
                    <th className="px-4 py-3 w-10 text-slate-500 font-mono">#</th>
                    {activeMappings.map((cfg) => (
                      <th key={cfg.id} className="px-4 py-3 font-mono">
                        <div className="flex items-center space-x-1">
                          <span>{cfg.destField}</span>
                          {cfg.isRenamed && (
                            <span className="text-[9px] px-1 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                              renamed
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {previewRows.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#0d1636]/50">
                      <td className="px-4 py-2.5 font-mono text-slate-600">{idx + 1}</td>
                      {activeMappings.map((cfg) => {
                        const cellVal = row[cfg.destField];
                        return (
                          <td key={cfg.id} className="px-4 py-2.5 font-mono text-slate-200">
                            {cellVal !== null && cellVal !== undefined ? (
                              String(cellVal)
                            ) : (
                              <span className="text-slate-600 italic">null</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: PIPELINE STATE CONFIGURATION (JSON) ──────────────────────── */}
      {activeTab === 'config' && (
        <div className="rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span>Frontend Pipeline State</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact JSON state maintained on the client for ETL field mapping, transformations, renames, and exclusions.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#070b1c] border border-slate-800 p-4 font-mono text-xs text-cyan-300 max-h-[500px] overflow-y-auto">
            <pre>
              {JSON.stringify(
                {
                  datasetId: currentDataset?.id,
                  datasetName: currentDataset?.name,
                  totalConfiguredMappings: activeMappings.length,
                  removedColumnsCount: removedMappings.length,
                  renamedColumnsCount: renamedCount,
                  transformationsCount: transformedCount,
                  mappings: activeMappings,
                  removedColumns: removedMappings,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      {/* BOTTOM ACTION TOOLBAR */}
      <div className="rounded-3xl bg-[#0c122b]/95 border border-cyan-500/20 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl flex items-center justify-between flex-wrap gap-4">
        {/* Left Actions: Discard & Clear */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDiscardChanges}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-300 bg-[#080d22] hover:bg-[#0d1636] border border-slate-800 hover:border-cyan-500/40 shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Discard Changes</span>
          </button>

          <button
            onClick={handleClearAll}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear All</span>
          </button>
        </div>

        {/* Right Actions: Preview & Save Pipeline */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('preview')}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-200 bg-[#0d1636] hover:bg-[#121e4a] border border-cyan-500/30 shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preview Output</span>
          </button>

          <button
            onClick={handleSavePipeline}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Pipeline'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldMapping;
