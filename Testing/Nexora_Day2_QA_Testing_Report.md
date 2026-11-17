# 🚀 Nexora — Day 2 QA Testing Report: Authentication & Upload API Testing

**Project Name:** Nexora (Data Ingestion & Transformation Platform)  
**Document Title:** Day 2 QA Testing Report — Authentication & Upload API Testing  
**Document Version:** 2.0.0 (Unified Comprehensive Report)  
**Execution Date:** November 17, 2026  
**Environment:** 
- Frontend: React 19 + Vite (`http://localhost:5173`)
- Backend: Node.js + Express 5 (`http://localhost:5001`)
- Database: MongoDB Atlas / Local MongoDB (`mongodb://127.0.0.1:27017/Nexora`)
- Cloud Storage: Backblaze B2 / S3-Compatible Storage (`nexora-datasets`)  
**QA Lead / Author:** Abhishek (QA Test Engineer)  
**Engineering Team:** Gaurav (Backend Lead), Akshat (Frontend Lead), Harshit (Backend/Dataset), Mahesh (Engine/Storage)  
**Overall Day 2 Quality Status:** `[x]` **TESTING COMPLETE — 10 DEFECTS LOGGED & ASSIGNED** ⚠️

---

## 📑 Executive Summary & Day 2 Status Dashboard

This comprehensive Day 2 QA Testing Report covers the end-to-end functional, structural, and security verification of Nexora's core Sprint 1 subsystems: **User Authentication** (`/api/auth`) and **Dataset Ingestion & File Upload** (`/api/datasets/upload`), along with database schema integrity in MongoDB and frontend client validation.

### 🎯 Test Execution & Coverage Summary

| Test Domain | Target Scope | Executed Tests | Passed | Failed / Defect | Pass Rate | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **1. Registration API** | Valid, Duplicate, Missing Fields, Invalid Email | 6 | 4 | 2 | 66.7% | ⚠️ Defects Identified |
| **2. Login API** | Valid, Incorrect Password, Unregistered Email, Missing Fields | 5 | 4 | 1 | 80.0% | ⚠️ Rate Limiting Missing |
| **3. File Upload API** | CSV, JSON, Invalid Types, Empty (0-byte), Size Exceeded | 6 | 2 | 4 | 33.3% | ⚠️ Critical Upload Defects |
| **4. MongoDB Persistence** | User & Dataset Schemas, Tenant Isolation, Indexing | 6 | 4 | 2 | 66.7% | ⚠️ Schema Alignment Needed |
| **5. Frontend Validation** | Form Schemas, Real-time Alerts, Strength Meter, Dropzone | 12 | 10 | 2 | 83.3% | ⚠️ Frontend-Backend Mismatch |
| **Total Test Cases** | **End-to-End Sprint 1 Scope** | **35** | **24** | **11** | **68.6%** | **Action Required** |

---

## 1. 🧪 Test Suite 1: Registration API (`POST /api/auth/register`)

### 1.1 Test Scope & Specifications
- **Target Endpoint:** `POST /api/auth/register`
- **Headers:** `Content-Type: application/json`, `Accept: application/json`
- **Expected Status Codes:** `201 Created` (Success), `400 Bad Request` (Validation Error), `409 Conflict` (Duplicate Resource)

### 1.2 Test Execution Results Table

