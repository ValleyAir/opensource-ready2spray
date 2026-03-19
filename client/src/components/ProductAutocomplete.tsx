import { useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Product {
  id: number;
  nickname: string; // Changed from name to nickname to match db schema
  epaNumber?: string | null; // Changed from epaRegNumber to epaNumber to match db schema
  labelSignalWord?: string | null; // Changed from signalWord to labelSignalWord
}

interface ProductAutocompleteProps {
  value: string | string[]; // Keeping string for ID for flexibility, but product IDs are numbers usually. Will handle conversion if needed.
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

const signalWordColors: Record<string, string> = {
  DANGER: 'bg-red-500 text-white',
  WARNING: 'bg-yellow-500 text-black',
  CAUTION: 'bg-blue-500 text-white',
};

export function ProductAutocomplete({
  value,
  onChange,
  multiple = false,
  placeholder = 'Search products...',
  disabled = false,
}: ProductAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Using products.search endpoint which returns { id, nickname, epaNumber, manufacturer, activeIngredients }
  const { data: results, isLoading } = trpc.products.search.useQuery(
    { searchTerm: debouncedSearch },
    { enabled: debouncedSearch.length >= 2 }
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !results?.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (results[highlightedIndex]) {
          handleSelect(results[highlightedIndex] as unknown as Product);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (product: Product) => {
    const productIdStr = product.id.toString();
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      if (currentValue.includes(productIdStr)) {
        onChange(currentValue.filter((id) => id !== productIdStr));
      } else {
        onChange([...currentValue, productIdStr]);
      }
    } else {
      onChange(productIdStr);
      setIsOpen(false);
      setSearch(product.nickname);
    }
  };

  const isSelected = (productId: number) => {
    const productIdStr = productId.toString();
    if (multiple) {
      return Array.isArray(value) && value.includes(productIdStr);
    }
    return value === productIdStr;
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(0);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full"
      />

      {isOpen && (search.length >= 2 || (results?.length ?? 0) > 0) && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </li>
          )}

          {!isLoading && results?.length === 0 && search.length >= 2 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No products found
            </li>
          )}

          {results?.map((product, index) => {
             // Mapping result to Product interface explicitly if needed, but TS might infer based on usage
             const p = product as unknown as Product; 
             return (
            <li
              key={p.id}
              className={cn(
                'px-3 py-2 cursor-pointer flex items-center justify-between',
                index === highlightedIndex && 'bg-accent',
                isSelected(p.id) && 'bg-primary/10'
              )}
              onClick={() => handleSelect(p)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex flex-col">
                <span className="font-medium">{p.nickname}</span>
                {p.epaNumber && (
                  <span className="text-xs text-muted-foreground">
                    EPA# {p.epaNumber}
                  </span>
                )}
              </div>
              {p.labelSignalWord && (
                <Badge
                  className={cn(
                    'text-xs',
                    signalWordColors[p.labelSignalWord] || 'bg-gray-500'
                  )}
                >
                  {p.labelSignalWord}
                </Badge>
              )}
            </li>
          )})}
        </ul>
      )}

      {/* Selected items for multi-select */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {/* Would need to fetch selected product names - simplified for now */}
          {value.map((id) => (
            <Badge key={id} variant="secondary" className="cursor-pointer">
              {id}
              <button
                onClick={() => onChange(value.filter((v) => v !== id))}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
