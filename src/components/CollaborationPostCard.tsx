import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Megaphone, Clock, Users, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ApplyToPostDialog from "./ApplyToPostDialog";
import ViewApplicationsDialog from "./ViewApplicationsDialog";

export interface CollaborationPost {
  id: string;
  author_id: string;
  title: string;
  description: string;
  field_of_study: string[];
  status: string;
  created_at: string;
  author?: {
    id: string;
    full_name: string;
    profile_image_url: string | null;
    user_type: string;
    institution?: string | null;
    research_institution?: string | null;
  };
  application_status?: 'none' | 'pending' | 'accepted' | 'rejected';
  application_count?: number;
}

interface CollaborationPostCardProps {
  post: CollaborationPost;
  currentUserId: string | null;
  onRefresh: () => void;
}

const CollaborationPostCard = ({ post, currentUserId, onRefresh }: CollaborationPostCardProps) => {
  const { toast } = useToast();
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [viewApplicationsOpen, setViewApplicationsOpen] = useState(false);

  const isAuthor = currentUserId === post.author_id;
  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const institution = post.author?.institution || post.author?.research_institution;

  return (
    <>
      <Card className="hover:border-accent/50 transition-all hover:shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-start gap-4 mb-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Megaphone className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight mb-1">{post.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={post.author?.profile_image_url || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(post.author?.full_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <span>{post.author?.full_name}</span>
                {institution && (
                  <>
                    <span>•</span>
                    <span className="truncate">{institution}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.description}</p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.field_of_study.slice(0, 3).map((field, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {field}
              </Badge>
            ))}
            {post.field_of_study.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.field_of_study.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(post.created_at)}
              </span>
              {isAuthor && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {post.application_count || 0} applicants
                </span>
              )}
            </div>

            {isAuthor ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setViewApplicationsOpen(true)}
              >
                <Users className="w-4 h-4 mr-1" />
                View Applications
              </Button>
            ) : post.application_status === "accepted" ? (
              <Button size="sm" variant="outline" disabled>
                <Check className="w-4 h-4 mr-1" />
                Accepted
              </Button>
            ) : post.application_status === "pending" ? (
              <Button size="sm" variant="outline" disabled>
                <Clock className="w-4 h-4 mr-1" />
                Applied
              </Button>
            ) : (
              <Button size="sm" onClick={() => setApplyDialogOpen(true)}>
                Apply to Join
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <ApplyToPostDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        post={post}
        onApplied={onRefresh}
      />

      <ViewApplicationsDialog
        open={viewApplicationsOpen}
        onOpenChange={setViewApplicationsOpen}
        post={post}
        onUpdate={onRefresh}
      />
    </>
  );
};

export default CollaborationPostCard;
