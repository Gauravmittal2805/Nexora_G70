/**
 * Dataset Service for Nexora
 * Handles client-side storage, sample datasets, CSV/JSON parsing, type inference,
 * paginated preview queries, and visual field-mapping logic.
 */

import api from './api';

// Initial preloaded datasets with rich rows and wide schemas for testing & offline mode
const INITIAL_DATASETS = [
  {
    id: 'ds-churn-101',
    datasetId: 'ds-churn-101',
    name: 'Customer_Churn_Analysis.csv',
    description: 'Telecom customer behavior and subscription dataset for churn prediction modeling.',
    format: 'CSV',
    fileType: 'csv',
    sizeBytes: 142850,
    fileSize: 142850,
    rowCount: 2500,
    columnCount: 8,
    uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'Ready',
    tags: ['Telecom', 'Classification', 'Tabular'],
    columns: [
      { name: 'CustomerID', type: 'String', missingCount: 0 },
      { name: 'Age', type: 'Integer', missingCount: 0 },
      { name: 'Gender', type: 'Categorical', missingCount: 0 },
      { name: 'Tenure_Months', type: 'Integer', missingCount: 2 },
      { name: 'Monthly_Charges', type: 'Float', missingCount: 0 },
      { name: 'Total_Charges', type: 'Float', missingCount: 1 },
      { name: 'Contract_Type', type: 'Categorical', missingCount: 0 },
      { name: 'Churn', type: 'Boolean', missingCount: 0 },
    ],
    sampleRows: [
      { CustomerID: 'CUST-7021', Age: 34, Gender: 'Female', Tenure_Months: 12, Monthly_Charges: 65.40, Total_Charges: 784.80, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-8842', Age: 52, Gender: 'Male', Tenure_Months: 48, Monthly_Charges: 98.20, Total_Charges: 4713.60, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-1094', Age: 29, Gender: 'Female', Tenure_Months: 3, Monthly_Charges: 79.85, Total_Charges: 239.55, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-4501', Age: 41, Gender: 'Male', Tenure_Months: 24, Monthly_Charges: 54.10, Total_Charges: 1298.40, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-9018', Age: 63, Gender: 'Female', Tenure_Months: 8, Monthly_Charges: 104.90, Total_Charges: 839.20, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-2231', Age: 38, Gender: 'Male', Tenure_Months: 36, Monthly_Charges: 45.00, Total_Charges: 1620.00, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-3189', Age: 47, Gender: 'Female', Tenure_Months: 60, Monthly_Charges: 112.50, Total_Charges: 6750.00, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-5512', Age: 23, Gender: 'Male', Tenure_Months: 2, Monthly_Charges: 85.30, Total_Charges: 170.60, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-6043', Age: 31, Gender: 'Female', Tenure_Months: 18, Monthly_Charges: 70.15, Total_Charges: 1262.70, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-7789', Age: 56, Gender: 'Male', Tenure_Months: 42, Monthly_Charges: 93.00, Total_Charges: 3906.00, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-8102', Age: 45, Gender: 'Female', Tenure_Months: 15, Monthly_Charges: 62.50, Total_Charges: 937.50, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-9423', Age: 39, Gender: 'Male', Tenure_Months: 7, Monthly_Charges: 88.75, Total_Charges: 621.25, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-3310', Age: 61, Gender: 'Female', Tenure_Months: 54, Monthly_Charges: 108.20, Total_Charges: 5842.80, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-4112', Age: 27, Gender: 'Male', Tenure_Months: 5, Monthly_Charges: 49.90, Total_Charges: 249.50, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-5678', Age: 35, Gender: 'Female', Tenure_Months: 29, Monthly_Charges: 75.40, Total_Charges: 2186.60, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-6901', Age: 49, Gender: 'Male', Tenure_Months: 11, Monthly_Charges: 91.10, Total_Charges: 1002.10, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-7234', Age: 33, Gender: 'Female', Tenure_Months: 22, Monthly_Charges: 58.00, Total_Charges: 1276.00, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-8890', Age: 58, Gender: 'Male', Tenure_Months: 66, Monthly_Charges: 119.45, Total_Charges: 7883.70, Contract_Type: 'Two year', Churn: 'No' },
      { CustomerID: 'CUST-9124', Age: 42, Gender: 'Female', Tenure_Months: 19, Monthly_Charges: 73.20, Total_Charges: 1390.80, Contract_Type: 'Month-to-month', Churn: 'No' },
      { CustomerID: 'CUST-9582', Age: 26, Gender: 'Male', Tenure_Months: 4, Monthly_Charges: 81.60, Total_Charges: 326.40, Contract_Type: 'Month-to-month', Churn: 'Yes' },
      { CustomerID: 'CUST-9821', Age: 50, Gender: 'Female', Tenure_Months: 38, Monthly_Charges: 94.50, Total_Charges: 3591.00, Contract_Type: 'One year', Churn: 'No' },
      { CustomerID: 'CUST-9944', Age: 36, Gender: 'Male', Tenure_Months: 14, Monthly_Charges: 68.30, Total_Charges: 956.20, Contract_Type: 'Month-to-month', Churn: 'No' },
    ],
    mapping: {
      target: 'Churn',
      id: 'CustomerID',
      numerical: ['Age', 'Tenure_Months', 'Monthly_Charges', 'Total_Charges'],
      categorical: ['Gender', 'Contract_Type'],
      datetime: [],
      ignored: [],
    },
  },
  {
    id: 'ds-financial-404',
    datasetId: 'ds-financial-404',
    name: 'Global_Financial_Metrics.csv',
    description: 'Corporate valuation, balance sheet ratios, and market performance metrics across global equities.',
    format: 'CSV',
    fileType: 'csv',
    sizeBytes: 512400,
    fileSize: 512400,
    rowCount: 3800,
    columnCount: 16,
    uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'Ready',
    tags: ['Finance', 'Multi-Column', 'Valuation'],
    columns: [
      { name: 'Company_ID', type: 'String', missingCount: 0 },
      { name: 'Ticker', type: 'String', missingCount: 0 },
      { name: 'Company_Name', type: 'String', missingCount: 0 },
      { name: 'Sector', type: 'Categorical', missingCount: 0 },
      { name: 'Industry', type: 'Categorical', missingCount: 0 },
      { name: 'Country', type: 'Categorical', missingCount: 0 },
      { name: 'Market_Cap_B', type: 'Float', missingCount: 0 },
      { name: 'Revenue_TTM_B', type: 'Float', missingCount: 0 },
      { name: 'EBITDA_Margin_Pct', type: 'Float', missingCount: 1 },
      { name: 'PE_Ratio', type: 'Float', missingCount: 2 },
      { name: 'Debt_to_Equity', type: 'Float', missingCount: 0 },
      { name: 'Dividend_Yield_Pct', type: 'Float', missingCount: 3 },
      { name: 'Beta_5Y', type: 'Float', missingCount: 0 },
      { name: 'Credit_Rating', type: 'Categorical', missingCount: 0 },
      { name: 'ESG_Score', type: 'Integer', missingCount: 0 },
      { name: 'Outperform', type: 'Boolean', missingCount: 0 },
    ],
    sampleRows: [
      { Company_ID: 'EQ-001', Ticker: 'NVDA', Company_Name: 'NVIDIA Corp', Sector: 'Technology', Industry: 'Semiconductors', Country: 'USA', Market_Cap_B: 3250.4, Revenue_TTM_B: 96.3, EBITDA_Margin_Pct: 62.1, PE_Ratio: 58.2, Debt_to_Equity: 0.42, Dividend_Yield_Pct: 0.08, Beta_5Y: 1.68, Credit_Rating: 'AAA', ESG_Score: 84, Outperform: true },
      { Company_ID: 'EQ-002', Ticker: 'MSFT', Company_Name: 'Microsoft Corp', Sector: 'Technology', Industry: 'Software', Country: 'USA', Market_Cap_B: 3100.8, Revenue_TTM_B: 245.1, EBITDA_Margin_Pct: 49.3, PE_Ratio: 34.6, Debt_to_Equity: 0.38, Dividend_Yield_Pct: 0.72, Beta_5Y: 1.15, Credit_Rating: 'AAA', ESG_Score: 89, Outperform: true },
      { Company_ID: 'EQ-003', Ticker: 'TSM', Company_Name: 'TSMC Ltd', Sector: 'Technology', Industry: 'Semiconductors', Country: 'Taiwan', Market_Cap_B: 890.5, Revenue_TTM_B: 72.8, EBITDA_Margin_Pct: 68.4, PE_Ratio: 24.1, Debt_to_Equity: 0.28, Dividend_Yield_Pct: 1.45, Beta_5Y: 1.22, Credit_Rating: 'AA+', ESG_Score: 78, Outperform: true },
      { Company_ID: 'EQ-004', Ticker: 'JNJ', Company_Name: 'Johnson & Johnson', Sector: 'Healthcare', Industry: 'Pharmaceuticals', Country: 'USA', Market_Cap_B: 385.2, Revenue_TTM_B: 85.1, EBITDA_Margin_Pct: 34.2, PE_Ratio: 16.8, Debt_to_Equity: 0.52, Dividend_Yield_Pct: 3.12, Beta_5Y: 0.62, Credit_Rating: 'AAA', ESG_Score: 82, Outperform: false },
      { Company_ID: 'EQ-005', Ticker: 'ASML', Company_Name: 'ASML Holding', Sector: 'Technology', Industry: 'Semiconductor Equip', Country: 'Netherlands', Market_Cap_B: 320.1, Revenue_TTM_B: 28.4, EBITDA_Margin_Pct: 32.7, PE_Ratio: 41.5, Debt_to_Equity: 0.35, Dividend_Yield_Pct: 0.95, Beta_5Y: 1.34, Credit_Rating: 'AA', ESG_Score: 91, Outperform: true },
      { Company_ID: 'EQ-006', Ticker: 'XOM', Company_Name: 'Exxon Mobil', Sector: 'Energy', Industry: 'Oil & Gas', Country: 'USA', Market_Cap_B: 475.6, Revenue_TTM_B: 344.5, EBITDA_Margin_Pct: 22.8, PE_Ratio: 13.4, Debt_to_Equity: 0.18, Dividend_Yield_Pct: 3.45, Beta_5Y: 0.88, Credit_Rating: 'AA', ESG_Score: 64, Outperform: false },
      { Company_ID: 'EQ-007', Ticker: 'SAP', Company_Name: 'SAP SE', Sector: 'Technology', Industry: 'Enterprise Software', Country: 'Germany', Market_Cap_B: 260.4, Revenue_TTM_B: 34.2, EBITDA_Margin_Pct: 29.5, PE_Ratio: 37.8, Debt_to_Equity: 0.44, Dividend_Yield_Pct: 1.15, Beta_5Y: 1.05, Credit_Rating: 'A+', ESG_Score: 87, Outperform: true },
      { Company_ID: 'EQ-008', Ticker: 'NVO', Company_Name: 'Novo Nordisk', Sector: 'Healthcare', Industry: 'Biotech', Country: 'Denmark', Market_Cap_B: 540.2, Revenue_TTM_B: 35.8, EBITDA_Margin_Pct: 46.1, PE_Ratio: 42.1, Debt_to_Equity: 0.22, Dividend_Yield_Pct: 1.30, Beta_5Y: 0.74, Credit_Rating: 'AA-', ESG_Score: 85, Outperform: true },
      { Company_ID: 'EQ-009', Ticker: 'JPM', Company_Name: 'JPMorgan Chase', Sector: 'Financials', Industry: 'Banking', Country: 'USA', Market_Cap_B: 610.5, Revenue_TTM_B: 158.4, EBITDA_Margin_Pct: 38.6, PE_Ratio: 12.2, Debt_to_Equity: 1.25, Dividend_Yield_Pct: 2.35, Beta_5Y: 1.08, Credit_Rating: 'AA-', ESG_Score: 76, Outperform: true },
      { Company_ID: 'EQ-010', Ticker: 'TM', Company_Name: 'Toyota Motor', Sector: 'Consumer', Industry: 'Automotive', Country: 'Japan', Market_Cap_B: 295.8, Revenue_TTM_B: 310.2, EBITDA_Margin_Pct: 14.2, PE_Ratio: 9.8, Debt_to_Equity: 1.10, Dividend_Yield_Pct: 2.80, Beta_5Y: 0.72, Credit_Rating: 'A+', ESG_Score: 73, Outperform: false },
    ],
    mapping: {
      target: 'Outperform',
      id: 'Company_ID',
      numerical: ['Market_Cap_B', 'Revenue_TTM_B', 'EBITDA_Margin_Pct', 'PE_Ratio', 'Debt_to_Equity', 'Dividend_Yield_Pct', 'Beta_5Y', 'ESG_Score'],
      categorical: ['Sector', 'Industry', 'Country', 'Credit_Rating'],
      datetime: [],
      ignored: ['Ticker', 'Company_Name'],
    },
  },
  {
    id: 'ds-housing-202',
    datasetId: 'ds-housing-202',
    name: 'Housing_Price_Index_2025.csv',
    description: 'Metropolitan residential real estate sales records with structural and location features.',
    format: 'CSV',
    fileType: 'csv',
    sizeBytes: 284910,
    fileSize: 284910,
    rowCount: 5400,
    columnCount: 7,
    uploadedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'Ready',
    tags: ['Real Estate', 'Regression', 'Geo'],
    columns: [
      { name: 'Property_ID', type: 'String', missingCount: 0 },
      { name: 'Square_Feet', type: 'Integer', missingCount: 0 },
      { name: 'Bedrooms', type: 'Integer', missingCount: 0 },
      { name: 'Bathrooms', type: 'Float', missingCount: 1 },
      { name: 'Neighborhood', type: 'Categorical', missingCount: 0 },
      { name: 'Year_Built', type: 'Integer', missingCount: 0 },
      { name: 'Price_USD', type: 'Float', missingCount: 0 },
    ],
    sampleRows: [
      { Property_ID: 'PROP-1001', Square_Feet: 1850, Bedrooms: 3, Bathrooms: 2.0, Neighborhood: 'Downtown', Year_Built: 2018, Price_USD: 425000 },
      { Property_ID: 'PROP-1002', Square_Feet: 2400, Bedrooms: 4, Bathrooms: 2.5, Neighborhood: 'Suburbs North', Year_Built: 2012, Price_USD: 510000 },
      { Property_ID: 'PROP-1003', Square_Feet: 1200, Bedrooms: 2, Bathrooms: 1.0, Neighborhood: 'East Bay', Year_Built: 1998, Price_USD: 295000 },
      { Property_ID: 'PROP-1004', Square_Feet: 3100, Bedrooms: 5, Bathrooms: 3.5, Neighborhood: 'West Hills', Year_Built: 2021, Price_USD: 749000 },
      { Property_ID: 'PROP-1005', Square_Feet: 1650, Bedrooms: 3, Bathrooms: 2.0, Neighborhood: 'Midtown', Year_Built: 2005, Price_USD: 380000 },
      { Property_ID: 'PROP-1006', Square_Feet: 2150, Bedrooms: 3, Bathrooms: 2.5, Neighborhood: 'Suburbs North', Year_Built: 2016, Price_USD: 460000 },
      { Property_ID: 'PROP-1007', Square_Feet: 2800, Bedrooms: 4, Bathrooms: 3.0, Neighborhood: 'Lakeside', Year_Built: 2019, Price_USD: 635000 },
      { Property_ID: 'PROP-1008', Square_Feet: 1400, Bedrooms: 2, Bathrooms: 1.5, Neighborhood: 'Old Town', Year_Built: 1985, Price_USD: 315000 },
      { Property_ID: 'PROP-1009', Square_Feet: 3600, Bedrooms: 5, Bathrooms: 4.0, Neighborhood: 'West Hills', Year_Built: 2023, Price_USD: 890000 },
      { Property_ID: 'PROP-1010', Square_Feet: 1950, Bedrooms: 3, Bathrooms: 2.0, Neighborhood: 'Downtown', Year_Built: 2014, Price_USD: 445000 },
      { Property_ID: 'PROP-1011', Square_Feet: 2250, Bedrooms: 4, Bathrooms: 2.5, Neighborhood: 'Lakeside', Year_Built: 2017, Price_USD: 530000 },
      { Property_ID: 'PROP-1012', Square_Feet: 1100, Bedrooms: 2, Bathrooms: 1.0, Neighborhood: 'East Bay', Year_Built: 1992, Price_USD: 275000 },
      { Property_ID: 'PROP-1013', Square_Feet: 2700, Bedrooms: 4, Bathrooms: 3.0, Neighborhood: 'Suburbs North', Year_Built: 2020, Price_USD: 585000 },
      { Property_ID: 'PROP-1014', Square_Feet: 1550, Bedrooms: 3, Bathrooms: 2.0, Neighborhood: 'Midtown', Year_Built: 2008, Price_USD: 365000 },
      { Property_ID: 'PROP-1015', Square_Feet: 2050, Bedrooms: 3, Bathrooms: 2.5, Neighborhood: 'Downtown', Year_Built: 2015, Price_USD: 475000 },
      { Property_ID: 'PROP-1016', Square_Feet: 3300, Bedrooms: 5, Bathrooms: 4.0, Neighborhood: 'West Hills', Year_Built: 2022, Price_USD: 810000 },
      { Property_ID: 'PROP-1017', Square_Feet: 1750, Bedrooms: 3, Bathrooms: 2.0, Neighborhood: 'Lakeside', Year_Built: 2011, Price_USD: 415000 },
      { Property_ID: 'PROP-1018', Square_Feet: 1350, Bedrooms: 2, Bathrooms: 1.5, Neighborhood: 'Old Town', Year_Built: 1989, Price_USD: 305000 },
    ],
    mapping: {
      target: 'Price_USD',
      id: 'Property_ID',
      numerical: ['Square_Feet', 'Bedrooms', 'Bathrooms', 'Year_Built'],
      categorical: ['Neighborhood'],
      datetime: [],
      ignored: [],
    },
  },
  {
    id: 'ds-iot-303',
    datasetId: 'ds-iot-303',
    name: 'IoT_Telemetry_Sensors.json',
    description: 'Industrial sensor telemetry streams capturing environmental metrics and anomaly flags.',
    format: 'JSON',
    fileType: 'json',
    sizeBytes: 96420,
    fileSize: 96420,
    rowCount: 1800,
    columnCount: 6,
    uploadedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    status: 'Ready',
    tags: ['IoT', 'Time Series', 'Anomalies'],
    columns: [
      { name: 'device_id', type: 'String', missingCount: 0 },
      { name: 'temperature_c', type: 'Float', missingCount: 0 },
      { name: 'humidity_pct', type: 'Float', missingCount: 0 },
      { name: 'pressure_kpa', type: 'Float', missingCount: 0 },
      { name: 'status', type: 'Categorical', missingCount: 0 },
      { name: 'alert', type: 'Boolean', missingCount: 0 },
    ],
    sampleRows: [
      { device_id: 'DEV-101', temperature_c: 22.4, humidity_pct: 45.2, pressure_kpa: 101.3, status: 'ONLINE', alert: false },
      { device_id: 'DEV-102', temperature_c: 28.1, humidity_pct: 60.5, pressure_kpa: 100.8, status: 'ONLINE', alert: false },
      { device_id: 'DEV-103', temperature_c: 35.8, humidity_pct: 82.0, pressure_kpa: 98.4, status: 'WARNING', alert: true },
      { device_id: 'DEV-104', temperature_c: 19.5, humidity_pct: 40.1, pressure_kpa: 102.1, status: 'ONLINE', alert: false },
      { device_id: 'DEV-105', temperature_c: 39.2, humidity_pct: 88.4, pressure_kpa: 97.9, status: 'CRITICAL', alert: true },
      { device_id: 'DEV-106', temperature_c: 21.8, humidity_pct: 48.0, pressure_kpa: 101.5, status: 'ONLINE', alert: false },
      { device_id: 'DEV-107', temperature_c: 24.3, humidity_pct: 52.6, pressure_kpa: 101.0, status: 'ONLINE', alert: false },
      { device_id: 'DEV-108', temperature_c: 31.7, humidity_pct: 71.4, pressure_kpa: 99.2, status: 'WARNING', alert: true },
      { device_id: 'DEV-109', temperature_c: 20.1, humidity_pct: 43.8, pressure_kpa: 101.8, status: 'ONLINE', alert: false },
      { device_id: 'DEV-110', temperature_c: 23.5, humidity_pct: 50.2, pressure_kpa: 101.2, status: 'ONLINE', alert: false },
      { device_id: 'DEV-111', temperature_c: 41.0, humidity_pct: 91.2, pressure_kpa: 96.5, status: 'CRITICAL', alert: true },
      { device_id: 'DEV-112', temperature_c: 22.9, humidity_pct: 46.7, pressure_kpa: 101.4, status: 'ONLINE', alert: false },
      { device_id: 'DEV-113', temperature_c: 33.4, humidity_pct: 75.1, pressure_kpa: 99.0, status: 'WARNING', alert: true },
      { device_id: 'DEV-114', temperature_c: 25.1, humidity_pct: 54.3, pressure_kpa: 101.1, status: 'ONLINE', alert: false },
    ],
    mapping: {
      target: 'alert',
      id: 'device_id',
      numerical: ['temperature_c', 'humidity_pct', 'pressure_kpa'],
      categorical: ['status'],
      datetime: [],
      ignored: [],
    },
  },
];

const STORAGE_KEY = 'nexora_datasets_catalog';

/**
 * Standardize and normalize dataset structure from server / storage
 */
export function normalizeDataset(raw) {
  if (!raw) return null;
  const id = raw.id || raw.datasetId || `ds-${Date.now()}`;
  const name = raw.name || raw.fileName || 'Untitled Dataset';
  const format = (raw.format || (raw.fileType ? raw.fileType.toUpperCase() : 'CSV')).toUpperCase();
  const fileType = (raw.fileType || format).toLowerCase();
  const sizeBytes = Number(raw.sizeBytes ?? raw.fileSize ?? 0);
  const uploadedAt = raw.uploadedAt || raw.createdAt || new Date().toISOString();
  const rowCount = Number(raw.rowCount ?? raw.metadata?.rowCount ?? raw.sampleRows?.length ?? 0);
  const columnCount = Number(raw.columnCount ?? raw.metadata?.columnCount ?? raw.columns?.length ?? 0);

  return {
    id,
    datasetId: id,
    name,
    description: raw.description || '',
    format,
    fileType,
    sizeBytes,
    fileSize: sizeBytes,
    rowCount,
    columnCount,
    uploadedAt,
    createdAt: uploadedAt,
    status: raw.status || 'Ready',
    tags: Array.isArray(raw.tags) && raw.tags.length > 0 ? raw.tags : ['Tabular'],
    columns: raw.columns || raw.metadata?.columns || [],
    sampleRows: raw.sampleRows || raw.rows || [],
    storagePath: raw.storagePath || raw.storageUrl || '',
    mapping: raw.mapping || autoSuggestMapping(raw.columns || []),
  };
}

/**
 * Heuristic Auto-Mapping logic based on column names and data types
 */
export function autoSuggestMapping(columns = []) {
  if (!columns || columns.length === 0) {
    return { target: '', id: '', numerical: [], categorical: [], datetime: [], ignored: [] };
  }

  const colNames = columns.map((c) => c.name);

  // 1. Guess Target Column (prediction variable)
  const targetCol = colNames.find((n) =>
    /^(churn|target|label|price|fraud|status|alert|outcome|y|is_|bought|converted|success)/i.test(n) ||
    /(_churn|_target|_label|_price|_class|_flag)$/i.test(n)
  ) || (columns.find((c) => c.type === 'Boolean')?.name || '');

  // 2. Guess Entity ID Column
  const idCol = colNames.find((n) =>
    /^id$|(_id$)|(id_)|^pk$|(_pk$)|(code$)|(uuid$)|(key$)/i.test(n) && n !== targetCol
  ) || '';

  // 3. Classify remaining columns
  const numerical = [];
  const categorical = [];
  const datetime = [];
  const ignored = [];

  columns.forEach((col) => {
    const name = col.name;
    if (name === targetCol || name === idCol) return;

    if (col.type === 'DateTime' || /(date|time|year|timestamp|created|updated)/i.test(name)) {
      datetime.push(name);
    } else if (col.type === 'Integer' || col.type === 'Float') {
      numerical.push(name);
    } else if (col.type === 'Categorical' || col.type === 'Boolean' || col.type === 'String') {
      // Check if it looks like arbitrary free text or description to ignore
      if (/(description|comment|text|raw_|notes|url|link|address)/i.test(name)) {
        ignored.push(name);
      } else {
        categorical.push(name);
      }
    } else {
      categorical.push(name);
    }
  });

  return {
    target: targetCol,
    id: idCol,
    numerical,
    categorical,
    datetime,
    ignored,
  };
}

/**
 * Infer data type of a column based on an array of values
 */
export function inferDataType(values) {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'String';

  let isInt = true;
  let isFloat = true;
  let isBool = true;
  let isDate = true;

  for (const val of nonNullValues.slice(0, 50)) {
    const s = String(val).trim().toLowerCase();

    // Check boolean
    if (!['true', 'false', '0', '1', 'yes', 'no'].includes(s)) {
      isBool = false;
    }

    // Check integer
    if (!/^-?\d+$/.test(s)) {
      isInt = false;
    }

    // Check float
    if (!/^-?\d+(\.\d+)?$/.test(s)) {
      isFloat = false;
    }

    // Check date
    if (isNaN(Date.parse(s)) || /^\d+$/.test(s)) {
      isDate = false;
    }
  }

  if (isBool && nonNullValues.length > 0) return 'Boolean';
  if (isInt) return 'Integer';
  if (isFloat) return 'Float';
  if (isDate) return 'DateTime';

  const uniqueVals = new Set(nonNullValues);
  if (uniqueVals.size <= 8 && nonNullValues.length >= 10) return 'Categorical';

  return 'String';
}

/**
 * Parse CSV text into headers and row objects
 */
export function parseCSVText(csvContent, maxPreviewRows = 200) {
  if (!csvContent || typeof csvContent !== 'string') {
    throw new Error('Invalid CSV file content.');
  }

  const rawLines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const lines = rawLines.filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const splitLine = (text) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const rawHeaders = splitLine(lines[0]);
  const headers = rawHeaders.map((h, i) => (h ? h : `Column_${i + 1}`));

  const rows = [];
  const previewSlice = lines.slice(1, maxPreviewRows + 1);

  for (const line of previewSlice) {
    const values = splitLine(line);
    const rowObj = {};
    headers.forEach((header, idx) => {
      let val = values[idx] !== undefined ? values[idx] : '';
      if (/^-?\d+$/.test(val)) {
        rowObj[header] = parseInt(val, 10);
      } else if (/^-?\d+(\.\d+)?$/.test(val)) {
        rowObj[header] = parseFloat(val);
      } else {
        rowObj[header] = val;
      }
    });
    rows.push(rowObj);
  }

  const columns = headers.map((header) => {
    const colValues = rows.map((r) => r[header]);
    const missingCount = colValues.filter((v) => v === '' || v === null || v === undefined).length;
    return {
      name: header,
      type: inferDataType(colValues),
      missingCount,
    };
  });

  return {
    headers,
    columns,
    rows,
    totalRowsEstimated: lines.length - 1,
  };
}

/**
 * Format bytes to human readable format (KB, MB, GB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format date to clean, localized string
 */
export function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateString);
  }
}

