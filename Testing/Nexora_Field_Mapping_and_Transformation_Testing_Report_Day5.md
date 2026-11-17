# 🔄 Nexora — Field Mapping & Transformation QA Testing Report

**Project Name:** Nexora (Enterprise Data Ingestion & Transformation Platform)  
**Document Title:** Field Mapping & Transformation Comprehensive QA Testing Report  
**Document Version:** 1.0.0 (Master Field Mapping Deliverable)  
**Execution Date:** November 17, 2026  
**QA Lead / Author:** Abhishek (QA Test Engineer)  
**Assigned Engineering Team:** 
- **Gaurav:** Backend Lead (API Gateway & Controller Architecture)
- **Harshit:** Backend Specialist (Dataset Ingestion, Persistence & Validation)
- **Mahesh:** Engine & Transformation Specialist (`transformationEngine.js` & Pipelines)
- **Akshat:** Frontend Lead (`FieldMapping.jsx` UI, Drag-and-Drop & Mapping State)  
**Overall Testing Assessment:** `[x]` **COMPLETED — 5 DEFECTS IDENTIFIED & ASSIGNED** ⚠️

---

## 📑 Executive Summary & Mapping Dashboard

This QA report details the deep functional, structural, and integration verification of the **Nexora Field Mapping Studio & Transformation Engine**, covering:
1. **Mapping Creation API** (`POST /api/datasets/:id/mapping`).
2. **Mapping Update and Retrieval APIs** (`GET /api/datasets/:id/mapping` & `POST /api/datasets/:id/mapping`).
3. **Invalid Source Column Selection Guarding** (assigning non-existent column names).
4. **Duplicate Mapping Scenario Guarding** (assigning one column to multiple target roles).
5. **The Five Core Transformation Primitives** (`trimWhitespace`, `toUpperCase`, `toLowerCase`, `stringToNumber`, `removeEmptyValues`).
6. **Multi-Transformation Execution on Single & Batch Records** (chaining pipelines in sequence).
7. **Frontend Mapping Configuration vs Backend Engine Alignment** (`FieldMapping.jsx` vs `transformationEngine.js`).
8. **Bug Tracking Sheet with Visual UI Representations & Reproduction Steps**.
9. **Final Quality Sign-off & Engineering Remediation Action Plan**.

### 🎯 Test Execution & Coverage Summary

| Test Domain | Target Scope | Executed | Passed | Failed / Defect | Pass Rate | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **1. Mapping Creation** | Payload schema, initial mapping creation | 5 | 4 | 1 | 80.0% | ⚠️ Status Code Mismatch |
| **2. Retrieval & Update** | Idempotency, updates, persistence in MongoDB | 5 | 5 | 0 | 100.0% | ✅ Operational |
| **3. Invalid Columns** | Ghost/non-existent column assignment | 4 | 1 | 3 | 25.0% | ❌ Lacks Backend Guard |
| **4. Duplicate Mappings**| Multi-role column collision detection | 4 | 1 | 3 | 25.0% | ❌ Lacks Backend Guard |
| **5. Core Transformations**| 5 basic operations (trim, upper, lower, number, removeEmpty) | 15 | 15 | 0 | 100.0% | ✅ 100% Verified |
| **6. Multi-Transform Record**| Pipelining, chaining, record immutability | 6 | 6 | 0 | 100.0% | ✅ Fully Functional |
| **7. Frontend Alignment**| `FieldMapping.jsx` slots, custom destination labels | 5 | 3 | 2 | 60.0% | ⚠️ Labels Not Saved |
| **Total Test Suite** | **Comprehensive Sprint 1 Mapping Audit** | **44** | **35** | **9** | **79.5%** | **Remediation In Progress** |

---

## 1. 🛠️ Test Section 1: Mapping Creation API (`POST /api/datasets/:id/mapping`)

