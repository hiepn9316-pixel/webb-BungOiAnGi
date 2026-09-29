/**
 * Kho ảnh món ăn nằm sẵn trong /public.
 *
 * Trước đây dishes.json trỏ ảnh về Unsplash nên nhiều món khác loại bị dùng chung
 * một ảnh (VD "Combo Hải Sản Nướng" 190k cùng ảnh với "Bánh Bột Lọc Huế" 25k).
 * Nay mỗi nhóm danh mục dùng một bộ ảnh riêng, chọn theo thứ tự nên món trong cùng
 * nhóm vẫn xen kẽ ảnh khác nhau chứ không dồn hết vào một tấm.
 *
 * Đổi ảnh ở đây rồi chạy lại `npm run build` là xong, không phải sửa tay trong JSON.
 */
const IMAGE_POOLS = {
  'mon-nuoc': [0, 1, 2, 3, 4].map(i => `food-hd-${i}.webp`),
  'mon-com': [0, 1, 2, 3].map(i => `food-lunch-${i}.webp`),
  'mon-kho': [0, 1, 2].map(i => `food-expanded-${i}.webp`),
  'an-vat': [5, 6, 7, 8].map(i => `food-hd-${i}.webp`).concat('food-common-0.webp'),
  'mon-ngot': [5, 6, 7, 8].map(i => `food-hd-${i}.webp`).concat('food-common-0.webp'),
  'do-uong': [5, 6, 7].map(i => `food-hd-${i}.webp`).concat('food-common-0.webp')
};

/** Ảnh dùng cho món không rơi vào nhóm nào, và cả khi ảnh chính hỏng */
export const FALLBACK_FOOD_IMAGE = '/food-common-0.webp';

/** Danh sách đầy đủ ảnh đang có, dùng để kiểm tra file có thật không */
export const ALL_FOOD_IMAGES = Array.from(new Set(Object.values(IMAGE_POOLS).flat()));

/**
 * Chọn ảnh cho một món theo nhóm danh mục.
 * Vị trí món trong nhóm quyết định ảnh, nên thêm món mới giữa danh sách không làm
 * các món cũ đổi ảnh lung tung.
 * @param {string} categoryId - Mã danh mục của món
 * @param {number} indexInCategory - Thứ tự của món trong nhóm đó
 * @returns {string} Đường dẫn ảnh trong /public
 */
export function pickFoodImage(categoryId, indexInCategory) {
  const pool = IMAGE_POOLS[categoryId];
  if (!pool || pool.length === 0) return FALLBACK_FOOD_IMAGE;
  const index = Number.isInteger(indexInCategory) && indexInCategory >= 0 ? indexInCategory : 0;
  return `/${pool[index % pool.length]}`;
}

/**
 * Gán ảnh cho toàn bộ danh sách món, ghi đè ảnh cũ đang trỏ ra ngoài.
 * Gọi một lần sau khi nạp dishes.json, trước khi render.
 * @param {Array} dishes - Danh sách món ăn
 * @returns {Array} Chính danh sách đó, đã có ảnh hợp lệ
 */
export function applyFoodImages(dishes) {
  if (!Array.isArray(dishes)) return dishes;

  const counters = new Map();
  dishes.forEach(dish => {
    const categoryId = dish.category;
    const index = counters.get(categoryId) ?? 0;
    counters.set(categoryId, index + 1);
    dish.image = pickFoodImage(categoryId, index);
  });

  return dishes;
}

/**
 * Ảnh thay thế lúc runtime khi ảnh chính không tải được.
 * Dùng SVG gộp trong chính data URI nên không phụ thuộc mạng, khác với
 * via.placeholder.com trước đây là dịch vụ ngoài có thể chết bất cứ lúc nào.
 * @param {string} alt - Chữ hiện trong ảnh thay thế
 * @returns {string} data URI
 */
export function foodImageFallback(alt = 'Món ăn') {
  // Bỏ cả dấu nháy đơn: data URI được nhúng trong thuộc tính onerror đặt trong
  // nháy đơn, mà encodeURIComponent không thoát được dấu nháy đơn
  const label = String(alt).replace(/[<>&"']/g, '').slice(0, 18);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
<rect width="400" height="300" fill="#1c1a17"/>
<text x="200" y="150" fill="#8d8477" font-family="system-ui,sans-serif" font-size="22"
 text-anchor="middle">${label}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
