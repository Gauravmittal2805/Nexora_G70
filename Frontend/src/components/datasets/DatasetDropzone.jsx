import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileCode,
  Sparkles,
  Loader2,
  HardDrive,
  Calendar,
} from 'lucide-react';
import { formatBytes, parseCSVText } from '../../services/datasetService';

const ACCEPTED_EXTENSIONS = ['.csv', '.json', '.xlsx', '.tsv'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

// Sample CSV & JSON data
const SAMPLE_CSV_CHURN = `CustomerID,Age,Gender,Tenure_Months,Monthly_Charges,Total_Charges,Contract_Type,Churn
CUST-7021,34,Female,12,65.40,784.80,Month-to-month,No
CUST-8842,52,Male,48,98.20,4713.60,Two year,No
CUST-1094,29,Female,3,79.85,239.55,Month-to-month,Yes
CUST-4501,41,Male,24,54.10,1298.40,One year,No
CUST-9018,63,Female,8,104.90,839.20,Month-to-month,Yes
CUST-2231,38,Male,36,45.00,1620.00,One year,No
CUST-3189,47,Female,60,112.50,6750.00,Two year,No
CUST-5512,23,Male,2,85.30,170.60,Month-to-month,Yes
CUST-6043,31,Female,18,70.15,1262.70,Month-to-month,No
CUST-7789,56,Male,42,93.00,3906.00,One year,No`;

const SAMPLE_JSON_IOT = `[
  { "device_id": "DEV-101", "temperature_c": 22.4, "humidity_pct": 45.2, "pressure_kpa": 101.3, "status": "ONLINE", "alert": false },
  { "device_id": "DEV-102", "temperature_c": 28.1, "humidity_pct": 60.5, "pressure_kpa": 100.8, "status": "ONLINE", "alert": false },
  { "device_id": "DEV-103", "temperature_c": 35.8, "humidity_pct": 82.0, "pressure_kpa": 98.4, "status": "WARNING", "alert": true },
  { "device_id": "DEV-104", "temperature_c": 19.5, "humidity_pct": 40.1, "pressure_kpa": 102.1, "status": "ONLINE", "alert": false },
  { "device_id": "DEV-105", "temperature_c": 39.2, "humidity_pct": 88.4, "pressure_kpa": 97.9, "status": "CRITICAL", "alert": true }
]`;

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

  const handleLoadSample = (sampleType) => {
    if (isUploading) return;
    if (sampleType === 'churn') {
      const sampleBlob = new Blob([SAMPLE_CSV_CHURN], { type: 'text/csv' });
      const sampleFile = new File([sampleBlob], 'Customer_Churn_Analysis.csv', { type: 'text/csv' });
      processFile(sampleFile);
    } else {
      const sampleBlob = new Blob([SAMPLE_JSON_IOT], { type: 'application/json' });
      const sampleFile = new File([sampleBlob], 'IoT_Telemetry_Sensors.json', { type: 'application/json' });
      processFile(sampleFile);
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
              ? 'border-indigo-600 bg-indigo-50/80 scale-[0.99] ring-4 ring-indigo-500/15'
              : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/70 shadow-xs'
          }`}
        >
          <div className="flex flex-col items-center max-w-md mx-auto">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200 ${
                isDragOver
                  ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/30'
                  : 'bg-indigo-50 text-indigo-600 group-hover:scale-105'
              }`}
            >
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Drag & Drop your dataset file here
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              or browse your computer to select a CSV or JSON dataset
            </p>

            {/* Quick CSV / JSON File Selection Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => handleOpenPicker('csv')}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Select CSV File</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenPicker('json')}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <FileCode className="w-4 h-4 text-amber-600" />
                <span>Select JSON File</span>
              </button>
            </div>

            {/* Badges of supported formats */}
            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <span>Supported formats:</span>
              <span className="font-semibold text-slate-600 font-mono">.CSV</span>
              <span>•</span>
              <span className="font-semibold text-slate-600 font-mono">.JSON</span>
              <span>•</span>
              <span className="font-semibold text-slate-600 font-mono">.TSV</span>
              <span>(Up to 50 MB)</span>
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Card: Displays file name, size, type and status */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  isJson ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {isJson ? <FileCode className="w-7 h-7" /> : <FileSpreadsheet className="w-7 h-7" />}
              </div>

              <div className="overflow-hidden space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-slate-900 truncate">
                    {selectedFile.name}
                  </h4>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isJson ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isJson ? 'JSON' : 'CSV'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center space-x-1">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">
                      {formatBytes(selectedFile.size)}
                    </span>
                  </span>
                  <span>•</span>
                  <span>MIME: {selectedFile.type || (isJson ? 'application/json' : 'text/csv')}</span>
                  {selectedFile.lastModified && (
                    <>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Remove File & Re-select"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress / Loading Bar State */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span className="flex items-center">
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-indigo-600 mr-1.5 animate-spin" />
                    <span className="text-indigo-700 font-semibold">
                      Uploading to Nexora Backend API...
                    </span>
                  </>
                ) : parseLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-slate-500 mr-1.5 animate-spin" />
                    <span>Parsing tabular schema in browser...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                    <span className="text-emerald-700 font-semibold">
                      File Loaded & Ready for Upload
                    </span>
                  </>
                )}
              </span>
              <span className="font-bold text-slate-800 font-mono">
                {isUploading ? `${uploadProgress}%` : '100%'}
              </span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  isUploading
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${isUploading ? uploadProgress : 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center space-x-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Sample dataset quick loader pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
        <div className="flex items-center space-x-2 text-indigo-900 font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Need demo data? Try pre-packaged samples:</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => handleLoadSample('churn')}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            Customer Churn (CSV)
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => handleLoadSample('iot')}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 font-semibold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            IoT Sensors (JSON)
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetDropzone;
