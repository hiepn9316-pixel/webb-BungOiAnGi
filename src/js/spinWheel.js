import { formatCurrency } from './dishRender.js';

const SEGMENT_COLORS = ['#ef6845', '#f2bd52', '#55a99a', '#5879a5', '#df8e62', '#84a75b'];
const WHEEL_SIZE = 480;

function drawWheel(canvas, dishes) {
    const context = canvas.getContext('2d');
    if (!context || dishes.length === 0) return;

    const scale = window.devicePixelRatio || 1;
    canvas.width = WHEEL_SIZE * scale;
    canvas.height = WHEEL_SIZE * scale;
    context.scale(scale, scale);

    const center = WHEEL_SIZE / 2;
    const radius = center - 5;
    const slice = (Math.PI * 2) / dishes.length;

    dishes.forEach((dish, index) => {
        const start = -Math.PI / 2 + index * slice;
        const end = start + slice;
        context.beginPath();
        context.moveTo(center, center);
        context.arc(center, center, radius, start, end);
        context.closePath();
        context.fillStyle = SEGMENT_COLORS[index % SEGMENT_COLORS.length];
        context.fill();
        context.strokeStyle = '#fffaf0';
        context.lineWidth = 2;
        context.stroke();
    });
}

function renderWheelLabels(dishes) {
    const denseLabels = dishes.length > 20;
    const roomyLabels = dishes.length <= 12;
    const radiusPercent = denseLabels ? 40 : roomyLabels ? 39 : 36;
    const stageWidth = document.querySelector('.wheel-stage')?.clientWidth || 520;
    const labelRadius = stageWidth * radiusPercent / 100;
    const sliceSpacing = (Math.PI * 2 * labelRadius) / dishes.length;
    const labelWidth = Math.max(denseLabels ? 16 : 32, Math.min(denseLabels ? 32 : 140, sliceSpacing * 0.96));
    return dishes.map((dish, index) => {
        const angle = -Math.PI / 2 + ((index + 0.5) * Math.PI * 2) / dishes.length;
        const left = 50 + Math.cos(angle) * radiusPercent;
        const top = 50 + Math.sin(angle) * radiusPercent;
        let rotation = angle * 180 / Math.PI + 90;
        if (rotation > 90 && rotation < 270) rotation += 180;
        const labelStyle = denseLabels
            ? 'wheel-segment-label--dense'
            : roomyLabels ? 'wheel-segment-label--roomy' : 'wheel-segment-label--standard';
        return `<span class="wheel-segment-label ${labelStyle}" data-wheel-segment="${index + 1}" title="${dish.name}" style="--wheel-label-width:${labelWidth.toFixed(1)}px;left:${left.toFixed(2)}%;top:${top.toFixed(2)}%;transform:translate(-50%,-50%) rotate(${rotation.toFixed(1)}deg)">${dish.name}</span>`;
    }).join('');
}

function renderDishOptions(dishes, selectedIds, wheelIndexes) {
    return dishes.map(dish => `
      <label class="wheel-dish-option" data-wheel-name="${dish.name.toLocaleLowerCase('vi-VN')}" title="${dish.name}">
        <input type="checkbox" data-wheel-dish="${dish.id}" ${selectedIds.includes(dish.id) ? 'checked' : ''} />
        <span class="wheel-dish-index">${wheelIndexes.get(dish.id) || ''}</span>
        <img src="${dish.image}" alt="" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/80?text=Mon';" />
        <span class="wheel-dish-option-copy"><strong>${dish.name}</strong><small>${formatCurrency(dish.price)}</small></span>
      </label>
    `).join('');
}

