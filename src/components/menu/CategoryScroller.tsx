import { ChevronRight } from 'lucide-react';
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
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Categorias</h3>
        <button className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
          Ver todas <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "flex-shrink-0 flex flex-col items-center gap-2 p-2 rounded-xl transition-all duration-200",
              selectedCategory === category.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {category.image ? (
              <div className={cn(
                "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200",
                selectedCategory === category.id
                  ? "border-primary shadow-delivery"
                  : "border-transparent"
              )}>
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all duration-200",
                selectedCategory === category.id
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-muted border-2 border-transparent"
              )}>
                {category.emoji}
              </div>
            )}
            <span className={cn(
              "text-xs font-medium whitespace-nowrap",
              selectedCategory === category.id
                ? "text-primary"
                : "text-muted-foreground"
            )}>
              {category.emoji} {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
