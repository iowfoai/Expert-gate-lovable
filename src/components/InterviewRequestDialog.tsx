import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, MessageSquare } from "lucide-react";

interface InterviewRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    researcherName: string;
    researchTopic: string;
    description: string;
    questions: string[];
    requestedDate: string;
    duration: string;
  };
}

const InterviewRequestDialog = ({ open, onOpenChange, request }: InterviewRequestDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Interview Request Details</DialogTitle>
          <DialogDescription>
            From {request.researcherName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Research Topic */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              Research Topic
            </h3>
            <p className="text-muted-foreground">{request.researchTopic}</p>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              Interview Description
            </h3>
            <p className="text-muted-foreground whitespace-pre-line">{request.description}</p>
          </div>

          {/* Interview Details */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <div>
                <div className="text-sm text-muted-foreground">Preferred Date</div>
                <div className="font-medium">{request.requestedDate}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <div>
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="font-medium">{request.duration}</div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-accent" />
              Interview Questions
              <Badge variant="secondary">{request.questions.length} questions</Badge>
            </h3>
            <div className="space-y-3">
              {request.questions.map((question, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-lg">
                  <div className="text-sm font-medium text-accent mb-1">
                    Question {index + 1}
                  </div>
                  <p className="text-muted-foreground">{question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewRequestDialog;
