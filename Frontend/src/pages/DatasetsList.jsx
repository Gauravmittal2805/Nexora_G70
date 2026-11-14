import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import datasetService, { formatBytes } from '../services/datasetService';
import DatasetPreviewTable from '../components/datasets/DatasetPreviewTable';
import {
  Database,
  UploadCloud,
  Search,
  FileSpreadsheet,
  Eye,
  Trash2,
  X,
} from 'lucide-react';

const DatasetsList = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState(() => datasetService.getDatasets());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [previewingDataset, setPreviewingDataset] = useState(null);

  const handleDelete = async (id, name, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete dataset "${name}"?`)) {
      const updated = await datasetService.deleteDataset(id);
      setDatasets(updated);
      if (previewingDataset?.id === id) {
        setPreviewingDataset(null);
      }
    }
  };

  // Collect all unique tags
  const allTags = ['ALL', ...new Set(datasets.flatMap((d) => d.tags || []))];

  const filteredDatasets = datasets.filter((ds) => {
    const matchesSearch =
      ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ds.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag =
      selectedTag === 'ALL' || (ds.tags && ds.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Datasets Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, manage, and inspect all ingested tabular data sources ready for preprocessing and pipelines.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard/datasets/upload')}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Dataset</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search datasets by name or description..."
            className="w-full text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Datasets Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDatasets.map((ds) => {
          const isSelected = previewingDataset?.id === ds.id;

          return (
            <div
              key={ds.id}
              onClick={() => setPreviewingDataset(isSelected ? null : ds)}
              className={`bg-white rounded-2xl border transition-all duration-200 p-5 cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div>
                {/* Header Badge Strip */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {ds.format || 'CSV'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {ds.status || 'Ready'}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {ds.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {ds.description || 'No description provided.'}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(ds.tags || []).map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200/60"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metrics Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800">
                    {Number(ds.rowCount).toLocaleString()} rows • {ds.columnCount || ds.columns?.length || 0} cols
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {formatBytes(ds.sizeBytes || 0)}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewingDataset(isSelected ? null : ds);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Toggle Preview Table"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(ds.id, ds.name, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Dataset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDatasets.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Datasets Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            We couldn't find any datasets matching your search criteria.
          </p>
          <button
            onClick={() => navigate('/dashboard/datasets/upload')}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Dataset</span>
          </button>
        </div>
      )}

      {/* Live Preview Table Section (when a dataset card is clicked) */}
      {previewingDataset && (
        <div className="mt-8 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900">
                Viewing Schema & Records: {previewingDataset.name}
              </h2>
            </div>
            <button
              onClick={() => setPreviewingDataset(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <DatasetPreviewTable
            columns={previewingDataset.columns || []}
            rows={previewingDataset.sampleRows || []}
            title={previewingDataset.name}
            totalRows={previewingDataset.rowCount}
            fileSizeBytes={previewingDataset.sizeBytes}
          />
        </div>
      )}
    </div>
  );
};

export default DatasetsList;
