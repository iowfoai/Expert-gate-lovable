import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import AnimatedRoutes from "./components/AnimatedRoutes";
import FeedbackButton from "./components/FeedbackButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <FeedbackButton />
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
