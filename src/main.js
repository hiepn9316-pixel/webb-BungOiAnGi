// ============================================================
// 🍜 BungOiAnGi – Ứng Dụng Gợi Ý Món Ăn (Main App Shell)
// ============================================================

import './styles/main.css';
import './features/airdrop/airdrop.css';

import { dishes, MOODS, BUDGETS, CATEGORIES } from './data/dishes.js';
import { filterDishes, sortDishes, getRandomDish, getCategoryLabel } from './features/filters/dishFilters.js';
import { QUIZ_QUESTIONS, resolveQuizMood } from './features/quiz/quizData.js';
import { initAirdropManager } from './features/airdrop/airdropManager.js';
import { playClick, playSelect, playBup, playWin } from './utils/uiAudio.js';
import { burst, megaBurst } from './utils/confetti.js';
import { formatCurrency } from './utils/formatCurrency.js';
import { recordServiceClick } from './utils/serviceClickStats.js';
import {
  findNearbyPlaces,
  getCurrentPosition,
  googleMapsDirectionsUrl,
  renderNearbyMap,
  serviceSearchUrl
} from './features/nearby/nearbyPlaces.js';

// ============================================================
// STATE QUẢN LÝ ỨNG DỤNG
// ============================================================
const state = {
  activePage: 'home',
  mood: null,
  budget: 'all',
  exploreDiet: 'all',
  exploreTags: [],
  exploreSort: 'default',
  favorites: JSON.parse(localStorage.getItem('bung_favs') || '[]'),
  quizAnswers: {},
  quizStep: 0,
  quizAdvancing: false,
};

// ============================================================
// RENDER: APP SHELL & HEADER & PAGES
// ============================================================
function renderApp() {
  document.getElementById('app').innerHTML = `
    ${renderHeader()}
    ${renderPages()}
    ${renderModal()}
  `;
  bindAll();
}

function renderHeader() {
  const favCount = state.favorites.length;
  return `
  <header class="header" id="header">
    <div class="header-inner">
      <a href="#" class="logo" id="logo-link">
        <span class="logo-icon">🍜</span>
        <span class="logo-text">
          <span class="logo-title">BUNGOIANGI</span>
          <span class="logo-sub">Bụng đói có món ngay ✨</span>
        </span>
      </a>
      <nav class="nav" id="main-nav">
        <button class="nav-btn active" data-page="home" id="nav-home">🏠 Trang chủ</button>
        <button class="nav-btn" data-page="explore" id="nav-explore">🔍 Khám phá</button>
        <button class="nav-btn" data-page="quiz" id="nav-quiz">🤔 Hôm nay ăn gì?</button>
        <button class="nav-btn" data-page="airdrop" id="nav-airdrop">🎁 Hòm thính</button>
      </nav>
      <button class="fav-btn" id="fav-nav-btn">
        ❤️ Gu của tôi
        ${favCount > 0 ? `<span class="fav-badge" id="fav-badge">${favCount}</span>` : `<span class="fav-badge hidden" id="fav-badge">0</span>`}
      </button>
    </div>
  </header>`;
}

function renderPages() {
  return `
    <main>
      <div id="page-home" class="page active">${renderHome()}</div>
      <div id="page-explore" class="page">${renderExplore()}</div>
      <div id="page-quiz" class="page">${renderQuiz()}</div>
      <div id="page-airdrop" class="page"><div id="airdrop-container"></div></div>
      <div id="page-favs" class="page">${renderFavs()}</div>
    </main>`;
}

