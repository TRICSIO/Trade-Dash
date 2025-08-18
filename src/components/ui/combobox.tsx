
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    addText?: string;
}

export function Combobox({ options, value, onChange, placeholder, addText }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command
            filter={(itemValue, search) => {
                if(addText) {
                    if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1
                    return 0
                }
                return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
            }}
        >
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>
                {addText ? (
                     <button
                        className="w-full text-left p-2 text-sm hover:bg-accent rounded-md"
                        onClick={() => {
                            const input = document.querySelector<HTMLInputElement>('input[cmdk-input]');
                            if(input && input.value) {
                                onChange(input.value)
                                setOpen(false)
                            }
                        }}
                    >
                        {addText}: <span className="font-bold">{document.querySelector<HTMLInputElement>('input[cmdk-input]')?.value}</span>
                    </button>
                ) : 'No results found.'}
               
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