### 1.1 Specification & Endpoints
- **Target Endpoint:** `POST /api/datasets/:id/mapping`
- **Request Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Standard Mapping Roles:**
  - `target`: Prediction variable (e.g. `'Churn'`).
  - `id`: Entity unique identifier (e.g. `'CustomerID'`).
  - `numerical`: Array of numeric continuous/discrete metrics.
  - `categorical`: Array of discrete text/enumerated categories.
  - `datetime`: Array of timestamps and temporal markers.
  - `ignored`: Array of excluded/dropped columns.

### 1.2 Test Results Table

| Test Case ID | Test Scenario | Request Payload | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-MAP-01** | Valid Mapping Creation | `{ "mapping": { "target": "Churn", "id": "CustomerID", "numerical": ["Age", "Monthly_Charges"], "categorical": ["Gender"] } }` | HTTP `201 Created`<br>Returns created mapping object | HTTP `200 OK`<br>`{"success": true, "mapping": {...}}` | ⚠️ **NOTE** (BUG-MAP-003) |
| **TC-MAP-02** | Missing `mapping` Object | `{}` or `{ "invalidKey": true }` | HTTP `400 Bad Request`<br>`"Invalid mapping payload provided."` | HTTP `400 Bad Request`<br>`{"success": false, "message": "Invalid mapping payload provided."}` | ✅ **PASS** |
| **TC-MAP-03** | Array Values Coercion | `{ "mapping": { "numerical": "Age" } }` (String instead of Array) | Sanitized into array `["Age"]` or rejected | Coerced into array: `Array.isArray(m.numerical) ? m.numerical : []` | ✅ **PASS** |
| **TC-MAP-04** | Timestamp Injection | Saving mapping updates `updatedAt` | Auto-generates current ISO timestamp | `updatedAt` updated and saved in document | ✅ **PASS** |
| **TC-MAP-05** | Non-Existent Dataset ID | `POST /api/datasets/ds-invalid-999/mapping` | HTTP `404 Not Found`<br>`"Dataset not found."` | HTTP `404 Not Found`<br>`{"success": false, "message": "Dataset not found."}` | ✅ **PASS** |

---

## 2. 🔄 Test Section 2: Mapping Update and Retrieval APIs

### 2.1 Retrieval Endpoint (`GET /api/datasets/:id/mapping`)
Retrieves the saved mapping schema along with column definitions from `dataset.metadata.columns`.

### 2.2 Test Results Table

| Test Case ID | Test Scenario | Execution Details | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-RET-01** | Initial Mapping Retrieval | `GET /api/datasets/ds-churn-101/mapping` | HTTP `200 OK`<br>Returns dataset columns and current mapping | HTTP `200 OK`<br>`{"success": true, "columns": [...], "mapping": {...}}` | ✅ **PASS** |
| **TC-RET-02** | Default Fallback Mapping | Dataset without explicit saved mapping | Returns heuristic suggested mapping or empty slots | Returns default schema with target, id, numerical, categorical | ✅ **PASS** |
| **TC-RET-03** | Mapping Update Overwrite | Send updated `numerical: ["Age", "Total_Charges"]` | Overwrites previous numerical mapping cleanly | Verified: New array persisted; previous values replaced | ✅ **PASS** |
| **TC-RET-04** | Idempotent Retrieval | Execute 10 consecutive `GET` requests | Exactly identical payload returned each time | Verified: Zero side effects or mutations | ✅ **PASS** |
| **TC-RET-05** | Unassigned Columns Retention | Columns not assigned to any slot | Columns remain available in `columns` list | Verified: Available columns untouched for UI rendering | ✅ **PASS** |

---

## 3. ⚠️ Test Section 3: Invalid Source Column Selection Guarding

### 3.1 Threat & Architectural Integrity
If a client or API caller assigns a column name that **does not exist** in the dataset's actual schema (e.g. typos, deleted columns, malicious payload), the system must reject the mapping with HTTP `400 Bad Request` or HTTP `422 Unprocessable Entity` rather than saving corrupted configurations.

