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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CollaborationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  researcher: {
    id: string;
    full_name: string;
  };
  onSuccess: () => void;
}

const CollaborationRequestDialog = ({
  open,
  onOpenChange,
  researcher,
  onSuccess
}: CollaborationRequestDialogProps) => {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a collaboration topic",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Error",
        description: "You must be logged in to send a collaboration request",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Check if user is verified
    const { data: profile } = await supabase
      .from('profiles')
      .select('verification_status')
      .eq('id', session.user.id)
      .single();

    if (profile?.verification_status !== 'verified') {
      toast({
        title: "Verification Required",
        description: "Your account must be verified before you can send collaboration requests.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('collaboration_requests')
      .insert({
        expert_id: session.user.id,
        researcher_id: researcher.id,
        topic: topic.trim(),
        message: message.trim() || null,
        status: 'pending'
      });

    if (error) {
      console.error('Error sending collaboration request:', error);
      toast({
        title: "Error",
        description: "Failed to send collaboration request",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Request Sent!",
      description: `Collaboration request sent to ${researcher.full_name}`
    });

    setTopic("");
    setMessage("");
    setLoading(false);
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Collaboration</DialogTitle>
          <DialogDescription>
            Send a collaboration request to {researcher.full_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="topic">Collaboration Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Machine Learning Research Project"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Brief Message (optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell them a bit about the collaboration opportunity..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CollaborationRequestDialog;
