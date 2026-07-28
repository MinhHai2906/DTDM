// DỮ LIỆU SẢN PHẨM - ĐIỆN THOẠI + TAI NGHE + CỦ SẠC
const products = [
  // ========== ĐIỆN THOẠI ==========

  // 1. APPLE (AI PHÔN)
  {
    id: 1,
    name: "iPhone 16 Pro Max",
    price: 34990000,
    brand: "Apple",
    category: "phone",
    image: "assets/images/IP16.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.9,
  },
  {
    id: 2,
    name: "iPhone 15 Pro",
    price: 28990000,
    brand: "Apple",
    category: "phone",
    image: "assets/images/IP15.jpg",
    isNew: false,
    isSale: true,
    discount: 15,
    rating: 4.8,
  },
  {
    id: 3,
    name: "iPhone 14",
    price: 19990000,
    brand: "Apple",
    category: "phone",
    image: "assets/images/IP14.jpg",
    isNew: false,
    isSale: true,
    discount: 20,
    rating: 4.7,
  },
  {
    id: 4,
    name: "iPhone 17 Pro",
    price: 35990000,
    brand: "Apple",
    category: "phone",
    image: "assets/images/IP17.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.9,
  },
  {
    id: 5,
    name: "iPhone 15 Plus",
    price: 26990000,
    brand: "Apple",
    category: "phone",
    image: "assets/images/IP15.jpg",
    isNew: false,
    isSale: false,
    discount: 0,
    rating: 4.7,
  },

  // 2. SAMSUNG (XAM XUNG)
  {
    id: 6,
    name: "Samsung Galaxy S24 Ultra",
    price: 28990000,
    brand: "Samsung",
    category: "phone",
    image: "assets/images/samsungS24U.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.9,
  },
  {
    id: 7,
    name: "Samsung Galaxy S24+",
    price: 23990000,
    brand: "Samsung",
    category: "phone",
    image: "assets/images/SSS24P.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.8,
  },
  {
    id: 8,
    name: "Samsung Galaxy S24",
    price: 19990000,
    brand: "Samsung",
    category: "phone",
    image: "assets/images/samsungS24U.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.7,
  },
  {
    id: 9,
    name: "Samsung Galaxy S21",
    price: 12990000,
    brand: "Samsung",
    category: "phone",
    image: "assets/images/samsungS21.jpg",
    isNew: false,
    isSale: true,
    discount: 25,
    rating: 4.6,
  },
  {
    id: 10,
    name: "Samsung Galaxy Z Fold 5",
    price: 35990000,
    brand: "Samsung",
    category: "phone",
    image: "assets/images/SSZF5.jpg",
    isNew: false,
    isSale: true,
    discount: 10,
    rating: 4.7,
  },
  {
    id: 11,
    name: "Samsung Galaxy Z Flip 5",
    price: 24990000,
    brand: "Samsung",
    category: "phone",
    image: "assets/images/SSZF5.jpg",
    isNew: false,
    isSale: true,
    discount: 15,
    rating: 4.7,
  },

  // 3. XIAOMI (RÉT MI)
  {
    id: 12,
    name: "Xiaomi 14 Ultra",
    price: 22990000,
    brand: "Xiaomi",
    category: "phone",
    image: "assets/images/X14U.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.8,
  },
  {
    id: 13,
    name: "Xiaomi 14 Pro",
    price: 18990000,
    brand: "Xiaomi",
    category: "phone",
    image: "assets/images/X14U.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.7,
  },
  {
    id: 14,
    name: "Xiaomi 13T Pro",
    price: 15990000,
    brand: "Xiaomi",
    category: "phone",
    image: "assets/images/X13TP.jpg",
    isNew: false,
    isSale: true,
    discount: 15,
    rating: 4.7,
  },
  {
    id: 15,
    name: "Xiaomi Redmi Note 13 Pro",
    price: 8990000,
    brand: "Xiaomi",
    category: "phone",
    image: "assets/images/X13TP.jpg",
    isNew: false,
    isSale: true,
    discount: 10,
    rating: 4.6,
  },

  // 4. OPPO (ỐP PỒ)
  {
    id: 16,
    name: "Oppo Find X7 Ultra",
    price: 27990000,
    brand: "Oppo",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.8,
  },
  {
    id: 17,
    name: "Oppo Find N3",
    price: 32990000,
    brand: "Oppo",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.7,
  },
  {
    id: 18,
    name: "Oppo Reno 11 Pro",
    price: 13990000,
    brand: "Oppo",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: false,
    isSale: true,
    discount: 10,
    rating: 4.6,
  },
  {
    id: 19,
    name: "Oppo A78",
    price: 5990000,
    brand: "Oppo",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: false,
    isSale: true,
    discount: 15,
    rating: 4.5,
  },

  // 5. REDMAGIC
  {
    id: 20,
    name: "RedMagic 9 Pro",
    price: 18990000,
    brand: "Redmagic",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.8,
  },
  {
    id: 21,
    name: "RedMagic 8S Pro",
    price: 15990000,
    brand: "Redmagic",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: false,
    isSale: true,
    discount: 15,
    rating: 4.7,
  },
  {
    id: 22,
    name: "RedMagic 7",
    price: 11990000,
    brand: "Redmagic",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: false,
    isSale: true,
    discount: 20,
    rating: 4.6,
  },

  // 6. VIVO
  {
    id: 23,
    name: "Vivo X100 Pro",
    price: 22990000,
    brand: "Vivo",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.8,
  },
  {
    id: 24,
    name: "Vivo V30 Pro",
    price: 12990000,
    brand: "Vivo",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: false,
    isSale: true,
    discount: 10,
    rating: 4.7,
  },
  {
    id: 25,
    name: "Vivo Y100",
    price: 6990000,
    brand: "Vivo",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: false,
    isSale: true,
    discount: 15,
    rating: 4.5,
  },
  {
    id: 26,
    name: "Vivo T3 Pro",
    price: 9990000,
    brand: "Vivo",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: false,
    isSale: false,
    discount: 0,
    rating: 4.6,
  },

  // 7. NUBIA
  {
    id: 27,
    name: "Nubia Z60 Ultra",
    price: 19990000,
    brand: "Nubia",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.7,
  },
  {
    id: 28,
    name: "Nubia Red Magic 9 Pro",
    price: 17990000,
    brand: "Nubia",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.7,
  },
  {
    id: 29,
    name: "Nubia Z50",
    price: 12990000,
    brand: "Nubia",
    category: "phone",
    image: "assets/images/OP12.jpg",
    isNew: false,
    isSale: true,
    discount: 20,
    rating: 4.6,
  },

  // ========== TAI NGHE ==========
  {
    id: 30,
    name: "AirPods Pro 2",
    price: 4990000,
    brand: "Apple",
    category: "headphone",
    image: "assets/images/APP2.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.9,
  },
  {
    id: 31,
    name: "AirPods 3",
    price: 3990000,
    brand: "Apple",
    category: "headphone",
    image: "assets/images/APP2.jpg",
    isNew: false,
    isSale: true,
    discount: 10,
    rating: 4.7,
  },
  {
    id: 32,
    name: "Sony WH-1000XM5",
    price: 7990000,
    brand: "Sony",
    category: "headphone",
    image: "assets/images/SONY.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.9,
  },
  {
    id: 33,
    name: "Sony WF-1000XM5",
    price: 5990000,
    brand: "Sony",
    category: "headphone",
    image: "assets/images/SONY.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.8,
  },
  {
    id: 34,
    name: "Bose QuietComfort Ultra",
    price: 8990000,
    brand: "Bose",
    category: "headphone",
    image: "assets/images/BOSE.jpg",
    isNew: true,
    isSale: true,
    discount: 10,
    rating: 4.8,
  },
  {
    id: 35,
    name: "Bose QC45",
    price: 6490000,
    brand: "Bose",
    category: "headphone",
    image: "assets/images/BOSE.jpg",
    isNew: false,
    isSale: true,
    discount: 15,
    rating: 4.7,
  },
  {
    id: 36,
    name: "Samsung Galaxy Buds2 Pro",
    price: 3990000,
    brand: "Samsung",
    category: "headphone",
    image: "assets/images/SSB2P.jpg",
    isNew: false,
    isSale: true,
    discount: 15,
    rating: 4.7,
  },
  {
    id: 37,
    name: "Samsung Galaxy Buds FE",
    price: 1990000,
    brand: "Samsung",
    category: "headphone",
    image: "assets/images/SSB2P.jpg",
    isNew: false,
    isSale: true,
    discount: 20,
    rating: 4.6,
  },
  {
    id: 38,
    name: "JBL Tune 760NC",
    price: 2490000,
    brand: "JBL",
    category: "headphone",
    image: "assets/images/JBL.jpg",
    isNew: false,
    isSale: true,
    discount: 20,
    rating: 4.6,
  },
  {
    id: 39,
    name: "JBL Live Pro 2",
    price: 3490000,
    brand: "JBL",
    category: "headphone",
    image: "assets/images/JBL.jpg",
    isNew: false,
    isSale: false,
    discount: 0,
    rating: 4.6,
  },
  {
    id: 40,
    name: "Xiaomi Buds 4 Pro",
    price: 2490000,
    brand: "Xiaomi",
    category: "headphone",
    image: "assets/images/X13TP.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.5,
  },
  {
    id: 41,
    name: "Nothing Ear (2)",
    price: 3990000,
    brand: "Nothing",
    category: "headphone",
    image: "assets/images/OP12.jpg",
    isNew: false,
    isSale: true,
    discount: 10,
    rating: 4.7,
  },

  // ========== CỦ SẠC ==========
  {
    id: 42,
    name: "Củ sạc nhanh 20W Apple",
    price: 690000,
    brand: "Apple",
    category: "charger",
    image: "assets/images/ANKER.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.8,
  },
  {
    id: 43,
    name: "Củ sạc nhanh 65W GaN",
    price: 890000,
    brand: "Baseus",
    category: "charger",
    image: "assets/images/BASEUS.jpg",
    isNew: true,
    isSale: true,
    discount: 10,
    rating: 4.7,
  },
  {
    id: 44,
    name: "Sạc không dây MagSafe 15W",
    price: 1290000,
    brand: "Apple",
    category: "charger",
    image: "assets/images/BELKIN.jpg",
    isNew: true,
    isSale: false,
    discount: 0,
    rating: 4.9,
  },

  {
    id: 45,
    name: "Củ sạc không dây 15W",
    price: 699000,
    brand: "Belkin",
    category: "charger",
    image: "assets/images/BELKIN.jpg",
    isNew: false,
    isSale: true,
    discount: 15,
    rating: 4.7,
  },
];

