import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FindExperts from "./pages/FindExperts";
import ExpertDashboard from "./pages/ExpertDashboard";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import PasswordReset from "./pages/PasswordReset";
import Profile from "./pages/Profile";
import AccountSettings from "./pages/AccountSettings";
import InterviewHistory from "./pages/InterviewHistory";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<PasswordReset />} />
        <Route path="/find-experts" element={<FindExperts />} />
        <Route path="/expert-dashboard" element={<ExpertDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/interview-history" element={<InterviewHistory />} />
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
