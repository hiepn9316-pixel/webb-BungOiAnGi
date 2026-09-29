import { formatCurrency, getCategoryName } from './dishRender.js';
import { DISH_TYPES } from './filterUtils.js';
import { foodImageFallback } from './foodImages.js';

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
/**
 * Lớp trang trí quanh kết quả: pháo giấy, tia sáng và quầng sóng.
 * Dùng emoji nên không cần thêm ảnh, chạy bằng CSS thuần.
 * @param {'burst'|'rays'|'both'} variant - Kiểu trang trí
 * @returns {string} HTML string
 */
function buildConfettiHTML(variant) {
  if (!variant) return '';
  const pieces = ['🍜', '🌶️', '🥢', '✨', '🍚', '🥟', '💛', '🌟'];
  const items = Array.from({ length: 14 }, (_, i) => {
    const piece = pieces[i % pieces.length];
    const left = (i / 14) * 100;
    const drift = ((i * 37) % 60) - 30;
    const delay = ((i * 53) % 40) / 100;
    return `<span class="roll-confetti-piece" style="left:${left.toFixed(1)}%;--confetti-x:${drift}px;--confetti-delay:${delay.toFixed(2)}s">${piece}</span>`;
  }).join('');

  return `
    <div class="roll-confetti" aria-hidden="true">${items}</div>
    ${variant === 'rays' || variant === 'both' ? '<span class="roll-rays" aria-hidden="true"></span>' : ''}
    ${variant === 'burst' || variant === 'both' ? '<span class="roll-shock" aria-hidden="true"></span><span class="roll-shock roll-shock--two" aria-hidden="true"></span>' : ''}
  `;
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
    <div class="roll-result-wrap${animate ? ' is-celebrate' : ''}">
      ${buildConfettiHTML(animate ? 'both' : 'rays')}
      <div class="roll-result-card${animate ? ' roll-result-card--animate' : ''}" data-id="${dish.id}">
        <img
          class="roll-result-image"
          src="${dish.image}"
          alt="${dish.name}"
          onerror="this.onerror=null;this.src='${foodImageFallback('Món ăn')}';"
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
          </div>
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

  const { dish = null, message = '', poolSize = 0, isFavorite = false, isRolling = false, scanNames = [] } = state;
  const { onRoll, onReroll, onToggleFavorite } = handlers;

  // Chỉ chạy hiệu ứng khi món bốc thực sự thay đổi, không re-animate khi đổi bộ lọc
  const dishKey = dish ? String(dish.id) : '';
  const animate = Boolean(dish) && containerEl.dataset.renderedDishId !== dishKey;
  containerEl.dataset.renderedDishId = dishKey;
  let resultHTML = '';

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

  const rollingSlot = isRolling
    ? `
      <div class="roll-slot" role="status" aria-live="polite" aria-label="Đang bốc món ăn">
        <span class="roll-slot-label">ĐANG BỐC...</span>
        <span class="roll-slot-window">
          ${(scanNames.length > 0 ? scanNames : ['🍜', '🍲', '🥟', '🍚', '🍝', '🥗'])
            .map(name => `<span class="roll-slot-item">${name}</span>`)
            .join('')}
        </span>
      </div>
    `
    : '';

  containerEl.innerHTML = `
    <div class="random-panel random-panel--wireframe${isRolling ? ' is-rolling' : ''}">
      <span class="roll-ambient" aria-hidden="true"><i>🍜</i><i>✨</i><i>🥢</i><i>🌶️</i><i>🍚</i><i>💫</i></span>
      <div class="wireframe-hero-box">
        <span class="wireframe-kicker">🍜 BungOiAnGi</span>
        <h1 class="wireframe-title">HÔM NAY ĂN GÌ?</h1>
        <p class="wireframe-slogan">"Để BungOiAnGi quyết định!"</p>
        <div class="wireframe-btn-wrap">
          <button type="button" class="btn-roll btn-roll--large${isRolling ? ' is-rolling' : ''}" data-action="roll" aria-label="Bụp! Ăn gì?" ${isRolling ? 'disabled' : ''}>
            <span class="btn-roll-shock" aria-hidden="true"></span>
            <span class="btn-roll-spark" aria-hidden="true">✦</span>
            <span class="btn-roll-main">${isRolling ? 'ĐANG BỐC...' : 'BỤP! ĂN GÌ'}</span>
          </button>
        </div>
        ${rollingSlot}
        <span class="wireframe-pool-hint">${poolSize} món sẵn sàng</span>
      </div>
      ${message ? `<div class="roll-result roll-result--centered">${resultHTML}</div>` : ''}
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
}
