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

const MOOD_TAG_RULES = {
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

export function filterByMood(dishes, moodId) {
  if (!dishes || !Array.isArray(dishes)) return [];
  if (!moodId || moodId === 'tat-ca') return dishes;

  return dishes.filter(dish => {
    if (Array.isArray(dish.moods) && dish.moods.includes(moodId)) return true;

    const tags = dish.tags || [];
    const tagMatches = (MOOD_TAG_RULES[moodId] || []).some(tag => tags.includes(tag));
    if (tagMatches) return true;

    if (moodId === 'mood-soup') return dish.category === 'mon-nuoc';
    if (moodId === 'mood-light') return dish.type === 'chay' || dish.category === 'do-uong';
    if (moodId === 'mood-snack') return dish.category === 'an-vat';
    if (moodId === 'mood-group') return dish.price >= 35000;
    return false;
  });
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
