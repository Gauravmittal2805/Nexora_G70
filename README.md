## 🎯 About the Project

**Nexora** is a final-year academic project developed by Group G70. It provides a **No-Code ETL (Extract, Transform, Load) platform** that enables both technical and non-technical users to upload, preview, visually map, and transform large CSV/JSON datasets — all through an intuitive browser-based interface.

> **Objective:** To develop a No-Code ETL platform for Mapping, Transformation, and processing large CSV and JSON datasets efficiently.

### Existing Solutions Comparison

| Platform | Focus | Limitation vs Nexora |
|----------|-------|----------------------|
| Zoho Data Prep | AI-powered data preparation | Closed SaaS, no custom ETL logic |
| TamedTable | NL-based CSV/JSON cleaning | No streaming; limited pipeline control |
| Airbyte / Matillion | Enterprise ELT/warehouse pipelines | Complex setup; not no-code friendly |

---

## ✨ What Makes Nexora Different

Nexora combines the best aspects of these platforms into a **single lightweight application**:

- 🤖 **AI-Assisted Mapping** — Heuristic + Groq AI-powered field mapping & transformation suggestions
- 🗺️ **Visual Field Mapping** — Drag-and-drop source → destination column mapping with custom labels
- ⚙️ **Transformation Studio** — Chainable, per-column transformation pipelines with live preview
- 🌊 **Streaming Processing** — Memory-efficient processing of large CSV/JSON files using Node.js streams
- 🔐 **Secure Custom Transformations** — Isolated JavaScript execution (isolated-vm) for user-defined logic
- 📊 **Real-time Monitoring** — Socket.IO–based live job progress, success/failure record tracking
- ☁️ **Cloud Storage** — Backblaze B2 (S3-compatible) for uploaded dataset file management

---

## 🚀 Features

### ✅ Implemented

| Module | Feature |
|--------|---------|
| **Authentication** | JWT-based register/login, protected routes, bcrypt password hashing |
| **Dataset Upload** | CSV & JSON file upload with drag-and-drop, metadata form, format detection |
| **Dataset Catalog** | List all uploaded datasets with name, type, size, upload date, and status |
| **Dataset Preview** | Paginated tabular preview (first 10–20 rows), sortable columns, type badges |
| **Field Mapping Studio** | Three-panel layout: Source columns → Custom destination labels → Role assignment |
| **Transformation Studio** | Per-column pipelines: Trim, Uppercase, Lowercase, String→Number, Remove Empty, Find & Replace |
| **Transformation Preview** | Live preview of original vs. transformed sample values per column |
| **Auto-Suggest Mapping** | Heuristic engine auto-classifies columns as Target, ID, Numerical, Categorical, Datetime, Ignored |
| **Dashboard** | Overview metrics, recent datasets, platform status |
| **Analytics** | Performance and usage metrics view |
| **Settings** | Project & user configuration page |
| **Offline Mode** | Full localStorage fallback when backend is unreachable |

### 🚧 In Progress / Planned

| Feature | Phase |
|---------|-------|
| Groq AI field mapping suggestions | Phase 3 |
| Streaming batch ETL processing | Phase 3 |
| Data validation rules engine | Phase 3 |
| Socket.IO real-time job monitoring | Phase 4 |
| Processed data export (CSV/JSON) | Phase 4 |
| Processing history & job logs | Phase 4 |

---


### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | LTS | Runtime |
| Express | 5.3.0 | Web framework |
| Mongoose | 9.12.0 | MongoDB ODM |
| Multer | 2.5.0 | File upload middleware |
| JSON Web Token | 9.0.3 | Authentication |
| bcryptjs | 3.0.3 | Password hashing |
| AWS SDK v3 (S3) | 3.x | Backblaze B2 cloud storage (S3-compatible) |
| csv-parser | 3.2.1 | Streaming CSV parsing |
| stream-json | 1.9.1 | Streaming JSON parsing |
| stream-chain | 4.4.2 | Composable transform streams |
| dotenv | 18.x | Environment variable management |
| cors | 2.8.6 | Cross-origin resource sharing |

### Infrastructure
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Dataset metadata, user accounts, job records |
| Backblaze B2 | Raw file storage (S3-compatible API) |
| Socket.IO *(planned)* | Real-time ETL job monitoring |
| Groq AI API *(planned)* | Intelligent mapping & transformation suggestions |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React 19 + Vite + Tailwind CSS              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │   │
│  │  │ Dataset  │ │  Field   │ │Transform │ │ Dashboard │  │   │
│  │  │  Upload  │ │ Mapping  │ │  Studio  │ │ Analytics │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │   │
│  └──────────────────────── Axios + React Router ────────────┘   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP / REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS 5 BACKEND (Node.js)                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │    Auth    │ │  Dataset   │ │    ETL     │ │   Health   │   │
│  │  Routes   │ │   Routes  │ │  Pipeline  │ │   Routes   │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │          Streaming Engine (csv-parser / stream-json)       │  │
│  └────────────────────────────────────────────────────────────┘  │
└───────────────────┬──────────────────────┬──────────────────────┘
                    │                      │
          ┌─────────▼──────┐    ┌──────────▼─────────┐
          │  MongoDB Atlas │    │   Backblaze B2      │
          │  (Metadata &   │    │   (Raw File         │
          │   User Data)   │    │    Storage)         │
          └────────────────┘    └────────────────────┘