// ============================================================
// 1. TRANG CHỦ (HOME PAGE)
// ============================================================
function renderHome() {
  const moodButtons = Object.values(MOODS).map(m => `
    <button class="mood-btn ${state.mood === m.id ? 'active' : ''}" data-mood="${m.id}" id="mood-${m.id}">
      <span class="m-emoji">${m.emoji}</span>
      <span class="m-label">${m.label}</span>
    </button>`).join('');

  const budgetButtons = BUDGETS.map(b => `
    <button class="budget-btn ${state.budget === b.id ? 'active' : ''}" data-budget="${b.id}" id="budget-${b.id}">
      <span class="b-label">${b.label}</span>
      ${b.sublabel ? `<span class="b-sub">${b.sublabel}</span>` : ''}
    </button>`).join('');

  return `
    <section class="hero-section">
      <div class="hero-box">
        <div class="hero-stickers">
          <span class="sticker">🍜</span>
          <span class="sticker">🔥</span>
          <span class="sticker">🥢</span>
          <span class="sticker">🌶️</span>
        </div>
        <h1 class="hero-title">HÔM NAY<br>ĂN GÌ?</h1>
        <p class="hero-tagline">"Để BungOiAnGi quyết định!"</p>
        <button class="bup-btn" id="bup-btn">
          <span class="btn-icon">🎲</span>
          BỤP! ĂN GÌ
        </button>
      </div>

      <div>
        <p class="section-label">Bạn đang cảm thấy...</p>
        <div class="mood-grid" id="mood-grid">${moodButtons}</div>
        <p class="section-label">Ngân sách hôm nay?</p>
        <div class="budget-row" id="budget-row">${budgetButtons}</div>
      </div>
    </section>

    <div class="container">
      <div class="section-header">
        <h2>🔥 Món được chọn nhiều</h2>
        <span class="section-badge" id="popular-count">${getFilteredPopular().length} món</span>
      </div>
      <div class="dishes-grid" id="popular-grid">
        ${renderDishCards(getFilteredPopular())}
      </div>

      <div class="section-header" style="margin-top:2.5rem">
        <h2>🍜 Khám phá món mới</h2>
        <span class="section-badge" id="new-count">${getFilteredNew().length} món</span>
      </div>
      <div class="dishes-grid" id="new-grid">
        ${renderDishCards(getFilteredNew())}
      </div>
    </div>`;
}

function getFilteredPopular() {
  return filterDishes(dishes, { moodId: state.mood, budgetId: state.budget }).filter(d => d.popular);
}
function getFilteredNew() {
  return filterDishes(dishes, { moodId: state.mood, budgetId: state.budget }).filter(d => !d.popular).slice(0, 8);
}

// ============================================================
// 2. TRANG KHÁM PHÁ (EXPLORE PAGE)
// ============================================================
function renderExplore() {
  const catBtns = CATEGORIES.map(c =>
    `<button class="cat-btn ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}" id="cat-${c.id}">${c.label}</button>`
  ).join('');

  const tagOptions = [
    { val: 'cay', label: '🌶️ Cay' },
    { val: 'no', label: '🍚 No bụng' },
    { val: 'tiet-kiem', label: '💸 Rẻ' },
    { val: 'ngot-ngao', label: '🍮 Ngọt' },
    { val: 'giai-khat', label: '🧋 Mát' },
    { val: 'thanh-mat', label: '🥗 Thanh' },
    { val: 'dam-da', label: '🔥 Đậm đà' },
    { val: 'dinh-duong', label: '💪 Lành' },
    { val: 'gion-rum', label: '🍗 Giòn' },
    { val: 'an-sang', label: '☀️ Sáng' },
    { val: 'phobien', label: '⭐ Top' },
    { val: 'an-vui', label: '🎉 Vui' },
  ];
  const tagBtns = tagOptions.map(t =>
    `<button class="tag-chip" data-tag="${t.val}">${t.label}</button>`
  ).join('');

  return `
    <div class="explore-header">
      <div class="explore-header-inner">
        <div class="explore-title-wrap">
          <h1>🔍 Khám Phá Món Ăn</h1>
          <span class="explore-subtitle">${dishes.length} món đặc sắc</span>
        </div>
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input class="search-input" type="text" id="explore-search" placeholder="Tìm tên món, tag... (phở, cơm, chè...)" />
        </div>
      </div>
    </div>

    <div class="explore-toolbar">
      <div class="explore-toolbar-inner">
        <div class="cat-scroll-wrap">
          <div class="category-tabs" id="cat-tabs">${catBtns}</div>
        </div>
        <div class="toolbar-divider"></div>
        <div class="diet-toggle-wrap">
          <button class="diet-toggle active" data-diet="all" id="diet-all">Tất cả</button>
          <button class="diet-toggle" data-diet="man" id="diet-man">🍖 Mặn</button>
          <button class="diet-toggle" data-diet="chay" id="diet-chay">🥗 Chay</button>
        </div>
        <div class="toolbar-divider"></div>
        <div class="sort-wrap">
          <span class="sort-label">↕️</span>
          <select id="explore-sort" class="sort-select">
            <option value="default">Mặc định</option>
            <option value="price-asc">Giá ↑</option>
            <option value="price-desc">Giá ↓</option>
            <option value="rating">⭐ Rating</option>
            <option value="calo">🔥 Calories</option>
          </select>
        </div>
      </div>
      <div class="tag-strip-wrap">
        <div class="tag-strip" id="tag-strip">${tagBtns}</div>
      </div>
    </div>

    <div class="explore-grid-wrap">
      <p class="explore-count" id="explore-count">${dishes.length} món</p>
      <div class="dishes-grid" id="explore-grid">
        ${renderDishCards(dishes)}
      </div>
    </div>`;
}

