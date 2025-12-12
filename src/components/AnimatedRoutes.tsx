import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";

import HomeRouter from "@/components/HomeRouter";
import Auth from "@/pages/Auth";
import FindExperts from "@/pages/FindExperts";
import ExpertDashboard from "@/pages/ExpertDashboard";
import ExpertHome from "@/pages/ExpertHome";
import ExpertsDirectory from "@/pages/ExpertsDirectory";
import Connections from "@/pages/Connections";
import About from "@/pages/About";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import PasswordReset from "@/pages/PasswordReset";
import Profile from "@/pages/Profile";
import AccountSettings from "@/pages/AccountSettings";
import InterviewHistory from "@/pages/InterviewHistory";


const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomeRouter />} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><PasswordReset /></PageTransition>} />
        <Route path="/find-experts" element={<PageTransition><FindExperts /></PageTransition>} />
        <Route path="/expert-dashboard" element={<PageTransition><ExpertDashboard /></PageTransition>} />
        <Route path="/expert-home" element={<PageTransition><ExpertHome /></PageTransition>} />
        <Route path="/experts-directory" element={<PageTransition><ExpertsDirectory /></PageTransition>} />
        <Route path="/connections" element={<PageTransition><Connections /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/account-settings" element={<PageTransition><AccountSettings /></PageTransition>} />
        <Route path="/interview-history" element={<PageTransition><InterviewHistory /></PageTransition>} />
        <Route path="/about" element={<PageTransition><About /></PageTransition>} />
        <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
        
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
