import './style.css';

// ============================================================================
// BƯỚC 1: KHỞI TẠO CÁC BIẾN LƯU TRỮ TRẠNG THÁI (STATE)
// ============================================================================
// Mảng chứa danh sách dữ liệu tải từ các file JSON
let foodsData = [];
let categoriesData = [];
let tagsData = [];
let moodsData = [];

// Các biến lưu trữ lựa chọn lọc của người dùng
let selectedCategory = 'tat-ca'; // Mặc định chọn tất cả danh mục
let selectedTag = '';           // Mặc định không chọn tag nào
let selectedMood = '';          // Mặc định không chọn mood nào
let searchKeyword = '';         // Mặc định từ khóa tìm kiếm rỗng

// Lấy phần tử chứa toàn bộ ứng dụng HTML
const appContainer = document.querySelector('#app');

// ============================================================================
// BƯỚC 2: TẢI DỮ LIỆU TỪ FILE JSON (FETCH API)
// ============================================================================
async function loadAllData() {
  try {
    // Gọi song song 4 file JSON từ thư mục public/data
    const responseFoods = await fetch('/data/foods.json');
    const responseCategories = await fetch('/data/categories.json');
    const responseTags = await fetch('/data/tags.json');
    const responseMoods = await fetch('/data/moods.json');

    // Chuyển đổi dữ liệu nhận được sang định dạng JSON
    foodsData = await responseFoods.json();
    categoriesData = await responseCategories.json();
    tagsData = await responseTags.json();
    moodsData = await responseMoods.json();

    // Dựng khung giao diện chính sau khi tải xong dữ liệu
    renderLayoutHTML();
    
    // Gán các sự kiện tương tác (click, nhập chữ)
    setupEvents();

    // Hiển thị dữ liệu lên giao diện
    renderApp();

  } catch (error) {
    console.error('Lỗi tải dữ liệu JSON:', error);
    appContainer.innerHTML = '<h2 style="color:red; text-align:center;">Lỗi không thể tải dữ liệu JSON!</h2>';
  }
}

// ============================================================================
// BƯỚC 3: XÂY DỰNG KHUNG GIAO DIỆN CHÍNH (HTML LAYOUT)
// ============================================================================
function renderLayoutHTML() {
  appContainer.innerHTML = `
    <header class="header">
      <div class="header-content">
        <div class="brand-badge">🍜 Hỗ Trợ Tìm Kiếm & Chọn Món Ăn</div>
        <h1>Bụng Ơi Ăn Gì?</h1>
        <p>Lọc món ăn thông minh theo Nhu cầu (Mood), Đặc điểm (Tag) và Danh mục!</p>
        
        <div class="search-container">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="input-search" placeholder="Nhập tên món ăn muốn tìm kiếm..." />
          </div>
          <button id="btn-random-food" class="btn-random">🎲 Gợi Ý Ngẫu Nhiên</button>
        </div>
      </div>
    </header>

    <main class="container">
      <!-- Khu vực chọn Danh Mục (Categories) -->
      <div class="section-block">
        <h3 class="filter-label">📂 Chọn Danh Mục:</h3>
        <div id="categories-container" class="categories-list"></div>
      </div>

      <!-- Khu vực chọn Nhu Cầu/Tâm Trạng (Moods) -->
      <div class="section-block moods-bar">
        <h3 class="filter-label">💡 Bạn Đang Có Nhu Cầu Gì? (Mood):</h3>
        <div id="moods-container" class="chip-group"></div>
      </div>

      <!-- Khu vực chọn Đặc Điểm Món (Tags) -->
      <div class="section-block tags-bar">
        <h3 class="filter-label">🏷️ Chọn Đặc Điểm Món (Tag):</h3>
        <div id="tags-container" class="chip-group"></div>
      </div>

      <!-- Tiêu đề và Đếm số lượng món ăn -->
      <div class="section-header">
        <h2 class="section-title">🍽️ Danh Sách Món Ăn Phù Hợp</h2>
        <span id="food-count" class="result-count">Đang tính toán...</span>
      </div>

      <!-- Lưới hiển thị danh sách món ăn -->
      <div id="foods-grid" class="foods-grid"></div>
    </main>

    <!-- Modal Xem Chi Tiết -->
    <div id="modal-detail" class="modal-overlay">
      <div class="modal-card" id="modal-body-content"></div>
    </div>
  `;
}

