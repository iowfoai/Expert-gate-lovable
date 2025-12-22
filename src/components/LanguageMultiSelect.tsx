import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { languages } from "@/lib/languages";

interface LanguageMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

const LanguageMultiSelect = ({ value, onChange, placeholder = "Select languages..." }: LanguageMultiSelectProps) => {
  const [open, setOpen] = useState(false);

  const toggleLanguage = (language: string) => {
    if (value.includes(language)) {
      onChange(value.filter(l => l !== language));
    } else {
      onChange([...value, language]);
    }
  };

  const removeLanguage = (language: string) => {
    onChange(value.filter(l => l !== language));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {value.length > 0 ? `${value.length} language${value.length > 1 ? 's' : ''} selected` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search languages..." />
            <CommandList>
              <CommandEmpty>No language found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {languages.map((language) => (
                  <CommandItem
                    key={language}
                    value={language}
                    onSelect={() => toggleLanguage(language)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(language) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {language}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((language) => (
            <Badge key={language} variant="secondary" className="gap-1">
              {language}
              <button
                type="button"
                onClick={() => removeLanguage(language)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageMultiSelect;