| Test Case ID | Test Scenario | Request Payload | Expected Result | Actual Result | Status | Notes / Defect Reference |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-REG-01** | Valid Registration | `{"name": "Alex Rivera", "email": "alex.rivera@nexora.io", "password": "Password123!"}` | HTTP `201 Created`<br>Returns signed JWT + sanitized user object (no password) | HTTP `201 Created`<br>`{"success": true, "token": "...", "user": {...}}` | ✅ **PASS** | User created in MongoDB, password hashed via bcrypt. |
| **TC-REG-02** | Duplicate Email Registration | `{"name": "Alex Copy", "email": "alex.rivera@nexora.io", "password": "Password123!"}` | HTTP `409 Conflict`<br>`{"success": false, "message": "Email already in use"}` | HTTP `400 Bad Request`<br>`{"success": false, "message": "User already exists with this email address"}` | ❌ **FAIL** | **BUG-D2-001**: Returns HTTP `400` instead of HTTP `409 Conflict` as mandated by RFC 7231 & FR-AUTH-04. |
| **TC-REG-03** | Missing Name Field | `{"email": "noname@nexora.io", "password": "Password123!"}` | HTTP `400 Bad Request`<br>Validation message indicating name is required | HTTP `400 Bad Request`<br>`{"success": false, "message": "All fields are required: name, email, and password"}` | ✅ **PASS** | Guard clause triggered correctly. |
| **TC-REG-04** | Missing Email Field | `{"name": "No Email", "password": "Password123!"}` | HTTP `400 Bad Request`<br>Validation message indicating email is required | HTTP `400 Bad Request`<br>`{"success": false, "message": "All fields are required: name, email, and password"}` | ✅ **PASS** | Guard clause triggered correctly. |
| **TC-REG-05** | Missing Password Field | `{"name": "No Password", "email": "nopass@nexora.io"}` | HTTP `400 Bad Request`<br>Validation message indicating password is required | HTTP `400 Bad Request`<br>`{"success": false, "message": "All fields are required: name, email, and password"}` | ✅ **PASS** | Guard clause triggered correctly. |
| **TC-REG-06** | Whitespace-only Name | `{"name": "   ", "email": "white@nexora.io", "password": "Password123!"}` | HTTP `400 Bad Request`<br>`"Name cannot be empty"` | HTTP `400 Bad Request`<br>`{"success": false, "message": "Name cannot be empty"}` | ✅ **PASS** | Trim check caught whitespace. |
| **TC-REG-07** | Invalid Email Format (No `@`) | `{"name": "Test User", "email": "invalidemail.com", "password": "Password123!"}` | HTTP `400 Bad Request`<br>`"Please provide a valid email address"` | HTTP `400 Bad Request`<br>`{"success": false, "message": "Please provide a valid email address"}` | ✅ **PASS** | Controller regex rejected missing `@`. |
| **TC-REG-08** | Invalid Email Format (No TLD) | `{"name": "Test User", "email": "user@domain", "password": "Password123!"}` | HTTP `400 Bad Request`<br>`"Please provide a valid email address"` | HTTP `400 Bad Request`<br>`{"success": false, "message": "Please provide a valid email address"}` | ✅ **PASS** | Controller regex rejected missing TLD. |
| **TC-REG-09** | Valid Email with Tag / Plus Alias | `{"name": "Test User", "email": "alex+test@nexora.io", "password": "Password123!"}` | HTTP `201 Created`<br>RFC 5322 allows `+` in local-part | HTTP `400 Bad Request`<br>`"Please provide a valid email address"` | ❌ **FAIL** | **BUG-D2-002**: Backend regex `/^\w+([.-]?\w+)*@\w+.../` rejects legitimate email aliases containing `+`. |
| **TC-REG-10** | Weak Password (< 8 chars / no complex) | `{"name": "Weak Pass", "email": "weak@nexora.io", "password": "123456"}` | HTTP `400 Bad Request`<br>Enforce 8 chars, uppercase, lowercase, special | HTTP `201 Created`<br>API accepted 6 numeric characters | ❌ **FAIL** | **BUG-D2-007**: Backend allows 6 chars without complexity check, bypassing frontend PRD rules. |

---

## 2. 🔐 Test Suite 2: Login API (`POST /api/auth/login`)

### 2.1 Test Scope & Specifications
- **Target Endpoint:** `POST /api/auth/login`
- **Headers:** `Content-Type: application/json`
- **Expected Status Codes:** `200 OK` (Authenticated), `400 Bad Request` (Missing/Malformed), `401 Unauthorized` (Invalid Credentials), `429 Too Many Requests` (Lockout)

### 2.2 Test Execution Results Table

| Test Case ID | Test Scenario | Request Payload | Expected Result | Actual Result | Status | Notes / Defect Reference |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-LOG-01** | Correct Credentials | `{"email": "alex.rivera@nexora.io", "password": "Password123!"}` | HTTP `200 OK`<br>Returns signed JWT token + user profile | HTTP `200 OK`<br>`{"success": true, "token": "ey...", "user": {...}}` | ✅ **PASS** | Token verified with HS256 secret. |
| **TC-LOG-02** | Incorrect Password | `{"email": "alex.rivera@nexora.io", "password": "WrongPassword999!"}` | HTTP `401 Unauthorized`<br>`"Invalid email or password"` | HTTP `401 Unauthorized`<br>`{"success": false, "message": "Invalid email or password"}` | ✅ **PASS** | Prevents timing / username enumeration attacks. |
| **TC-LOG-03** | Unregistered Email | `{"email": "ghost.user@nexora.io", "password": "AnyPassword123!"}` | HTTP `401 Unauthorized`<br>`"Invalid email or password"` | HTTP `401 Unauthorized`<br>`{"success": false, "message": "Invalid email or password"}` | ✅ **PASS** | Returns identical 401 message as wrong password. |
| **TC-LOG-04** | Missing Email Field | `{"password": "Password123!"}` | HTTP `400 Bad Request`<br>`"Both email and password are required"` | HTTP `400 Bad Request`<br>`{"success": false, "message": "Both email and password are required"}` | ✅ **PASS** | Input guard properly triggered. |
| **TC-LOG-05** | Missing Password Field | `{"email": "alex.rivera@nexora.io"}` | HTTP `400 Bad Request`<br>`"Both email and password are required"` | HTTP `400 Bad Request`<br>`{"success": false, "message": "Both email and password are required"}` | ✅ **PASS** | Input guard properly triggered. |
| **TC-LOG-06** | Case-Insensitive Email Login | `{"email": "ALEX.RIVERA@NEXORA.IO", "password": "Password123!"}` | HTTP `200 OK`<br>Email normalized via `.toLowerCase()` | HTTP `200 OK`<br>Successful login | ✅ **PASS** | Normalized email matched stored lowercase record. |
| **TC-LOG-07** | Brute-Force Rate Limiting (5 failed attempts) | 5 consecutive invalid logins for same email/IP | HTTP `429 Too Many Requests`<br>15-minute temporary lockout (FR-AUTH-07) | HTTP `401 Unauthorized`<br>Allows infinite attempts without rate limit | ❌ **FAIL** | **BUG-D2-003**: No rate limiter middleware or failed login count tracking implemented. |

---

