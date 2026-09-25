import './style.css';

// State management
let foodsData = [];
let categoriesData = [];
let activeCategory = 'tat-ca';
let activeMood = '';
let searchQuery = '';

// DOM Elements
const app = document.querySelector('#app');

// Initialize App
async function initApp() {
  try {
    const [foodsRes, categoriesRes] = await Promise.all([
      fetch('/data/foods.json'),
      fetch('/data/categories.json')
    ]);

    foodsData = await foodsRes.json();
    categoriesData = await categoriesRes.json();

    renderBaseHTML();
    setupEventListeners();
    renderContent();
  } catch (err) {
    console.error('Lỗi khởi tạo ứng dụng:', err);
    app.innerHTML = `<div style="text-align:center; padding: 50px;">
      <h2>⚠️ Không thể tải dữ liệu</h2>
      <p>Vui lòng kiểm tra lại file /data/foods.json và /data/categories.json</p>
    </div>`;
  }
}

// Base Layout
function renderBaseHTML() {
  app.innerHTML = `
    <header class="header">
      <div class="header-content">
        <div class="brand-badge">🍜 Hỗ Trợ Tìm Kếm & Lựa Chọn Món Ăn</div>
        <h1>Bụng Ơi Ăn Gì?</h1>
        <p>Hôm nay bạn đang thèm món gì? Lựa chọn món ăn ngon theo tâm trạng và sở thích!</p>
        
        <div class="search-container">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="search-input" placeholder="Tìm theo tên món ăn hoặc nguyên liệu (Phở, Cơm, Gà...)..." />
          </div>
          <button id="btn-random" class="btn-random">
            🎲 Gợi Ý Ngẫu Nhiên
          </button>
        </div>
      </div>
    </header>

    <main class="container">
      <div class="categories-wrapper">
        <div id="categories-list" class="categories-list"></div>
      </div>

      <div class="moods-bar">
        <span class="moods-title">💡 Chọn Theo Tâm Trạng:</span>
        <div id="moods-list" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
      </div>

      <div class="section-header">
        <h2 class="section-title">
          <span>🍽️</span> Danh Sách Món Ăn
        </h2>
        <span id="result-count" class="result-count">Hiển thị 0 món</span>
      </div>

      <div id="foods-grid" class="foods-grid"></div>
    </main>

    <!-- Detail Modal -->
    <div id="detail-modal" class="modal-overlay">
      <div class="modal-card" id="modal-card-content"></div>
    </div>
  `;
}

// Render Categories Pills
function renderCategories() {
  const container = document.querySelector('#categories-list');
  container.innerHTML = categoriesData.map(cat => `
    <div class="category-card ${activeCategory === cat.id ? 'active' : ''}" data-cat-id="${cat.id}">
      <img src="${cat.image}" alt="${cat.name}" />
      <span>${cat.name}</span>
    </div>
  `).join('');
}

// Render Mood Chips
function renderMoods() {
  const moodSet = new Set();
  foodsData.forEach(food => {
    if (food.moods) food.moods.forEach(m => moodSet.add(m));
  });

  const moodsList = Array.from(moodSet);
  const container = document.querySelector('#moods-list');

  container.innerHTML = `
    <span class="mood-chip ${activeMood === '' ? 'active' : ''}" data-mood="">Tất cả tâm trạng</span>
    ${moodsList.map(mood => `
      <span class="mood-chip ${activeMood === mood ? 'active' : ''}" data-mood="${mood}">
        ${formatMoodLabel(mood)}
      </span>
    `).join('')}
  `;
}

// Format mood string into nice text
function formatMoodLabel(mood) {
  const labels = {
    'muon-an-no': '😋 Muốn ăn no',
    'doi-bung': '⚡ Đang đói bụng',
    'them-do-nong': '🔥 Thèm đồ nóng',
    'giai-cam': '🍵 Giải cảm',
    'them-vi-chua-ngot': '🍋 Thèm chua ngọt',
    'them-do-cay': '🌶️ Thèm ăn cay',
    'them-do-nuong': '🥩 Thèm đồ nướng',
    'tu-tap-ban-be': '👥 Tụ tập bạn bè',
    'stress': '💆 Xả Stress',
    'them-do-gion': '🥓 Thèm đồ giòn',
    'nhe-nhang-thanh-loc': '🥗 Thanh lọc cơ thể',
    'an-vat-xem-phim': '🍿 Ăn vặt xem phim',
    'can-tinh-tap': '☕ Cần tỉnh táo',
    'giai-nhiet-he': '🧊 Giải nhiệt',
    'them-do-ngot': '🍰 Thèm đồ ngọt'
  };
  return labels[mood] || `#${mood}`;
}

// Filter foods based on state
function getFilteredFoods() {
  return foodsData.filter(food => {
    // Category match
    const matchCategory = (activeCategory === 'tat-ca' || food.categoryId === activeCategory);
    
    // Mood match
    const matchMood = (!activeMood || (food.moods && food.moods.includes(activeMood)));

    // Search query match
    const query = searchQuery.trim().toLowerCase();
    const matchQuery = !query || 
      food.name.toLowerCase().includes(query) ||
      food.description.toLowerCase().includes(query) ||
      (food.ingredients && food.ingredients.some(ing => ing.toLowerCase().includes(query)));

    return matchCategory && matchMood && matchQuery;
  });
}