### 3.2 Test Results Table

| Test Case ID | Injected Invalid Column | Target Slot | Expected Behavior | Actual Behavior | Status | Defect Reference |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-INV-01** | `"ghost_target_column"` | `target` | HTTP `400 Bad Request`<br>`"Column 'ghost_target_column' does not exist in dataset."` | HTTP `200 OK`<br>**Saved corrupted mapping directly into MongoDB!** | ❌ **FAIL** | **BUG-MAP-001**: Missing backend column existence validation. |
| **TC-INV-02** | `["fake_col_1", "fake_col_2"]` | `numerical` | HTTP `400 Bad Request`<br>Lists invalid column names | HTTP `200 OK`<br>**Saved non-existent columns to numerical array!** | ❌ **FAIL** | **BUG-MAP-001**: Backend accepts arbitrary strings. |
| **TC-INV-03** | `"fake_id_column"` | `id` | HTTP `400 Bad Request`<br>Validation failure | HTTP `200 OK`<br>**Saved invalid entity ID without validation!** | ❌ **FAIL** | **BUG-MAP-001**: Backend accepts arbitrary strings. |
| **TC-INV-04** | Frontend Drag Guarding | Drag invalid card in UI | UI restricts selection to detected columns | UI only displays detected dataset columns | ✅ **PASS** | Frontend UI naturally restricts selection. |

---

## 4. 🔀 Test Section 4: Duplicate Mapping Scenarios Guarding

### 4.1 Collision Scenarios
1. **Intra-Role Collision:** Same column specified multiple times within an array (`numerical: ["Age", "Age"]`).
2. **Inter-Role Collision:** Same column assigned to conflicting roles simultaneously (`id: "CustomerID"`, `target: "CustomerID"`, `numerical: ["CustomerID"]`).

### 4.2 Test Results Table

| Test Case ID | Collision Scenario | Injected Mapping Payload | Expected Behavior | Actual Behavior | Status | Defect Reference |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-DUP-01** | Column in both `id` and `target` | `{ target: "CustomerID", id: "CustomerID" }` | HTTP `400 Bad Request`<br>`"Column 'CustomerID' cannot be both ID and Target"` | HTTP `200 OK`<br>**Accepted contradictory mapping roles!** | ❌ **FAIL** | **BUG-MAP-002**: Lacks multi-role collision guard. |
| **TC-DUP-02** | Column in both `numerical` & `categorical` | `{ numerical: ["Gender"], categorical: ["Gender"] }` | HTTP `400 Bad Request`<br>Reject conflicting data types | HTTP `200 OK`<br>**Accepted column in both numerical & categorical!** | ❌ **FAIL** | **BUG-MAP-002**: Lacks multi-role collision guard. |
| **TC-DUP-03** | Column in both `numerical` & `ignored` | `{ numerical: ["Notes"], ignored: ["Notes"] }` | HTTP `400 Bad Request`<br>Reject feature vs ignored conflict | Saved mapping; engine transforms then drops field | ❌ **FAIL** | **BUG-MAP-002**: Lacks multi-role collision guard. |
| **TC-DUP-04** | Frontend UI Collision Prevention | Drag already assigned column to new slot | UI unassigns from previous slot before assigning new | Frontend `assignColumnToSlot` automatically removes duplicates | ✅ **PASS** | UI client-side state machine is clean. |

---

## 5. ⚙️ Test Section 5: The Five Core Transformation Primitives

All five fundamental transformation functions in `Backend/utils/transformationEngine.js` were comprehensively audited across valid, edge-case, null, and malformed inputs.

