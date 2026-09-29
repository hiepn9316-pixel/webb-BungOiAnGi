/**
 * Chuẩn hóa chuỗi: Chuyển về chữ thường và loại bỏ dấu tiếng Việt
 * @param {string} str 
 * @returns {string}
 */
export function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

/**
 * Lọc danh sách món ăn theo từ khóa tìm kiếm (Không phân biệt hoa/thường & có dấu/không dấu)
 * @param {Array} dishes - Danh sách món ăn
 * @param {string} keyword - Từ khóa người dùng nhập vào
 * @returns {Array} Danh sách món phù hợp
 */
export function filterByKeyword(dishes, keyword) {
  if (!dishes || !Array.isArray(dishes)) return [];
  if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
    return dishes;
  }

  const cleanKeyword = removeVietnameseTones(keyword);
  if (!cleanKeyword) return dishes;

  return dishes.filter(dish => {
    const cleanName = removeVietnameseTones(dish.name);
    const cleanDesc = removeVietnameseTones(dish.description || '');
    const cleanTags = dish.tags ? dish.tags.map(t => removeVietnameseTones(t)).join(' ') : '';

    return cleanName.includes(cleanKeyword) || 
           cleanDesc.includes(cleanKeyword) || 
           cleanTags.includes(cleanKeyword);
  });
}

/**
 * Render giao diện Ô tìm kiếm (Search Bar)
 * @param {HTMLElement} containerEl 
 * @param {string} currentKeyword 
 * @param {Function} onSearchInput 
 */
export function renderSearchUI(containerEl, currentKeyword, onSearchInput) {
  if (!containerEl) return;

  const keyword = currentKeyword || '';

  // Giữ nguyên DOM đang có để không mất focus/con trỏ khi người dùng gõ từ khoá
  const existingInput = containerEl.querySelector('#search-input');
  if (existingInput) {
    if (existingInput.value !== keyword) {
      existingInput.value = keyword;
    }
    const existingClearBtn = containerEl.querySelector('.btn-clear-search');
    if (existingClearBtn) {
      existingClearBtn.hidden = !keyword.trim();
    }
    return;
  }

  containerEl.innerHTML = '';

  const searchBox = document.createElement('div');
  searchBox.className = 'search-wrapper';

  searchBox.innerHTML = `
    <div class="search-input-group">
      <span class="search-icon">🔍</span>
      <input 
        type="text" 
        id="search-input" 
        class="search-input" 
        placeholder="Nhập tên món ăn (ví dụ: bún bò, mì cay, cơm tấm)..." 
        value="${keyword}"
        aria-label="Tìm kiếm món ăn theo tên"
        autocomplete="off"
      />
      <button type="button" class="btn-clear-search" title="Xóa từ khóa" aria-label="Xóa từ khóa" hidden>✕</button>
    </div>
  `;

  const inputEl = searchBox.querySelector('#search-input');

  inputEl.addEventListener('input', (e) => {
    onSearchInput(e.target.value);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputEl.blur();
    }
    if (e.key === 'Escape' && inputEl.value) {
      e.preventDefault();
      onSearchInput('');
    }
  });

  const clearBtn = searchBox.querySelector('.btn-clear-search');
  clearBtn.hidden = !keyword.trim();
  clearBtn.addEventListener('click', () => {
    onSearchInput('');
    inputEl.focus();
  });

  containerEl.appendChild(searchBox);
}
