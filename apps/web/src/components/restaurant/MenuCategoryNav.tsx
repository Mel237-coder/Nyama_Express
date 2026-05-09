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
    <div className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="flex overflow-x-auto py-3 px-4 space-x-3 no-scrollbar">
        <button
          onClick={() => onSelect('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategoryId === 'all'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategoryId === category.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
