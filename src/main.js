import './style.css';
import { filterByCategory, renderCategoryTabs } from './js/categoryFilter.js';
import { filterByPrice, renderPriceFilterUI } from './js/priceFilter.js';
import { filterByDishType, filterByTag, renderDishTypeFilter, renderTagFilter, sortDishes } from './js/filterUtils.js';
import { filterByKeyword, renderSearchUI } from './js/searchFilter.js';
import { renderDishList } from './js/dishRender.js';

// Trạng thái ứng dụng (App State)
let allDishes = [];
let activeKeyword = '';
let activeCategory = 'tat-ca';
let activePriceTier = 'tat-ca';
let customMaxBudget = null;
let activeDishType = 'tat-ca';
let activeTag = 'tat-ca';
let activeSort = 'recommended';

// DOM Elements
const searchContainer = document.getElementById('search-container');
const categoryContainer = document.getElementById('category-filter-container');
const priceContainer = document.getElementById('price-filter-container');
const dishTypeContainer = document.getElementById('dish-type-filter-container');
const dishTagContainer = document.getElementById('dish-tag-filter-container');
const dishesContainer = document.getElementById('dishes-container');
const dishesCountEl = document.getElementById('dishes-count');
const sortSelectEl = document.getElementById('sort-dishes');

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
 * Xử lý khi người dùng nhập từ khóa tìm kiếm (F02)
 * @param {string} keyword 
 */
function handleSearchInput(keyword) {
  activeKeyword = keyword;
  renderApp();
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

function handleDishTypeChange(newType) {
  activeDishType = newType;
  renderApp();
}

function handleTagChange(newTag) {
  activeTag = newTag;
  renderApp();
}

function handleSortChange(newSort) {
  activeSort = newSort;
  renderApp();
}

/**
 * Cập nhật lại toàn bộ giao diện theo kết hợp đa bộ lọc
 */
function renderApp() {
  let filtered = filterByKeyword(allDishes, activeKeyword);
  filtered = filterByCategory(filtered, activeCategory);
  filtered = filterByPrice(filtered, activePriceTier, customMaxBudget);
  filtered = filterByDishType(filtered, activeDishType);
  filtered = filterByTag(filtered, activeTag);
  filtered = sortDishes(filtered, activeSort);

  renderSearchUI(searchContainer, activeKeyword, handleSearchInput);
  renderCategoryTabs(categoryContainer, activeCategory, handleCategorySelect);

  renderPriceFilterUI(
    priceContainer,
    activePriceTier,
    customMaxBudget,
    handlePriceTierSelect,
    handleCustomBudgetChange
  );

  renderDishTypeFilter(dishTypeContainer, activeDishType, handleDishTypeChange);
  renderTagFilter(dishTagContainer, activeTag, handleTagChange);

  if (dishesCountEl) {
    const total = allDishes.length;
    dishesCountEl.textContent = activeKeyword.trim()
      ? `Tìm "${activeKeyword.trim()}" — ${filtered.length}/${total} món`
      : `Hiển thị ${filtered.length} / ${total} món`;
  }

  if (sortSelectEl) {
    sortSelectEl.value = activeSort;
    sortSelectEl.onchange = (e) => handleSortChange(e.target.value);
  }

  renderDishList(dishesContainer, filtered);
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', loadDishes);
