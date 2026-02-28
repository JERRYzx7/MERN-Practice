import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/stores/authStore";
import Layout from "@/components/layout/Layout";

// Pages
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import GroupsPage from "@/pages/GroupsPage";
import GroupDetailPage from "@/pages/GroupDetailPage";
import AddExpensePage from "@/pages/AddExpensePage";
import BalancePage from "@/pages/BalancePage";
import ProfilePage from "@/pages/ProfilePage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((s) => s.userId);
  return userId ? <>{children}</> : <Navigate to="/login" replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const userId = useAuthStore((s) => s.userId);
  return !userId ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Guest Routes */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage />
              </GuestRoute>
            }
          />

          {/* Private Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="groups/:groupId" element={<GroupDetailPage />} />
            <Route path="groups/:groupId/expense/new" element={<AddExpensePage />} />
            <Route path="groups/:groupId/balance" element={<BalancePage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
