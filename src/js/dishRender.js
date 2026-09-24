import { CATEGORIES } from './categoryFilter.js';

/**
 * Định dạng số tiền sang định dạng Việt Nam Đồng (VD: 45000 -> 45.000đ)
 * @param {number} amount 
 * @returns {string}
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

/**
 * Lấy tên danh mục dựa trên ID
 * @param {string} categoryId 
 * @returns {string}
 */
export function getCategoryName(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  return cat ? cat.name : categoryId;
}

/**
 * Render danh sách món ăn dưới dạng Grid Cards hoặc hiển thị Empty State
 * @param {HTMLElement} containerEl - Container chứa danh sách món
 * @param {Array} dishes - Mảng chứa các object món ăn
 */
export function renderDishList(containerEl, dishes) {
  if (!containerEl) return;

  // Trường hợp không có món nào thỏa điều kiện (BR03)
  if (!dishes || dishes.length === 0) {
    containerEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Không tìm thấy món phù hợp.</h3>
        <p>Hãy thử chọn danh mục khác hoặc thay đổi bộ lọc tìm kiếm!</p>
      </div>
    `;
    return;
  }

  // Render lưới danh sách món
  containerEl.innerHTML = `
    <div class="dishes-grid">
      ${dishes.map(dish => createDishCardHTML(dish)).join('')}
    </div>
  `;
}

/**
 * Tạo mã HTML cho thẻ (card) của 1 món ăn
 * @param {Object} dish 
 * @returns {string} HTML string
 */
function createDishCardHTML(dish) {
  const categoryName = getCategoryName(dish.category);
  const typeBadge = dish.type === 'chay' 
    ? '<span class="badge badge-chay">🥗 Chay</span>' 
    : '<span class="badge badge-man">🍖 Mặn</span>';

  const tagsHTML = dish.tags && dish.tags.length > 0
    ? dish.tags.map(tag => `<span class="tag-chip">#${tag}</span>`).join('')
    : '';

  return `
    <article class="dish-card" data-id="${dish.id}">
      <div class="dish-image-wrapper">
        <img src="${dish.image}" alt="${dish.name}" class="dish-image" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300?text=BungOiAnGi';" />
        <span class="category-badge">${categoryName}</span>
        ${typeBadge}
      </div>
      <div class="dish-content">
        <h3 class="dish-title">${dish.name}</h3>
        <p class="dish-description">${dish.description}</p>
        <div class="dish-tags">
          ${tagsHTML}
        </div>
        <div class="dish-footer">
          <span class="dish-price">${formatCurrency(dish.price)}</span>
          <button type="button" class="btn-fav" title="Lưu yêu thích" data-id="${dish.id}">❤️</button>
        </div>
      </div>
    </article>
  `;
}