```
+-----------------------------------------------------------------------------------+
|                     TRANSFORMATION PRIMITIVES AUDIT MATRIX                        |
+-----------------------------------------------------------------------------------+
| Function            | Injected Value       | Expected Output   | Status | Result  |
|---------------------|----------------------|-------------------|--------|---------|
| 1. trimWhitespace   | "   hello world   "  | "hello world"     | ✅ PASS| Exact   |
|                     | "\t\r\n Nexora \n"   | "Nexora"          | ✅ PASS| Exact   |
|                     | null / undefined     | null / undefined  | ✅ PASS| Exact   |
|                     | 12345 (number)       | 12345 (untouched) | ✅ PASS| Exact   |
| 2. toUpperCase      | "active"             | "ACTIVE"          | ✅ PASS| Exact   |
|                     | "month-to-month"     | "MONTH-TO-MONTH"  | ✅ PASS| Exact   |
|                     | null                 | null              | ✅ PASS| Exact   |
| 3. toLowerCase      | "ONLINE"             | "online"          | ✅ PASS| Exact   |
|                     | "Customer_ID"        | "customer_id"     | ✅ PASS| Exact   |
|                     | null                 | null              | ✅ PASS| Exact   |
| 4. stringToNumber   | "42"                 | 42 (Integer)      | ✅ PASS| Exact   |
|                     | "-15.75"             | -15.75 (Float)    | ✅ PASS| Exact   |
|                     | "$1,250.50"          | 1250.5 (Cleaned)  | ✅ PASS| Exact   |
|                     | "85%"                | 85 (Percentage)   | ✅ PASS| Exact   |
|                     | true / false         | 1 / 0 (Boolean)   | ✅ PASS| Exact   |
| 5. removeEmptyValues| { a: "", b: "ok" }   | { b: "ok" }       | ✅ PASS| Exact   |
|                     | { a: null, b: 0 }    | { b: 0 } (Keep 0) | ✅ PASS| Exact   |
|                     | { a: undefined, b: f}| { b: false }      | ✅ PASS| Exact   |
+-----------------------------------------------------------------------------------+
```

### 5.1 Key Operational Highlights
- **Currency & Formatted Numbers:** `stringToNumber` cleans currency symbols (`$`, `€`, `£`, `₹`), percentage signs (`%`), and thousands commas (`,`) automatically without throwing errors.
- **Falsy Preservation:** `removeEmptyValues` treats `0` and `false` as **valid values**, only removing true empties (`""`, `"   "`, `null`, `undefined`).

---

## 6. 🔗 Test Section 6: Multiple Transformations on the Same Record

### 6.1 Record Pipeline Execution Test
Tested chaining multiple operations sequentially on individual fields as well as global record-level operations using `transformRecord(record, config)`.

#### Input Record (Raw Ingestion):
```json
{
  "CustomerID": "  cust-7021  ",
  "CustomerName": "  ALICE SMITH  ",
  "Monthly_Charges": "  $65.40  ",
  "Tenure_Months": "  12  ",
  "Contract_Type": "  month-to-month  ",
  "Churn": "  NO  ",
  "UnusedNotes": "   "
}
```

#### Transformation Configuration:
```json
{
  "columns": {
    "CustomerID": ["trim", "uppercase"],
    "CustomerName": ["trim", "lowercase"],
    "Monthly_Charges": ["trim", "toNumber"],
    "Tenure_Months": ["trim", "toNumber"],
    "Contract_Type": ["trim", "uppercase"],
    "Churn": ["trim", "lowercase"]
  },
  "options": {
    "removeEmptyValues": true
  }
}
```

#### Output Record (Transformed Result):
```json
{
  "CustomerID": "CUST-7021",
  "CustomerName": "alice smith",
  "Monthly_Charges": 65.4,
  "Tenure_Months": 12,
  "Contract_Type": "MONTH-TO-MONTH",
  "Churn": "no"
}
```

### 6.2 Test Results Table

