import './style.css';
import { CATEGORIES, filterByCategory, renderCategoryTabs } from './js/categoryFilter.js';
import { BUDGET_GROUPS, filterByPrice, renderPriceFilterUI } from './js/priceFilter.js';
import { DISH_TYPES, POPULAR_TAGS, filterByDishType, filterByTag, renderDishTypeFilter, renderTagFilter, sortDishes } from './js/filterUtils.js';
import { MOODS, filterByMood, renderMoodFilter } from './js/moodFilter.js';
import { filterByKeyword, renderSearchUI } from './js/searchFilter.js';
import { renderDishList } from './js/dishRender.js';
import { findDishById, pickRandomSimilar, renderDishDetail } from './js/dishDetail.js';
import { filterOutExcluded, pickRandomDish, renderRandomPanel } from './js/randomDish.js';
import { renderWheelPanel } from './js/spinWheel.js';
import { initializeSounds, playUiSound } from './js/sound.js';
import {
  addExcluded,
  addHistory,
  getDuelRecords,
  getExcludedIds,
  getFavoriteIds,
  isExcluded,
  isFavorite,
  removeExcluded,
  saveDuelResult,
  toggleFavorite
} from './js/storage.js';

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
let isRollAnimating = false;
let selectedWheelIds = null;
let activePage = null;
let activeFavTab = 'liked'; // 'liked' | 'excluded'

// Điều hướng phân trang theo wireframe
const PAGE_SECTIONS = {
  home: ['random', 'dishes'],
  dishes: ['dishes'],
  random: ['random'],
  wheel: ['wheel'],
  duel: ['duel'],
  favorites: ['favorites']
};

// F09 - Đấu món 1 vs 1
let duelState = null;
let duelRounds = DEFAULT_DUEL_ROUNDS;

// DOM Elements
const dishesContainer = document.getElementById('dishes-container');
const detailContainer = document.getElementById('dish-detail-container');
const randomContainer = document.getElementById('random-dish-container');
const wheelContainer = document.getElementById('wheel-container');
const duelContainer = document.getElementById('duel-container');
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
    allDishes = data;
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

  // Kỳ đấu 1vs1
  if (duelState && duelState.phase !== DUEL_PHASE.FINISHED) {
    const poolIds = new Set(getDuelPool().map(dish => dish.id));
    if (!duelState.participants.every(dish => poolIds.has(dish.id))) {
      duelState = null;
    }
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
  renderDuelState();
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
  playUiSound('roll');
  renderRandomPanelState();

  window.setTimeout(() => {
    const currentPool = getRollPool();
    isRollAnimating = false;

    if (currentPool.length === 0) {
      rolledDishId = null;
      rollMessage = 'Không có món nào phù hợp với bộ lọc hiện tại để bốc!';
      playUiSound('error');
      renderRandomPanelState();
      return;
    }

    const picked = pickRandomDish(currentPool, lastRolledId);
    playUiSound('success');
    rolledDishId = picked.id;
    lastRolledId = picked.id;
    renderRandomPanelState();
    openDishDetail(picked.id, randomContainer.querySelector('[data-action="roll"]'));
  }, 760);
}

function renderRandomPanelState() {
  const dish = rolledDishId !== null ? findDishById(allDishes, rolledDishId) : null;

  renderRandomPanel(randomContainer, {
    dish,
    message: rollMessage,
    poolSize: getRollPool().length,
    isFavorite: dish ? isFavorite(dish.id) : false,
    isRolling: isRollAnimating
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

function renderWheelPanelState() {
  const availableDishes = getRollPool();
  const availableIds = new Set(availableDishes.map(item => item.id));
  const selectedIds = selectedWheelIds === null
    ? availableDishes.map(item => item.id)
    : selectedWheelIds.filter(id => availableIds.has(id));
  const pool = availableDishes.filter(item => selectedIds.includes(item.id));
  renderWheelPanel(wheelContainer, { dishes: pool, availableDishes, selectedIds }, {
    onSelectionChange: (ids) => {
      selectedWheelIds = ids;
      renderWheelPanelState();
    },
    onSpin: (dishes) => {
      playUiSound('roll');
      return pickRandomDish(dishes);
    },
    onResult: (picked) => {
      if (!getRollPool().some(item => item.id === picked.id)) return;
      playUiSound('success');
      renderWheelPanelState();
      const trigger = wheelContainer.querySelector('.wheel-spin-controls [data-action="spin"]');
      openDishDetail(picked.id, trigger);
    },
  });
}

/* ============ F09 - Đấu món 1 vs 1 ============ */

function getDuelPool() {
  return filterOutExcluded(currentFiltered, getExcludedIds());
}

function startDuel() {
  duelState = createDuelState(getDuelPool(), duelRounds);
  renderDuelState();
}

function handleDuelPick(side) {
  if (!duelState || duelState.phase !== DUEL_PHASE.PICKING) return;

  pickDuelSide(duelState, side);

  if (duelState.phase === DUEL_PHASE.FINISHED) {
    const result = getDuelResult(duelState);
    if (result) {
      saveDuelResult(result);
      addHistory(result.championId, result.championName);
    }
  }

  renderDuelState();
}

function handleDuelNext() {
  if (!duelState) return;
  nextDuelRound(duelState);
  renderDuelState();
}

function handleDuelRoundsChange(rounds) {
  if (!Number.isFinite(rounds) || rounds < 1) return;
  duelRounds = rounds;
  startDuel();
}

function renderDuelState() {
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
            <img src="${dish.image}" alt="${dish.name}" class="excluded-img" onerror="this.src='https://via.placeholder.com/100';" />
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
    onClose: closeDishDetail,
    onToggleFavorite: () => {
      const added = toggleFavorite(dish.id);
      detailNotice = '';
      syncFavoriteButton(dish.id, added);
      renderSelectedDetail();
      renderFavoritesPanel();
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
  addHistory(dish.id, dish.name);
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
    } else if (rolledDishId !== null) dismissRollResult();
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
    if (hash === '#duel') return 'duel';
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
