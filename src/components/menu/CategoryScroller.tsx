import { Category } from '@/types/delivery';
import { cn } from '@/lib/utils';

interface CategoryScrollerProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryScroller: React.FC<CategoryScrollerProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-4">Categorias</h3>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-sm font-medium",
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50"
            )}
          >
            <span>{category.emoji}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