| Test Case ID | Test Scenario | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-TRF-01** | String Pipeline (`trim` + `upper`) | `"  cust-7021  "` -> `"CUST-7021"` | Verified: Whitespace trimmed then converted to uppercase | ✅ **PASS** |
| **TC-TRF-02** | String Pipeline (`trim` + `lower`) | `"  ALICE SMITH  "` -> `"alice smith"` | Verified: Whitespace trimmed then converted to lowercase | ✅ **PASS** |
| **TC-TRF-03** | Number Pipeline (`trim` + `toNumber`) | `"  $65.40  "` -> `65.4` | Verified: Cleaned currency and parsed float number | ✅ **PASS** |
| **TC-TRF-04** | Global Empty Cleanup | `"UnusedNotes": "   "` omitted from result | Verified: Empty whitespace string key pruned from record | ✅ **PASS** |
| **TC-TRF-05** | Batch Processing (`transformDataset`) | Apply to array of 50 customer records | All 50 records transformed with zero memory leakage | ✅ **PASS** |
| **TC-TRF-06** | Record Immutability | Ensure original record object is not mutated | Pure function verified: `originalRecord !== transformedRecord` | ✅ **PASS** |

---

## 7. ⚖️ Test Section 7: Frontend Mapping vs Backend Configuration Alignment

### 7.1 Architecture Reconciliation
- **Frontend Component:** `Frontend/src/pages/FieldMapping.jsx` provides an interactive UI with 6 distinct destination slots: Target, ID, Numerical, Categorical, Datetime, and Ignored.
- **Backend Generator:** `generateTransformConfigFromMapping(mapping, overrides)` translates mapping slots into runnable pipeline configs.

### 7.2 Comparative Alignment Matrix

```
+---------------------------------------------------------------------------------------------------------+
|                                FRONTEND VS BACKEND CONFIGURATION AUDIT                                  |
+-------------------------+---------------------------------------+---------------------------------------+
| Feature / Role          | Frontend FieldMapping.jsx             | Backend transformationEngine.js       |
|-------------------------|---------------------------------------|---------------------------------------|
| Target Column           | slot: "target" (Single selection)     | config.columns[target] = ['trim']     |
| Primary Identifier      | slot: "id" (Single selection)         | config.columns[id] = ['trim']         |
| Numerical Predictors    | slot: "numerical" (Multi selection)   | config.columns[col] = ['trim','toNum']|
| Categorical Predictors  | slot: "categorical" (Multi selection) | config.columns[col] = ['trim']        |
| Datetime Predictors     | slot: "datetime" (Multi selection)    | config.columns[col] = ['trim']        |
| Ignored Fields          | slot: "ignored" (Multi selection)     | Excluded from output (delete col)     |
| Custom Column Labels    | state: columnLabels = { [col]: text } | NOT STORED IN BACKEND! (Dropped)      |
+-------------------------+---------------------------------------+---------------------------------------+
```

### 7.3 Discrepancy Findings:
1. **CUSTOM COLUMN DESTINATION LABELS DROPPED (BUG-MAP-004):**
   In `FieldMapping.jsx`, users can click on an assigned column card and type a custom destination alias (e.g. `Monthly_Charges` -> `monthly_spend_usd`). However, when clicking **Save Mapping**, `saveDatasetMapping` only transmits `{ mapping: { target, id, numerical, categorical, datetime, ignored } }`. The `columnLabels` dictionary is omitted from the API request and never saved to MongoDB, causing user customizations to be lost upon page refresh!
2. **MISSING PREVIEW SYNCHRONIZATION (BUG-MAP-005):**
   When users click **Live Transformation Preview** in `FieldMapping.jsx`, the preview drawer fetches raw rows from `/api/datasets/:id/preview`, but does NOT pass the active mapping to `/api/datasets/transform/record`. Users see raw unmodified data instead of real-time transformed output in the preview drawer!

---

## 8. 🐛 Test Section 8: Bug Tracking Sheet with Visual UI Wireframes & Reproduction Steps

