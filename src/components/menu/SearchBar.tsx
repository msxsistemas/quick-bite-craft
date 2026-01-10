import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="px-4 py-3">
      <div className="relative">
        <input
          type="text"
          placeholder="Procurar..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="delivery-input pl-11"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      </div>
    </div>
  );
};
