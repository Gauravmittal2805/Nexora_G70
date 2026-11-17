import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link, useNavigate, useParams } from 'react-router-dom';
import datasetService from '../services/datasetService';
import DatasetPreviewTable from '../components/datasets/DatasetPreviewTable';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
  Link2,
  Play,
  GripVertical,
  Target,
  ArrowRight,
  Database,
  X,
  Check,
  ChevronRight,
  Save,
  Wand2,
  SlidersHorizontal,
  RefreshCw,
  FolderOpen,
  ArrowLeft,
} from 'lucide-react';

const TRANSFORMATION_OPTIONS = [
  { id: 'none', label: 'Pass-through (Raw)', description: 'Keep source value as-is' },
  { id: 'trim', label: 'Trim Whitespace', description: 'Remove leading and trailing spaces' },
  { id: 'uppercase', label: 'UPPERCASE', description: 'Convert all letters to uppercase' },
  { id: 'lowercase', label: 'lowercase', description: 'Convert all letters to lowercase' },
  { id: 'to_number', label: 'Cast to Number', description: 'Parse string into integer/float' },
  { id: 'to_boolean', label: 'Cast to Boolean', description: 'Parse yes/no/true/false to boolean' },
  { id: 'remove_empty', label: 'Remove Empty Cells', description: 'Strip null and empty string values' },
];

