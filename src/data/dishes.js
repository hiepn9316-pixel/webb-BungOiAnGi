// ============================================================
// 🍜 BungOiAnGi – Cơ sở dữ liệu món ăn Việt Nam (77 món chuẩn hóa)
// ============================================================

export const MOODS = {
  ngon:    { id: 'ngon',    emoji: '😋', label: 'Thèm ngon',       desc: 'Món đậm đà chuẩn vị' },
  luoi:    { id: 'luoi',    emoji: '😴', label: 'Lười nấu',         desc: 'Nhanh gọn, tiện lợi' },
  cay:     { id: 'cay',     emoji: '🌶️', label: 'Thèm cay',         desc: 'Cay nồng kích thích' },
  ngheo:   { id: 'ngheo',   emoji: '💸', label: 'Ví xẹp',           desc: 'Bình dân tiết kiệm' },
  healthy: { id: 'healthy', emoji: '🥗', label: 'Sống lành mạnh',   desc: 'Eat clean ít dầu mỡ' },
  party:   { id: 'party',   emoji: '🎉', label: 'Tự thưởng',        desc: 'Tiệc tùng thả ga' },
};

export const BUDGETS = [
  { id: 'all',  label: 'Tất cả',  min: 0,     max: Infinity },
  { id: 'b20',  label: '≤25K',   sublabel: 'Bình dân',    min: 0,     max: 25000  },
  { id: 'b40',  label: '25–45K', sublabel: 'Sinh viên',   min: 25001, max: 45000  },
  { id: 'b70',  label: '45–80K', sublabel: 'Vừa túi',     min: 45001, max: 80000  },
  { id: 'b150', label: '80K+',   sublabel: 'Chơi lớn',   min: 80001, max: Infinity },
];

export const CATEGORIES = [
  { id: 'all',      label: '🍽️ Tất cả',              icon: '🍽️', name: 'Tất cả' },
  { id: 'nuoc',     label: '🍜 Món nước',            icon: '🍜', name: 'Món nước' },
  { id: 'com',      label: '🍚 Cơm & Xôi',           icon: '🍚', name: 'Cơm & Xôi' },
  { id: 'xao-kho',  label: '🥢 Món xào & Nướng',     icon: '🥢', name: 'Món xào & Nướng' },
  { id: 'anvat',    label: '🍢 Ăn vặt',              icon: '🍢', name: 'Ăn vặt' },
  { id: 'ngot',     label: '🍮 Tráng miệng & Chè',   icon: '🍮', name: 'Tráng miệng & Chè' },
  { id: 'uong',     label: '🧋 Đồ uống',             icon: '🧋', name: 'Đồ uống' },
];

