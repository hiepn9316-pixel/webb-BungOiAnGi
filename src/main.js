import './style.css';
import { CATEGORIES, filterByCategory, renderCategoryTabs } from './js/categoryFilter.js';
import { BUDGET_GROUPS, filterByPrice, renderPriceFilterUI } from './js/priceFilter.js';
import { DISH_TYPES, POPULAR_TAGS, filterByDishType, filterByTag, renderDishTypeFilter, renderTagFilter, sortDishes } from './js/filterUtils.js';
import { MOODS, filterByMood, renderMoodFilter } from './js/moodFilter.js';
import { filterByKeyword, renderSearchUI } from './js/searchFilter.js';
import { renderDishList } from './js/dishRender.js';
import { applyFoodImages, foodImageFallback } from './js/foodImages.js';
import { findDishById, pickRandomSimilar, renderDishDetail } from './js/dishDetail.js';
import { filterOutExcluded, pickRandomDish, renderRandomPanel } from './js/randomDish.js';
import { applyWheelFilters, renderWheelPanel, resetWheelFilters, setWheelFilter } from './js/spinWheel.js';
import { AIRDROP_PHASE, AIRDROP_TIMING, applyAirdropFilters, isAirdropBusy, renderAirdropPanel, resetAirdropFilters, setAirdropPickFilter, setAirdropPickSort } from './js/airdrop.js';
import { initializeSounds, playCrateOpenSound, playCrateRattleSound, playRevealSound, playUiSound } from './js/sound.js';
import {
  addExcluded,
  addHistory,
  getExcludedIds,
  getFavoriteIds,
  getMealRecords,
  isExcluded,
  isFavorite,
  removeExcluded,
  saveMealRecord,
  toggleFavorite
} from './js/storage.js';

import {
  MEAL_BUDGETS,
  MEAL_COURSES,
  MEAL_PREFERENCE,
  MEAL_PHASE,
  MEAL_TIMING,
  applyMealBudget,
  createMealState,
  getFilledDishes,
  getMealTotal,
  isPreferenceBoundCourse,
  matchesBudget,
  matchesPreference,
  pickCourseDish,
  renderMealPanel
} from './js/meal.js';

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
/** Modal mở ra từ nút BỤP hoặc vòng quay thì bật lớp ăn mừng, mở món khác thì không */
let isRollCelebrating = false;
/** Vòng quay đang chạy hay không, dùng để bật hiệu ứng trong lúc quay */
let isWheelSpinning = false;
let wheelPickedName = '';
let detailReturnFocus = null;
let rolledDishId = null;
let lastRolledId = null;
let rollMessage = '';
let isRollAnimating = false;
let selectedWheelIds = null;
let activePage = null;
let activeFavTab = 'liked'; // 'liked' | 'excluded'

// F10 - Hòm thính: bắn pháo → máy bay thả hòm → mở hòm quay ra món
let airdropPhase = AIRDROP_PHASE.READY;
let airdropDishId = null;
let lastAirdropId = null;
let airdropMessage = '';
let airdropTimers = [];

// Điều hướng phân trang theo wireframe
const PAGE_SECTIONS = {
  home: ['random', 'dishes'],
  dishes: ['dishes'],
  random: ['random'],
  wheel: ['wheel'],
  airdrop: ['airdrop'],
  meal: ['meal'],
  favorites: ['favorites']
};

// F11 - Dựng bữa cơm hoàn chỉnh
let mealState = createMealState();
let mealPool = [];
let mealRecords = [];
let mealRollingCourseId = null;
let mealRevealedCourseId = null;
let mealRevealTimer = null;
let mealTimers = [];

// DOM Elements
const dishesContainer = document.getElementById('dishes-container');
const detailContainer = document.getElementById('dish-detail-container');
const randomContainer = document.getElementById('random-dish-container');
const wheelContainer = document.getElementById('wheel-container');
const airdropContainer = document.getElementById('airdrop-container');
const mealContainer = document.getElementById('meal-container');
const historyContainer = document.getElementById('history-container');
const dishesCountEl = document.getElementById('dishes-count');
const activeFilterSummary = document.getElementById('active-filter-summary');

// Integrated Wireframe Explore Toolbar Elements
const exploreSearchInput = document.getElementById('explore-search-input');
const btnClearExploreSearch = document.getElementById('btn-clear-explore-search');
const filterGroupCategory = document.getElementById('filter-group-category');
const filterGroupType = document.getElementById('filter-group-type');
const filterGroupPrice = document.getElementById('filter-group-price');
const filterGroupTag = document.getElementById('filter-group-tag');
const filterGroupSort = document.getElementById('filter-group-sort');
const btnResetExploreFilters = document.getElementById('btn-reset-explore-filters');

// Quick Action Elements
const quickMoodContainer = document.getElementById('quick-mood-container');
const quickBudgetContainer = document.getElementById('quick-budget-container');
const btnViewPopular = document.getElementById('btn-view-popular');

// Favorites Elements
const favoritesContainer = document.getElementById('favorites-content');
const btnTabFavLiked = document.getElementById('btn-tab-fav-liked');
const btnTabFavExcluded = document.getElementById('btn-tab-fav-excluded');
const favLikedCountEl = document.getElementById('fav-liked-count');
const favExcludedCountEl = document.getElementById('fav-excluded-count');

/**
 * Tải danh sách món ăn từ file JSON dữ liệu
 */
