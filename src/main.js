import './style.css';
import { CATEGORIES, filterByCategory, renderCategoryTabs } from './js/categoryFilter.js';
import { BUDGET_GROUPS, filterByPrice, renderPriceFilterUI } from './js/priceFilter.js';
import { DISH_TYPES, POPULAR_TAGS, filterByDishType, filterByTag, renderDishTypeFilter, renderTagFilter, sortDishes } from './js/filterUtils.js';
import { MOODS, filterByMood, renderMoodFilter } from './js/moodFilter.js';
import { filterByKeyword, renderSearchUI } from './js/searchFilter.js';
import { renderDishList } from './js/dishRender.js';
import { findDishById, pickRandomSimilar, renderDishDetail } from './js/dishDetail.js';
import { filterOutExcluded, pickRandomDish, renderRandomPanel } from './js/randomDish.js';
import { addHistory, getDuelRecords, getExcludedIds, isFavorite, saveDuelResult, toggleFavorite } from './js/storage.js';
import {
  DUEL_PHASE,
  DEFAULT_DUEL_ROUNDS,
  createDuelState,
  getDuelResult,
  nextDuelRound,
  pickDuelSide,
  renderDuelPanel
} from './js/duel.js';

// Trạng thái ứng dụng (App State)
let allDishes = [];
let currentFiltered = [];
let activeKeyword = '';
let activeCategory = 'tat-ca';
let activePriceTier = 'tat-ca';
let customMaxBudget = null;
let activeDishType = 'tat-ca';
let activeTag = 'tat-ca';
let activeMood = 'tat-ca';
let activeSort = 'recommended';
let selectedDishId = null;
let detailNotice = '';
let detailReturnFocus = null;
let rolledDishId = null;
let lastRolledId = null;
let rollMessage = '';

// F09 - Đấu món 1 vs 1
let duelState = null;
let duelRounds = DEFAULT_DUEL_ROUNDS;

// DOM Elements
const searchContainer = document.getElementById('search-container');
const categoryContainer = document.getElementById('category-filter-container');
const priceContainer = document.getElementById('price-filter-container');
const dishTypeContainer = document.getElementById('dish-type-filter-container');
const dishTagContainer = document.getElementById('dish-tag-filter-container');
const moodContainer = document.getElementById('mood-filter-container');
const activeFilterSummary = document.getElementById('active-filter-summary');
const dishesContainer = document.getElementById('dishes-container');
const detailContainer = document.getElementById('dish-detail-container');
const randomContainer = document.getElementById('random-dish-container');
const duelContainer = document.getElementById('duel-container');
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

function handleMoodChange(newMood) {
  activeMood = newMood;
  renderApp();
}

function handleSortChange(newSort) {
  activeSort = newSort;
  renderApp();
}

function resetAllFilters() {
  activeKeyword = '';
  activeCategory = 'tat-ca';
  activePriceTier = 'tat-ca';
  customMaxBudget = null;
  activeDishType = 'tat-ca';
  activeTag = 'tat-ca';
  activeMood = 'tat-ca';
  activeSort = 'recommended';
  renderApp();
}

function renderActiveFilterSummary() {
  if (!activeFilterSummary) return;

  const labels = [];
  if (activeKeyword.trim()) labels.push(`Từ khóa: ${activeKeyword.trim()}`);
  if (activeCategory !== 'tat-ca') {
    const category = CATEGORIES.find(item => item.id === activeCategory);
    if (category) labels.push(category.name);
  }
  if (activePriceTier !== 'tat-ca' && !customMaxBudget) {
    const tier = BUDGET_GROUPS.find(item => item.id === activePriceTier);
    if (tier) labels.push(tier.name);
  }
  if (customMaxBudget) labels.push(`Ngân sách tối đa ${customMaxBudget.toLocaleString('vi-VN')}đ`);
  if (activeDishType !== 'tat-ca') {
    const type = DISH_TYPES.find(item => item.id === activeDishType);
    if (type) labels.push(type.name);
  }
  if (activeTag !== 'tat-ca') {
    const tag = POPULAR_TAGS.includes(activeTag) ? `#${activeTag}` : activeTag;
    labels.push(tag);
  }
  if (activeMood !== 'tat-ca') {
    const mood = MOODS.find(item => item.id === activeMood);
    if (mood) labels.push(`${mood.icon} ${mood.label}`);
  }

  if (labels.length === 0) {
    activeFilterSummary.innerHTML = '';
    activeFilterSummary.hidden = true;
    return;
  }

  activeFilterSummary.hidden = false;
  activeFilterSummary.innerHTML = `
    <span class="active-filter-title">Đang kết hợp ${labels.length} điều kiện:</span>
    <div class="active-filter-chips">
      ${labels.map(label => `<span class="active-filter-chip">${label}</span>`).join('')}
    </div>
    <button type="button" class="btn-reset-filters">Xóa tất cả</button>
  `;
  activeFilterSummary.querySelector('.btn-reset-filters').addEventListener('click', resetAllFilters);
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
  filtered = filterByMood(filtered, activeMood);
  filtered = sortDishes(filtered, activeSort);

  currentFiltered = filtered;

  // Món đang bốc phải luôn khớp bộ lọc hiện tại, nếu không sẽ xoá kết quả cũ
  if (rolledDishId !== null && !filtered.some(dish => dish.id === rolledDishId)) {
    resetRoll();
  }

  // Kỳ đấu đang chạy chỉ hợp lệ khi mọi món tham dự vẫn khớp bộ lọc (BR01 + BR02)
  if (duelState && duelState.phase !== DUEL_PHASE.FINISHED) {
    const poolIds = new Set(getDuelPool().map(dish => dish.id));
    if (!duelState.participants.every(dish => poolIds.has(dish.id))) {
      duelState = null;
    }
  }

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
  renderMoodFilter(moodContainer, activeMood, handleMoodChange);
  renderActiveFilterSummary();

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

  renderDishList(dishesContainer, filtered, isFavorite);
  renderRandomPanelState();
  renderDuelState();
}

