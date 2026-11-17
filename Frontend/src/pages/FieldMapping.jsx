import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import datasetService, { autoSuggestSourceToTargetMapping } from '../services/datasetService';
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
  GripVertical,
  Target,
  Database,
  X,
  Check,
  Save,
  RefreshCw,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

const TRANSFORMATION_OPTIONS = [
  { id: 'none', label: 'Pass-through (Raw)', description: 'Keep source value as-is' },
  { id: 'trim', label: 'Trim Whitespace', description: 'Remove leading and trailing spaces' },
  { id: 'uppercase', label: 'UPPERCASE', description: 'Convert all text to uppercase' },
  { id: 'lowercase', label: 'lowercase', description: 'Convert all text to lowercase' },
  { id: 'to_number', label: 'Cast to Number', description: 'Parse string to integer or float' },
  { id: 'to_boolean', label: 'Cast to Boolean', description: 'Parse yes/no/true/false to boolean' },
  { id: 'remove_empty', label: 'Remove Empty Cells', description: 'Strip null and empty string values' },
];

const TARGET_DATA_TYPES = ['String', 'Integer', 'Float', 'Boolean', 'DateTime'];

const FieldMapping = () => {
  const { id: routeDatasetId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active Tab: 'workspace' | 'columns' | 'preview' | 'validation'
  const [activeTab, setActiveTab] = useState('workspace');

  // Datasets catalog & active dataset
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(
    routeDatasetId || searchParams.get('datasetId') || ''
  );
  const [currentDataset, setCurrentDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Source-to-Target Mappings array:
  // [{ id, targetField, sourceField, targetType, required, transformation, defaultValue }]
  const [fieldMappings, setFieldMappings] = useState([]);

  // Source columns extracted from dataset:
  // [{ name, type, dataType, missingCount, sampleValues }]
  const [sourceColumns, setSourceColumns] = useState([]);

  // Filters & Searches
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'mapped' | 'unmapped'
  const [targetSearch, setTargetSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);

  // New Mapping Form State
  const [newTargetField, setNewTargetField] = useState('');
  const [newTargetType, setNewTargetType] = useState('String');
  const [newSourceField, setNewSourceField] = useState('');
  const [newRequired, setNewRequired] = useState(false);
  const [newTransformation, setNewTransformation] = useState('none');
  const [newDefaultValue, setNewDefaultValue] = useState('');

  // Edit Mapping Form State
  const [editTargetField, setEditTargetField] = useState('');
  const [editTargetType, setEditTargetType] = useState('String');
  const [editSourceField, setEditSourceField] = useState('');
  const [editRequired, setEditRequired] = useState(false);
  const [editTransformation, setEditTransformation] = useState('none');
  const [editDefaultValue, setEditDefaultValue] = useState('');

  // Live Output Preview state
  const [previewRows, setPreviewRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Validation report state
  const [serverValidation, setServerValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidationBannerExpanded, setIsValidationBannerExpanded] = useState(true);

  // Notifications
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to load dataset mapping from API
  const loadDatasetMapping = useCallback(async (datasetId) => {
    if (!datasetId) return;
    setIsLoading(true);
    setServerValidation(null);

    try {
      const mappingResponse = await datasetService.getFieldMapping(datasetId);

      if (mappingResponse) {
        const cols = mappingResponse.columns || [];
        setSourceColumns(cols);

        if (Array.isArray(mappingResponse.fieldMappings) && mappingResponse.fieldMappings.length > 0) {
          setFieldMappings(mappingResponse.fieldMappings);
        } else if (Array.isArray(mappingResponse.connections) && mappingResponse.connections.length > 0) {
          // Backward compatibility: adapt connections to fieldMappings
          const adapted = (mappingResponse.destinations || []).map((d) => {
            const conn = mappingResponse.connections.find((c) => c.destField === d.name);
            return {
              id: `map-${d.name}`,
              targetField: d.name,
              sourceField: conn?.sourceField || '',
              targetType: d.type || 'String',
              required: Boolean(d.required),
              transformation: conn?.transformation || 'none',
              defaultValue: ''
            };
          });
          setFieldMappings(adapted);
        } else {
          // Initialize automatic 1:1 mapping
          const initial = autoSuggestSourceToTargetMapping(cols);
          setFieldMappings(initial);
        }

        if (mappingResponse.validation) {
          setServerValidation(mappingResponse.validation);
        }
      }
    } catch (err) {
      console.error('Error fetching field mapping for dataset:', err);
      showNotification('error', `Failed to load mapping: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load of datasets catalog
  useEffect(() => {
    let active = true;

    datasetService
      .fetchDatasets()
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : res.datasets || [];
        setDatasets(list);

        const targetId = routeDatasetId || searchParams.get('datasetId');
        const matched = list.find((d) => d.id === targetId || d.datasetId === targetId);
        const activeItem = matched || list[0] || null;

        if (activeItem) {
          const activeId = activeItem.id || activeItem.datasetId;
          setSelectedDatasetId(activeId);
          setCurrentDataset(activeItem);
          loadDatasetMapping(activeId);
        } else {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error loading datasets:', err);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [routeDatasetId, searchParams, loadDatasetMapping]);

  // Switch dataset
  const handleSelectDataset = (datasetId) => {
    setSelectedDatasetId(datasetId);
    setSearchParams({ datasetId });
    const ds = datasets.find((d) => d.id === datasetId || d.datasetId === datasetId);
    if (ds) {
      setCurrentDataset(ds);
      loadDatasetMapping(datasetId);
    }
  };

  // Mapped Source Columns lookup: { [sourceColName]: countOfMappings }
  const mappedSourceColCounts = useMemo(() => {
    const counts = {};
    fieldMappings.forEach((m) => {
      if (m.sourceField) {
        counts[m.sourceField] = (counts[m.sourceField] || 0) + 1;
      }
    });
    return counts;
  }, [fieldMappings]);

  // Filtered Source Columns
  const filteredSourceColumns = useMemo(() => {
    let list = sourceColumns;
    if (sourceSearch.trim()) {
      const q = sourceSearch.toLowerCase().trim();
      list = list.filter((col) => col.name.toLowerCase().includes(q));
    }
    if (sourceFilter === 'mapped') {
      list = list.filter((col) => Boolean(mappedSourceColCounts[col.name]));
    } else if (sourceFilter === 'unmapped') {
      list = list.filter((col) => !mappedSourceColCounts[col.name]);
    }
    return list;
  }, [sourceColumns, sourceSearch, sourceFilter, mappedSourceColCounts]);

  // Filtered Field Mappings (Target fields)
  const filteredFieldMappings = useMemo(() => {
    if (!targetSearch.trim()) return fieldMappings;
    const q = targetSearch.toLowerCase().trim();
    return fieldMappings.filter(
      (m) =>
        m.targetField.toLowerCase().includes(q) ||
        (m.sourceField && m.sourceField.toLowerCase().includes(q))
    );
  }, [fieldMappings, targetSearch]);

  // Client-Side Validation Engine
  const clientValidation = useMemo(() => {
    const errors = [];
    const warnings = [];

    const sourceColMap = new Map();
    sourceColumns.forEach((c) => sourceColMap.set(c.name.toLowerCase(), c));
    const sourceColNames = new Set(sourceColumns.map((c) => c.name));

    const targetCounts = new Map();
    const sourceUsage = new Map();

    let mappedCount = 0;
    let unmappedCount = 0;
    let requiredUnmappedCount = 0;
    let typeMismatchCount = 0;

    if (fieldMappings.length === 0) {
      errors.push({
        field: '_general',
        message: 'No field mappings configured. Add target fields to create a mapping schema.',
        type: 'error',
        code: 'EMPTY_SCHEMA'
      });
    }

    fieldMappings.forEach((m, idx) => {
      const targetName = (m.targetField || '').trim();
      const sourceName = (m.sourceField || '').trim();
      const isRequired = Boolean(m.required);
      const targetType = (m.targetType || 'String').toLowerCase();
      const transformation = (m.transformation || 'none').toLowerCase();

      // 1. Target field name checks
      if (!targetName) {
        errors.push({
          field: `mapping_${idx}`,
          index: idx,
          message: `Target field name at row #${idx + 1} cannot be blank.`,
          type: 'error',
          code: 'EMPTY_TARGET_NAME'
        });
      } else {
        const lowerTarget = targetName.toLowerCase();
        const seen = targetCounts.get(lowerTarget) || 0;
        targetCounts.set(lowerTarget, seen + 1);
        if (seen > 0) {
          errors.push({
            field: targetName,
            index: idx,
            message: `Duplicate target field name "${targetName}". Field names must be unique.`,
            type: 'error',
            code: 'DUPLICATE_TARGET_NAME'
          });
        }
      }

      // 2. Source mapping & requirements checks
      if (sourceName) {
        mappedCount++;
        if (!sourceColNames.has(sourceName) && !sourceColMap.has(sourceName.toLowerCase())) {
          errors.push({
            field: targetName || `mapping_${idx}`,
            sourceField: sourceName,
            index: idx,
            message: `Source column "${sourceName}" does not exist in the active dataset.`,
            type: 'error',
            code: 'SOURCE_NOT_FOUND'
          });
        } else {
          // Track duplicate source column usage
          const lowerSrc = sourceName.toLowerCase();
          if (!sourceUsage.has(lowerSrc)) sourceUsage.set(lowerSrc, []);
          sourceUsage.get(lowerSrc).push(targetName);

          // 3. Type compatibility check
          const srcCol = sourceColMap.get(lowerSrc);
          if (srcCol) {
            const rawSourceType = (srcCol.type || srcCol.dataType || 'string').toLowerCase();
            const isTargetNumeric = targetType === 'integer' || targetType === 'float' || targetType === 'number';
            const isSourceNumeric = rawSourceType === 'number' || rawSourceType === 'float' || rawSourceType === 'integer';

            if (isTargetNumeric && !isSourceNumeric && transformation !== 'to_number') {
              typeMismatchCount++;
              warnings.push({
                field: targetName,
                sourceField: sourceName,
                index: idx,
                message: `Type Warning: Source column "${sourceName}" (${srcCol.type || 'String'}) mapped to numeric target "${targetName}" (${m.targetType}). Apply "Cast to Number" transformation.`,
                type: 'warning',
                code: 'TYPE_MISMATCH_NUMERIC'
              });
            }

            const isTargetBoolean = targetType === 'boolean';
            const isSourceBoolean = rawSourceType === 'boolean';
            if (isTargetBoolean && !isSourceBoolean && transformation !== 'to_boolean') {
              typeMismatchCount++;
              warnings.push({
                field: targetName,
                sourceField: sourceName,
                index: idx,
                message: `Type Warning: Source column "${sourceName}" mapped to Boolean target "${targetName}". Apply "Cast to Boolean" transformation.`,
                type: 'warning',
                code: 'TYPE_MISMATCH_BOOLEAN'
              });
            }
          }
        }
      } else {
        unmappedCount++;
        if (isRequired) {
          requiredUnmappedCount++;
          errors.push({
            field: targetName || `mapping_${idx}`,
            index: idx,
            message: `Required target field "${targetName}" has no source column assigned.`,
            type: 'error',
            code: 'REQUIRED_FIELD_UNMAPPED'
          });
        }
      }
    });

    // Duplicate source usage warnings
    sourceUsage.forEach((targets, src) => {
      if (targets.length > 1) {
        warnings.push({
          sourceField: src,
          message: `Source column "${src}" is mapped to ${targets.length} target fields (${targets.join(', ')}).`,
          type: 'warning',
          code: 'DUPLICATE_SOURCE_MAPPING'
        });
      }
    });

    const unmappedSourceCols = sourceColumns.filter((c) => !mappedSourceColCounts[c.name]);
    if (unmappedSourceCols.length > 0) {
      warnings.push({
        field: '_dataset',
        message: `${unmappedSourceCols.length} source column(s) are unmapped and will be omitted from target dataset.`,
        type: 'info',
        code: 'UNMAPPED_SOURCE_COLUMNS'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      errorCount: errors.length,
      warningCount: warnings.length,
      stats: {
        totalSourceColumns: sourceColumns.length,
        totalTargetFields: fieldMappings.length,
        mappedFields: mappedCount,
        unmappedFields: unmappedCount,
        requiredUnmapped: requiredUnmappedCount,
        typeMismatches: typeMismatchCount,
        unmappedSourceColsCount: unmappedSourceCols.length
      }
    };
  }, [fieldMappings, sourceColumns, mappedSourceColCounts]);

  // Combined validation state (client + server)
  const validationReport = serverValidation || clientValidation;

  // Change source column for a target field (Dropdown-based selection)
  const handleUpdateSourceColumn = (targetFieldId, newSource) => {
    setFieldMappings((prev) =>
      prev.map((m) => {
        if (m.id === targetFieldId || m.targetField === targetFieldId) {
          return {
            ...m,
            sourceField: newSource,
          };
        }
        return m;
      })
    );
    setServerValidation(null);
  };

  // Change inline transformation for a target field
  const handleUpdateTransformation = (targetFieldId, transformation) => {
    setFieldMappings((prev) =>
      prev.map((m) => {
        if (m.id === targetFieldId || m.targetField === targetFieldId) {
          return { ...m, transformation };
        }
        return m;
      })
    );
    setServerValidation(null);
  };

  // Remove a mapping
  const handleRemoveMapping = (targetFieldId) => {
    setFieldMappings((prev) => prev.filter((m) => m.id !== targetFieldId && m.targetField !== targetFieldId));
    setServerValidation(null);
    showNotification('info', 'Mapping removed.');
  };

  // Unmap source column only
  const handleUnmapSource = (targetFieldId) => {
    setFieldMappings((prev) =>
      prev.map((m) => {
        if (m.id === targetFieldId || m.targetField === targetFieldId) {
          return { ...m, sourceField: '' };
        }
        return m;
      })
    );
    setServerValidation(null);
    showNotification('info', 'Source column unmapped.');
  };

  // Open Edit Mapping Modal
  const handleOpenEditModal = (mapping) => {
    setEditingMapping(mapping);
    setEditTargetField(mapping.targetField);
    setEditTargetType(mapping.targetType || 'String');
    setEditSourceField(mapping.sourceField || '');
    setEditRequired(Boolean(mapping.required));
    setEditTransformation(mapping.transformation || 'none');
    setEditDefaultValue(mapping.defaultValue || '');
  };

  // Save Edited Mapping
  const handleSaveEditMapping = (e) => {
    if (e) e.preventDefault();
    if (!editingMapping) return;

    const trimmedTarget = editTargetField.trim();
    if (!trimmedTarget) {
      showNotification('error', 'Target field name cannot be empty.');
      return;
    }

    // Check duplicate target name with other mappings
    const isDuplicate = fieldMappings.some(
      (m) =>
        m.id !== editingMapping.id &&
        m.targetField.toLowerCase() === trimmedTarget.toLowerCase()
    );
    if (isDuplicate) {
      showNotification('warning', `Target field "${trimmedTarget}" already exists.`);
      return;
    }

    setFieldMappings((prev) =>
      prev.map((m) => {
        if (m.id === editingMapping.id) {
          return {
            ...m,
            targetField: trimmedTarget,
            targetType: editTargetType,
            sourceField: editSourceField,
            required: editRequired,
            transformation: editTransformation,
            defaultValue: editDefaultValue,
          };
        }
        return m;
      })
    );

    setEditingMapping(null);
    setServerValidation(null);
    showNotification('success', `Updated mapping for "${trimmedTarget}".`);
  };

  // Add New Mapping Modal Submit
  const handleAddMappingSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmedTarget = newTargetField.trim();
    if (!trimmedTarget) {
      showNotification('error', 'Target field name cannot be empty.');
      return;
    }

    if (fieldMappings.some((m) => m.targetField.toLowerCase() === trimmedTarget.toLowerCase())) {
      showNotification('warning', `Target field "${trimmedTarget}" already exists.`);
      return;
    }

    const newMapping = {
      id: `map-${trimmedTarget}-${Date.now()}`,
      targetField: trimmedTarget,
      targetType: newTargetType,
      sourceField: newSourceField,
      required: newRequired,
      transformation: newTransformation,
      defaultValue: newDefaultValue,
    };

    setFieldMappings((prev) => [...prev, newMapping]);
    setIsAddModalOpen(false);

    // Reset Form
    setNewTargetField('');
    setNewTargetType('String');
    setNewSourceField('');
    setNewRequired(false);
    setNewTransformation('none');
    setNewDefaultValue('');
    setServerValidation(null);

    showNotification('success', `Target field "${trimmedTarget}" created.`);
  };

  // Quick Map Source Column from Left Panel
  const handleQuickMapSourceColumn = (sourceCol) => {
    if (fieldMappings.some((m) => m.targetField.toLowerCase() === sourceCol.name.toLowerCase())) {
      showNotification('info', `Target field "${sourceCol.name}" already exists in mappings.`);
      return;
    }

    const newMapping = {
      id: `map-${sourceCol.name}-${Date.now()}`,
      targetField: sourceCol.name,
      sourceField: sourceCol.name,
      targetType: sourceCol.type || (sourceCol.dataType === 'number' ? 'Float' : sourceCol.dataType === 'boolean' ? 'Boolean' : 'String'),
      required: /^(id|target|churn|alert)$/i.test(sourceCol.name),
      transformation: 'none',
      defaultValue: '',
    };

    setFieldMappings((prev) => [...prev, newMapping]);
    setServerValidation(null);
    showNotification('success', `Created mapping: "${sourceCol.name}" → "${sourceCol.name}".`);
  };

  // Auto-Map All Source Columns
  const handleAutoMapAll = () => {
    const updated = [...fieldMappings];

    sourceColumns.forEach((col) => {
      // Find matching target field by exact name or case-insensitive name
      const existingIdx = updated.findIndex(
        (m) => m.targetField.toLowerCase() === col.name.toLowerCase()
      );

      if (existingIdx >= 0) {
        if (!updated[existingIdx].sourceField) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            sourceField: col.name,
          };
        }
      } else {
        // Create matching target field
        updated.push({
          id: `map-${col.name}-${Date.now()}`,
          targetField: col.name,
          sourceField: col.name,
          targetType: col.type || 'String',
          required: /^(id|target|churn|alert)$/i.test(col.name),
          transformation: 'none',
          defaultValue: '',
        });
      }
    });

    setFieldMappings(updated);
    setServerValidation(null);
    showNotification('success', 'Auto-mapped matching source columns to target schema.');
  };

  // Reset to 1:1 Mirror
  const handleResetTo1to1 = () => {
    const mirrored = autoSuggestSourceToTargetMapping(sourceColumns);
    setFieldMappings(mirrored);
    setServerValidation(null);
    showNotification('info', 'Reset mappings to 1:1 Mirror of source columns.');
  };

  // Clear all mappings
  const handleClearAllMappings = () => {
    if (window.confirm('Are you sure you want to clear all mappings?')) {
      setFieldMappings([]);
      setServerValidation(null);
      showNotification('warning', 'Cleared all field mappings.');
    }
  };

  // Discard changes & reload from backend/dataset
  const handleDiscardChanges = () => {
    if (selectedDatasetId) {
      loadDatasetMapping(selectedDatasetId);
      showNotification('info', 'Discarded uncommitted changes.');
    }
  };

  // Trigger Validation API
  const handleValidateSchema = async () => {
    if (!selectedDatasetId) return;
    setIsValidating(true);

    try {
      const payload = {
        fieldMappings,
      };
      const res = await datasetService.validateFieldMapping(selectedDatasetId, payload);
      if (res) {
        setServerValidation(res);
        if (res.isValid) {
          showNotification('success', 'Validation passed! All target fields are valid.');
        } else {
          showNotification('warning', `Validation identified ${res.errorCount} error(s). Review below.`);
        }
      }
    } catch (err) {
      console.error('Validation error:', err);
      showNotification('error', `Validation failed: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  // Save Mappings via Backend API
  const handleSaveMappings = async () => {
    if (!selectedDatasetId) return;
    setIsSaving(true);

    try {
      const payload = {
        fieldMappings,
      };

      const res = await datasetService.saveFieldMapping(selectedDatasetId, payload);
      if (res && res.validation) {
        setServerValidation(res.validation);
      }
      showNotification('success', `Field mappings saved successfully for "${currentDataset?.name || 'Dataset'}".`);
    } catch (err) {
      console.error('Error saving field mappings:', err);
      if (err.validation) {
        setServerValidation(err.validation);
        showNotification('error', `Save rejected: ${err.message}`);
      } else {
        showNotification('error', `Save failed: ${err.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Live Output Preview Generator
  const generatePreview = useCallback(async () => {
    if (!selectedDatasetId) return;
    setPreviewLoading(true);

    try {
      // First attempt backend transformation API
      const res = await datasetService.transformDatasetRows(selectedDatasetId, {
        useMapping: true,
        projectToTarget: true,
      });

      if (res && Array.isArray(res.rows) && res.rows.length > 0) {
        setPreviewRows(res.rows);
        setPreviewLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Backend preview transform endpoint fallback to client-side:', err.message);
    }

    // Client-side projection fallback using current sampleRows
    const sampleRows = currentDataset?.sampleRows || currentDataset?.previewData || [];
    setTimeout(() => {
      const transformed = sampleRows.map((row) => {
        const out = {};
        fieldMappings.forEach((m) => {
          if (!m.targetField) return;
          let val = m.sourceField ? row[m.sourceField] : undefined;
          if (val === undefined || val === null || val === '') {
            if (m.defaultValue !== undefined && m.defaultValue !== null && m.defaultValue !== '') {
              val = m.defaultValue;
            }
          }
          if (val !== undefined && val !== null) {
            const trans = (m.transformation || 'none').toLowerCase();
            if (trans === 'trim' && typeof val === 'string') val = val.trim();
            else if (trans === 'uppercase' && typeof val === 'string') val = String(val).toUpperCase();
            else if (trans === 'lowercase' && typeof val === 'string') val = String(val).toLowerCase();
            else if (trans === 'to_number') val = Number(val) || 0;
            else if (trans === 'to_boolean') val = Boolean(val === true || val === 'true' || val === 1 || val === 'yes');
          }
          out[m.targetField] = val !== undefined ? val : null;
        });
        return out;
      });
      setPreviewRows(transformed);
      setPreviewLoading(false);
    }, 100);
  }, [selectedDatasetId, currentDataset, fieldMappings]);

  useEffect(() => {
    if (activeTab === 'preview') {
      generatePreview();
    }
  }, [activeTab, generatePreview]);

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 space-y-4 bg-[#0c122b]/90 border border-cyan-500/20 min-h-[500px] flex flex-col items-center justify-center rounded-3xl shadow-2xl">
        <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Loading Source-to-Target Mapping Studio...</p>
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
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold transition-all backdrop-blur-xl border ${
            notification.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/50 shadow-emerald-900/40'
              : notification.type === 'warning'
              ? 'bg-amber-950/95 text-amber-300 border-amber-500/50 shadow-amber-900/40'
              : notification.type === 'error'
              ? 'bg-rose-950/95 text-rose-300 border-rose-500/50 shadow-rose-900/40'
              : 'bg-cyan-950/95 text-cyan-300 border-cyan-500/50 shadow-cyan-900/40'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          {notification.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOP HEADER & DATASET CONTROL BAR */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0c122b]/95 border border-cyan-500/25 p-6 shadow-2xl backdrop-blur-2xl">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Dataset Identity & Metadata */}
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-13 h-13 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center space-x-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentDataset?.name || currentDataset?.fileName || 'Active Dataset'}
                </h1>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-medium">
                  {formatFileSize(currentDataset?.fileSize || currentDataset?.sizeBytes)}
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
                        <option key={d.id || d.datasetId} value={d.id || d.datasetId}>
                          Switch: {d.name || d.fileName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Status Chips */}
              <div className="flex items-center space-x-4 sm:space-x-5 text-xs text-slate-300 mt-2.5 flex-wrap gap-y-2 font-medium">
                <div className="flex items-center space-x-1.5">
                  <Database className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong className="text-white">{sourceColumns.length}</strong> Source Columns
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    <strong className="text-white">{fieldMappings.length}</strong> Target Fields
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white">{validationReport.stats?.mappedFields || 0}</strong> Mapped
                  </span>
                </div>

                {validationReport.stats?.unmappedFields > 0 && (
                  <div className="flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-white">{validationReport.stats.unmappedFields}</strong> Unmapped
                    </span>
                  </div>
                )}

                {/* Validation Status Pill */}
                <div className="flex items-center space-x-1.5">
                  {validationReport.isValid ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Schema Valid</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>{validationReport.errorCount} Validation Error(s)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5 shrink-0 self-start lg:self-auto flex-wrap gap-y-2">
            <button
              onClick={handleValidateSchema}
              disabled={isValidating}
              className="px-4 py-2.5 rounded-full text-xs font-semibold bg-[#0d1636] hover:bg-[#121e4a] text-cyan-300 border border-cyan-500/30 shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Validate mappings against backend rules"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{isValidating ? 'Validating...' : 'Validate Schema'}</span>
            </button>

            <button
              onClick={handleSaveMappings}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Mapping'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* VALIDATION BANNER (Displays errors and warnings with details) */}
      {(validationReport.errors?.length > 0 || validationReport.warnings?.length > 0) && (
        <div
          className={`rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition-all ${
            validationReport.errors?.length > 0
              ? 'bg-rose-950/40 border-rose-500/40'
              : 'bg-amber-950/40 border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {validationReport.errors?.length > 0 ? (
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {validationReport.errors?.length > 0
                  ? `Mapping Validation Issues (${validationReport.errors.length} Errors, ${validationReport.warnings.length} Warnings)`
                  : `Mapping Schema Notices (${validationReport.warnings.length} Warnings)`}
              </span>
            </div>

            <button
              onClick={() => setIsValidationBannerExpanded((prev) => !prev)}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer font-medium"
            >
              <span>{isValidationBannerExpanded ? 'Collapse' : 'Expand Details'}</span>
              {isValidationBannerExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isValidationBannerExpanded && (
            <div className="mt-3 space-y-2 border-t border-slate-800/80 pt-3 text-xs">
              {/* Errors */}
              {validationReport.errors?.map((err, i) => (
                <div key={`err-${i}`} className="flex items-start space-x-2 text-rose-300">
                  <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong className="font-mono text-rose-200">[{err.field}]:</strong> {err.message}
                  </span>
                </div>
              ))}

              {/* Warnings */}
              {validationReport.warnings?.map((warn, i) => (
                <div key={`warn-${i}`} className="flex items-start space-x-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {warn.field && <strong className="font-mono text-amber-200">[{warn.field}]: </strong>}
                    {warn.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB NAVIGATION */}
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
            <span>Source-to-Target Mapping Studio</span>
            <span className="w-5 h-5 rounded-full bg-[#070b1c] text-cyan-400 text-[10px] font-extrabold flex items-center justify-center border border-cyan-500/30">
              {fieldMappings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('columns')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'columns'
                ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Source Columns Inspector</span>
            <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-extrabold flex items-center justify-center border border-indigo-500/30">
              {sourceColumns.length}
            </span>
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
            onClick={() => setActiveTab('validation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'validation'
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Schema Health Audit</span>
            {validationReport.errorCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-900 text-rose-300 text-[10px] font-bold">
                {validationReport.errorCount}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs font-semibold text-slate-500">Nexora Schema Pipeline</span>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SOURCE-TO-TARGET MAPPING STUDIO (MAIN TWO-PANEL INTERFACE) */}
      {/* ========================================================================= */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* --------------------------------------------------------------------- */}
          {/* LEFT PANEL: SOURCE DATASET COLUMNS (lg:col-span-4) */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-4 rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-5 shadow-2xl backdrop-blur-xl flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Database className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-wider text-white">
                  SOURCE DATASET COLUMNS
                </h2>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                {sourceColumns.length} fields
              </span>
            </div>

            {/* Search & Filter Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={sourceSearch}
                  onChange={(e) => setSourceSearch(e.target.value)}
                  placeholder="Search source columns..."
                  className="w-full bg-[#070b1c] text-xs text-white placeholder-slate-500 pl-8 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-1.5 text-[11px]">
                <button
                  onClick={() => setSourceFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    sourceFilter === 'all'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white bg-slate-900/60'
                  }`}
                >
                  All ({sourceColumns.length})
                </button>
                <button
                  onClick={() => setSourceFilter('mapped')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    sourceFilter === 'mapped'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white bg-slate-900/60'
                  }`}
                >
                  Mapped ({Object.keys(mappedSourceColCounts).length})
                </button>
                <button
                  onClick={() => setSourceFilter('unmapped')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    sourceFilter === 'unmapped'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white bg-slate-900/60'
                  }`}
                >
                  Unmapped ({Math.max(0, sourceColumns.length - Object.keys(mappedSourceColCounts).length)})
                </button>
              </div>
            </div>

            {/* Source Columns List */}
            <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
              {filteredSourceColumns.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">
                  No source columns match your filter.
                </div>
              ) : (
                filteredSourceColumns.map((col) => {
                  const mapCount = mappedSourceColCounts[col.name] || 0;
                  const isMapped = mapCount > 0;

                  return (
                    <div
                      key={col.name}
                      className={`p-3 rounded-2xl border transition-all flex flex-col space-y-2 group ${
                        isMapped
                          ? 'border-slate-800/90 bg-[#080d22] hover:border-cyan-500/40'
                          : 'border-slate-800/80 bg-[#070b1c]/80 hover:border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center space-x-2 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0" />
                          <span className="font-mono text-xs font-bold text-white truncate">
                            {col.name}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] font-mono text-cyan-300 border border-cyan-500/20">
                            {col.type || col.dataType || 'String'}
                          </span>

                          <button
                            onClick={() => handleQuickMapSourceColumn(col)}
                            className="p-1 rounded-lg bg-cyan-950/80 text-cyan-400 hover:bg-cyan-900/80 border border-cyan-500/30 transition-colors cursor-pointer"
                            title="Add as new Target Field mapping"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Column Metadata & Mapping Status */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                        <span className="truncate max-w-[150px]">
                          {col.sampleValues && col.sampleValues.length > 0
                            ? `e.g. ${String(col.sampleValues[0])}`
                            : col.missingCount > 0
                            ? `${col.missingCount} nulls`
                            : '0 missing'}
                        </span>

                        {isMapped ? (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Mapped {mapCount > 1 ? `(${mapCount}x)` : ''}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            Unmapped
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Auto-Map Helper */}
            <button
              onClick={handleAutoMapAll}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auto-Map Matching Columns</span>
            </button>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* RIGHT PANEL: SOURCE-TO-TARGET FIELD MAPPING TABLE (lg:col-span-8) */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-8 rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-5 shadow-2xl backdrop-blur-xl flex flex-col space-y-4 min-h-[580px]">
            {/* Header & Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-white">
                    TARGET SCHEMA & SOURCE COLUMN MAPPINGS
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Map each target field to a source dataset column using dropdown selection
                  </p>
                </div>
              </div>

              {/* Action Buttons: Add Target Field & Templates */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleResetTo1to1}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-[#080d22] hover:bg-[#0d1636] border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer"
                  title="Map all source columns 1-to-1"
                >
                  1:1 Mirror
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Target Field</span>
                </button>
              </div>
            </div>

            {/* Target Fields Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={targetSearch}
                onChange={(e) => setTargetSearch(e.target.value)}
                placeholder="Search target fields or mapped source columns..."
                className="w-full bg-[#070b1c] text-xs text-white placeholder-slate-500 pl-8 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-cyan-400 font-medium"
              />
            </div>

            {/* Mappings Table / Card List */}
            {filteredFieldMappings.length === 0 ? (
              <div className="my-auto py-16 px-6 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 bg-[#080d22]/50">
                <div className="w-12 h-12 rounded-2xl bg-[#0d1636] text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">No Target Field Mappings Defined</h3>
                  <p className="text-xs text-slate-400 max-w-sm font-medium leading-relaxed">
                    Click "Add Target Field" to create a new mapping, or use "1:1 Mirror" to generate
                    mappings for all source columns automatically.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-all cursor-pointer"
                >
                  Add Your First Mapping
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {filteredFieldMappings.map((mapping, idx) => {
                  const isMapped = Boolean(mapping.sourceField);
                  const isRequired = Boolean(mapping.required);
                  const targetName = mapping.targetField;
                  const sourceName = mapping.sourceField;

                  // Find source column object if mapped
                  const sourceCol = sourceColumns.find(
                    (c) => c.name.toLowerCase() === (sourceName || '').toLowerCase()
                  );

                  // Type compatibility check
                  const targetType = (mapping.targetType || 'String').toLowerCase();
                  const sourceType = (sourceCol?.type || sourceCol?.dataType || 'string').toLowerCase();
                  const isTargetNumeric = targetType === 'integer' || targetType === 'float' || targetType === 'number';
                  const isSourceNumeric = sourceType === 'number' || sourceType === 'float' || sourceType === 'integer';
                  const isTypeMismatch = isMapped && sourceCol && isTargetNumeric && !isSourceNumeric && mapping.transformation !== 'to_number';

                  // Validation error on this specific row
                  const hasRequiredError = isRequired && !isMapped;
                  const isDuplicateSource = isMapped && (mappedSourceColCounts[sourceName] || 0) > 1;

                  return (
                    <div
                      key={mapping.id || `mapping-${idx}`}
                      className={`p-4 rounded-2xl border transition-all flex flex-col space-y-3 shadow-md ${
                        hasRequiredError
                          ? 'border-rose-500/50 bg-rose-950/20'
                          : isTypeMismatch
                          ? 'border-amber-500/40 bg-amber-950/20'
                          : isMapped
                          ? 'border-slate-800/90 bg-[#080d22] hover:border-cyan-500/40'
                          : 'border-slate-800/80 bg-[#070b1c]/70 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Row: Target Field Identity + Actions */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-slate-400 flex items-center justify-center">
                            #{idx + 1}
                          </span>

                          <span className="font-mono text-sm font-extrabold text-white tracking-wide">
                            {targetName}
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                            {mapping.targetType || 'String'}
                          </span>

                          {isRequired ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                              Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800 text-[10px] font-medium">
                              Optional
                            </span>
                          )}
                        </div>

                        {/* Edit & Remove Buttons */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditModal(mapping)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/60 border border-transparent hover:border-cyan-500/30 transition-colors cursor-pointer"
                            title="Edit Target Field properties"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {isMapped && (
                            <button
                              onClick={() => handleUnmapSource(mapping.id || mapping.targetField)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-950/60 border border-transparent hover:border-amber-500/30 transition-colors cursor-pointer"
                              title="Unmap source column"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleRemoveMapping(mapping.id || mapping.targetField)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                            title="Delete this mapping"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: DROPDOWN-BASED SOURCE SELECTION & TRANSFORMATION */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center pt-1 border-t border-slate-800/60">
                        {/* Source Column Dropdown (md:col-span-6) */}
                        <div className="md:col-span-6 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                            <span>Select Source Dataset Column:</span>
                            {isMapped && (
                              <span className="text-[10px] text-cyan-400 font-mono font-medium">
                                Type: {sourceCol?.type || 'String'}
                              </span>
                            )}
                          </label>

                          <div className="relative">
                            <select
                              value={sourceName || ''}
                              onChange={(e) => handleUpdateSourceColumn(mapping.id, e.target.value)}
                              className={`w-full text-xs font-mono font-semibold rounded-xl px-3 py-2.5 border focus:outline-none transition-all cursor-pointer shadow-inner ${
                                !isMapped
                                  ? 'bg-[#070b1c] text-slate-500 border-dashed border-slate-700 hover:border-cyan-500/50'
                                  : 'bg-[#0a102b] text-cyan-200 border-cyan-500/40 focus:border-cyan-400'
                              }`}
                            >
                              <option value="" className="bg-[#070b1c] text-slate-500">
                                -- Select Source Column (Unmapped) --
                              </option>
                              {sourceColumns.map((c) => (
                                <option
                                  key={c.name}
                                  value={c.name}
                                  className="bg-[#0c122b] text-slate-100 font-mono"
                                >
                                  {c.name} ({c.type || c.dataType || 'String'})
                                  {c.sampleValues && c.sampleValues.length > 0 ? ` — e.g. ${c.sampleValues[0]}` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Inline Transformation Dropdown (md:col-span-6) */}
                        <div className="md:col-span-6 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                            <span>Field Transformation:</span>
                            {mapping.transformation && mapping.transformation !== 'none' && (
                              <span className="text-[10px] text-purple-400 font-mono font-bold uppercase">
                                Active Rule
                              </span>
                            )}
                          </label>

                          <select
                            value={mapping.transformation || 'none'}
                            onChange={(e) => handleUpdateTransformation(mapping.id, e.target.value)}
                            className={`w-full text-xs font-medium rounded-xl px-3 py-2.5 border focus:outline-none transition-all cursor-pointer shadow-inner ${
                              mapping.transformation && mapping.transformation !== 'none'
                                ? 'bg-purple-950/70 text-purple-200 border-purple-500/40 focus:border-purple-400'
                                : 'bg-[#070b1c] text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {TRANSFORMATION_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id} className="bg-[#0c122b] text-slate-200">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Row Warnings / Alerts */}
                      {hasRequiredError && (
                        <div className="flex items-center space-x-1.5 text-xs text-rose-300 bg-rose-950/50 border border-rose-500/40 px-3 py-1.5 rounded-xl">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Validation Error: Target field is marked Required but has no source column assigned.</span>
                        </div>
                      )}

                      {isTypeMismatch && (
                        <div className="flex items-center space-x-1.5 text-xs text-amber-300 bg-amber-950/50 border border-amber-500/40 px-3 py-1.5 rounded-xl">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            Type Warning: Source column is String, expected numeric. Recommended: select "Cast to Number" transformation.
                          </span>
                        </div>
                      )}

                      {isDuplicateSource && (
                        <div className="flex items-center space-x-1.5 text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-3 py-1 rounded-xl">
                          <Info className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>Source column "{sourceName}" is mapped to multiple target fields.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SOURCE COLUMNS INSPECTOR & PROFILING */}
      {/* ========================================================================= */}
      {activeTab === 'columns' && (
        <div className="rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Source Dataset Columns & Profiling</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect inferred data types, missing counts, sample values, and active target mappings.
              </p>
            </div>
            <button
              onClick={handleAutoMapAll}
              className="text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-4 py-2 rounded-xl hover:bg-cyan-900/60 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Map All Columns</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#070b1c] text-cyan-300 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Source Column</th>
                  <th className="px-4 py-3">Inferred Type</th>
                  <th className="px-4 py-3">Missing / Nulls</th>
                  <th className="px-4 py-3">Sample Values</th>
                  <th className="px-4 py-3">Mapping Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {sourceColumns.map((col) => {
                  const mappedTargets = fieldMappings
                    .filter((m) => (m.sourceField || '').toLowerCase() === col.name.toLowerCase())
                    .map((m) => m.targetField);
                  const isMapped = mappedTargets.length > 0;

                  return (
                    <tr key={col.name} className="hover:bg-[#0d1636]/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {col.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 border border-cyan-500/20 font-mono text-[10px]">
                          {col.type || col.dataType || 'String'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {col.missingCount > 0 ? (
                          <span className="text-amber-400 font-semibold">{col.missingCount} nulls</span>
                        ) : (
                          <span className="text-slate-400">0 nulls</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {col.sampleValues && col.sampleValues.length > 0
                          ? col.sampleValues.slice(0, 3).map((v) => `"${v}"`).join(', ')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {isMapped ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                            Mapped → {mappedTargets.join(', ')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                            Not mapped
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleQuickMapSourceColumn(col)}
                          className="px-3 py-1 rounded-lg text-[11px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/60 transition-all cursor-pointer"
                        >
                          + Map Column
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE OUTPUT PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-6 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Live Transformed Output Preview</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Displays preview records projected into your configured Target Fields with inline transformations applied.
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
            <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Projecting records into target schema...</span>
            </div>
          ) : previewRows.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs font-medium">
              No transformed rows to display. Configure mappings in the studio.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#070b1c] border-b border-slate-800 text-cyan-300 font-bold">
                  <tr>
                    {fieldMappings
                      .filter((m) => m.targetField)
                      .map((m) => (
                        <th key={m.targetField} className="px-4 py-3 font-mono">
                          {m.targetField}
                          <span className="block text-[9px] text-slate-500 font-sans font-normal">
                            ← {m.sourceField || '(none)'}
                          </span>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-medium">
                  {previewRows.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#0d1636]/50">
                      {fieldMappings
                        .filter((m) => m.targetField)
                        .map((m) => (
                          <td key={m.targetField} className="px-4 py-2.5 font-mono text-slate-200">
                            {row[m.targetField] !== null && row[m.targetField] !== undefined ? (
                              String(row[m.targetField])
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

      {/* ========================================================================= */}
      {/* TAB 4: SCHEMA HEALTH & VALIDATION AUDIT */}
      {/* ========================================================================= */}
      {activeTab === 'validation' && (
        <div className="rounded-3xl bg-[#0c122b]/90 border border-cyan-500/20 p-6 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-cyan-500/15 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Schema Health & Mapping Validation Audit</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive audit checking target field naming, required assignments, data type compatibility, and unmapped inputs.
              </p>
            </div>
            <button
              onClick={handleValidateSchema}
              disabled={isValidating}
              className="text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-4 py-2 rounded-xl hover:bg-cyan-900/60 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{isValidating ? 'Running Audit...' : 'Re-run Audit'}</span>
            </button>
          </div>

          {/* Audit Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl border border-slate-800 bg-[#080d22]">
              <span className="text-xs text-slate-400 font-semibold">Validation Status</span>
              <p className={`text-xl font-bold mt-1 ${validationReport.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {validationReport.isValid ? 'Schema Valid' : 'Issues Detected'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {validationReport.errorCount} blocking errors, {validationReport.warningCount} warnings
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-[#080d22]">
              <span className="text-xs text-slate-400 font-semibold">Mapped Fields</span>
              <p className="text-xl font-bold text-white mt-1">
                {validationReport.stats?.mappedFields || 0} / {validationReport.stats?.totalTargetFields || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {validationReport.stats?.unmappedFields || 0} target fields unmapped
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-[#080d22]">
              <span className="text-xs text-slate-400 font-semibold">Required Fields Check</span>
              <p className={`text-xl font-bold mt-1 ${validationReport.stats?.requiredUnmapped === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {validationReport.stats?.requiredUnmapped === 0 ? 'All Mapped' : `${validationReport.stats?.requiredUnmapped} Missing`}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Mandatory schema fields mapped
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-800 bg-[#080d22]">
              <span className="text-xs text-slate-400 font-semibold">Type Compatibility</span>
              <p className={`text-xl font-bold mt-1 ${validationReport.stats?.typeMismatches === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {validationReport.stats?.typeMismatches === 0 ? '100% Compatible' : `${validationReport.stats?.typeMismatches} Warnings`}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Casting transformations applied
              </p>
            </div>
          </div>

          {/* Detailed Audit Log Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Validation Issues & Notices</h3>

            {validationReport.errors?.length === 0 && validationReport.warnings?.length === 0 ? (
              <div className="p-8 text-center border border-emerald-500/30 rounded-2xl bg-emerald-950/20 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                All validation checks passed with zero errors or warnings.
              </div>
            ) : (
              <div className="space-y-2">
                {validationReport.errors?.map((err, i) => (
                  <div key={`err-${i}`} className="p-3.5 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-200 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        <strong className="font-mono text-rose-100">[{err.field || 'Target Field'}]: </strong>
                        {err.message}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-rose-900/60 text-[10px] font-bold text-rose-300 uppercase">
                      Blocking Error
                    </span>
                  </div>
                ))}

                {validationReport.warnings?.map((warn, i) => (
                  <div key={`warn-${i}`} className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 text-xs flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        {warn.field && <strong className="font-mono text-amber-100">[{warn.field}]: </strong>}
                        {warn.message}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-900/60 text-[10px] font-bold text-amber-300 uppercase">
                      Warning
                    </span>
                  </div>
                ))}
              </div>
            )}
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
            onClick={handleClearAllMappings}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/30 shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Clear All Mappings</span>
          </button>
        </div>

        {/* Right Actions: Validate & Save */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('preview')}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-slate-200 bg-[#0d1636] hover:bg-[#121e4a] border border-cyan-500/30 shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preview Transformed Rows</span>
          </button>

          <button
            onClick={handleSaveMappings}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Mapping'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW TARGET FIELD MAPPING */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0c122b] border border-cyan-500/40 p-6 shadow-2xl space-y-5 animate-fade-in text-slate-100">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Add Target Field Mapping</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMappingSubmit} className="space-y-4">
              {/* Target Field Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Field Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTargetField}
                  onChange={(e) => setNewTargetField(e.target.value)}
                  placeholder="e.g. customer_id, target, age"
                  className="w-full bg-[#070b1c] text-xs text-white placeholder-slate-500 px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>

              {/* Target Field Type & Required Flag */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Type</label>
                  <select
                    value={newTargetType}
                    onChange={(e) => setNewTargetType(e.target.value)}
                    className="w-full bg-[#070b1c] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {TARGET_DATA_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#0c122b]">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={newRequired}
                      onChange={(e) => setNewRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-[#070b1c] border-slate-700"
                    />
                    <span>Is Required?</span>
                  </label>
                </div>
              </div>

              {/* Source Column Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Map to Source Dataset Column:
                </label>
                <select
                  value={newSourceField}
                  onChange={(e) => setNewSourceField(e.target.value)}
                  className="w-full bg-[#070b1c] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
                >
                  <option value="" className="bg-[#0c122b] text-slate-500">
                    -- Select Source Column (Optional) --
                  </option>
                  {sourceColumns.map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#0c122b]">
                      {c.name} ({c.type || 'String'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Inline Transformation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Transformation</label>
                <select
                  value={newTransformation}
                  onChange={(e) => setNewTransformation(e.target.value)}
                  className="w-full bg-[#070b1c] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {TRANSFORMATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-[#0c122b]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md cursor-pointer"
                >
                  Add Field Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT TARGET FIELD MAPPING */}
      {/* ========================================================================= */}
      {editingMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#0c122b] border border-cyan-500/40 p-6 shadow-2xl space-y-5 animate-fade-in text-slate-100">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Edit Target Field Mapping</h3>
              </div>
              <button
                onClick={() => setEditingMapping(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMapping} className="space-y-4">
              {/* Target Field Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Field Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editTargetField}
                  onChange={(e) => setEditTargetField(e.target.value)}
                  className="w-full bg-[#070b1c] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>

              {/* Target Field Type & Required Flag */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Type</label>
                  <select
                    value={editTargetType}
                    onChange={(e) => setEditTargetType(e.target.value)}
                    className="w-full bg-[#070b1c] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {TARGET_DATA_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-[#0c122b]">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-300 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={editRequired}
                      onChange={(e) => setEditRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-[#070b1c] border-slate-700"
                    />
                    <span>Is Required?</span>
                  </label>
                </div>
              </div>

              {/* Source Column Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Mapped Source Column:
                </label>
                <select
                  value={editSourceField}
                  onChange={(e) => setEditSourceField(e.target.value)}
                  className="w-full bg-[#070b1c] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
                >
                  <option value="" className="bg-[#0c122b] text-slate-500">
                    -- Select Source Column (Unmapped) --
                  </option>
                  {sourceColumns.map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#0c122b]">
                      {c.name} ({c.type || 'String'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Inline Transformation */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Transformation</label>
                <select
                  value={editTransformation}
                  onChange={(e) => setEditTransformation(e.target.value)}
                  className="w-full bg-[#070b1c] text-xs text-white px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {TRANSFORMATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id} className="bg-[#0c122b]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Value Fallback */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Default Value Fallback (Optional)
                </label>
                <input
                  type="text"
                  value={editDefaultValue}
                  onChange={(e) => setEditDefaultValue(e.target.value)}
                  placeholder="Value to substitute if source is null/empty"
                  className="w-full bg-[#070b1c] text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingMapping(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldMapping;
