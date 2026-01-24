import { useRef, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { PublicCategory } from '@/hooks/usePublicMenu';
import { cn } from '@/lib/utils';

interface CategoryTabsProps {
  categories: PublicCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Auto-scroll to selected category
  useEffect(() => {
    const selectedButton = buttonRefs.current.get(selectedCategory);
    if (selectedButton && scrollRef.current) {
      const container = scrollRef.current;
      const buttonLeft = selectedButton.offsetLeft;
      const buttonWidth = selectedButton.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;

      // Center the button in view
      const targetScroll = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      container.scrollTo({ left: targetScroll, behavior: 'smooth' });
    }
  }, [selectedCategory]);

  return (
    <div className="sticky top-0 bg-background z-30 border-b border-border">
      <div className="flex items-center">
        {/* Menu Icon */}
        <button className="flex-shrink-0 p-3 text-muted-foreground hover:text-foreground">
          <Menu className="w-5 h-5" />
        </button>

        {/* Scrollable Tabs */}
        <div 
          ref={scrollRef}
          className="flex-1 flex overflow-x-auto scrollbar-hide"
        >
          {categories.filter(c => c.id !== 'all').map((category) => (
            <button
              key={category.id}
              ref={(el) => {
                if (el) buttonRefs.current.set(category.id, el);
              }}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative",
                selectedCategory === category.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {category.emoji && <span className="mr-1">{category.emoji}</span>}
              {category.name}
              
              {/* Active indicator */}
              {selectedCategory === category.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
