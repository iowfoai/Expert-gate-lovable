import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "signin";
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [userType, setUserType] = useState<"researcher" | "expert">("researcher");
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  
  // Expert-specific fields
  const [educationLevel, setEducationLevel] = useState("");
  const [institution, setInstitution] = useState("");
  const [fieldOfExpertise, setFieldOfExpertise] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [bio, setBio] = useState("");
  const [publications, setPublications] = useState("");
  const [professionalWebsite, setProfessionalWebsite] = useState("");
  const [country, setCountry] = useState("");
  
  // Researcher-specific fields
  const [researchInstitution, setResearchInstitution] = useState("");
  const [researchField, setResearchField] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Signed in successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Validation for experts
    if (userType === "expert") {
      if (!educationLevel || !institution || !fieldOfExpertise || !yearsOfExperience) {
        toast({
          title: "Error",
          description: "Please fill in all required expert fields",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            user_type: userType,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional information
        const profileData: any = {
          id: data.user.id,
          email: email,
          full_name: fullName,
          user_type: userType,
          country: country || null,
          bio: bio || null,
        };

        if (userType === "expert") {
          profileData.education_level = educationLevel;
          profileData.institution = institution;
          profileData.field_of_expertise = fieldOfExpertise.split(',').map(f => f.trim());
          profileData.years_of_experience = parseInt(yearsOfExperience);
          profileData.publications = publications || null;
          profileData.professional_website = professionalWebsite || null;
        } else {
          profileData.research_institution = researchInstitution || null;
          profileData.research_field = researchField ? researchField.split(',').map(f => f.trim()) : null;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      toast({
        title: "Success",
        description: userType === "expert" 
          ? "Account created! Your expert profile is pending verification."
          : "Account created successfully!",
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl">
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
          
          <CardContent>
            <form onSubmit={mode === "signup" ? handleSignUp : handleSignIn} className="space-y-4">
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
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password *</Label>
                    <Input 
                      id="confirm-password" 
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input 
                      id="country" 
                      type="text" 
                      placeholder="United States"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  
                  {userType === "expert" && (
                    <>
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-4">Expert Verification Information</h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="education">Education Level *</Label>
                            <Select value={educationLevel} onValueChange={setEducationLevel}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select education level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                                <SelectItem value="masters">Master's Degree</SelectItem>
                                <SelectItem value="phd">PhD</SelectItem>
                                <SelectItem value="postdoc">Postdoctoral</SelectItem>
                                <SelectItem value="professor">Professor</SelectItem>
                                <SelectItem value="industry_professional">Industry Professional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="institution">Institution/Organization *</Label>
                            <Input 
                              id="institution" 
                              type="text" 
                              placeholder="MIT, Stanford, etc."
                              value={institution}
                              onChange={(e) => setInstitution(e.target.value)}
                              required={userType === "expert"}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expertise">Field of Expertise * (comma-separated)</Label>
                            <Input 
                              id="expertise" 
                              type="text" 
                              placeholder="Climate Science, Environmental Policy"
                              value={fieldOfExpertise}
                              onChange={(e) => setFieldOfExpertise(e.target.value)}
                              required={userType === "expert"}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="experience">Years of Experience *</Label>
                            <Input 
                              id="experience" 
                              type="number" 
                              placeholder="10"
                              value={yearsOfExperience}
                              onChange={(e) => setYearsOfExperience(e.target.value)}
                              required={userType === "expert"}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="bio">Professional Bio</Label>
                            <Textarea 
                              id="bio" 
                              placeholder="Brief description of your expertise and background"
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="publications">Publications/Credentials</Label>
                            <Textarea 
                              id="publications" 
                              placeholder="List your key publications, certifications, or credentials"
                              value={publications}
                              onChange={(e) => setPublications(e.target.value)}
                              rows={3}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="website">Professional Website/LinkedIn</Label>
                            <Input 
                              id="website" 
                              type="url" 
                              placeholder="https://yourwebsite.com"
                              value={professionalWebsite}
                              onChange={(e) => setProfessionalWebsite(e.target.value)}
                            />
                          </div>
                          
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">
                              <strong>Note:</strong> After registration, you'll be able to upload proof of education 
                              (degree certificates, institutional verification) from your dashboard. Your expert profile 
                              will be verified within 3-5 business days.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {userType === "researcher" && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Researcher Information</h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="research-institution">Research Institution (optional)</Label>
                          <Input 
                            id="research-institution" 
                            type="text" 
                            placeholder="University or Organization"
                            value={researchInstitution}
                            onChange={(e) => setResearchInstitution(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="research-field">Research Field (comma-separated, optional)</Label>
                          <Input 
                            id="research-field" 
                            type="text" 
                            placeholder="Climate Science, Public Health"
                            value={researchField}
                            onChange={(e) => setResearchField(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="researcher-bio">Bio (optional)</Label>
                          <Textarea 
                            id="researcher-bio" 
                            placeholder="Brief description of your research interests"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : mode === "signup" ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
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
