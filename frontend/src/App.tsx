import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProductionPage } from './pages/ProductionPage';
import { HistoryPage } from './pages/HistoryPage';
import { GuidePage } from './pages/GuidePage';

import { DashboardPage } from './pages/DashboardPage';
import { CustomerDirectoryPage } from './pages/CustomerDirectoryPage';
import { PurchasePage } from './pages/PurchasePage';
import { SalesPage } from './pages/SalesPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { userEmail } = useAuth();
  if (!userEmail) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RootRedirect: React.FC = () => {
  const { userEmail } = useAuth();
  return <Navigate to={userEmail ? '/' : '/login'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/production"
                element={
                  <ProtectedRoute>
                    <ProductionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/purchase"
                element={
                  <ProtectedRoute>
                    <PurchasePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sales"
                element={
                  <ProtectedRoute>
                    <SalesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sell"
                element={
                  <ProtectedRoute>
                    <SalesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={<Navigate to="/history" replace />}
              />
              <Route
                path="/ledger"
                element={<Navigate to="/history" replace />}
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <CustomerDirectoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guide"
                element={
                  <ProtectedRoute>
                    <GuidePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