async function loadDishes() {
  try {
    const response = await fetch('/data/dishes.json');
    if (!response.ok) {
      throw new Error(`Không thể tải dữ liệu (HTTP ${response.status}).`);
    }
    const data = await response.json();
    validateDishes(data);
    // Gán ảnh local theo nhóm món và bậc hiếm theo giá ngay sau khi nạp,
    // trước mọi lần render. Ảnh cũ trong JSON trỏ ra ngoài và bị gán nhầm nên bị ghi đè.
    allDishes = applyFoodImages(data);
    renderApp();
  } catch (error) {
    console.error('Không thể tải dữ liệu món ăn:', error);
    if (dishesContainer) {
      dishesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Dữ liệu món ăn không hợp lệ</h3>
          <p>${error instanceof SyntaxError ? 'File JSON bị sai cú pháp.' : error.message}</p>
        </div>
      `;
    }
  }
}

function validateDishes(data) {
  if (!Array.isArray(data)) {
    throw new Error('Dữ liệu phải là một danh sách món ăn.');
  }

  const ids = new Set();
  data.forEach((dish, index) => {
    const row = index + 1;
    if (!dish || typeof dish !== 'object' || Array.isArray(dish)) {
      throw new Error(`Món ở vị trí ${row} không phải một đối tượng hợp lệ.`);
    }
    if (!Number.isSafeInteger(dish.id) || dish.id < 1 || ids.has(dish.id)) {
      throw new Error(`Mã món ở vị trí ${row} bị thiếu, trùng hoặc không hợp lệ.`);
    }
    if (typeof dish.name !== 'string' || !dish.name.trim()) {
      throw new Error(`Tên món ở vị trí ${row} không hợp lệ.`);
    }
    if (typeof dish.price !== 'number' || !Number.isFinite(dish.price) || dish.price < 0) {
      throw new Error(`Giá món ở vị trí ${row} không hợp lệ.`);
    }
    if (typeof dish.category !== 'string' || typeof dish.type !== 'string'
      || typeof dish.description !== 'string' || typeof dish.image !== 'string'
      || (dish.tags !== undefined && (!Array.isArray(dish.tags) || !dish.tags.every(tag => typeof tag === 'string')))) {
      throw new Error(`Thông tin món ở vị trí ${row} chưa đúng định dạng.`);
    }
    ids.add(dish.id);
  });
}

function handleSearchInput(keyword) {
  activeKeyword = keyword;
  renderApp();
}

function handleCategorySelect(newCategory) {
  activeCategory = newCategory;
  renderApp();
}

function handlePriceTierSelect(newPriceTier) {
  activePriceTier = newPriceTier;
  customMaxBudget = null;
  renderApp();
}

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

function renderHistory() {
  if (!historyContainer) return;

  const history = getHistory();

  if (history.length === 0) {
    historyContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕘</div>
        <h3>Chưa có lịch sử</h3>
        <p>Những món bạn đã xem hoặc bốc sẽ xuất hiện ở đây.</p>
      </div>
    `;
    return;
  }

  historyContainer.innerHTML = `
    <div class="history-list">
      ${history.map((item, index) => `
        <button
          type="button"
          class="history-item"
          data-history-id="${item.id}"
        >
          <span class="history-number">${index + 1}</span>
          <span class="history-info">
            <strong>${item.name || `Món #${item.id}`}</strong>
            <small>${new Date(item.at).toLocaleString('vi-VN')}</small>
          </span>
        </button>
      `).join('')}
    </div>
  `;

  historyContainer.querySelectorAll('.history-item').forEach(button => {
    button.addEventListener('click', () => {
      const id = Number(button.dataset.historyId);
      openDishDetail(id, button);
    });
  });
}

function renderActiveFilterSummary() {
  if (!activeFilterSummary) return;

  const labels = [];
  if (activeKeyword.trim()) labels.push(`Từ khóa: "${activeKeyword.trim()}"`);
  if (activeCategory !== 'tat-ca') {
    const category = CATEGORIES.find(item => item.id === activeCategory);
    if (category) labels.push(category.name);
  }
  if (activePriceTier !== 'tat-ca' && !customMaxBudget) {
    const tier = BUDGET_GROUPS.find(item => item.id === activePriceTier);
    if (tier) labels.push(tier.name);
  }
  if (customMaxBudget) labels.push(`Ngân sách ≤ ${customMaxBudget.toLocaleString('vi-VN')}đ`);
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

  const hasFilter = labels.length > 0;
  if (!hasFilter) {
    activeFilterSummary.innerHTML = '';
    activeFilterSummary.hidden = true;
    if (btnResetExploreFilters) btnResetExploreFilters.hidden = true;
    return;
  }

  activeFilterSummary.hidden = false;
  activeFilterSummary.innerHTML = `
    <span class="active-filter-title">Đang lọc (${labels.length}):</span>
    <div class="active-filter-chips">
      ${labels.map(label => `<span class="active-filter-chip">${label}</span>`).join('')}
    </div>
    <button type="button" class="btn-reset-filters">✕ Xóa tất cả</button>
  `;
  activeFilterSummary.querySelector('.btn-reset-filters')?.addEventListener('click', resetAllFilters);

  if (btnResetExploreFilters) btnResetExploreFilters.hidden = false;
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

  // Món đang bốc phải luôn khớp bộ lọc hiện tại
  if (rolledDishId !== null && !filtered.some(dish => dish.id === rolledDishId)) {
    resetRoll();
  }

  // Bữa ăn đang dở thì món trên khay phải còn nằm trong bộ lọc hiện tại.
  // Chỉ dọn đúng ô có món không còn hợp lệ, giữ lại chế độ bữa và mức giá người dùng đã chọn.
  if (mealState.phase === MEAL_PHASE.BUILDING && getFilledDishes(mealState).length > 0) {
    const poolIds = new Set(getMealPool().map(dish => dish.id));
    mealState.slots.forEach(slot => {
      if (slot.dish && !poolIds.has(slot.dish.id)) slot.dish = null;
    });
  }

  // Đồng bộ Explore Toolbar controls
  if (exploreSearchInput && document.activeElement !== exploreSearchInput) {
    exploreSearchInput.value = activeKeyword;
  }
  if (btnClearExploreSearch) {
    btnClearExploreSearch.hidden = !activeKeyword.trim();
  }
  if (filterGroupCategory) filterGroupCategory.value = activeCategory;
  if (filterGroupType) filterGroupType.value = activeDishType;
  if (filterGroupPrice) filterGroupPrice.value = customMaxBudget ? 'tat-ca' : activePriceTier;
  if (filterGroupTag) filterGroupTag.value = activeTag;
  if (filterGroupSort) filterGroupSort.value = activeSort;

  // Đồng bộ Quick Mood buttons
  if (quickMoodContainer) {
    quickMoodContainer.querySelectorAll('[data-quick-mood]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.quickMood === activeMood);
    });
  }

  // Đồng bộ Quick Budget buttons
  if (quickBudgetContainer) {
    quickBudgetContainer.querySelectorAll('[data-quick-budget]').forEach(btn => {
      btn.classList.toggle('active', !customMaxBudget && btn.dataset.quickBudget === activePriceTier);
    });
  }

  // Đồng bộ Quick View Switch buttons
  if (btnViewPopular) btnViewPopular.classList.toggle('active', activeSort === 'recommended');

  renderActiveFilterSummary();

  // Hiển thị số lượng món theo wireframe (ví dụ: "384 món" hoặc "38 món")
  if (dishesCountEl) {
    const total = allDishes.length;
    dishesCountEl.textContent = activeKeyword.trim()
      ? `Tìm "${activeKeyword.trim()}" — ${filtered.length} món`
      : `${filtered.length} món`;
  }

  renderDishList(dishesContainer, filtered, isFavorite);
  renderRandomPanelState();
  renderWheelPanelState();
  // Đổi bộ lọc giữa lúc đang bay/mở hòm sẽ cắt animation, nên giữ nguyên cảnh
  if (!isAirdropBusy(airdropPhase)) renderAirdropPanelState();
  renderMealState();
  renderFavoritesPanel();
}

