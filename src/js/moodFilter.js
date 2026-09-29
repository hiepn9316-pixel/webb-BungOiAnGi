export const MOODS = [
  { id: 'tat-ca', label: 'Tất cả tâm trạng', icon: '✨', description: 'Xem toàn bộ món ăn' },
  { id: 'mood-hungry', label: 'Đang đói', icon: '🍛', description: 'Món no, ăn là đủ bụng' },
  { id: 'mood-light', label: 'Ăn nhẹ', icon: '🥗', description: 'Nhẹ bụng, tươi mát' },
  { id: 'mood-spicy', label: 'Muốn cay', icon: '🌶️', description: 'Đậm vị, cay đã miệng' },
  { id: 'mood-fast', label: 'Ăn nhanh', icon: '⚡', description: 'Gọn nhẹ, tiết kiệm thời gian' },
  { id: 'mood-healthy', label: 'Lành mạnh', icon: '🌿', description: 'Cân bằng và giàu dinh dưỡng' },
  { id: 'mood-snack', label: 'Ăn vặt', icon: '🍡', description: 'Ăn vui giữa buổi' },
  { id: 'mood-sweet', label: 'Thèm ngọt', icon: '🍹', description: 'Ngọt ngào, giải khát' },
  { id: 'mood-soup', label: 'Muốn món nước', icon: '🍜', description: 'Ấm bụng, nhiều nước dùng' },
  { id: 'mood-crispy', label: 'Thích giòn', icon: '🍗', description: 'Giòn rụm, vui miệng' },
  { id: 'mood-group', label: 'Ăn cùng nhóm', icon: '👨‍👩‍👧‍👦', description: 'Món hợp để chia sẻ' },
  { id: 'mood-relax', label: 'Chill nhẹ', icon: '🧋', description: 'Thư giãn cùng món ngon' }
];

export const MOOD_TAG_RULES = {
  'mood-hungry': ['no'],
  'mood-light': ['thanh-mat', 'dinh-duong'],
  'mood-spicy': ['cay'],
  'mood-fast': ['tiet-kiem', 'an-vui'],
  'mood-healthy': ['dinh-duong', 'thanh-mat'],
  'mood-snack': ['an-vui', 'vui'],
  'mood-sweet': ['ngot-ngao', 'giai-khat'],
  'mood-soup': [],
  'mood-crispy': ['gion-rum'],
  'mood-group': ['no', 'an-vui'],
  'mood-relax': ['thanh-mat', 'giai-khat']
};

/** Danh mục món tráng miệng, xem thêm categoryFilter.js */
const DESSERT_CATEGORY = 'mon-ngot';

/**
 * Tâm trạng sinh thêm theo danh mục. Trước đây mọi món chay và mọi món an-vat đều bị
 * gán thẳng vào "Ăn nhẹ"/"Ăn vặt", nên khi thêm danh sách món ngọt vào an-vat thì cả
 * bộ món ngọt tràn vào hai tâm trạng đó. Giờ chỉ suy ra tâm trạng khi món thuộc đúng
 * danh mục, và món ngọt không mượn tâm trạng của danh mục khác.
 */
const CATEGORY_MOOD_RULES = {
  'mon-nuoc': ['mood-soup'],
  'an-vat': ['mood-snack'],
  'do-uong': ['mood-light']
};

/**
 * Tâm trạng không nhận món ngọt dù món đó có mang tag trùng khớp. "Đang đói",
 * "Ăn cùng nhóm" và "Ăn vặt" nói về món ăn no và món ăn kèm để nhấn no, món ngọt
 * không thỏa được ba ý này nên phải loại ra.
 */
const DESSERT_EXCLUDED_MOODS = ['mood-hungry', 'mood-group', 'mood-snack'];

/** Món có phải món tráng miệng không */
export function isDessert(dish) {
  if (!dish) return false;
  return dish.category === DESSERT_CATEGORY || (dish.tags || []).includes('ngot-ngao');
}

export function getDishMoods(dish) {
  if (!dish) return [];

  const explicitMoods = Array.isArray(dish.moods) ? dish.moods : [];
  const tags = dish.tags || [];
  const dessert = isDessert(dish);

  const matchedMoods = Object.entries(MOOD_TAG_RULES)
    .filter(([, moodTags]) => moodTags.some(tag => tags.includes(tag)))
    .filter(([moodId]) => !(dessert && DESSERT_EXCLUDED_MOODS.includes(moodId)))
    .map(([moodId]) => moodId);

  (CATEGORY_MOOD_RULES[dish.category] || []).forEach(moodId => {
    if (!dessert && !matchedMoods.includes(moodId)) matchedMoods.push(moodId);
  });

  // Món chay vẫn hợp "Ăn nhẹ" như trước, chỉ trừ món ngọt vì chè bánh không phải bữa nhẹ
  if (dish.type === 'chay' && !dessert && !matchedMoods.includes('mood-light')) {
    matchedMoods.push('mood-light');
  }

  return [...new Set([...explicitMoods, ...matchedMoods])];
}

export function filterByMood(dishes, moodId) {
  if (!dishes || !Array.isArray(dishes)) return [];
  if (!moodId || moodId === 'tat-ca') return dishes;

  return dishes.filter(dish => getDishMoods(dish).includes(moodId));
}

export function renderMoodFilter(containerEl, activeMood, onMoodChange) {
  if (!containerEl) return;
  containerEl.innerHTML = '';

  const panel = document.createElement('div');
  panel.className = 'mood-picker';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Chọn tâm trạng ăn uống');

  MOODS.forEach(mood => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `mood-option ${mood.id === activeMood ? 'active' : ''}`;
    button.dataset.mood = mood.id;
    button.setAttribute('aria-pressed', String(mood.id === activeMood));
    button.innerHTML = `
      <span class="mood-option-icon" aria-hidden="true">${mood.icon}</span>
      <span class="mood-option-copy">
        <strong>${mood.label}</strong>
        <small>${mood.description}</small>
      </span>
    `;
    button.addEventListener('click', () => onMoodChange(mood.id));
    panel.appendChild(button);
  });

  containerEl.appendChild(panel);
}
