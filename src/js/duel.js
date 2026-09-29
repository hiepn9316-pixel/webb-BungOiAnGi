import { formatCurrency, getCategoryName } from './dishRender.js';
import { DISH_TYPES } from './filterUtils.js';

/**
 * Các lựa chọn độ dài kỳ đấu 1vs1 (F09)
 * Mỗi lượt loại đúng một nửa số mòn lại, nên số món cần có = 2 ^ rounds
 */
export const DUEL_ROUND_OPTIONS = [
  { rounds: 2, icon: '🥊', label: 'Ngắn · 4 món' },
  { rounds: 3, icon: '⚔️', label: 'Vừa · 8 món' },
  { rounds: 4, icon: '🏟️', label: 'Dài · 16 món' }
];

export const DEFAULT_DUEL_ROUNDS = 3;

/**
 * Trạng thái của một kỳ đấu đang chạy
 * - picking: đang chờ người dùng chọn món thắng ở lượt hiện tại
 * - decided: đã chọn xong lượt hiện tại, chờ bấm sang lượt tiếp theo
 * - finished: đã xong kỳ đấu, có nhà vô địch
 *
 * Hai trạng thái "chưa bắt đầu" và "không đủ món" (BR03) không nằm trong state:
 * được biểu diễn bằng duel = null kèm message do main.js truyền vào.
 */
export const DUEL_PHASE = {
  PICKING: 'picking',
  DECIDED: 'decided',
  FINISHED: 'finished'
};

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/600x400?text=BungOiAnGi';

/* ============ Logic kỳ đấu ============ */

/**
 * Trộn ngẫu nhiên một mảng mà không làm thay đổi mảng gốc
 * @param {Array} items
 * @returns {Array} Mảng mới đã trộn
 */
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Tính số lượt khả thi dựa trên số món hiện có (không vượt quá số lượt người dùng chọn)
 * @param {number} poolSize - Số món ứng viên
 * @param {number} wantedRounds - Số lượt người dùng muốn chơi
 * @returns {number} Số lượt thực tế, 0 nếu không đủ 2 món
 */
export function getDuelRoundCount(poolSize, wantedRounds = DEFAULT_DUEL_ROUNDS) {
  if (!Number.isFinite(poolSize) || poolSize < 2) return 0;
  const rounds = Math.min(wantedRounds, Math.floor(Math.log2(poolSize)));
  return rounds < 1 ? 0 : rounds;
}

/**
 * Khởi tạo một kỳ đấu mới từ danh sách món ứng viên
 * @param {Array} pool - Danh sách món đã áp dụng bộ lọc (BR01) và đã loại trừ (BR02)
 * @param {number} wantedRounds - Số lượt người dùng muốn chơi
 * @returns {Object|null} State của kỳ đấu, null nếu không đủ món (BR03)
 */
export function createDuelState(pool, wantedRounds = DEFAULT_DUEL_ROUNDS) {
  const totalRounds = getDuelRoundCount(Array.isArray(pool) ? pool.length : 0, wantedRounds);
  if (totalRounds === 0) return null;

  // Mỗi món chỉ được vào kỳ đấu một lần: cắt đúng 2^totalRounds món sau khi trộn
  const queue = shuffle(pool).slice(0, 2 ** totalRounds);

  return {
    phase: DUEL_PHASE.PICKING,
    totalRounds,
    size: queue.length,
    round: 1,
    participants: [...queue],             // toàn bộ món của kỳ đấu, dùng để kiểm tra bộ lọc
    queue,                               // các món còn tranh ở lượt hiện tại (đã bỏ món vừa giải quyết)
    carried: [],                         // các món thắng lượt hiện tại, chờ sang lượt sau
    matchup: [queue[0], queue[1]],
    lastWinnerId: null,
    tally: {},                           // { [dishId]: soLuotThang }
    log: [],                             // [{ round, winnerId, winnerName, loserName }]
    champion: null
  };
}