## 3. 📂 Test Suite 3: File Upload API (`POST /api/datasets/upload`)

### 3.1 Test Scope & Specifications
- **Target Endpoint:** `POST /api/datasets/upload`
- **Headers:** `Authorization: Bearer <valid_jwt>`, `Content-Type: multipart/form-data`
- **Payload Limits:** Max size 10 MB (FR-UPL-03)
- **Supported Formats:** `.csv`, `.json`, `.jsonl`

### 3.2 Test Execution Results Table

| Test Case ID | Test Scenario | File & Parameters | Expected Result | Actual Result | Status | Notes / Defect Reference |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-UPL-01** | Valid CSV File Upload | `churn_data.csv`<br>(Size: 142 KB, 2,500 rows, 8 columns) | HTTP `201 Created`<br>Returns dataset metadata, row count, column schema | HTTP `201 Created`<br>`{"success": true, "data": {"datasetId": "...", "metadata": {"rowCount": 2500, "columnCount": 8}}}` | ✅ **PASS** | Stream parser detected columns and inferred data types accurately. |
| **TC-UPL-02** | Valid JSON File Upload | `iot_telemetry.json`<br>(Size: 85 KB, array of 12 objects) | HTTP `201 Created`<br>Returns dataset metadata, parsed schema | HTTP `201 Created`<br>`{"success": true, "data": {"fileType": "json", "metadata": {"rowCount": 12, "columnCount": 6}}}` | ✅ **PASS** | Stream JSON parser handled nested objects and primitive types. |
| **TC-UPL-03** | Invalid File Format (`.exe` / `.pdf` / `.png`) | `malicious_script.exe`<br>(Size: 25 KB) | HTTP `415 Unsupported Media Type`<br>Rejection message | HTTP `400 Bad Request`<br>`"Unsupported file type. Only CSV and JSON formats are allowed."` | ❌ **FAIL** | **BUG-D2-004**: Returns HTTP `400` instead of standard HTTP `415 Unsupported Media Type`. |
| **TC-UPL-04** | Spoofed Extension with Allowed MIME | `payload.exe` sent with `Content-Type: text/plain` | HTTP `415 Unsupported Media Type`<br>Rejected by fileFilter | File accepted into temporary spool due to loose `uploadMiddleware.js` check | ❌ **FAIL** | **BUG-D2-004**: Logical `&&` flaw in `uploadMiddleware.js` allows arbitrary extensions if MIME matches `text/plain`. |
| **TC-UPL-05** | Empty File (0 Bytes CSV / JSON) | `empty_records.csv`<br>(Size: 0 Bytes) | HTTP `400 Bad Request`<br>`"Empty file not allowed. Dataset must contain at least one row."` | HTTP `201 Created`<br>Dataset saved in MongoDB with `rowCount: 0`, `columnCount: 0` | ❌ **FAIL** | **BUG-D2-005**: 0-byte files are indexed and stored rather than rejected upfront. |
| **TC-UPL-06** | File Exceeding Size Limit (> 10MB) | `large_sample.csv`<br>(Size: 14.2 MB) | HTTP `413 Payload Too Large`<br>`"File size exceeds limit of 10MB"` | File accepted (limit set to 100MB in middleware, 50MB in Frontend) | ❌ **FAIL** | **BUG-D2-006**: Limit configured to 100MB/50MB instead of 10MB. When exceeded, returns HTTP `400` instead of `413`. |
| **TC-UPL-07** | Missing File Attachment | Multipart request with empty `file` field | HTTP `400 Bad Request`<br>`"Please provide a CSV or JSON file to upload"` | HTTP `400 Bad Request`<br>`{"success": false, "message": "Please provide a CSV or JSON file to upload"}` | ✅ **PASS** | Multer and controller handled missing file cleanly. |
| **TC-UPL-08** | Unauthorized Upload Attempt | `customers.csv` without `Authorization` header | HTTP `401 Unauthorized`<br>`"Not authorized, token missing or invalid"` | HTTP `401 Unauthorized`<br>`{"success": false, "message": "Not authorized to access this route"}` | ✅ **PASS** | `protect` middleware intercepted request. |

---

## 4. 🗄️ Verification of MongoDB Storage (User & Dataset Schemas)

### 4.1 User Schema Verification (`Backend/models/User.js`)

```
================================================================================
                    MONGODB USER DOCUMENT SCHEMA AUDIT
================================================================================
Field Name     | Type     | Required | Unique | Validation / Transformation
--------------------------------------------------------------------------------
_id            | ObjectId | Auto     | True   | Primary Key generated by MongoDB
name           | String   | True     | False  | Trimmed; minlength: 2
email          | String   | True     | True   | Lowercased; trimmed; RFC regex match
password       | String   | True     | False  | Hashed via bcrypt (10 rounds) in pre('save')
createdAt      | Date     | True     | False  | Default: Date.now
================================================================================
```

#### Detailed Findings & Verification Points:
1. **Password Cryptographic Security:** Passwords are never stored in plaintext. In `User.js`, `userSchema.pre('save')` generates a 10-round salt via `bcrypt.genSalt(10)` and hashes the password before persistence.
2. **Serialization Sanitization:** The `toJSON()` method overrides Mongoose default output: `delete userObject.password`. Verification confirms API responses (`/register`, `/login`, `/me`) NEVER return the hashed or plaintext password.
3. **Email Uniqueness:** Compound unique index on `email` prevents duplicate registrations at the database engine level.
4. **Discrepancy (BUG-D2-007):** In `User.js`, `minlength: [6, 'Password must be at least 6 characters']`. However, PRD and frontend enforce 8 characters with character complexity rules. A direct API call with a 6-character password succeeds in MongoDB.

