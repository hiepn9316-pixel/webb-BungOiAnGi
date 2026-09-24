import './style.css';
import { filterByCategory, renderCategoryTabs } from './js/categoryFilter.js';
import { renderDishList } from './js/dishRender.js';

// Trạng thái ứng dụng (App State)
let allDishes = [];
let activeCategory = 'tat-ca';

// DOM Elements
const categoryContainer = document.getElementById('category-filter-container');
const dishesContainer = document.getElementById('dishes-container');
const dishesCountEl = document.getElementById('dishes-count');

/**
 * Tải danh sách món ăn từ file JSON dữ liệu
 */
async function loadDishes() {
  try {
    const response = await fetch('/data/dishes.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allDishes = await response.json();
    renderApp();
  } catch (error) {
    console.error('Không thể tải dữ liệu món ăn:', error);
    if (dishesContainer) {
      dishesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Lỗi tải dữ liệu</h3>
          <p>Không thể kết nối với tập dữ liệu món ăn. Vui lòng kiểm tra lại!</p>
        </div>
      `;
    }
  }
}

/**
 * Xử lý khi người dùng thay đổi danh mục lọc (F03)
 * @param {string} newCategory 
 */
function handleCategorySelect(newCategory) {
  activeCategory = newCategory;
  renderApp();
}

/**
 * Cập nhật lại toàn bộ giao diện theo trạng thái hiện tại
 */
function renderApp() {
  // 1. Lọc món ăn theo danh mục
  const filteredDishes = filterByCategory(allDishes, activeCategory);

  // 2. Render thanh tab danh mục
  renderCategoryTabs(categoryContainer, activeCategory, handleCategorySelect);

  // 3. Cập nhật số lượng món
  if (dishesCountEl) {
    if (activeCategory === 'tat-ca') {
      dishesCountEl.textContent = `Tất cả (${allDishes.length} món)`;
    } else {
      dishesCountEl.textContent = `Hiển thị ${filteredDishes.length} / ${allDishes.length} món`;
    }
  }

  // 4. Render danh sách món ăn hoặc thông báo rỗng (F01 & BR03)
  renderDishList(dishesContainer, filteredDishes);
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', loadDishes);
