export const DISH_TYPES = [
  { id: 'tat-ca', name: 'Tất cả', icon: '🍽️' },
  { id: 'chay', name: 'Chay', icon: '🥗' },
  { id: 'man', name: 'Mặn', icon: '🍖' }
];

export const POPULAR_TAGS = [
  'tat-ca',
  'cay',
  'no',
  'giai-khat',
  'tiet-kiem',
  'moi',
  'dam-da',
  'thanh-mat'
];

export function filterByDishType(dishes, type) {
  if (!dishes || !Array.isArray(dishes)) return [];
  if (!type || type === 'tat-ca') return dishes;
  return dishes.filter(dish => String(dish.type).toLowerCase() === String(type).toLowerCase());
}

export function filterByTag(dishes, tag) {
  if (!dishes || !Array.isArray(dishes)) return [];
  if (!tag || tag === 'tat-ca') return dishes;
  return dishes.filter(dish => dish.tags && dish.tags.includes(tag));
}

export function sortDishes(dishes, sortMode) {
  if (!dishes || !Array.isArray(dishes)) return [];

  const sorted = [...dishes];

  switch (sortMode) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

export function renderDishTypeFilter(containerEl, activeType, onTypeChange) {
  if (!containerEl) return;
  containerEl.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'type-tabs';

  DISH_TYPES.forEach(type => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `type-tab ${type.id === activeType ? 'active' : ''}`;
    btn.dataset.type = type.id;
    btn.innerHTML = `<span>${type.icon}</span><span>${type.name}</span>`;
    btn.addEventListener('click', () => onTypeChange(type.id));
    wrap.appendChild(btn);
  });

  containerEl.appendChild(wrap);
}

export function renderTagFilter(containerEl, activeTag, onTagChange) {
  if (!containerEl) return;
  containerEl.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'tag-filter';

  POPULAR_TAGS.forEach(tag => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tag-chip-btn ${tag === activeTag ? 'active' : ''}`;
    btn.textContent = tag === 'tat-ca' ? 'Tất cả tag' : `#${tag}`;
    btn.addEventListener('click', () => onTagChange(tag));
    wrap.appendChild(btn);
  });

  containerEl.appendChild(wrap);
}