// Render Foods Grid
function renderFoods() {
  const filtered = getFilteredFoods();
  const grid = document.querySelector('#foods-grid');
  const countLabel = document.querySelector('#result-count');

  countLabel.textContent = `Hiển thị ${filtered.length} / ${foodsData.length} món ăn`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Không tìm thấy món ăn phù hợp</h3>
        <p>Rất tiếc, không có món ăn nào phù hợp với bộ lọc hiện tại của bạn.</p>
        <button id="btn-reset-filter" class="btn-reset">Đặt lại bộ lọc</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(food => {
    const categoryObj = categoriesData.find(c => c.id === food.categoryId);
    return `
      <div class="food-card">
        <div class="food-card-image">
          <img src="${food.image}" alt="${food.name}" loading="lazy" />
          ${food.isPopular ? '<span class="badge-popular">🔥 Bestseller</span>' : ''}
        </div>
        <div class="food-card-body">
          <span class="food-category-tag">${categoryObj ? categoryObj.name : ''}</span>
          <h3 class="food-title">${food.name}</h3>
          <p class="food-desc">${food.description}</p>
          
          <div class="food-meta">
            <span class="food-price">${food.price.toLocaleString('vi-VN')} đ</span>
            <div class="food-rating">
              <span class="star-icon">⭐</span>
              <span>${food.rating}</span>
            </div>
          </div>
          
          <button class="btn-detail" data-food-id="${food.id}">Xem Chi Tiết Món</button>
        </div>
      </div>
    `;
  }).join('');
}

// Render Content Updates
function renderContent() {
  renderCategories();
  renderMoods();
  renderFoods();
}

// Setup Event Listeners
function setupEventListeners() {
  // Category Selection
  app.addEventListener('click', (e) => {
    const catCard = e.target.closest('.category-card');
    if (catCard) {
      activeCategory = catCard.dataset.catId;
      renderContent();
    }

    // Mood Selection
    const moodChip = e.target.closest('.mood-chip');
    if (moodChip) {
      activeMood = moodChip.dataset.mood;
      renderContent();
    }

    // Detail Button
    const btnDetail = e.target.closest('.btn-detail');
    if (btnDetail) {
      const foodId = btnDetail.dataset.foodId;
      openModal(foodId);
    }

    // Reset Filters Button
    if (e.target.id === 'btn-reset-filter') {
      activeCategory = 'tat-ca';
      activeMood = '';
      searchQuery = '';
      document.querySelector('#search-input').value = '';
      renderContent();
    }
  });

  // Search Input
  const searchInput = document.querySelector('#search-input');
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderFoods();
  });

  // Random Recommendation Button
  document.querySelector('#btn-random').addEventListener('click', () => {
    const filtered = getFilteredFoods();
    const listToPick = filtered.length > 0 ? filtered : foodsData;
    const randomFood = listToPick[Math.floor(Math.random() * listToPick.length)];
    openModal(randomFood.id, true);
  });

  // Modal Close Listener
  document.querySelector('#detail-modal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') || e.target.closest('.modal-close')) {
      closeModal();
    }
  });
}

// Open Detail Modal
function openModal(foodId, isRandom = false) {
  const food = foodsData.find(f => f.id === foodId);
  if (!food) return;

  const categoryObj = categoriesData.find(c => c.id === food.categoryId);
  const modal = document.querySelector('#detail-modal');
  const modalContent = document.querySelector('#modal-card-content');

  modalContent.innerHTML = `
    <div style="position: relative;">
      <img class="modal-image" src="${food.image}" alt="${food.name}" />
      <button class="modal-close">✕</button>
    </div>
    <div class="modal-content">
      ${isRandom ? '<div style="background:#fff3e0; color:#e64a19; font-weight:700; padding:6px 12px; border-radius:8px; display:inline-block; font-size:0.85rem; margin-bottom:10px;">🎲 GỢI Ý NGẪU NHIÊN CHO BẠN</div>' : ''}
      <span class="food-category-tag">${categoryObj ? categoryObj.name : ''}</span>
      <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 8px;">${food.name}</h2>
      <p style="color: #64748b; margin-bottom: 16px;">${food.description}</p>
      
      <div style="display: flex; gap: 24px; align-items: center; margin-bottom: 20px; background: #f8fafc; padding: 12px 16px; border-radius: 12px;">
        <div>
          <div style="font-size: 0.8rem; color: #64748b;">Giá tham khảo</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: #ff5722;">${food.price.toLocaleString('vi-VN')} đ</div>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: #64748b;">Đánh giá</div>
          <div style="font-size: 1.1rem; font-weight: 700;">⭐ ${food.rating} / 5.0</div>
        </div>
      </div>

      <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">🥘 Nguyên liệu chính:</h4>
      <div class="ingredients-list">
        ${food.ingredients ? food.ingredients.map(ing => `<span class="ingredient-tag">${ing}</span>`).join('') : 'Đang cập nhật'}
      </div>

      <h4 style="font-size: 0.95rem; font-weight: 700; margin-top: 16px; margin-bottom: 8px;">💡 Phù hợp với tâm trạng:</h4>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        ${food.moods ? food.moods.map(m => `<span style="background:#e2e8f0; font-size:0.8rem; padding:4px 10px; border-radius:12px; font-weight:600;">${formatMoodLabel(m)}</span>`).join('') : ''}
      </div>
    </div>
  `;

  modal.classList.add('active');
}

// Close Modal
function closeModal() {
  document.querySelector('#detail-modal').classList.remove('active');
}

// Run App
initApp();