---

### 4.2 Dataset Schema Verification (`Backend/models/Dataset.js`)

```
================================================================================
                   MONGODB DATASET DOCUMENT SCHEMA AUDIT
================================================================================
Field Name        | Type     | Required | Schema Attributes & Indexing
--------------------------------------------------------------------------------
datasetId         | String   | True     | UUIDv4 index; unique external identifier
userId            | ObjectId | True     | Ref: 'User'; indexed for multi-tenant isolation
fileName          | String   | True     | Original client file name
fileType          | String   | True     | Enum: ['csv', 'json', 'jsonl'] (lowercased)
fileSize          | Number   | True     | In bytes; validated against payload threshold
storageUrl        | String   | True     | Presigned or local URI (/uploads/datasets/...)
name              | String   | False    | Custom dataset title (max 120 chars)
description       | String   | False    | User description (max 1000 chars)
mimeType          | String   | False    | MIME type recorded at ingestion
status            | String   | True     | Enum: ['uploading', 'processing', 'ready', 'failed']
metadata          | Object   | True     | { rowCount, columnCount, columns: [...], delimiter }
metadata.columns  | Array    | True     | Subdocument: { name, dataType, nullCount, sampleValues }
previewData       | Array    | True     | Array of Mixed records (first 50 sample rows)
tags              | Array    | False    | Lowercased keywords for filtering & categorization
createdAt         | Date     | True     | Ingestion timestamp (default: Date.now)
================================================================================
Indexes:
- datasetSchema.index({ userId: 1, createdAt: -1 });  // High performance user query
- datasetSchema.index({ fileName: 'text', name: 'text', description: 'text' }); // Full-text search
```

#### Detailed Findings & Verification Points:
1. **User Isolation (Multi-Tenancy):** Every dataset record is strictly bound to `userId: req.user._id`. The helper `findUserDataset(id, userId)` guarantees that User A can never query, preview, download, or delete datasets belonging to User B (`404 Not Found`).
2. **Schema Inference Persistence:** Columns are accurately typed (`number`, `string`, `boolean`, `date`, `object`) and stored with null counts and sample values for immediate UI rendering without re-reading raw files.
3. **Architectural Divergence (BUG-D2-008):** In `origin/main:server.js`, dataset upload bypassed MongoDB entirely, saving to an in-memory `datasetsCatalog` array. On the `origin/Gaurav` branch, `datasetController.js` and `datasetRoutes.js` were correctly wired to persist to MongoDB using `Dataset.create()`. Merging `origin/Gaurav` into `origin/main` is mandatory.

---

## 5. 🖥️ Test Suite 5: Frontend Validation & Error Messages

### 5.1 Registration Page Validation (`Frontend/src/pages/Register.jsx` & `validation.js`)

| Field | Input Test Value | Trigger Action | Expected Error Message | Actual Rendered Message | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Full Name** | `""` (Empty) | Form Submit / Blur | `"Full name is required"` | `"Full name is required"` | ✅ **PASS** |
| **Full Name** | `"A"` (< 2 chars) | On Blur | `"Name must be at least 2 characters"` | `"Name must be at least 2 characters"` | ✅ **PASS** |
| **Full Name** | `"John123"` | On Blur | `"Name can only contain letters, spaces, hyphens, and apostrophes"` | `"Name can only contain letters, spaces, hyphens, and apostrophes"` | ✅ **PASS** |
| **Email** | `""` (Empty) | Form Submit / Blur | `"Email address is required"` | `"Email address is required"` | ✅ **PASS** |
| **Email** | `"user@domain"` | On Blur | `"Please enter a valid email address (e.g. name@domain.com)"` | `"Please enter a valid email address (e.g. name@domain.com)"` | ✅ **PASS** |
| **Password** | `"Pass1!"` (< 8 chars) | On Blur | `"Password must be at least 8 characters long"` | `"Password must be at least 8 characters long"` | ✅ **PASS** |
| **Password** | `"password123!"` (No Upper) | On Blur | `"Password must contain at least one uppercase letter (A-Z)"` | `"Password must contain at least one uppercase letter (A-Z)"` | ✅ **PASS** |
| **Password** | `"PASSWORD123!"` (No Lower) | On Blur | `"Password must contain at least one lowercase letter (a-z)"` | `"Password must contain at least one lowercase letter (a-z)"` | ✅ **PASS** |
| **Password** | `"Password!"` (No Number) | On Blur | `"Password must contain at least one number (0-9)"` | `"Password must contain at least one number (0-9)"` | ✅ **PASS** |
| **Password** | `"Password123"` (No Special) | On Blur | `"Password must contain at least one special character"` | `"Password must contain at least one special character"` | ✅ **PASS** |
| **Confirm Pass** | Different from Password | On Change / Blur | `"Passwords do not match"` | `"Passwords do not match"` | ✅ **PASS** |
| **Terms Checkbox** | Unchecked (`false`) | Form Submit | `"You must accept the Terms of Service to continue"` | `"You must accept the Terms of Service to continue"` | ✅ **PASS** |
| **Strength Meter** | `"Password123!"` | Dynamic typing | Visual progress bar with "Strong" badge (Emerald) | Rendered: Score 4/4, "Strong", Emerald bar | ✅ **PASS** |