### 8.1 Visual UI Bug Wireframes (ASCII Screenshots)

#### 📸 Visual Representation 1: BUG-MAP-004 — Custom Column Rename Lost
```
+-----------------------------------------------------------------------------+
| Nexora Field Mapping Studio — Customer_Churn_Analysis.csv                  |
+-----------------------------------------------------------------------------+
| [Available Columns (3)]   | [Assigned Destination Slots]                    |
| - Age (Integer)           | 🎯 Target: [ Churn                   [x] ]      |
| - Gender (Categorical)    | 🔑 ID:     [ CustomerID              [x] ]      |
| - Tenure (Integer)        | 🔢 Numerical:                                   |
|                           |   +---------------------------------------+     |
|                           |   | Monthly_Charges                       |     |
|                           |   | Renamed: "monthly_spend_usd" ✏️       |     |
|                           |   +---------------------------------------+     |
|                           |                                                 |
|                           | [ Save Mapping Configuration ]                  |
|                           |                                                 |
|                           | ⚠️ DEFECT: When Saved, "monthly_spend_usd" is   |
|                           | omitted from API payload! Refreshing resets     |
|                           | the column name back to "Monthly_Charges"!       |
+-----------------------------------------------------------------------------+
```

#### 📸 Visual Representation 2: BUG-MAP-005 — Live Preview Drawer Raw Output
```
+-----------------------------------------------------------------------------+
| Nexora Live Transformation Preview Drawer                                   |
+-----------------------------------------------------------------------------+
| Active Mapping: Monthly_Charges -> [toNumber, clean $]                      |
|                                                                             |
| EXPECTED PREVIEW:               ACTUAL RENDERED PREVIEW:                    |
| +-------------------------+     +-------------------------+                 |
| | CustomerID | Monthly... |     | CustomerID | Monthly... |                 |
| |------------|------------|     |------------|------------|                 |
| | CUST-7021  | 65.4       |     | CUST-7021  |  $65.40    | <-- RAW STRING! |
| | CUST-8842  | 98.2       |     | CUST-8842  |  $98.20    | <-- RAW STRING! |
| +-------------------------+     +-------------------------+                 |
|                                                                             |
| ⚠️ DEFECT: Drawer displays unmapped raw database records instead of         |
| applying transformation rules configured in the active studio view!         |
+-----------------------------------------------------------------------------+
```

---

### 8.2 Master Defect Log Table

| Bug ID | Severity | Pri. | Module | Summary / Description | Assignee | Component & File Location | Status |
| :---: | :---: | :---: | :---: | :--- | :---: | :--- | :---: |
| **BUG-MAP-001** | 🔴 Critical | P1 | Mapping API | Backend `saveDatasetMapping` performs zero validation against dataset columns, allowing non-existent ghost columns to be saved | **Gaurav** | `Backend/controllers/datasetController.js` (L490-530) | 🔴 OPEN |
| **BUG-MAP-002** | 🟠 High | P2 | Mapping API | Backend allows duplicate role assignments (e.g. same column assigned to both `target` and `numerical` simultaneously) | **Gaurav** | `Backend/controllers/datasetController.js` (L490-530) | 🔴 OPEN |
| **BUG-MAP-003** | 🟡 Medium | P3 | Mapping API | Initial mapping creation via `POST /api/datasets/:id/mapping` returns HTTP `200 OK` instead of standard HTTP `201 Created` | **Harshit** | `Backend/controllers/datasetController.js` (L535) | 🔴 OPEN |
| **BUG-MAP-004** | 🟠 High | P2 | Frontend Studio | User-configured custom column destination labels (`columnLabels`) omitted from save payload and lost upon page reload | **Akshat** | `Frontend/src/pages/FieldMapping.jsx` (L360-390) | 🔴 OPEN |
| **BUG-MAP-005** | 🟠 High | P2 | Frontend Preview | Live transformation preview drawer renders raw un-transformed records instead of invoking `/api/datasets/transform/record` | **Akshat** | `Frontend/src/pages/FieldMapping.jsx` (L450-480) | 🔴 OPEN |