// ============================================================
// 3. TRANG QUIZ "HÔM NAY ĂN GÌ?"
// ============================================================
function renderQuiz() {
  const steps = QUIZ_QUESTIONS.map((q, i) => `
    <div class="quiz-step ${i === 0 ? '' : 'hidden'}" data-step="${i}" id="quiz-step-${i}">
      <p class="quiz-q">${q.q}</p>
      <div class="quiz-options">
        ${q.opts.map(o => `
          <button class="quiz-opt" data-key="${q.key}" data-val="${o.value}" id="qopt-${q.key}-${o.value}">
            <span class="opt-icon">${o.icon}</span> ${o.label}
          </button>`).join('')}
      </div>
    </div>`).join('');

  const dots = QUIZ_QUESTIONS.map((_, i) => `<div class="quiz-dot ${i === 0 ? 'active' : ''}" id="quiz-dot-${i}"></div>`).join('');

  return `
    <div class="quiz-wrap">
      <div class="quiz-header">
        <h1>🤔 Hôm Nay Ăn Gì?</h1>
        <p>Trả lời 3 câu hỏi ngắn để nhận gợi ý món chuẩn khẩu vị!</p>
      </div>
      <div class="quiz-progress" id="quiz-progress">${dots}</div>
      ${steps}
      <div class="quiz-result hidden" id="quiz-result">
        <div class="quiz-result-dish" id="quiz-result-dish"></div>
        <div id="quiz-nearby-panel"></div>
        <div style="display:flex;gap:.75rem;margin-top:1rem">
          <button class="btn-primary" id="quiz-restart-btn">🔄 Thử lại</button>
          <button class="btn-secondary" id="quiz-save-btn">❤️ Lưu vào Gu</button>
        </div>
      </div>
    </div>`;
}

function resolveQuizResult() {
  const mood = resolveQuizMood(state.quizAnswers);
  return getRandomDish(dishes, mood, 'all') || dishes[Math.floor(Math.random() * dishes.length)];
}

function showQuizResult(dish) {
  for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
    document.getElementById(`quiz-step-${i}`)?.classList.add('hidden');
  }
  const result = document.getElementById('quiz-result');
  const dishEl = document.getElementById('quiz-result-dish');
  dishEl.innerHTML = `
    <img src="${dish.img}" alt="${dish.name}" style="width:100%;height:200px;object-fit:cover;border-radius:12px;margin-bottom:1rem" />
    <div class="quiz-result-name">${dish.name}</div>
    <div class="quiz-result-desc">${dish.desc}</div>
    <div class="dish-meta" style="justify-content:center;margin-bottom:.5rem">
      <span>⭐ ${dish.rating}</span> <span>🔥 ${dish.calo} kcal</span>
      <span>💰 ${formatCurrency(dish.price)}</span>
    </div>`;
  renderNearbyPanel(dish, document.getElementById('quiz-nearby-panel'));
  result.classList.remove('hidden');
  playWin();
  burst(window.innerWidth / 2, window.innerHeight / 2, 60);

  document.getElementById('quiz-save-btn').onclick = () => {
    toggleFav(dish.id);
    updateFavBadge();
    document.getElementById('quiz-save-btn').textContent = '✅ Đã lưu!';
  };
  document.getElementById('quiz-restart-btn').onclick = () => resetQuiz();
}