/**
 * Người dùng chọn món thắng ở lượt hiện tại, món còn lại bị loại
 * @param {Object} state - State kỳ đấu
 * @param {string} side - 'left' | 'right'
 * @returns {Object} Chính state sau khi cập nhật
 */
export function pickDuelSide(state, side) {
  if (!state || state.phase !== DUEL_PHASE.PICKING || !state.matchup) return state;

  const winnerIndex = side === 'right' ? 1 : 0;
  const winner = state.matchup[winnerIndex];
  const loser = state.matchup[winnerIndex === 0 ? 1 : 0];
  if (!winner) return state;

  state.tally[winner.id] = (state.tally[winner.id] || 0) + 1;
  state.log.push({
    round: state.round,
    winnerId: winner.id,
    winnerName: winner.name,
    loserName: loser.name
  });

  state.carried.push(winner);
  state.queue = state.queue.filter(dish => dish.id !== winner.id && dish.id !== loser.id);
  state.lastWinnerId = winner.id;
  state.phase = DUEL_PHASE.DECIDED;

  // Hết lượt cuối cùng thì món vừa thắng chính là nhà vô địch
  if (state.round >= state.totalRounds) {
    state.champion = winner;
    state.phase = DUEL_PHASE.FINISHED;
    state.matchup = null;
    state.carried = [];
  }

  return state;
}

/**
 * Chuyển sang lượt tiếp theo sau khi đã chọn xong lượt hiện tại
 * @param {Object} state - State kỳ đấu
 * @returns {Object} Chính state sau khi cập nhật
 */
export function nextDuelRound(state) {
  if (!state || state.phase !== DUEL_PHASE.DECIDED) return state;

  // Hết món ở lượt hiện tại => các món thắng lập thành bảng đấu của lượt sau
  if (state.queue.length === 0) {
    state.queue = state.carried;
    state.carried = [];
    state.round += 1;
  }

  state.matchup = [state.queue[0], state.queue[1]];
  state.lastWinnerId = null;
  state.phase = DUEL_PHASE.PICKING;
  return state;
}

/**
 * Lấy kết quả cuối cùng của kỳ đấu để lưu xuống LocalStorage
 * @param {Object} state - State kỳ đấu
 * @returns {Object|null} Kết quả, null nếu kỳ đấu chưa kết thúc
 */
export function getDuelResult(state) {
  if (!state || state.phase !== DUEL_PHASE.FINISHED || !state.champion) return null;

  return {
    championId: state.champion.id,
    championName: state.champion.name,
    championPrice: state.champion.price,
    rounds: state.totalRounds,
    size: state.size,
    won: state.tally[state.champion.id] || 0,
    log: state.log.map(item => ({ ...item })),
    at: Date.now()
  };
}

/* ============ Giao diện ============ */

/**
 * Định dạng mốc thời gian kiểu 14:30
 * @param {number} timestamp
 * @returns {string}
 */