/* ============ F05 - Bốc món ngẫu nhiên & nút "Bốc lại" ============ */

/**
 * Xoá kết quả bốc hiện tại
 */
function resetRoll() {
  rolledDishId = null;
  lastRolledId = null;
  rollMessage = '';
}

/**
 * Lấy danh sách món ứng viên để bốc:
 * áp dụng bộ lọc hiện tại (BR01) và loại bỏ món bị loại trừ (BR02)
 * @returns {Array}
 */
function getRollPool() {
  return filterOutExcluded(currentFiltered, getExcludedIds());
}

/**
 * Bốc một món ngẫu nhiên, dùng chung cho nút "Bung! Ăn gì?" và nút "Bốc lại"
 */
function rollDish() {
  const pool = getRollPool();

  if (pool.length === 0) {
    rolledDishId = null;
    lastRolledId = null;
    rollMessage = 'Không có món nào phù hợp với lựa chọn của bạn.';
    renderRandomPanelState();
    return;
  }

  const picked = pickRandomDish(pool, lastRolledId);

  rolledDishId = picked.id;
  lastRolledId = picked.id;
  rollMessage = '';
  addHistory(picked.id, picked.name);
  renderRandomPanelState();
}

/**
 * Render lại panel bốc dựa trên state hiện tại
 */
function renderRandomPanelState() {
  const dish = rolledDishId !== null ? findDishById(allDishes, rolledDishId) : null;

  renderRandomPanel(randomContainer, {
    dish,
    message: rollMessage,
    poolSize: getRollPool().length,
    isFavorite: dish ? isFavorite(dish.id) : false
  }, {
    onRoll: rollDish,
    onReroll: rollDish,
    onViewDetail: (id) => openDishDetail(id, null),
    onToggleFavorite: (id) => {
      toggleFavorite(id);
      syncFavoriteButton(id, isFavorite(id));
      renderRandomPanelState();
    }
  });
}

/* ============ F09 - Đấu món 1 vs 1 ============ */

/**
 * Lấy danh sách món ứng viên cho kỳ đấu:
 * áp dụng bộ lọc hiện tại (BR01) và loại bỏ món bị loại trừ (BR02)
 * @returns {Array}
 */
function getDuelPool() {
  return filterOutExcluded(currentFiltered, getExcludedIds());
}

/**
 * Bắt đầu một kỳ đấu mới, xáo trộn lại toàn bộ bảng đấu
 */
function startDuel() {
  duelState = createDuelState(getDuelPool(), duelRounds);
  renderDuelState();
}

/**
 * Xử lý người dùng chọn món thắng ở lượt hiện tại (F09)
 * @param {string} side - 'left' | 'right'
 */
function handleDuelPick(side) {
  if (!duelState || duelState.phase !== DUEL_PHASE.PICKING) return;

  pickDuelSide(duelState, side);

  // Xong lượt cuối thì lưu kết quả chung cuộc xuống LocalStorage
  if (duelState.phase === DUEL_PHASE.FINISHED) {
    const result = getDuelResult(duelState);
    if (result) {
      saveDuelResult(result);
      addHistory(result.championId, result.championName);
    }
  }

  renderDuelState();
}

/**
 * Chuyển sang lượt đấu tiếp theo sau khi đã chọn xong lượt hiện tại
 */
function handleDuelNext() {
  if (!duelState) return;
  nextDuelRound(duelState);
  renderDuelState();
}