function resetQuiz() {
  state.quizAnswers = {};
  state.quizStep = 0;
  state.quizAdvancing = false;
  document.getElementById('quiz-result')?.classList.add('hidden');
  QUIZ_QUESTIONS.forEach((_, i) => {
    const step = document.getElementById(`quiz-step-${i}`);
    if (step) {
      step.classList.toggle('hidden', i !== 0);
      step.querySelectorAll('.quiz-opt').forEach(b => {
        b.disabled = false;
        b.classList.remove('selected');
      });
    }
  });
  updateQuizDots();
}

function updateQuizDots() {
  QUIZ_QUESTIONS.forEach((_, i) => {
    const dot = document.getElementById(`quiz-dot-${i}`);
    if (!dot) return;
    dot.className = 'quiz-dot';
    if (i < state.quizStep) dot.classList.add('done');
    else if (i === state.quizStep) dot.classList.add('active');
  });
}

// ============================================================
// 4. TRANG GU CỦA TÔI (FAVORITES PAGE)
// ============================================================
function renderFavs() {
  const favDishes = dishes.filter(d => state.favorites.includes(d.id));
  return `
    <div class="fav-page-header">
      <h1>❤️ Gu Của Tôi</h1>
      <p>Những món ăn bạn đã yêu thích và lưu lại</p>
    </div>
    <div class="container">
      ${favDishes.length === 0 ? `
        <div class="fav-empty">
          <div class="fe-icon">❤️</div>
          <p>Bạn chưa lưu món nào.<br>Bấm ❤️ trên món ăn để thêm vào đây!</p>
        </div>` : `
        <div style="margin-top:1.5rem"></div>
        <div class="dishes-grid">${renderDishCards(favDishes)}</div>`}
    </div>`;
}

