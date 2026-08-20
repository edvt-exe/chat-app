import { useAuth, AuthProvider } from './contexts/AuthContext.tsx';
import AuthPage from './components/auth/AuthPage';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <AuthPage />;

  return (
    <div className="min-h-screen bg-bg-primary text-white flex items-center justify-center">
      <p className="text-gray-400">Chat coming soon...</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}