```

---

## 📁 Project Structure

```
Nexora_G70/
├── Frontend/                        # React + Vite application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── Login.jsx            # Authentication
│   │   │   ├── Register.jsx         # User registration
│   │   │   ├── Dashboard.jsx        # Main dashboard
│   │   │   ├── DatasetUpload.jsx    # File upload with metadata
│   │   │   ├── DatasetsList.jsx     # Dataset catalog + preview
│   │   │   ├── FieldMapping.jsx     # Visual field mapping studio
│   │   │   ├── TransformationConfig.jsx  # Transformation pipeline UI
│   │   │   ├── Analytics.jsx        # Performance metrics
│   │   │   └── SettingsPage.jsx     # User & project settings
│   │   ├── components/
│   │   │   ├── common/              # Reusable UI primitives
│   │   │   ├── dashboard/
│   │   │   │   ├── Sidebar.jsx      # Navigation sidebar
│   │   │   │   └── Header.jsx       # Dashboard header
│   │   │   └── datasets/
│   │   │       ├── DatasetDropzone.jsx    # File drag-and-drop
│   │   │       ├── DatasetMetadataForm.jsx
│   │   │       └── DatasetPreviewTable.jsx
│   │   ├── services/
│   │   │   ├── api.js               # Axios base instance
│   │   │   ├── authService.js       # Login/register/token
│   │   │   ├── datasetService.js    # Dataset CRUD + preview + mapping
│   │   │   └── tokenService.js      # JWT token management
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global auth state
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.jsx  # Sidebar + header wrapper
│   │   │   ├── AuthLayout.jsx
│   │   │   └── MainLayout.jsx
│   │   └── utils/
│   │       ├── userUtils.js
│   │       └── validation.js
│   ├── package.json
│   ├── vite.config.js               # Proxy config (→ port 5001)
│   └── .oxlintrc.json
│
├── Backend/                         # Express 5 REST API
│   ├── server.js                    # Entry point, route registration
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── s3Client.js              # Backblaze B2 / S3 client
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── datasetController.js
│   │   └── healthController.js
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   ├── uploadMiddleware.js      # Multer config
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   └── Dataset.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── datasetRoutes.js
│   │   └── healthRoutes.js
│   ├── utils/
│   │   ├── b2Storage.js             # Backblaze B2 upload helpers
│   │   ├── streamParsers.js         # Streaming CSV/JSON parsers
│   │   └── generateToken.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **MongoDB Atlas** account (or local MongoDB)
- **Backblaze B2** account (for file storage)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/Nexora_G70.git
cd Nexora_G70
```

### 2. Backend Setup

```bash
cd Backend
npm install
cp .env.example .env
# → Fill in your credentials (see Environment Variables below)
npm run dev
# Backend starts on http://localhost:5001
```

### 3. Frontend Setup

```bash
# Open a new terminal
cd Frontend
npm install
npm run dev
# Frontend starts on http://localhost:5173
```

### 4. Open in Browser

```
http://localhost:5173
```

> **Offline Mode:** The app works without the backend running. All dataset operations fall back to `localStorage`. Vite proxy errors in the terminal are suppressed and do not affect the UI.

---

## 🔐 Environment Variables

Create `Backend/.env` from `Backend/.env.example`:

```env
# Server
PORT=5001
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/nexora

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Backblaze B2 (S3-compatible)
B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_REGION=us-west-004
B2_ACCESS_KEY_ID=your_b2_key_id
B2_SECRET_ACCESS_KEY=your_b2_app_key
B2_BUCKET_NAME=nexora-datasets

# Groq AI (Phase 3)
GROQ_API_KEY=your_groq_api_key
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login & receive JWT |
| `GET` | `/api/auth/me` | Get current user (protected) |

### Datasets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/datasets` | List all datasets |
| `POST` | `/api/datasets/upload` | Upload CSV or JSON file |
| `GET` | `/api/datasets/:id` | Get dataset metadata |
| `DELETE` | `/api/datasets/:id` | Delete dataset |
| `GET` | `/api/datasets/:id/preview` | Paginated row preview (`?page=1&limit=10`) |
| `GET` | `/api/datasets/:id/profile` | Column stats & data profiling |
| `GET` | `/api/datasets/:id/mapping` | Get saved field mapping |
| `POST` | `/api/datasets/:id/mapping` | Save field mapping |
| `POST` | `/api/datasets/:id/transformations` | Apply transformation pipeline *(planned)* |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server & DB health check |

---

## 🧩 Functional Modules

### 1. 📤 Dataset Upload
Upload CSV or JSON files with drag-and-drop support. Provide metadata (name, description, tags, delimiter). Files are streamed to Backblaze B2; metadata is stored in MongoDB.

