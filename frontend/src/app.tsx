import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/Login";
import PipelineApp from "./PipelineApp";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Protected route component - only for pipeline
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Login page - accessible to everyone */}
      <Route path="/login" element={<Login />} />
      
      {/* Home page - accessible to everyone (shows different content based on auth) */}
      <Route path="/" element={<Home />} />
      
      {/* Pipeline - protected route */}
      <Route path="/pipeline" element={<ProtectedRoute element={<PipelineApp />} />} />
      
      {/* Redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
