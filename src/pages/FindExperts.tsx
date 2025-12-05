import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RequestInterviewDialog from "@/components/RequestInterviewDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, MapPin, Calendar, Users } from "lucide-react";
import { useUserTypeGuard } from "@/hooks/useUserTypeGuard";
import { supabase } from "@/integrations/supabase/client";

interface Expert {
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
}

const FindExperts = () => {
  const { isLoading: authLoading } = useUserTypeGuard(['researcher']);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedExpertise, setSelectedExpertise] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  useEffect(() => {
    const fetchExperts = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, institution, field_of_expertise, education_level, years_of_experience, profile_image_url, country, is_available')
        .eq('user_type', 'expert');

      if (error) {
        console.error('Error fetching experts:', error);
        setLoading(false);
        return;
      }

      setExperts(data || []);
      setLoading(false);
    };

    if (!authLoading) {
      fetchExperts();
    }
  }, [authLoading]);

  const allExpertiseFields = Array.from(
    new Set(experts.flatMap(expert => expert.field_of_expertise || []))
  ).sort();

  const allCountries = Array.from(
    new Set(experts.map(expert => expert.country).filter(Boolean))
  ).sort() as string[];

  const filteredExperts = experts.filter(expert => {
    const matchesSearch = searchQuery === "" || 
      expert.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.institution?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.field_of_expertise?.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesGeneralFilter = 
      selectedFilter === "all" ||
      (selectedFilter === "available" && expert.is_available);
    
    const matchesExpertise = 
      selectedExpertise === "all" ||
      expert.field_of_expertise?.includes(selectedExpertise);
    
    const matchesCountry = 
      selectedCountry === "all" ||
      expert.country === selectedCountry;
    
    return matchesSearch && matchesGeneralFilter && matchesExpertise && matchesCountry;
  });

  const handleConnectExpert = (expert: Expert) => {
    setSelectedExpert(expert);
    setRequestDialogOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getEducationLabel = (level: string | null) => {
    const labels: Record<string, string> = {
      bachelors: "Bachelor's",
      masters: "Master's",
      phd: "PhD",
      postdoc: "Postdoctoral",
      professor: "Professor",
      industry_professional: "Industry Professional"
    };
    return level ? labels[level] || level : null;
  };

  if (loading || authLoading) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Find Your Expert</h1>
          <p className="text-muted-foreground">
            Search through our verified experts and connect for your research needs
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search by name, field, or institution..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setSearchQuery("")}>
            {searchQuery ? "Clear" : "Search"}
          </Button>
        </div>
        
        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-3">General Filters</h3>
            <div className="flex gap-3 flex-wrap">
              <Button 
                variant={selectedFilter === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedFilter("all")}
              >
                All Experts
              </Button>
              <Button 
                variant={selectedFilter === "available" ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedFilter("available")}
              >
                Available Now
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Expertise</h3>
              <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="All Expertise" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Expertise</SelectItem>
                  {allExpertiseFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Country</h3>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">All Countries</SelectItem>
                  {allCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Expert Cards */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredExperts.length} expert{filteredExperts.length !== 1 ? 's' : ''}
        </div>

        {filteredExperts.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-medium mb-2">No experts found</h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedFilter !== "all" || selectedExpertise !== "all" || selectedCountry !== "all"
                ? "Try adjusting your search criteria"
                : "No experts have registered yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperts.map((expert) => (
              <Card key={expert.id} className="hover:border-accent transition-colors">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={expert.profile_image_url || undefined} />
                      <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                        {getInitials(expert.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{expert.full_name}</h3>
                      {expert.education_level && (
                        <p className="text-sm text-muted-foreground">{getEducationLabel(expert.education_level)}</p>
                      )}
                      {expert.institution && (
                        <p className="text-sm text-muted-foreground">{expert.institution}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {expert.field_of_expertise && expert.field_of_expertise.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {expert.field_of_expertise.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {expert.field_of_expertise.length > 3 && (
                        <Badge variant="outline">
                          +{expert.field_of_expertise.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {expert.years_of_experience && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="w-4 h-4" />
                      <span>{expert.years_of_experience} years of experience</span>
                    </div>
                  )}
                  
                  {expert.country && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {expert.country}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {expert.is_available ? (
                        <span className="text-green-600">Available</span>
                      ) : (
                        <span className="text-muted-foreground">Limited availability</span>
                      )}
                    </span>
                  </div>

                  {expert.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {expert.bio}
                    </p>
                  )}
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => handleConnectExpert(expert)}
                  >
                    Request Interview
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Interview Request Dialog */}
      {selectedExpert && (
        <RequestInterviewDialog
          open={requestDialogOpen}
          onOpenChange={setRequestDialogOpen}
          expertName={selectedExpert.full_name}
          expertId={selectedExpert.id}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default FindExperts;
