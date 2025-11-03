import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Topics from "./pages/Topics";
import SubTopics from "./pages/SubTopics";
import Problems from "./pages/Problems";
import TestCases from "./pages/TestCases";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import StudentSubmissions from "./pages/StudentSubmissions";
import Classes from "./pages/Classes";
import ClassDetail from "./pages/ClassDetail";
import Contests from "./pages/Contests";
import ContestDetail from "./pages/ContestDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/topics" element={<Topics />} />
                <Route path="/sub-topics" element={<SubTopics />} />
                <Route path="/problems" element={<Problems />} />
                <Route path="/test-cases" element={<TestCases />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:id/submissions" element={<StudentSubmissions />} />
                <Route path="/users/:id" element={<UserDetail />} />
                <Route path="/classes" element={<Classes />} />
                <Route path="/classes/:id" element={<ClassDetail />} />
                <Route path="/contests" element={<Contests />} />
                <Route path="/contests/:id" element={<ContestDetail />} />
              </Route>
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