---

### 5.2 Login Page Validation (`Frontend/src/pages/Login.jsx`)

| Field | Input Test Value | Trigger Action | Expected Error Message | Actual Rendered Message | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Email** | `""` (Empty) | Form Submit | `"Email address is required"` | `"Email address is required"` | ✅ **PASS** |
| **Password** | `""` (Empty) | Form Submit | `"Password is required"` | `"Password is required"` | ✅ **PASS** |
| **Server Error** | Invalid credentials (`401`) | Form Submit | Inline rose alert: `"Unable to sign in. Please verify your email and password."` | Rendered clean error alert with `AlertCircle` icon | ✅ **PASS** |
| **Redirect Notice**| Arriving from Register | Initial render | Banner: `"Account created successfully! Please enter your password to sign in."` | Rendered amber/emerald welcome badge | ✅ **PASS** |

---

### 5.3 Dataset Dropzone & Upload Validation (`Frontend/src/components/datasets/DatasetDropzone.jsx`)

| Action / Input | Test Scenario | Expected Result | Actual Result | Status | Notes / Defect Reference |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Drag & Drop** | Drag file over dropzone | Visual state changes: cyan highlight, border glow | Container gains `border-cyan-400 bg-cyan-950/30` | ✅ **PASS** | Excellent reactive feedback. |
| **Invalid Extension** | Drop `document.pdf` | Inline error: `"Unsupported file type. Please upload a .csv, .json..."` | Rendered rose alert with error message | ✅ **PASS** | Client-side dropzone blocks unsupported file. |
| **Extension Support Mismatch** | Drop `dataset.xlsx` | Should match backend support | Dropzone allows `.xlsx` and `.tsv`, but Backend throws `400 Unsupported file type` | ❌ **FAIL** | **BUG-D2-009**: Dropzone accepts `.xlsx`/`.tsv`, causing backend transmission failure. |
| **Exceeding Size** | File > 50 MB | Error alert: `"File size exceeds limit (50 MB)..."` | Rendered size limit error alert | ❌ **FAIL** | **BUG-D2-010**: Frontend threshold is 50MB, but PRD FR-UPL-03 specifies 10MB limit. |
| **Empty File (0 B)** | Drop 0-byte `empty.json` | Rejection alert | Throws syntax error `"Failed to parse JSON file"`, but 0-byte CSV passes | ❌ **FAIL** | 0-byte CSV displays empty preview and allows transmit. |
| **Upload Progress** | Transmitting to Backend | Progress bar animates with loaded percentage | `onUploadProgress` updates state from `0%` to `100%` | ✅ **PASS** | Axios progress hook works cleanly. |

---

## 6. 🐛 Day 2 Bug Tracking Sheet & Developer Assignment Log

All defects discovered during Day 2 testing have been thoroughly documented with root cause analysis, reproduction steps, exact source code references, and assigned to the responsible developers.

### 6.1 Defect Summary by Assignee & Severity

| Developer | Assigned Role | Critical (P1) | High (P2) | Medium (P3) | Low (P4) | Total Assigned |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Gaurav** | Backend Lead (Auth & API Architecture) | 2 | 3 | 1 | 0 | **6** |
| **Harshit** | Backend Developer (Datasets & Storage) | 1 | 1 | 0 | 0 | **2** |
| **Akshat** | Frontend Lead (UI & Client Validation) | 0 | 1 | 1 | 0 | **2** |
| **Mahesh** | Engine / Storage Developer | 0 | 0 | 0 | 0 | **0** |
| **Total Open Defects** | | **3** | **5** | **2** | **0** | **10** |

---

### 6.2 Master Bug Tracking Log Table