// ========== HÀM TIỆN ÍCH ==========

// Lấy sản phẩm theo danh mục
function getProductsByCategory(category) {
  return products.filter((product) => product.category === category);
}

// Lấy sản phẩm mới
function getNewProducts() {
  return products.filter((product) => product.isNew === true);
}

// Lấy sản phẩm khuyến mãi
function getSaleProducts() {
  return products.filter((product) => product.isSale === true);
}

// Lấy sản phẩm theo hãng
function getProductsByBrand(brand) {
  return products.filter((product) => product.brand === brand);
}

// Lấy tất cả các hãng có trong data
function getAllBrands() {
  const brands = [...new Set(products.map((p) => p.brand))];
  return brands;
}

// Format giá tiền
function formatPrice(price) {
  return price.toLocaleString("vi-VN") + "₫";
}

// Tính giá sau khuyến mãi
function getDiscountedPrice(product) {
  if (product.discount > 0) {
    return (product.price * (100 - product.discount)) / 100;
  }
  return product.price;
}

// Đếm số lượng sản phẩm theo danh mục
function getProductCountByCategory() {
  const count = {};
  products.forEach((product) => {
    const categoryMap = {
      phone: "📱 Điện thoại",
      headphone: "🎧 Tai nghe",
      charger: "🔌 Củ sạc",
    };
    const displayName = categoryMap[product.category] || product.category;
    count[displayName] = (count[displayName] || 0) + 1;
  });
  return count;
}

// Tìm kiếm sản phẩm
function searchProducts(keyword) {
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(keyword.toLowerCase()) ||
      product.brand.toLowerCase().includes(keyword.toLowerCase()),
  );
}

// Sắp xếp sản phẩm
function sortProducts(productList, sortBy) {
  const sorted = [...productList];
  switch (sortBy) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name_asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "rating_desc":
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted;
  }
}

// Export cho Node.js (nếu cần)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    products,
    getProductsByCategory,
    getNewProducts,
    getSaleProducts,
    getProductsByBrand,
    formatPrice,
    getDiscountedPrice,
    getAllBrands,
    getProductCountByCategory,
    searchProducts,
    sortProducts,
  };
}

// Log thông tin
console.log("Đã load dữ liệu!");
console.log(`Tổng số sản phẩm: ${products.length}`);
console.log(`Phân loại:`, getProductCountByCategory());

if (typeof window !== "undefined") {
  window.seedProducts = products;
}
