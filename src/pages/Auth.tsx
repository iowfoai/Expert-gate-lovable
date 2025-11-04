import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "signin";
  const [userType, setUserType] = useState<"researcher" | "expert">("researcher");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 text-xl font-semibold mb-8">
          <Network className="w-6 h-6 text-accent" />
          <span>ExpertGate</span>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>{mode === "signup" ? "Create Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {mode === "signup" 
                ? "Join ExpertGate to connect with experts or share your expertise" 
                : "Sign in to your ExpertGate account"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label>I am a...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={userType === "researcher" ? "default" : "outline"}
                    onClick={() => setUserType("researcher")}
                  >
                    Researcher
                  </Button>
                  <Button
                    type="button"
                    variant={userType === "expert" ? "default" : "outline"}
                    onClick={() => setUserType("expert")}
                  >
                    Expert
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
            
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" type="text" placeholder="John Doe" />
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full">
              {mode === "signup" ? "Create Account" : "Sign In"}
            </Button>
            
            <div className="text-sm text-center text-muted-foreground">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <Link to="/auth" className="text-accent hover:underline">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <Link to="/auth?mode=signup" className="text-accent hover:underline">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
