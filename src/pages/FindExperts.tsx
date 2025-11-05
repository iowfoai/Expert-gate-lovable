import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Star, MapPin, Calendar } from "lucide-react";

const mockExperts = [
  {
    id: 1,
    name: "Dr. Sarah Mitchell",
    title: "Professor of Climate Science",
    institution: "MIT",
    expertise: ["Climate Change", "Environmental Policy", "Sustainability"],
    rating: 4.9,
    interviews: 28,
    available: true,
    country: "USA"
  },
  {
    id: 2,
    name: "Prof. James Chen",
    title: "AI & Machine Learning Researcher",
    institution: "Stanford University",
    expertise: ["Artificial Intelligence", "Neural Networks", "Computer Vision"],
    rating: 4.8,
    interviews: 35,
    available: true,
    country: "USA"
  },
  {
    id: 3,
    name: "Dr. Emma Williams",
    title: "Senior Medical Researcher",
    institution: "Oxford University",
    expertise: ["Virology", "Public Health", "Epidemiology"],
    rating: 5.0,
    interviews: 42,
    available: false,
    country: "UK"
  },
  {
    id: 4,
    name: "Dr. Michael Rodriguez",
    title: "Quantum Physics Professor",
    institution: "Caltech",
    expertise: ["Quantum Computing", "Theoretical Physics", "Nanotechnology"],
    rating: 4.7,
    interviews: 31,
    available: true,
    country: "USA"
  },
  {
    id: 5,
    name: "Prof. Amelia Zhang",
    title: "Economics & Policy Expert",
    institution: "Harvard University",
    expertise: ["Behavioral Economics", "Public Policy", "Development Economics"],
    rating: 4.9,
    interviews: 45,
    available: true,
    country: "USA"
  },
  {
    id: 6,
    name: "Dr. Thomas Anderson",
    title: "Neuroscience Researcher",
    institution: "Cambridge University",
    expertise: ["Cognitive Neuroscience", "Brain Imaging", "Memory Research"],
    rating: 4.8,
    interviews: 38,
    available: true,
    country: "UK"
  },
  {
    id: 7,
    name: "Prof. Priya Sharma",
    title: "Renewable Energy Specialist",
    institution: "IIT Delhi",
    expertise: ["Solar Energy", "Energy Storage", "Smart Grids"],
    rating: 4.6,
    interviews: 22,
    available: false,
    country: "India"
  },
  {
    id: 8,
    name: "Dr. Lucas Martin",
    title: "Marine Biology Professor",
    institution: "University of Queensland",
    expertise: ["Marine Conservation", "Coral Reefs", "Ocean Acidification"],
    rating: 4.9,
    interviews: 29,
    available: true,
    country: "Australia"
  },
  {
    id: 9,
    name: "Prof. Fatima Al-Rashid",
    title: "Cybersecurity Expert",
    institution: "ETH Zurich",
    expertise: ["Network Security", "Cryptography", "Cyber Threat Intelligence"],
    rating: 5.0,
    interviews: 33,
    available: true,
    country: "Switzerland"
  },
  {
    id: 10,
    name: "Dr. Robert Kim",
    title: "Cancer Research Scientist",
    institution: "Johns Hopkins University",
    expertise: ["Oncology", "Immunotherapy", "Clinical Trials"],
    rating: 4.8,
    interviews: 51,
    available: false,
    country: "USA"
  },
  {
    id: 11,
    name: "Prof. Isabella Rossi",
    title: "Art History Scholar",
    institution: "Sapienza University of Rome",
    expertise: ["Renaissance Art", "Cultural Heritage", "Museum Studies"],
    rating: 4.7,
    interviews: 19,
    available: true,
    country: "Italy"
  },
  {
    id: 12,
    name: "Dr. Ahmed Hassan",
    title: "Data Science Researcher",
    institution: "University of Toronto",
    expertise: ["Big Data Analytics", "Machine Learning", "Statistical Modeling"],
    rating: 4.9,
    interviews: 40,
    available: true,
    country: "Canada"
  },
  {
    id: 13,
    name: "Prof. Sophie Dubois",
    title: "Psychology & Behavior Expert",
    institution: "Sorbonne University",
    expertise: ["Social Psychology", "Human Behavior", "Mental Health"],
    rating: 4.8,
    interviews: 36,
    available: true,
    country: "France"
  },
  {
    id: 14,
    name: "Dr. Hiroshi Tanaka",
    title: "Robotics Engineer",
    institution: "University of Tokyo",
    expertise: ["Robotics", "Automation", "Human-Robot Interaction"],
    rating: 4.6,
    interviews: 27,
    available: false,
    country: "Japan"
  },
  {
    id: 15,
    name: "Prof. Maria Santos",
    title: "Agricultural Science Professor",
    institution: "University of São Paulo",
    expertise: ["Sustainable Agriculture", "Crop Science", "Food Security"],
    rating: 4.7,
    interviews: 24,
    available: true,
    country: "Brazil"
  },
  {
    id: 16,
    name: "Dr. David Thompson",
    title: "Aerospace Engineering Specialist",
    institution: "Georgia Tech",
    expertise: ["Aerodynamics", "Spacecraft Design", "Propulsion Systems"],
    rating: 4.9,
    interviews: 30,
    available: true,
    country: "USA"
  },
  {
    id: 17,
    name: "Prof. Elena Petrova",
    title: "Literature & Linguistics Expert",
    institution: "Moscow State University",
    expertise: ["Comparative Literature", "Linguistics", "Translation Studies"],
    rating: 4.5,
    interviews: 16,
    available: true,
    country: "Russia"
  },
  {
    id: 18,
    name: "Dr. William O'Brien",
    title: "Biomedical Engineering Professor",
    institution: "Trinity College Dublin",
    expertise: ["Medical Devices", "Biomaterials", "Tissue Engineering"],
    rating: 4.8,
    interviews: 32,
    available: false,
    country: "Ireland"
  },
  {
    id: 19,
    name: "Prof. Yuki Nakamura",
    title: "Environmental Chemistry Researcher",
    institution: "Kyoto University",
    expertise: ["Pollution Control", "Green Chemistry", "Atmospheric Science"],
    rating: 4.7,
    interviews: 26,
    available: true,
    country: "Japan"
  },
  {
    id: 20,
    name: "Dr. Carmen Diaz",
    title: "Urban Planning Expert",
    institution: "Polytechnic University of Madrid",
    expertise: ["Smart Cities", "Urban Design", "Transportation Planning"],
    rating: 4.6,
    interviews: 21,
    available: true,
    country: "Spain"
  },
  {
    id: 21,
    name: "Prof. Lars Andersen",
    title: "Genetics & Genomics Researcher",
    institution: "University of Copenhagen",
    expertise: ["Human Genetics", "Gene Therapy", "Precision Medicine"],
    rating: 4.9,
    interviews: 44,
    available: true,
    country: "Denmark"
  },
  {
    id: 22,
    name: "Dr. Olivia Park",
    title: "Educational Technology Specialist",
    institution: "Seoul National University",
    expertise: ["EdTech", "Online Learning", "Curriculum Development"],
    rating: 4.8,
    interviews: 34,
    available: true,
    country: "South Korea"
  },
  {
    id: 23,
    name: "Prof. Marcus Johnson",
    title: "Philosophy & Ethics Scholar",
    institution: "Yale University",
    expertise: ["Ethics", "Political Philosophy", "Bioethics"],
    rating: 4.7,
    interviews: 25,
    available: false,
    country: "USA"
  }
];

