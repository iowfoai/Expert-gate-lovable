import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { countries } from "@/lib/countries";
import InstitutionCombobox from "@/components/InstitutionCombobox";
import LanguageMultiSelect from "@/components/LanguageMultiSelect";
import { Badge } from "@/components/ui/badge";

const EDUCATION_LEVELS = [
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "masters", label: "Master's Degree" },
  { value: "phd", label: "PhD" },
  { value: "postdoc", label: "Postdoctoral" },
];

const OCCUPATION_OPTIONS = [
  { value: "professor", label: "Professor" },
  { value: "industry_professional", label: "Industry Professional" },
  { value: "other", label: "Other" },
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "signin";
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [userType, setUserType] = useState<"researcher" | "expert">("researcher");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Expert-specific fields
  const [educationLevels, setEducationLevels] = useState<string[]>([]);
  const [occupations, setOccupations] = useState<string[]>([]);
  const [customOccupation, setCustomOccupation] = useState("");
  const [institution, setInstitution] = useState("");
  const [organization, setOrganization] = useState("");
  const [fieldOfExpertise, setFieldOfExpertise] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [bio, setBio] = useState("");
  const [publications, setPublications] = useState("");
  const [professionalWebsite, setProfessionalWebsite] = useState("");
  const [country, setCountry] = useState("");
  const [specificExperience, setSpecificExperience] = useState("");

  // Researcher-specific fields
  const [researchInstitution, setResearchInstitution] = useState("");
  const [researchField, setResearchField] = useState("");

  // Common field for both types
  const [preferredLanguages, setPreferredLanguages] = useState<string[]>(["English"]);

  // Check if user is already logged in and redirect based on user type
  useEffect(() => {
    const redirectUser = async (userId: string) => {
      const {
        data: profile
      } = await supabase.from('profiles').select('user_type').eq('id', userId).maybeSingle();
      if (profile?.user_type === 'expert') {
        navigate('/expert-home');
      } else {
        navigate('/');
      }
    };
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session) {
        redirectUser(session.user.id);
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        redirectUser(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Signed in successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPassword = () => {
    navigate("/password-reset");
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    // Validation for experts
    if (userType === "expert") {
      if (educationLevels.length === 0 || !institution || !fieldOfExpertise || !yearsOfExperience) {
        toast({
          title: "Error",
          description: "Please fill in all required expert fields",
          variant: "destructive"
        });
        return;
      }
      if (!specificExperience || specificExperience.length < 20) {
        toast({
          title: "Error",
          description: "Please describe your specific experience (minimum 20 characters)",
          variant: "destructive"
        });
        return;
      }
    }
    setLoading(true);
    try {
      // Build metadata with all user info - the trigger will use this to create the profile
      const metadata: any = {
        full_name: fullName,
        user_type: userType,
        country: country || null,
        bio: bio || null,
        preferred_languages: preferredLanguages.length > 0 ? preferredLanguages : ['English']
      };
      if (userType === "expert") {
        metadata.education_level = educationLevels[0]; // Store first as primary for DB compatibility
        metadata.institution = institution;
        metadata.field_of_expertise = fieldOfExpertise.split(',').map(f => f.trim());
        metadata.years_of_experience = parseInt(yearsOfExperience);
        metadata.publications = publications || null;
        metadata.professional_website = professionalWebsite || null;
        metadata.specific_experience = specificExperience;
        metadata.occupation = occupations.length > 0 ? occupations : null;
      } else {
        metadata.research_institution = researchInstitution || null;
        metadata.research_field = researchField ? researchField.split(',').map(f => f.trim()) : null;
      }
      const {
        data,
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: metadata
        }
      });
      if (error) throw error;

      // Send notification email to admin for expert signups
      if (userType === "expert" && data.user) {
        await supabase.functions.invoke("send-expert-signup-notification", {
          body: {
            expertId: data.user.id
          }
        });
      }
      toast({
        title: "Success",
        description: userType === "expert" ? "Account created! Your expert profile is pending verification." : "Account created successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl">
        <Link to="/" className="flex items-center justify-center gap-2 text-xl font-semibold mb-8">
          <Network className="w-6 h-6 text-accent" />
          <span>ExpertGate</span>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>{mode === "signup" ? "Create Account" : "Welcome Back"}</CardTitle>
            <CardDescription>
              {mode === "signup" ? "Join ExpertGate to connect with experts or share your expertise" : "Sign in to your ExpertGate account"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={mode === "signup" ? handleSignUp : handleSignIn} className="space-y-4">
              {mode === "signup" && <div className="space-y-2">
                  <Label>I am a...</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant={userType === "researcher" ? "default" : "outline"} onClick={() => setUserType("researcher")}>
                      Researcher
                    </Button>
                    <Button type="button" variant={userType === "expert" ? "default" : "outline"} onClick={() => setUserType("expert")}>
                      Expert
                    </Button>
                  </div>
                </div>}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              
              {mode === "signup" && <>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password *</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" type="text" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {countries.map(c => <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preferred Languages - shown for both user types */}
                  <div className="space-y-2">
                    <Label>Preferred Languages *</Label>
                    <LanguageMultiSelect
                      value={preferredLanguages}
                      onChange={setPreferredLanguages}
                      placeholder="Select your preferred languages..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Select the languages you're comfortable communicating in
                    </p>
                  </div>
                  
                  {userType === "expert" && <>
                      <div className="border-t pt-4">
                        <h3 className="font-semibold mb-4">Expert Verification Information</h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="education">Maximum Education Level *</Label>
                            {educationLevels.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {educationLevels.map((level) => (
                                  <Badge key={level} variant="secondary" className="flex items-center gap-1">
                                    {EDUCATION_LEVELS.find(l => l.value === level)?.label || level}
                                    <X
                                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                                      onClick={() => setEducationLevels(educationLevels.filter(l => l !== level))}
                                    />
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <Select 
                              value="" 
                              onValueChange={(value) => {
                                if (!educationLevels.includes(value)) {
                                  setEducationLevels([...educationLevels, value]);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Add education level..." />
                              </SelectTrigger>
                              <SelectContent>
                                {EDUCATION_LEVELS.filter(l => !educationLevels.includes(l.value)).map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Select one or more education levels
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="occupation">Occupation *</Label>
                            {occupations.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {occupations.map((occ) => (
                                  <Badge key={occ} variant="secondary" className="flex items-center gap-1">
                                    {OCCUPATION_OPTIONS.find(o => o.value === occ)?.label || occ}
                                    <X
                                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                                      onClick={() => setOccupations(occupations.filter(o => o !== occ))}
                                    />
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <Select 
                              value="" 
                              onValueChange={(value) => {
                                if (value === "other") {
                                  // Show custom input instead
                                  return;
                                }
                                if (!occupations.includes(value)) {
                                  setOccupations([...occupations, value]);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Add occupation..." />
                              </SelectTrigger>
                              <SelectContent>
                                {OCCUPATION_OPTIONS.filter(o => o.value !== "other" && !occupations.includes(o.value)).map((occ) => (
                                  <SelectItem key={occ.value} value={occ.value}>
                                    {occ.label}
                                  </SelectItem>
                                ))}
                                <SelectItem value="other">Other (custom)</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Enter custom occupation..."
                                value={customOccupation}
                                onChange={(e) => setCustomOccupation(e.target.value)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (customOccupation.trim() && !occupations.includes(customOccupation.trim())) {
                                    setOccupations([...occupations, customOccupation.trim()]);
                                    setCustomOccupation("");
                                  }
                                }}
                              >
                                Add
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Select from options or add a custom occupation
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="institution">Institution *</Label>
                            <InstitutionCombobox
                              value={institution}
                              onChange={setInstitution}
                              placeholder="Search institution..."
                            />
                            <p className="text-xs text-muted-foreground">
                              Search for your institution or type your own if not listed.
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="organization">Organization (optional)</Label>
                            <Input
                              id="organization"
                              type="text"
                              placeholder="Department, lab, or company name"
                              value={organization}
                              onChange={e => setOrganization(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="expertise">Field of Expertise * (comma-separated)</Label>
                            <Input id="expertise" type="text" placeholder="Climate Science, Environmental Policy" value={fieldOfExpertise} onChange={e => setFieldOfExpertise(e.target.value)} required={userType === "expert"} />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="experience">Years of Experience *</Label>
                            <Input id="experience" type="number" placeholder="10" value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value)} required={userType === "expert"} />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="bio">Professional Bio</Label>
                            <Textarea id="bio" placeholder="Brief description of your expertise and background" value={bio} onChange={e => setBio(e.target.value)} rows={3} />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="publications">Publications/Credentials</Label>
                            <Textarea id="publications" placeholder="List your key publications, certifications, or credentials" value={publications} onChange={e => setPublications(e.target.value)} rows={3} />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="specific-experience">Specific Experience * (minimum 20 characters)</Label>
                            <Textarea id="specific-experience" placeholder="Describe your specific expertise and experience in detail..." value={specificExperience} onChange={e => setSpecificExperience(e.target.value)} rows={4} required={userType === "expert"} />
                            <p className="text-xs text-muted-foreground">
                              {specificExperience.length}/20 characters minimum
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="website">Professional Website/LinkedIn</Label>
                            <Input id="website" type="url" placeholder="https://yourwebsite.com" value={professionalWebsite} onChange={e => setProfessionalWebsite(e.target.value)} />
                          </div>
                          
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <strong>Note:</strong> After registration, you will undergo a verification system, where an admin must verify you before you can use the expert features, however you may still browse the website. Your expert profile will be verified within the day.
                            </p>
                          </div>
                        </div>
                      </div>
                    </>}
                  
                  {userType === "researcher" && <div className="border-t pt-4">
                      <h3 className="font-semibold mb-4">Researcher Information</h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="research-institution">Research Institution (optional)</Label>
                          <InstitutionCombobox
                            value={researchInstitution}
                            onChange={setResearchInstitution}
                            placeholder="Search institution..."
                          />
                          <p className="text-xs text-muted-foreground">
                            Search for your institution or type your own if not listed.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="research-field">Research Field (comma-separated, optional)</Label>
                          <Input id="research-field" type="text" placeholder="Climate Science, Public Health" value={researchField} onChange={e => setResearchField(e.target.value)} />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="researcher-bio">Bio (optional)</Label>
                          <Textarea id="researcher-bio" placeholder="Brief description of your research interests" value={bio} onChange={e => setBio(e.target.value)} rows={3} />
                        </div>
                      </div>
                    </div>}
                </>}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : mode === "signup" ? "Create Account" : "Sign In"}
              </Button>
              
              {mode === "signin" && <div className="text-center">
                  <button type="button" onClick={handleForgotPassword} className="text-sm text-accent hover:underline">
                    Forgot password?
                  </button>
                </div>}
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <div className="text-sm text-center text-muted-foreground">
              {mode === "signup" ? <>
                  Already have an account?{" "}
                  <Link to="/auth" className="text-accent hover:underline">
                    Sign in
                  </Link>
                </> : <>
                  Don't have an account?{" "}
                  <Link to="/auth?mode=signup" className="text-accent hover:underline">
                    Sign up
                  </Link>
                </>}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>;
};
export default Auth;