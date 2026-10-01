// ============================================================
// 🤔 BungOiAnGi – Tính năng Quiz "Hôm nay ăn gì?"
// ============================================================

export const QUIZ_QUESTIONS = [
  {
    q: '🌅 Đây là bữa ăn nào?',
    key: 'meal',
    opts: [
      { icon: '☀️', label: 'Bữa sáng', value: 'sang' },
      { icon: '🌤️', label: 'Bữa trưa', value: 'trua' },
      { icon: '🌙', label: 'Bữa tối', value: 'toi' },
      { icon: '🌜', label: 'Ăn khuya', value: 'khuya' },
    ],
  },
  {
    q: '👥 Bạn ăn với ai?',
    key: 'with',
    opts: [
      { icon: '🙋', label: 'Một mình', value: 'alone' },
      { icon: '👫', label: 'Cùng người thương', value: 'couple' },
      { icon: '👨‍👩‍👧‍👦', label: 'Cả gia đình', value: 'family' },
      { icon: '🎉', label: 'Nhóm bạn đông vui', value: 'group' },
    ],
  },
  {
    q: '👅 Khẩu vị hôm nay?',
    key: 'taste',
    opts: [
      { icon: '🍲', label: 'Đậm đà, no nê', value: 'rich' },
      { icon: '🥗', label: 'Thanh đạm, nhẹ bụng', value: 'light' },
      { icon: '🌶️', label: 'Cay nồng xé lưỡi', value: 'spicy' },
      { icon: '💸', label: 'Ngon mà rẻ thôi', value: 'cheap' },
    ],
  },
];

/**
 * Phân tích câu trả lời quiz để tìm tâm trạng (mood) phù hợp
 * @param {Object} answers - Các lựa chọn { meal, with, taste }
 * @returns {string} ID của mood tương ứng
 */
export function resolveQuizMood(answers) {
  const { taste, with: withWho } = answers || {};
  if (taste === 'spicy') return 'cay';
  if (taste === 'light') return 'healthy';
  if (taste === 'cheap') return 'ngheo';
  if (withWho === 'group') return 'party';
  return 'ngon';
}
