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
    <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/20 p-6 shadow-xl space-y-6 text-slate-200">
      <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Dataset Configuration & Metadata</h3>
          <p className="text-xs text-slate-400">
            Define descriptive tags and parsing options for downstream preprocessing and analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Dataset Name */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Dataset Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={metadata.name || ''}
            onChange={(e) => setMetadata({ ...metadata, name: e.target.value })}
            placeholder="e.g. churn_prediction_dataset_2026.csv"
            className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#070b1c] focus:outline-none focus:border-cyan-400 transition-all font-medium text-white placeholder-slate-500"
          />
        </div>

        {/* Dataset Format & Delimiter */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Format
            </label>
            <select
              value={metadata.format || 'CSV'}
              onChange={(e) => setMetadata({ ...metadata, format: e.target.value })}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-800 bg-[#070b1c] focus:outline-none focus:border-cyan-400 font-medium text-white"
            >
              <option value="CSV">CSV (.csv)</option>
              <option value="JSON">JSON (.json)</option>
              <option value="TSV">TSV (.tsv)</option>
              <option value="XLSX">Excel (.xlsx)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Delimiter
            </label>
            <select
              value={metadata.delimiter || ','}
              onChange={(e) => setMetadata({ ...metadata, delimiter: e.target.value })}
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-800 bg-[#070b1c] focus:outline-none focus:border-cyan-400 font-medium text-white"
            >
              <option value=",">Comma (,)</option>
              <option value="\t">Tab (\t)</option>
              <option value=";">Semicolon (;)</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
          Dataset Description
        </label>
        <textarea
          rows={3}
          value={metadata.description || ''}
          onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
          placeholder="Brief summary of dataset origin, target attributes, and business context..."
          className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 bg-[#070b1c] focus:outline-none focus:border-cyan-400 transition-all font-medium text-white placeholder-slate-500"
        />
      </div>

      {/* Tags Selector */}
      <div>
        <div className="flex items-center space-x-1.5 mb-2">
          <Tag className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Domain Tags & Categorization
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMMON_TAGS.map((tag) => {
            const isSelected = (metadata.tags || []).includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-[#070b1c] text-slate-400 border border-slate-800 hover:border-cyan-500/40 hover:text-white'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DatasetMetadataForm;
