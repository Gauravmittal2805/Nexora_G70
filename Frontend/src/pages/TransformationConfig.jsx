import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import datasetService from '../services/datasetService';
import {
  ArrowLeft,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Zap,
  Type,
  Hash,
  Filter,
  Scissors,
  ArrowUpDown,
  Save,
  Eye,
  X,
  Wifi,
  WifiOff,
  Cpu,
  FlaskConical,
} from 'lucide-react';

// ─── Transformation definitions ────────────────────────────────────────────────
const TRANSFORMATIONS = [
  {
    id: 'trim',
    label: 'Trim Whitespace',
    description: 'Remove leading and trailing whitespace from string values.',
    icon: Scissors,
    color: 'cyan',
    badgeStyle: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
    iconColor: 'text-cyan-400',
    apply: (val) => (typeof val === 'string' ? val.trim() : val),
    compatibleTypes: ['String', 'Categorical'],
  },
  {
    id: 'uppercase',
    label: 'Uppercase',
    description: 'Convert all string characters to uppercase.',
    icon: Type,
    color: 'violet',
    badgeStyle: 'bg-violet-950 text-violet-300 border-violet-500/40',
    iconColor: 'text-violet-400',
    apply: (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    compatibleTypes: ['String', 'Categorical'],
  },
  {
    id: 'lowercase',
    label: 'Lowercase',
    description: 'Convert all string characters to lowercase.',
    icon: Type,
    color: 'pink',
    badgeStyle: 'bg-pink-950 text-pink-300 border-pink-500/40',
    iconColor: 'text-pink-400',
    apply: (val) => (typeof val === 'string' ? val.toLowerCase() : val),
    compatibleTypes: ['String', 'Categorical'],
  },
  {
    id: 'toNumber',
    label: 'String to Number',
    description: 'Parse numeric strings into float/integer values. Non-parseable values become null.',
    icon: Hash,
    color: 'amber',
    badgeStyle: 'bg-amber-950 text-amber-300 border-amber-500/40',
    iconColor: 'text-amber-400',
    apply: (val) => {
      if (val === null || val === undefined || val === '') return null;
      const n = Number(String(val).trim());
      return isNaN(n) ? null : n;
    },
    compatibleTypes: ['String', 'Categorical', 'Integer', 'Float'],
  },
  {
    id: 'removeEmpty',
    label: 'Remove Empty Values',
    description: 'Replace empty strings, whitespace-only strings, and null values with null.',
    icon: Filter,
    color: 'rose',
    badgeStyle: 'bg-rose-950 text-rose-300 border-rose-500/40',
    iconColor: 'text-rose-400',
    apply: (val) => {
      if (val === null || val === undefined) return null;
      if (typeof val === 'string' && val.trim() === '') return null;
      return val;
    },
    compatibleTypes: ['String', 'Categorical', 'Integer', 'Float', 'Boolean', 'DateTime'],
  },
  {
    id: 'replace',
    label: 'Find & Replace',
    description: 'Replace all occurrences of a substring with another value.',
    icon: ArrowUpDown,
    color: 'emerald',
    badgeStyle: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
    iconColor: 'text-emerald-400',
    apply: (val, params) => {
      if (!params?.find || typeof val !== 'string') return val;
      return val.split(params.find).join(params.replace ?? '');
    },
    compatibleTypes: ['String', 'Categorical'],
    hasParams: true,
    paramFields: [
      { key: 'find', label: 'Find', placeholder: 'Text to find…' },
      { key: 'replace', label: 'Replace with', placeholder: 'Replacement…' },
    ],
  },
];

// ─── Apply all transformations in order to a single value (client-side) ────────
function applyChain(value, steps) {
  return steps.reduce((v, step) => {
    const def = TRANSFORMATIONS.find((t) => t.id === step.transformId);
    if (!def) return v;
    return def.apply(v, step.params || {});
  }, value);
}

// ─── Status dot ────────────────────────────────────────────────────────────────
function BackendStatusDot({ status }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-emerald-300">
        <Wifi className="w-3 h-3" />
        <span>Backend Connected</span>
      </span>
    );
  }
  if (status === 'offline') {
    return (
      <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-amber-300">
        <WifiOff className="w-3 h-3" />
        <span>Offline — Client Preview</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-slate-500">
      <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
      <span>Checking…</span>
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const TransformationConfig = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Dataset catalog
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(searchParams.get('datasetId') || '');
  const [currentDataset, setCurrentDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selected column
  const [selectedColumn, setSelectedColumn] = useState('');

  // Transformation steps for each column: { [colName]: [{id, transformId, params}] }
  const [columnSteps, setColumnSteps] = useState({});

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState({});

  // Backend apply state
  const [isApplying, setIsApplying] = useState(false);
  const [backendResult, setBackendResult] = useState(null); // null | { rows, source, columns }
  const [backendStatus, setBackendStatus] = useState('unknown'); // 'unknown' | 'connected' | 'offline'

  // Save pipeline state
  const [isSaving, setIsSaving] = useState(false);

  // UI
  const [notification, setNotification] = useState(null);
  const notifTimer = useRef(null);

  const showNotif = useCallback((type, message) => {
    clearTimeout(notifTimer.current);
    setNotification({ type, message });
    notifTimer.current = setTimeout(() => setNotification(null), 5000);
  }, []);

  // ── Load datasets ──────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    datasetService.fetchDatasets().then((res) => {
      if (!active) return;
      const list = Array.isArray(res) ? res : res.datasets || [];
      setDatasets(list);

      const paramId = searchParams.get('datasetId');
      const matched = list.find((d) => d.id === paramId || d.datasetId === paramId);
      const active_ = matched || list[0] || null;
      if (active_) {
        const id = active_.id || active_.datasetId;
        setSelectedDatasetId(id);
        setCurrentDataset(active_);
      }
      setIsLoading(false);

      // Check backend reachability
      setBackendStatus(res.isOffline ? 'offline' : 'connected');
    }).catch(() => {
      if (active) {
        setIsLoading(false);
        setBackendStatus('offline');
      }
    });
    return () => { active = false; };
  }, [searchParams]);

  const handleSelectDataset = (id) => {
    setSelectedDatasetId(id);
    setSearchParams({ datasetId: id });
    const ds = datasets.find((d) => d.id === id || d.datasetId === id);
    setCurrentDataset(ds || null);
    setSelectedColumn('');
    setColumnSteps({});
    setShowPreview(false);
    setBackendResult(null);
  };

  // ── Step management ────────────────────────────────────────────────────────
  const addStep = useCallback((colName, transformId) => {
    setColumnSteps((prev) => {
      const existing = prev[colName] || [];
      const newStep = { id: `${Date.now()}-${Math.random()}`, transformId, params: {} };
      return { ...prev, [colName]: [...existing, newStep] };
    });
    setBackendResult(null);
  }, []);

  const removeStep = useCallback((colName, stepId) => {
    setColumnSteps((prev) => ({
      ...prev,
      [colName]: (prev[colName] || []).filter((s) => s.id !== stepId),
    }));
    setBackendResult(null);
  }, []);

  const updateStepParam = useCallback((colName, stepId, paramKey, value) => {
    setColumnSteps((prev) => ({
      ...prev,
      [colName]: (prev[colName] || []).map((s) =>
        s.id === stepId ? { ...s, params: { ...s.params, [paramKey]: value } } : s
      ),
    }));
    setBackendResult(null);
  }, []);

  const clearColumnSteps = useCallback((colName) => {
    setColumnSteps((prev) => ({ ...prev, [colName]: [] }));
    setBackendResult(null);
  }, []);

  // ── Client-side preview computation ───────────────────────────────────────
  const previewData = useMemo(() => {
    if (!currentDataset) return {};
    const sampleRows = currentDataset.sampleRows || [];
    const result = {};

    Object.entries(columnSteps).forEach(([colName, steps]) => {
      if (!steps || steps.length === 0) return;
      const samples = sampleRows.slice(0, 8).map((row) => ({
        original: row[colName],
        transformed: applyChain(row[colName], steps),
      }));
      result[colName] = samples;
    });
    return result;
  }, [currentDataset, columnSteps]);

  const columnsWithSteps = useMemo(
    () => Object.entries(columnSteps).filter(([, steps]) => steps && steps.length > 0),
    [columnSteps]
  );

  // ── Apply Transformations via Backend ─────────────────────────────────────
  const handleApply = async () => {
    if (columnsWithSteps.length === 0) return;

    setIsApplying(true);
    setBackendResult(null);

    const result = await datasetService.applyTransformations(
      selectedDatasetId,
      columnSteps,
      10
    );

    if (result.success && !result.isOffline) {
      // Build per-column { original, transformed } pairs from returned rows
      const sampleRows = currentDataset?.sampleRows || [];
      const colPreviews = {};

      columnsWithSteps.forEach(([colName]) => {
        colPreviews[colName] = sampleRows.slice(0, result.transformedRows.length).map((orig, i) => ({
          original: orig[colName],
          transformed: result.transformedRows[i]?.[colName] ?? null,
        }));
      });

      setBackendResult({ source: 'backend', colPreviews });
      setBackendStatus('connected');
      showNotif('success', `Transformations applied via backend — ${result.count} rows processed.`);
    } else {
      // Offline fallback: apply client-side
      const sampleRows = currentDataset?.sampleRows || [];
      const colPreviews = {};
      columnsWithSteps.forEach(([colName, steps]) => {
        colPreviews[colName] = sampleRows.slice(0, 8).map((row) => ({
          original: row[colName],
          transformed: applyChain(row[colName], steps),
        }));
      });
      setBackendResult({ source: 'client', colPreviews });
      if (result.isOffline) setBackendStatus('offline');
      showNotif(
        'warn',
        `Backend unreachable — showing client-side preview. ${result.error || ''}`
      );
    }

    setIsApplying(false);
  };

  // ── Save Pipeline (persist config) ────────────────────────────────────────
  const handleSave = async () => {
    if (columnsWithSteps.length === 0) return;
    setIsSaving(true);
    try {
      // Build a named config object to persist (future: save to backend)
      const pipelineConfig = {
        datasetId: selectedDatasetId,
        savedAt: new Date().toISOString(),
        columns: Object.fromEntries(
          columnsWithSteps.map(([col, steps]) => [
            col,
            steps.map((s) => ({ type: s.transformId, params: s.params })),
          ])
        ),
      };
      // Store locally as a lightweight persist mechanism
      try {
        const key = `nexora_transform_pipeline_${selectedDatasetId}`;
        localStorage.setItem(key, JSON.stringify(pipelineConfig));
      } catch {
        // quota exceeded – ignore
      }
      showNotif('success', `Pipeline saved for "${currentDataset?.name}". ${columnsWithSteps.length} column(s) configured.`);
    } catch {
      showNotif('error', 'Failed to save transformation pipeline.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentColumn = currentDataset?.columns?.find((c) => c.name === selectedColumn);
  const currentSteps = columnSteps[selectedColumn] || [];

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-12 text-center space-y-4 text-slate-400">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold">Loading Transformation Studio…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 text-slate-100">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-1">
            <Link to="/dashboard/datasets" className="hover:text-cyan-400 flex items-center space-x-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Datasets</span>
            </Link>
            <span>/</span>
            <span className="text-cyan-400 font-bold">Transformation Config</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Transformation Studio
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
              Data Prep
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Configure per-column transformations, chain multiple operations, and preview original vs. transformed sample values.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2 self-start md:self-auto">
          {/* Dataset selector */}
          <select
            value={selectedDatasetId}
            onChange={(e) => handleSelectDataset(e.target.value)}
            className="bg-[#0a0f24] border border-cyan-500/30 text-white rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {datasets.length === 0 && <option value="">No datasets</option>}
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Preview toggle */}
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border font-bold text-xs transition-colors cursor-pointer ${
              showPreview
                ? 'bg-indigo-950 border-indigo-500/40 text-indigo-300'
                : 'bg-[#0a0f24] border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>

          {/* Apply Transformations button (backend) */}
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || columnsWithSteps.length === 0}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all cursor-pointer disabled:opacity-40"
          >
            {isApplying ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Cpu className="w-3.5 h-3.5" />
            )}
            <span>{isApplying ? 'Applying…' : 'Apply Transformations'}</span>
          </button>

          {/* Save Pipeline button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || columnsWithSteps.length === 0}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-40"
          >
            {isSaving ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? 'Saving…' : 'Save Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* ── Notification ──────────────────────────────────────────────────── */}
      {notification && (
        <div className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs font-semibold animate-fade-in ${
          notification.type === 'success'
            ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/40'
            : notification.type === 'warn'
            ? 'bg-amber-950/80 text-amber-200 border-amber-500/40'
            : 'bg-rose-950/80 text-rose-200 border-rose-500/40'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success'
              ? <CheckCircle2 className="w-4 h-4 shrink-0" />
              : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Backend status banner ──────────────────────────────────────────── */}
      <div className={`flex items-center justify-between p-3.5 rounded-2xl border text-xs ${
        backendStatus === 'connected'
          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
          : backendStatus === 'offline'
          ? 'bg-amber-950/20 border-amber-500/20 text-amber-300'
          : 'bg-indigo-950/20 border-indigo-500/20 text-indigo-300'
      }`}>
        <div className="flex items-center space-x-2">
          <FlaskConical className="w-4 h-4 shrink-0" />
          <span>
            <span className="font-bold">Transformation Engine — </span>
            {backendStatus === 'connected' && (
              <span>Backend connected. Click <span className="font-mono font-bold">Apply Transformations</span> to process via API and see real output.</span>
            )}
            {backendStatus === 'offline' && (
              <span>Backend offline — previews run client-side. Start the backend on port <span className="font-mono font-bold">5001</span> to enable server-side processing.</span>
            )}
            {backendStatus === 'unknown' && (
              <span>Checking backend availability…</span>
            )}
          </span>
        </div>
        <BackendStatusDot status={backendStatus} />
      </div>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      {currentDataset && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Dataset', value: currentDataset.name, sub: currentDataset.format },
            { label: 'Columns', value: currentDataset.columns?.length || 0, sub: 'available' },
            { label: 'Configured', value: columnsWithSteps.length, sub: 'columns' },
            { label: 'Total Steps', value: Object.values(columnSteps).reduce((a, s) => a + (s?.length || 0), 0), sub: 'transformations' },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-[#0a0f24] border border-cyan-500/20">
              <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest mb-1">{s.label}</div>
              <div className="text-lg font-extrabold text-white truncate">{s.value}</div>
              <div className="text-[11px] text-slate-500">{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main 2-panel layout ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left: Column selector */}
        <div className="lg:col-span-3 bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-5 shadow-xl space-y-3">
          <h2 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
            Columns
            <span className="ml-2 text-xs font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {currentDataset?.columns?.length || 0}
            </span>
          </h2>

          {!currentDataset && (
            <p className="text-xs text-slate-500 text-center py-8">Select a dataset above.</p>
          )}

          <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {(currentDataset?.columns || []).map((col) => {
              const steps = columnSteps[col.name] || [];
              const isSelected = selectedColumn === col.name;
              const hasBackendResult = backendResult?.colPreviews?.[col.name];
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => setSelectedColumn(col.name)}
                  className={`w-full text-left px-3 py-2.5 rounded-2xl border transition-all text-xs font-semibold cursor-pointer group ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/50 text-white'
                      : 'bg-[#070b1c] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate font-mono" title={col.name}>{col.name}</span>
                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {steps.length > 0 && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                          {steps.length}
                        </span>
                      )}
                      {hasBackendResult && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                          ✓
                        </span>
                      )}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                        col.type === 'Integer' || col.type === 'Float'
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                          : col.type === 'Boolean'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-purple-950 text-purple-300 border-purple-500/40'
                      }`}>
                        {col.type?.slice(0, 3) || 'STR'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Transformation builder */}
        <div className="lg:col-span-9 space-y-5">

          {/* Column header */}
          {!selectedColumn ? (
            <div className="bg-[#0a0f24] rounded-3xl border border-dashed border-slate-700 p-16 text-center space-y-3">
              <Zap className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-slate-400 font-semibold text-sm">Select a column from the left panel to configure transformations.</p>
            </div>
          ) : (
            <>
              {/* Column info bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0a0f24] border border-cyan-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center">
                    <Type className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-white font-mono">{selectedColumn}</div>
                    <div className="text-xs text-slate-400">
                      Type: <span className="text-cyan-300 font-bold">{currentColumn?.type || 'Unknown'}</span>
                      {currentColumn?.missingCount > 0 && (
                        <span className="ml-3 text-amber-400 font-semibold">{currentColumn.missingCount} missing values</span>
                      )}
                    </div>
                  </div>
                </div>
                {currentSteps.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clearColumnSteps(selectedColumn)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Step chain */}
              <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Transformation Pipeline</span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      {currentSteps.length} step{currentSteps.length !== 1 ? 's' : ''}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Applied in order ↓</p>
                </div>

                {/* Existing steps */}
                {currentSteps.length === 0 && (
                  <div className="py-10 text-center space-y-2">
                    <Zap className="w-7 h-7 text-slate-700 mx-auto" />
                    <p className="text-slate-500 text-xs">No steps yet — add a transformation below.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {currentSteps.map((step, idx) => {
                    const def = TRANSFORMATIONS.find((t) => t.id === step.transformId);
                    if (!def) return null;
                    const Icon = def.icon;
                    return (
                      <div
                        key={step.id}
                        className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#070b1c] border border-slate-800 group"
                      >
                        {/* Step number + drag handle (visual) */}
                        <div className="flex flex-col items-center space-y-1 shrink-0 pt-0.5">
                          <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
                          <span className="text-[10px] text-slate-600 font-bold">{idx + 1}</span>
                        </div>

                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${def.badgeStyle}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        {/* Info + params */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-sm font-bold text-white">{def.label}</span>
                              <p className="text-xs text-slate-400 mt-0.5">{def.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeStep(selectedColumn, step.id)}
                              className="shrink-0 p-1.5 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Remove step"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Param fields (e.g. Find & Replace) */}
                          {def.hasParams && (
                            <div className="grid grid-cols-2 gap-2">
                              {def.paramFields.map((pf) => (
                                <div key={pf.key}>
                                  <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
                                    {pf.label}
                                  </label>
                                  <input
                                    type="text"
                                    value={step.params?.[pf.key] ?? ''}
                                    onChange={(e) => updateStepParam(selectedColumn, step.id, pf.key, e.target.value)}
                                    placeholder={pf.placeholder}
                                    className="w-full bg-[#0c1230] text-white placeholder-slate-600 text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400 transition-colors"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add step panel */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Add Transformation</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TRANSFORMATIONS.map((t) => {
                      const Icon = t.icon;
                      const alreadyAdded = currentSteps.some((s) => s.transformId === t.id && !t.hasParams);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={alreadyAdded && !t.hasParams}
                          onClick={() => addStep(selectedColumn, t.id)}
                          className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                            alreadyAdded && !t.hasParams
                              ? 'opacity-40 cursor-not-allowed bg-[#070b1c] border-slate-800 text-slate-500'
                              : `bg-[#070b1c] hover:bg-[#0c1230] border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white`
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${t.iconColor}`} />
                          <span>{t.label}</span>
                          {alreadyAdded && !t.hasParams && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── Backend Result Panel (for selected column) ──────────────── */}
              {backendResult?.colPreviews?.[selectedColumn] && (
                <div className={`rounded-3xl border p-5 shadow-xl space-y-4 ${
                  backendResult.source === 'backend'
                    ? 'bg-[#0a0f24] border-emerald-500/20'
                    : 'bg-[#0a0f24] border-amber-500/20'
                }`}>
                  <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                    <Cpu className={`w-4 h-4 ${backendResult.source === 'backend' ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <h2 className="text-sm font-bold text-white">
                      {backendResult.source === 'backend' ? 'Backend Result' : 'Client-side Preview'} —{' '}
                      <span className={`font-mono ${backendResult.source === 'backend' ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {selectedColumn}
                      </span>
                    </h2>
                    <span className={`ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      backendResult.source === 'backend'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border-amber-500/40'
                    }`}>
                      {backendResult.source === 'backend' ? '✓ Via Backend API' : '⚡ Client Fallback'}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left px-4 py-2.5 text-slate-400 font-bold uppercase tracking-widest bg-[#070b1c] w-8">#</th>
                          <th className="text-left px-4 py-2.5 text-slate-400 font-bold uppercase tracking-widest bg-[#070b1c]">Original Value</th>
                          <th className="text-left px-4 py-2.5 text-cyan-400 font-bold uppercase tracking-widest bg-[#070b1c]">→ Transformed</th>
                          <th className="text-left px-4 py-2.5 text-slate-400 font-bold uppercase tracking-widest bg-[#070b1c]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backendResult.colPreviews[selectedColumn].map((row, i) => {
                          const changed = String(row.original) !== String(row.transformed);
                          const isNull = row.transformed === null || row.transformed === undefined;
                          return (
                            <tr key={i} className={`border-b border-slate-800/50 ${changed ? 'bg-indigo-950/10' : ''}`}>
                              <td className="px-4 py-2.5 text-slate-600 font-mono">{i + 1}</td>
                              <td className="px-4 py-2.5 font-mono text-slate-300">
                                {row.original === null || row.original === undefined
                                  ? <span className="text-slate-600 italic">null</span>
                                  : String(row.original)}
                              </td>
                              <td className={`px-4 py-2.5 font-mono font-bold ${isNull ? 'text-rose-400 italic' : changed ? 'text-cyan-300' : 'text-slate-400'}`}>
                                {isNull ? 'null' : String(row.transformed)}
                              </td>
                              <td className="px-4 py-2.5">
                                {isNull
                                  ? <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40">Nullified</span>
                                  : changed
                                  ? <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                                      <Zap className="w-2.5 h-2.5" /><span>Modified</span>
                                    </span>
                                  : <span className="text-slate-600 text-[10px]">Unchanged</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Inline client-side preview (when no backend result yet) ── */}
              {!backendResult && currentSteps.length > 0 && previewData[selectedColumn] && (
                <div className="bg-[#0a0f24] rounded-3xl border border-indigo-500/20 p-5 shadow-xl space-y-4">
                  <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-bold text-white">
                      Live Preview — <span className="font-mono text-indigo-300">{selectedColumn}</span>
                    </h2>
                    <span className="text-xs text-slate-400 ml-auto">Client-side · {previewData[selectedColumn]?.length} rows</span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left px-4 py-2.5 text-slate-400 font-bold uppercase tracking-widest bg-[#070b1c] w-8">#</th>
                          <th className="text-left px-4 py-2.5 text-slate-400 font-bold uppercase tracking-widest bg-[#070b1c]">Original Value</th>
                          <th className="text-left px-4 py-2.5 text-cyan-400 font-bold uppercase tracking-widest bg-[#070b1c]">→ Transformed</th>
                          <th className="text-left px-4 py-2.5 text-slate-400 font-bold uppercase tracking-widest bg-[#070b1c]">Changed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData[selectedColumn].map((row, i) => {
                          const changed = String(row.original) !== String(row.transformed);
                          const isNull = row.transformed === null;
                          return (
                            <tr key={i} className={`border-b border-slate-800/50 ${changed ? 'bg-indigo-950/10' : ''}`}>
                              <td className="px-4 py-2.5 text-slate-600 font-mono">{i + 1}</td>
                              <td className="px-4 py-2.5 font-mono text-slate-300">
                                {row.original === null || row.original === undefined
                                  ? <span className="text-slate-600 italic">null</span>
                                  : String(row.original)}
                              </td>
                              <td className={`px-4 py-2.5 font-mono font-bold ${isNull ? 'text-rose-400 italic' : changed ? 'text-cyan-300' : 'text-slate-400'}`}>
                                {isNull ? 'null' : String(row.transformed)}
                              </td>
                              <td className="px-4 py-2.5">
                                {changed
                                  ? <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                                      <Zap className="w-2.5 h-2.5" /><span>Modified</span>
                                    </span>
                                  : <span className="text-slate-600 text-[10px]">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Backend Apply Result: All Columns ─────────────────────────────── */}
      {backendResult && columnsWithSteps.length > 0 && (
        <div className={`rounded-3xl border p-5 shadow-xl space-y-5 ${
          backendResult.source === 'backend'
            ? 'bg-[#0a0f24] border-emerald-500/20'
            : 'bg-[#0a0f24] border-amber-500/20'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Cpu className={`w-4 h-4 ${backendResult.source === 'backend' ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{backendResult.source === 'backend' ? 'Applied Output' : 'Client Preview'} — All Columns</span>
              <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                backendResult.source === 'backend'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border-amber-500/40'
              }`}>
                {columnsWithSteps.length} column{columnsWithSteps.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <div className="flex items-center space-x-3">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                backendResult.source === 'backend'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950 text-amber-300 border-amber-500/40'
              }`}>
                {backendResult.source === 'backend' ? '✓ Backend API' : '⚡ Client Fallback'}
              </span>
              <button
                type="button"
                onClick={() => setBackendResult(null)}
                className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {columnsWithSteps.map(([colName]) => {
            const rows = backendResult.colPreviews?.[colName] || [];
            const isExpanded = previewExpanded[`result_${colName}`] !== false;
            const steps = columnSteps[colName] || [];
            return (
              <div key={colName} className="rounded-2xl border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPreviewExpanded((p) => ({ ...p, [`result_${colName}`]: !isExpanded }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#070b1c] hover:bg-[#0c1230] transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-white">{colName}</span>
                    <div className="flex items-center space-x-1.5">
                      {steps.map((s) => {
                        const def = TRANSFORMATIONS.find((t) => t.id === s.transformId);
                        return (
                          <span key={s.id} className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${def?.badgeStyle || ''}`}>
                            {def?.label || s.transformId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-[#070b1c]/50">
                          <th className="text-left px-4 py-2 text-slate-500 font-bold w-8">#</th>
                          <th className="text-left px-4 py-2 text-slate-400 font-bold">Original</th>
                          <th className="text-left px-4 py-2 text-cyan-400 font-bold">Transformed</th>
                          <th className="text-left px-4 py-2 text-slate-400 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 8).map((row, i) => {
                          const changed = String(row.original) !== String(row.transformed);
                          const isNull = row.transformed === null || row.transformed === undefined;
                          return (
                            <tr key={i} className={`border-b border-slate-800/40 ${changed ? 'bg-indigo-950/10' : ''}`}>
                              <td className="px-4 py-2 text-slate-600 font-mono">{i + 1}</td>
                              <td className="px-4 py-2 font-mono text-slate-300">
                                {row.original === null ? <span className="text-slate-600 italic">null</span> : String(row.original)}
                              </td>
                              <td className={`px-4 py-2 font-mono font-bold ${isNull ? 'text-rose-400 italic' : changed ? 'text-cyan-300' : 'text-slate-400'}`}>
                                {isNull ? 'null' : String(row.transformed)}
                              </td>
                              <td className="px-4 py-2">
                                {isNull
                                  ? <span className="text-[10px] font-bold text-rose-400">Nullified</span>
                                  : changed
                                  ? <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                                      <Zap className="w-2.5 h-2.5" /><span>Modified</span>
                                    </span>
                                  : <span className="text-slate-600 text-[10px]">Unchanged</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Global client preview: all configured columns ──────────────────── */}
      {showPreview && columnsWithSteps.length > 0 && !backendResult && (
        <div className="bg-[#0a0f24] rounded-3xl border border-indigo-500/20 p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Full Pipeline Preview</span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                {columnsWithSteps.length} column{columnsWithSteps.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <p className="text-xs text-slate-400">Client-side · Original vs. transformed · First 5 rows</p>
          </div>

          {columnsWithSteps.map(([colName]) => {
            const rows = previewData[colName] || [];
            const isExpanded = previewExpanded[colName] !== false;
            const steps = columnSteps[colName] || [];
            return (
              <div key={colName} className="rounded-2xl border border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPreviewExpanded((p) => ({ ...p, [colName]: !isExpanded }))}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#070b1c] hover:bg-[#0c1230] transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm font-bold text-white">{colName}</span>
                    <div className="flex items-center space-x-1.5">
                      {steps.map((s) => {
                        const def = TRANSFORMATIONS.find((t) => t.id === s.transformId);
                        return (
                          <span key={s.id} className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${def?.badgeStyle || ''}`}>
                            {def?.label || s.transformId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-[#070b1c]/50">
                          <th className="text-left px-4 py-2 text-slate-500 font-bold w-8">#</th>
                          <th className="text-left px-4 py-2 text-slate-400 font-bold">Original</th>
                          <th className="text-left px-4 py-2 text-cyan-400 font-bold">Transformed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 5).map((row, i) => {
                          const changed = String(row.original) !== String(row.transformed);
                          return (
                            <tr key={i} className={`border-b border-slate-800/40 ${changed ? 'bg-indigo-950/10' : ''}`}>
                              <td className="px-4 py-2 text-slate-600 font-mono">{i + 1}</td>
                              <td className="px-4 py-2 font-mono text-slate-300">
                                {row.original === null ? <span className="text-slate-600 italic">null</span> : String(row.original)}
                              </td>
                              <td className={`px-4 py-2 font-mono font-bold ${row.transformed === null ? 'text-rose-400 italic' : changed ? 'text-cyan-300' : 'text-slate-400'}`}>
                                {row.transformed === null ? 'null' : String(row.transformed)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TransformationConfig;