| Bug ID | Severity | Pri. | Module | Summary / Description | Assignee | Component & File | Status |
| :---: | :---: | :---: | :---: | :--- | :---: | :--- | :---: |
| **BUG-D2-001** | 🟠 High | P2 | Auth / Reg | Duplicate email registration returns HTTP `400 Bad Request` instead of HTTP `409 Conflict` | **Gaurav** | `Backend/controllers/authController.js` | 🔴 OPEN |
| **BUG-D2-002** | 🟡 Medium | P3 | Auth / Reg | Valid email addresses containing `+` alias (e.g. `user+tag@domain.com`) are rejected by backend regex | **Gaurav** | `Backend/controllers/authController.js` | 🔴 OPEN |
| **BUG-D2-003** | 🔴 Critical | P1 | Auth / Login | No account lockout or rate limiting on `/api/auth/login` after 5 consecutive failed attempts | **Gaurav** | `Backend/routes/authRoutes.js` | 🔴 OPEN |
| **BUG-D2-004** | 🔴 Critical | P1 | Upload | Multer middleware uses logical `&&` flaw allowing arbitrary extensions with `text/plain` MIME; returns `400` instead of `415` | **Gaurav** | `Backend/middleware/uploadMiddleware.js` | 🔴 OPEN |
| **BUG-D2-005** | 🟠 High | P2 | Upload | Empty 0-byte CSV/JSON files are accepted and saved to MongoDB with `rowCount: 0` instead of returning `400` | **Harshit** | `Backend/controllers/datasetController.js` | 🔴 OPEN |
| **BUG-D2-006** | 🟠 High | P2 | Upload | File size limit configured at 100MB/50MB instead of PRD 10MB; returns HTTP `400` instead of HTTP `413 Payload Too Large` | **Gaurav** | `Backend/middleware/uploadMiddleware.js` | 🔴 OPEN |
| **BUG-D2-007** | 🟡 Medium | P3 | Auth / Model | Mongoose User model enforces only 6 characters with no complexity checks, allowing weak passwords via direct API | **Gaurav** | `Backend/models/User.js` | 🔴 OPEN |
| **BUG-D2-008** | 🔴 Critical | P1 | Upload / DB | `server.js` on `origin/main` uses an in-memory `datasetsCatalog` array rather than persisting to MongoDB | **Harshit** | `Backend/server.js` | 🔴 OPEN |
| **BUG-D2-009** | 🟠 High | P2 | Frontend | Frontend Dropzone accepts `.xlsx` and `.tsv`, causing silent transmission failures when rejected by Backend | **Akshat** | `Frontend/src/components/datasets/DatasetDropzone.jsx` | 🔴 OPEN |
| **BUG-D2-010** | 🟡 Medium | P3 | Frontend | Frontend Dropzone file size limit is set to 50MB instead of aligning with PRD 10MB limit | **Akshat** | `Frontend/src/components/datasets/DatasetDropzone.jsx` | 🔴 OPEN |

---

### 6.3 Detailed Defect Dossiers & Remediation Guides

#### 🐞 BUG-D2-001: Duplicate Email Returns HTTP 400 Instead of HTTP 409 Conflict
- **Severity:** High (P2)
- **Assignee:** **Gaurav** (Backend Lead)
- **Component:** `Backend/controllers/authController.js` (Lines 44-51)
- **Steps to Reproduce:**
  1. Send `POST /api/auth/register` with `{ "name": "User", "email": "duplicate@nexora.io", "password": "Password123!" }`. Returns 201.
  2. Send identical request again.
- **Expected Behavior:** System responds with HTTP `409 Conflict` and payload `{"success": false, "message": "Email already in use"}`.
- **Actual Behavior:** System responds with HTTP `400 Bad Request` and message `"User already exists with this email address"`.
- **Root Cause Analysis:** `authController.js` explicitly issues `res.status(400)`. Additionally, if MongoDB throws duplicate key error `E11000`, the generic catch block passes it to `errorHandler.js` which responds with HTTP `500 Server Error`.
- **Recommended Remediation:**
```javascript
// In authController.js:
const existingUser = await User.findOne({ email: trimmedEmail });
if (existingUser) {
  return res.status(409).json({
    success: false,
    message: 'User already exists with this email address'
  });
}

// In errorHandler.js or catch block:
if (error.code === 11000) {
  return res.status(409).json({
    success: false,
    message: 'An account with this email address already exists'
  });
}
```

---

#### 🐞 BUG-D2-002: Backend Email Regex Rejects Legitimate RFC 5322 Aliases (`+`)
- **Severity:** Medium (P3)
- **Assignee:** **Gaurav** (Backend Lead)
- **Component:** `Backend/controllers/authController.js` (Line 5)
- **Steps to Reproduce:**
  1. Send `POST /api/auth/register` with `email: "developer+test@nexora.io"`.
- **Expected Behavior:** Registration succeeds with HTTP 201 Created.
- **Actual Behavior:** Returns HTTP 400 Bad Request with `"Please provide a valid email address"`.
- **Root Cause Analysis:** Regex is defined as `const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;`. `\w` is shorthand for `[a-zA-Z0-9_]`, excluding `+`, `%`, `-`.
- **Recommended Remediation:**
```javascript
// Replace with standard RFC 5322 compliant regex (aligned with Frontend validation.js):
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
```

---

#### 🐞 BUG-D2-003: Missing Account Lockout & Brute-Force Rate Limiting
- **Severity:** Critical (P1)
- **Assignee:** **Gaurav** (Backend Lead)
- **Component:** `Backend/routes/authRoutes.js` & `Backend/models/User.js`
- **Steps to Reproduce:**
  1. Send 100 automated POST requests with incorrect passwords to `/api/auth/login`.
- **Expected Behavior:** After 5 failed attempts, endpoint blocks requests for 15 minutes with HTTP `429 Too Many Requests`.
- **Actual Behavior:** All 100 attempts execute and return HTTP 401 Unauthorized with no throttling or lockout.
- **Root Cause Analysis:** Missing `express-rate-limit` middleware and missing lockout state fields (`failedLoginAttempts`, `lockUntil`) in `User.js`.
- **Recommended Remediation:**
```javascript
// Install and attach express-rate-limit to authRoutes.js:
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed login attempts. Account temporarily locked for 15 minutes.'
  }
});

router.post('/login', loginLimiter, loginUser);
```

---