/* ============ F05 - Bốc món ngẫu nhiên & nút "Bốc lại" ============ */

function resetRoll() {
  rolledDishId = null;
  lastRolledId = null;
  rollMessage = '';
}

function getRollPool() {
  return filterOutExcluded(currentFiltered, getExcludedIds());
}

/**
 * Món thật sự có thể rơi xuống hòm thính: lấy từ pool đang lọc ở trang khám phá,
 * bỏ hết món đã loại rồi đi qua bộ lọc loại món / chay mặn / mức giá của hòm.
 * @returns {Array<Object>}
 */
function getAirdropPool() {
  return applyAirdropFilters(getRollPool());
}

/** Danh sách tên món hiện trong ô quay, đổi liên tục khi đang bốc */
let rollScanNames = [];
let rollScanTimer = null;

/** Bắt đầu hiệu ứng quay tên món trong ô máy bốc */
function startRollScan(pool) {
  stopRollScan();
  const names = pool.map(dish => dish.name);
  if (names.length === 0) return;

  rollScanNames = names.slice(0, 12);
  renderRandomPanelState();

  rollScanTimer = window.setInterval(() => {
    if (rollScanNames.length < 2 || !isRollAnimating) return;

    rollScanNames = [rollScanNames[rollScanNames.length - 1], ...rollScanNames.slice(0, -1)];

    // Chỉ thay nội dung ô quay, không dựng lại cả panel để không nháy nút
    const slot = randomContainer.querySelector('.roll-slot-window');
    if (slot) slot.innerHTML = rollScanNames.map(name => `<span class="roll-slot-item">${name}</span>`).join('');
  }, 90);
}

function stopRollScan() {
  if (rollScanTimer) window.clearInterval(rollScanTimer);
  rollScanTimer = null;
  rollScanNames = [];
}

function rollDish() {
  if (isRollAnimating) return;
  const pool = getRollPool();

  if (pool.length === 0) {
    playUiSound('error');
    rolledDishId = null;
    rollMessage = 'Không có món nào phù hợp với bộ lọc hiện tại để bốc!';
    renderRandomPanelState();
    return;
  }

  rolledDishId = null;
  rollMessage = '';
  isRollAnimating = true;
  playUiSound('press');
  window.setTimeout(() => playUiSound('scan'), 120);
  startRollScan(pool);
  renderRandomPanelState();

  window.setTimeout(() => {
    const currentPool = getRollPool();
    isRollAnimating = false;
    stopRollScan();

    if (currentPool.length === 0) {
      rolledDishId = null;
      rollMessage = 'Không có món nào phù hợp với bộ lọc hiện tại để bốc!';
      playUiSound('error');
      renderRandomPanelState();
      return;
    }

    const picked = pickRandomDish(currentPool, lastRolledId);
    playRevealSound(picked);
    rolledDishId = picked.id;
    lastRolledId = picked.id;
    renderRandomPanelState();
    openDishDetail(picked.id, randomContainer.querySelector('[data-action="roll"]'));
    isRollCelebrating = true;
    renderSelectedDetail();
  }, 1100);
}

function renderRandomPanelState() {
  const dish = rolledDishId !== null ? findDishById(allDishes, rolledDishId) : null;

  renderRandomPanel(randomContainer, {
    dish,
    message: rollMessage,
    poolSize: getRollPool().length,
    isFavorite: dish ? isFavorite(dish.id) : false,
    isRolling: isRollAnimating,
    scanNames: rollScanNames
  }, {
    onRoll: rollDish,
    onReroll: rollDish,
    onToggleFavorite: (id) => {
      toggleFavorite(id);
      syncFavoriteButton(id, isFavorite(id));
      renderRandomPanelState();
      renderFavoritesPanel();
    }
  });
}