// ============================================================
// DISH CARDS & MODAL
// ============================================================
function renderDishCards(list) {
  if (!list.length) return `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="es-icon">🍽️</div>
      <p>Không tìm thấy món phù hợp.<br>Thử chọn tâm trạng/ngân sách khác nhé!</p>
    </div>`;
  return list.map(d => {
    const saved = state.favorites.includes(d.id);
    const catLabel = getCategoryLabel(d.category);
    return `
      <div class="dish-card" data-dish="${d.id}" id="dish-card-${d.id}">
        <div class="card-img-wrap">
          <img class="dish-img" src="${d.img}" alt="${d.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80';" />
          <button class="dish-fav-btn ${saved ? 'saved' : ''}" data-fav="${d.id}" id="fav-${d.id}" aria-label="Lưu vào Gu">
            ${saved ? '❤️' : '🤍'}
          </button>
          <span class="dish-type-badge ${d.type === 'chay' ? 'chay' : 'man'}">
            ${d.type === 'chay' ? '🥗 Chay' : '🍖 Mặn'}
          </span>
          <span class="dish-price-badge">${formatCurrency(d.price)}</span>
        </div>
        <div class="dish-info">
          <div class="dish-header-row">
            <span class="dish-cat-pill">${catLabel}</span>
            <span class="dish-rating">⭐ ${d.rating}</span>
          </div>
          <h3 class="dish-name">${d.name}</h3>
          <p class="dish-desc">${d.desc}</p>
          <div class="dish-meta">
            <span>🔥 ${d.calo} kcal</span>
            <span>⏱️ ${d.time}</span>
          </div>
          <div class="dish-tags">
            ${(d.tags || []).slice(0, 3).map(t => `<span class="dish-tag">#${t}</span>`).join('')}
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderModal() {
  return `
    <div class="modal-overlay" id="dish-modal" role="dialog" aria-modal="true">
      <div class="modal" id="modal-box">
        <img id="modal-img" src="" alt="" class="modal-img" />
        <div class="modal-body">
          <div class="modal-name" id="modal-name"></div>
          <div class="modal-desc" id="modal-desc"></div>
          <div class="modal-facts" id="modal-facts"></div>
          <div class="modal-reason" id="modal-reason"></div>
          <div id="modal-nearby-panel"></div>
          <div class="modal-actions">
            <button class="btn-secondary" id="modal-change-btn">🔄 Đổi món khác</button>
            <button class="btn-primary" id="modal-save-btn">❤️ Lưu vào Gu</button>
          </div>
        </div>
      </div>
    </div>`;
}

function openModal(dish, onRoll) {
  if (!dish) return;
  const overlay = document.getElementById('dish-modal');
  document.getElementById('modal-img').src = dish.img;
  document.getElementById('modal-name').textContent = dish.name;
  document.getElementById('modal-desc').textContent = dish.desc;
  document.getElementById('modal-facts').innerHTML = `
    <div class="modal-fact"><span class="mf-value">${formatCurrency(dish.price)}</span><span class="mf-key">Giá</span></div>
    <div class="modal-fact"><span class="mf-value">${dish.calo}</span><span class="mf-key">Kcal</span></div>
    <div class="modal-fact"><span class="mf-value">${dish.time}</span><span class="mf-key">Chờ</span></div>
    <div class="modal-fact"><span class="mf-value">⭐ ${dish.rating}</span><span class="mf-key">Đánh giá</span></div>
  `;
  document.getElementById('modal-reason').textContent = `✅ Lý do nên ăn: ${dish.desc.split('–')[0].trim()}`;
  renderNearbyPanel(dish);

  const saveBtn = document.getElementById('modal-save-btn');
  const saved = state.favorites.includes(dish.id);
  saveBtn.textContent = saved ? '✅ Đã lưu' : '❤️ Lưu vào Gu';
  saveBtn.onclick = () => { toggleFav(dish.id); renderApp(); };

  const changeBtn = document.getElementById('modal-change-btn');
  if (onRoll) {
    changeBtn.style.display = '';
    changeBtn.onclick = () => {
      playBup();
      const newDish = getRandomDish(dishes, state.mood, state.budget);
      openModal(newDish, onRoll);
    };
  } else {
    changeBtn.style.display = 'none';
  }

  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('dish-modal')?.classList.remove('open');
}

let nearbyPanelSequence = 0;

function renderNearbyPanel(dish, panel = document.getElementById('modal-nearby-panel'), options = {}) {
  if (!panel) return;
  const { showMap = true } = options;
  const panelId = `nearby-panel-${++nearbyPanelSequence}`;
  const ids = {
    radius: `${panelId}-radius`,
    locate: `${panelId}-locate`,
    status: `${panelId}-status`,
    help: `${panelId}-help`,
    map: `${panelId}-map`,
    results: `${panelId}-results`
  };

  panel.innerHTML = `
    <section class="nearby-panel" aria-label="Tìm quán ăn gần đây">
      <div class="nearby-title-row">
        <div>
          <h3>Quán gần bạn</h3>
          <p class="nearby-caption">Tìm địa điểm thật quanh vị trí hiện tại</p>
        </div>
        <label class="nearby-radius-label" for="${ids.radius}">Bán kính
          <select id="${ids.radius}" aria-label="Bán kính tìm quán">
            <option value="1">1 km</option>
            <option value="3">3 km</option>
            <option value="5" selected>5 km</option>
            <option value="10">10 km</option>
          </select>
        </label>
      </div>
      <button type="button" class="nearby-locate-btn" id="${ids.locate}">
        <span aria-hidden="true">◎</span> Tìm quán gần tôi
      </button>
      <div class="nearby-location-row">
        <p class="nearby-status" id="${ids.status}" role="status" aria-live="polite">
          Vị trí chưa được cấp quyền. Cho phép GPS để xem quán gần nhất.
        </p>
        <button type="button" class="nearby-help-btn" id="${panelId}-help-button" aria-expanded="false" aria-controls="${ids.help}">Cách bật</button>
      </div>
      <p class="nearby-help-text" id="${ids.help}" hidden>Trong Chrome/Edge, mở biểu tượng điều khiển trang cạnh thanh địa chỉ → Quyền vị trí → Cho phép; trên điện thoại, bật Location/GPS và cấp quyền cho trình duyệt. Trang triển khai cần HTTPS.</p>
      ${showMap ? `<div class="nearby-map" id="${ids.map}" aria-label="Bản đồ quán ăn gần đây">
        <div class="nearby-map-placeholder">Bản đồ sẽ hiện sau khi xác định vị trí</div>
      </div>` : ''}
      <div class="nearby-results" id="${ids.results}"></div>
      <div class="service-search">
        <div class="service-buttons" aria-label="Mở dịch vụ tìm món">
          <button type="button" class="service-button service-button--maps" data-service="maps"><span aria-hidden="true">📍</span> Google Maps</button>
          <button type="button" class="service-button service-button--grab" data-service="grab"><span class="service-wordmark">GrabFood</span></button>
          <button type="button" class="service-button service-button--shopee" data-service="shopee"><span class="service-wordmark">ShopeeFood</span></button>
        </div>
      </div>
    </section>`;

  const status = panel.querySelector(`#${ids.status}`);
  const mapElement = panel.querySelector(`#${ids.map}`);
  const resultsElement = panel.querySelector(`#${ids.results}`);
  let currentLocation = null;
  let selectedPlace = null;

  panel.querySelector(`#${panelId}-help-button`)?.addEventListener('click', event => {
    const help = panel.querySelector(`#${ids.help}`);
    help.hidden = !help.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!help.hidden));
  });

  panel.querySelector(`#${ids.locate}`)?.addEventListener('click', async () => {
    const radiusKm = Number(panel.querySelector(`#${ids.radius}`)?.value || 5);
    status.textContent = 'Đang xin quyền GPS…';
    resultsElement.innerHTML = '';

    try {
      currentLocation = await getCurrentPosition();
      status.textContent = `Đã xác định vị trí. Đang tìm quán trong bán kính ${radiusKm} km…`;
      if (mapElement) await renderNearbyMap(mapElement, currentLocation);

      const places = await findNearbyPlaces(currentLocation, radiusKm);
      if (!panel.isConnected) return;
      if (places.length === 0) {
        status.textContent = `Chưa tìm thấy quán có dữ liệu trong bán kính ${radiusKm} km. Thử tăng bán kính.`;
        return;
      }

      status.textContent = `Tìm thấy ${places.length} quán. Gần nhất cách bạn ${formatDistance(places[0].distanceKm)}.`;
      resultsElement.innerHTML = places.slice(0, 8).map((place, index) => `
        <article class="nearby-place ${index === 0 ? 'is-nearest' : ''}">
          <button type="button" class="nearby-place-select" data-place-index="${index}">
            <span class="nearby-place-name">${escapeHTML(place.name)}</span>
            <span class="nearby-place-distance">${formatDistance(place.distanceKm)}</span>
            <span class="nearby-place-address">${escapeHTML(place.address)}</span>
          </button>
          <a class="nearby-directions" href="${googleMapsDirectionsUrl(currentLocation, place)}" target="_blank" rel="noopener noreferrer" aria-label="Chỉ đường đến ${escapeHTML(place.name)}">Chỉ đường ↗</a>
        </article>`).join('');

      resultsElement.querySelectorAll('[data-place-index]').forEach(button => {
        button.addEventListener('click', async () => {
          selectedPlace = places[Number(button.dataset.placeIndex)];
          status.textContent = mapElement
            ? `Đang mở bản đồ đến ${selectedPlace.name}…`
            : `Đã chọn ${selectedPlace.name}. Nhấn “Chỉ đường” để mở Google Maps.`;
          if (mapElement) await renderNearbyMap(mapElement, currentLocation, selectedPlace);
          if (mapElement) status.textContent = `${selectedPlace.name} · ${formatDistance(selectedPlace.distanceKm)} từ vị trí của bạn.`;
          resultsElement.querySelectorAll('.nearby-place').forEach(row => row.classList.remove('is-selected'));
          button.closest('.nearby-place')?.classList.add('is-selected');
        });
      });
    } catch (error) {
      if (panel.isConnected) status.textContent = error.message || 'Không thể lấy vị trí. Hãy kiểm tra quyền GPS của trình duyệt.';
    }
  });

  panel.querySelectorAll('[data-service]').forEach(button => {
    button.addEventListener('click', () => {
      const query = dish.name;
      const service = button.dataset.service;
      recordServiceClick({ service, dishId: dish.id, dishName: query });
      window.open(serviceSearchUrl(service, query, currentLocation), '_blank', 'noopener,noreferrer');
    });
  });

}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function formatDistance(distanceKm) {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
}

function toggleFav(id) {
  const idx = state.favorites.indexOf(id);
  if (idx >= 0) state.favorites.splice(idx, 1);
  else state.favorites.push(id);
  localStorage.setItem('bung_favs', JSON.stringify(state.favorites));
}

function updateFavBadge() {
  const badge = document.getElementById('fav-badge');
  if (!badge) return;
  const count = state.favorites.length;
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
  badge.style.animation = 'none';
  requestAnimationFrame(() => { badge.style.animation = ''; });
}

function updateHomeGrids() {
  const pg = document.getElementById('popular-grid');
  const ng = document.getElementById('new-grid');
  const pc = document.getElementById('popular-count');
  const nc = document.getElementById('new-count');
  if (pg) pg.innerHTML = renderDishCards(getFilteredPopular());
  if (ng) ng.innerHTML = renderDishCards(getFilteredNew());
  if (pc) pc.textContent = `${getFilteredPopular().length} món`;
  if (nc) nc.textContent = `${getFilteredNew().length} món`;
  bindDishCards();
}

function updateExploreGrid() {
  const query = document.getElementById('explore-search')?.value || '';
  const activecat = document.querySelector('.cat-btn.active')?.dataset.cat || 'all';
  let results = filterDishes(dishes, {
    categoryId: activecat,
    query,
    diet: state.exploreDiet,
    tags: state.exploreTags
  });
  results = sortDishes(results, state.exploreSort);
  const grid = document.getElementById('explore-grid');
  const count = document.getElementById('explore-count');
  if (grid) grid.innerHTML = renderDishCards(results);
  if (count) count.textContent = `${results.length} món`;
  bindDishCards();
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const targetPage = document.getElementById(`page-${page}`);
  if (targetPage) targetPage.classList.add('active');
  const navBtn = document.querySelector(`[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');
  state.activePage = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page === 'airdrop') {
    const container = document.getElementById('airdrop-container');
    if (container) {
      initAirdropManager(
        container,
        dishes,
        () => state.favorites,
        (id) => { toggleFav(id); updateFavBadge(); },
        (dish, onRoll) => openModal(dish, onRoll),
        (dish, host) => renderNearbyPanel(dish, host, {
          showMap: false
        })
      );
    }
  }

  if (page === 'favs') {
    const favPage = document.getElementById('page-favs');
    if (favPage) favPage.innerHTML = renderFavs();
    bindDishCards();
  }
}

// ============================================================
// GẮN SỰ KIỆN TƯƠNG TÁC (BIND EVENTS)
// ============================================================
function bindAll() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      navigateTo(btn.dataset.page);
    });
  });

  document.getElementById('fav-nav-btn')?.addEventListener('click', () => {
    playClick();
    navigateTo('favs');
  });

  document.getElementById('logo-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    playClick();
    navigateTo('home');
  });

  // Nút BỤP! ĂN GÌ — Mega explosion
  document.getElementById('bup-btn')?.addEventListener('click', (e) => {
    playBup();
    const btn = e.currentTarget;

    // Kill any prior shake
    btn.classList.remove('bup-shaking');
    void btn.offsetWidth; // force reflow to restart animation

    // Stage 1: compress in
    btn.classList.add('bup-shaking');

    // Fire mega confetti from button center
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    megaBurst(cx, cy);

    // Screen flash ring
    const flash = document.createElement('div');
    flash.className = 'bup-flash-ring';
    flash.style.left = cx + 'px';
    flash.style.top = cy + 'px';

    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 700);

    setTimeout(() => {
      btn.classList.remove('bup-shaking');
      const dish = getRandomDish(dishes, state.mood, state.budget);
      if (dish) openModal(dish, true);
    }, 420);
  });

  // Lọc Mood (Tâm trạng)
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSelect();
      const mood = btn.dataset.mood;
      state.mood = state.mood === mood ? null : mood;
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('active', b.dataset.mood === state.mood));
      updateHomeGrids();
    });
  });

  // Lọc Budget (Ngân sách)
  document.querySelectorAll('.budget-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSelect();
      state.budget = btn.dataset.budget;
      document.querySelectorAll('.budget-btn').forEach(b => b.classList.toggle('active', b.dataset.budget === state.budget));
      updateHomeGrids();
    });
  });

  // Đóng Modal
  document.getElementById('dish-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Tìm kiếm & Danh mục trang Khám Phá
  const searchInput = document.getElementById('explore-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => updateExploreGrid());
  }
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateExploreGrid();
    });
  });

  // Lọc Chay / Mặn (diet-toggle pills)
  document.querySelectorAll('.diet-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      state.exploreDiet = btn.dataset.diet;
      document.querySelectorAll('.diet-toggle').forEach(b => b.classList.toggle('active', b.dataset.diet === state.exploreDiet));
      updateExploreGrid();
    });
  });

  // Lọc Tags (tag chips)
  document.querySelectorAll('.tag-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      playClick();
      const tag = btn.dataset.tag;
      state.exploreTags = state.exploreTags.includes(tag)
        ? state.exploreTags.filter(item => item !== tag)
        : [...state.exploreTags, tag];
      btn.classList.toggle('active', state.exploreTags.includes(tag));
      updateExploreGrid();
    });
  });

  // Sắp xếp
  document.getElementById('explore-sort')?.addEventListener('change', (e) => {
    state.exploreSort = e.target.value;
    updateExploreGrid();
  });

  // Quiz Options
  document.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.quizAdvancing) return;
      state.quizAdvancing = true;
      playSelect();
      const key = btn.dataset.key;
      const val = btn.dataset.val;
      const step = btn.closest('.quiz-step');
      step.querySelectorAll('.quiz-opt').forEach(b => {
        b.disabled = true;
        b.classList.remove('selected');
      });
      btn.classList.add('selected');
      state.quizAnswers[key] = val;

      setTimeout(() => {
        const nextStep = state.quizStep + 1;
        if (nextStep < QUIZ_QUESTIONS.length) {
          document.getElementById(`quiz-step-${state.quizStep}`)?.classList.add('hidden');
          document.getElementById(`quiz-step-${nextStep}`)?.classList.remove('hidden');
          state.quizStep = nextStep;
          updateQuizDots();
        } else {
          state.quizStep = QUIZ_QUESTIONS.length;
          updateQuizDots();
          const dish = resolveQuizResult();
          showQuizResult(dish);
        }
        state.quizAdvancing = false;
      }, 400);
    });
  });

  bindDishCards();
}

function bindDishCards() {
  document.querySelectorAll('.dish-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.dish-fav-btn')) return;
      const id = parseInt(card.dataset.dish);
      const dish = dishes.find(d => d.id === id);
      if (dish) openModal(dish, false);
    });
  });

  document.querySelectorAll('.dish-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSelect();
      const id = parseInt(btn.dataset.fav);
      toggleFav(id);
      updateFavBadge();
      const saved = state.favorites.includes(id);
      btn.textContent = saved ? '❤️' : '🤍';
      btn.classList.toggle('saved', saved);
      if (saved) burst(e.clientX, e.clientY, 30);
    });
  });
}

// Khởi chạy ứng dụng
renderApp();
