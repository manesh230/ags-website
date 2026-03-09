// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== CART STATE =====
let cart = JSON.parse(localStorage.getItem('ags_cart') || '[]');

function saveCart() {
  localStorage.setItem('ags_cart', JSON.stringify(cart));
}

function addToCart(product, qty = 1) {
  const existing = cart.find(item => item.id === product.id);
  const stockAvail = parseInt(product.stock) || 0;
  if (existing) {
    const newQty = existing.qty + qty;
    existing.qty = Math.min(newQty, stockAvail);
  } else {
    cart.push({ ...product, qty: Math.min(qty, stockAvail) });
  }
  saveCart();
  updateCartUI();
  flashCartBtn();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}

function changeQty(id, delta) {
  const item    = cart.find(i => i.id === id);
  if (!item) return;
  const product = allProducts.find(p => p.id === id);
  const maxQty  = product ? (parseInt(product.stock) || 0) : item.qty;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else {
    if (item.qty > maxQty) item.qty = maxQty;
    saveCart();
    updateCartUI();
  }
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function updateCartUI() {
  const countEl  = document.getElementById('cartCount');
  const itemsEl  = document.getElementById('cartItems');
  const emptyEl  = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');
  const totalEl  = document.getElementById('cartTotal');

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  countEl.textContent = totalQty;
  countEl.classList.toggle('visible', totalQty > 0);

  itemsEl.innerHTML = '';
  if (cart.length === 0) {
    emptyEl.classList.add('visible');
    footerEl.classList.remove('visible');
  } else {
    emptyEl.classList.remove('visible');
    footerEl.classList.add('visible');
    cart.forEach(item => {
      const product  = allProducts.find(p => p.id === item.id);
      const maxStock = product ? (parseInt(product.stock) || 0) : 999;
      const atMax    = item.qty >= maxStock;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${item.media_url}" alt="${item.name}" />
        <div class="cart-item-info">
          <h5>${item.name}</h5>
          <p>PKR ${(item.price * item.qty).toLocaleString()}</p>
          <small style="color:#999;font-size:0.72rem;">${maxStock} available</small>
        </div>
        <div class="cart-item-qty">
          <button data-id="${item.id}" data-delta="-1">&#8722;</button>
          <span>${item.qty}</span>
          <button data-id="${item.id}" data-delta="1" ${atMax ? 'disabled title="Max stock reached"' : ''}>+</button>
        </div>
      `;
      itemsEl.appendChild(div);
    });
    itemsEl.querySelectorAll('.cart-item-qty button').forEach(btn => {
      if (btn.disabled) return;
      btn.addEventListener('click', () => {
        changeQty(btn.dataset.id, parseInt(btn.dataset.delta));
      });
    });
  }
  totalEl.textContent = `PKR ${getCartTotal().toLocaleString()}`;
}

function flashCartBtn() {
  const btn = document.getElementById('cartBtn');
  btn.style.transform = 'scale(1.25)';
  btn.style.transition = 'transform 0.15s';
  setTimeout(() => { btn.style.transform = ''; }, 200);
}

// ===== EMAIL CONFIG =====
// Locally: calls the Node email server on port 3001
// On Vercel (or any deployed host): calls the serverless function at /api/send-order-email
const EMAIL_SERVER = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/send-order-email'
  : '/api/send-order-email';
const ADMIN_EMAIL    = 'manesh100130@gmail.com';

// ===== CART DRAWER =====
const cartBtn     = document.getElementById('cartBtn');
const cartDrawer  = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartClose   = document.getElementById('cartClose');

function openCart()  {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

cartBtn.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// ===== CHECKOUT MODAL =====
const checkoutOverlay = document.getElementById('checkoutOverlay');
const checkoutClose   = document.getElementById('checkoutClose');

function openCheckout() {
  if (cart.length === 0) return;
  closeCart();

  // Populate order summary
  const summaryEl = document.getElementById('checkoutSummary');
  const totalEl   = document.getElementById('checkoutTotal');
  summaryEl.innerHTML = '';
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'checkout-row';
    row.innerHTML = `
      <img src="${item.media_url}" alt="${item.name}" />
      <div class="checkout-row-info">
        <span>${item.name}</span>
        <small>Qty: ${item.qty} &times; PKR ${item.price.toLocaleString()}</small>
      </div>
      <div class="checkout-row-price">PKR ${(item.price * item.qty).toLocaleString()}</div>
    `;
    summaryEl.appendChild(row);
  });
  totalEl.textContent = `PKR ${getCartTotal().toLocaleString()}`;

  // Reset form
  document.getElementById('checkoutForm').reset();
  ['cfName','cfPhone','cfEmail','cfAddress'].forEach(id => {
    document.getElementById(id).classList.remove('invalid');
  });
  ['cfNameErr','cfPhoneErr','cfEmailErr','cfAddressErr'].forEach(id => {
    document.getElementById(id).textContent = '';
  });

  checkoutOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  checkoutOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
checkoutClose.addEventListener('click', closeCheckout);
checkoutOverlay.addEventListener('click', e => { if (e.target === checkoutOverlay) closeCheckout(); });

// ===== CHECKOUT FORM — real-time input guards =====
// Name: only letters and spaces
document.getElementById('cfName').addEventListener('input', function() {
  this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
});
// Phone: only digits, max 11
document.getElementById('cfPhone').addEventListener('input', function() {
  this.value = this.value.replace(/\D/g, '').slice(0, 11);
});

// ===== CHECKOUT FORM SUBMIT =====
document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const nameEl    = document.getElementById('cfName');
  const phoneEl   = document.getElementById('cfPhone');
  const emailEl   = document.getElementById('cfEmail');
  const addressEl = document.getElementById('cfAddress');
  let valid = true;

  function setErr(inputEl, errId, msg) {
    if (msg) {
      inputEl.classList.add('invalid');
      document.getElementById(errId).textContent = msg;
      valid = false;
    } else {
      inputEl.classList.remove('invalid');
      document.getElementById(errId).textContent = '';
    }
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern  = /^03[0-9]{9}$/;          // 03XXXXXXXXX — 11 digits
  const namePattern   = /^[a-zA-Z\s]{2,}$/;      // letters + spaces, min 2 chars

  setErr(nameEl,    'cfNameErr',
    !nameEl.value.trim()                         ? 'Full name is required.' :
    !namePattern.test(nameEl.value.trim())       ? 'Name must contain letters only (no numbers).' : '');
  setErr(phoneEl,   'cfPhoneErr',
    !phoneEl.value.trim()                        ? 'Phone number is required.' :
    !phonePattern.test(phoneEl.value.trim())     ? 'Enter a valid 11-digit number starting with 03 (e.g. 03001234567).' : '');
  setErr(emailEl,   'cfEmailErr',
    !emailEl.value.trim()                        ? 'Email address is required.' :
    !emailPattern.test(emailEl.value.trim())     ? 'Enter a valid email address (e.g. name@gmail.com).' : '');
  setErr(addressEl, 'cfAddressErr', addressEl.value.trim() ? '' : 'Delivery address is required.');
  if (!valid) return;

  const name    = nameEl.value.trim();
  const phone   = phoneEl.value.trim();
  const email   = emailEl.value.trim();
  const address = addressEl.value.trim();

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled    = true;
  btn.textContent = 'Placing Order...';

  // Save order to Supabase
  const orderTotal = getCartTotal();
  try {
    await supabaseClient.from('orders').insert({
      customer_name:    name,
      customer_phone:   phone,
      customer_email:   email,
      delivery_address: address,
      items:            JSON.stringify(cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price }))),
      total:            orderTotal,
      status:           'pending',
    });
  } catch (_) { /* continue even if DB insert fails */ }

  // Snapshot cart before clearing, then deduct stock in Supabase
  const cartSnapshot = [...cart];

  const itemLines = cart.map(i =>
    `${i.name}  x${i.qty}  =  PKR ${(i.price * i.qty).toLocaleString()}`
  ).join('\n');

  // 1+2) Send emails (admin notification + customer confirmation) via local SMTP server
  try {
    await fetch(EMAIL_SERVER, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName:    name,
        customerPhone:   phone,
        customerEmail:   email,
        deliveryAddress: address,
        orderItems:      cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
        orderTotal:      `PKR ${orderTotal.toLocaleString()}`,
      }),
    });
  } catch (err) {
    console.error('Email send failed:', err);
    // Order is still confirmed — it\'s saved in Supabase
  }

  // Clear cart
  cart = [];
  saveCart();
  updateCartUI();

  // Deduct stock from Supabase for each ordered item
  for (const item of cartSnapshot) {
    try {
      await supabaseClient.rpc('decrement_stock', {
        product_id: item.id,
        amount:     item.qty
      });
      // Update local allProducts so cart/card reflects new stock immediately
      const local = allProducts.find(p => p.id === item.id);
      if (local) local.stock = Math.max(0, (parseInt(local.stock) || 0) - item.qty);
    } catch (_) { /* non-critical */ }
  }
  // Re-render product grid to show updated stock
  renderProducts();

  closeCheckout();

  // Show confirmation
  document.getElementById('confirmMsg').textContent =
    `Thank you, ${name}! Your order (PKR ${orderTotal.toLocaleString()}) has been placed. We'll contact you shortly to confirm delivery.`;
  document.getElementById('confirmOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  btn.disabled    = false;
  btn.textContent = 'Place Order';
});

// ===== ORDER CONFIRMATION OK =====
document.getElementById('confirmOk').addEventListener('click', () => {
  document.getElementById('confirmOverlay').classList.remove('open');
  document.body.style.overflow = '';
});

// ===== PRODUCT DETAIL MODAL =====
const modalOverlay = document.getElementById('modalOverlay');
let currentModalProduct = null;

function openModal(p) {
  currentModalProduct = p;
  document.getElementById('modalMedia').innerHTML = p.media_type === 'video'
    ? `<video src="${p.media_url}" controls autoplay muted loop playsinline></video>`
    : `<img src="${p.media_url}" alt="${p.name}" />`;
  document.getElementById('modalCat').textContent   = catLabels[p.category] || p.category;
  document.getElementById('modalName').textContent  = p.name;
  document.getElementById('modalDesc').textContent  = p.description;

  const outOfStock = !p.stock || parseInt(p.stock) <= 0;
  const stockCount  = parseInt(p.stock) || 0;
  const stockEl = document.getElementById('modalStock');
  stockEl.textContent = outOfStock ? 'Out of Stock' : stockCount <= 5 ? `Only ${stockCount} left!` : `${stockCount} in stock`;
  stockEl.className   = 'modal-stock ' + (outOfStock ? 'out' : stockCount <= 5 ? 'out' : 'in');

  document.getElementById('modalPrice').textContent = `PKR ${p.price.toLocaleString()}`;

  const addBtn = document.getElementById('modalAddCart');
  addBtn.disabled    = outOfStock;
  addBtn.textContent = outOfStock ? 'Out of Stock' : 'Add to Cart';

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('modalClose').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

document.getElementById('modalAddCart').addEventListener('click', () => {
  if (!currentModalProduct) return;
  addToCart(currentModalProduct);
  const btn = document.getElementById('modalAddCart');
  btn.textContent = 'Added ✓';
  setTimeout(() => { btn.textContent = 'Add to Cart'; }, 1500);
});

// ===== PRODUCT DISPLAY =====
const productGrid    = document.getElementById('productGrid');
const noProductsMsg  = document.getElementById('noProductsMsg');
const loadingSpinner = document.getElementById('loadingSpinner');
const tabs           = document.querySelectorAll('.tab');

let currentFilter = 'all';
let currentSearch = '';
let allProducts   = [];

// ===== SEARCH SCORING =====
// Returns 0 (no match), 1 (partial), 2 (word starts with), 3 (title starts with), 4 (exact)
function scoreProduct(p, query) {
  if (!query) return 5; // no query = always show
  const name = p.name.toLowerCase();
  const q    = query.toLowerCase().trim();
  if (!q) return 5;
  if (name === q)                          return 4; // exact
  if (name.startsWith(q))                 return 3; // title starts with
  if (name.split(/\s+/).some(w => w.startsWith(q))) return 2; // a word starts with query
  if (name.includes(q))                   return 1; // partial anywhere
  return 0; // no match
}

const catLabels = { clothing: 'Clothing', cosmetics: 'Cosmetics', toys: 'Toys' };

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity   = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

function observeReveal(el) {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
}

document.querySelectorAll('.stat-card, .cat-card, .contact-item, .about-text')
  .forEach(observeReveal);

// ===== BUILD PRODUCT CARD =====
function buildProductCard(p) {
  const card = document.createElement('div');
  card.classList.add('product-card');
  card.dataset.category = p.category;

  const mediaHTML = p.media_type === 'video'
    ? `<div class="product-img" style="background:#000;">
        <video src="${p.media_url}" muted loop playsinline
          style="width:100%;height:100%;object-fit:cover;display:block;"></video>
       </div>`
    : `<div class="product-img" style="background:#f5f5f5;">
        <img src="${p.media_url}" alt="${p.name}"
          style="width:100%;height:100%;object-fit:cover;display:block;" />
       </div>`;

  const outOfStock   = !p.stock || parseInt(p.stock) <= 0;
  const stockCount   = parseInt(p.stock) || 0;
  const stockBadge   = outOfStock ? `<span class="out-of-stock-badge">Out of Stock</span>` : '';
  const stockInfo    = !outOfStock
    ? `<span class="stock-info-badge ${stockCount <= 5 ? 'low' : ''}">${
        stockCount <= 5 ? `Only ${stockCount} left!` : `${stockCount} in stock`
      }</span>`
    : '';

  card.innerHTML = `
    ${mediaHTML}
    ${stockBadge}
    <div class="product-info">
      <span class="product-cat">${catLabels[p.category] || p.category}</span>
      <h4>${p.name}</h4>
      <p>${p.description}</p>
      ${stockInfo}
      <div class="product-footer">
        <div class="product-footer-top">
          <span class="price">PKR ${p.price.toLocaleString()}</span>
          ${!outOfStock ? `<div class="card-qty-wrap">
            <button class="card-qty-btn card-qty-minus" aria-label="decrease">&#8722;</button>
            <span class="card-qty-val">1</span>
            <button class="card-qty-btn card-qty-plus" aria-label="increase">+</button>
          </div>` : ''}
        </div>
        <div class="product-actions">
          <button class="btn-view">View Product</button>
          <button class="btn-cart" ${outOfStock ? 'disabled' : ''}>
            ${outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  `;

  card.querySelector('.btn-view').addEventListener('click', () => openModal(p));

  if (!outOfStock) {
    let selectedQty = 1;
    const qtyValEl   = card.querySelector('.card-qty-val');
    const minusBtn   = card.querySelector('.card-qty-minus');
    const plusBtn    = card.querySelector('.card-qty-plus');

    minusBtn.addEventListener('click', () => {
      if (selectedQty > 1) { selectedQty--; qtyValEl.textContent = selectedQty; }
    });
    plusBtn.addEventListener('click', () => {
      if (selectedQty < stockCount) { selectedQty++; qtyValEl.textContent = selectedQty; }
      else { plusBtn.title = 'Max stock reached'; }
    });

    card.querySelector('.btn-cart').addEventListener('click', function () {
      addToCart(p, selectedQty);
      this.textContent = 'Added ✓';
      this.style.background = 'var(--green-dark)';
      setTimeout(() => {
        this.textContent = 'Add to Cart';
        this.style.background = '';
      }, 1500);
    });
  }

  observeReveal(card);
  return card;
}

// ===== RENDER PRODUCTS =====
function renderProducts() {
  productGrid.innerHTML = '';
  const infoEl = document.getElementById('searchResultsInfo');

  // Apply category filter
  let filtered = currentFilter === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === currentFilter);

  // Apply search + scoring
  const q = currentSearch.trim();
  if (q) {
    const scored = filtered
      .map(p => ({ p, score: scoreProduct(p, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);
    filtered = scored.map(x => x.p);
    infoEl.textContent = filtered.length
      ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${q}"`
      : `No results for "${q}"`;
  } else {
    infoEl.textContent = '';
  }

  if (filtered.length === 0) {
    productGrid.style.display   = 'none';
    noProductsMsg.style.display = 'block';
    noProductsMsg.textContent   = q ? `No products match "${q}".` : 'No products added yet. Check back soon!';
    return;
  }
  noProductsMsg.style.display = 'none';
  productGrid.style.display   = 'grid';
  filtered.forEach(p => productGrid.appendChild(buildProductCard(p)));
}

// ===== FILTER TABS =====
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    renderProducts();
  });
});

// ===== SEARCH =====
const productSearchInput = document.getElementById('productSearch');
const searchClearBtn     = document.getElementById('searchClear');
let   searchDebounce     = null;

// Sync helper — updates both inputs and re-renders
function applySearch(query, skipScrollToFeatured) {
  currentSearch = query;
  productSearchInput.value              = query;
  navbarSearchInput.value               = query;
  searchClearBtn.style.display          = query ? 'flex' : 'none';
  navbarSearchClearBtn.style.display    = query ? 'flex' : 'none';
  renderProducts();
  if (query && !skipScrollToFeatured) {
    document.getElementById('featured').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

productSearchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => applySearch(productSearchInput.value, true), 200);
});

searchClearBtn.addEventListener('click', () => {
  applySearch('', true);
  productSearchInput.focus();
});

// ===== NAVBAR SEARCH =====
const navbarSearchInput    = document.getElementById('navbarSearch');
const navbarSearchClearBtn = document.getElementById('navbarSearchClear');

navbarSearchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => applySearch(navbarSearchInput.value, false), 200);
});