function dismissRollResult() {
  rolledDishId = null;
  rollMessage = '';
  renderRandomPanelState();
  randomContainer.querySelector('[data-action="roll"]')?.focus();
}

/**
 * Món thật sự có thể đưa vào vòng quay: lấy từ pool đang lọc ở trang khám phá,
 * bỏ hết món đã loại rồi đi qua bộ lọc loại món / chay mặn / mức giá của vòng.
 * @returns {Array<Object>}
 */
function getWheelPool() {
  return applyWheelFilters(getRollPool());
}

function renderWheelPanelState() {
  const availableDishes = getWheelPool();
  const availableIds = new Set(availableDishes.map(item => item.id));
  const selectedIds = selectedWheelIds === null
    ? availableDishes.map(item => item.id)
    : selectedWheelIds.filter(id => availableIds.has(id));
  const pool = availableDishes.filter(item => selectedIds.includes(item.id));
  renderWheelPanel(wheelContainer, { dishes: pool, availableDishes, selectedIds, isSpinning: isWheelSpinning, pickedName: wheelPickedName }, {
    onSelectionChange: (ids) => {
      selectedWheelIds = ids;
      renderWheelPanelState();
    },
    onFilter: (filters) => {
      // Đang quay thì không đổi bộ lọc, render lại sẽ cắt mất hiệu ứng đang chạy
      if (isWheelSpinning) return;
      setWheelFilter(filters);
      // Món vừa rơi khỏi bộ lọc sẽ bị bỏ khỏi danh sách chọn, nếu không còn
      // món nào được chọn thì chọn lại toàn bộ để không bị kẹt ở vòng quay rỗng
      const filteredIds = new Set(getWheelPool().map(item => item.id));
      const kept = selectedWheelIds === null ? null : selectedWheelIds.filter(id => filteredIds.has(id));
      selectedWheelIds = kept && kept.length === 0 ? null : kept;
      renderWheelPanelState();
    },
    onResetFilters: () => {
      if (isWheelSpinning) return;
      resetWheelFilters();
      playUiSound('stop');
      renderWheelPanelState();
    },
    onSpin: (dishes) => {
      const picked = pickRandomDish(dishes);
      if (!picked) return null;

      isWheelSpinning = true;
      wheelPickedName = picked.name;
      playUiSound('press');
      window.setTimeout(() => playUiSound('spin'), 90);
      renderWheelPanelState();
      return picked;
    },
    onTick: (speed) => playUiSound('tick', { volume: 0.45 + speed * 0.55, rate: 0.7 + speed * 0.7 }),
    onReadout: (name) => {
      if (!name) return;
      wheelPickedName = name;
      const readout = wheelContainer.querySelector('.wheel-readout-item');
      if (readout) {
        readout.textContent = name;
        readout.style.animation = 'none';
        void readout.offsetHeight;
        readout.style.animation = '';
      }
    },
    onCancel: () => {
      isWheelSpinning = false;
      wheelPickedName = '';
      renderWheelPanelState();
    },
    onResult: (picked) => {
      isWheelSpinning = false;
      wheelPickedName = '';
      if (!getWheelPool().some(item => item.id === picked.id)) return;
      playRevealSound(picked);
      renderWheelPanelState();

      // Để người dùng thấy vòng quay dừng và nổ sáng trước khi modal đè lên
      const stage = wheelContainer.querySelector('.wheel-stage');
      const readout = wheelContainer.querySelector('.wheel-readout');
      stage?.setAttribute('data-burst', 'true');
      if (readout) {
        readout.innerHTML = `<span class="wheel-readout-item is-winner">🏆 ${picked.name}</span>`;
      }
      stage?.setAttribute('data-winner', 'true');

      window.setTimeout(() => {
        stage?.removeAttribute('data-burst');
        stage?.removeAttribute('data-winner');
        const trigger = wheelContainer.querySelector('.wheel-spin-controls [data-action="spin"]');
        openDishDetail(picked.id, trigger);
        isRollCelebrating = true;
        renderSelectedDetail();
      }, 900);
    },
  });
}

/* ============ F10 - Hòm thính (Bắn pháo → Máy bay thả hòm → Mở hòm) ============ */

function renderAirdropPanelState(keepRevealedId = null) {
  if (!airdropContainer) return;

  const pool = getAirdropPool();

  // Món vừa bấm ✕ vẫn giữ thẻ quà lại để bấm − hoàn tác được
  if (airdropDishId !== null && airdropDishId !== keepRevealedId && !pool.some(item => item.id === airdropDishId)) {
    airdropPhase = AIRDROP_PHASE.READY;
    airdropDishId = null;
    airdropMessage = '';
  }

  renderAirdropPanel(airdropContainer, {
    phase: airdropPhase,
    dish: airdropDishId !== null ? findDishById(allDishes, airdropDishId) : null,
    message: airdropMessage,
    basePool: getRollPool(),
    isFavorite: airdropDishId !== null ? isFavorite(airdropDishId) : false,
    isExcluded: airdropDishId !== null ? isExcluded(airdropDishId) : false
  }, {
    onLaunch: launchAirdrop,
    onOpen: openAirdrop,
    onViewDetail: (id, trigger) => openDishDetail(id, trigger),
    onToggleFavorite: (id) => {
      const added = toggleFavorite(id);
      syncFavoriteButton(id, added);
      renderAirdropPanelState();
      renderFavoritesPanel();
    },
    onToggleExclude: (id) => {
      const dishName = findDishById(allDishes, id)?.name || 'món này';
      const removed = !isExcluded(id);

      if (removed) {
        addExcluded(id);
        airdropMessage = `Đã bỏ "${dishName}" khỏi hòm thính, những lần sau sẽ không rơi món này nữa.`;
      } else {
        removeExcluded(id);
        airdropMessage = `Đã cho "${dishName}" quay lại hòm thính.`;
      }

      playUiSound(removed ? 'error' : 'success');
      renderRandomPanelState();
      renderWheelPanelState();
      renderMealState();
      renderFavoritesPanel();
      renderAirdropPanelState(id);
    },
    onSortPick: (sort) => {
      setAirdropPickSort(sort);
      renderAirdropPanelState();
    },
    onSearchPick: (keyword) => {
      setAirdropPickFilter({ keyword });
      renderAirdropPanelState();
    },
    onFilterPick: (filters) => {
      setAirdropPickFilter(filters);
      renderAirdropPanelState();
    },
    onResetFilters: () => {
      resetAirdropFilters();
      airdropMessage = 'Đã bỏ lọc, hòm thính sẽ bốc lại toàn bộ danh sách.';
      playUiSound('stop');
      renderAirdropPanelState();
    },
    onClose: closeAirdropReward
  });
}

