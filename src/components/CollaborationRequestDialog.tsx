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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";

interface CollaborationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  researcher: {
    id: string;
    full_name: string;
  };
  researcherLanguages: string[];
  onSuccess: () => void;
}

const CollaborationRequestDialog = ({
  open,
  onOpenChange,
  researcher,
  researcherLanguages,
  onSuccess
}: CollaborationRequestDialogProps) => {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const languagesList = researcherLanguages.join(', ');

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a collaboration topic",
        variant: "destructive"
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Request Collaboration</DialogTitle>
            <DialogDescription>
              Send a collaboration request to {researcher.full_name}
            </DialogDescription>
          </DialogHeader>

          {/* Language Warning Banner */}
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Note: Submit the request in only {languagesList}</p>
              <p className="text-sm text-muted-foreground mt-1">
                This researcher prefers to receive requests in these languages.
              </p>
            </div>
          </div>

          <form onSubmit={handlePreSubmit}>
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Language</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you have submitted this request in the following language(s): <strong>{languagesList}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                handleSubmit();
              }}
            >
              Yes, Submit Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CollaborationRequestDialog;