export function renderWheelPanel(container, state, handlers = {}) {
    if (!container) return;

    const searchQuery = container.querySelector('#wheel-search')?.value || '';
    const listScrollTop = container.querySelector('.wheel-dish-list')?.scrollTop || 0;
    const { dishes = [], availableDishes = dishes, selectedIds = dishes.map(item => item.id) } = state;
    const rotation = Number(container.dataset.rotation) || 0;
    const empty = dishes.length === 0;
    const noAvailableDishes = availableDishes.length === 0;
    const wheelIndexes = new Map(dishes.map((item, index) => [item.id, index + 1]));
    container.innerHTML = `
    <section class="wheel-panel wheel-panel--numbered" aria-labelledby="wheel-title">
      <div class="wheel-copy">
        <span class="section-kicker">${dishes.length} món trong vòng quay</span>
        <h2 id="wheel-title">Vòng quay món ăn</h2>
        <p>Tìm và chọn những món bạn muốn đưa vào vòng quay.</p>
        ${noAvailableDishes ? '<p class="wheel-empty" role="alert">Không có món phù hợp với các lựa chọn hiện tại.</p>' : ''}
        ${empty && !noAvailableDishes ? '<p class="wheel-empty" role="alert">Hãy chọn ít nhất một món để bắt đầu quay.</p>' : ''}
      </div>
      <div class="wheel-stage" aria-label="Vòng quay món ăn">
        <span class="wheel-pointer" aria-hidden="true"></span>
        <div class="wheel-rotor" style="transform: rotate(${rotation}deg)">
          <canvas class="wheel-disc" width="480" height="480" aria-hidden="true"></canvas>
          <div class="wheel-segment-labels" aria-hidden="true">${renderWheelLabels(dishes)}</div>
        </div>
        <button type="button" class="wheel-hub" data-action="spin" aria-label="Quay vòng quay món ăn" ${empty ? 'disabled' : ''}>ĂN<br>GÌ?</button>
      </div>
      <div class="wheel-spin-controls">
        <button type="button" class="btn-wheel-spin" data-action="spin" ${empty ? 'disabled' : ''}>Quay món</button>
      </div>
      <div class="wheel-selection">
        <div class="wheel-selection-head">
          <div><h3>Chọn món vào vòng</h3><p><span data-wheel-selected-count>${dishes.length}</span> / ${availableDishes.length} món được chọn</p><p>Tên trên vòng khớp với món trong danh sách.</p></div>
          <div class="wheel-selection-actions">
            <button type="button" data-action="select-all">Chọn tất cả</button>
            <button type="button" data-action="select-none">Bỏ chọn</button>
          </div>
        </div>
        <label class="wheel-search-label" for="wheel-search">Tìm món trong danh sách</label>
        <input type="search" id="wheel-search" class="wheel-search" placeholder="Nhập tên món..." autocomplete="off" />
        <div class="wheel-dish-list">${renderDishOptions(availableDishes, selectedIds, wheelIndexes)}</div>
      </div>
    </section>
  `;

    const canvas = container.querySelector('.wheel-disc');
    const rotor = container.querySelector('.wheel-rotor');
    drawWheel(canvas, dishes);

    const spin = async (event) => {
        const button = event.currentTarget;
        if (button.disabled) return;
        const picked = handlers.onSpin?.(dishes);
        if (!picked) return;

        container.querySelectorAll('[data-action="spin"]').forEach(control => { control.disabled = true; });
        const index = dishes.findIndex(item => item.id === picked.id);
        const sliceDegrees = 360 / dishes.length;
        const currentRotation = Number(container.dataset.rotation) || 0;
        const finalAngle = 360 - (index + 0.5) * sliceDegrees;
        const targetRotation = currentRotation + 6 * 360 + ((finalAngle - (currentRotation % 360) + 360) % 360);
        const animation = rotor.animate([
            { transform: `rotate(${currentRotation}deg)` },
            { transform: `rotate(${targetRotation}deg)` }
        ], { duration: 4200, easing: 'cubic-bezier(0.12, 0.72, 0.14, 1)', fill: 'forwards' });

        try {
            await animation.finished;
            container.dataset.rotation = String(targetRotation);
            handlers.onResult?.(picked);
        } catch {
            // A rerender can cancel the animation when the active filters change.
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