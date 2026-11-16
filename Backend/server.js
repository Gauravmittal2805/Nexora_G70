const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage directory setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer file upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.csv', '.json', '.xlsx', '.tsv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Supported: ${allowedExts.join(', ')}`));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter,
});

// Rich initial catalog with realistic sample datasets & wide multi-column datasets
let datasetsCatalog = [
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

// Helper: Infer data type
function inferType(values) {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'String';

  let isInt = true;
  let isFloat = true;
  let isBool = true;

  for (const v of nonNull.slice(0, 50)) {
    const s = String(v).trim().toLowerCase();
    if (!['true', 'false', '0', '1', 'yes', 'no'].includes(s)) isBool = false;
    if (!/^-?\d+$/.test(s)) isInt = false;
    if (!/^-?\d+(\.\d+)?$/.test(s)) isFloat = false;
  }

  if (isBool) return 'Boolean';
  if (isInt) return 'Integer';
  if (isFloat) return 'Float';
  return 'String';
}

// Helper: Parse CSV
function parseCSV(content, delimiter = ',') {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], columns: [], rows: [], totalRows: 0 };

  const splitLine = (text) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  const headers = splitLine(lines[0]);
  const rows = [];
  for (const line of lines.slice(1, 101)) {
    const values = splitLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      let rawVal = values[idx] !== undefined ? values[idx] : '';
      if (/^-?\d+$/.test(rawVal)) {
        obj[h] = parseInt(rawVal, 10);
      } else if (/^-?\d+(\.\d+)?$/.test(rawVal)) {
        obj[h] = parseFloat(rawVal);
      } else {
        obj[h] = rawVal;
      }
    });
    rows.push(obj);
  }

  const columns = headers.map((h) => {
    const colVals = rows.map((r) => r[h]);
    return {
      name: h,
      type: inferType(colVals),
      missingCount: colVals.filter((v) => v === '' || v === null || v === undefined).length,
    };
  });

  return { headers, columns, rows, totalRows: lines.length - 1 };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Nexora Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Get all datasets
app.get('/api/datasets', (req, res) => {
  res.json({
    success: true,
    total: datasetsCatalog.length,
    datasets: datasetsCatalog,
  });
});

// Get dataset by ID
app.get('/api/datasets/:id', (req, res) => {
  const { id } = req.params;
  const dataset = datasetsCatalog.find((d) => d.id === id || d.datasetId === id);
  if (!dataset) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }
  res.json({
    success: true,
    dataset,
  });
});

// Get paginated dataset preview: ?page=1&limit=10
app.get('/api/datasets/:id/preview', (req, res) => {
  const { id } = req.params;
  const dataset = datasetsCatalog.find((d) => d.id === id || d.datasetId === id);
  if (!dataset) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit || req.query.pageSize, 10) || 10), 100);

  let allAvailableRows = dataset.sampleRows || [];

  // If local file exists, parse more rows for extended pagination
  if (dataset.storagePath && fs.existsSync(dataset.storagePath)) {
    try {
      const fileExt = path.extname(dataset.storagePath).toLowerCase();
      const fileContent = fs.readFileSync(dataset.storagePath, 'utf-8');
      if (fileExt === '.csv' || fileExt === '.tsv') {
        const delimiter = fileExt === '.tsv' ? '\t' : (dataset.delimiter || ',');
        const parsed = parseCSV(fileContent, delimiter);
        if (parsed.rows && parsed.rows.length > 0) {
          allAvailableRows = parsed.rows;
        }
      }
    } catch {
      // Fallback to sampleRows
    }
  }

  const totalAvailable = allAvailableRows.length;
  const totalPages = Math.max(1, Math.ceil(totalAvailable / limit));
  const validPage = Math.min(page, totalPages);
  const startIndex = (validPage - 1) * limit;
  const paginatedRows = allAvailableRows.slice(startIndex, startIndex + limit);

  return res.json({
    success: true,
    datasetId: dataset.id || dataset.datasetId,
    name: dataset.name,
    format: dataset.format,
    fileSizeBytes: dataset.sizeBytes,
    totalRows: dataset.rowCount || totalAvailable,
    totalAvailableRows: totalAvailable,
    columns: dataset.columns,
    pagination: {
      page: validPage,
      limit,
      totalPages,
      totalCount: totalAvailable,
      hasNextPage: validPage < totalPages,
      hasPrevPage: validPage > 1,
    },
    previewCount: paginatedRows.length,
    rows: paginatedRows,
  });
});

// Get field mapping for dataset
app.get('/api/datasets/:id/mapping', (req, res) => {
  const { id } = req.params;
  const dataset = datasetsCatalog.find((d) => d.id === id || d.datasetId === id);
  if (!dataset) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }

  return res.json({
    success: true,
    datasetId: dataset.id || dataset.datasetId,
    name: dataset.name,
    columns: dataset.columns,
    mapping: dataset.mapping || {
      target: '',
      id: '',
      numerical: [],
      categorical: [],
      datetime: [],
      ignored: [],
    },
  });
});

// Save field mapping for dataset
app.post('/api/datasets/:id/mapping', (req, res) => {
  const { id } = req.params;
  const dataset = datasetsCatalog.find((d) => d.id === id || d.datasetId === id);
  if (!dataset) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }

  const { mapping } = req.body;
  if (!mapping || typeof mapping !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid mapping object provided.' });
  }

  dataset.mapping = {
    target: mapping.target || '',
    id: mapping.id || '',
    numerical: Array.isArray(mapping.numerical) ? mapping.numerical : [],
    categorical: Array.isArray(mapping.categorical) ? mapping.categorical : [],
    datetime: Array.isArray(mapping.datetime) ? mapping.datetime : [],
    ignored: Array.isArray(mapping.ignored) ? mapping.ignored : [],
    updatedAt: new Date().toISOString(),
  };

  return res.json({
    success: true,
    message: `Field mapping saved successfully for "${dataset.name}".`,
    mapping: dataset.mapping,
  });
});

// Upload dataset endpoint
app.post('/api/datasets/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No dataset file provided in request.' });
    }

    const {
      name,
      description,
      format,
      delimiter = ',',
      tags,
      hasHeaders = 'true',
    } = req.body;

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;
    const fileExt = path.extname(originalName).toLowerCase();

    let parsed = { headers: [], columns: [], rows: [], totalRows: 0 };

    if (fileExt === '.csv' || fileExt === '.tsv') {
      const activeDelimiter = fileExt === '.tsv' ? '\t' : delimiter;
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      parsed = parseCSV(fileContent, activeDelimiter);
    } else if (fileExt === '.json') {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const rawJson = JSON.parse(fileContent);
      const arr = Array.isArray(rawJson) ? rawJson : rawJson.data || [rawJson];
      if (arr.length > 0 && typeof arr[0] === 'object') {
        const headers = Object.keys(arr[0]);
        parsed = {
          headers,
          columns: headers.map((h) => ({
            name: h,
            type: typeof arr[0][h] === 'number' ? 'Float' : typeof arr[0][h] === 'boolean' ? 'Boolean' : 'String',
            missingCount: 0,
          })),
          rows: arr.slice(0, 100),
          totalRows: arr.length,
        };
      }
    }

    // Parse tags array if passed as JSON string
    let parsedTags = ['Tabular'];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = [String(tags)];
      }
    }

    const datasetId = `ds-${Date.now()}`;
    const detectedFormat = (format || fileExt.replace('.', '')).toUpperCase();

    // Default heuristic mapping
    const colNames = parsed.columns.map((c) => c.name);
    const targetGuess = colNames.find((n) => /churn|target|label|price|status|alert|fraud/i.test(n)) || '';
    const idGuess = colNames.find((n) => /id$|^id|_id$/i.test(n)) || '';
    const numCols = parsed.columns
      .filter((c) => (c.type === 'Integer' || c.type === 'Float') && c.name !== idGuess && c.name !== targetGuess)
      .map((c) => c.name);
    const catCols = parsed.columns
      .filter((c) => (c.type === 'Categorical' || c.type === 'String') && c.name !== idGuess && c.name !== targetGuess)
      .map((c) => c.name);

    const newDataset = {
      id: datasetId,
      datasetId: datasetId,
      name: name || originalName,
      description: description || 'Ingested via Nexora Dataset Upload API',
      format: detectedFormat,
      fileType: detectedFormat.toLowerCase(),
      sizeBytes: fileSize,
      fileSize: fileSize,
      rowCount: parsed.totalRows || parsed.rows.length,
      columnCount: parsed.columns.length,
      uploadedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'Ready',
      tags: parsedTags,
      columns: parsed.columns,
      sampleRows: parsed.rows.slice(0, 50),
      storagePath: filePath,
      mapping: {
        target: targetGuess,
        id: idGuess,
        numerical: numCols,
        categorical: catCols,
        datetime: [],
        ignored: [],
      },
    };

    // Prepend to catalog
    datasetsCatalog.unshift(newDataset);

    return res.status(201).json({
      success: true,
      message: `Dataset "${newDataset.name}" successfully uploaded and indexed!`,
      dataset: newDataset,
    });
  } catch (error) {
    console.error('Upload processing error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while processing dataset upload.',
    });
  }
});

// Delete dataset endpoint
app.delete('/api/datasets/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = datasetsCatalog.length;
  datasetsCatalog = datasetsCatalog.filter((d) => d.id !== id && d.datasetId !== id);

  if (datasetsCatalog.length === initialLen) {
    return res.status(404).json({ success: false, message: 'Dataset not found.' });
  }

  res.json({ success: true, message: 'Dataset deleted successfully.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Nexora Backend API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
