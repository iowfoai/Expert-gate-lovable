import { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { universities } from "@/lib/universities";

interface InstitutionComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const InstitutionCombobox = ({
  value,
  onChange,
  placeholder = "Search institution...",
}: InstitutionComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter institutions based on search
  const filteredInstitutions = universities.filter((uni) =>
    uni.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Check if current value is a custom one (not in the list)
  useEffect(() => {
    if (value && !universities.includes(value)) {
      setIsCustomMode(true);
    }
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setIsCustomMode(false);
  };

  const handleCustomMode = () => {
    setIsCustomMode(true);
    setOpen(false);
    // Pre-fill with what they searched if it's not empty
    if (searchValue && !universities.some(u => u.toLowerCase() === searchValue.toLowerCase())) {
      onChange(searchValue);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleBackToSearch = () => {
    setIsCustomMode(false);
    onChange("");
    setSearchValue("");
  };

  if (isCustomMode) {
    return (
      <div className="space-y-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your institution name..."
          className="w-full"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBackToSearch}
          className="text-xs text-muted-foreground"
        >
          ← Back to search
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 z-50 bg-background" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search institution..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty className="py-2">
              <div className="px-2 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No institution found.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCustomMode}
                  className="w-full"
                >
                  Can't find your institution? Type it
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {filteredInstitutions.slice(0, 50).map((institution) => (
                <CommandItem
                  key={institution}
                  value={institution}
                  onSelect={() => handleSelect(institution)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === institution ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {institution}
                </CommandItem>
              ))}
              {filteredInstitutions.length > 50 && (
                <div className="px-2 py-1 text-xs text-muted-foreground text-center">
                  Type to narrow down results...
                </div>
              )}
            </CommandGroup>
            {searchValue && filteredInstitutions.length > 0 && (
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCustomMode}
                  className="w-full text-xs"
                >
                  Can't find your institution? Type it
                </Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default InstitutionCombobox;
