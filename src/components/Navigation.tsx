import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Network } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-semibold">
          <Network className="w-6 h-6 text-accent" />
          <span>ExpertGate</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-6">
          <Link to="/find-experts" className="text-sm font-medium hover:text-accent transition-colors">
            Find Experts
          </Link>
          <Link to="/how-it-works" className="text-sm font-medium hover:text-accent transition-colors">
            How It Works
          </Link>
          <Link to="/about" className="text-sm font-medium hover:text-accent transition-colors">
            About
          </Link>
          <Link to="/faq" className="text-sm font-medium hover:text-accent transition-colors">
            FAQ
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/auth?mode=signup">
            <Button size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
