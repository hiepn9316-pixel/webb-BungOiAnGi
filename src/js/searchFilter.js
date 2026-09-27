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

  containerEl.innerHTML = '';

  const searchBox = document.createElement('div');
  searchBox.className = 'search-box-wrapper';

  searchBox.innerHTML = `
    <div class="search-input-group">
      <span class="search-icon">🔍</span>
      <input 
        type="text" 
        id="search-input" 
        class="search-input" 
        placeholder="Nhập tên món ăn (ví dụ: bún bò, mì cay, cơm tấm)..." 
        value="${currentKeyword || ''}"
        autocomplete="off"
      />
      ${currentKeyword ? '<button type="button" class="btn-clear-search" title="Xóa từ khóa">✕</button>' : ''}
    </div>
  `;

  const inputEl = searchBox.querySelector('#search-input');
  inputEl.addEventListener('input', (e) => {
    onSearchInput(e.target.value);
  });

  const clearBtn = searchBox.querySelector('.btn-clear-search');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      onSearchInput('');
    });
  }

  containerEl.appendChild(searchBox);
}
