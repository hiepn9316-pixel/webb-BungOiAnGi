/**
 * Các key lưu trữ phía Client theo đặc tả SRS mục 13.2
 */
export const STORAGE_KEYS = {
  FAVORITES: 'bungoi_favorites',
  HISTORY: 'bungoi_history',
  EXCLUDED: 'bungoi_excluded',
  STATS: 'bungoi_stats',
  ACHIEVEMENTS: 'bungoi_achievements',
  DUEL: 'bungoi_duel'
};

/**
 * Số món tối đa được giữ trong lịch sử (BR05)
 */
export const MAX_HISTORY = 10;

/**
 * Số kỳ đấu 1vs1 tối đa được giữ lại (F09)
 */
export const MAX_DUEL_RECORDS = 10;

/**
 * Đọc một mảng số ID từ localStorage, luôn trả về mảng hợp lệ
 * @param {string} key
 * @returns {Array<number>}
 */
function readIdList(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn(`Giá trị "${key}" trong localStorage không phải mảng, bỏ qua.`);
      return [];
    }
    return parsed.map(Number).filter(n => Number.isFinite(n));
  } catch (error) {
    console.warn(`Không đọc được "${key}" từ localStorage:`, error);
    return [];
  }
}

/**
 * Ghi một mảng số ID xuống localStorage
 * @param {string} key
 * @param {Array<number>} list
 * @returns {boolean} true nếu ghi thành công
 */
function writeIdList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify([...new Set(list)]));
    return true;
  } catch (error) {
    console.warn(`Không ghi được "${key}" vào localStorage:`, error);
    return false;
  }
}

/**
 * Lấy danh sách ID món yêu thích
 * @returns {Array<number>}
 */
export function getFavoriteIds() {
  return readIdList(STORAGE_KEYS.FAVORITES);
}

/**
 * Kiểm tra một món có nằm trong danh sách yêu thích không
 * @param {number} id
 * @returns {boolean}
 */
export function isFavorite(id) {
  return getFavoriteIds().includes(Number(id));
}

/**
 * Thêm hoặc xoá một món khỏi danh sách yêu thích (BR04: không trùng lặp)
 * @param {number} id
 * @returns {boolean} true nếu vừa thêm vào, false nếu vừa xoá
 */
export function toggleFavorite(id) {
  const dishId = Number(id);
  const list = getFavoriteIds();
  const index = list.indexOf(dishId);
  const added = index === -1;

  if (added) {
    list.push(dishId);
  } else {
    list.splice(index, 1);
  }

  writeIdList(STORAGE_KEYS.FAVORITES, list);
  return added;
}

/**
 * Lấy danh sách ID món bị loại khỏi kết quả random
 * @returns {Array<number>}
 */
export function getExcludedIds() {
  return readIdList(STORAGE_KEYS.EXCLUDED);
}

/**
 * Thêm món vào danh sách không thích
 * @param {number} id
 * @returns {boolean}
 */
export function addExcluded(id) {
  const dishId = Number(id);

  if (!Number.isFinite(dishId)) {
    return false;
  }

  const list = getExcludedIds();

  if (list.includes(dishId)) {
    return false;
  }

  list.push(dishId);
  writeIdList(STORAGE_KEYS.EXCLUDED, list);

  return true;
}

/**
 * Xóa món khỏi danh sách không thích
 * @param {number} id
 * @returns {boolean}
 */
export function removeExcluded(id) {
  const dishId = Number(id);
  const list = getExcludedIds();

  const next = list.filter(item => item !== dishId);

  if (next.length === list.length) {
    return false;
  }

  writeIdList(STORAGE_KEYS.EXCLUDED, next);

  return true;
}

/**
 * Kiểm tra món có nằm trong danh sách không thích không
 * @param {number} id
 * @returns {boolean}
 */
export function isExcluded(id) {
  return getExcludedIds().includes(Number(id));
}

/**
 * Lấy danh sách lịch sử món, mới nhất trước (BR05: tối đa 10 món)
 * @returns {Array<Object>}
 */
export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Không đọc được "${STORAGE_KEYS.HISTORY}" từ localStorage:`, error);
    return [];
  }
}

/**
 * Ghi một món vào lịch sử, món mới nhất lên đầu và chỉ giữ tối đa MAX_HISTORY món
 * @param {number} id
 * @param {string} name - Tên món để hiển thị khi món không còn trong danh mục
 * @returns {Array<Object>} Lịch sử sau khi cập nhật
 */
export function addHistory(id, name = '') {
  const dishId = Number(id);
  const entry = { id: dishId, name, at: Date.now() };

  const next = [entry, ...getHistory().filter(item => item.id !== dishId)].slice(0, MAX_HISTORY);

  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(next));
  } catch (error) {
    console.warn(`Không ghi được "${STORAGE_KEYS.HISTORY}" vào localStorage:`, error);
  }

  return next;
}

/* ============ F09 - Kết quả đấu món 1 vs 1 ============ */

/**
 * Đọc toàn bộ dữ liệu đấu 1vs1 đã lưu: danh sách kỳ đấu + bảng tổng số lượt thắng
 * @returns {{ duels: Array<Object>, wins: Object<number, {name: string, count: number}> }}
 */
export function getDuelRecords() {
  const empty = { duels: [], wins: {} };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DUEL);
    if (!raw) return empty;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return empty;

    return {
      duels: Array.isArray(parsed.duels) ? parsed.duels : [],
      wins: parsed.wins && typeof parsed.wins === 'object' && !Array.isArray(parsed.wins) ? parsed.wins : {}
    };
  } catch (error) {
    console.warn(`Không đọc được "${STORAGE_KEYS.DUEL}" từ localStorage:`, error);
    return empty;
  }
}

/**
 * Lưu kết quả một kỳ đấu 1vs1 và cộng dồn số lượt thắng của nhà vô địch
 * @param {Object} result - Kết quả từ getDuelResult() trong duel.js
 * @returns {{ duels: Array<Object>, wins: Object }} Dữ liệu sau khi cập nhật
 */
export function saveDuelResult(result) {
  if (!result || !result.championId || !result.championName) {
    return getDuelRecords();
  }

  const { duels, wins } = getDuelRecords();
  const dishId = String(result.championId);

  const record = {
    championId: result.championId,
    championName: result.championName,
    rounds: result.rounds,
    size: result.size,
    won: result.won,
    at: result.at
  };

  const previous = wins[dishId] || { name: result.championName, count: 0 };
  wins[dishId] = { name: result.championName, count: (previous.count || 0) + 1 };

  const next = { duels: [record, ...duels].slice(0, MAX_DUEL_RECORDS), wins };

  try {
    localStorage.setItem(STORAGE_KEYS.DUEL, JSON.stringify(next));
  } catch (error) {
    console.warn(`Không ghi được "${STORAGE_KEYS.DUEL}" vào localStorage:`, error);
  }

  return next;
}
