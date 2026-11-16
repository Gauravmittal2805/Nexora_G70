import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import datasetService from '../services/datasetService';
import DatasetPreviewTable from '../components/datasets/DatasetPreviewTable';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  GripVertical,
  Crosshair,
  Key,
  Hash,
  Tag,
  Calendar,
  EyeOff,
  Search,
  Check,
  X,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';

const TARGET_SLOTS = [
  {
    key: 'target',
    label: 'Target Label / Prediction Variable',
    description: 'The primary target variable the machine learning model will predict.',
    icon: Crosshair,
    color: 'rose',
    accentBorder: 'border-rose-500/50',
    accentBg: 'bg-rose-950/20',
    badgeStyle: 'bg-rose-950 text-rose-300 border-rose-500/40',
    isSingle: true,
    required: true,
  },
  {
    key: 'id',
    label: 'Primary Identifier / Entity Key',
    description: 'Unique record identifier. Will be tracked but excluded from feature training to prevent leakage.',
    icon: Key,
    color: 'amber',
    accentBorder: 'border-amber-500/50',
    accentBg: 'bg-amber-950/20',
    badgeStyle: 'bg-amber-950 text-amber-300 border-amber-500/40',
    isSingle: true,
    required: false,
  },
  {
    key: 'numerical',
    label: 'Numerical Predictor Features',
    description: 'Continuous and discrete numerical metrics for scaling, imputation, and mathematical modeling.',
    icon: Hash,
    color: 'cyan',
    accentBorder: 'border-cyan-500/50',
    accentBg: 'bg-cyan-950/20',
    badgeStyle: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
    isSingle: false,
    required: false,
  },
  {
    key: 'categorical',
    label: 'Categorical Predictor Features',
    description: 'Discrete text and enumerated categories for one-hot encoding, ordinal encoding, and embeddings.',
    icon: Tag,
    color: 'purple',
    accentBorder: 'border-purple-500/50',
    accentBg: 'bg-purple-950/20',
    badgeStyle: 'bg-purple-950 text-purple-300 border-purple-500/40',
    isSingle: false,
    required: false,
  },
  {
    key: 'datetime',
    label: 'Temporal / Datetime Features',
    description: 'Timestamps, dates, or year markers for windowing, lag derivation, and time-series decomposition.',
    icon: Calendar,
    color: 'pink',
    accentBorder: 'border-pink-500/50',
    accentBg: 'bg-pink-950/20',
    badgeStyle: 'bg-pink-950 text-pink-300 border-pink-500/40',
    isSingle: false,
    required: false,
  },
  {
    key: 'ignored',
    label: 'Excluded / Ignored Columns',
    description: 'Free text notes, high-cardinality IDs, or redundant columns omitted from downstream pipelines.',
    icon: EyeOff,
    color: 'slate',
    accentBorder: 'border-slate-700',
    accentBg: 'bg-slate-900/40',
    badgeStyle: 'bg-slate-800 text-slate-400 border-slate-700',
    isSingle: false,
    required: false,
  },
];