/** Đóng thẻ quà, sẵn sàng gọi hòm mới */
function closeAirdropReward() {
  clearAirdropTimers();
  airdropPhase = AIRDROP_PHASE.READY;
  airdropDishId = null;
  airdropMessage = 'Đã đóng hòm thính. Bấn pháo để gọi máy bay lần nữa.';
  playUiSound('stop');
  renderAirdropPanelState();
}

function clearAirdropTimers() {
  airdropTimers.forEach(timer => window.clearTimeout(timer));
  airdropTimers = [];
}

function scheduleAirdropPhase(nextPhase, delay, onDone) {
  const timer = window.setTimeout(() => {
    airdropTimers = airdropTimers.filter(item => item !== timer);
    airdropPhase = nextPhase;
    onDone?.();
    renderAirdropPanelState();
  }, delay);

  airdropTimers.push(timer);
}

function launchAirdrop() {
  if (isAirdropBusy(airdropPhase)) return;

  if (getAirdropPool().length === 0) {
    playUiSound('error');
    airdropMessage = 'Không có món nào phù hợp với bộ lọc hiện tại để hòm thính rơi xuống!';
    renderAirdropPanelState();
    return;
  }

  playUiSound('launch');
  airdropDishId = null;
  airdropMessage = '';
  clearAirdropTimers();
  airdropPhase = AIRDROP_PHASE.LAUNCHING;
  renderAirdropPanelState();

  // Pháo vút lên trời → máy bay bay qua thả hòm → hòm hạ cánh
  scheduleAirdropPhase(AIRDROP_PHASE.INCOMING, AIRDROP_TIMING.LAUNCHING, () => {
    playUiSound('drop');
    scheduleAirdropPhase(AIRDROP_PHASE.DROPPED, AIRDROP_TIMING.INCOMING, () => {
      playUiSound('thud');
    });
  });
}

function openAirdrop() {
  if (airdropPhase !== AIRDROP_PHASE.DROPPED) return;

  const pool = getAirdropPool();
  if (pool.length === 0) {
    playUiSound('error');
    airdropMessage = 'Không có món nào phù hợp với bộ lọc hiện tại để hòm thính rơi xuống!';
    renderAirdropPanelState();
    return;
  }

  // Chỉ bốc trong đúng những món khớp bộ lọc của hòm thính
  const picked = pickRandomDish(pool, lastAirdropId) || pool[0];
  lastAirdropId = picked.id;
  airdropDishId = picked.id;
  airdropMessage = '';
  playCrateOpenSound();

  airdropPhase = AIRDROP_PHASE.OPENING;
  renderAirdropPanelState();

  clearAirdropTimers();
  scheduleAirdropPhase(AIRDROP_PHASE.REVEALED, AIRDROP_TIMING.OPENING, () => {
    // Tiếng lộ món đổi theo bậc hiếm của món vừa trúng
    playRevealSound(picked);
    addHistory(picked.id, picked.name);
    renderHistory();
  });
}

/* ============ F11 - Dựng bữa cơm hoàn chỉnh ============ */

/**
 * Pool món dùng để dựng bữa: tôn trọng bộ lọc hiện tại ở trang Khám phá, bỏ món đã loại
 * rồi đi qua mức giá của riêng bữa ăn. Phần dựng khay và phần bốc món cùng gọi hàm này
 * nên món hiện trên khay luôn nằm trong mức giá đang chọn.
 */
function getMealPool() {
  return applyMealBudget(filterOutExcluded(currentFiltered, getExcludedIds()), mealState.budget);
}

/** Hủy mọi hẹn giờ đang chờ của bữa ăn để tránh render vào phần tử đã bị thay */
function clearMealTimers() {
  mealTimers.forEach(id => window.clearTimeout(id));
  mealTimers = [];
}

function scheduleMeal(delay, callback) {
  mealTimers.push(window.setTimeout(callback, delay));
}

/** Bốc một món cho đúng suất ăn, ghi đè món cũ nếu ô đó đã có món */
function fillMealSlot(courseId) {
  const course = MEAL_COURSES.find(item => item.id === courseId);
  if (!course) return false;

  const slotIndex = mealState.slots.findIndex(slot => slot.courseId === courseId);
  if (slotIndex === -1) return false;

  const otherDishes = mealState.slots
    .filter((slot, index) => index !== slotIndex)
    .map(slot => slot.dish)
    .filter(Boolean);

  const dish = pickCourseDish(getMealPool(), course, otherDishes, mealState.preference);
  if (!dish) return false;

  mealState.slots[slotIndex].dish = dish;
  return true;
}

/**
 * Món vừa lộ ra khỏi hộp: giữ cờ hiệu ứng trong một khung hình rồi tự tắt,
 * không cần vẽ lại DOM vì animation đã chạy xong.
 */
