import { formatCurrency } from './dishRender.js';
import { foodImageFallback } from './foodImages.js';
import { DISH_TYPES } from './filterUtils.js';
import { CATEGORIES } from './categoryFilter.js';
import { BUDGET_GROUPS } from './priceFilter.js';

const SEGMENT_COLORS = ['#ef6845', '#f2bd52', '#55a99a', '#5879a5', '#df8e62', '#84a75b'];
const WHEEL_SIZE = 480;

/* ===== Bộ lọc loại món, chay mặn và mức giá của vòng quay ===== */

/** Điều kiện lọc của vòng quay, giữ nguyên qua mỗi lần vẽ lại panel */
let wheelCategory = 'tat-ca';
let wheelType = 'tat-ca';
let wheelBudget = 'tat-ca';

/** Bật/tắt từng nhóm điều kiện lọc của vòng quay */
export function setWheelFilter({ category, type, budget } = {}) {
    if (category) wheelCategory = category;
    if (type) wheelType = type;
    if (budget) wheelBudget = budget;
    return { category: wheelCategory, type: wheelType, budget: wheelBudget };
}

/** Bỏ sạch bộ lọc, vòng quay lấy lại toàn bộ danh sách */
export function resetWheelFilters() {
    wheelCategory = 'tat-ca';
    wheelType = 'tat-ca';
    wheelBudget = 'tat-ca';
}

function hasWheelFilters() {
    return wheelCategory !== 'tat-ca' || wheelType !== 'tat-ca' || wheelBudget !== 'tat-ca';
}

function matchWheelFilters(dish) {
    if (wheelCategory !== 'tat-ca' && dish.category !== wheelCategory) return false;
    if (wheelType !== 'tat-ca' && String(dish.type).toLowerCase() !== wheelType) return false;

    if (wheelBudget !== 'tat-ca') {
        const group = BUDGET_GROUPS.find(item => item.id === wheelBudget);
        if (group && (dish.price < group.min || dish.price >= group.max)) return false;
    }

    return true;
}

/**
 * Áp bộ lọc của vòng quay lên danh sách món ứng viên.
 * main.js dùng đúng hàm này để dựng vòng nên danh sách chọn món và phần quay
 * luôn khớp nhau.
 * @param {Array<Object>} dishes
 * @returns {Array<Object>}
 */
export function applyWheelFilters(dishes) {
    if (!Array.isArray(dishes)) return [];
    return dishes.filter(matchWheelFilters);
}

function renderWheelFilterTabs(items, action, activeId) {
    return items.map(item => `
      <button type="button" class="wheel-filter-tab${activeId === item.id ? ' is-active' : ''}" data-action="${action}" data-value="${item.id}" aria-pressed="${activeId === item.id}">
        <span aria-hidden="true">${item.icon}</span>${item.name}
      </button>
    `).join('');
}

/** Ba nhóm nút lọc: loại món, chay/mặn và mức giá */
function renderWheelFilters() {
    const budgetTabs = [{ id: 'tat-ca', name: 'Mọi mức giá', icon: '💰' }, ...BUDGET_GROUPS];

    return `
      <div class="wheel-filters" role="group" aria-label="Lọc món đưa vào vòng quay theo loại, chay mặn và mức giá">
        <div class="wheel-filters-head">
          <span class="wheel-filter-label">Lọc món cho vòng quay</span>
          <button type="button" class="wheel-filter-reset" data-action="filter-reset" ${hasWheelFilters() ? '' : 'hidden'}>Bỏ lọc</button>
        </div>
        <div class="wheel-filter">
          <span class="wheel-filter-label">Loại món</span>
          <div class="wheel-filter-tabs">${renderWheelFilterTabs(CATEGORIES, 'filter-category', wheelCategory)}</div>
        </div>
        <div class="wheel-filter">
          <span class="wheel-filter-label">Chay hay mặn</span>
          <div class="wheel-filter-tabs">${renderWheelFilterTabs(DISH_TYPES, 'filter-type', wheelType)}</div>
        </div>
        <div class="wheel-filter">
          <span class="wheel-filter-label">Mức giá</span>
          <div class="wheel-filter-tabs">${renderWheelFilterTabs(budgetTabs, 'filter-budget', wheelBudget)}</div>
        </div>
        <p class="wheel-filters-hint">Vòng quay chỉ dựng từ những món khớp bộ lọc này.</p>
      </div>
    `;
}

