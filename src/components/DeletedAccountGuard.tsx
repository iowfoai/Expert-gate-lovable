import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MessageSquare, LogOut } from "lucide-react";

interface DeletedAccountGuardProps {
  children: React.ReactNode;
  allowSupport?: boolean;
}

export const DeletedAccountGuard = ({ children, allowSupport = false }: DeletedAccountGuardProps) => {
  const [isDeleted, setIsDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccountStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_deleted")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.is_deleted) {
        setIsDeleted(true);
      }
      setLoading(false);
    };

    checkAccountStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAccountStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return null;
  }

  if (isDeleted && !allowSupport) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Your Account Has Been Deleted by an Admin</CardTitle>
            <CardDescription className="text-base mt-2">
              If you believe this was a mistake, create a support ticket.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full" 
              onClick={() => navigate("/support")}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Support
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};