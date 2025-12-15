import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");

const passwordSchema = z.object({
  password: z.string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be less than 72 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const PasswordReset = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  
  // Check if we have a custom token from our edge function
  const customToken = searchParams.get('token');
  // Check if we have a Supabase access token (legacy support)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const supabaseToken = hashParams.get('access_token');
  
  const hasResetToken = customToken || supabaseToken;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationResult = emailSchema.safeParse(email);
    if (!validationResult.success) {
      toast({
        title: "Validation Error",
        description: validationResult.error.errors[0]?.message || "Invalid email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await supabase.functions.invoke('request-password-reset', {
        body: { 
          email: email.trim(),
          redirectUrl: window.location.origin
        }
      });

      if (response.error) throw response.error;

      setEmailSent(true);
      toast({
        title: "Check your email",
        description: "If an account exists with this email, you'll receive a password reset link.",
      });
    } catch (error: any) {
      console.error("Reset request error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationResult = passwordSchema.safeParse({
      password: newPassword,
      confirmPassword: confirmPassword,
    });

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || "Invalid input";
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (customToken) {
        // Use our custom edge function
        const response = await supabase.functions.invoke('reset-password', {
          body: { 
            token: customToken,
            newPassword: newPassword
          }
        });

        if (response.error) throw response.error;
        if (response.data?.error) throw new Error(response.data.error);

        toast({
          title: "Success",
          description: "Password updated successfully! You can now sign in with your new password.",
        });
        
        navigate("/auth?mode=signin");
      } else if (supabaseToken) {
        // Legacy Supabase token support
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Password updated successfully! You can now sign in with your new password.",
        });
        
        window.location.href = "/auth?mode=signin";
      }
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show email sent confirmation
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 text-xl font-semibold mb-8">
            <Network className="w-6 h-6 text-accent" />
            <span>ExpertGate</span>
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We've sent a password reset link to <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Try Again
              </Button>
              <div className="text-center">
                <Link to="/auth" className="text-sm text-accent hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show password reset form if we have a token
  if (hasResetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 text-xl font-semibold mb-8">
            <Network className="w-6 h-6 text-accent" />
            <span>ExpertGate</span>
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password *</Label>
                  <Input 
                    id="new-password" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password *</Label>
                  <Input 
                    id="confirm-password" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
                
                <div className="text-center">
                  <Link to="/auth" className="text-sm text-accent hover:underline">
                    Back to Sign In
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show email input form (request reset)
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 text-xl font-semibold mb-8">
          <Network className="w-6 h-6 text-accent" />
          <span>ExpertGate</span>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              
              <div className="text-center">
                <Link to="/auth" className="text-sm text-accent hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasswordReset;