import { formatCurrency, getCategoryName } from './dishRender.js';
import { DISH_TYPES } from './filterUtils.js';

/**
 * Loại bỏ các món nằm trong danh sách loại trừ của người dùng (BR02)
 * @param {Array} dishes - Danh sách món ăn
 * @param {Array<number>} excludedIds - Danh sách ID bị loại
 * @returns {Array} Danh sách món sau khi loại trừ
 */
export function filterOutExcluded(dishes, excludedIds = []) {
  if (!dishes || !Array.isArray(dishes)) return [];
  const skipIds = new Set(excludedIds.map(Number));
  return dishes.filter(dish => !skipIds.has(dish.id));
}

/**
 * Bốc ngẫu nhiên một món từ danh sách, ưu tiên món khác món vừa bốc (F05)
 * @param {Array} pool - Danh sách món ứng viên (đã áp dụng bộ lọc và đã loại trừ)
 * @param {number|null} lastPickedId - ID món vừa bốc trước đó
 * @returns {Object|null} Món được bốc hoặc null nếu danh sách rỗng (BR03)
 */
export function pickRandomDish(pool, lastPickedId = null) {
  if (!pool || !Array.isArray(pool) || pool.length === 0) return null;

  // Ưu tiên món khác món vừa bốc để nút "Bốc lại" luôn ra món mới
  const fresh = lastPickedId === null
    ? pool
    : pool.filter(dish => dish.id !== lastPickedId);

  // Chỉ món nào trong danh sách thì mới cho phép bốc lại món đó
  const candidates = fresh.length > 0 ? fresh : pool;

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Tạo nội dung thẻ món kết quả bốc
 * @param {Object} dish - Món được bốc
 * @param {boolean} isFavorite - Món đang được yêu thích hay không
 * @param {boolean} animate - Có chạy hiệu ứng xuất hiện hay không
 * @returns {string} HTML string
 */
function buildResultCardHTML(dish, isFavorite, animate) {
  const type = DISH_TYPES.find(t => t.id === dish.type);
  const typeBadge = type
    ? `<span class="detail-badge ${dish.type === 'chay' ? 'detail-badge-chay' : 'detail-badge-man'}">${type.icon} ${type.name}</span>`
    : '';

  const tagsHTML = (dish.tags || [])
    .map(tag => `<span class="tag-chip">#${tag}</span>`)
    .join('');

  return `
    <div class="roll-result-card${animate ? ' roll-result-card--animate' : ''}" data-id="${dish.id}">
      <img
        class="roll-result-image"
        src="${dish.image}"
        alt="${dish.name}"
        onerror="this.onerror=null;this.src='https://via.placeholder.com/400x300?text=BungOiAnGi';"
      />
      <div class="roll-result-body">
        <div class="detail-badges">
          <span class="detail-badge">🍽️ ${getCategoryName(dish.category)}</span>
          ${typeBadge}
        </div>
        <h3 class="roll-result-name">${dish.name}</h3>
        <p class="roll-result-desc">${dish.description}</p>
        <div class="detail-tags">${tagsHTML}</div>
        <div class="roll-result-footer">
          <span class="roll-result-price">${formatCurrency(dish.price)}</span>
          <button
            type="button"
            class="btn-fav${isFavorite ? ' active' : ''}"
            data-id="${dish.id}"
            title="${isFavorite ? 'Bỏ yêu thích' : 'Lưu yêu thích'}"
            aria-label="${isFavorite ? 'Bỏ yêu thích' : 'Lưu yêu thích'}"
            aria-pressed="${isFavorite}"
          >${isFavorite ? '❤️' : '🤍'}</button>
        </div>
        <div class="roll-result-actions">
          <button type="button" class="btn-roll-reroll" data-action="reroll">🎲 Bốc lại</button>
          <button type="button" class="btn-roll-detail" data-action="detail">👀 Xem chi tiết</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render khu vực bốc món ngẫu nhiên (F05)
 * @param {HTMLElement} containerEl - Container chứa panel bốc
 * @param {Object} state - { dish, message, poolSize, isFavorite }
 * @param {Object} handlers - { onRoll, onReroll, onViewDetail, onToggleFavorite }
 */
export function renderRandomPanel(containerEl, state, handlers = {}) {
  if (!containerEl) return;

  const { dish = null, message = '', poolSize = 0, isFavorite = false } = state;
  const { onRoll, onReroll, onViewDetail, onToggleFavorite } = handlers;

  // Chỉ chạy hiệu ứng khi món bốc thực sự thay đổi, không re-animate khi đổi bộ lọc
  const dishKey = dish ? String(dish.id) : '';
  const animate = Boolean(dish) && containerEl.dataset.renderedDishId !== dishKey;
  containerEl.dataset.renderedDishId = dishKey;

  let resultHTML = `
    <div class="roll-idle">
      <span class="roll-idle-icon">🍽️</span>
      <p>Chưa bốc món nào. Bấm nút <b>Bung! Ăn gì?</b> để bắt đầu!</p>
    </div>
  `;

  if (message) {
    resultHTML = `
      <div class="roll-error" role="alert">
        <span class="roll-error-icon">🚫</span>
        <p>${message}</p>
      </div>
    `;
  } else if (dish) {
    resultHTML = buildResultCardHTML(dish, isFavorite, animate);
  }

  containerEl.innerHTML = `
    <div class="random-panel">
      <div class="random-panel-head">
        <div>
          <span class="section-kicker">Không biết ăn gì?</span>
          <h2 class="random-panel-title">🎲 Bung! Ăn gì?</h2>
          <p class="random-panel-hint">Bốc ngẫu nhiên trong các món đang khớp bộ lọc của bạn.</p>
        </div>
        <div class="random-panel-action">
          <button type="button" class="btn-roll" data-action="roll">🎲 Bung! Ăn gì?</button>
          <span class="random-pool-count">${poolSize} món trong bể bốc</span>
        </div>
      </div>
      <div class="roll-result">${resultHTML}</div>
    </div>
  `;

  const rollBtn = containerEl.querySelector('[data-action="roll"]');
  if (rollBtn) rollBtn.addEventListener('click', () => onRoll && onRoll());

  const favBtn = containerEl.querySelector('.btn-fav');
  if (favBtn) {
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onToggleFavorite && onToggleFavorite(Number(favBtn.dataset.id));
    });
  }

  const rerollBtn = containerEl.querySelector('[data-action="reroll"]');
  if (rerollBtn) rerollBtn.addEventListener('click', () => onReroll && onReroll());

  const detailBtn = containerEl.querySelector('[data-action="detail"]');
  if (detailBtn) {
    detailBtn.addEventListener('click', () => {
      const card = containerEl.querySelector('.roll-result-card');
      onViewDetail && onViewDetail(Number(card ? card.dataset.id : null));
    });
  }
}
