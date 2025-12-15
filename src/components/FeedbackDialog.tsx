import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackDialog = ({ open, onOpenChange }: FeedbackDialogProps) => {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-feedback", {
        body: { feedback: feedback.trim() },
      });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully.",
      });
      setFeedback("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            We'd love to hear your thoughts, suggestions, or any issues you've encountered.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Type your feedback here..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
