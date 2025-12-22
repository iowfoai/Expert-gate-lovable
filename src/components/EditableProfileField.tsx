import { useState, useEffect, useRef } from "react";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface EditableProfileFieldProps {
  userId: string;
  field: string;
  value: string | null;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  onUpdate?: (newValue: string) => void;
}

export const EditableProfileField = ({
  userId,
  field,
  value,
  className,
  as: Component = "span",
  onUpdate,
}: EditableProfileFieldProps) => {
  const { isAdmin } = useAdminStatus();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = value || "";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditValue(displayValue);
    setIsEditing(true);
  };

  const handleSave = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (editValue.trim() === "") {
      toast.error("Field cannot be empty");
      return;
    }

    setIsSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: editValue.trim() })
      .eq("id", userId);

    setIsSaving(false);

    if (error) {
      toast.error("Failed to update profile");
      console.error("Update error:", error);
    } else {
      toast.success("Profile updated");
      setIsEditing(false);
      onUpdate?.(editValue.trim());
    }
  };

  const handleCancel = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsEditing(false);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isAdmin) {
    return <Component className={className}>{displayValue}</Component>;
  }

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1 relative" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "border border-primary rounded px-2 py-1 min-w-[150px] bg-background text-foreground text-sm",
            className
          )}
          disabled={isSaving}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          title="Save (Enter)"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
          title="Cancel (Esc)"
        >
          <X className="h-3 w-3" />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 group relative">
      <Component className={className}>{displayValue}</Component>
      <button
        onClick={handleStartEdit}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-all ml-1"
        title="Edit field"
      >
        <Pencil className="h-2.5 w-2.5" />
      </button>
    </span>
  );
};