/**
 * Format relative time (e.g., "5 mins ago", "2 hours ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export const datasetService = {
  /**
   * Upload dataset to Backend API using Axios and FormData
   * Supports real-time onUploadProgress tracking
   */
  uploadToBackend: async ({ file, metadata = {}, onUploadProgress }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.format) formData.append('format', metadata.format);
    if (metadata.delimiter) formData.append('delimiter', metadata.delimiter);
    if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
    if (metadata.hasHeaders !== undefined) formData.append('hasHeaders', String(metadata.hasHeaders));

    try {
      const response = await api.post('/datasets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onUploadProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percent);
          }
        },
      });

      const serverDataset = normalizeDataset(response.data?.dataset || response.data?.data);
      if (serverDataset) {
        datasetService.saveDataset(serverDataset);
      }

      return {
        success: true,
        source: 'Nexora Backend API',
        message: response.data?.message || 'Dataset uploaded successfully to Nexora Backend!',
        dataset: serverDataset,
      };
    } catch (error) {
      const isConnectionRefused =
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK' ||
        error.originalError?.code === 'ECONNREFUSED' ||
        error.status === 404;

      if (isConnectionRefused) {
        const enriched = new Error(
          'Backend server is not reachable on port 5000. Saved to local storage catalog.'
        );
        enriched.isOffline = true;
        enriched.originalError = error;
        throw enriched;
      }

      throw error;
    }
  },

  /**
   * Fetch datasets from backend API with fallback to local storage
   */
  fetchDatasets: async () => {
    try {
      const res = await api.get('/datasets');
      const rawList = res.data?.datasets || res.data?.data || (Array.isArray(res.data) ? res.data : null);

      if (Array.isArray(rawList)) {
        const normalizedList = rawList.map(normalizeDataset).filter(Boolean);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedList));
        } catch (e) {
          console.warn('LocalStorage sync warning:', e);
        }
        const result = [...normalizedList];
        result.datasets = normalizedList;
        result.isOffline = false;
        result.success = true;
        return result;
      }

      const cached = datasetService.getDatasets();
      const result = [...cached];
      result.datasets = cached;
      result.isOffline = false;
      result.success = true;
      return result;
    } catch (err) {
      console.warn('Backend API unreachable, loading offline dataset catalog:', err.message);
      const cached = datasetService.getDatasets();
      const result = [...cached];
      result.datasets = cached;
      result.isOffline = true;
      result.success = true;
      result.error = err.message;
      return result;
    }
  },

  /**
   * Fetch paginated dataset preview records from Backend API
   * Supports ?page=1&limit=10 queries with server pagination metadata
   */
  getDatasetPreview: async (id, { page = 1, limit = 10 } = {}) => {
    try {
      const res = await api.get(`/datasets/${id}/preview?page=${page}&limit=${limit}`);
      if (res.data && res.data.success) {
        return {
          success: true,
          columns: res.data.columns || [],
          rows: res.data.rows || [],
          totalRows: res.data.totalRows || res.data.rows?.length || 0,
          previewCount: res.data.previewCount || res.data.rows?.length || 0,
          pagination: res.data.pagination || {
            page,
            limit,
            totalPages: Math.ceil((res.data.totalRows || res.data.rows?.length || 1) / limit),
            totalCount: res.data.totalRows || res.data.rows?.length || 0,
            hasNextPage: false,
            hasPrevPage: page > 1,
          },
          name: res.data.name || res.data.fileName || 'Dataset Preview',
          format: res.data.format || 'CSV',
          fileSizeBytes: res.data.fileSizeBytes,
          isOffline: false,
        };
      }
    } catch (err) {
      console.warn(`Preview API call failed for dataset ${id}, falling back to local paginated slice:`, err.message);
    }

    // Fallback: check locally stored dataset and perform client pagination
    const dataset = datasetService.getDatasetById(id);
    if (dataset) {
      const allRows = dataset.sampleRows || [];
      const validLimit = Math.max(1, limit);
      const totalAvailable = allRows.length;
      const totalPages = Math.max(1, Math.ceil(totalAvailable / validLimit));
      const validPage = Math.min(Math.max(1, page), totalPages);
      const startIndex = (validPage - 1) * validLimit;
      const slice = allRows.slice(startIndex, startIndex + validLimit);

      return {
        success: true,
        columns: dataset.columns || [],
        rows: slice,
        totalRows: dataset.rowCount || totalAvailable,
        previewCount: slice.length,
        pagination: {
          page: validPage,
          limit: validLimit,
          totalPages,
          totalCount: totalAvailable,
          hasNextPage: validPage < totalPages,
          hasPrevPage: validPage > 1,
        },
        name: dataset.name,
        format: dataset.format,
        fileSizeBytes: dataset.sizeBytes,
        isOffline: true,
      };
    }

    throw new Error(`Dataset with ID "${id}" could not be found.`);
  },

  /**
   * Fetch complete dataset profiling metrics (types, nulls, unique values, summary stats)
   * GET /api/datasets/:id/profile
   */
  getDatasetProfile: async (id, { refresh = false } = {}) => {
    try {
      const url = `/datasets/${id}/profile${refresh ? "?refresh=true" : ""}`;
      const res = await api.get(url);
      if (res.data && res.data.success) {
        return res.data;
      }
      return res.data;
    } catch (err) {
      console.warn(`Dataset profile API call failed for ${id}:`, err.message);
      throw err;
    }
  },

  /**
   * Get field mapping for dataset (from backend or local)
   */
  getFieldMapping: async (id) => {
    try {
      const res = await api.get(`/datasets/${id}/mapping`);
      if (res.data && res.data.success) {
        return res.data.mapping;
      }
    } catch {
      // Backend offline, fallback to local
    }

    const ds = datasetService.getDatasetById(id);
    if (ds) {
      return ds.mapping || autoSuggestMapping(ds.columns || []);
    }
    return { target: '', id: '', numerical: [], categorical: [], datetime: [], ignored: [] };
  },

  /**
   * Save field mapping for dataset
   */
  saveFieldMapping: async (id, mapping) => {
    try {
      await api.post(`/datasets/${id}/mapping`, { mapping });
    } catch (err) {
      console.warn('Backend save mapping error (saving locally):', err.message);
    }

    const ds = datasetService.getDatasetById(id);
    if (ds) {
      ds.mapping = mapping;
      datasetService.saveDataset(ds);
    }
    return mapping;
  },

  /**
   * Get all datasets from storage (fresh and clean, no mock/fake datasets)
   */
  getDatasets: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeDataset);
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATASETS));
      return INITIAL_DATASETS.map(normalizeDataset);
    } catch {
      return INITIAL_DATASETS.map(normalizeDataset);
    }
    return [];
  },

  /**
   * Get single dataset by ID
   */
  getDatasetById: (id) => {
    const datasets = datasetService.getDatasets();
    return datasets.find((d) => d.id === id || d.datasetId === id) || null;
  },

  /**
   * Add or update a dataset locally
   */
  saveDataset: (dataset) => {
    const normalized = normalizeDataset(dataset);
    const datasets = datasetService.getDatasets();
    const filtered = datasets.filter((d) => d.id !== normalized.id && d.datasetId !== normalized.id);
    const updated = [normalized, ...filtered];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage limit exceeded, falling back to memory', e);
    }
    return normalized;
  },

  /**
   * Delete dataset by ID (calls backend + removes from storage)
   */
  deleteDataset: async (id) => {
    try {
      await api.delete(`/datasets/${id}`);
    } catch (err) {
      console.warn('Backend delete error (removing locally):', err.message);
    }
    const datasets = datasetService.getDatasets();
    const updated = datasets.filter((d) => d.id !== id && d.datasetId !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    return updated;
  },

  /**
   * Reset to initial sample catalog
   */
  resetCatalog: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATASETS));
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_DATASETS.map(normalizeDataset);
  },

  /**
   * Get sample datasets for testing
   */
  getSampleDatasets: () => INITIAL_DATASETS.map(normalizeDataset),
};

export default datasetService;
