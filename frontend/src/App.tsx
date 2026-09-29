import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QxLabsLandingPage } from './pages/QxLabsLandingPage';
import { QxLabsAuthPage } from './pages/QxLabsAuthPage';
import { QxLabsLayout } from './components/QxLabsLayout';
import GatesPlaygroundPage from './modules/gates-playground/pages/GatesPlaygroundPage';
import QRoutePage from './modules/qroute/pages/QRoutePage';
import QRouteJobDetailPage from './modules/qroute/pages/QRouteJobDetailPage';
import { BlochSphereVisualizer } from './components/bloch/BlochSphereVisualizer';
import QuantumLibrary from './pages/QuantumLibrary';
import { QxLabsPuzzlesPage } from './pages/QxLabsPuzzlesPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// Protected Route Wrapper for QxLabs tools
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider">LOADING QXLABS...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  React.useEffect(() => {
    document.title = 'QxLabs';
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Router>
              <Routes>
                {/* 1. Landing Page */}
                <Route path="/" element={<QxLabsLandingPage />} />

                {/* 2. Authentication (Native encrypted password auth) */}
                <Route path="/login" element={<QxLabsAuthPage />} />
                <Route path="/signup" element={<QxLabsAuthPage />} />

                {/* 3. The 3 Core Quantum Engines */}
                {/* Engine 1: Quantum Playground */}
                <Route
                  path="/playground"
                  element={
                    <ProtectedRoute>
                      <QxLabsLayout>
                        <GatesPlaygroundPage />
                      </QxLabsLayout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/playground/gates" element={<Navigate to="/playground" replace />} />

                {/* Engine 2: QRoute Multi-Provider Hardware */}
                <Route
                  path="/qroute"
                  element={
                    <ProtectedRoute>
                      <QxLabsLayout>
                        <QRoutePage />
                      </QxLabsLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/qroute/jobs/:jobId"
                  element={
                    <ProtectedRoute>
                      <QxLabsLayout>
                        <QRouteJobDetailPage />
                      </QxLabsLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Engine 3: Bloch Sphere (Tasks) */}
                <Route
                  path="/bloch"
                  element={
                    <ProtectedRoute>
                      <QxLabsLayout>
                        <BlochSphereVisualizer />
                      </QxLabsLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Quantum Gate Library */}
                <Route
                  path="/quantum-library"
                  element={
                    <ProtectedRoute>
                      <QxLabsLayout>
                        <QuantumLibrary />
                      </QxLabsLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Gate Puzzles */}
                <Route
                  path="/puzzles"
                  element={
                    <ProtectedRoute>
                      <QxLabsLayout>
                        <QxLabsPuzzlesPage />
                      </QxLabsLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Fallback to landing */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
            <Toaster position="bottom-right" richColors />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