---

### 8.3 Detailed Defect Dossiers & Code Remediation Guides

#### 🐞 BUG-MAP-001: Missing Column Existence Validation in `saveDatasetMapping`
- **Severity / Priority:** Critical / P1
- **Assigned Developer:** **Gaurav** (Backend Lead)
- **Component:** `Backend/controllers/datasetController.js` (Lines 490-530)
- **Reproduction Steps:**
  1. Call `POST /api/datasets/ds-churn-101/mapping` with:
     ```json
     {
       "mapping": {
         "target": "ghost_nonexistent_column",
         "numerical": ["fake_metric_col_1", "fake_metric_col_2"]
       }
     }
     ```
- **Expected Behavior:** Returns HTTP `400 Bad Request` with `"Invalid column(s): ghost_nonexistent_column does not exist in dataset schema."`
- **Actual Behavior:** Returns HTTP `200 OK` and saves invalid column names into MongoDB!
- **Root Cause Analysis:** `datasetController.js` copies payload keys directly without checking `dataset.metadata.columns`.
- **Recommended Remediation:**
```javascript
// In datasetController.js (saveDatasetMapping):
const availableColumns = new Set(
  (dataset.metadata?.columns || dataset.columns || []).map(c => c.name)
);

const allMappedCols = [
  mapping.target,
  mapping.id,
  ...(mapping.numerical || []),
  ...(mapping.categorical || []),
  ...(mapping.datetime || []),
  ...(mapping.ignored || [])
].filter(Boolean);

const invalidCols = allMappedCols.filter(col => !availableColumns.has(col));
if (invalidCols.length > 0) {
  return res.status(400).json({
    success: false,
    message: `Invalid column(s) in mapping: ${invalidCols.join(', ')}. Columns do not exist in dataset.`
  });
}
```

---

#### 🐞 BUG-MAP-002: Lacks Duplicate Column Role Collision Guard
- **Severity / Priority:** High / P2
- **Assigned Developer:** **Gaurav** (Backend Lead)
- **Component:** `Backend/controllers/datasetController.js` (Lines 490-530)
- **Reproduction Steps:**
  1. Call `POST /api/datasets/ds-churn-101/mapping` with `{ "mapping": { "target": "CustomerID", "id": "CustomerID" } }`.
- **Expected Behavior:** Returns HTTP `400 Bad Request` with `"Duplicate mapping: column 'CustomerID' assigned to multiple conflicting roles."`
- **Actual Behavior:** Returns HTTP `200 OK` and saves conflicting roles into MongoDB.
- **Root Cause Analysis:** Missing uniqueness check across role arrays.
- **Recommended Remediation:**
```javascript
// In datasetController.js (saveDatasetMapping):
const seenRoles = new Map();
const duplicates = [];

const checkCollision = (col, role) => {
  if (!col) return;
  if (seenRoles.has(col)) {
    duplicates.push(`"${col}" in both "${seenRoles.get(col)}" and "${role}"`);
  } else {
    seenRoles.set(col, role);
  }
};

checkCollision(mapping.target, 'target');
checkCollision(mapping.id, 'id');
(mapping.numerical || []).forEach(c => checkCollision(c, 'numerical'));
(mapping.categorical || []).forEach(c => checkCollision(c, 'categorical'));
(mapping.datetime || []).forEach(c => checkCollision(c, 'datetime'));
(mapping.ignored || []).forEach(c => checkCollision(c, 'ignored'));

if (duplicates.length > 0) {
  return res.status(400).json({
    success: false,
    message: `Duplicate column mapping collision: ${duplicates.join('; ')}`
  });
}
```

---

