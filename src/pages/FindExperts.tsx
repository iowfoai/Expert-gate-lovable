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
  }
];

const FindExperts = () => {
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
            />
          </div>
          <Button>Search</Button>
        </div>
        
        {/* Filters */}
        <div className="mb-8 flex gap-3 flex-wrap">
          <Button variant="outline" size="sm">All Fields</Button>
          <Button variant="outline" size="sm">Available Now</Button>
          <Button variant="outline" size="sm">Top Rated</Button>
          <Button variant="outline" size="sm">Location</Button>
        </div>
        
        {/* Expert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockExperts.map((expert) => (
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
