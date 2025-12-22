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
import { Badge } from "@/components/ui/badge";
import { X, Plus, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateCollaborationPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

const CreateCollaborationPostDialog = ({
  open,
  onOpenChange,
  onPostCreated,
}: CreateCollaborationPostDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldInput, setFieldInput] = useState("");
  const [fields, setFields] = useState<string[]>([]);

  const handleAddField = () => {
    const trimmed = fieldInput.trim();
    if (trimmed && !fields.includes(trimmed)) {
      setFields([...fields, trimmed]);
      setFieldInput("");
    }
  };

  const handleRemoveField = (field: string) => {
    setFields(fields.filter((f) => f !== field));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || fields.length === 0) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

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

    const { error } = await supabase.from("collaboration_posts").insert({
      author_id: user.id,
      title: title.trim(),
      description: description.trim(),
      field_of_study: fields,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Your collaboration post has been created!",
      });
      setTitle("");
      setDescription("");
      setFields([]);
      onOpenChange(false);
      onPostCreated();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-accent" />
            Post a Call for Collaboration
          </DialogTitle>
          <DialogDescription>
            Share details about your research project to find collaborators
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Looking for collaborators on AI Ethics research"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your research project, what you're looking for, and how collaborators can contribute..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Field of Study *</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Machine Learning"
                value={fieldInput}
                onChange={(e) => setFieldInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddField();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddField}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {fields.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {fields.map((field) => (
                  <Badge key={field} variant="secondary" className="gap-1">
                    {field}
                    <button
                      type="button"
                      onClick={() => handleRemoveField(field)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Posting..." : "Post Collaboration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollaborationPostDialog;
