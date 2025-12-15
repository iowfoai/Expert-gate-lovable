import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Plus, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const interviewRequestSchema = z.object({
  researchTopic: z.string().min(10, "Research topic must be at least 10 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  preferredDate: z.date({
    required_error: "Please select a preferred date",
  }),
  durationMinutes: z.number().min(1).max(30),
});

type InterviewRequestFormValues = z.infer<typeof interviewRequestSchema>;

interface RequestInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expertName: string;
  expertId: string;
}

const RequestInterviewDialog = ({
  open,
  onOpenChange,
  expertName,
  expertId,
}: RequestInterviewDialogProps) => {
  const [questions, setQuestions] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<InterviewRequestFormValues>({
    resolver: zodResolver(interviewRequestSchema),
    defaultValues: {
      researchTopic: "",
      description: "",
      durationMinutes: 30,
    },
  });

  const addQuestion = () => {
    if (questions.length < 10) {
      setQuestions([...questions, ""]);
    }
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const onSubmit = async (values: InterviewRequestFormValues) => {
    const filteredQuestions = questions.filter(q => q.trim() !== "");
    
    if (filteredQuestions.length === 0) {
      form.setError("root", {
        message: "Please add at least one question"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to send a request",
          variant: "destructive"
        });
        return;
      }

      const { data: insertedRequest, error } = await supabase
        .from('interview_requests')
        .insert({
          researcher_id: user.id,
          expert_id: expertId,
          research_topic: values.researchTopic,
          description: values.description,
          questions: filteredQuestions,
          preferred_date: format(values.preferredDate, 'yyyy-MM-dd'),
          duration_minutes: values.durationMinutes,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;

      // Send email notification to expert
      if (insertedRequest) {
        supabase.functions.invoke('send-interview-notification', {
          body: { type: 'new_request', interviewRequestId: insertedRequest.id }
        }).catch(err => console.error('Failed to send notification:', err));
      }

      toast({
        title: "Request Sent!",
        description: `Your interview request has been sent to ${expertName}. You'll be notified when they respond.`
      });

      onOpenChange(false);
      form.reset();
      setQuestions([""]);
    } catch (error: any) {
      console.error('Error sending request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send interview request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Request Interview</DialogTitle>
          <DialogDescription>
            Send an interview request to {expertName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Research Topic */}
            <FormField
              control={form.control}
              name="researchTopic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Research Topic *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Climate change impact on marine ecosystems" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, concise title for your research topic
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you're researching and what you hope to learn from this interview..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide context about your research and interview goals
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Questions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Interview Questions *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addQuestion}
                  disabled={questions.length >= 10}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Question
                </Button>
              </div>
              <FormDescription>
                Add 1-10 questions you'd like to ask during the interview
              </FormDescription>
              {questions.map((question, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    placeholder={`Question ${index + 1}`}
                    value={question}
                    onChange={(e) => updateQuestion(index, e.target.value)}
                    className="min-h-[60px]"
                  />
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Preferred Date */}
            <FormField
              control={form.control}
              name="preferredDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Preferred Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The date you'd prefer to conduct the interview
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration */}
            <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum 30 minutes per interview
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestInterviewDialog;
