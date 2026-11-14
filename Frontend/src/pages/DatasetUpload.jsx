import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DatasetDropzone from '../components/datasets/DatasetDropzone';
import DatasetMetadataForm from '../components/datasets/DatasetMetadataForm';
import DatasetPreviewTable from '../components/datasets/DatasetPreviewTable';
import datasetService from '../services/datasetService';
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

const DatasetUpload = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedData, setParsedData] = useState(null);
  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    format: 'CSV',
    delimiter: ',',
    tags: ['Tabular'],
    hasHeaders: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileParsed = (result) => {
    if (!result) {
      setParsedData(null);
      return;
    }

    const { file, parsed } = result;
    setParsedData(parsed);

    // Auto-fill dataset name from file name
    setMetadata((prev) => ({
      ...prev,
      name: prev.name || file.name,
      format: file.name.endsWith('.json') ? 'JSON' : 'CSV',
    }));
  };

  const handleSaveDataset = () => {
    if (!parsedData || !metadata.name) {
      setErrorMessage('Please upload a valid dataset file and provide a dataset name.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const newDataset = {
        name: metadata.name,
        description: metadata.description || 'Uploaded via Nexora Dataset Hub.',
        format: metadata.format || 'CSV',
        sizeBytes: selectedFile?.size || 150000,
        rowCount: parsedData.totalRowsEstimated || parsedData.rows.length,
        columnCount: parsedData.columns.length,
        uploadedAt: new Date().toISOString(),
        status: 'Ready',
        tags: metadata.tags || ['Tabular'],
        columns: parsedData.columns,
        sampleRows: parsedData.rows.slice(0, 20),
      };

      datasetService.saveDataset(newDataset);
      setSuccessMessage('Dataset registered and indexed successfully in Nexora Catalog!');

      setTimeout(() => {
        navigate('/dashboard/datasets');
      }, 1200);
    } catch (err) {
      setErrorMessage(`Failed to save dataset: ${err.message}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 mb-1">
            <Link
              to="/dashboard"
              className="hover:underline flex items-center space-x-1 text-slate-500 hover:text-indigo-600"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dataset Ingestion & Schema Inspector
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload raw data files, configure metadata, and inspect inferred schemas before running machine learning workflows.
          </p>
        </div>

        {/* Action Buttons */}
        {parsedData && (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSaveDataset}
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Registering...' : 'Save & Register Dataset'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Step 1: Drag & Drop File Upload */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
            1
          </span>
          <span>Upload Dataset File</span>
        </div>
        <DatasetDropzone
          onFileParsed={handleFileParsed}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          uploadProgress={uploadProgress}
          setUploadProgress={setUploadProgress}
        />
      </section>

      {/* Step 2: Metadata & Parsing Settings (Visible once file uploaded or parsing) */}
      {parsedData && (
        <section className="space-y-3 animate-fade-in">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
              2
            </span>
            <span>Metadata & Schema Configuration</span>
          </div>
          <DatasetMetadataForm metadata={metadata} setMetadata={setMetadata} />
        </section>
      )}

      {/* Step 3: Dataset Preview Table Layout */}
      {parsedData && (
        <section className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                3
              </span>
              <span>Dataset Preview & Statistical Health</span>
            </div>
          </div>

          <DatasetPreviewTable
            columns={parsedData.columns}
            rows={parsedData.rows}
            title={metadata.name || 'Dataset Preview'}
            totalRows={parsedData.totalRowsEstimated}
            fileSizeBytes={selectedFile?.size}
          />
        </section>
      )}

      {/* Bottom Save Banner */}
      {parsedData && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Ready to register {metadata.name}?</h3>
            <p className="text-indigo-200 text-xs mt-1">
              {parsedData.columns.length} columns and ~
              {(parsedData.totalRowsEstimated || parsedData.rows.length).toLocaleString()} rows
              will be indexed for preprocessing and model training.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={() => {
                setSelectedFile(null);
                setParsedData(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDataset}
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>{isSaving ? 'Registering...' : 'Confirm & Save Dataset'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetUpload;