function revealMealSlot(courseId) {
  fillMealSlot(courseId);
  mealRollingCourseId = null;
  mealRevealedCourseId = courseId;
  renderMealState();

  // Bốc liên tiếp nhiều suất thì chỉ giữ cờ cho món vừa lộ ra gần nhất
  window.clearTimeout(mealRevealTimer);
  mealRevealTimer = window.setTimeout(() => {
    mealRevealedCourseId = null;
  }, MEAL_TIMING.REVEAL);
}

/**
 * Bốc một suất ăn: lắc hộp trước, đợi hết thời lượng lắc rồi mới mở nắp lộ món
 */
function handleMealRoll(courseId) {
  if (mealRollingCourseId || mealState.phase !== MEAL_PHASE.BUILDING) return;
  if (!getMealPool().length) return;

  clearMealTimers();
  mealRevealedCourseId = null;
  mealRollingCourseId = courseId;
  playCrateRattleSound();
  renderMealState();

  scheduleMeal(MEAL_TIMING.RATTLE, () => revealMealSlot(courseId));
}

/** Bốc dần từng suất để người dùng thấy diễn tiến, mỗi suất cách nhau một nhịp */
function handleMealRollAll() {
  if (mealRollingCourseId || mealState.phase !== MEAL_PHASE.BUILDING) return;
  if (!getMealPool().length) return;

  clearMealTimers();
  const queue = MEAL_COURSES
    .map(course => course.id)
    .filter(courseId => !mealState.slots.find(slot => slot.courseId === courseId)?.dish);

  if (queue.length === 0) return;
  let index = 0;

  const rollNext = () => {
    if (index >= queue.length) return;

    const courseId = queue[index];
    mealRevealedCourseId = null;
    mealRollingCourseId = courseId;
    playCrateRattleSound();
    renderMealState();

    scheduleMeal(MEAL_TIMING.RATTLE, () => {
      revealMealSlot(courseId);
      index += 1;

      // Nghỉ một nhịp giữa các suất để không thành một màn lắc liên tục
      if (index < queue.length) scheduleMeal(280, rollNext);
    });
  };

  rollNext();
}

/** Dọn bữa: chạy hiệu ứng dọn món rồi mới chốt kết quả và ghi vào sổ */
function handleMealServe() {
  const dishes = getFilledDishes(mealState);
  if (dishes.length === 0 || mealState.phase !== MEAL_PHASE.BUILDING) return;

  clearMealTimers();
  mealState.phase = MEAL_PHASE.SERVING;
  renderMealState();

  scheduleMeal(MEAL_TIMING.SERVE, () => {
    // Giữ mảng đúng thứ tự suất ăn, suất nào trống thì để null.
    // Nén mảng sẽ làm lệch chỉ số và phiếu bữa ăn gắn nhầm tên món vào suất khác.
    const servedDishes = MEAL_COURSES.map(course => mealState.slots.find(slot => slot.courseId === course.id)?.dish || null);
    const filledDishes = servedDishes.filter(Boolean);
    const total = getMealTotal(servedDishes);

    mealRecords = saveMealRecord(filledDishes, total);
    filledDishes.forEach(dish => addHistory(dish.id, dish.name));
    renderHistory();

    mealState.phase = MEAL_PHASE.SERVED;
    mealState.servedMeal = { dishes: servedDishes, total, budget: mealState.budget, at: Date.now() };
    renderMealState();

    playUiSound('plate');
    window.setTimeout(() => playUiSound('steam'), 420);
  });
}

/** Xóa sạch khay để dọn bữa mới, giữ lại chế độ bữa và mức giá đang chọn */
function handleMealNew() {
  clearMealTimers();
  window.clearTimeout(mealRevealTimer);
  const keepPreference = mealState.preference;
  const keepBudget = mealState.budget;
  mealState = createMealState();
  mealState.preference = keepPreference;
  mealState.budget = keepBudget;
  mealRollingCourseId = null;
  mealRevealedCourseId = null;
  renderMealState();
}

function handleMealCloseServed() {
  clearMealTimers();
  mealState.phase = MEAL_PHASE.BUILDING;
  renderMealState();
}

/** Đổi giữa tất cả / bữa chay / bữa mặn */
function handleMealSetPreference(preference) {
  if (!Object.values(MEAL_PREFERENCE).includes(preference)) return;
  if (mealState.preference === preference) return;

  mealState.preference = preference;
  // Chỉ món chính và món ăn kèm mới bị ép theo chế độ, đồ uống và tráng miệng vốn tự do
  // nên đổi kiểu bữa không được dọn những ô đó
  mealState.slots.forEach((slot, index) => {
    if (slot.dish && isPreferenceBoundCourse(slot.courseId) && !matchesPreference(slot.dish, preference)) {
      mealState.slots[index].dish = null;
    }
  });
  playUiSound('tap');
  renderMealState();
}

/** Đổi mức giá của bữa ăn, món trên khay vượt mức mới thì dọn ô đó cho khay không bị lệch */
function handleMealSetBudget(budget) {
  if (!MEAL_BUDGETS.some(item => item.id === budget)) return;
  if (mealState.budget === budget) return;

  mealState.budget = budget;
  mealState.slots.forEach((slot, index) => {
    if (slot.dish && !matchesBudget(slot.dish, budget)) mealState.slots[index].dish = null;
  });
  playUiSound('tap');
  renderMealState();
}

