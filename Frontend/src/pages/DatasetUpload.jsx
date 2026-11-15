import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DatasetDropzone from '../components/datasets/DatasetDropzone';
import DatasetMetadataForm from '../components/datasets/DatasetMetadataForm';
import DatasetPreviewTable from '../components/datasets/DatasetPreviewTable';
import datasetService from '../services/datasetService';
import {
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  UploadCloud,
  Server,
  Loader2,
} from 'lucide-react';

const DatasetUpload = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  const [metadata, setMetadata] = useState({
    name: '',
    description: '',
    format: 'CSV',
    delimiter: ',',
    tags: ['Tabular'],
    hasHeaders: true,
  });

  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleFileParsed = (result) => {
    if (!result) {
      setParsedData(null);
      return;
    }

    const { file, parsed } = result;
    setParsedData(parsed);

    // Auto-fill dataset name and format from file
    const isJson = file.name.toLowerCase().endsWith('.json');
    setMetadata((prev) => ({
      ...prev,
      name: prev.name || file.name,
      format: isJson ? 'JSON' : 'CSV',
    }));
  };

  const handleUploadToBackend = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select or drag-and-drop a CSV or JSON dataset file first.');
      return;
    }

    if (!metadata.name || !metadata.name.trim()) {
      setErrorMessage('Please provide a name for this dataset.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      // Connect to Backend API via Axios and FormData with real-time progress tracking
      const result = await datasetService.uploadToBackend({
        file: selectedFile,
        metadata,
        onUploadProgress: (percent) => {
          setUploadProgress(percent);
        },
      });

      setSuccessInfo({
        title: 'Dataset Uploaded Successfully!',
        message: result.message || `Dataset "${metadata.name}" has been uploaded and indexed.`,
        datasetId: result.dataset?.id || `ds-${Date.now()}`,
        source: 'Nexora Backend API (:5000)',
        rowCount: result.dataset?.rowCount || parsedData?.totalRowsEstimated || parsedData?.rows?.length || 0,
        columnCount: result.dataset?.columnCount || parsedData?.columns?.length || 0,
      });

      setTimeout(() => {
        navigate('/dashboard/datasets');
      }, 1600);
    } catch (err) {
      console.error('Upload failed:', err);

      if (err.isOffline) {
        // Fallback: save to local catalog so user experience is not blocked
        const fallbackDataset = {
          name: metadata.name,
          description: metadata.description || 'Uploaded via Nexora Dataset Hub.',
          format: metadata.format || (selectedFile.name.endsWith('.json') ? 'JSON' : 'CSV'),
          sizeBytes: selectedFile.size,
          rowCount: parsedData?.totalRowsEstimated || parsedData?.rows?.length || 0,
          columnCount: parsedData?.columns?.length || 0,
          uploadedAt: new Date().toISOString(),
          status: 'Ready',
          tags: metadata.tags || ['Tabular'],
          columns: parsedData?.columns || [],
          sampleRows: parsedData?.rows?.slice(0, 20) || [],
        };
        datasetService.saveDataset(fallbackDataset);

        setSuccessInfo({
          title: 'Saved to Local Workspace Catalog',
          message: 'Backend API on port 5000 was unreachable. Dataset was indexed in offline storage.',
          datasetId: fallbackDataset.id,
          source: 'Local Storage (Offline Mode)',
          rowCount: fallbackDataset.rowCount,
          columnCount: fallbackDataset.columnCount,
        });

        setTimeout(() => {
          navigate('/dashboard/datasets');
        }, 1600);
      } else {
        setErrorMessage(err.message || 'An unexpected error occurred during dataset upload.');
      }
    } finally {
      setIsUploading(false);
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
            Upload raw CSV or JSON files, configure metadata, and transmit to the backend using Axios and FormData.
          </p>
        </div>

        {/* Top Upload Action Button */}
        {parsedData && (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleUploadToBackend}
              disabled={isUploading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading {uploadProgress}%...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload to Backend</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Upload Success Alert Banner */}
      {successInfo && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs animate-fade-in space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950">{successInfo.title}</h4>
                <p className="text-xs text-emerald-700 mt-0.5">{successInfo.message}</p>
              </div>
            </div>

            <Link
              to="/dashboard/datasets"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
            >
              <span>View in Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-medium text-emerald-800 border-t border-emerald-200/60">
            <span className="flex items-center">
              <Server className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Source: <span className="font-semibold ml-1">{successInfo.source}</span>
            </span>
            <span>•</span>
            <span>ID: <code className="font-mono">{successInfo.datasetId}</code></span>
            <span>•</span>
            <span>Indexed: <strong className="font-semibold">{successInfo.rowCount.toLocaleString()} rows</strong></span>
          </div>
        </div>
      )}

      {/* Upload Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs animate-fade-in flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-950">Upload Failed</h4>
              <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 px-2 py-1 rounded hover:bg-rose-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step 1: Drag & Drop File Upload */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
              1
            </span>
            <span>File Selection (Drag-and-Drop or CSV/JSON Button)</span>
          </div>
          <span className="text-xs text-slate-400">Supported: CSV, JSON, TSV</span>
        </div>

        <DatasetDropzone
          onFileParsed={handleFileParsed}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
        />
      </section>

      {/* Step 2: Metadata & Parsing Settings */}
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

      {/* Bottom Save & Transmission Banner */}
      {parsedData && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold">
              Transmit "{metadata.name}" to Backend
            </h3>
            <p className="text-indigo-200 text-xs max-w-xl">
              File will be sent via multipart <code>FormData</code> to <code>/api/datasets/upload</code> with full schema inference and row caching.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => {
                setSelectedFile(null);
                setParsedData(null);
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-sm transition-all disabled:opacity-40"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleUploadToBackend}
              disabled={isUploading}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Uploading ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <span>Upload & Transmit to API</span>
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetUpload;
