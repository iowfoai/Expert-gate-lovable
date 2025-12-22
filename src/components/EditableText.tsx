import { useState, useEffect, useRef } from "react";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  contentKey: string;
  defaultValue: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  multiline?: boolean;
}

export const EditableText = ({
  contentKey,
  defaultValue,
  className,
  as: Component = "span",
  multiline = false,
}: EditableTextProps) => {
  const { isAdmin } = useAdminStatus();
  const { getContent, updateContent, loading } = useSiteContent();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const displayValue = getContent(contentKey, defaultValue);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(displayValue);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue.trim() === "") {
      toast.error("Content cannot be empty");
      return;
    }

    setIsSaving(true);
    const success = await updateContent(contentKey, editValue);
    setIsSaving(false);

    if (success) {
      toast.success("Content updated");
      setIsEditing(false);
    } else {
      toast.error("Failed to update content");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Enter" && e.ctrlKey && multiline) {
      e.preventDefault();
      handleSave();
    }
  };

  if (loading) {
    return <Component className={className}>{defaultValue}</Component>;
  }

  if (!isAdmin) {
    return <Component className={className}>{displayValue}</Component>;
  }

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1 relative">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "border border-primary rounded px-2 py-1 min-w-[200px] min-h-[100px] bg-background text-foreground resize-both",
              className
            )}
            disabled={isSaving}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "border border-primary rounded px-2 py-1 min-w-[200px] bg-background text-foreground",
              className
            )}
            disabled={isSaving}
          />
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          title="Save (Enter)"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          title="Cancel (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 group relative">
      <Component className={className}>{displayValue}</Component>
      <button
        onClick={handleStartEdit}
        className="opacity-0 group-hover:opacity-100 p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-all absolute -right-6"
        title="Edit content"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </span>
  );
};
