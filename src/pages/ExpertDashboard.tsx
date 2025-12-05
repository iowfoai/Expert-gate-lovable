import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import InterviewRequestDialog from "@/components/InterviewRequestDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Star, Users, Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserTypeGuard } from "@/hooks/useUserTypeGuard";

const ExpertDashboard = () => {
  const navigate = useNavigate();
  const { isLoading } = useUserTypeGuard(['expert']);
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Mock expert data
  const expertProfile = {
    name: "Dr. Sarah Mitchell",
    title: "Professor of Climate Science",
    institution: "MIT",
    expertise: ["Climate Change", "Environmental Policy", "Sustainability"],
    rating: 4.9,
    totalInterviews: 28,
    interviewsRemaining: 3,
    monthlyLimit: 5
  };

  // Mock pending requests
  const pendingRequests = [
    {
      id: 1,
      researcherName: "John Smith",
      researchTopic: "Impact of climate change on coastal ecosystems",
      description: "I am conducting research on how rising sea levels and ocean acidification are affecting marine biodiversity in coastal regions. I would like to understand the latest findings in climate science and potential mitigation strategies.",
      questions: [
        "What are the most significant impacts of ocean acidification on marine life?",
        "How do current climate models predict sea level rise over the next 50 years?",
        "What are the most effective policy interventions for coastal protection?"
      ],
      requestedDate: "2025-11-10",
      duration: "10 minutes",
      status: "pending"
    },
    {
      id: 2,
      researcherName: "Emily Chen",
      researchTopic: "Renewable energy policy frameworks",
      description: "My thesis explores comparative renewable energy policies across different countries. I'm particularly interested in understanding how policy design influences adoption rates and technological innovation.",
      questions: [
        "What are key differences between carbon tax and cap-and-trade systems?",
        "How do renewable energy subsidies impact grid stability?",
        "Which countries have the most effective renewable energy transition policies?"
      ],
      requestedDate: "2025-11-12",
      duration: "8 minutes",
      status: "pending"
    }
  ];

  // Mock upcoming interviews
  const upcomingInterviews = [
    {
      id: 3,
      researcherName: "David Brown",
      researchTopic: "Carbon capture technologies",
      scheduledDate: "2025-11-08",
      time: "14:00",
      duration: "10 minutes",
      status: "confirmed"
    }
  ];

  // Mock past interviews
  const pastInterviews = [
    {
      id: 4,
      researcherName: "Maria Garcia",
      researchTopic: "Environmental sustainability in urban planning",
      completedDate: "2025-10-28",
      duration: "10 minutes",
      rating: 5
    },
    {
      id: 5,
      researcherName: "Alex Johnson",
      researchTopic: "Climate policy implementation challenges",
      completedDate: "2025-10-22",
      duration: "7 minutes",
      rating: 5
    }
  ];

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  if (isLoading) {
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
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="outline" 
            onClick={() => navigate("/expert-home")}
            className="mb-4"
          >
            ← Back to Home
          </Button>
          <h1 className="text-4xl font-bold mb-2">Expert Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your interview requests and availability
          </p>
        </div>

        {/* Profile Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="bg-accent/10 text-accent font-semibold text-2xl">
                  {expertProfile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold mb-1">{expertProfile.name}</h3>
                <p className="text-muted-foreground mb-1">{expertProfile.title}</p>
                <p className="text-sm text-muted-foreground mb-3">{expertProfile.institution}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {expertProfile.expertise.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="availability" 
                    checked={isAvailable}
                    onCheckedChange={setIsAvailable}
                  />
                  <Label htmlFor="availability" className="cursor-pointer">
                    {isAvailable ? "Available for interviews" : "Not available"}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{expertProfile.rating}</div>
                  <div className="text-sm text-muted-foreground">Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{expertProfile.totalInterviews}</div>
                  <div className="text-sm text-muted-foreground">Total Interviews</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{expertProfile.interviewsRemaining}</div>
                  <div className="text-sm text-muted-foreground">This Month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingRequests.length}</div>
                  <div className="text-sm text-muted-foreground">Pending Requests</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="requests" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="requests">Pending Requests</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Interviews</TabsTrigger>
            <TabsTrigger value="past">Past Interviews</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No pending requests at the moment
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{request.researcherName}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Research Topic: {request.researchTopic}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {request.requestedDate}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {request.duration}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(request)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            See Interview Details
                          </Button>
                          <div className="flex gap-2">
                            <Button size="sm" variant="default">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button size="sm" variant="outline">
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="upcoming">
            <div className="space-y-4">
              {upcomingInterviews.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No upcoming interviews scheduled
                  </CardContent>
                </Card>
              ) : (
                upcomingInterviews.map((interview) => (
                  <Card key={interview.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{interview.researcherName}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Research Topic: {interview.researchTopic}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {interview.scheduledDate} at {interview.time}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {interview.duration}
                            </div>
                          </div>
                          <Badge variant="secondary" className="mt-2">
                            {interview.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Reschedule
                          </Button>
                          <Button size="sm" variant="outline">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="past">
            <div className="space-y-4">
              {pastInterviews.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No past interviews yet
                  </CardContent>
                </Card>
              ) : (
                pastInterviews.map((interview) => (
                  <Card key={interview.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{interview.researcherName}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Research Topic: {interview.researchTopic}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {interview.completedDate}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {interview.duration}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-gold text-gold" />
                              {interview.rating}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Interview Details Dialog */}
      {selectedRequest && (
        <InterviewRequestDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          request={selectedRequest}
        />
      )}
      
      <Footer />
    </div>
  );
};

export default ExpertDashboard;
