'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterOption {
  value: string
  label: string
}

interface SearchFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filterValue?: string
  onFilterChange?: (value: string) => void
  filterLabel?: string
  filterOptions?: FilterOption[]
  placeholder?: string
  onClear?: () => void
}

export function SearchFilter({
  searchValue,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterLabel = 'Filter',
  filterOptions = [],
  placeholder = 'Search...',
  onClear,
}: SearchFilterProps) {
  const handleClear = () => {
    onSearchChange('')
    if (onClear) {
      onClear()
    }
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-10 pr-10"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {filterOptions.length > 0 && onFilterChange && (
        <Select value={filterValue || 'all'} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder={`${filterLabel} by...`} />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