const FindExperts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const allExpertiseFields = Array.from(
    new Set(mockExperts.flatMap(expert => expert.expertise))
  ).sort();

  const filteredExperts = mockExperts.filter(expert => {
    const matchesSearch = searchQuery === "" || 
      expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expert.expertise.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = 
      selectedFilter === "all" ||
      (selectedFilter === "available" && expert.available) ||
      (selectedFilter === "top-rated" && expert.rating >= 4.8) ||
      expert.expertise.includes(selectedFilter);
    
    return matchesSearch && matchesFilter;
  });

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
        <div className="mb-8 flex gap-3 flex-wrap">
          <Button 
            variant={selectedFilter === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedFilter("all")}
          >
            All Fields
          </Button>
          <Button 
            variant={selectedFilter === "available" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedFilter("available")}
          >
            Available Now
          </Button>
          <Button 
            variant={selectedFilter === "top-rated" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedFilter("top-rated")}
          >
            Top Rated
          </Button>
          {allExpertiseFields.slice(0, 8).map((field) => (
            <Button
              key={field}
              variant={selectedFilter === field ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(field)}
            >
              {field}
            </Button>
          ))}
        </div>
        
        {/* Expert Cards */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {filteredExperts.length} expert{filteredExperts.length !== 1 ? 's' : ''}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((expert) => (
            <Card key={expert.id} className="hover:border-accent transition-colors">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-accent/10 text-accent font-semibold">
                      {expert.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{expert.name}</h3>
                    <p className="text-sm text-muted-foreground">{expert.title}</p>
                    <p className="text-sm text-muted-foreground">{expert.institution}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {expert.expertise.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-gold text-gold" />
                    <span className="font-medium">{expert.rating}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {expert.interviews} interviews
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {expert.country}
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {expert.available ? (
                      <span className="text-green-600">Available</span>
                    ) : (
                      <span className="text-muted-foreground">Limited availability</span>
                    )}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button className="w-full">
                  Connect for $1.50
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FindExperts;
