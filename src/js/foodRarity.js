/**
 * Bậc hiếm của món, quyết định từ mức giá.
 *
 * Bộ âm thanh trong /public/sounds chia theo đúng 4 bậc hiếm của game (rare → ancient),
 * nên bậc ở đây là cầu nối để tiếng mở hòm nghe hợp với giá trị món vừa trúng:
 * bốc trúng món rẻ sẽ "tách" một tiếng, còn món đắt nhất thì nổ tiếng hiếm nhất.
 */

/** Thứ tự từ thấp lên cao, dùng để so sánh nâng cấp bậc */
export const RARITY_ORDER = ['common', 'rare', 'mythical', 'legendary', 'ancient'];

/**
 * Mốc giá của từng bậc. Ngưỡng chọn theo cách giá các món đang nằm rải trong
 * danh sách nên mỗi bậc đều có món thật, không bị bậc nào trống rỗng.
 * `max` là số tiền lớn nhất của bậc, không tính sẽ rơi xuống bậc kế tiếp.
 */
export const RARITY_TIERS = [
  // Bộ file chỉ có 4 bậc nên bậc thấp nhất mượn luôn file "hiếm" nhưng nhỏ tiếng hơn:
  // vẫn có tiếng riêng cho 12 món phổ thông, mà không nghe như vừa trúng món đắc
  { id: 'common', label: 'Phổ thông', min: 0, max: 19999, sound: 'revealRare', gain: 0.6, icon: '🥄' },
  { id: 'rare', label: 'Hiếm', min: 20000, max: 34999, sound: 'revealRare', gain: 0.8, icon: '🔹' },
  { id: 'mythical', label: 'Huyền thoại nhẹ', min: 35000, max: 54999, sound: 'revealMythical', gain: 0.9, icon: '💠' },
  { id: 'legendary', label: 'Huyền thoại', min: 55000, max: 99999, sound: 'revealLegendary', gain: 1, icon: '🔶' },
  { id: 'ancient', label: 'Cổ đại', min: 100000, max: Infinity, sound: 'revealAncient', gain: 1, icon: '💎' }
];

const DEFAULT_RARITY = RARITY_TIERS[0];

/**
 * Bậc hiếm của một món theo giá.
 * @param {number} price - Giá món
 * @returns {Object} Thông tin bậc (id, label, icon, sound, gain)
 */
export function rarityForPrice(price) {
  const value = Number(price);
  if (!Number.isFinite(value) || value < RARITY_TIERS[0].min) return DEFAULT_RARITY;
  return RARITY_TIERS.find(tier => value <= tier.max) || RARITY_TIERS[RARITY_TIERS.length - 1];
}

/**
 * Bậc hiếm của một món đã nạp. Ưu tiên trường `rarity` nếu có sẵn, còn không thì tính lại
 * từ giá, nên dữ liệu tay vẫn ghi đè được bậc mặc định.
 * @param {Object} dish - Món ăn
 * @returns {Object} Thông tin bậc
 */
export function rarityOf(dish) {
  if (!dish) return DEFAULT_RARITY;
  if (dish.rarity) {
    const preset = RARITY_TIERS.find(tier => tier.id === dish.rarity);
    if (preset) return preset;
  }
  return rarityForPrice(dish.price);
}

/**
 * Tên hiển thị kèm biểu tượng, ví dụ "💎 Cổ đại".
 * @param {Object} dish - Món ăn
 * @returns {string}
 */
export function rarityLabel(dish) {
  const rarity = rarityOf(dish);
  return `${rarity.icon} ${rarity.label}`;
}