navbarSearchClearBtn.addEventListener('click', () => {
  applySearch('', true);
  navbarSearchInput.focus();
});

// ===== LOAD PRODUCTS FROM SUPABASE =====
async function loadProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  loadingSpinner.style.display = 'none';

  if (error) {
    noProductsMsg.style.display = 'block';
    noProductsMsg.textContent   = 'Could not load products. Check Supabase setup.';
    return;
  }

  allProducts = data || [];
  renderProducts();
}

// ===== REAL-TIME UPDATES =====
supabaseClient
  .channel('products-channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
    loadProducts();
  })
  .subscribe();

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');
const formNote    = document.getElementById('formNote');
contactForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  formNote.textContent = `Thank you, ${name}! We'll get back to you shortly. ✓`;
  formNote.style.color = 'var(--green-main)';
  contactForm.reset();
  setTimeout(() => { formNote.textContent = ''; }, 4000);
});

// ===== EXTRA STYLES =====
const styleEl = document.createElement('style');
styleEl.textContent = `
  .out-of-stock-badge {
    position: absolute; top: 10px; right: 10px;
    background: #e53935; color: white;
    font-size: 0.7rem; font-weight: 700;
    padding: 3px 10px; border-radius: 20px;
    text-transform: uppercase;
  }
  .product-card { position: relative; }
  .btn-cart:disabled { background: #e0e0e0 !important; color: #999 !important; cursor: not-allowed; }
`;
document.head.appendChild(styleEl);

// ===== INIT =====
updateCartUI();
loadProducts();
