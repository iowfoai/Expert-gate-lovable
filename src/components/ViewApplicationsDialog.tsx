import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Loader2, Eye, ArrowLeft, GraduationCap, Building, Globe, Languages, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CollaborationPost } from "./CollaborationPostCard";

interface ApplicantProfile {
  id: string;
  full_name: string;
  profile_image_url: string | null;
  user_type: string;
  institution?: string | null;
  research_institution?: string | null;
  bio?: string | null;
  education_level?: string | null;
  field_of_expertise?: string[] | null;
  research_field?: string[] | null;
  years_of_experience?: number | null;
  country?: string | null;
  preferred_languages?: string[] | null;
  professional_website?: string | null;
}

interface Application {
  id: string;
  applicant_id: string;
  message: string | null;
  status: string;
  created_at: string;
  applicant?: ApplicantProfile;
}

interface ViewApplicationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: CollaborationPost;
  onUpdate: () => void;
}

const ViewApplicationsDialog = ({
  open,
  onOpenChange,
  post,
  onUpdate,
}: ViewApplicationsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [viewingApplicant, setViewingApplicant] = useState<ApplicantProfile | null>(null);

  useEffect(() => {
    if (open) {
      fetchApplications();
    }
  }, [open, post.id]);

  const fetchApplications = async () => {
    setLoading(true);

    const { data: apps, error } = await supabase
      .from("collaboration_applications")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      setLoading(false);
      return;
    }

    if (apps && apps.length > 0) {
      const applicantIds = apps.map((a) => a.applicant_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, profile_image_url, user_type, institution, research_institution, bio, education_level, field_of_expertise, research_field, years_of_experience, country, preferred_languages, professional_website")
        .in("id", applicantIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const enriched = apps.map((app) => ({
        ...app,
        applicant: profileMap.get(app.applicant_id),
      }));

      setApplications(enriched);
    } else {
      setApplications([]);
    }

    setLoading(false);
  };

  const handleAccept = async (application: Application) => {
    setProcessingId(application.id);

    // Update application status
    const { error: updateError } = await supabase
      .from("collaboration_applications")
      .update({ status: "accepted" })
      .eq("id", application.id);

    if (updateError) {
      toast({
        title: "Error",
        description: "Failed to accept application",
        variant: "destructive",
      });
      setProcessingId(null);
      return;
    }

    // Check if group exists, if not create it
    const { data: existingGroup } = await supabase
      .from("project_groups")
      .select("id")
      .eq("post_id", post.id)
      .maybeSingle();

    let groupId = existingGroup?.id;

    if (!groupId) {
      // Create the group
      const { data: newGroup, error: groupError } = await supabase
        .from("project_groups")
        .insert({
          post_id: post.id,
          name: post.title,
        })
        .select("id")
        .single();

      if (groupError) {
        console.error("Error creating group:", groupError);
        toast({
          title: "Error",
          description: "Failed to create project group",
          variant: "destructive",
        });
        setProcessingId(null);
        return;
      }

      groupId = newGroup.id;

      // Add the post author as owner
      await supabase.from("project_group_members").insert({
        group_id: groupId,
        user_id: post.author_id,
        role: "owner",
      });
    }

    // Add the applicant to the group
    const { error: memberError } = await supabase
      .from("project_group_members")
      .insert({
        group_id: groupId,
        user_id: application.applicant_id,
        role: "member",
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
    }

    toast({
      title: "Application Accepted",
      description: `${application.applicant?.full_name} has been added to the project group`,
    });

    setProcessingId(null);
    fetchApplications();
    onUpdate();
  };

  const handleReject = async (applicationId: string) => {
    setProcessingId(applicationId);

    const { error } = await supabase
      .from("collaboration_applications")
      .update({ status: "rejected" })
      .eq("id", applicationId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject application",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Application Rejected",
        description: "The application has been rejected",
      });
      fetchApplications();
    }

    setProcessingId(null);
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatEducation = (level: string | null | undefined) => {
    if (!level) return null;
    const map: Record<string, string> = {
      bachelors: "Bachelor's",
      masters: "Master's",
      phd: "PhD",
      postdoc: "Postdoc",
      professor: "Professor",
      industry_professional: "Industry Professional",
    };
    return map[level] || level;
  };

  const pendingApps = applications.filter((a) => a.status === "pending");
  const processedApps = applications.filter((a) => a.status !== "pending");

  // Applicant detail view
  if (viewingApplicant) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setViewingApplicant(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle>Applicant Details</DialogTitle>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={viewingApplicant.profile_image_url || ""} />
                <AvatarFallback className="text-lg">
                  {getInitials(viewingApplicant.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{viewingApplicant.full_name}</h3>
                <Badge variant="secondary" className="capitalize">
                  {viewingApplicant.user_type}
                </Badge>
              </div>
            </div>

            {viewingApplicant.bio && (
              <p className="text-sm text-muted-foreground">{viewingApplicant.bio}</p>
            )}

            <div className="grid gap-3">
              {(viewingApplicant.institution || viewingApplicant.research_institution) && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span>{viewingApplicant.institution || viewingApplicant.research_institution}</span>
                </div>
              )}

              {viewingApplicant.education_level && (
                <div className="flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  <span>{formatEducation(viewingApplicant.education_level)}</span>
                </div>
              )}

              {viewingApplicant.years_of_experience && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span>{viewingApplicant.years_of_experience} years of experience</span>
                </div>
              )}

              {viewingApplicant.country && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>{viewingApplicant.country}</span>
                </div>
              )}

              {viewingApplicant.preferred_languages && viewingApplicant.preferred_languages.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Languages className="w-4 h-4 text-muted-foreground" />
                  <span>{viewingApplicant.preferred_languages.join(", ")}</span>
                </div>
              )}

              {viewingApplicant.professional_website && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <a 
                    href={viewingApplicant.professional_website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {viewingApplicant.professional_website}
                  </a>
                </div>
              )}
            </div>

            {(viewingApplicant.field_of_expertise?.length || viewingApplicant.research_field?.length) && (
              <div>
                <p className="text-sm font-medium mb-2">Fields</p>
                <div className="flex flex-wrap gap-1">
                  {(viewingApplicant.field_of_expertise || viewingApplicant.research_field || []).map((field) => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Applications</DialogTitle>
          <DialogDescription>
            Review applications for "{post.title}"
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-accent" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No applications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            {pendingApps.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Pending</p>
                <div className="space-y-3">
                  {pendingApps.map((app) => (
                    <div key={app.id} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={app.applicant?.profile_image_url || ""} />
                          <AvatarFallback>
                            {getInitials(app.applicant?.full_name || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{app.applicant?.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {app.applicant?.institution || app.applicant?.research_institution}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {app.applicant?.user_type}
                        </Badge>
                      </div>
                      {app.message && (
                        <p className="text-sm text-muted-foreground mb-3">{app.message}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => app.applicant && setViewingApplicant(app.applicant)}
                        >
                          <Eye className="w-4 h-4 mr-1" /> Details
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAccept(app)}
                          disabled={processingId === app.id}
                        >
                          {processingId === app.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" /> Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(app.id)}
                          disabled={processingId === app.id}
                        >
                          <X className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {processedApps.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Processed</p>
                <div className="space-y-2">
                  {processedApps.map((app) => (
                    <div key={app.id} className="p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={app.applicant?.profile_image_url || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(app.applicant?.full_name || "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{app.applicant?.full_name}</p>
                        </div>
                        <Badge
                          variant={app.status === "accepted" ? "default" : "secondary"}
                          className="text-xs capitalize"
                        >
                          {app.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewApplicationsDialog;