function renderMealState() {
  mealPool = getMealPool();
  if (mealRecords.length === 0) mealRecords = getMealRecords();

  renderMealPanel(mealContainer, {
    meal: mealState,
    pool: mealPool,
    history: mealRecords,
    spinningCourseId: mealRollingCourseId,
    revealedCourseId: mealRevealedCourseId
  }, {
    onRollCourse: handleMealRoll,
    onRollAll: handleMealRollAll,
    onServe: handleMealServe,
    onNewMeal: handleMealNew,
    onCloseServed: handleMealCloseServed,
    onSetPreference: handleMealSetPreference,
    onSetBudget: handleMealSetBudget,
    onViewDetail: (id, trigger) => openDishDetail(id, trigger),
    onRattleEnd: () => playUiSound('plating'),
    // Ô trên khay là mục tiêu sự kiện, tự phát âm báo để không bị tiếng tap toàn cục đè lên
    onHover: () => playUiSound('tap')
  });
}

/* ============ GU CỦA TÔI (Yêu thích & Loại trừ) ============ */

function renderFavoritesPanel() {
  if (!favoritesContainer) return;

  const favoriteIds = getFavoriteIds();
  const excludedIds = getExcludedIds();

  if (favLikedCountEl) favLikedCountEl.textContent = favoriteIds.length;
  if (favExcludedCountEl) favExcludedCountEl.textContent = excludedIds.length;

  const navFavBadge = document.getElementById('nav-fav-badge');
  if (navFavBadge) {
    navFavBadge.textContent = favoriteIds.length;
    navFavBadge.hidden = favoriteIds.length === 0;
  }

  if (btnTabFavLiked && btnTabFavExcluded) {
    btnTabFavLiked.classList.toggle('active', activeFavTab === 'liked');
    btnTabFavExcluded.classList.toggle('active', activeFavTab === 'excluded');
  }

  if (activeFavTab === 'liked') {
    const favDishes = allDishes.filter(d => favoriteIds.includes(d.id));

    if (favDishes.length === 0) {
      favoritesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❤️</div>
          <h3>Chưa có món yêu thích</h3>
          <p>Bấm vào biểu tượng trái tim (❤️) ở góc món ăn để lưu lại gu ẩm thực của bạn!</p>
        </div>
      `;
      return;
    }

    favoritesContainer.innerHTML = `
      <div class="favorites-action-bar">
        <p class="favorites-summary">Bạn đang có <strong>${favDishes.length}</strong> món trong gu yêu thích.</p>
        <button type="button" class="btn-roll-fav" id="btn-roll-fav">🎲 Bốc ngẫu nhiên từ Gu của tôi</button>
      </div>
      <div class="dishes-grid" id="favorites-grid"></div>
    `;

    const grid = favoritesContainer.querySelector('#favorites-grid');
    renderDishList(grid, favDishes, isFavorite);

    const rollFavBtn = favoritesContainer.querySelector('#btn-roll-fav');
    if (rollFavBtn) {
      rollFavBtn.addEventListener('click', () => {
        const picked = pickRandomDish(favDishes);
        if (picked) {
          openDishDetail(picked.id, null);
        }
      });
    }
  } else {
    const excludedDishes = allDishes.filter(d => excludedIds.includes(d.id));

    if (excludedDishes.length === 0) {
      favoritesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✨</div>
          <h3>Không có món bị loại trừ</h3>
          <p>Tất cả các món đều sẵn sàng xuất hiện trong gợi ý và thực đơn của bạn.</p>
        </div>
      `;
      return;
    }

    favoritesContainer.innerHTML = `
      <div class="favorites-action-bar">
        <p class="favorites-summary">Danh sách <strong>${excludedDishes.length}</strong> món bạn không muốn gặp lại.</p>
      </div>
      <div class="excluded-grid">
        ${excludedDishes.map(dish => `
          <div class="excluded-item-card" data-id="${dish.id}">
            <img src="${dish.image}" alt="${dish.name}" class="excluded-img" onerror="this.onerror=null;this.src='${foodImageFallback(dish.name)}';" />
            <div class="excluded-info">
              <h4>${dish.name}</h4>
              <span>${dish.price.toLocaleString('vi-VN')}đ</span>
            </div>
            <button type="button" class="btn-unexclude" data-id="${dish.id}">↩️ Bỏ loại trừ</button>
          </div>
        `).join('')}
      </div>
    `;

    favoritesContainer.querySelectorAll('.btn-unexclude').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        removeExcluded(id);
        renderApp();
      });
    });
  }
}

/* ============ F04 - Trang chi tiết món ăn ============ */

function syncFavoriteButton(id, fav) {
  document.querySelectorAll(`.btn-fav[data-id="${id}"]`).forEach(btn => {
    const label = fav ? 'Bỏ yêu thích' : 'Lưu yêu thích';
    btn.classList.toggle('active', fav);
    btn.textContent = fav ? '❤️' : '🤍';
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-pressed', String(fav));
  });
}

function renderSelectedDetail() {
  const dish = findDishById(allDishes, selectedDishId);
  if (!dish) {
    closeDishDetail();
    return;
  }

  renderDishDetail(detailContainer, dish, {
    isFavorite: isFavorite(dish.id),
    isExcluded: isExcluded(dish.id),
    notice: detailNotice,
    celebrate: isRollCelebrating,
    onClose: closeDishDetail,
    onToggleFavorite: () => {
      const added = toggleFavorite(dish.id);
      detailNotice = '';
      syncFavoriteButton(dish.id, added);
      renderSelectedDetail();
      renderFavoritesPanel();
      // Danh sách món yêu thích trong hòm thính phụ thuộc vào gu của người dùng
      if (!isAirdropBusy(airdropPhase)) renderAirdropPanelState();
    },

    onExclude: () => {
      const excluded = isExcluded(dish.id);

      if (excluded) {
        removeExcluded(dish.id);
        detailNotice = `Đã bỏ "${dish.name}" khỏi danh sách không thích.`;
      } else {
        addExcluded(dish.id);
        detailNotice = `Đã thêm "${dish.name}" vào danh sách không thích. Món này sẽ không xuất hiện khi bốc ngẫu nhiên.`;
      }

      renderSelectedDetail();
      renderRandomPanelState();
      renderWheelPanelState();
      renderAirdropPanelState();
      renderFavoritesPanel();
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
      renderHistory();
      renderSelectedDetail();
    }
  });
}