### 2. 📋 Dataset Catalog
Browse all uploaded datasets. Each card shows: filename, format badge, file size, row/column count, upload date, and status. Click to open paginated preview.

### 3. 🔍 Dataset Preview
Paginated table view of raw dataset records. Sortable column headers, data-type badges, null-value counters, sticky header, horizontal scroll for wide datasets.

### 4. 🗺️ Field Mapping Studio
Three-panel visual interface:
- **Left panel** — Source columns (searchable, filterable, with type badges)
- **Center panel** — Active mappings with editable custom destination labels (`Age` → `customer_age`)
- **Right panel** — Removed (simplified; role assignment via dropdown on each card)

Supports drag-and-drop assignment, auto-suggest heuristics, and per-column role badges (Target, ID, Numerical, Categorical, Datetime, Ignored).

### 5. ⚙️ Transformation Studio
Per-column transformation pipeline builder:

| Transformation | Description |
|---------------|-------------|
| **Trim** | Remove leading/trailing whitespace |
| **Uppercase** | Convert string to UPPERCASE |
| **Lowercase** | Convert string to lowercase |
| **String → Number** | Parse numeric strings to float/integer |
| **Remove Empty Values** | Replace empty/null strings with `null` |
| **Find & Replace** | Replace all occurrences of a substring |

Multiple transformations can be chained per column. Inline live preview shows original vs. transformed sample values with change highlighting.

### 6. 📊 Dashboard & Analytics
Overview of platform metrics: total datasets, storage usage, recent activity. Analytics page shows performance and usage trends.

### 7. 🔐 Authentication
JWT-based register/login flow. Protected routes ensure only authenticated users access the dashboard. Tokens stored securely; auto-logout on expiry.

---

## 📅 Development Timeline

```
Day 01–05  │ Phase 1: Planning & Learning
           │ Requirement analysis · Architecture design · DB schema · Task split
           │
Day 06–18  │ Phase 2: Core Development
           │ Backend: APIs · Auth · MongoDB · B2 storage · ETL foundation
           │ Frontend: Dashboard · Upload · Preview · Mapping · Transformation UI
           │
Day 19–25  │ Phase 3: ETL & AI Integration
           │ Streaming/batch processing · Data validation · isolated-vm transforms
           │ Groq AI integration for mapping & transformation suggestions
           │
Day 26–30  │ Phase 4: Integration & Monitoring
           │ Frontend ↔ Backend integration · Socket.IO real-time job monitoring
           │ Job management · Error handling · Processing history
           │
Day 31–36  │ Phase 5: Testing & Optimization
           │ Functional · Integration · Performance · Security testing
           │ Bug fixes · Large-dataset processing optimization
           │
Day 37–40  │ Phase 6: Deployment & Documentation
           │ Production deployment · Final testing · Documentation
           │ Screenshots · Presentation · Final demo
```

---

## 👥 Team

| # | Name | Roll No. | Section |
|---|------|----------|---------|
| 1 | **Gaurav Mittal** | 2315000841 | 4A-30 |
| 2 | **Harshit Bhardwaj** | 2315000928 | 4A-32 |
| 3 | **Mahesh Goyal** | 2315001292 | 4B-40 |
| 4 | **Akshat Agarwal** | 2315000202 | 4C-06 
| 5 | **Abhishek Saraswat** | 2315000068 | 4D-03 |

**Project Supervisor:** Mr. Abdul Noman Ansari, Technical Trainer

---

## 🔭 Future Scope

| Enhancement | Description |
|-------------|-------------|
| 🤖 **Advanced AI Capabilities** | Enhance Groq AI integration for intelligent data cleaning, anomaly detection, and automated workflow generation |
| 📂 **More Data Sources** | Support Excel, XML, REST APIs, SQL databases, and enterprise data connectors |
| 📈 **Advanced Analytics** | Interactive dashboards, data visualization, predictive analytics, and automated reports |
| ☁️ **Scalable Cloud Processing** | Distributed processing to handle extremely large datasets and multiple concurrent ETL jobs |

---

## 📚 References

1. React Documentation — *React: A JavaScript Library for Building User Interfaces.* [react.dev](https://react.dev)
2. Node.js Documentation — *Node.js API Documentation.* [nodejs.org](https://nodejs.org/docs)
3. Express.js Documentation — *Express: Fast, Unopinionated, Minimalist Web Framework for Node.js.* [expressjs.com](https://expressjs.com)
4. MongoDB Documentation — *MongoDB Manual and Developer Documentation.* [mongodb.com/docs](https://mongodb.com/docs)
5. Backblaze Documentation — *B2 Cloud Storage and S3-Compatible API.* [backblaze.com/docs](https://www.backblaze.com/docs/cloud-storage)
6. npm Documentation — *Node.js Packages and Package Management.* [docs.npmjs.com](https://docs.npmjs.com)
7. GitHub Documentation — *GitHub Documentation.* [docs.github.com](https://docs.github.com)

---
