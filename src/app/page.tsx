
import Dashboard from '@/components/dashboard';
import ProtectedRoute from '@/components/protected-route';
import { Suspense } from 'react';
import LoadingScreen from '@/components/loading-screen';

export default function Home() {
  return (
    <ProtectedRoute>
       <Suspense fallback={<LoadingScreen />}>
        <Dashboard />
      </Suspense>
    </ProtectedRoute>
  );
}
