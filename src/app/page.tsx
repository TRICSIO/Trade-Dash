import Dashboard from '@/components/dashboard';
import ProtectedRoute from '@/components/protected-route';
import { Suspense } from 'react';

export default function Home() {
  return (
    <ProtectedRoute>
       <Suspense>
        <Dashboard />
      </Suspense>
    </ProtectedRoute>
  );
}
