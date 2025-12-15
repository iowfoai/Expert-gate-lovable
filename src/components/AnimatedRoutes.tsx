import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import { DeletedAccountGuard } from "./DeletedAccountGuard";

import HomeRouter from "@/components/HomeRouter";
import Auth from "@/pages/Auth";
import FindExperts from "@/pages/FindExperts";
import ExpertDashboard from "@/pages/ExpertDashboard";
import ExpertHome from "@/pages/ExpertHome";
import ExpertsDirectory from "@/pages/ExpertsDirectory";
import ResearchersDirectory from "@/pages/ResearchersDirectory";
import Connections from "@/pages/Connections";
import About from "@/pages/About";
import Support from "@/pages/Support";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import PasswordReset from "@/pages/PasswordReset";
import Profile from "@/pages/Profile";
import AccountSettings from "@/pages/AccountSettings";
import InterviewHistory from "@/pages/InterviewHistory";
import Interviews from "@/pages/Interviews";
import AdminPanel from "@/pages/AdminPanel";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<DeletedAccountGuard><HomeRouter /></DeletedAccountGuard>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/password-reset" element={<PageTransition><PasswordReset /></PageTransition>} />
        <Route path="/find-experts" element={<DeletedAccountGuard><PageTransition><FindExperts /></PageTransition></DeletedAccountGuard>} />
        <Route path="/find-researchers" element={<DeletedAccountGuard><PageTransition><ResearchersDirectory /></PageTransition></DeletedAccountGuard>} />
        <Route path="/expert-dashboard" element={<DeletedAccountGuard><PageTransition><ExpertDashboard /></PageTransition></DeletedAccountGuard>} />
        <Route path="/expert-home" element={<DeletedAccountGuard><PageTransition><ExpertHome /></PageTransition></DeletedAccountGuard>} />
        <Route path="/experts-directory" element={<DeletedAccountGuard><PageTransition><ExpertsDirectory /></PageTransition></DeletedAccountGuard>} />
        <Route path="/researchers-directory" element={<DeletedAccountGuard><PageTransition><ResearchersDirectory /></PageTransition></DeletedAccountGuard>} />
        <Route path="/connections" element={<DeletedAccountGuard><PageTransition><Connections /></PageTransition></DeletedAccountGuard>} />
        <Route path="/profile" element={<DeletedAccountGuard><PageTransition><Profile /></PageTransition></DeletedAccountGuard>} />
        <Route path="/account-settings" element={<DeletedAccountGuard><PageTransition><AccountSettings /></PageTransition></DeletedAccountGuard>} />
        <Route path="/interview-history" element={<DeletedAccountGuard><PageTransition><InterviewHistory /></PageTransition></DeletedAccountGuard>} />
        <Route path="/interviews" element={<DeletedAccountGuard><PageTransition><Interviews /></PageTransition></DeletedAccountGuard>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/support" element={<DeletedAccountGuard allowSupport><PageTransition><Support /></PageTransition></DeletedAccountGuard>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/admin-panel" element={<PageTransition><AdminPanel /></PageTransition>} />
        
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;