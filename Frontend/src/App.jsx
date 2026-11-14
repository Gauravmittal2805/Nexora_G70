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
import Pipelines from './pages/Pipelines';

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
            <Route path="pipelines" element={<Pipelines />} />
            <Route path="features" element={<Pipelines />} />
            <Route path="models" element={<Pipelines />} />
            <Route path="analytics" element={<Pipelines />} />
            <Route path="settings" element={<Pipelines />} />
          </Route>

          {/* Legacy route redirects */}
          <Route path="/datasets" element={<Navigate to="/dashboard/datasets" replace />} />
          <Route
            path="/datasets/upload"
            element={<Navigate to="/dashboard/datasets/upload" replace />}
          />

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
