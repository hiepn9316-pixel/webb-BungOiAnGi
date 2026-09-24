import './style.css';
import { filterByCategory, renderCategoryTabs } from './js/categoryFilter.js';
import { filterByPrice, renderPriceFilterUI } from './js/priceFilter.js';
import { renderDishList } from './js/dishRender.js';

// Trạng thái ứng dụng (App State)
let allDishes = [];
let activeCategory = 'tat-ca';
let activePriceTier = 'tat-ca';
let customMaxBudget = null;

// DOM Elements
const categoryContainer = document.getElementById('category-filter-container');
const priceContainer = document.getElementById('price-filter-container');
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
 * Xử lý khi chọn Danh mục (F03)
 * @param {string} newCategory 
 */
function handleCategorySelect(newCategory) {
  activeCategory = newCategory;
  renderApp();
}

/**
 * Xử lý khi chọn Khoảng giá (F03 & F07)
 * @param {string} newPriceTier 
 */
function handlePriceTierSelect(newPriceTier) {
  activePriceTier = newPriceTier;
  customMaxBudget = null; // Reset ngân sách nhập tay khi chọn tab khoảng giá
  renderApp();
}

/**
 * Xử lý khi nhập Ngân sách tùy chỉnh (F07)
 * @param {number|null} newBudget 
 */
function handleCustomBudgetChange(newBudget) {
  customMaxBudget = newBudget;
  renderApp();
}

/**
 * Cập nhật lại toàn bộ giao diện theo kết hợp đa bộ lọc
 */
function renderApp() {
  // 1. Lọc theo Danh mục
  let filtered = filterByCategory(allDishes, activeCategory);

  // 2. Lọc theo Khoảng giá / Ngân sách
  filtered = filterByPrice(filtered, activePriceTier, customMaxBudget);

  // 3. Render thanh tab danh mục
  renderCategoryTabs(categoryContainer, activeCategory, handleCategorySelect);

  // 4. Render thanh lọc khoảng giá & ngân sách
  renderPriceFilterUI(
    priceContainer, 
    activePriceTier, 
    customMaxBudget, 
    handlePriceTierSelect, 
    handleCustomBudgetChange
  );

  // 5. Cập nhật số lượng món hiển thị
  if (dishesCountEl) {
    dishesCountEl.textContent = `Hiển thị ${filtered.length} / ${allDishes.length} món`;
  }

  // 6. Render danh sách món ăn hoặc thông báo rỗng (F01 & BR03)
  renderDishList(dishesContainer, filtered);
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', loadDishes);
