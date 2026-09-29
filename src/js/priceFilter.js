/**
 * Các khoảng giá mặc định theo đặc tả SRS F07
 */
export const PRICE_TIERS = [
  { id: 'tat-ca', name: 'Tất cả giá', icon: '💰', min: 0, max: Infinity },
  { id: 'sinh-ton', name: 'Sinh tồn (<20k)', icon: '💸', min: 0, max: 20000 },
  { id: 'sinh-vien', name: 'Sinh viên (20-40k)', icon: '🎓', min: 20000, max: 40000 },
  { id: 'an-ngon', name: 'Ăn ngon (40-70k)', icon: '😋', min: 40000, max: 70000 },
  { id: 'choi-lon', name: 'Chơi lớn (70-150k)', icon: '👑', min: 70000, max: 150000 }
];

export const BUDGET_PRESETS = [20000, 30000, 50000, 70000, 100000];
const MIN_CUSTOM_BUDGET = 10000;
const MAX_CUSTOM_BUDGET = 150000;

/**
 * Lọc danh sách món ăn theo khoảng giá hoặc ngân sách tùy chỉnh
 * @param {Array} dishes - Danh sách món
 * @param {string} priceTierId - ID khoảng giá chọn sẵn
 * @param {number|null} customMaxBudget - Ngân sách tối đa tùy chỉnh (nếu có)
 * @returns {Array} Danh sách món sau khi lọc
 */
export function filterByPrice(dishes, priceTierId, customMaxBudget = null) {
  if (!dishes || !Array.isArray(dishes)) return [];

  // Ưu tiên 1: Lọc theo ngân sách tùy chỉnh nếu người dùng có nhập
  if (customMaxBudget !== null && customMaxBudget > 0) {
    return dishes.filter(dish => dish.price <= customMaxBudget);
  }

  // Ưu tiên 2: Lọc theo khoảng giá preset
  const tier = PRICE_TIERS.find(t => t.id === priceTierId);
  if (!tier || tier.id === 'tat-ca') {
    return dishes;
  }

  return dishes.filter(dish => dish.price >= tier.min && dish.price <= tier.max);
}

/**
 * Render bộ lọc khoảng giá và ô nhập ngân sách
 * @param {HTMLElement} containerEl 
 * @param {string} activePriceTierId 
 * @param {number|null} customMaxBudget 
 * @param {Function} onSelectPriceTier 
 * @param {Function} onCustomBudgetChange 
 */
export function renderPriceFilterUI(
  containerEl, 
  activePriceTierId, 
  customMaxBudget, 
  onSelectPriceTier, 
  onCustomBudgetChange
) {
  if (!containerEl) return;

  containerEl.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'price-filter-wrapper';

  // 1. Render nút các khoảng giá (Pills)
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'price-tabs';

  PRICE_TIERS.forEach(tier => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = (customMaxBudget === null || customMaxBudget <= 0) && tier.id === activePriceTierId;
    btn.className = `price-tab ${isActive ? 'active' : ''}`;
    btn.dataset.priceId = tier.id;

    btn.innerHTML = `
      <span class="price-icon">${tier.icon}</span>
      <span class="price-name">${tier.name}</span>
    `;

    btn.addEventListener('click', () => {
      onSelectPriceTier(tier.id);
    });

    tabsContainer.appendChild(btn);
  });

  // 2. Render ô nhập ngân sách tùy chỉnh
  const customBudgetBox = document.createElement('div');
  customBudgetBox.className = 'custom-budget-box';

  const budgetValue = customMaxBudget !== null && customMaxBudget > 0 ? customMaxBudget : '';
  const sliderValue = budgetValue || 50000;

  customBudgetBox.innerHTML = `
    <div class="budget-heading">
      <label for="budget-input" class="budget-label">🎯 Ngân sách tối đa của bạn</label>
      <strong class="budget-current-value">${budgetValue ? new Intl.NumberFormat('vi-VN').format(budgetValue) : 'Chưa chọn'}đ</strong>
    </div>
    <div class="budget-presets" aria-label="Ngân sách gợi ý">
      ${BUDGET_PRESETS.map(preset => `
        <button type="button" class="budget-preset ${Number(budgetValue) === preset ? 'active' : ''}" data-budget="${preset}">
          ${new Intl.NumberFormat('vi-VN').format(preset)}đ
        </button>
      `).join('')}
    </div>
    <input
      type="range"
      id="budget-slider"
      class="budget-slider"
      min="${MIN_CUSTOM_BUDGET}"
      max="${MAX_CUSTOM_BUDGET}"
      step="5000"
      value="${sliderValue}"
      aria-label="Chọn ngân sách tối đa"
    />
    <div class="budget-input-group">
      <input 
        type="number" 
        id="budget-input" 
        class="budget-input" 
        placeholder="VD: 50000"
        min="${MIN_CUSTOM_BUDGET}"
        max="${MAX_CUSTOM_BUDGET}"
        step="5000"
        value="${budgetValue}"
      />
      <span class="budget-suffix">đ</span>
      ${budgetValue ? '<button type="button" class="btn-clear-budget" title="Xóa ngân sách">✕</button>' : ''}
    </div>
    <small class="budget-help">Chỉ hiển thị món có giá không vượt quá ngân sách đã chọn.</small>
  `;

  const sliderEl = customBudgetBox.querySelector('#budget-slider');
  const inputEl = customBudgetBox.querySelector('#budget-input');
  const presetEls = customBudgetBox.querySelectorAll('.budget-preset');

  const applyBudget = value => {
    const val = parseInt(value, 10);
    onCustomBudgetChange(Number.isFinite(val) && val >= MIN_CUSTOM_BUDGET ? val : null);
  };

  sliderEl.addEventListener('change', e => applyBudget(e.target.value));
  inputEl.addEventListener('change', e => applyBudget(e.target.value));

  presetEls.forEach(presetEl => {
    presetEl.addEventListener('click', () => applyBudget(presetEl.dataset.budget));
  });

  // Sự kiện xóa ô ngân sách
  const clearBtn = customBudgetBox.querySelector('.btn-clear-budget');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      onCustomBudgetChange(null);
    });
  }

  wrapper.appendChild(tabsContainer);
  wrapper.appendChild(customBudgetBox);
  containerEl.appendChild(wrapper);
}

