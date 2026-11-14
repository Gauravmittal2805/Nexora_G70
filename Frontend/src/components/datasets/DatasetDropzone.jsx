import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { formatBytes, parseCSVText } from '../../services/datasetService';

const ACCEPTED_EXTENSIONS = ['.csv', '.json', '.xlsx', '.tsv'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

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

const SAMPLE_CSV_HOUSING = `Property_ID,Square_Feet,Bedrooms,Bathrooms,Neighborhood,Year_Built,Price_USD
PROP-1001,1850,3,2.0,Downtown,2018,425000
PROP-1002,2400,4,2.5,Suburbs North,2012,510000
PROP-1003,1200,2,1.0,East Bay,1998,295000
PROP-1004,3100,5,3.5,West Hills,2021,749000
PROP-1005,1650,3,2.0,Midtown,2005,380000
PROP-1006,2150,3,2.5,Suburbs North,2016,460000
PROP-1007,2800,4,3.0,West Hills,2020,680000
PROP-1008,1450,2,1.5,Downtown,2015,360000`;

const DatasetDropzone = ({
  onFileParsed,
  selectedFile,
  setSelectedFile,
  uploadProgress,
  setUploadProgress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
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
      setUploadProgress(0);

      // Simulate smooth upload progress
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 20;
        if (currentProgress >= 100) {
          clearInterval(interval);
          setUploadProgress(100);

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
                      type: typeof arrayData[0][h] === 'number' ? 'Float' : 'String',
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
            }
          };

          reader.readAsText(file);
        } else {
          setUploadProgress(currentProgress);
        }
      }, 80);
    },
    [onFileParsed, setSelectedFile, setUploadProgress]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
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
    setSelectedFile(null);
    setUploadProgress(0);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileParsed) {
      onFileParsed(null);
    }
  };

  const handleLoadSample = (sampleType) => {
    const isChurn = sampleType === 'churn';
    const csvContent = isChurn ? SAMPLE_CSV_CHURN : SAMPLE_CSV_HOUSING;
    const fileName = isChurn ? 'Sample_Customer_Churn.csv' : 'Sample_Housing_Prices.csv';
    const sampleBlob = new Blob([csvContent], { type: 'text/csv' });
    const sampleFile = new File([sampleBlob], fileName, { type: 'text/csv' });
    processFile(sampleFile);
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drop Zone Box */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99] ring-4 ring-indigo-500/10'
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
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              or <span className="text-indigo-600 font-semibold underline decoration-2">browse your computer</span> to upload
            </p>

            {/* Badges of supported formats */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                <FileCode className="w-3.5 h-3.5 text-amber-600" />
                <span>JSON</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>XLSX</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>TSV</span>
              </span>
              <span className="text-slate-400 text-xs font-medium ml-1">Up to 50 MB</span>
            </div>
          </div>
        </div>
      ) : (
        /* Selected File Card */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {selectedFile.name}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                    {selectedFile.name.split('.').pop()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatBytes(selectedFile.size)} • {uploadProgress === 100 ? 'Ready for preview' : 'Reading dataset...'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Remove File"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
              <span className="flex items-center">
                {uploadProgress === 100 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                    <span className="text-emerald-700 font-semibold">Ready to Preview</span>
                  </>
                ) : (
                  'Uploading & Parsing...'
                )}
              </span>
              <span className="font-semibold text-slate-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-200 ${
                  uploadProgress === 100
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sample dataset quick loader pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs">
        <div className="flex items-center space-x-2 text-indigo-900 font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Need test data? Try sample files:</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleLoadSample('churn')}
            className="px-3 py-1 rounded-lg bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 font-medium transition-colors shadow-2xs cursor-pointer"
          >
            Customer Churn (CSV)
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('housing')}
            className="px-3 py-1 rounded-lg bg-white hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 font-medium transition-colors shadow-2xs cursor-pointer"
          >
            Housing Prices (CSV)
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetDropzone;
