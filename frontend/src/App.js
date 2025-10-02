import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import NovoProduto from './pages/NovoProduto';
import EditarProduto from './pages/EditarProduto';
import Vendas from './pages/Vendas';
import NovaVenda from './pages/NovaVenda';
import DetalhesVenda from './pages/DetalhesVenda';
import EditarVenda from './pages/EditarVenda';
import Compras from './pages/Compras';
import NovaCompra from './pages/NovaCompra';
import ContasPagar from './pages/ContasPagar';
import NovaContaPagar from './pages/NovaContaPagar';
import EditarContaPagar from './pages/EditarContaPagar';
import ContasReceber from './pages/ContasReceber';
import NovaContaReceber from './pages/NovaContaReceber';
import EditarContaReceber from './pages/EditarContaReceber';
import Alertas from './pages/Alertas';
import Perfil from './pages/Perfil';
import Admin from './pages/Admin';

// Componentes
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para rotas públicas (quando já logado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App min-h-screen bg-gray-50 dark:bg-gray-900">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
            
            <Routes>
              {/* Rotas públicas */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />

              {/* Rotas protegidas */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/produtos" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Produtos />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
                  <Route
                    path="/produtos/novo"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <NovoProduto />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/produtos/editar/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <EditarProduto />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
              <Route 
                path="/vendas" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Vendas />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendas/nova" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <NovaVenda />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendas/:id" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DetalhesVenda />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/vendas/editar/:id" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EditarVenda />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/compras" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Compras />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/compras/nova" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <NovaCompra />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contas-pagar" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ContasPagar />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contas-pagar/nova" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <NovaContaPagar />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contas-pagar/editar/:id" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EditarContaPagar />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contas-receber" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ContasReceber />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contas-receber/nova" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <NovaContaReceber />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/contas-receber/editar/:id" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EditarContaReceber />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/alertas" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Alertas />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/perfil" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Perfil />
                    </Layout>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Admin />
                    </Layout>
                  </ProtectedRoute>
                } 
              />

              {/* Rota padrão */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

