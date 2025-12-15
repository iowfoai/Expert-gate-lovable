import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface InterviewRequest {
  id: string;
  research_topic: string;
  description: string;
  status: string;
  preferred_date: string | null;
  scheduled_date: string | null;
  duration_minutes: number;
  created_at: string;
  expert_id: string;
  researcher_id: string;
  expert_profile?: {
    full_name: string;
    email: string;
  } | null;
  researcher_profile?: {
    full_name: string;
    email: string;
  } | null;
}

const InterviewHistory = () => {
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<"researcher" | "expert">("researcher");
  const [requests, setRequests] = useState<InterviewRequest[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    await fetchUserType(session.user.id);
    await fetchRequests(session.user.id);
  };

  const fetchUserType = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setUserType(data.user_type);
    }
  };

  const fetchRequests = async (userId: string) => {
    try {
      // Fetch user type first
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("id", userId)
        .maybeSingle();

      const isExpert = profile?.user_type === "expert";

      // Build query based on user type
      let query = supabase
        .from("interview_requests")
        .select("*");

      if (isExpert) {
        query = query.eq("expert_id", userId);
      } else {
        query = query.eq("researcher_id", userId);
      }

      const { data: requestsData, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each request
      const requestsWithProfiles = await Promise.all(
        (requestsData || []).map(async (request) => {
          // Fetch the other party's profile
          const otherUserId = isExpert ? request.researcher_id : request.expert_id;
          
          const { data: otherProfile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", otherUserId)
            .maybeSingle();

          return {
            ...request,
            expert_profile: isExpert ? null : otherProfile,
            researcher_profile: isExpert ? otherProfile : null,
          };
        })
      );

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to load interview history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
      completed: "outline",
    };
    return <Badge variant={variants[status] || "default"} className="capitalize">{status}</Badge>;
  };

  const filterRequests = (status?: string) => {
    if (!status) return requests;
    return requests.filter((req) => req.status === status);
  };

  const getOtherPartyName = (request: InterviewRequest) => {
    if (userType === "researcher") {
      return request.expert_profile?.full_name || "Unknown Expert";
    } else {
      return request.researcher_profile?.full_name || "Unknown Researcher";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Interview History</h1>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({filterRequests("pending").length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({filterRequests("accepted").length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({filterRequests("completed").length})</TabsTrigger>
            </TabsList>

            {["all", "pending", "accepted", "completed"].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {filterRequests(tab === "all" ? undefined : tab).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No interviews found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filterRequests(tab === "all" ? undefined : tab).map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{request.research_topic}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              <User className="w-4 h-4" />
                              {userType === "researcher" ? "Expert: " : "Researcher: "}
                              {getOtherPartyName(request)}
                            </CardDescription>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm">{request.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {request.scheduled_date
                              ? format(new Date(request.scheduled_date), "PPP")
                              : request.preferred_date
                              ? format(new Date(request.preferred_date), "PPP") + " (Preferred)"
                              : "No date set"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {request.duration_minutes} minutes
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default InterviewHistory;