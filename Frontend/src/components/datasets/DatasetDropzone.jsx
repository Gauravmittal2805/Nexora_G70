import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  Loader2,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { formatBytes, parseCSVText } from '../../services/datasetService';

const ACCEPTED_EXTENSIONS = ['.csv', '.json', '.xlsx', '.tsv'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const DatasetDropzone = ({
  onFileParsed,
  selectedFile,
  setSelectedFile,
  uploadProgress = 0,
  isUploading = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [parseLoading, setParseLoading] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = useCallback(
    (file) => {
      setErrorMessage(null);

      // Validate file extension
      const fileNameLower = file.name.toLowerCase();
      const isValidExtension = ACCEPTED_EXTENSIONS.some((ext) => fileNameLower.endsWith(ext));

      if (!isValidExtension) {
        setErrorMessage(
          `Unsupported file type. Please upload a ${ACCEPTED_EXTENSIONS.join(', ')} file.`
        );
        return;
      }

      // Validate size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          `File size exceeds limit (${formatBytes(MAX_FILE_SIZE_BYTES)}). Please upload a smaller file.`
        );
        return;
      }

      setSelectedFile(file);
      setParseLoading(true);

      // Read file content for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          let parsedData = null;

          if (fileNameLower.endsWith('.csv') || fileNameLower.endsWith('.tsv')) {
            parsedData = parseCSVText(content);
          } else if (fileNameLower.endsWith('.json')) {
            const jsonParsed = JSON.parse(content);
            const arrayData = Array.isArray(jsonParsed)
              ? jsonParsed
              : jsonParsed.data || [jsonParsed];

            if (arrayData.length > 0 && typeof arrayData[0] === 'object') {
              const headers = Object.keys(arrayData[0]);
              parsedData = {
                headers,
                columns: headers.map((h) => ({
                  name: h,
                  type: typeof arrayData[0][h] === 'number' ? 'Float' : typeof arrayData[0][h] === 'boolean' ? 'Boolean' : 'String',
                  missingCount: 0,
                })),
                rows: arrayData.slice(0, 100),
                totalRowsEstimated: arrayData.length,
              };
            }
          }

          if (parsedData && onFileParsed) {
            onFileParsed({
              file,
              parsed: parsedData,
              rawText: content,
            });
          }
        } catch (err) {
          setErrorMessage(`Failed to parse file: ${err.message}`);
        } finally {
          setParseLoading(false);
        }
      };

      reader.onerror = () => {
        setErrorMessage('Failed to read file from disk.');
        setParseLoading(false);
      };

      reader.readAsText(file);
    },
    [onFileParsed, setSelectedFile]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileParsed) {
      onFileParsed(null);
    }
  };

  const handleOpenPicker = (filterType) => {
    if (fileInputRef.current) {
      if (filterType === 'csv') {
        fileInputRef.current.accept = '.csv,text/csv';
      } else if (filterType === 'json') {
        fileInputRef.current.accept = '.json,application/json';
      } else {
        fileInputRef.current.accept = ACCEPTED_EXTENSIONS.join(',');
      }
      fileInputRef.current.click();
    }
  };

  const isJson = selectedFile?.name?.toLowerCase().endsWith('.json');

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drop Zone Box */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => handleOpenPicker('all')}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/40 scale-[0.99] ring-4 ring-cyan-500/20'
              : 'border-slate-800 hover:border-cyan-500/50 bg-[#0a0f24] hover:bg-[#0e163b] shadow-xl'
          }`}
        >
          <div className="flex flex-col items-center max-w-md mx-auto">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200 ${
                isDragOver
                  ? 'bg-cyan-600 text-white scale-110 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                  : 'bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 group-hover:scale-105'
              }`}
            >
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              Drag & Drop your dataset file here
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              or browse your computer to select a CSV or JSON dataset
            </p>

            {/* Quick CSV / JSON File Selection Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => handleOpenPicker('csv')}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#070b1c] hover:bg-cyan-950 text-slate-200 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Select CSV File</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPicker('json')}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#070b1c] hover:bg-purple-950 text-slate-200 hover:text-purple-300 border border-slate-700 hover:border-purple-500/40 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <FileCode className="w-4 h-4 text-purple-400" />
                <span>Select JSON File</span>
              </button>
            </div>

            {/* Badges of supported formats */}
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span>Supported formats:</span>
              <span className="font-semibold text-cyan-400 font-mono">.CSV</span>
              <span>•</span>
              <span className="font-semibold text-purple-400 font-mono">.JSON</span>
              <span>•</span>
              <span className="font-semibold text-pink-400 font-mono">.TSV</span>
              <span>(Up to 50 MB)</span>
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Card: Displays file name, size, type and status */
        <div className="bg-[#0a0f24] rounded-3xl border border-cyan-500/25 p-6 shadow-xl transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isJson
                    ? 'bg-purple-950/80 border-purple-500/40 text-purple-400'
                    : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400'
                }`}
              >
                {isJson ? <FileCode className="w-7 h-7" /> : <FileSpreadsheet className="w-7 h-7" />}
              </div>

              <div className="overflow-hidden space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-white truncate">
                    {selectedFile.name}
                  </h4>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      isJson
                        ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                        : 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                    }`}
                  >
                    {isJson ? 'JSON' : 'CSV'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
                  <span className="flex items-center space-x-1">
                    <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-semibold text-white">
                      {formatBytes(selectedFile.size)}
                    </span>
                  </span>
                  <span>•</span>
                  <span>MIME: {selectedFile.type || (isJson ? 'application/json' : 'text/csv')}</span>
                  {selectedFile.lastModified && (
                    <>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(selectedFile.lastModified).toLocaleDateString()}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!isUploading && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Remove File & Re-select"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress / Loading Bar State */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span className="flex items-center">
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 mr-1.5 animate-spin" />
                    <span className="text-cyan-300 font-semibold">
                      Uploading to Nexora Backend API...
                    </span>
                  </>
                ) : parseLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-slate-400 mr-1.5 animate-spin" />
                    <span>Parsing tabular schema in browser...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
                    <span className="text-cyan-300 font-semibold">
                      File Loaded & Ready for Upload
                    </span>
                  </>
                )}
              </span>
              <span className="font-bold text-white font-mono">
                {isUploading ? `${uploadProgress}%` : '100%'}
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  isUploading
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 animate-pulse'
                    : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                }`}
                style={{ width: `${isUploading ? uploadProgress : 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default DatasetDropzone;