const FieldMapping = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Catalog & active dataset state
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(
    searchParams.get('datasetId') || ''
  );
  const [currentDataset, setCurrentDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Field mapping state
  const [mapping, setMapping] = useState({
    target: '',
    id: '',
    numerical: [],
    categorical: [],
    datetime: [],
    ignored: [],
  });

  // Source column filter & search
  const [columnSearch, setColumnSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Drag state (source cards still draggable for future use)
  const [draggedColumn, setDraggedColumn] = useState(null);

  // Preview Drawer
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(10);

  // Custom destination labels: { [sourceColName]: 'user typed label' }
  const [columnLabels, setColumnLabels] = useState({});

  // Notification state
  const [notification, setNotification] = useState(null);

  // Load mapping configuration for given dataset
  const loadDatasetMapping = useCallback(async (dataset) => {
    try {
      const saved = await datasetService.getFieldMapping(dataset.id);
      if (saved && (saved.target || saved.numerical?.length || saved.categorical?.length)) {
        setMapping(saved);
      } else {
        const suggested = datasetService.autoSuggestMapping
          ? datasetService.autoSuggestMapping(dataset.columns || [])
          : dataset.mapping || {
              target: '',
              id: '',
              numerical: [],
              categorical: [],
              datetime: [],
              ignored: [],
            };
        setMapping(suggested);
      }
    } catch {
      setMapping(
        dataset.mapping || {
          target: '',
          id: '',
          numerical: [],
          categorical: [],
          datetime: [],
          ignored: [],
        }
      );
    }
  }, []);

  // Load all datasets from service / API
  useEffect(() => {
    let active = true;
    datasetService
      .fetchDatasets()
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res.datasets || [];
        setDatasets(list);

        // Determine active dataset
        const paramId = searchParams.get('datasetId');
        const matched = list.find((d) => d.id === paramId || d.datasetId === paramId);
        const activeItem = matched || list[0] || null;

        if (activeItem) {
          setSelectedDatasetId(activeItem.id);
          setCurrentDataset(activeItem);
          loadDatasetMapping(activeItem);
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
  }, [searchParams, loadDatasetMapping]);

  // Switch dataset
  const handleSelectDataset = (datasetId) => {
    setSelectedDatasetId(datasetId);
    setSearchParams({ datasetId });
    const ds = datasets.find((d) => d.id === datasetId || d.datasetId === datasetId);
    if (ds) {
      setCurrentDataset(ds);
      loadDatasetMapping(ds);
      setPreviewData(null);
      setPreviewPage(1);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, col) => {
    setDraggedColumn(col);
    e.dataTransfer.setData('text/plain', col.name);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
  };

  // Assign column to target slot (removes from other slots first)
  const assignColumnToSlot = (colName, targetSlotKey) => {
    setMapping((prev) => {
      const next = {
        target: prev.target === colName ? '' : prev.target,
        id: prev.id === colName ? '' : prev.id,
        numerical: (prev.numerical || []).filter((c) => c !== colName),
        categorical: (prev.categorical || []).filter((c) => c !== colName),
        datetime: (prev.datetime || []).filter((c) => c !== colName),
        ignored: (prev.ignored || []).filter((c) => c !== colName),
      };

      const slotConfig = TARGET_SLOTS.find((s) => s.key === targetSlotKey);
      if (slotConfig?.isSingle) {
        next[targetSlotKey] = colName;
      } else {
        next[targetSlotKey] = [...(next[targetSlotKey] || []), colName];
      }

      return next;
    });

    setNotification({
      type: 'success',
      message: `Assigned "${colName}" to ${TARGET_SLOTS.find((s) => s.key === targetSlotKey)?.label?.split('/')[0] || targetSlotKey}`,
    });
    setTimeout(() => setNotification(null), 2500);
  };

  // Drop handler (kept for future drop-zone re-addition)
  const handleDrop = (e, slotKey) => {
    e.preventDefault();
    const colName = e.dataTransfer.getData('text/plain') || draggedColumn?.name;
    if (!colName) return;
    assignColumnToSlot(colName, slotKey);
  };

  // Remove column from target slot
  const handleUnassignColumn = (colName, slotKey) => {
    setMapping((prev) => {
      const slotConfig = TARGET_SLOTS.find((s) => s.key === slotKey);
      if (slotConfig?.isSingle) {
        return { ...prev, [slotKey]: '' };
      }
      return {
        ...prev,
        [slotKey]: (prev[slotKey] || []).filter((c) => c !== colName),
      };
    });
  };

  // Auto-Suggest Mapping
  const handleAutoSuggest = () => {
    if (!currentDataset?.columns) return;
    const auto = datasetService.autoSuggestMapping
      ? datasetService.autoSuggestMapping(currentDataset.columns)
      : {
          target: '',
          id: '',
          numerical: [],
          categorical: [],
          datetime: [],
          ignored: [],
        };
    setMapping(auto);
    setNotification({
      type: 'success',
      message: 'Heuristic auto-mapping applied to all columns.',
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Reset Mapping
  const handleResetMapping = () => {
    setMapping({
      target: '',
      id: '',
      numerical: [],
      categorical: [],
      datetime: [],
      ignored: [],
    });
    setColumnLabels({});
    setNotification({
      type: 'info',
      message: 'All column assignments cleared.',
    });
    setTimeout(() => setNotification(null), 2500);
  };

  // Save Mapping
  const handleSaveMapping = async () => {
    if (!currentDataset) return;
    try {
      await datasetService.saveFieldMapping(currentDataset.id, mapping);
      setNotification({
        type: 'success',
        message: `Field mapping saved successfully for "${currentDataset.name}".`,
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      alert('Failed to save mapping: ' + err.message);
    }
  };

  // Determine current slot of a column
  const getColumnAssignment = useCallback((colName) => {
    if (mapping.target === colName) return 'target';
    if (mapping.id === colName) return 'id';
    if (mapping.numerical?.includes(colName)) return 'numerical';
    if (mapping.categorical?.includes(colName)) return 'categorical';
    if (mapping.datetime?.includes(colName)) return 'datetime';
    if (mapping.ignored?.includes(colName)) return 'ignored';
    return null;
  }, [mapping]);

  // Filter source columns
  const filteredColumns = useMemo(() => {
    if (!currentDataset?.columns) return [];
    return currentDataset.columns.filter((c) => {
      const q = columnSearch.toLowerCase();
      const matchesSearch = !columnSearch.trim() || c.name.toLowerCase().includes(q);

      const assignedSlot = getColumnAssignment(c.name);
      if (typeFilter === 'UNMAPPED') {
        return matchesSearch && assignedSlot === null;
      }
      if (typeFilter === 'NUMERIC') {
        return matchesSearch && (c.type === 'Integer' || c.type === 'Float');
      }
      if (typeFilter === 'CATEGORICAL') {
        return matchesSearch && (c.type === 'Categorical' || c.type === 'String');
      }
      return matchesSearch;
    });
  }, [currentDataset, columnSearch, typeFilter, getColumnAssignment]);

  // Statistics
  const totalColsCount = currentDataset?.columns?.length || 0;
  const mappedCount = useMemo(() => {
    let count = 0;
    if (mapping.target) count += 1;
    if (mapping.id) count += 1;
    count += (mapping.numerical || []).length;
    count += (mapping.categorical || []).length;
    count += (mapping.datetime || []).length;
    count += (mapping.ignored || []).length;
    return count;
  }, [mapping]);
  const unmappedCount = Math.max(0, totalColsCount - mappedCount);

  // Fetch paginated preview when drawer opens
  const fetchDrawerPreview = useCallback(async (page, limit) => {
    if (!currentDataset) return;
    setPreviewLoading(true);
    try {
      const p = await datasetService.getDatasetPreview(currentDataset.id, { page, limit });
      setPreviewData(p);
    } catch (err) {
      console.error('Drawer preview error:', err);
    } finally {
      setPreviewLoading(false);
    }
  }, [currentDataset]);

  useEffect(() => {
    if (showPreviewDrawer && currentDataset) {
      fetchDrawerPreview(previewPage, previewPageSize);
    }
  }, [showPreviewDrawer, currentDataset, previewPage, previewPageSize, fetchDrawerPreview]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold">Loading Field Mapping Studio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 text-slate-100">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1">
            <Link to="/dashboard/datasets" className="hover:text-cyan-400 flex items-center space-x-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Datasets Catalog</span>
            </Link>
            <span>/</span>
            <span className="text-cyan-400 font-bold">Visual Field Mapping</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Schema & Feature Mapping
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40">
              Drag-and-Drop Ready
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Assign ingested source columns to machine learning target roles (Target Label, Identifiers, Numerical, and Categorical predictors).
          </p>
        </div>

        {/* Dataset Switcher & Global Actions */}
        <div className="flex items-center space-x-2.5 self-start md:self-auto flex-wrap gap-y-2">
          {/* Dataset Dropdown */}
          <div className="relative">
            <select
              value={selectedDatasetId}
              onChange={(e) => handleSelectDataset(e.target.value)}
              className="bg-[#0a0f24] border border-cyan-500/30 text-white rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-cyan-400 cursor-pointer shadow-md"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.columns?.length || 0} cols)
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Suggest Button */}
          <button
            type="button"
            onClick={handleAutoSuggest}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0a0f24] hover:bg-white/5 border border-cyan-500/30 text-cyan-300 hover:text-white font-bold text-xs transition-colors cursor-pointer"
            title="Auto-detect target, IDs, and predictor roles"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Auto-Suggest</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleResetMapping}
            className="p-2 rounded-xl bg-[#0a0f24] hover:bg-white/5 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Clear all assignments"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Save Mapping Button */}
          <button
            type="button"
            onClick={handleSaveMapping}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save Mapping</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-semibold animate-fade-in border ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40'
              : 'bg-cyan-950/80 text-cyan-200 border-cyan-500/40'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Status & Validation Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Target Status */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            mapping.target
              ? 'bg-rose-950/20 border-rose-500/40'
              : 'bg-amber-950/30 border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={mapping.target ? 'text-rose-300' : 'text-amber-300'}>
              Target Variable
            </span>
            <Crosshair className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-sm font-extrabold text-white truncate">
            {mapping.target ? (
              <span className="text-rose-400 font-mono">{mapping.target}</span>
            ) : (
              <span className="text-amber-400 text-xs font-semibold flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Unassigned (Required)
              </span>
            )}
          </div>
        </div>

        {/* Mapped vs Unmapped */}
        <div className="p-4 rounded-2xl bg-[#0a0f24] border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>Mapping Coverage</span>
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-extrabold text-white">
            {mappedCount} <span className="text-xs text-slate-400 font-normal">/ {totalColsCount} mapped ({unmappedCount} left)</span>
          </div>
        </div>

        {/* Feature Breakdown */}
        <div className="p-4 rounded-2xl bg-[#0a0f24] border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-semibold">
            <span>Predictor Features</span>
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xs font-bold text-white space-y-0.5">
            <div>
              <span className="text-cyan-300 font-mono">{(mapping.numerical || []).length}</span> Numerical â€¢{' '}
              <span className="text-purple-300 font-mono">{(mapping.categorical || []).length}</span> Categorical
            </div>
            <div className="text-slate-400 text-[11px]">
              {(mapping.datetime || []).length} Temporal â€¢ {(mapping.ignored || []).length} Excluded
            </div>
          </div>
        </div>

        {/* Quick Drawer Preview Toggle */}
        <div className="p-4 rounded-2xl bg-[#0a0f24] border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Source Inspection</span>
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          </div>
          <button
            type="button"
            onClick={() => setShowPreviewDrawer((prev) => !prev)}
            className="mt-2 inline-flex items-center justify-between text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-[#070b1c] hover:bg-cyan-950 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors cursor-pointer"
          >
            <span>{showPreviewDrawer ? 'Hide Records Table' : 'Inspect Tabular Records'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showPreviewDrawer ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expandable Preview Table Drawer */}
      {showPreviewDrawer && (
        <div className="animate-fade-in border-b border-slate-800 pb-4">
          <DatasetPreviewTable
            columns={currentDataset?.columns || []}
            rows={previewData?.rows || currentDataset?.sampleRows || []}
            title={currentDataset?.name}
            format={currentDataset?.format}
            totalRows={currentDataset?.rowCount}
            fileSizeBytes={currentDataset?.sizeBytes}
            isLoading={previewLoading}
            pagination={previewData?.pagination}
            onPageChange={(p) => setPreviewPage(p)}
            onPageSizeChange={(s) => {
              setPreviewPageSize(s);
              setPreviewPage(1);
            }}
            onClose={() => setShowPreviewDrawer(false)}
          />
        </div>
      )}

      {/* Drag & Drop Visual Mapping Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Source Dataset Columns */}
        <div className="lg:col-span-7 bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-5 shadow-xl space-y-4">`
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Source Columns</span>
                <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {currentDataset?.columns?.length || 0}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag cards to assign into target slots, or use the slot menu.
              </p>
            </div>
          </div>

          {/* Search & Filter Chips */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={columnSearch}
                onChange={(e) => setColumnSearch(e.target.value)}
                placeholder="Search source columns..."
                className="w-full text-xs bg-[#070b1c] text-white placeholder-slate-500 pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 transition-all font-medium"
              />
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              {['ALL', 'UNMAPPED', 'NUMERIC', 'CATEGORICAL'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    typeFilter === f
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-[#070b1c] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Source Column Cards (Draggable) */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredColumns.map((col) => {
              const currentSlot = getColumnAssignment(col.name);
              const slotInfo = TARGET_SLOTS.find((s) => s.key === currentSlot);
              const isDraggingThis = draggedColumn?.name === col.name;

              return (
                <div
                  key={col.name}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, col)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 rounded-2xl border transition-all duration-150 select-none cursor-grab active:cursor-grabbing group ${
                    isDraggingThis
                      ? 'opacity-40 scale-95 border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-500'
                      : currentSlot
                      ? 'bg-[#070b1c] border-slate-800 hover:border-slate-700'
                      : 'bg-[#0c1230] border-cyan-500/25 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      {/* Drag Handle Icon */}
                      <GripVertical className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0 cursor-grab" />

                      <div className="overflow-hidden">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-white truncate max-w-[170px]" title={col.name}>
                            {col.name}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                              col.type === 'Integer' || col.type === 'Float'
                                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                                : col.type === 'Boolean'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : 'bg-purple-950 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            {col.type || 'String'}
                          </span>
                        </div>

                        {/* Null count / status */}
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {col.missingCount > 0 ? (
                            <span className="text-amber-400 font-semibold">{col.missingCount} missing values</span>
                          ) : (
                            <span>Complete (0 nulls)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Assignment Dropdown Fallback */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {currentSlot ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${slotInfo?.badgeStyle}`}
                          title={`Assigned to ${slotInfo?.label}`}
                        >
                          {slotInfo?.key.toUpperCase()}
                        </span>
                      ) : (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) assignColumnToSlot(col.name, e.target.value);
                          }}
                          className="bg-[#050814] text-slate-300 border border-slate-800 text-[10px] font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer"
                        >
                          <option value="" disabled>
                            Assign to...
                          </option>
                          {TARGET_SLOTS.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label.split('/')[0]}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredColumns.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No source columns match filter "{columnSearch}".
              </div>
            )}
          </div>
        </div>

        {/* Middle Column (Mapping Overview â€” editable destination labels) */}
        <div className="lg:col-span-7 bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-5 shadow-xl space-y-4">`
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Mapping</span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {mappedCount} / {totalColsCount}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Source â†’ Destination</p>
          </div>

          {/* Column labels â€” header row */}
          {mappedCount > 0 && (
            <div className="flex items-center px-2 mb-1 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span className="flex-1">Source</span>
              <span className="w-4" />
              <span className="flex-1">Destination Name</span>
              <span className="w-4" />
              <span className="w-16 text-center">Role</span>
              <span className="w-5" />
            </div>
          )}

          {/* Mapping List */}
          <div className="max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 space-y-2">
            {Object.entries(mapping).flatMap(([slotKey, value]) => {
              const slotConfig = TARGET_SLOTS.find((s) => s.key === slotKey);
              if (!slotConfig) return [];
              if (slotConfig.isSingle) {
                if (!value) return [];
                return [{ source: value, slotKey, slotConfig }];
              }
              return (value || []).map((src) => ({ source: src, slotKey, slotConfig }));
            }).map((item) => (
              <div
                key={item.source + '-' + item.slotKey}
                className="flex items-center gap-2 p-2.5 rounded-2xl border border-slate-800 bg-[#070b1c] group hover:border-slate-700 transition-colors"
              >
                {/* Source column name */}
                <div className="flex-1 min-w-0">
                  <span
                    className="block font-mono text-xs font-bold text-white truncate"
                    title={item.source}
                  >
                    {item.source}
                  </span>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />

                {/* Editable destination label */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={columnLabels[item.source] ?? item.source}
                    onChange={(e) =>
                      setColumnLabels((prev) => ({
                        ...prev,
                        [item.source]: e.target.value,
                      }))
                    }
                    placeholder={item.source}
                    className="w-full bg-[#0c1230] text-cyan-200 placeholder-slate-500 text-xs font-semibold px-2 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                {/* Arrow to role */}
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />

                {/* Slot role badge */}
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shrink-0 w-16 text-center ${item.slotConfig.badgeStyle}`}
                  title={item.slotConfig.label}
                >
                  {item.slotKey.toUpperCase()}
                </span>

                {/* Unassign button */}
                <button
                  onClick={() => handleUnassignColumn(item.source, item.slotKey)}
                  className="shrink-0 p-1 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove mapping"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {mappedCount === 0 && (
              <div className="py-16 text-center space-y-2">
                <ArrowRight className="w-6 h-6 text-slate-700 mx-auto" />
                <p className="text-slate-500 text-xs">
                  Drag a source column into a target slot to create a mapping.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldMapping;