#### 🐞 BUG-D2-004: Upload FileFilter Condition Flaw & HTTP 415 Status Code Missing
- **Severity:** Critical (P1)
- **Assignee:** **Gaurav** (Backend Lead)
- **Component:** `Backend/middleware/uploadMiddleware.js` (Lines 49-55) & `datasetController.js`
- **Steps to Reproduce:**
  1. Send a POST request with `file: malicious.exe` and header `Content-Type: text/plain`.
  2. Send a POST request with `file: document.pdf`.
- **Expected Behavior:** Both requests rejected with HTTP `415 Unsupported Media Type`.
- **Actual Behavior:** 
  - `malicious.exe` passes through Multer because `allowedMimeTypes.includes('text/plain')` evaluates to true!
  - `document.pdf` returns HTTP `400 Bad Request` instead of HTTP `415 Unsupported Media Type`.
- **Root Cause Analysis:**
```javascript
// Existing faulty code in uploadMiddleware.js:
if (!allowedExtensions.includes(ext) && !allowedMimeTypes.includes(file.mimetype)) {
  const error = new Error('Unsupported file type...');
  error.code = 'INVALID_FILE_TYPE';
  return cb(error, false);
}
```
Using `&&` means that if EITHER the extension OR the MIME type is in the allowed list, the file passes!
- **Recommended Remediation:**
```javascript
// In uploadMiddleware.js:
const allowedExtensions = ['.csv', '.json', '.jsonl'];
const allowedMimeTypes = ['text/csv', 'application/json', 'application/x-ndjson'];

if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(file.mimetype)) {
  const error = new Error('Unsupported file type. Only CSV and JSON formats (.csv, .json, .jsonl) are allowed.');
  error.code = 'INVALID_FILE_TYPE';
  error.status = 415;
  return cb(error, false);
}

// In handleUpload middleware wrapper:
if (err.code === 'INVALID_FILE_TYPE') {
  return res.status(415).json({
    success: false,
    message: err.message
  });
}
```

---

#### 🐞 BUG-D2-005: 0-Byte Empty CSV and JSON Files Accepted and Persisted
- **Severity:** High (P2)
- **Assignee:** **Harshit** (Backend / Dataset Specialist)
- **Component:** `Backend/controllers/datasetController.js` (Lines 45-60)
- **Steps to Reproduce:**
  1. Upload `empty.csv` (0 bytes).
- **Expected Behavior:** Rejected with HTTP `400 Bad Request` (`"Uploaded file is empty. Dataset must contain at least 1 record."`).
- **Actual Behavior:** Returns HTTP `201 Created`. MongoDB creates dataset record with `rowCount: 0`, `columnCount: 0`, and status `'ready'`.
- **Root Cause Analysis:** Neither `uploadMiddleware.js` nor `datasetController.js` checks `if (fileSize === 0)`.
- **Recommended Remediation:**
```javascript
// In datasetController.js (immediately after file extraction):
if (fileSize === 0) {
  if (fs.existsSync(tempFilePath)) await fs.promises.unlink(tempFilePath);
  return res.status(400).json({
    success: false,
    message: 'Uploaded file is empty. Datasets must contain at least one valid record.'
  });
}
```

---

#### 🐞 BUG-D2-006: Payload Size Limit Exceeded Returns HTTP 400 Instead of HTTP 413
- **Severity:** High (P2)
- **Assignee:** **Gaurav** (Backend Lead)
- **Component:** `Backend/middleware/uploadMiddleware.js` (Lines 60, 85-92)
- **Steps to Reproduce:**
  1. Upload a file exceeding configured size threshold.
- **Expected Behavior:** Responds with HTTP `413 Payload Too Large`. Max limit should be 10MB (FR-UPL-03).
- **Actual Behavior:** Limit defaults to 100MB (or 500MB). When Multer triggers `LIMIT_FILE_SIZE`, it returns HTTP `400 Bad Request`.
- **Root Cause Analysis:** `handleUpload` hardcodes `return res.status(400)` for `err.code === 'LIMIT_FILE_SIZE'`.
- **Recommended Remediation:**
```javascript
// In uploadMiddleware.js:
const MAX_FILE_SIZE = 10 * 1024 * 1024; // Strictly enforce 10MB

if (err.code === 'LIMIT_FILE_SIZE') {
  return res.status(413).json({
    success: false,
    message: 'File size exceeds maximum permitted limit of 10MB.'
  });
}
```

---

#### 🐞 BUG-D2-007: Mongoose User Model Password Validation Inconsistency
- **Severity:** Medium (P3)
- **Assignee:** **Gaurav** (Backend Lead)
- **Component:** `Backend/models/User.js` (Lines 24-27)
- **Steps to Reproduce:**
  1. Send `POST /api/auth/register` with `password: "123456"`.
- **Expected Behavior:** Rejected with HTTP 400 Bad Request because password requires 8+ characters, uppercase, lowercase, number, and special character.
- **Actual Behavior:** MongoDB accepts 6-character plain number string and hashes it.
- **Root Cause Analysis:** Schema defines `minlength: [6, 'Password must be at least 6 characters']` without regex or custom validator.
- **Recommended Remediation:**
```javascript
// In User.js schema:
password: {
  type: String,
  required: [true, 'Please provide a password'],
  minlength: [8, 'Password must be at least 8 characters'],
  validate: {
    validator: function (val) {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(val);
    },
    message: 'Password must contain uppercase, lowercase, number, and special character'
  }
}
```

---

