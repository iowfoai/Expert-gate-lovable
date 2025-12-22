import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CollaborationPost } from "./CollaborationPostCard";

interface ApplyToPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: CollaborationPost;
  onApplied: () => void;
}

const ApplyToPostDialog = ({
  open,
  onOpenChange,
  post,
  onApplied,
}: ApplyToPostDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("collaboration_applications").insert({
      post_id: post.id,
      applicant_id: user.id,
      message: message.trim() || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Application Submitted",
        description: "Your application has been sent to the post author",
      });
      setMessage("");
      onOpenChange(false);
      onApplied();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Apply to Collaborate</DialogTitle>
          <DialogDescription>
            Apply to join "{post.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="message">
              Message (optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Tell the author why you'd like to join this project..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyToPostDialog;