#### 🐞 BUG-MAP-004: Custom Column Destination Labels Omitted from Save Payload
- **Severity / Priority:** High / P2
- **Assigned Developer:** **Akshat** (Frontend Lead)
- **Component:** `Frontend/src/pages/FieldMapping.jsx` (Lines 360-390)
- **Reproduction Steps:**
  1. Open Field Mapping Studio for `Customer_Churn_Analysis.csv`.
  2. Type custom destination label `"monthly_charges_usd"` on `Monthly_Charges`.
  3. Click **Save Mapping Configuration**.
  4. Refresh browser page (`F5`).
- **Actual Behavior:** The destination alias `"monthly_charges_usd"` is lost; field reverts to `"Monthly_Charges"`.
- **Root Cause Analysis:** `handleSaveMapping` constructs `{ mapping }` but forgets to include `columnLabels` in the request body.
- **Recommended Remediation:**
```javascript
// In FieldMapping.jsx (handleSaveMapping):
const payload = {
  mapping: {
    ...mapping,
    labels: columnLabels // Persist custom destination labels
  }
};
await datasetService.saveFieldMapping(currentDataset.id, payload.mapping);
```

---

#### 🐞 BUG-MAP-005: Live Transformation Preview Drawer Renders Raw Records
- **Severity / Priority:** High / P2
- **Assigned Developer:** **Akshat** (Frontend Lead)
- **Component:** `Frontend/src/pages/FieldMapping.jsx` (Lines 450-480)
- **Reproduction Steps:**
  1. Map `Monthly_Charges` as numerical.
  2. Open Live Transformation Preview Drawer.
- **Actual Behavior:** Drawer renders raw string `"  $65.40  "` instead of transformed numeric float `65.4`.
- **Root Cause Analysis:** `handleOpenPreview` fetches un-transformed raw preview rows from `/api/datasets/:id/preview` and sets them directly to state without applying `applyMappingAndTransformations`.
- **Recommended Remediation:**
```javascript
// In FieldMapping.jsx (loadPreviewData):
import { applyMappingAndTransformations } from '../../utils/transformationEngine'; // or via API /transform

const rawRows = previewResult.rows || [];
const transformedRows = rawRows.map(row => applyMappingAndTransformations(row, mapping));
setPreviewData({ ...previewResult, rows: transformedRows });
```

---

## 9. 🎯 Quality Sign-off & Engineering Action Plan

```
+-----------------------------------------------------------------------------------+
|                        MAPPING & TRANSFORMATION PATCH PIPELINE                    |
+-----------------------------------------------------------------------------------+
|  [ Gaurav (Backend Lead) ]                                                        |
|  ├── Patch BUG-MAP-001: Enforce availableColumns validation in saveDatasetMapping |
|  └── Patch BUG-MAP-002: Enforce duplicate role collision checking                 |
|                                                                                   |
|  [ Harshit (Backend / Datasets) ]                                                 |
|  └── Patch BUG-MAP-003: Return HTTP 201 Created for new mapping resource creation |
|                                                                                   |
|  [ Akshat (Frontend Lead) ]                                                       |
|  ├── Patch BUG-MAP-004: Transmit columnLabels in saveMapping payload              |
|  └── Patch BUG-MAP-005: Apply transformations to rows in preview drawer           |
|                                                                                   |
|  [ Abhishek (QA Lead) ]                                                           |
|  └── Verify end-to-end regression suite upon patch deployment.                    |
+-----------------------------------------------------------------------------------+
```

### 9.1 Release Gate Status
- **Core Transformation Primitives:** 100% verified. All 5 basic operations and multi-transformation record chaining are functioning with zero data corruption.
- **Release Status:** **BLOCKED** 🛑  
  Blocked pending resolution of Critical defect **BUG-MAP-001** (Invalid column existence validation).

---
*Report Certified by: **Abhishek** (QA Test Engineer, Nexora Platform Engineering)*
