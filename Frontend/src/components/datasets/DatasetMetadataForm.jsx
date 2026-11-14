import React from 'react';
import { Tag, Sliders } from 'lucide-react';

const COMMON_TAGS = [
  'Tabular',
  'Classification',
  'Regression',
  'Time Series',
  'NLP',
  'Customer Analytics',
  'Finance',
  'Healthcare',
];

const DatasetMetadataForm = ({ metadata, setMetadata }) => {
  const handleTagToggle = (tag) => {
    const currentTags = metadata.tags || [];
    if (currentTags.includes(tag)) {
      setMetadata({ ...metadata, tags: currentTags.filter((t) => t !== tag) });
    } else {
      setMetadata({ ...metadata, tags: [...currentTags, tag] });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-6">
      <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Dataset Configuration & Metadata</h3>
          <p className="text-xs text-slate-500">
            Define descriptive tags and parsing options for downstream ML pipelines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Dataset Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Dataset Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={metadata.name || ''}
            onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
            placeholder="e.g. churn_prediction_dataset_2026.csv"
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
          />
        </div>

        {/* Dataset Format & Delimiter */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Format
            </label>
            <select
              value={metadata.format || 'CSV'}
              onChange={(e) => setMetadata({ ...metadata, format: e.target.value })}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800"
            >
              <option value="CSV">CSV (.csv)</option>
              <option value="JSON">JSON (.json)</option>
              <option value="TSV">TSV (.tsv)</option>
              <option value="XLSX">Excel (.xlsx)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Delimiter
            </label>
            <select
              value={metadata.delimiter || ','}
              onChange={(e) => setMetadata({ ...metadata, delimiter: e.target.value })}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab (\t)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Description & Context
          </label>
          <textarea
            rows={3}
            value={metadata.description || ''}
            onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
            placeholder="Briefly describe what this dataset represents, its target variables, and intended model use cases..."
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
          />
        </div>

        {/* Tags Selection */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Target Tags & Classification
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag) => {
              const isSelected = (metadata.tags || []).includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Options: Has Header */}
        <div className="md:col-span-2 flex items-center space-x-3 pt-2">
          <label className="inline-flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={metadata.hasHeaders !== false}
              onChange={(e) => setMetadata({ ...metadata, hasHeaders: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <span>First row contains column headers (field names)</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default DatasetMetadataForm;
