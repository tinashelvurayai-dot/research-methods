import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { InstallPromptModal } from "@/components/InstallPromptModal";
import Index from "@/pages/Index";
import SignIn from "@/pages/SignIn";
import RequestAccess from "@/pages/RequestAccess";
import Dashboard from "@/pages/Dashboard";
import TopicView from "@/pages/TopicView";
import Profile from "@/pages/Profile";
import Support from "@/pages/Support";
import AdminSetup from "@/pages/AdminSetup";
import AdminLogin from "@/pages/AdminLogin";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/NotFound";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/signin" replace />;
  return <>{children}</>;
}

function AdminProtected({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <InstallPromptModal />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/request-access" element={<RequestAccess />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/dashboard/topic/:slug" element={<Protected><TopicView /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/support" element={<Protected><Support /></Protected>} />
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminProtected><AdminPanel /></AdminProtected>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}