// ============================================================================
// BƯỚC 4: THUẬT TOÁN LỌC KẾT HỢP (SEARCH + CATEGORY + TAG + MOOD)
// ============================================================================
function getFilteredFoods() {
  // Dùng phương thức filter() để lọc từng món ăn
  return foodsData.filter(function (food) {

    // 1. Kiểm tra Lọc theo Danh mục (Category)
    let isCategoryMatch = false;
    if (selectedCategory === 'tat-ca') {
      isCategoryMatch = true;
    } else {
      if (food.categoryId === selectedCategory) {
        isCategoryMatch = true;
      }
    }

    // 2. Kiểm tra Lọc theo Nhu cầu/Tâm trạng (Mood)
    let isMoodMatch = false;
    if (selectedMood === '') {
      isMoodMatch = true;
    } else {
      if (food.moods && food.moods.includes(selectedMood)) {
        isMoodMatch = true;
      }
    }

    // 3. Kiểm tra Lọc theo Đặc điểm (Tag)
    let isTagMatch = false;
    if (selectedTag === '') {
      isTagMatch = true;
    } else {
      if (food.tags && food.tags.includes(selectedTag)) {
        isTagMatch = true;
      }
    }

    // 4. Kiểm tra Lọc theo Từ khóa tìm kiếm (Search Name)
    let isSearchMatch = false;
    const cleanKeyword = searchKeyword.trim().toLowerCase();
    if (cleanKeyword === '') {
      isSearchMatch = true;
    } else {
      const cleanFoodName = food.name.toLowerCase();
      if (cleanFoodName.includes(cleanKeyword)) {
        isSearchMatch = true;
      }
    }

    // Món ăn phải thỏa mãn TẤT CẢ 4 điều kiện lọc trên (phép toán LOGIC AND &&)
    if (isCategoryMatch && isMoodMatch && isTagMatch && isSearchMatch) {
      return true;
    } else {
      return false;
    }
  });
}

// ============================================================================
// BƯỚC 5: HIỂN THỊ CÁC THÀNH PHẦN GIAO DIỆN (RENDER)
// ============================================================================