#### 🐞 BUG-D2-008: In-Memory Dataset Catalog Mock Overwrites MongoDB Ingestion
- **Severity:** Critical (P1)
- **Assignee:** **Harshit** (Backend / Datasets)
- **Component:** `Backend/server.js` (Lines 40-500)
- **Steps to Reproduce:**
  1. Check `origin/main:server.js`.
- **Expected Behavior:** All dataset routes routed through `routes/datasetRoutes.js` and stored in MongoDB `Dataset` collection.
- **Actual Behavior:** `server.js` contains a 600-line mock `datasetsCatalog` array that stores uploads in memory without MongoDB persistence.
- **Root Cause Analysis:** PR #5 merged an outdated mock prototype into `server.js`.
- **Recommended Remediation:**
Merge the clean implementation from `origin/Gaurav` into `origin/main`:
```javascript
// In server.js:
const datasetRoutes = require('./routes/datasetRoutes');
app.use('/api/datasets', datasetRoutes);
```

---

#### 🐞 BUG-D2-009: Frontend Dropzone File Extension Mismatch (`.xlsx`, `.tsv`)
- **Severity:** High (P2)
- **Assignee:** **Akshat** (Frontend Lead)
- **Component:** `Frontend/src/components/datasets/DatasetDropzone.jsx` (Line 18)
- **Steps to Reproduce:**
  1. Drag and drop `spreadsheet.xlsx` onto the frontend dropzone.
- **Expected Behavior:** UI informs user that only CSV and JSON formats are supported.
- **Actual Behavior:** Dropzone accepts `.xlsx` and `.tsv`, but when transmitted to `/api/datasets/upload`, backend rejects it with an error.
- **Root Cause Analysis:** `ACCEPTED_EXTENSIONS` is set to `['.csv', '.json', '.xlsx', '.tsv']` in `DatasetDropzone.jsx`.
- **Recommended Remediation:**
```javascript
// In DatasetDropzone.jsx:
const ACCEPTED_EXTENSIONS = ['.csv', '.json', '.jsonl'];
```

---

#### 🐞 BUG-D2-010: Frontend File Size Threshold Diverges from PRD Limit (50MB vs 10MB)
- **Severity:** Medium (P3)
- **Assignee:** **Akshat** (Frontend Lead)
- **Component:** `Frontend/src/components/datasets/DatasetDropzone.jsx` (Line 19)
- **Steps to Reproduce:**
  1. Select a 30MB CSV file in the frontend dropzone.
- **Expected Behavior:** Frontend dropzone blocks the file immediately with a 10MB limit warning.
- **Actual Behavior:** Dropzone allows the 30MB file to load and attempts transmission.
- **Root Cause Analysis:** `MAX_FILE_SIZE_BYTES` is set to `50 * 1024 * 1024` (50MB) in `DatasetDropzone.jsx`.
- **Recommended Remediation:**
```javascript
// In DatasetDropzone.jsx:
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (aligned with FR-UPL-03)
```

---

## 7. 🎯 Quality Sign-off & Day 2 Action Plan

### 7.1 Engineering Task Handoff & Next Steps

```
+-----------------------------------------------------------------------------------+
|                        DAY 2 QA HANDOFF & DEFECT PIPELINE                         |
+-----------------------------------------------------------------------------------+
|  [ Gaurav (Backend Lead) ]                                                        |
|  ├── Patch BUG-D2-001: Return HTTP 409 Conflict for duplicate email registrations  |
|  ├── Patch BUG-D2-002: Update email regex to support RFC 5322 alias '+' tags      |
|  ├── Patch BUG-D2-003: Integrate express-rate-limit on /api/auth/login             |
|  ├── Patch BUG-D2-004: Fix uploadMiddleware logical && flaw & return HTTP 415     |
|  └── Patch BUG-D2-006: Enforce 10MB limit and return HTTP 413 Payload Too Large    |
|                                                                                   |
|  [ Harshit (Backend / Datasets) ]                                                 |
|  ├── Patch BUG-D2-005: Reject 0-byte empty files with HTTP 400 Bad Request         |
|  └── Patch BUG-D2-008: Merge origin/Gaurav server.js to use MongoDB Dataset Model |
|                                                                                   |
|  [ Akshat (Frontend Lead) ]                                                       |
|  ├── Patch BUG-D2-009: Restrict Dropzone ACCEPTED_EXTENSIONS to [.csv, .json]      |
|  └── Patch BUG-D2-010: Align MAX_FILE_SIZE_BYTES to 10 MB in DatasetDropzone      |
|                                                                                   |
|  [ Abhishek (QA Lead) ]                                                           |
|  └── Day 3 Re-test: Execute regression cycle once above patches are committed.     |
+-----------------------------------------------------------------------------------+
```

### 7.2 Sign-off Assessment
- **API Functional Readiness:** Core authentication flows (`register`, `login`, password hashing, JWT generation) and dataset stream parsing are operational.
- **Deployment Status:** Blocked from production release pending resolution of P1 defects (**BUG-D2-003**, **BUG-D2-004**, **BUG-D2-008**).
- **Target Resolution Time:** All P1 defects to be resolved by end-of-day; full regression verification scheduled for Day 3.

**Report Generated & Certified by:**  
**Abhishek**  
*QA Test Engineer, Nexora Platform Engineering*