const FieldMapping = () => {
  const { id: routeDatasetId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Tab: 'workspace' | 'transformations' | 'preview' | 'engine'
  const [activeTab, setActiveTab] = useState('workspace');

  // Catalog & active dataset state
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(
    routeDatasetId || searchParams.get('datasetId') || ''
  );
  const [currentDataset, setCurrentDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search in source fields
  const [sourceSearch, setSourceSearch] = useState('');

  // Destination fields list: [{ id, name, type, required }]
  const [destinationFields, setDestinationFields] = useState([]);
  const [newDestFieldName, setNewDestFieldName] = useState('');
  const [newDestFieldType, setNewDestFieldType] = useState('String');

  // Active Connections: [{ id, sourceField, destField, transformation }]
  const [connections, setConnections] = useState([]);

  // Selection states for click-to-connect workflow
  const [selectedSourceCol, setSelectedSourceCol] = useState(null);
  const [selectedDestField, setSelectedDestField] = useState(null);

  // Live Output Preview state
  const [previewRows, setPreviewRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Notifications
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load dataset mapping and initialize connections/destinations
  const loadDatasetState = useCallback((dataset) => {
    if (!dataset) return;

    const sourceCols = dataset.columns || [];

    // Check if dataset has saved connections in mapping or storage
    const savedConnections = dataset.mapping?.connections || [];
    const savedDestinations = dataset.mapping?.destinations || [];

    if (savedConnections.length > 0) {
      setConnections(savedConnections);
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
      // Initialize with destinations matching source columns
      const initialDestinations = sourceCols.map((c) => ({
        id: `dest-${c.name}`,
        name: c.name,
        type: c.type || 'String',
      }));

      // Heuristically map exact name matches by default
      const initialConnections = sourceCols.map((c) => ({
        id: `conn-${c.name}-${c.name}`,
        sourceField: c.name,
        destField: c.name,
        transformation: 'none',
      }));

      setDestinationFields(initialDestinations);
      setConnections(initialConnections);
    }
  }, []);

  // Fetch datasets catalog
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

  // Dataset switcher
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

  // Source columns
  const sourceColumns = useMemo(() => {
    return currentDataset?.columns || [];
  }, [currentDataset]);

  // Filtered source columns by search
  const filteredSourceColumns = useMemo(() => {
    if (!sourceSearch.trim()) return sourceColumns;
    const q = sourceSearch.toLowerCase().trim();
    return sourceColumns.filter((col) => col.name.toLowerCase().includes(q));
  }, [sourceColumns, sourceSearch]);

  // Source column mapping lookup: { [sourceColName]: connectionObj }
  const sourceToConnectionMap = useMemo(() => {
    const map = {};
    connections.forEach((conn) => {
      map[conn.sourceField] = conn;
    });
    return map;
  }, [connections]);

  // Destination field mapping lookup: { [destFieldName]: connectionObj }
  const destToConnectionMap = useMemo(() => {
    const map = {};
    connections.forEach((conn) => {
      map[conn.destField] = conn;
    });
    return map;
  }, [connections]);

  // Stats
  const totalSourceCount = sourceColumns.length;
  const mappedSourceCount = useMemo(() => {
    return Object.keys(sourceToConnectionMap).length;
  }, [sourceToConnectionMap]);
  const unmappedSourceCount = Math.max(0, totalSourceCount - mappedSourceCount);

  const totalDestCount = destinationFields.length;
  const connectedDestCount = useMemo(() => {
    return Object.keys(destToConnectionMap).length;
  }, [destToConnectionMap]);

  const transformationsCount = useMemo(() => {
    return connections.filter((c) => c.transformation && c.transformation !== 'none').length;
  }, [connections]);

  // Connect source and destination
  const createConnection = useCallback(
    (sourceName, destName) => {
      if (!sourceName || !destName) return;

      setConnections((prev) => {
        // Remove existing connections for this source or this destination
        const filtered = prev.filter(
          (c) => c.sourceField !== sourceName && c.destField !== destName
        );

        return [
          ...filtered,
          {
            id: `conn-${sourceName}-${destName}-${Date.now()}`,
            sourceField: sourceName,
            destField: destName,
            transformation: 'none',
          },
        ];
      });

      setSelectedSourceCol(null);
      setSelectedDestField(null);
      showNotification('success', `Connected "${sourceName}" → "${destName}".`);
    },
    []
  );

  // Click on a source column
  const handleSourceColumnClick = (colName) => {
    if (selectedDestField) {
      // Connect with already selected destination
      createConnection(colName, selectedDestField);
    } else {
      // Toggle selection
      setSelectedSourceCol((prev) => (prev === colName ? null : colName));
    }
  };

  // Click on a destination field
  const handleDestFieldClick = (destName) => {
    if (selectedSourceCol) {
      // Connect with already selected source
      createConnection(selectedSourceCol, destName);
    } else {
      // Toggle selection
      setSelectedDestField((prev) => (prev === destName ? null : destName));
    }
  };

  // Add new destination field
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
      type: newDestFieldType,
    };

    setDestinationFields((prev) => [...prev, newField]);
    setNewDestFieldName('');

    // If a source field was selected, connect automatically
    if (selectedSourceCol) {
      createConnection(selectedSourceCol, trimmed);
    } else {
      showNotification('success', `Destination field "${trimmed}" added.`);
    }
  };

  // Remove a destination field
  const handleRemoveDestinationField = (destName) => {
    setDestinationFields((prev) => prev.filter((f) => f.name !== destName));
    setConnections((prev) => prev.filter((c) => c.destField !== destName));
    if (selectedDestField === destName) setSelectedDestField(null);
    showNotification('info', `Removed destination field "${destName}".`);
  };

  // Remove a connection
  const handleRemoveConnection = (connId) => {
    setConnections((prev) => prev.filter((c) => c.id !== connId));
    showNotification('info', 'Connection removed.');
  };

  // Update transformation for a connection
  const handleUpdateTransformation = (connId, transformation) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === connId ? { ...c, transformation } : c))
    );
  };

  // Auto-map all unmapped fields with same name or create destinations
  const handleAutoMapAll = () => {
    const newDests = [...destinationFields];
    const newConns = [...connections];

    sourceColumns.forEach((col) => {
      // If not already mapped
      if (!newConns.some((c) => c.sourceField === col.name)) {
        let matchingDest = newDests.find((d) => d.name.toLowerCase() === col.name.toLowerCase());
        if (!matchingDest) {
          matchingDest = {
            id: `dest-${col.name}`,
            name: col.name,
            type: col.type || 'String',
          };
          newDests.push(matchingDest);
        }

        newConns.push({
          id: `conn-${col.name}-${matchingDest.name}`,
          sourceField: col.name,
          destField: matchingDest.name,
          transformation: 'none',
        });
      }
    });

    setDestinationFields(newDests);
    setConnections(newConns);
    showNotification('success', 'Auto-mapped all source fields to destinations.');
  };

  // Discard changes & restore from dataset initial state
  const handleDiscardChanges = () => {
    if (currentDataset) {
      loadDatasetState(currentDataset);
      setSelectedSourceCol(null);
      setSelectedDestField(null);
      showNotification('info', 'Discarded uncommitted changes.');
    }
  };

  // Clear all connections and destinations
  const handleClearAll = () => {
    setConnections([]);
    setDestinationFields([]);
    setSelectedSourceCol(null);
    setSelectedDestField(null);
    showNotification('warning', 'Cleared all connections and destination fields.');
  };

  // Save pipeline configuration
  const handleSavePipeline = async () => {
    if (!currentDataset) return;
    setIsSaving(true);

    try {
      // Build standard mapping object for backward compatibility
      const targetCol = connections.find((c) =>
        /target|label|churn|price|alert/i.test(c.destField)
      )?.sourceField || '';

      const idCol = connections.find((c) =>
        /id$|^id|_id$/i.test(c.destField)
      )?.sourceField || '';

      const numericalCols = connections
        .filter((c) => {
          const dest = destinationFields.find((d) => d.name === c.destField);
          return (
            dest?.type === 'Integer' ||
            dest?.type === 'Float' ||
            dest?.type === 'number'
          );
        })
        .map((c) => c.sourceField);

      const categoricalCols = connections
        .filter((c) => !numericalCols.includes(c.sourceField) && c.sourceField !== targetCol && c.sourceField !== idCol)
        .map((c) => c.sourceField);

      const payload = {
        target: targetCol,
        id: idCol,
        numerical: numericalCols,
        categorical: categoricalCols,
        datetime: [],
        ignored: sourceColumns
          .filter((c) => !connections.some((conn) => conn.sourceField === c.name))
          .map((c) => c.name),
        connections,
        destinations: destinationFields,
        updatedAt: new Date().toISOString(),
      };

      await datasetService.saveFieldMapping(currentDataset.id, payload);
      showNotification('success', `Pipeline saved successfully for "${currentDataset.name}".`);
    } catch (err) {
      console.error('Error saving pipeline:', err);
      showNotification('error', `Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Compute live preview rows
  const generatePreview = useCallback(() => {
    if (!currentDataset) return;
    setPreviewLoading(true);

    const sampleRows = currentDataset.sampleRows || currentDataset.previewData || [];

    setTimeout(() => {
      const transformed = sampleRows.map((row) => {
        const outputRow = {};

        connections.forEach((conn) => {
          let val = row[conn.sourceField];

          // Apply transformation
          if (conn.transformation === 'trim' && typeof val === 'string') {
            val = val.trim();
          } else if (conn.transformation === 'uppercase' && typeof val === 'string') {
            val = val.toUpperCase();
          } else if (conn.transformation === 'lowercase' && typeof val === 'string') {
            val = val.toLowerCase();
          } else if (conn.transformation === 'to_number') {
            val = Number(val) || 0;
          } else if (conn.transformation === 'to_boolean') {
            val = Boolean(val);
          }

          outputRow[conn.destField] = val !== undefined ? val : null;
        });

        return outputRow;
      });

      setPreviewRows(transformed);
      setPreviewLoading(false);
    }, 150);
  }, [currentDataset, connections]);

  // Load preview when tab is preview
  useEffect(() => {
    if (activeTab === 'preview') {
      generatePreview();
    }
  }, [activeTab, generatePreview]);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-4 bg-[#0c122b]/90 border border-cyan-500/20 min-h-[500px] flex flex-col items-center justify-center rounded-3xl shadow-2xl">
        <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading Pipeline Workspace...</p>
      </div>
    );
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

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

      {/* TOP HEADER & METADATA BANNER (Dashboard Cosmic Theme) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c122b]/95 border border-cyan-500/25 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Dataset Identity & Metadata */}
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-13 h-13 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentDataset?.name || 'streamweaver_demo_50_records.csv'}
                </h1>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-medium">
                  {formatFileSize(currentDataset?.fileSize || currentDataset?.sizeBytes || 3116)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 uppercase tracking-wide">
                  {currentDataset?.format || currentDataset?.fileType || 'CSV'}
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

              {/* Stats Row */}
              <div className="flex items-center space-x-4 sm:space-x-6 text-xs text-slate-300 mt-2.5 flex-wrap gap-y-2 font-medium">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white">{mappedSourceCount}</strong> of{' '}
                    <strong className="text-white">{totalSourceCount}</strong> fields mapped
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong className="text-white">{unmappedSourceCount}</strong> unmapped
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong className="text-white">{totalDestCount}</strong> destinations
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Wand2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    <strong className="text-white">{transformationsCount}</strong> transformations configured
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Primary Pipeline Actions */}
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
              <span>Continue to Processing</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION BAR (Dashboard Pill Style) */}
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
              {connections.length}
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
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Transformation Builder</span>
            {transformationsCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-purple-900 text-purple-300 text-[10px] font-extrabold flex items-center justify-center">
                {transformationsCount}
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
            onClick={() => setActiveTab('engine')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'engine'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Stage 5: Processing Engine</span>
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-500">Nexora Pipeline Engine</span>
      </div>

      {/* TAB CONTENT: 1. FIELD MAPPING WORKSPACE (3-COLUMN LAYOUT) */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ========================================================================= */}
          {/* COLUMN 1: SOURCE COLUMNS (lg:col-span-3) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-5 shadow-2xl backdrop-blur-xl flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Database className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-wider text-white">
                  SOURCE COLUMNS
                </h2>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                {mappedSourceCount} of {totalSourceCount} mapped
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
                className="w-full bg-[#070b1c] hover:bg-[#0a0f26] focus:bg-[#0d1538] text-xs text-white placeholder-slate-500 pl-8 pr-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 font-medium transition-all"
              />
            </div>

            {/* Source Columns List */}
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {filteredSourceColumns.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No matching columns found
                </div>
              ) : (
                filteredSourceColumns.map((col) => {
                  const isMapped = Boolean(sourceToConnectionMap[col.name]);
                  const isSelected = selectedSourceCol === col.name;

                  return (
                    <div
                      key={col.name}
                      onClick={() => handleSourceColumnClick(col.name)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none group ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400 text-white'
                          : isMapped
                          ? 'border-slate-800/80 hover:border-cyan-500/40 bg-[#080d22] hover:bg-[#0d1636] text-slate-200'
                          : 'border-slate-800/80 hover:border-amber-500/40 bg-[#080d22] hover:bg-[#121730] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
                        <span className="font-mono text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                          {col.name}
                        </span>
                      </div>

                      {isMapped ? (
                        <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold shrink-0">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Mapped</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/40 text-[10px] font-bold shrink-0">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Not mapped</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Auto-map Helper */}
            {unmappedSourceCount > 0 && (
              <button
                onClick={handleAutoMapAll}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 transition-all flex items-center justify-center space-x-1.5 cursor-pointer mt-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auto-Map All Unmapped Fields</span>
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2: FIELD MAPPING CANVAS (lg:col-span-6) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-5 shadow-2xl backdrop-blur-xl flex flex-col space-y-4 min-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">
                    FIELD MAPPING
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Connect source columns to target destination fields
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                {connections.length} active connections
              </span>
            </div>

            {/* Selection Hint Pill */}
            {(selectedSourceCol || selectedDestField) && (
              <div className="px-4 py-2.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-between shadow-md">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>
                    Selected:{' '}
                    <strong className="text-white">{selectedSourceCol || `(Pick a source column)`}</strong> →{' '}
                    <strong className="text-white">{selectedDestField || `(Pick a destination field)`}</strong>
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

            {/* Empty State vs Connected Cards */}
            {connections.length === 0 ? (
              <div className="my-auto py-16 px-6 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 bg-[#080d22]/50">
                <div className="w-13 h-13 rounded-2xl bg-[#0d1636] text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg">
                  <Link2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">No Connections Created</h3>
                  <p className="text-xs text-slate-400 max-w-sm font-medium leading-relaxed">
                    Click a Source Column on the left, then click a Destination Field on the right to
                    connect them.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {connections.map((conn) => {
                  return (
                    <div
                      key={conn.id}
                      className="p-3.5 rounded-2xl border border-slate-800/90 bg-[#080d22] hover:border-cyan-500/40 hover:bg-[#0c1433] shadow-md flex items-center justify-between gap-3 transition-all group"
                    >
                      {/* Left: Source Column */}
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="px-3 py-1.5 rounded-xl bg-slate-900 font-mono text-xs font-bold text-cyan-300 truncate border border-cyan-500/30">
                          {conn.sourceField}
                        </span>
                      </div>

                      {/* Middle: Connection Arrow & Quick Transform Selector */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                        <select
                          value={conn.transformation || 'none'}
                          onChange={(e) => handleUpdateTransformation(conn.id, e.target.value)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer transition-colors ${
                            conn.transformation && conn.transformation !== 'none'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                              : 'bg-[#070b1c] text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                          title="Click to apply inline transformation"
                        >
                          {TRANSFORMATION_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id} className="bg-[#0c122b] text-slate-200">
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                      </div>

                      {/* Right: Destination Field & Delete */}
                      <div className="flex items-center space-x-2 min-w-0 flex-1 justify-end">
                        <span className="px-3 py-1.5 rounded-xl bg-indigo-950/80 font-mono text-xs font-bold text-indigo-300 truncate border border-indigo-500/40">
                          {conn.destField}
                        </span>
                        <button
                          onClick={() => handleRemoveConnection(conn.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Disconnect field"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 3: DESTINATION FIELDS (lg:col-span-3) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-5 shadow-2xl backdrop-blur-xl flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Target className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-wider text-white">
                  DESTINATION FIELDS
                </h2>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                {connectedDestCount} of {totalDestCount} connected
              </span>
            </div>

            {/* Add Destination Input Form */}
            <form onSubmit={handleAddDestinationField} className="flex items-center space-x-2">
              <input
                type="text"
                value={newDestFieldName}
                onChange={(e) => setNewDestFieldName(e.target.value)}
                placeholder="Add new destination fie..."
                className="flex-1 bg-[#070b1c] hover:bg-[#0a0f26] focus:bg-[#0d1538] text-xs text-white placeholder-slate-500 px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 font-medium transition-all"
              />
              <button
                type="submit"
                disabled={!newDestFieldName.trim()}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-md transition-all cursor-pointer disabled:opacity-40"
                title="Add Field"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Destination Fields List */}
            {destinationFields.length === 0 ? (
              <div className="py-16 px-4 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 bg-[#080d22]/50">
                <div className="w-13 h-13 rounded-2xl bg-[#0d1636] text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">No destination fields</h3>
                  <p className="text-xs text-slate-400 max-w-xs font-medium leading-relaxed">
                    Add your first destination field to start mapping.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
                {destinationFields.map((field) => {
                  const conn = destToConnectionMap[field.name];
                  const isConnected = Boolean(conn);
                  const isSelected = selectedDestField === field.name;

                  return (
                    <div
                      key={field.name}
                      onClick={() => handleDestFieldClick(field.name)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none group ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-950/60 shadow-[0_0_15px_rgba(99,102,241,0.35)] ring-1 ring-indigo-400 text-white'
                          : isConnected
                          ? 'border-slate-800/80 hover:border-cyan-500/40 bg-[#080d22] hover:bg-[#0d1636] text-slate-200'
                          : 'border-slate-800/80 hover:border-indigo-500/40 bg-[#080d22] hover:bg-[#121730] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-semibold text-slate-200 truncate block group-hover:text-white">
                            {field.name}
                          </span>
                          {isConnected && (
                            <span className="text-[10px] text-cyan-400/80 font-medium truncate block">
                              ← {conn.sourceField}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {isConnected ? (
                          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Connected</span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800 text-[10px] font-semibold">
                            Empty
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDestinationField(field.name);
                          }}
                          className="p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="Delete destination field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. TRANSFORMATION BUILDER */}
      {activeTab === 'transformations' && (
        <div className="rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Transformation Engine Pipeline</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Apply data cleaning, whitespace stripping, type casting, or case standardizations.
              </p>
            </div>
            <button
              onClick={() => {
                connections.forEach((c) => handleUpdateTransformation(c.id, 'trim'));
                showNotification('success', 'Applied "Trim Whitespace" to all active connections.');
              }}
              className="text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-3.5 py-1.5 rounded-xl hover:bg-cyan-900/60 cursor-pointer shadow-sm"
            >
              Batch Apply: Trim All
            </button>
          </div>

          {connections.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-medium">
              No active field connections to transform. Create connections in the Field Mapping Workspace first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((conn) => (
                <div key={conn.id} className="p-4 rounded-2xl border border-slate-800/90 bg-[#080d22] space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">
                      {conn.sourceField} → {conn.destField}
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/40 uppercase">
                      {conn.transformation || 'raw'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">
                      Select Field Transformation:
                    </label>
                    <select
                      value={conn.transformation || 'none'}
                      onChange={(e) => handleUpdateTransformation(conn.id, e.target.value)}
                      className="w-full text-xs bg-[#070b1c] border border-slate-700 text-slate-200 rounded-xl p-2.5 font-medium focus:outline-none focus:border-cyan-400 cursor-pointer shadow-inner"
                    >
                      {TRANSFORMATION_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-[#0c122b] text-slate-200">
                          {opt.label} — {opt.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 3. LIVE OUTPUT PREVIEW */}
      {activeTab === 'preview' && (
        <div className="rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-6 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Live Transformed Output Preview</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time preview of source records mapped to destination fields with transformations applied.
              </p>
            </div>
            <button
              onClick={generatePreview}
              className="text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-3.5 py-1.5 rounded-xl hover:bg-cyan-900/60 flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Output</span>
            </button>
          </div>

          {previewLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Generating live pipeline preview...</div>
          ) : previewRows.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-medium">
              No transformed rows to display. Ensure connections are mapped.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#070b1c] border-b border-slate-800 text-cyan-300 font-bold">
                  <tr>
                    {destinationFields.map((dest) => (
                      <th key={dest.name} className="px-4 py-3 font-mono">
                        {dest.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {previewRows.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#0d1636]/50">
                      {destinationFields.map((dest) => (
                        <td key={dest.name} className="px-4 py-2.5 font-mono text-slate-200">
                          {row[dest.name] !== null && row[dest.name] !== undefined ? (
                            String(row[dest.name])
                          ) : (
                            <span className="text-slate-600 italic">null</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 4. STAGE 5: PROCESSING ENGINE */}
      {activeTab === 'engine' && (
        <div className="rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="border-b border-cyan-500/15 pb-4">
            <h2 className="text-base font-bold text-white">Pipeline Execution & Processing Status</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review schema validation, connection completeness, and trigger processing batch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#080d22]">
              <span className="text-xs font-semibold text-slate-400">Pipeline Validation</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">Ready for Execution</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {mappedSourceCount} inputs wired to {connectedDestCount} targets.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-[#080d22]">
              <span className="text-xs font-semibold text-slate-400">Target Pipeline Schema</span>
              <p className="text-lg font-bold text-white mt-1">{totalDestCount} Destination Fields</p>
              <p className="text-[11px] text-slate-500 mt-1">{transformationsCount} inline transform rules</p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-[#080d22]">
              <span className="text-xs font-semibold text-slate-400">Processing Mode</span>
              <p className="text-lg font-bold text-cyan-400 mt-1">Chunked Stream Engine</p>
              <p className="text-[11px] text-slate-500 mt-1">High-throughput 64KB buffer memory slice</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => {
                handleSavePipeline();
                showNotification('success', 'Processing pipeline triggered successfully!');
              }}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Execute Pipeline & Preprocessing</span>
            </button>
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

        {/* Right Actions: Preview Changes & Save Pipeline */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('preview')}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-200 bg-[#0d1636] hover:bg-[#121e4a] border border-cyan-500/30 shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preview Changes</span>
          </button>

          <button
            onClick={handleSavePipeline}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Pipeline'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldMapping;
