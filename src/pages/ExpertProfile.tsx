import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Building2, 
  GraduationCap, 
  MapPin, 
  Star, 
  Globe, 
  Calendar,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { getEducationLabelFull } from "@/lib/formatters";

interface ExpertData {
  id: string;
  full_name: string;
  bio: string | null;
  institution: string | null;
  field_of_expertise: string[] | null;
  education_level: string | null;
  years_of_experience: number | null;
  profile_image_url: string | null;
  country: string | null;
  is_available: boolean | null;
  verification_status: string | null;
  preferred_languages: string[] | null;
  professional_website: string | null;
  publications: string | null;
}

const ExpertProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expert, setExpert] = useState<ExpertData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpert = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, institution, field_of_expertise, education_level, years_of_experience, profile_image_url, country, is_available, verification_status, preferred_languages, professional_website, publications')
        .eq('id', id)
        .eq('user_type', 'expert')
        .eq('verification_status', 'verified')
        .maybeSingle();

      if (error) {
        console.error('Error fetching expert:', error);
      }

      setExpert(data);
      setLoading(false);
    };

    fetchExpert();
  }, [id]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // getEducationLabelFull is now imported from @/lib/formatters

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">Expert Not Found</h2>
            <p className="text-muted-foreground">
              This expert profile doesn't exist or is not available.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={expert.profile_image_url || undefined} />
                  <AvatarFallback className="bg-accent/10 text-accent text-2xl font-semibold">
                    {getInitials(expert.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{expert.full_name}</h1>
                  
                  <div className="flex flex-wrap gap-4 text-muted-foreground mb-4">
                    {expert.education_level && (
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        <span>{getEducationLabelFull(expert.education_level)}</span>
                      </div>
                    )}
                    {expert.institution && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{expert.institution}</span>
                      </div>
                    )}
                    {expert.country && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{expert.country}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {expert.is_available ? (
                        <span className="text-green-600">Available for interviews</span>
                      ) : (
                        <span className="text-muted-foreground">Limited availability</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="md:col-span-2 space-y-6">
              {/* Bio */}
              {expert.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{expert.bio}</p>
                  </CardContent>
                </Card>
              )}

              {/* Expertise */}
              {expert.field_of_expertise && expert.field_of_expertise.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Areas of Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {expert.field_of_expertise.map((field) => (
                        <Badge key={field} variant="secondary" className="text-sm">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Publications */}
              {expert.publications && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Publications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{expert.publications}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Experience */}
              {expert.years_of_experience && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Star className="w-8 h-8 text-accent" />
                      <div>
                        <p className="text-2xl font-bold">{expert.years_of_experience}</p>
                        <p className="text-sm text-muted-foreground">Years of Experience</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Languages */}
              {expert.preferred_languages && expert.preferred_languages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {expert.preferred_languages.map((lang) => (
                        <Badge key={lang} variant="outline">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Website */}
              {expert.professional_website && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Professional Website</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a 
                      href={expert.professional_website.startsWith('http') ? expert.professional_website : `https://${expert.professional_website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-accent hover:underline break-all"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      <span>{expert.professional_website}</span>
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ExpertProfile;