function formatClock(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Tạo HTML cho một thẻ món trong trận đấu
 * @param {Object} dish - Món ăn
 * @param {string} side - 'left' | 'right'
 * @param {Object} duel - State kỳ đấu
 * @param {boolean} animate - Có chạy hiệu ứng xuất hiện hay không
 * @returns {string} HTML string
 */
function buildDuelCardHTML(dish, side, duel, animate) {
  const decided = duel.phase === DUEL_PHASE.DECIDED;
  const isWinner = decided && duel.lastWinnerId === dish.id;

  const type = DISH_TYPES.find(t => t.id === dish.type);
  const typeBadge = type
    ? `<span class="detail-badge ${dish.type === 'chay' ? 'detail-badge-chay' : 'detail-badge-man'}">${type.icon} ${type.name}</span>`
    : '';

  const tagsHTML = (dish.tags || [])
    .map(tag => `<span class="tag-chip">#${tag}</span>`)
    .join('');

  const flagHTML = decided
    ? `<span class="duel-card-flag ${isWinner ? 'duel-card-flag-win' : 'duel-card-flag-lose'}">
         ${isWinner ? '🏆 Thắng lượt này' : '😢 Bị loại'}
       </span>`
    : '';

  return `
    <article class="duel-card${decided ? (isWinner ? ' duel-card--winner' : ' duel-card--loser') : ''}${animate ? ' duel-card--enter' : ''}" data-side="${side}">
      <div class="duel-card-media">
        <img
          class="duel-card-image"
          src="${dish.image}"
          alt="${dish.name}"
          loading="lazy"
          onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';"
        />
        <span class="category-badge">${getCategoryName(dish.category)}</span>
        ${flagHTML}
      </div>
      <div class="duel-card-body">
        <div class="detail-badges">${typeBadge}</div>
        <h3 class="duel-card-name">${dish.name}</h3>
        <p class="duel-card-desc">${dish.description}</p>
        <div class="detail-tags">${tagsHTML}</div>
        <div class="duel-card-foot">
          <span class="duel-card-price">${formatCurrency(dish.price)}</span>
        </div>
        <button
          type="button"
          class="duel-pick-btn"
          data-action="pick"
          data-side="${side}"
          aria-label="Chọn ${dish.name} là món thắng lượt này"
          ${decided ? 'disabled' : ''}
        >✊ CHỌN MÓN NÀY</button>
      </div>
    </article>
  `;
}

/**
 * Tạo thanh tiến trình các lượt đấu
 * @param {Object} duel - State kỳ đấu
 * @returns {string} HTML string
 */
function buildScoreboardHTML(duel) {
  const dots = Array.from({ length: duel.totalRounds }, (_, index) => {
    const round = index + 1;
    const isDone = duel.phase === DUEL_PHASE.FINISHED || round < duel.round;
    const isCurrent = round === duel.round && duel.phase !== DUEL_PHASE.FINISHED;
    const cls = ['duel-dot', isDone ? 'is-done' : '', isCurrent ? 'is-current' : ''].filter(Boolean).join(' ');
    return `<span class="${cls}" aria-hidden="true">${isDone ? '★' : '☆'}</span>`;
  }).join('');

  return `
    <div class="duel-scoreboard">
      <div class="duel-round-track" aria-hidden="true">${dots}</div>
      <span class="duel-round-label">
        ${duel.phase === DUEL_PHASE.FINISHED
          ? '🏁 Kỳ đấu kết thúc'
          : `Lượt ${duel.round}/${duel.totalRounds}`}
      </span>
      <span class="duel-size-label">${duel.size} món tranh tài</span>
    </div>
  `;
}

/**
 * Tạo HTML cho khu vực trận đấu đang diễn ra
 * @param {Object} duel - State kỳ đấu
 * @param {boolean} animate - Có chạy hiệu ứng xuất hiện hay không
 * @returns {string} HTML string
 */
function buildMatchupHTML(duel, animate) {
  const [left, right] = duel.matchup;
  const decided = duel.phase === DUEL_PHASE.DECIDED;
  const winner = decided ? duel.matchup.find(dish => dish.id === duel.lastWinnerId) : null;
  const isFinalRound = duel.round >= duel.totalRounds;

  const decisionHTML = decided
    ? `
      <div class="duel-decision${animate ? ' duel-decision--enter' : ''}" role="status">
        <p class="duel-decision-text">🏆 <b>${winner.name}</b> thắng lượt ${duel.round}!</p>
        <button type="button" class="btn-duel-next" data-action="next">
          ${isFinalRound ? '🏁 Xem kết quả chung cuộc' : 'Tiếp tục lượt tiếp theo →'}
        </button>
      </div>
    `
    : `
      <p class="duel-hint">Chọn món bạn muốn ăn hơn — món thua sẽ bị loại khỏi kỳ đấu.</p>
    `;

  return `
    <div class="duel-stage-body">
      ${buildScoreboardHTML(duel)}
      <div class="duel-matchup" role="group" aria-label="Hai món đang đối đầu lượt ${duel.round}">
        ${buildDuelCardHTML(left, 'left', duel, animate)}
        <div class="duel-vs" aria-hidden="true">VS</div>
        ${buildDuelCardHTML(right, 'right', duel, animate)}
      </div>
      ${decisionHTML}
    </div>
  `;
}

/**
 * Tạo HTML cho kết quả chung cuộc của kỳ đấu
 * @param {Object} duel - State kỳ đấu
 * @param {boolean} animate - Có chạy hiệu ứng xuất hiện hay không
 * @returns {string} HTML string
 */
function buildResultHTML(duel, animate) {
  const champion = duel.champion;
  const won = duel.tally[champion.id] || 0;

  const recapHTML = duel.log
    .map(item => `
      <li class="duel-recap-item">
        <span class="duel-recap-round">Lượt ${item.round}</span>
        <span class="duel-recap-winner">${item.winnerName}</span>
        <span class="duel-recap-loser">thắng ${item.loserName}</span>
      </li>
    `)
    .join('');

  return `
    <div class="duel-result${animate ? ' duel-result--enter' : ''}">
      <div class="duel-champion" role="status">
        <span class="duel-champion-icon" aria-hidden="true">🏆</span>
        <div class="duel-champion-body">
          <span class="section-kicker">Món chiến thắng</span>
          <h3 class="duel-champion-name">${champion.name}</h3>
          <p class="duel-champion-meta">
            ${formatCurrency(champion.price)} · Thắng ${won}/${duel.totalRounds} lượt · Từ ${duel.size} món
          </p>
        </div>
        <button type="button" class="btn-duel-start" data-action="start">🔁 Đấu lại</button>
      </div>

      <div class="duel-recap-box">
        <h4 class="duel-subtitle">📜 Diễn biến kỳ đấu</h4>
        <ol class="duel-recap">${recapHTML}</ol>
      </div>
    </div>
  `;
}

/**
 * Tạo HTML bảng tổng số lượt thắng đã lưu trong LocalStorage
 * @param {Object} wins - Object { [dishId]: { name, count } }
 * @returns {string} HTML string
 */
function buildTallyHTML(wins) {
  const rows = Object.entries(wins || {})
    .map(([id, info]) => ({
      id: Number(id),
      name: (info && info.name) || `Món #${id}`,
      count: (info && info.count) || 0
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  if (rows.length === 0) return '';

  const top = rows.slice(0, 5);
  const max = top[0].count;

  return `
    <div class="duel-tally">
      <h4 class="duel-subtitle">🏅 Bảng thành tích đấu 1 vs 1</h4>
      <ul class="duel-tally-list">
        ${top.map((item, index) => `
          <li class="duel-tally-item">
            <span class="duel-tally-rank">${index + 1}</span>
            <span class="duel-tally-name">${item.name}</span>
            <span class="duel-tally-bar" aria-hidden="true">
              <i style="width:${Math.max(8, Math.round((item.count / max) * 100))}%"></i>
            </span>
            <span class="duel-tally-count">${item.count} lượt</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Tạo HTML danh sách các kỳ đấu gần đây
 * @param {Array<Object>} duels - Các kỳ đấu đã lưu, mới nhất trước
 * @returns {string} HTML string
 */
function buildHistoryHTML(duels) {
  if (!Array.isArray(duels) || duels.length === 0) return '';

  return `
    <div class="duel-history">
      <h4 class="duel-subtitle">🕒 Các kỳ đấu gần đây</h4>
      <ul class="duel-history-list">
        ${duels.slice(0, 5).map(item => `
          <li class="duel-history-item">
            <span class="duel-history-time">${formatClock(item.at)}</span>
            <span class="duel-history-name">🏆 ${item.championName}</span>
            <span class="duel-history-meta">${item.won}/${item.rounds} lượt · ${item.size} món</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Render giao diện đấu món 1vs1 (F09)
 * @param {HTMLElement} containerEl - Container chứa panel đấu
 * @param {Object} state - { duel, rounds, records, message }
 * @param {Object} handlers - { onStart, onRoundsChange, onPick, onNext }
 */
export function renderDuelPanel(containerEl, state, handlers = {}) {
  if (!containerEl) return;

  const { duel = null, rounds = DEFAULT_DUEL_ROUNDS, records = { duels: [], wins: {} }, message = '' } = state;
  const { onStart, onRoundsChange, onPick, onNext } = handlers;

  // Chỉ chạy hiệu ứng khi khung hình thực sự đổi, không re-animate khi người dùng đổi bộ lọc
  const stageKey = duel
    ? (duel.phase === DUEL_PHASE.FINISHED
      ? `champion-${duel.champion ? duel.champion.id : ''}-${duel.log.length}`
      : `match-${duel.matchup ? duel.matchup.map(dish => dish.id).join('_') : ''}-${duel.phase}`)
    : '';
  const animate = stageKey !== '' && containerEl.dataset.duelStageKey !== stageKey;
  containerEl.dataset.duelStageKey = stageKey;

  let stageHTML = '';

  if (message) {
    // BR03: không đủ món ứng viên để tổ chức kỳ đấu
    stageHTML = `
      <div class="duel-error" role="alert">
        <span class="duel-error-icon" aria-hidden="true">🚫</span>
        <p>${message}</p>
        <button type="button" class="btn-duel-start" data-action="start">Thử lại</button>
      </div>
    `;
  } else if (!duel) {
    stageHTML = `
      <div class="duel-idle">
        <span class="duel-idle-icon" aria-hidden="true">⚔️</span>
        <p>Chưa có trận nào. Chọn số lượt rồi bấm <b>Bắt đầu trận</b> để vào vòng loại!</p>
      </div>
    `;
  } else if (duel.phase === DUEL_PHASE.FINISHED) {
    stageHTML = buildResultHTML(duel, animate);
  } else {
    stageHTML = buildMatchupHTML(duel, animate);
  }

  // Khi không đủ món thì nút "Thử lại" trong khối thông báo đã đủ, không cần lặp lại ở header
  const startButton = message
    ? ''
    : `<button type="button" class="btn-duel-start" data-action="start">${duel ? '🔁 Đấu lại' : '▶️ Bắt đầu trận'}</button>`;

  containerEl.innerHTML = `
    <div class="duel-panel">
      <div class="duel-panel-head">
        <div class="duel-panel-intro">
          <span class="section-kicker">Khó chọn giữa hai món?</span>
          <h2 class="duel-panel-title">⚔️ Đấu món 1 vs 1</h2>
          <p class="duel-panel-hint">
            Mỗi lượt bạn chọn một món thắng, mòn thua bị loại. Đi hết các lượt để tìm ra nhà vô địch trong bộ món đang lọc!
          </p>
        </div>
        <div class="duel-panel-action">
          <div class="duel-round-options" role="group" aria-label="Chọn số lượt đấu">
            ${DUEL_ROUND_OPTIONS.map(option => `
              <button
                type="button"
                class="duel-round-opt${option.rounds === rounds ? ' active' : ''}"
                data-rounds="${option.rounds}"
                aria-pressed="${option.rounds === rounds}"
              >${option.icon} ${option.label}</button>
            `).join('')}
          </div>
          ${startButton}
        </div>
      </div>

      <div class="duel-stage">${stageHTML}</div>

      ${buildTallyHTML(records.wins)}
      ${buildHistoryHTML(records.duels)}
    </div>
  `;

  containerEl.querySelectorAll('[data-action="start"]').forEach(btn => {
    btn.addEventListener('click', () => onStart && onStart());
  });

  containerEl.querySelectorAll('[data-rounds]').forEach(btn => {
    btn.addEventListener('click', () => onRoundsChange && onRoundsChange(Number(btn.dataset.rounds)));
  });

  containerEl.querySelectorAll('[data-action="pick"]').forEach(btn => {
    btn.addEventListener('click', () => onPick && onPick(btn.dataset.side));
  });

  const nextBtn = containerEl.querySelector('[data-action="next"]');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => onNext && onNext());
  }
}