// Dựng danh sách Danh Mục (Categories)
function renderCategoriesUI() {
  const container = document.querySelector('#categories-container');
  let html = '';

  categoriesData.forEach(function (cat) {
    let activeClass = '';
    if (cat.id === selectedCategory) {
      activeClass = 'active';
    }

    html = html + `
      <div class="category-card ${activeClass}" data-cat-id="${cat.id}">
        <img src="${cat.image}" alt="${cat.name}" />
        <span>${cat.name}</span>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Dựng danh sách Nhu Cầu/Tâm Trạng (Moods)
function renderMoodsUI() {
  const container = document.querySelector('#moods-container');
  let allMoodClass = '';
  if (selectedMood === '') {
    allMoodClass = 'active';
  }

  let html = `<span class="mood-chip ${allMoodClass}" data-mood-id="">Tất cả nhu cầu</span>`;

  moodsData.forEach(function (mood) {
    let activeClass = '';
    if (mood.id === selectedMood) {
      activeClass = 'active';
    }

    html = html + `
      <span class="mood-chip ${activeClass}" data-mood-id="${mood.id}">
        ✨ ${mood.name}
      </span>
    `;
  });

  container.innerHTML = html;
}

// Dựng danh sách Đặc Điểm Món (Tags)
function renderTagsUI() {
  const container = document.querySelector('#tags-container');
  let allTagClass = '';
  if (selectedTag === '') {
    allTagClass = 'active';
  }

  let html = `<span class="mood-chip ${allTagClass}" data-tag-id="">Tất cả đặc điểm</span>`;

  tagsData.forEach(function (tag) {
    let activeClass = '';
    if (tag.id === selectedTag) {
      activeClass = 'active';
    }

    html = html + `
      <span class="mood-chip ${activeClass}" data-tag-id="${tag.id}">
        🏷️ ${tag.name}
      </span>
    `;
  });

  container.innerHTML = html;
}

// Dựng lưới Món Ăn (Foods Grid)
function renderFoodsUI() {
  const filteredFoods = getFilteredFoods();
  const grid = document.querySelector('#foods-grid');
  const countLabel = document.querySelector('#food-count');

  countLabel.textContent = `Hiển thị ${filteredFoods.length} / ${foodsData.length} món ăn`;

  // Nếu không tìm thấy món nào thỏa mãn
  if (filteredFoods.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">😢</div>
        <h3>Không tìm thấy món ăn nào phù hợp!</h3>
        <p>Thử bỏ chọn bớt bộ lọc hoặc nhập từ khóa tìm kiếm khác xem sao bạn nhé.</p>
        <button id="btn-clear-all" class="btn-reset">Đặt lại tất cả bộ lọc</button>
      </div>
    `;
    return;
  }

  // Dựng danh sách các thẻ món ăn
  let html = '';
  filteredFoods.forEach(function (food) {
    // Tìm đối tượng danh mục để lấy tên danh mục
    let categoryName = '';
    categoriesData.forEach(function (c) {
      if (c.id === food.categoryId) {
        categoryName = c.name;
      }
    });

    // Tạo nhãn bestseller nếu là món hot
    let popularBadgeHTML = '';
    if (food.isPopular) {
      popularBadgeHTML = '<span class="badge-popular">🔥 Hot</span>';
    }

    html = html + `
      <div class="food-card">
        <div class="food-card-image">
          <img src="${food.image}" alt="${food.name}" loading="lazy" />
          ${popularBadgeHTML}
        </div>
        <div class="food-card-body">
          <span class="food-category-tag">${categoryName}</span>
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
  });

  grid.innerHTML = html;
}

// Hàm render toàn bộ ứng dụng khi trạng thái thay đổi
function renderApp() {
  renderCategoriesUI();
  renderMoodsUI();
  renderTagsUI();
  renderFoodsUI();
}

// ============================================================================
// BƯỚC 6: XỬ LÝ SỰ KIỆN NGUỒI DÙNG (EVENT LISTENERS)
// ============================================================================
function setupEvents() {
  
  // Sự kiện click trên toàn bộ container ứng dụng
  appContainer.addEventListener('click', function (e) {

    // 1. Khi người dùng click vào Danh mục (Category)
    const categoryCard = e.target.closest('.category-card');
    if (categoryCard) {
      selectedCategory = categoryCard.dataset.catId;
      renderApp();
    }

    // 2. Khi người dùng click vào Nhu Cầu (Mood)
    const moodChip = e.target.closest('[data-mood-id]');
    if (moodChip) {
      selectedMood = moodChip.dataset.moodId;
      renderApp();
    }

    // 3. Khi người dùng click vào Đặc Điểm (Tag)
    const tagChip = e.target.closest('[data-tag-id]');
    if (tagChip) {
      selectedTag = tagChip.dataset.tagId;
      renderApp();
    }

    // 4. Khi bấm nút Xem Chi Tiết Món
    const btnDetail = e.target.closest('.btn-detail');
    if (btnDetail) {
      const foodId = btnDetail.dataset.foodId;
      openDetailModal(foodId);
    }

    // 5. Nút Đặt lại tất cả bộ lọc khi bị rỗng
    if (e.target.id === 'btn-clear-all') {
      selectedCategory = 'tat-ca';
      selectedMood = '';
      selectedTag = '';
      searchKeyword = '';
      document.querySelector('#input-search').value = '';
      renderApp();
    }
  });

  // Sự kiện gõ từ khóa vào Ô Tìm Kiếm
  const inputSearch = document.querySelector('#input-search');
  inputSearch.addEventListener('input', function (e) {
    searchKeyword = e.target.value;
    renderFoodsUI(); // Chỉ cần dựng lại danh sách món ăn
  });

  // Sự kiện nút Gợi ý ngẫu nhiên
  const btnRandom = document.querySelector('#btn-random-food');
  btnRandom.addEventListener('click', function () {
    const currentFiltered = getFilteredFoods();
    let pool = currentFiltered;
    if (pool.length === 0) {
      pool = foodsData;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomDish = pool[randomIndex];
    openDetailModal(randomDish.id, true);
  });

  // Sự kiện Đóng Modal Xem Chi Tiết
  const modalDetail = document.querySelector('#modal-detail');
  modalDetail.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay') || e.target.closest('.modal-close')) {
      modalDetail.classList.remove('active');
    }
  });
}

// ============================================================================
// BƯỚC 7: HIỂN THỊ MODAL XEM CHI TIẾT MÓN ĂN
// ============================================================================
function openDetailModal(foodId, isRandom) {
  let targetFood = null;
  foodsData.forEach(function (f) {
    if (f.id === foodId) {
      targetFood = f;
    }
  });

  if (!targetFood) return;

  // Lấy danh sách tên Tag của món ăn
  let tagNamesList = [];
  if (targetFood.tags) {
    targetFood.tags.forEach(function (tId) {
      tagsData.forEach(function (tObj) {
        if (tObj.id === tId) {
          tagNamesList.push(tObj.name);
        }
      });
    });
  }

  // Lấy danh sách tên Mood của món ăn
  let moodNamesList = [];
  if (targetFood.moods) {
    targetFood.moods.forEach(function (mId) {
      moodsData.forEach(function (mObj) {
        if (mObj.id === mId) {
          moodNamesList.push(mObj.name);
        }
      });
    });
  }

  let randomBannerHTML = '';
  if (isRandom) {
    randomBannerHTML = '<div style="background:#fff3e0; color:#e64a19; font-weight:700; padding:6px 12px; border-radius:8px; display:inline-block; font-size:0.85rem; margin-bottom:10px;">🎲 MÓN ĂN GỢI Ý NGẪU NHIÊN CHỦ ĐỀ CỦA BẠN</div>';
  }

  const modalBody = document.querySelector('#modal-body-content');
  modalBody.innerHTML = `
    <div style="position: relative;">
      <img class="modal-image" src="${targetFood.image}" alt="${targetFood.name}" />
      <button class="modal-close">✕</button>
    </div>
    <div class="modal-content">
      ${randomBannerHTML}
      <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 8px;">${targetFood.name}</h2>
      <p style="color: #64748b; margin-bottom: 16px;">${targetFood.description}</p>
      
      <div style="display: flex; gap: 24px; align-items: center; margin-bottom: 20px; background: #f8fafc; padding: 12px 16px; border-radius: 12px;">
        <div>
          <div style="font-size: 0.8rem; color: #64748b;">Giá tham khảo</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: #ff5722;">${targetFood.price.toLocaleString('vi-VN')} đ</div>
        </div>
        <div>
          <div style="font-size: 0.8rem; color: #64748b;">Đánh giá</div>
          <div style="font-size: 1.1rem; font-weight: 700;">⭐ ${targetFood.rating} / 5.0</div>
        </div>
      </div>

      <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px;">🥘 Nguyên liệu chính:</h4>
      <div class="ingredients-list">
        ${targetFood.ingredients.map(ing => `<span class="ingredient-tag">${ing}</span>`).join('')}
      </div>

      <h4 style="font-size: 0.95rem; font-weight: 700; margin-top: 16px; margin-bottom: 8px;">🏷️ Đặc điểm món (Tags):</h4>
      <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
        ${tagNamesList.map(tName => `<span style="background:#e2e8f0; font-size:0.8rem; padding:4px 10px; border-radius:12px; font-weight:600;">🏷️ ${tName}</span>`).join('')}
      </div>

      <h4 style="font-size: 0.95rem; font-weight: 700; margin-top: 8px; margin-bottom: 8px;">💡 Nhu cầu phù hợp (Moods):</h4>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        ${moodNamesList.map(mName => `<span style="background:#fff3e0; color:#e64a19; font-size:0.8rem; padding:4px 10px; border-radius:12px; font-weight:600;">✨ ${mName}</span>`).join('')}
      </div>
    </div>
  `;

  document.querySelector('#modal-detail').classList.add('active');
}

// Chạy ứng dụng
loadAllData();
