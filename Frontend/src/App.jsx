import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public & Auth Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Dashboard & Dataset Pages
import Dashboard from './pages/Dashboard';
import DatasetsList from './pages/DatasetsList';
import DatasetUpload from './pages/DatasetUpload';
import DatasetDetails from './pages/DatasetDetails';
import FieldMapping from './pages/FieldMapping';
import TransformationConfig from './pages/TransformationConfig';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/SettingsPage';

// Protected Route Guard
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Website Routes */}
          <Route
            path="/"
            element={
              <MainLayout>
                <Home />
              </MainLayout>
            }
          />

          {/* Authentication Routes */}
          <Route
            path="/login"
            element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout>
                <Register />
              </AuthLayout>
            }
          />

          {/* Protected Application & Dashboard Routes with Sidebar Navigation */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="datasets" element={<DatasetsList />} />
            <Route path="datasets/upload" element={<DatasetUpload />} />
            <Route path="datasets/:id" element={<DatasetDetails />} />
            <Route path="datasets/:id/profile" element={<DatasetDetails />} />
            <Route path="datasets/mapping" element={<FieldMapping />} />
            <Route path="datasets/:id/mapping" element={<FieldMapping />} />
            <Route path="datasets/transform" element={<TransformationConfig />} />
            <Route path="datasets/:id/transform" element={<TransformationConfig />} />
            <Route path="pipelines" element={<Navigate to="/dashboard/datasets" replace />} />
            <Route path="features" element={<Navigate to="/dashboard/datasets" replace />} />
            <Route path="models" element={<Navigate to="/dashboard/datasets" replace />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Legacy route redirects */}
          <Route path="/datasets" element={<Navigate to="/dashboard/datasets" replace />} />
          <Route
            path="/datasets/upload"
            element={<Navigate to="/dashboard/datasets/upload" replace />}
          />
          <Route path="/datasets/mapping" element={<Navigate to="/dashboard/datasets/mapping" replace />} />
          <Route path="/datasets/:id/mapping" element={<Navigate to="/dashboard/datasets/mapping" replace />} />
          <Route path="/mapping" element={<Navigate to="/dashboard/datasets/mapping" replace />} />
          <Route path="/field-mapping" element={<Navigate to="/dashboard/datasets/mapping" replace />} />

          {/* Catch-all 404 Route */}
          <Route
            path="*"
            element={
              <MainLayout>
                <NotFound />
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