export let dishes = [
  {
    "id": 1,
    "name": "Mì cay Hải Sản",
    "desc": "Mì cay Hàn Quốc với tôm, mực, chả cá và 7 cấp độ cay xé lưỡi",
    "price": 45000,
    "calo": 545,
    "moods": [
      "ngon",
      "cay"
    ],
    "budget": "b40",
    "category": "nuoc",
    "tags": [
      "cay",
      "no",
      "an-vui"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.2,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 2,
    "name": "Cơm Tấm Sườn Bì Chả",
    "desc": "Cơm tấm nóng hổi kèm sườn nướng mật ong thơm lừng, bì và chả chưng",
    "price": 40000,
    "calo": 435,
    "moods": [
      "ngon",
      "ngheo"
    ],
    "budget": "b40",
    "category": "com",
    "tags": [
      "no",
      "phobien",
      "tiet-kiem"
    ],
    "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.3,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 3,
    "name": "Bún Bò Huế Đặc Biệt",
    "desc": "Nước dùng đậm đà hương sả mắm ruốc, bò nạm, giò heo và huyết",
    "price": 50000,
    "calo": 458,
    "moods": [
      "ngon",
      "cay"
    ],
    "budget": "b70",
    "category": "nuoc",
    "tags": [
      "cay",
      "no",
      "dam-da"
    ],
    "img": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.4,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 4,
    "name": "Bún Thịt Nướng Chả Giò",
    "desc": "Bún tươi ăn kèm thịt nướng xiên, chả giòn rụm và nước mắm chua ngọt",
    "price": 38000,
    "calo": 583,
    "moods": [
      "ngon",
      "healthy",
      "ngheo"
    ],
    "budget": "b40",
    "category": "xao-kho",
    "tags": [
      "tiet-kiem",
      "ngon-lanh",
      "phobien"
    ],
    "img": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.5,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 5,
    "name": "Cơm Gà Xối Mỡ",
    "desc": "Đùi gà chiên giòn rụm da vàng ươm ăn kèm cơm đỏ sốt cà chua",
    "price": 45000,
    "calo": 319,
    "moods": [
      "ngon"
    ],
    "budget": "b40",
    "category": "com",
    "tags": [
      "no",
      "gion-rum"
    ],
    "img": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.6,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 6,
    "name": "Bánh Bột Lọc Huế",
    "desc": "Bánh bột lọc nhân tôm thịt dai giòn sần sật châm nước mắm cay",
    "price": 25000,
    "calo": 304,
    "moods": [
      "ngon",
      "cay",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "anvat",
    "tags": [
      "an-vui",
      "tiet-kiem",
      "cay"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.7,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 7,
    "name": "Tokbokki Phô Mai",
    "desc": "Bánh gạo Hàn Quốc sốt cay phủ phô mai kéo sợi thơm béo",
    "price": 35000,
    "calo": 212,
    "moods": [
      "ngon",
      "cay",
      "luoi"
    ],
    "budget": "b40",
    "category": "anvat",
    "tags": [
      "cay",
      "beo-bap",
      "an-vui"
    ],
    "img": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.8,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 8,
    "name": "Trà Sữa Trân Châu Đường Đen",
    "desc": "Trà sữa đậm vị kèm trân châu đường đen dẻo thơm ngạt ngào",
    "price": 30000,
    "calo": 588,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b40",
    "category": "uong",
    "tags": [
      "giai-khat",
      "ngot-ngao"
    ],
    "img": "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.9,
    "time": "3 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 9,
    "name": "Trà Đào Cam Sả",
    "desc": "Vị chua thanh của cam kết hợp hương sả thơm lừng và miếng đào giòn tan",
    "price": 28000,
    "calo": 402,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b40",
    "category": "uong",
    "tags": [
      "giai-khat",
      "thanh-mat"
    ],
    "img": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.2,
    "time": "3 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 10,
    "name": "Mì Xào Bò Rau Củ",
    "desc": "Mì trứng xào thịt bò mềm ngọt cùng rau cải cúc, cà rốt và hành tây",
    "price": 42000,
    "calo": 343,
    "moods": [
      "ngon",
      "healthy"
    ],
    "budget": "b40",
    "category": "xao-kho",
    "tags": [
      "no",
      "dinh-duong"
    ],
    "img": "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.3,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 11,
    "name": "Phở Bò Tái Nạm",
    "desc": "Phở truyền thống Hà Nội với nước dùng ninh xương ngọt thanh đậm đà",
    "price": 55000,
    "calo": 347,
    "moods": [
      "ngon"
    ],
    "budget": "b70",
    "category": "nuoc",
    "tags": [
      "no",
      "truyen-thong"
    ],
    "img": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.4,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 12,
    "name": "Cơm Chiên Dương Châu",
    "desc": "Cơm chiên hạt vàng ươm tơi xốp phối cùng lạp xưởng, đậu hà lan và tôm",
    "price": 35000,
    "calo": 247,
    "moods": [
      "ngon",
      "ngheo"
    ],
    "budget": "b40",
    "category": "com",
    "tags": [
      "no",
      "tiet-kiem"
    ],
    "img": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.5,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 13,
    "name": "Gỏi Cuốn Tôm Thịt",
    "desc": "Gỏi cuốn tươi mát với tôm, thịt, rau sống và nước chấm chua ngọt",
    "price": 32000,
    "calo": 522,
    "moods": [
      "ngon",
      "ngheo",
      "party",
      "luoi"
    ],
    "budget": "b40",
    "category": "anvat",
    "tags": [
      "sang",
      "moi",
      "tiet-kiem"
    ],
    "img": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.6,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 14,
    "name": "Bánh Tráng Trộn",
    "desc": "Bánh tráng trộn nóng hổi, mứt dưa, khô bò, hành phi và xoài xanh",
    "price": 26000,
    "calo": 497,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b40",
    "category": "anvat",
    "tags": [
      "vui",
      "an-vui",
      "moi"
    ],
    "img": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.7,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 15,
    "name": "Súp Bắp Cà Chua",
    "desc": "Súp bắp mềm mịn, ngọt thanh cùng cà chua và hành phi thơm lừng",
    "price": 24000,
    "calo": 364,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "party"
    ],
    "budget": "b20",
    "category": "xao-kho",
    "tags": [
      "dinh-duong",
      "thu-gian"
    ],
    "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.8,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 16,
    "name": "Sinh Tố Xoài Chanh Dây",
    "desc": "Sinh tố xoài mát lạnh, sánh mịn và thơm vị trái cây tươi",
    "price": 29000,
    "calo": 235,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b40",
    "category": "uong",
    "tags": [
      "mat",
      "thanh-mat",
      "giai-khat"
    ],
    "img": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.9,
    "time": "3 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 17,
    "name": "Bún Bò Bà Lệ Thốt Nốt",
    "desc": "Bún bò Sài Gòn giá rẻ với nước dùng ngọt, thịt bò và nước mắm chua cay",
    "price": 18000,
    "calo": 241,
    "moods": [
      "ngon",
      "healthy",
      "ngheo"
    ],
    "budget": "b20",
    "category": "nuoc",
    "tags": [
      "tiet-kiem",
      "phobien",
      "ngon-lanh"
    ],
    "img": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.2,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 18,
    "name": "Bánh Mì Chả Cá",
    "desc": "Ổ bánh mì đặc ruột, chả cá chiên giòn chan nước mắm chua ngọt và rau thơm",
    "price": 15000,
    "calo": 334,
    "moods": [
      "ngon",
      "ngheo",
      "party",
      "luoi"
    ],
    "budget": "b20",
    "category": "anvat",
    "tags": [
      "tiet-kiem",
      "phobien",
      "sang"
    ],
    "img": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.3,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 19,
    "name": "Cơm Tấm Trứng Ốp La",
    "desc": "Cơm tấm dẻo ăn kèm trứng ốp lòng đào lòng đào và nước mắm chua ngọt",
    "price": 19000,
    "calo": 442,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "com",
    "tags": [
      "tiet-kiem",
      "dinh-duong",
      "an-sang"
    ],
    "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.4,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 20,
    "name": "Bánh Cuốn Nhân Thịt Nấm",
    "desc": "Bánh cuốn mỏng mịn cuộn nhân thịt nấm thơm dứt, chấm nước mắm sen",
    "price": 12000,
    "calo": 561,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "anvat",
    "tags": [
      "chay",
      "truyen-thong",
      "an-vui"
    ],
    "img": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.5,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 21,
    "name": "Bún Chả Cá Lã Vọng",
    "desc": "Bún trắng quen thuộc ăn kèm chả cá Lã Vọng nướng thơm và nước mắm chua",
    "price": 17000,
    "calo": 500,
    "moods": [
      "ngon",
      "healthy",
      "ngheo"
    ],
    "budget": "b20",
    "category": "nuoc",
    "tags": [
      "tiet-kiem",
      "phobien",
      "ngon-lanh"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.6,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 22,
    "name": "Nước Đậu Xanh Nóng Sả",
    "desc": "Nước đậu xanh nóng giàu chất xơ, thơm miếng sả và lá bạc hà tươi",
    "price": 8000,
    "calo": 471,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "uong",
    "tags": [
      "mat",
      "thanh-mat",
      "giai-khat"
    ],
    "img": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.7,
    "time": "3 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 23,
    "name": "Bánh Đa Nướng Giòn",
    "desc": "Bánh đa nướng giòn rụm rắc hành phi, mè rang và nước mắm chấm",
    "price": 13000,
    "calo": 583,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "anvat",
    "tags": [
      "chay",
      "tiet-kiem",
      "an-vui"
    ],
    "img": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.8,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 24,
    "name": "Cơm Gạo Lứt Bò Kho Dưa",
    "desc": "Cơm gạo lứt thơm dẻo ăn cùng bò kho dưa cải chua nước dừa mặn ngọt",
    "price": 18000,
    "calo": 203,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "com",
    "tags": [
      "dinh-duong",
      "tiet-kiem",
      "an-sang"
    ],
    "img": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.9,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 25,
    "name": "Chả Giò Nem Lụi Chấm Mắm",
    "desc": "Chả giò cuộn lá bánh tráng giòn rụm ăn kèm chấm mắm tôm và đuôi tôm",
    "price": 14000,
    "calo": 285,
    "moods": [
      "ngon",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "anvat",
    "tags": [
      "phobien",
      "an-vui",
      "tiet-kiem"
    ],
    "img": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.2,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 26,
    "name": "Trà Tắc Nóng",
    "desc": "Trà tắc nóng giải khát, ấm bụng với vị chua dứa tươi mát cổ",
    "price": 10000,
    "calo": 566,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "party",
      "luoi"
    ],
    "budget": "b20",
    "category": "uong",
    "tags": [
      "giai-khat",
      "thu-gian",
      "mat"
    ],
    "img": "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.3,
    "time": "3 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 27,
    "name": "Mì Quảng Tôm Thịt",
    "desc": "Mì Quảng vàng ươm đặc trưng miền Trung, tôm thịt và rau thơm",
    "price": 19000,
    "calo": 357,
    "moods": [
      "ngon",
      "ngheo"
    ],
    "budget": "b20",
    "category": "nuoc",
    "tags": [
      "truyen-thong",
      "tiet-kiem",
      "phobien"
    ],
    "img": "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.4,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 28,
    "name": "Bánh Khoai Mì Nướng",
    "desc": "Khoai mì nướng xù xình, vỏ nạnh lòng dẻo ăn kèm muối tôm và dầu mè",
    "price": 9000,
    "calo": 299,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "anvat",
    "tags": [
      "chay",
      "tiet-kiem",
      "vui"
    ],
    "img": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.5,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 29,
    "name": "Hủ Tiếu Nam Bò Tươi",
    "desc": "Hủ tiếu Nam bò tươi, nước dùng ninh xương trong và thơm tiêu",
    "price": 32000,
    "calo": 334,
    "moods": [
      "ngon",
      "ngheo",
      "party"
    ],
    "budget": "b40",
    "category": "nuoc",
    "tags": [
      "no",
      "thu-gian",
      "tiet-kiem"
    ],
    "img": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.6,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 30,
    "name": "Bánh Xèo Giò Chả",
    "desc": "Bánh xèo giòn rụm nhân giò heo, tôm chua và đậu xanh, ăn kèm nước chấm",
    "price": 35000,
    "calo": 353,
    "moods": [
      "ngon",
      "luoi"
    ],
    "budget": "b40",
    "category": "anvat",
    "tags": [
      "phobien",
      "truyen-thong",
      "moi"
    ],
    "img": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.7,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 31,
    "name": "Lẩu Thái Chua Cay Nóng",
    "desc": "Lẩu Thái chua cay chua chát, tôm cua và rau nhúng đầy sức sống",
    "price": 58000,
    "calo": 417,
    "moods": [
      "ngon",
      "cay",
      "party"
    ],
    "budget": "b70",
    "category": "nuoc",
    "tags": [
      "cay",
      "dam-da",
      "sang"
    ],
    "img": "https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.8,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 32,
    "name": "Gà Kho Sả Nướng Mật",
    "desc": "Đùi gà kho sả nướng mật ong, da vàng bóng, thịt ngọt mềm thơm sả",
    "price": 62000,
    "calo": 583,
    "moods": [
      "ngon",
      "party"
    ],
    "budget": "b70",
    "category": "com",
    "tags": [
      "no",
      "sang",
      "gion-rum"
    ],
    "img": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.9,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 33,
    "name": "Cá Chỉ Vàng Sốt Mè Tôm",
    "desc": "Cá chỉ vàng chiên giòn sốt mè tôm dào vị, ăn cùng cơm nóng",
    "price": 55000,
    "calo": 298,
    "moods": [
      "ngon",
      "healthy"
    ],
    "budget": "b70",
    "category": "xao-kho",
    "tags": [
      "no",
      "dinh-duong",
      "phobien"
    ],
    "img": "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.2,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 34,
    "name": "Chè Hạt Sen Nha Đà",
    "desc": "Chè hạt sen nha đà nấu nhừ, giòn ngon thanh mát và dịu ngọt",
    "price": 42000,
    "calo": 477,
    "moods": [
      "ngon",
      "healthy",
      "luoi"
    ],
    "budget": "b40",
    "category": "ngot",
    "tags": [
      "chay",
      "thanh-mat",
      "ngot-ngao"
    ],
    "img": "https://images.unsplash.com/photo-1488900128323-21503983a07e?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.3,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 35,
    "name": "Bún Bò Thái Lan Hải Sản",
    "desc": "Bún bò Thái trộn mắm tôm cay nồng, lòng bò thái lát mỏng và rau nhúng",
    "price": 65000,
    "calo": 439,
    "moods": [
      "ngon",
      "cay",
      "party"
    ],
    "budget": "b70",
    "category": "nuoc",
    "tags": [
      "cay",
      "dam-da",
      "sang"
    ],
    "img": "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.4,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 36,
    "name": "Lẩu Hải Sản Dây Chuyền",
    "desc": "Lẩu hải sản dây chuyền cuốn tôm, mực, hành và rau, quay vòng ăn cùng nhau",
    "price": 120000,
    "calo": 240,
    "moods": [
      "ngon",
      "party"
    ],
    "budget": "b150",
    "category": "nuoc",
    "tags": [
      "sang",
      "dam-da",
      "noi-gia-dinhinh"
    ],
    "img": "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.5,
    "time": "15 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 37,
    "name": "Gà Hấp Mè Sả",
    "desc": "Gà ta hấp mè sả, da vàng óng, thịt ngọt mềm thơm nồng mùi dứa",
    "price": 95000,
    "calo": 317,
    "moods": [
      "ngon",
      "healthy",
      "party"
    ],
    "budget": "b150",
    "category": "com",
    "tags": [
      "no",
      "dinh-duong",
      "thu-gian"
    ],
    "img": "https://images.unsplash.com/photo-1587593810167-a84920ea2781?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.6,
    "time": "15 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 38,
    "name": "Lẩu Thắt Cốt Truyền Thống",
    "desc": "Lẩu thắt cốt truyền thống Hà Nội, nước dùng ngọt thanh và bắp ngọt",
    "price": 78000,
    "calo": 569,
    "moods": [
      "ngon",
      "party"
    ],
    "budget": "b70",
    "category": "nuoc",
    "tags": [
      "truyen-thong",
      "thu-gian",
      "dam-da"
    ],
    "img": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.7,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 39,
    "name": "Bò Sốt Vang Mật Ong",
    "desc": "Bò sốt vang mật ong đậm đà, thịt mềm tan thớt nhúng rau cuốn",
    "price": 110000,
    "calo": 232,
    "moods": [
      "ngon",
      "healthy",
      "party"
    ],
    "budget": "b150",
    "category": "xao-kho",
    "tags": [
      "no",
      "sang",
      "dinh-duong"
    ],
    "img": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.8,
    "time": "15 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 40,
    "name": "Gà Nướng Mật Ong Cưỡi Lửa",
    "desc": "Cả gà nướng cưỡi lửa mọng nước, da giòn tan, mật ong thơm ngọt",
    "price": 140000,
    "calo": 396,
    "moods": [
      "ngon",
      "party"
    ],
    "budget": "b150",
    "category": "com",
    "tags": [
      "sang",
      "gion-rum",
      "noi-gia-dinhinh"
    ],
    "img": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.9,
    "time": "15 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 41,
    "name": "Mực Nướng Muối Ớt",
    "desc": "Mực lá nướng muối ớt dẻo dai, thơm lừng và ăn cùng dưa leo muối",
    "price": 125000,
    "calo": 388,
    "moods": [
      "ngon",
      "cay",
      "party"
    ],
    "budget": "b150",
    "category": "xao-kho",
    "tags": [
      "cay",
      "no",
      "sang"
    ],
    "img": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.2,
    "time": "15 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 42,
    "name": "Lẩu Dê Thái Lạc",
    "desc": "Lẩu dê Thái thơm nồng với lá lạc, nấm và rau nhúng đậm chất miền Tây",
    "price": 150000,
    "calo": 221,
    "moods": [
      "ngon",
      "cay",
      "party"
    ],
    "budget": "b150",
    "category": "nuoc",
    "tags": [
      "cay",
      "sang",
      "noi-gia-dinhinh"
    ],
    "img": "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.3,
    "time": "15 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 43,
    "name": "Set Lẩu Nướng BBQ Mini",
    "desc": "Set mini gồm thịt bò lẩu cuộn mỏng, mực nướng và rau nhúng đa dạng",
    "price": 130000,
    "calo": 558,
    "moods": [
      "ngon",
      "party"
    ],
    "budget": "b150",
    "category": "xao-kho",
    "tags": [
      "sang",
      "noi-gia-dinhinh",
      "dam-da"
    ],
    "img": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.4,
    "time": "15 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 44,
    "name": "Chè Bánh Bột Lọc Sơn Hồng",
    "desc": "Chè bánh bột lọc sơn hồng truyền thống, đậu đỏ hầm mềm trong nước đường",
    "price": 85000,
    "calo": 399,
    "moods": [
      "ngon",
      "healthy",
      "party",
      "luoi"
    ],
    "budget": "b150",
    "category": "ngot",
    "tags": [
      "chay",
      "truyen-thong",
      "ngot-ngao"
    ],
    "img": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.5,
    "time": "15 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 45,
    "name": "Combo Hải Sản Nướng",
    "desc": "Combo hải sản nướng tỉ phú gồm tôm, mực, nghêu và sòa nướng thơm phức",
    "price": 190000,
    "calo": 543,
    "moods": [
      "ngon",
      "party"
    ],
    "budget": "b150",
    "category": "xao-kho",
    "tags": [
      "sang",
      "noi-gia-dinhinh",
      "phobien"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.6,
    "time": "15 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 46,
    "name": "Dừa Xiêm Tươi",
    "desc": "Dừa xiêm bổ mạch ăn trong tại chỗ, nước dừa ngọt lịm và phần dừa non giòn",
    "price": 70000,
    "calo": 442,
    "moods": [
      "ngon",
      "healthy",
      "luoi"
    ],
    "budget": "b70",
    "category": "uong",
    "tags": [
      "mat",
      "thanh-mat",
      "giai-khat"
    ],
    "img": "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.7,
    "time": "3 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 47,
    "name": "Phở Chay Rau Nấm",
    "desc": "Nước phở nấu từ nấm rơm và củ cả muối ngọt, chan bằng rau củ tươi và bánh phở cuốn",
    "price": 38000,
    "calo": 539,
    "moods": [
      "ngon",
      "healthy"
    ],
    "budget": "b40",
    "category": "nuoc",
    "tags": [
      "chay",
      "thanh-mat",
      "dinh-duong"
    ],
    "img": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.8,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 48,
    "name": "Bún Chay Nấm",
    "desc": "Bún trộn nấm vàng sáp, đậu hũ chiên giòn và rau sống, chấm nước mắm chay",
    "price": 42000,
    "calo": 227,
    "moods": [
      "ngon",
      "healthy",
      "ngheo"
    ],
    "budget": "b40",
    "category": "nuoc",
    "tags": [
      "chay",
      "noi-gia-dinhinh",
      "tiet-kiem"
    ],
    "img": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.9,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 49,
    "name": "Bánh Canh Chay Rau Củ",
    "desc": "Bánh canh giọt thịt chay nấu ngọt nước dừa cùng bí đỏ, nấm và đậu hũ",
    "price": 35000,
    "calo": 466,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b40",
    "category": "nuoc",
    "tags": [
      "chay",
      "tiet-kiem",
      "an-sang"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.2,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 50,
    "name": "Canh Chua Bắp Chay",
    "desc": "Canh bắp ngọt với đậu bắp non, đậu xanh và chút me chua chanh giải ngon",
    "price": 30000,
    "calo": 204,
    "moods": [
      "ngon",
      "healthy",
      "ngheo"
    ],
    "budget": "b40",
    "category": "nuoc",
    "tags": [
      "chay",
      "thanh-mat",
      "giai-khat"
    ],
    "img": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.3,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 51,
    "name": "Cơm Chiên Chay Thập Cẩm",
    "desc": "Cơm chiên trộn rau củ giòn, đậu hũ, nấm và chà bông chay giòn tan",
    "price": 39000,
    "calo": 350,
    "moods": [
      "ngon",
      "healthy",
      "ngheo"
    ],
    "budget": "b40",
    "category": "com",
    "tags": [
      "chay",
      "tiet-kiem",
      "dinh-duong"
    ],
    "img": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.4,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 52,
    "name": "Chay Địa Phương",
    "desc": "Mâm cơm chay đầy màu: đậu hũ kho nấm, canh bí đao, rau xào và cơm gạo lứt",
    "price": 45000,
    "calo": 457,
    "moods": [
      "ngon",
      "healthy"
    ],
    "budget": "b40",
    "category": "com",
    "tags": [
      "chay",
      "truyen-thong",
      "noi-gia-dinhinh"
    ],
    "img": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.5,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 53,
    "name": "Rau Xào Chay Củ",
    "desc": "Rau xào thập cẩm giòn mềm, tô đầy màu cho bữa chay đỡ ngán",
    "price": 28000,
    "calo": 270,
    "moods": [
      "ngon",
      "healthy",
      "ngheo"
    ],
    "budget": "b40",
    "category": "xao-kho",
    "tags": [
      "chay",
      "dinh-duong",
      "tiet-kiem"
    ],
    "img": "https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.6,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 54,
    "name": "Gỏi Cuốn Chay Tôm Nứa",
    "desc": "Bánh tráng cuốn tôm nứa, rau củ giòn, chấm mắm tôm chay tươi mát",
    "price": 32000,
    "calo": 540,
    "moods": [
      "ngon",
      "healthy",
      "luoi"
    ],
    "budget": "b40",
    "category": "anvat",
    "tags": [
      "chay",
      "mat",
      "an-vui"
    ],
    "img": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.7,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 55,
    "name": "Chè Đậu Xanh Nấu Gừng",
    "desc": "Đậu xanh nấu nhừ với nước dừa và lát gừng cay ấm, ăn nguội cùng đá lạnh",
    "price": 25000,
    "calo": 501,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "ngot",
    "tags": [
      "chay",
      "ngot-ngao",
      "truyen-thong"
    ],
    "img": "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.8,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 56,
    "name": "Chè Đậu Đỏ Nấu Gừng",
    "desc": "Đậu đỏ nấu bong dừa béo ngậy, gừng ấm bụng cho bữa ăn nhẹ nhàng",
    "price": 26000,
    "calo": 397,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b40",
    "category": "ngot",
    "tags": [
      "chay",
      "ngot-ngao",
      "dinh-duong"
    ],
    "img": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.9,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 57,
    "name": "Bánh Cam Nhân Đậu Xanh",
    "desc": "Bánh cam nhân đậu xanh bùi tan trong miệng, vỏ mềm và trắng ngần",
    "price": 32000,
    "calo": 415,
    "moods": [
      "ngon",
      "healthy",
      "luoi"
    ],
    "budget": "b40",
    "category": "ngot",
    "tags": [
      "chay",
      "ngot-ngao",
      "vui"
    ],
    "img": "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.2,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 58,
    "name": "Bánh Chuối Nướng",
    "desc": "Bánh chuối xiên que nướng giòn thơm mùi caramel, ăn kèm một ly trà",
    "price": 24000,
    "calo": 390,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "ngot",
    "tags": [
      "chay",
      "ngot-ngao",
      "an-sang"
    ],
    "img": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.3,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 59,
    "name": "Trà Sữa Thái Trà Xanh",
    "desc": "Trà xanh Thái đậm chát quyện sữa đặc, thêm chút muối để đậm đà hơn",
    "price": 45000,
    "calo": 481,
    "moods": [
      "ngon",
      "healthy",
      "luoi"
    ],
    "budget": "b40",
    "category": "uong",
    "tags": [
      "giai-khat",
      "ngot-ngao",
      "vui"
    ],
    "img": "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.4,
    "time": "3 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 60,
    "name": "Sữa Tươi Quế Đông",
    "desc": "Sữa tươi hồng quế thơm nồng, pha thêm chút bột quế để rõ vị",
    "price": 55000,
    "calo": 369,
    "moods": [
      "ngon",
      "healthy",
      "party",
      "luoi"
    ],
    "budget": "b70",
    "category": "uong",
    "tags": [
      "giai-khat",
      "thu-gian",
      "dinh-duong"
    ],
    "img": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.5,
    "time": "3 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 61,
    "name": "Bánh Bò Hấp Đường",
    "desc": "Bánh bò hấp đường vừa ăn vừa còn ấm, mềm thơm vị đường mía.",
    "price": 8000,
    "calo": 562,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "tiet-kiem",
      "chay",
      "truyen-thong"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.6,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 62,
    "name": "Kẹo Dừa Lọc Nước Cốt",
    "desc": "Kẹo dừa non lọc nước cốt ngọt dịu, tan ngay trên đầu lưỡi.",
    "price": 10000,
    "calo": 352,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "tiet-kiem",
      "chay",
      "vui"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.7,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 63,
    "name": "Chè Đậu Xanh Giãn Thôi",
    "desc": "Chè đậu xanh giãn thôi tự nhiên, nước đậu sánh đặc và béo thơm.",
    "price": 12000,
    "calo": 457,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "tiet-kiem",
      "chay",
      "thanh-mat"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.8,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 64,
    "name": "Bánh Bao Chiên Mật Ong",
    "desc": "Bánh bao chiên giòn sơn mật ong, chín ở giữa và dẻo ngoài.",
    "price": 15000,
    "calo": 443,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "tiet-kiem",
      "chay",
      "moi"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.9,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 65,
    "name": "Kem Đá Bào Dừa",
    "desc": "Kem đá bào dừa giòn lạnh, rải dừa nạo và mật ong lên trên.",
    "price": 16000,
    "calo": 514,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "tiet-kiem",
      "chay",
      "thanh-mat",
      "vui"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.2,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 66,
    "name": "Bánh Pudding Caramel",
    "desc": "Pudding trứng mịn nước caramel đắng nhẹ, tan trong miệng.",
    "price": 22000,
    "calo": 343,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b20",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "tiet-kiem",
      "chay",
      "moi"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.3,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 67,
    "name": "Bánh Mochi Nhân Đậu Đỏ",
    "desc": "Bánh mochi dẻo nhân đậu đỏ ngọt bùa, ăn một cái là đủ.",
    "price": 28000,
    "calo": 246,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b40",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "chay",
      "vui",
      "moi"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.4,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 68,
    "name": "Chè Bánh Chung Nhân Đậu Xanh",
    "desc": "Chè bánh chung nấu nhừ với đậu xanh đã xay, quen thuộc ngày Tết.",
    "price": 30000,
    "calo": 388,
    "moods": [
      "ngon",
      "healthy",
      "ngheo",
      "luoi"
    ],
    "budget": "b40",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "chay",
      "truyen-thong"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": true,
    "rating": 4.5,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 69,
    "name": "Chè Thái Sữa Trân Châu",
    "desc": "Chè thái sữa trân châu trắng giòn, vị béo ngọt hợp khẩu vị.",
    "price": 32000,
    "calo": 389,
    "moods": [
      "ngon",
      "healthy",
      "luoi"
    ],
    "budget": "b40",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "chay",
      "vui",
      "moi"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.6,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 70,
    "name": "Bánh Bông Lan Trứng Muối",
    "desc": "Bánh bông lan mềm xốp kèm trứng muối mặn ngọt cân bằng.",
    "price": 35000,
    "calo": 364,
    "moods": [
      "ngon",
      "healthy",
      "party",
      "luoi"
    ],
    "budget": "b40",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "chay",
      "sang",
      "an-vui"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.7,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 71,
    "name": "Chè Hạt Dẻ Nước Cốt Dừa",
    "desc": "Chè hạt dẻ trong nước cốt dừa, dẻo bột và thơm dừa.",
    "price": 45000,
    "calo": 573,
    "moods": [
      "ngon",
      "healthy",
      "luoi"
    ],
    "budget": "b40",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "chay",
      "dinh-duong",
      "thanh-mat"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.8,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 72,
    "name": "Kem Socola Dừa Ốc Quế",
    "desc": "Kem socola đen nhúng dừa ốc quế giòn rụm, vị đậm và béo.",
    "price": 55000,
    "calo": 367,
    "moods": [
      "ngon",
      "healthy",
      "party",
      "luoi"
    ],
    "budget": "b70",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "chay",
      "sang",
      "vui"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.9,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 73,
    "name": "Bánh Tart Trái Cây",
    "desc": "Tart bánh mì giòn xốc kem và xếp trái cây tươi theo mùa.",
    "price": 60000,
    "calo": 381,
    "moods": [
      "ngon",
      "healthy",
      "party",
      "luoi"
    ],
    "budget": "b70",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "chay",
      "sang",
      "vui"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.2,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 74,
    "name": "Bánh Tiramisu Phô Mai",
    "desc": "Tiramisu phô mai mềm, thơm cà phê và ca ca trên mỗi miếng bánh.",
    "price": 65000,
    "calo": 547,
    "moods": [
      "ngon",
      "party",
      "luoi"
    ],
    "budget": "b70",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "man",
      "sang",
      "moi"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.3,
    "time": "5 phút",
    "type": "man",
    "diet": "man"
  },
  {
    "id": 75,
    "name": "Chè Thái Phong Hạt Nổ",
    "desc": "Chè thái hạt nổ giòn tanh tách cùng nước cốt dừa béo ngậy.",
    "price": 75000,
    "calo": 215,
    "moods": [
      "ngon",
      "healthy",
      "party",
      "luoi"
    ],
    "budget": "b70",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "chay",
      "sang",
      "vui"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.4,
    "time": "5 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 76,
    "name": "Bánh Chocolate Lava Bạc Xu",
    "desc": "Bánh chocolate lava nhân bạc xu chảy ra khi cắt, ăn nóng còn ấm tận miệng.",
    "price": 110000,
    "calo": 422,
    "moods": [
      "ngon",
      "healthy",
      "party",
      "luoi"
    ],
    "budget": "b150",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "chay",
      "sang",
      "moi"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.5,
    "time": "15 phút",
    "type": "chay",
    "diet": "chay"
  },
  {
    "id": 77,
    "name": "Bánh Tiramisu Bỏ Rượu Nhật",
    "desc": "Tiramisu bỏ rượu Nhật đi vị cà phê, kem mascarpone lạnh và bột cacao.",
    "price": 120000,
    "calo": 233,
    "moods": [
      "ngon",
      "party",
      "luoi"
    ],
    "budget": "b150",
    "category": "ngot",
    "tags": [
      "ngot-ngao",
      "man",
      "sang",
      "moi"
    ],
    "img": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=900&q=80",
    "popular": false,
    "rating": 4.6,
    "time": "15 phút",
    "type": "man",
    "diet": "man"
  }
];

export function replaceDishes(nextDishes) {
  if (Array.isArray(nextDishes)) dishes = nextDishes;
}

export const popularDishes = dishes.filter(d => d.popular);
export const newDishes = dishes.filter(d => !d.popular).slice(0, 12);