/**
 * Đổi số lượt đấu và khởi động lại kỳ đấu cho phù hợp
 * @param {number} rounds
 */
function handleDuelRoundsChange(rounds) {
  if (!Number.isFinite(rounds) || rounds < 1) return;
  duelRounds = rounds;
  startDuel();
}

/**
 * Render lại panel đấu dựa trên state hiện tại
 */
function renderDuelState() {
  // BR03: bể món quá nhỏ thì báo ngay, không cần bấm "Bắt đầu trận" mới biết
  const message = duelState || getDuelPool().length >= 2
    ? ''
    : 'Không có món nào phù hợp với lựa chọn của bạn.';

  renderDuelPanel(duelContainer, {
    duel: duelState,
    rounds: duelRounds,
    records: getDuelRecords(),
    message
  }, {
    onStart: startDuel,
    onRoundsChange: handleDuelRoundsChange,
    onPick: handleDuelPick,
    onNext: handleDuelNext
  });
}

/* ============ F04 - Trang chi tiết món ăn ============ */

/**
 * Đồng bộ nút yêu thích của một thẻ món trong danh sách phía sau modal
 * @param {number} id - ID món
 * @param {boolean} fav - Trạng thái yêu thích mới
 */
function syncFavoriteButton(id, fav) {
  const btn = dishesContainer.querySelector(`.btn-fav[data-id="${id}"]`);
  if (!btn) return;

  const label = fav ? 'Bỏ yêu thích' : 'Lưu yêu thích';
  btn.classList.toggle('active', fav);
  btn.textContent = fav ? '❤️' : '🤍';
  btn.title = label;
  btn.setAttribute('aria-label', label);
  btn.setAttribute('aria-pressed', String(fav));
}

/**
 * Render lại nội dung modal theo món đang chọn
 */
function renderSelectedDetail() {
  const dish = findDishById(allDishes, selectedDishId);
  if (!dish) {
    closeDishDetail();
    return;
  }

  renderDishDetail(detailContainer, dish, {
    isFavorite: isFavorite(dish.id),
    notice: detailNotice,
    onClose: closeDishDetail,
    onToggleFavorite: () => {
      const added = toggleFavorite(dish.id);
      detailNotice = '';
      syncFavoriteButton(dish.id, added);
      renderSelectedDetail();
    },
    onSimilar: () => {
      const next = pickRandomSimilar(allDishes, dish, getExcludedIds());
      if (!next) {
        detailNotice = 'Chưa có món nào tương tự trong danh sách hiện tại.';
        renderSelectedDetail();
        return;
      }
      selectedDishId = next.id;
      detailNotice = '';
      addHistory(next.id, next.name);
      renderSelectedDetail();
    }
  });
}

/**
 * Mở chi tiết một món ăn
 * @param {number} id - ID món
 * @param {HTMLElement|null} triggerEl - Thẻ món đã bấm, dùng để trả lại focus khi đóng
 */
function openDishDetail(id, triggerEl) {
  const dish = findDishById(allDishes, id);
  if (!dish) return;

  if (selectedDishId === null) {
    detailReturnFocus = triggerEl || null;
    document.body.classList.add('modal-open');
  }

  selectedDishId = dish.id;
  detailNotice = '';
  addHistory(dish.id, dish.name);
  renderSelectedDetail();
}

/**
 * Đóng modal chi tiết món
 */
function closeDishDetail() {
  selectedDishId = null;
  detailNotice = '';
  if (detailContainer) detailContainer.innerHTML = '';
  document.body.classList.remove('modal-open');

  if (detailReturnFocus && document.contains(detailReturnFocus)) {
    detailReturnFocus.focus();
  }
  detailReturnFocus = null;
}

/**
 * Đăng ký sự kiện cho lưới món ăn và phím tắt.
 * Chỉ đăng ký 1 lần duy nhất vì renderApp() thay nội dung #dishes-container
 * chứ không thay chính phần tử này.
 */
function initDetailEvents() {
  // Bấm nút yêu thích không được mở modal chi tiết
  dishesContainer.addEventListener('click', (e) => {
    const favBtn = e.target.closest('.btn-fav');
    if (favBtn) {
      e.stopPropagation();
      const id = Number(favBtn.dataset.id);
      syncFavoriteButton(id, toggleFavorite(id));
      return;
    }

    const card = e.target.closest('.dish-card');
    if (card) {
      openDishDetail(Number(card.dataset.id), card);
    }
  });

  // Mở chi tiết bằng bàn phím (Enter / Space) - role="button" cần hỗ trợ này
  dishesContainer.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.dish-card');
    if (!card) return;
    e.preventDefault();
    openDishDetail(Number(card.dataset.id), card);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selectedDishId !== null) {
      closeDishDetail();
    }
  });
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initDetailEvents();
  loadDishes();
});
