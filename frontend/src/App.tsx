import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import MainLayout from './components/layout/MainLayout';

function AppContent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainLayout /> : <AuthPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}