let activeWheelHandlers = {};

const WHEEL_FILTER_ACTIONS = {
    'filter-category': trigger => activeWheelHandlers.onFilter?.({ category: trigger.dataset.value }),
    'filter-type': trigger => activeWheelHandlers.onFilter?.({ type: trigger.dataset.value }),
    'filter-budget': trigger => activeWheelHandlers.onFilter?.({ budget: trigger.dataset.value }),
    'filter-reset': () => activeWheelHandlers.onResetFilters?.()
};

/**
 * Nghe sự kiện một lần trên container nên đổi bộ lọc không phải gắn lại
 * listener sau mỗi lần vẽ lại panel.
 */
function bindWheelActions(container) {
    if (container.dataset.wheelBound === 'true') return;
    container.dataset.wheelBound = 'true';

    container.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-action]');
        if (!trigger || !container.contains(trigger)) return;

        const run = WHEEL_FILTER_ACTIONS[trigger.dataset.action];
        if (!run || trigger.disabled) return;
        run(trigger);
    });
}

/** Trộn một mã màu với trắng (amount > 0) hoặc đen (amount < 0) */
function shadeColor(hex, amount) {
    const value = parseInt(hex.slice(1), 16);
    const channel = (shift) => {
        const base = (value >> shift) & 0xff;
        const target = amount > 0 ? 255 : 0;
        return Math.round(base + (target - base) * Math.abs(amount));
    };
    return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

function drawWheel(canvas, dishes) {
    const context = canvas.getContext('2d');
    if (!context || dishes.length === 0) return;

    const scale = window.devicePixelRatio || 1;
    canvas.width = WHEEL_SIZE * scale;
    canvas.height = WHEEL_SIZE * scale;
    context.scale(scale, scale);

    const center = WHEEL_SIZE / 2;
    const radius = center - 16;
    const slice = (Math.PI * 2) / dishes.length;

    dishes.forEach((dish, index) => {
        const start = -Math.PI / 2 + index * slice;
        const end = start + slice;
        const base = SEGMENT_COLORS[index % SEGMENT_COLORS.length];

        // Mỗi lái sáng dần từ tâm ra rìa để đĩa trông như mặt cầu có khối
        const fill = context.createRadialGradient(center, center, radius * 0.16, center, center, radius);
        fill.addColorStop(0, shadeColor(base, 0.3));
        fill.addColorStop(0.55, base);
        fill.addColorStop(1, shadeColor(base, -0.28));

        context.beginPath();
        context.moveTo(center, center);
        context.arc(center, center, radius, start, end);
        context.closePath();
        context.fillStyle = fill;
        context.fill();
    });

    // Vạch chia lái: một sốc tối rồi một sốc sáng lệch nhẹ tạo cảm giác khắc
    context.lineWidth = 3;
    context.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    dishes.forEach((dish, index) => {
        const angle = -Math.PI / 2 + index * slice;
        context.beginPath();
        context.moveTo(center + Math.cos(angle) * radius * 0.2, center + Math.sin(angle) * radius * 0.2);
        context.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
        context.stroke();
    });

    context.lineWidth = 1.5;
    context.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    dishes.forEach((dish, index) => {
        const angle = -Math.PI / 2 + index * slice + 0.006;
        context.beginPath();
        context.moveTo(center + Math.cos(angle) * radius * 0.2, center + Math.sin(angle) * radius * 0.2);
        context.lineTo(center + Math.cos(angle) * radius, center + Math.sin(angle) * radius);
        context.stroke();
    });

    // Vòng tròn sáng ở giữa nối các lái lại
    const hubShade = context.createRadialGradient(center, center, 0, center, center, radius * 0.2);
    hubShade.addColorStop(0, '#fffdf8');
    hubShade.addColorStop(1, 'rgba(255, 250, 240, 0)');
    context.beginPath();
    context.arc(center, center, radius * 0.2, 0, Math.PI * 2);
    context.fillStyle = hubShade;
    context.fill();
}

/**
 * Trên 20 món thì bề ngang mỗi lái chỉ chừng 15px, chữ xuống dòng sẽ dài ra
 * và tràn ra ngoài vành vòng. Lúc này chuyển chữ nằm dọc theo bán kính để dùng
 * hết khoảng trống giữa nút trung tâm và vành vòng, tên món vẫn đọc được.
 */
const LABEL_RADIAL_THRESHOLD = 20;
/** Chừa chỗ cho nút trung tâm (82px + viền) và cho vành vòng quay */
const LABEL_INNER_CLEARANCE = 54;
const LABEL_OUTER_CLEARANCE = 20;
/** Mặt đĩa vẽ tới bán kính nửa vòng trừ 16px, chữ nằm trong đĩa nên chừa thêm 2px */
const LABEL_DISC_EDGE = 18;
/** Cỡ chữ chế độ nhiều lái, khớp với .wheel-segment-label--dense trong style.css */
const LABEL_DENSE_FONT_PX = 0.46 * 16;

/** Cắt phẳng tên món cho vừa chiều dài chữ, không để chữ tràn ra ngoài ô */
function fitDenseLabel(name, maxWidth) {
    // Chữ in đậm, mỗi ký tự rộng khoảng 0.55em, trừ sẵn 2px đệm mỗi bên
    const maxChars = Math.max(2, Math.floor((maxWidth - 4) / (LABEL_DENSE_FONT_PX * 0.55)));
    if (name.length <= maxChars) return name;
    return `${name.slice(0, maxChars - 1).trimEnd()}…`;
}

function renderWheelLabels(dishes) {
    const count = dishes.length;
    const stageWidth = document.querySelector('.wheel-stage')?.clientWidth || 520;
    const center = stageWidth / 2;
    const radialLabels = count > LABEL_RADIAL_THRESHOLD;
    const roomyLabels = count <= 12;
    const inner = LABEL_INNER_CLEARANCE;
    const outer = center - LABEL_OUTER_CLEARANCE;
    // Chữ dọc bán kính thì đặt giữa khoảng trống trong đĩa, chữ theo vòng cung
    // thì đặt gần vành cho dễ đọc
    const labelRadius = radialLabels ? (inner + outer) / 2 : stageWidth * 0.36;
    const sliceSpacing = (Math.PI * 2 * labelRadius) / count;
    // Bề rộng ô chữ: chữ dọc bán kính dùng cả chiều dài chữ, chữ theo vòng cung
    // thì lấy theo bề ngang lái và không vượt quá 32% bề rộng vòng để khỏi lấn vành
    const labelWidth = radialLabels
        ? (outer - inner) * 0.94
        : Math.max(32, Math.min(stageWidth * 0.318, sliceSpacing * 0.96));
    const radiusPercent = (labelRadius / stageWidth) * 100;
    // Chữ to của chế độ roomy phải nhỏ lại theo vòng, nếu không khối chữ 3 dòng
    // sẽ chạm vành khi vòng nhỏ. Đây là cỡ lớn nhất vẫn nằm trong mặt đĩa.
    const discFace = center - LABEL_DISC_EDGE;
    const edgeRoom = Math.sqrt(Math.max(0, discFace * discFace - (labelWidth / 2) ** 2));
    const roomyFontPx = Math.min(16, Math.max(9, (edgeRoom - labelRadius) / 1.65));

    return dishes.map((dish, index) => {
        const angle = -Math.PI / 2 + ((index + 0.5) * Math.PI * 2) / count;
        const left = 50 + Math.cos(angle) * radiusPercent;
        const top = 50 + Math.sin(angle) * radiusPercent;
        const angleDeg = angle * 180 / Math.PI;
        let rotation = radialLabels ? angleDeg : angleDeg + 90;
        // Lật nửa bên trái lên để chữ không bị ngược
        if (radialLabels ? (rotation > 90 || rotation < -90) : (rotation > 90 && rotation < 270)) {
            rotation += 180;
        }
        const labelStyle = radialLabels
            ? 'wheel-segment-label--dense'
            : roomyLabels ? 'wheel-segment-label--roomy' : 'wheel-segment-label--standard';
        const text = radialLabels ? fitDenseLabel(dish.name, labelWidth) : dish.name;
        const fontStyle = radialLabels ? '' : `--wheel-label-font:${roomyFontPx.toFixed(1)}px;`;
        return `<span class="wheel-segment-label ${labelStyle}" data-wheel-segment="${index + 1}" title="${dish.name}" style="${fontStyle}--wheel-label-width:${labelWidth.toFixed(1)}px;left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;transform:translate(-50%,-50%) rotate(${rotation.toFixed(1)}deg)">${text}</span>`;
    }).join('');
}

function renderDishOptions(dishes, selectedIds, wheelIndexes) {
    return dishes.map(dish => `
      <label class="wheel-dish-option" data-wheel-name="${dish.name.toLocaleLowerCase('vi-VN')}" title="${dish.name}">
        <input type="checkbox" data-wheel-dish="${dish.id}" ${selectedIds.includes(dish.id) ? 'checked' : ''} />
        <span class="wheel-dish-index">${wheelIndexes.get(dish.id) || ''}</span>
        <img src="${dish.image}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${foodImageFallback('Món ăn')}';" />
        <span class="wheel-dish-option-copy"><strong>${dish.name}</strong><small>${formatCurrency(dish.price)}</small></span>
      </label>
    `).join('');
}

/** Vòng đinh nhỏ quanh vành vòng quay, tạo cảm giác cơ cấu thật */
function renderRivetHTML(count) {
    const rivets = Math.min(Math.max(count, 8), 24);
    const items = Array.from({ length: rivets }, (_, i) => {
        const angle = (i / rivets) * 360;
        return `<i style="transform:translate(-50%,-50%) rotate(${angle.toFixed(1)}deg) translateY(-50%) rotate(${-angle.toFixed(1)}deg)"></i>`;
    }).join('');
    return `<span class="wheel-rivets" aria-hidden="true">${items}</span>`;
}

export function renderWheelPanel(container, state, handlers = {}) {
    if (!container) return;

    const searchQuery = container.querySelector('#wheel-search')?.value || '';
    const listScrollTop = container.querySelector('.wheel-dish-list')?.scrollTop || 0;
    const { dishes = [], availableDishes = dishes, selectedIds = dishes.map(item => item.id), isSpinning = false, pickedName = '' } = state;
    const rotation = Number(container.dataset.rotation) || 0;
    const empty = dishes.length === 0;
    const noAvailableDishes = availableDishes.length === 0;
    const wheelIndexes = new Map(dishes.map((item, index) => [item.id, index + 1]));
    activeWheelHandlers = handlers;
    bindWheelActions(container);
    container.innerHTML = `
    <section class="wheel-panel wheel-panel--numbered" aria-labelledby="wheel-title">
      <div class="wheel-copy">
        <span class="section-kicker">${dishes.length} món trong vòng quay</span>
        <h2 id="wheel-title">Vòng quay món ăn</h2>
        <p>Tìm và chọn những món bạn muốn đưa vào vòng quay.</p>
        ${noAvailableDishes ? '<p class="wheel-empty" role="alert">Không có món nào khớp bộ lọc. Bỏ bớt điều kiện lọc ở trang Khám phá hoặc trong vòng quay.</p>' : ''}
        ${empty && !noAvailableDishes ? '<p class="wheel-empty" role="alert">Hãy chọn ít nhất một món để bắt đầu quay.</p>' : ''}
      </div>
      <div class="wheel-stage" aria-label="Vòng quay món ăn" data-spinning="${isSpinning ? 'true' : 'false'}">
        <span class="wheel-glow" aria-hidden="true"></span>
        <span class="wheel-sparks" aria-hidden="true"><i>✨</i><i>🍜</i><i>✨</i><i>🥢</i><i>✨</i><i>🌶️</i></span>
        <span class="wheel-burst" aria-hidden="true"></span>
        <div class="wheel-rotor" style="transform: rotate(${rotation}deg)">
          <canvas class="wheel-disc" width="480" height="480" aria-hidden="true"></canvas>
          <span class="wheel-sheen" aria-hidden="true"></span>
          <span class="wheel-shade" aria-hidden="true"></span>
          <div class="wheel-segment-labels" aria-hidden="true">${renderWheelLabels(dishes)}</div>
          ${isSpinning ? '<span class="wheel-sweep" aria-hidden="true"></span>' : ''}
          ${renderRivetHTML(dishes.length)}
        </div>
        <span class="wheel-rim" aria-hidden="true"></span>
        <span class="wheel-pointer" aria-hidden="true"><span class="wheel-pointer-tip"></span></span>
        <button type="button" class="wheel-hub" data-action="spin" aria-label="Quay vòng quay món ăn" ${empty || isSpinning ? 'disabled' : ''}>ĂN<br>GÌ?</button>
        <div class="wheel-readout" role="status" aria-live="polite" aria-label="Món đang quay">
          ${isSpinning ? `<span class="wheel-readout-item">${pickedName || '🎲 Đang quay...'}</span>` : ''}
        </div>
      </div>
      <div class="wheel-spin-controls">
        <button type="button" class="btn-wheel-spin" data-action="spin" ${empty || isSpinning ? 'disabled' : ''}>${isSpinning ? 'ĐANG QUAY...' : 'Quay món'}</button>
      </div>
      <div class="wheel-selection">
        <div class="wheel-selection-head">
          <div><h3>Chọn món vào vòng</h3><p><span data-wheel-selected-count>${dishes.length}</span> / ${availableDishes.length} món được chọn</p><p>Tên trên vòng khớp với món trong danh sách.</p></div>
          <div class="wheel-selection-actions">
            <button type="button" data-action="select-all">Chọn tất cả</button>
            <button type="button" data-action="select-none">Bỏ chọn</button>
          </div>
        </div>
        ${renderWheelFilters()}
        <label class="wheel-search-label" for="wheel-search">Tìm món trong danh sách</label>
        <input type="search" id="wheel-search" class="wheel-search" placeholder="Nhập tên món..." autocomplete="off" />
        <div class="wheel-dish-list">${renderDishOptions(availableDishes, selectedIds, wheelIndexes)}</div>
      </div>
    </section>
  `;

    const canvas = container.querySelector('.wheel-disc');
    drawWheel(canvas, dishes);

    const spin = async (event) => {
        const button = event.currentTarget;
        if (button.disabled) return;
        const picked = handlers.onSpin?.(dishes);
        if (!picked) return;

        container.querySelectorAll('[data-action="spin"]').forEach(control => { control.disabled = true; });

        // onSpin có thể render lại panel để bật hiệu ứng đang quay, nên phải lấy lại rotor mới
        const liveRotor = container.querySelector('.wheel-rotor');

        const index = dishes.findIndex(item => item.id === picked.id);
        const sliceDegrees = 360 / dishes.length;
        const currentRotation = Number(container.dataset.rotation) || 0;
        const finalAngle = 360 - (index + 0.5) * sliceDegrees;
        const duration = 4200;
        const turns = 6;
        const targetRotation = currentRotation + turns * 360 + ((finalAngle - (currentRotation % 360) + 360) % 360);
        const animation = liveRotor.animate([
            { transform: `rotate(${currentRotation}deg)` },
            { transform: `rotate(${targetRotation}deg)` }
        ], { duration, easing: 'cubic-bezier(0.12, 0.72, 0.14, 1)', fill: 'forwards' });

        // Mỗi lần con trỏ lướt qua ranh giới lái sẽ kêu một tiếng, nhanh dần rồi chậm dần
        let lastTickIndex = Math.floor(((currentRotation % 360) + 360) % 360 / sliceDegrees);
        let lastReadoutIndex = lastTickIndex;
        let lastReadoutAt = 0;
        const tickTimer = window.setInterval(() => {
            if (animation.playState === 'finished' || animation.playState === 'idle') return;
            const progress = animation.effect.getComputedTiming().progress || 0;
            const degree = currentRotation + (targetRotation - currentRotation) * progress;
            const segmentIndex = Math.floor(((degree % 360) + 360) % 360 / sliceDegrees);

            if (segmentIndex === lastTickIndex) return;
            lastTickIndex = segmentIndex;

            // Bảng tên dưới vòng quay đổi theo lái đang lướt tới, nhưng bớt lại ở tốc độ cao
            const now = performance.now();
            if (segmentIndex !== lastReadoutIndex && now - lastReadoutAt > 110) {
                lastReadoutIndex = segmentIndex;
                lastReadoutAt = now;
                handlers.onReadout?.(dishes[segmentIndex]?.name || '');
            }

            // Tốc độ quay giảm dần thì tiếng cũng chậm và nhỏ dần
            handlers.onTick?.(1 - progress);
        }, 16);

        try {
            await animation.finished;
            window.clearInterval(tickTimer);
            container.dataset.rotation = String(targetRotation);
            handlers.onResult?.(picked);
        } catch {
            // A rerender can cancel the animation when the active filters change.
            window.clearInterval(tickTimer);
            // Trả lại trạng thái để nút quay không bị kẹt vĩnh viễn
            container.querySelectorAll('[data-action="spin"]').forEach(control => { control.disabled = false; });
            handlers.onCancel?.();
        }
    };

    container.querySelectorAll('[data-action="spin"]').forEach(button => button.addEventListener('click', spin));

    const dishList = container.querySelector('.wheel-dish-list');
    const updateSelectedCount = () => {
        container.querySelector('[data-wheel-selected-count]').textContent = dishList.querySelectorAll('input:checked').length;
    };
    const applySelection = () => {
        const ids = [...dishList.querySelectorAll('input:checked')].map(input => Number(input.dataset.wheelDish));
        handlers.onSelectionChange?.(ids);
    };
    const searchInput = container.querySelector('#wheel-search');
    const filterDishOptions = (query) => {
        const normalizedQuery = query.trim().toLocaleLowerCase('vi-VN');
        dishList.querySelectorAll('.wheel-dish-option').forEach((option) => {
            option.hidden = !option.dataset.wheelName.includes(normalizedQuery);
        });
    };
    searchInput.value = searchQuery;
    filterDishOptions(searchQuery);
    dishList.scrollTop = listScrollTop;

    container.querySelector('[data-action="select-all"]')?.addEventListener('click', () => {
        dishList.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = true; });
        updateSelectedCount();
        applySelection();
    });
    container.querySelector('[data-action="select-none"]')?.addEventListener('click', () => {
        dishList.querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = false; });
        updateSelectedCount();
        applySelection();
    });
    dishList.addEventListener('change', () => {
        updateSelectedCount();
        applySelection();
    });
    searchInput.addEventListener('input', (event) => {
        filterDishOptions(event.currentTarget.value);
    });
}