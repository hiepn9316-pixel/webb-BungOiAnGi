/**
 * Danh mục món ăn hỗ trợ trong hệ thống BungOiAnGi
 */
export const CATEGORIES = [
  { id: 'tat-ca', name: 'Tất cả', icon: '🍽️' },
  { id: 'mon-nuoc', name: 'Món nước', icon: '🍜' },
  { id: 'mon-com', name: 'Món cơm', icon: '🍚' },
  { id: 'mon-kho', name: 'Món khô / Xào', icon: '🥢' },
  { id: 'an-vat', name: 'Ăn vặt', icon: '🍡' },
  { id: 'do-uong', name: 'Đồ uống', icon: '🧋' }
];

/**
 * Lọc danh sách món ăn theo mã danh mục
 * @param {Array} dishes - Danh sách món ăn ban đầu
 * @param {string} categoryId - Mã danh mục cần lọc ('tat-ca' hoặc mã cụ thể)
 * @returns {Array} Danh sách món sau khi lọc
 */
export function filterByCategory(dishes, categoryId) {
  if (!dishes || !Array.isArray(dishes)) return [];
  if (!categoryId || categoryId === 'tat-ca') {
    return dishes;
  }
  return dishes.filter(dish => dish.category === categoryId);
}

/**
 * Render thanh chọn danh mục (Category filter tabs)
 * @param {HTMLElement} containerEl - Phần tử chứa các tab danh mục
 * @param {string} activeCategoryId - Danh mục đang được chọn
 * @param {Function} onSelectCategory - Callback khi người dùng chọn danh mục mới
 */
export function renderCategoryTabs(containerEl, activeCategoryId, onSelectCategory) {
  if (!containerEl) return;

  containerEl.innerHTML = '';
  
  const navContainer = document.createElement('div');
  navContainer.className = 'category-tabs';

  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `category-tab ${cat.id === activeCategoryId ? 'active' : ''}`;
    btn.dataset.category = cat.id;

    btn.innerHTML = `
      <span class="category-icon">${cat.icon}</span>
      <span class="category-name">${cat.name}</span>
    `;

    btn.addEventListener('click', () => {
      if (cat.id !== activeCategoryId) {
        onSelectCategory(cat.id);
      }
    });

    navContainer.appendChild(btn);
  });

  containerEl.appendChild(navContainer);
}

