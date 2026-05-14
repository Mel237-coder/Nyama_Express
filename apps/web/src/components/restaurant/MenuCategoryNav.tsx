import React from 'react';

interface Category {
  id: string;
  name: string;
}

interface MenuCategoryNavProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelect: (id: string) => void;
}

const MenuCategoryNav: React.FC<MenuCategoryNavProps> = ({
  categories,
  selectedCategoryId,
  onSelect
}) => {
  return (
    <div
      className="sticky top-0 z-10 px-4 py-3"
      style={{
        backgroundColor: 'rgba(10, 10, 15, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex overflow-x-auto space-x-2 no-scrollbar">
        <button
          onClick={() => onSelect('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
            selectedCategoryId === 'all'
              ? 'neon-btn'
              : 'ghost-btn'
          }`}
        >
          Tout
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              selectedCategoryId === category.id
                ? 'neon-btn'
                : 'ghost-btn'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuCategoryNav;