function openDishDetail(id, triggerEl) {
  const dish = findDishById(allDishes, id);
  if (!dish) return;

  if (selectedDishId === null) {
    detailReturnFocus = triggerEl || null;
    document.body.classList.add('modal-open');
  }

  selectedDishId = dish.id;
  detailNotice = '';
  isRollCelebrating = false;
  addHistory(dish.id, dish.name);
  renderHistory();
  renderSelectedDetail();
}

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

function initDetailEvents() {
  document.addEventListener('click', (e) => {
    const favBtn = e.target.closest('.btn-fav');
    if (favBtn) {
      e.stopPropagation();
      const id = Number(favBtn.dataset.id);
      const isFav = toggleFavorite(id);
      syncFavoriteButton(id, isFav);
      renderFavoritesPanel();
      // Danh sách món yêu thích trong hòm thính phụ thuộc vào gu của người dùng
      if (!isAirdropBusy(airdropPhase)) renderAirdropPanelState();
      return;
    }

    const card = e.target.closest('.dish-card');
    if (card && dishesContainer && dishesContainer.contains(card)) {
      openDishDetail(Number(card.dataset.id), card);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (selectedDishId !== null) {
      closeDishDetail();
    } else if (rolledDishId !== null) {
      dismissRollResult();
    } else if (airdropPhase === AIRDROP_PHASE.REVEALED) {
      closeAirdropReward();
    }
  });
}

function initExploreControls() {
  // Search bar
  if (exploreSearchInput) {
    exploreSearchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
  }
  if (btnClearExploreSearch) {
    btnClearExploreSearch.addEventListener('click', () => {
      handleSearchInput('');
      exploreSearchInput?.focus();
    });
  }

  // Filter toolbar selects
  if (filterGroupCategory) {
    filterGroupCategory.addEventListener('change', (e) => handleCategorySelect(e.target.value));
  }
  if (filterGroupType) {
    filterGroupType.addEventListener('change', (e) => handleDishTypeChange(e.target.value));
  }
  if (filterGroupPrice) {
    filterGroupPrice.addEventListener('change', (e) => handlePriceTierSelect(e.target.value));
  }
  if (filterGroupTag) {
    filterGroupTag.addEventListener('change', (e) => handleTagChange(e.target.value));
  }
  if (filterGroupSort) {
    filterGroupSort.addEventListener('change', (e) => handleSortChange(e.target.value));
  }
  if (btnResetExploreFilters) {
    btnResetExploreFilters.addEventListener('click', resetAllFilters);
  }

  // Quick Mood buttons
  if (quickMoodContainer) {
    quickMoodContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quick-mood]');
      if (!btn) return;
      handleMoodChange(btn.dataset.quickMood);
    });
  }

  // Quick Budget buttons
  if (quickBudgetContainer) {
    quickBudgetContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-quick-budget]');
      if (!btn) return;
      handlePriceTierSelect(btn.dataset.quickBudget);
    });
  }

  // Quick View Switch buttons
  if (btnViewPopular) {
    btnViewPopular.addEventListener('click', () => {
      handleSortChange('recommended');
    });
  }
  // Favorites tabs
  if (btnTabFavLiked) {
    btnTabFavLiked.addEventListener('click', () => {
      activeFavTab = 'liked';
      renderFavoritesPanel();
    });
  }
  if (btnTabFavExcluded) {
    btnTabFavExcluded.addEventListener('click', () => {
      activeFavTab = 'excluded';
      renderFavoritesPanel();
    });
  }
}

function initNavigation() {
  const pageLinks = [...document.querySelectorAll('[data-page]')];

  const navigateToPage = (page, updateHistory = true, scrollToTarget = true) => {
    const nextPage = PAGE_SECTIONS[page] ? page : 'home';
    if (nextPage === 'home' && activePage !== null && activePage !== 'home') {
      resetAllFilters();
    }

    const visibleSections = PAGE_SECTIONS[nextPage];
    document.querySelectorAll('[data-app-section]').forEach((section) => {
      section.classList.toggle('is-page-hidden', !visibleSections.includes(section.id));
    });
    document.querySelectorAll('.nav-link[data-page]').forEach((link) => {
      const active = link.dataset.page === nextPage;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const navFavBtn = document.getElementById('nav-fav-btn');
    if (navFavBtn) {
      navFavBtn.classList.toggle('active', nextPage === 'favorites');
    }
    activePage = nextPage;

    const currentLink = pageLinks.find(link => link.dataset.page === nextPage && link.classList.contains('nav-link'));
    if (updateHistory && currentLink) {
      history.pushState({ page: nextPage }, '', currentLink.getAttribute('href'));
    }
    if (scrollToTarget && currentLink) {
      requestAnimationFrame(() => {
        document.getElementById(currentLink.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  pageLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navigateToPage(link.dataset.page);
    });
  });

  const pageFromHash = () => {
    const hash = location.hash;
    if (hash === '#favorites') return 'favorites';
    if (hash === '#dishes') return 'dishes';
    if (hash === '#wheel') return 'wheel';
    if (hash === '#airdrop') return 'airdrop';
    if (hash === '#meal') return 'meal';
    return 'home';
  };

  navigateToPage(pageFromHash(), false, false);
  window.addEventListener('popstate', () => navigateToPage(pageFromHash(), false));
}

// Khởi chạy ứng dụng khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {


  initializeSounds();
  initNavigation();
  initDetailEvents();
  initExploreControls();
  loadDishes();
});
