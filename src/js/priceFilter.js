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

  customBudgetBox.innerHTML = `
    <label for="budget-input" class="budget-label">🎯 Nhập ngân sách của bạn:</label>
    <div class="budget-input-group">
      <input 
        type="number" 
        id="budget-input" 
        class="budget-input" 
        placeholder="VD: 50000" 
        min="0"
        step="5000"
        value="${budgetValue}"
      />
      <span class="budget-suffix">đ</span>
      ${budgetValue ? '<button type="button" class="btn-clear-budget" title="Xóa ngân sách">✕</button>' : ''}
    </div>
  `;

  // Sự kiện khi người dùng nhập số tiền
  const inputEl = customBudgetBox.querySelector('#budget-input');
  inputEl.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    onCustomBudgetChange(isNaN(val) || val <= 0 ? null : val);
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

