// ===== CREDENTIALS =====
const ADMIN_USER  = 'admin';
const ADMIN_PASS  = 'ags@2024';
const SESSION_KEY = 'ags_admin_session';
const BUCKET      = 'product-media';

// ===== DOM refs =====
const loginScreen       = document.getElementById('loginScreen');
const dashboard         = document.getElementById('dashboard');
const loginForm         = document.getElementById('loginForm');
const loginUser         = document.getElementById('loginUser');
const loginPass         = document.getElementById('loginPass');
const loginError        = document.getElementById('loginError');
const togglePass        = document.getElementById('togglePass');
const logoutBtn         = document.getElementById('logoutBtn');
const navItems          = document.querySelectorAll('.nav-item[data-panel]');
const addPanel          = document.getElementById('addProductPanel');
const managePanel       = document.getElementById('manageProductsPanel');
const ordersPanel       = document.getElementById('currentOrdersPanel');
const panelTitle        = document.getElementById('panelTitle');
const productCount      = document.getElementById('productCount');
const addForm           = document.getElementById('addProductForm');
const prodName          = document.getElementById('prodName');
const prodCat           = document.getElementById('prodCat');
const prodPrice         = document.getElementById('prodPrice');
const prodStock         = document.getElementById('prodStock');
const prodDesc          = document.getElementById('prodDesc');
const prodMedia         = document.getElementById('prodMedia');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const mediaPreview      = document.getElementById('mediaPreview');
const formFeedback      = document.getElementById('formFeedback');
const resetFormBtn      = document.getElementById('resetFormBtn');
const searchInput       = document.getElementById('searchInput');
const filterCat         = document.getElementById('filterCat');
const tableBody         = document.getElementById('productsTableBody');
const emptyMsg          = document.getElementById('emptyMsg');
const deleteModal       = document.getElementById('deleteModal');
const confirmDelete     = document.getElementById('confirmDelete');
const cancelDelete      = document.getElementById('cancelDelete');

// ===== SESSION =====
function checkSession() {
  if (sessionStorage.getItem(SESSION_KEY) === 'true') showDashboard();
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display   = 'flex';
  loadProductCount();
  loadOrdersBadge();
  renderTable();
}

// ===== LOGIN =====
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (loginUser.value.trim() === ADMIN_USER && loginPass.value === ADMIN_PASS) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    loginError.textContent = '';
    showDashboard();
  } else {
    loginError.textContent = 'Invalid username or password.';
    loginPass.value = '';
  }
});

togglePass.addEventListener('click', () => {
  const isPass       = loginPass.type === 'password';
  loginPass.type     = isPass ? 'text' : 'password';
  togglePass.textContent = isPass ? '🙈' : '👁';
});

logoutBtn.addEventListener('click', () => {
  sessionStorage.removeItem(SESSION_KEY);
  dashboard.style.display   = 'none';
  loginScreen.style.display = 'flex';
  loginForm.reset();
});

// ===== PANEL NAV =====
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const panel = item.dataset.panel;
    addPanel.style.display    = panel === 'addProduct'     ? 'block' : 'none';
    managePanel.style.display = panel === 'manageProducts' ? 'block' : 'none';
    ordersPanel.style.display = panel === 'currentOrders'  ? 'block' : 'none';
    const titles = { addProduct: 'Add New Product', manageProducts: 'Manage Products', currentOrders: 'Current Orders' };
    panelTitle.textContent = titles[panel] || '';
    if (panel === 'manageProducts') renderTable();
    if (panel === 'currentOrders')  renderOrders();
  });
});

// ===== PRODUCT COUNT =====
async function loadProductCount() {
  const { count } = await supabaseClient
    .from('products')
    .select('*', { count: 'exact', head: true });
  const c = count || 0;
  productCount.textContent = c + ' Product' + (c !== 1 ? 's' : '');
}

// ===== ORDERS BADGE =====
async function loadOrdersBadge() {
  const { count } = await supabaseClient
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  const badge = document.getElementById('ordersBadge');
  if (count > 0) {
    badge.textContent    = count;
    badge.style.display  = 'inline-flex';
  } else {
    badge.style.display  = 'none';
  }
}

// ===== RENDER ORDERS =====
async function renderOrders() {
  const container = document.getElementById('ordersContainer');
  const emptyEl   = document.getElementById('ordersEmptyMsg');
  const summaryEl = document.getElementById('ordersSummary');
  container.innerHTML = '<p style="padding:20px;color:#888;">Loading...</p>';
  emptyEl.style.display = 'none';

  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<p style="color:red;padding:20px;">${error.message}</p>`;
    return;
  }

  if (!orders || orders.length === 0) {
    container.innerHTML   = '';
    emptyEl.style.display = 'block';
    summaryEl.textContent = '0 pending orders';
    loadOrdersBadge();
    return;
  }

  summaryEl.textContent = `${orders.length} pending order${orders.length !== 1 ? 's' : ''}`;
  loadOrdersBadge();

  container.innerHTML = orders.map(order => {
    let items = [];
    try { items = JSON.parse(order.items || '[]'); } catch(_) {}
    const itemsHTML = items.map(i =>
      `<li><strong>${i.name}</strong> &times;${i.qty} &mdash; PKR ${(i.price * i.qty).toLocaleString()}</li>`
    ).join('');
    const date = new Date(order.created_at).toLocaleString('en-PK', {
      dateStyle: 'medium', timeStyle: 'short'
    });
    return `
      <div class="order-card" data-id="${order.id}">
        <div class="order-card-header">
          <div class="order-meta">
            <span class="order-badge pending">Pending</span>
            <span class="order-date">${date}</span>
          </div>
          <button class="btn-mark-done" data-id="${order.id}">&#10003; Mark as Done</button>
        </div>
        <div class="order-body">
          <div class="order-customer">
            <p><strong>&#128100; ${order.customer_name}</strong></p>
            <p>&#128222; ${order.customer_phone}</p>
            <p>&#128205; ${order.delivery_address}</p>
          </div>
          <div class="order-items">
            <p class="order-items-title">Items Ordered:</p>
            <ul>${itemsHTML}</ul>
          </div>
        </div>
        <div class="order-card-footer">
          <strong>Total: PKR ${(order.total || 0).toLocaleString()}</strong>
        </div>
      </div>
    `;
  }).join('');

  // Mark as done
  container.querySelectorAll('.btn-mark-done').forEach(btn => {
    btn.addEventListener('click', () => markOrderDone(btn.dataset.id));
  });
}

async function markOrderDone(orderId) {
  const btn = document.querySelector(`.btn-mark-done[data-id="${orderId}"]`);
  if (btn) { btn.disabled = true; btn.textContent = 'Processing...'; }

  // Fetch the order
  const { data: order, error: fetchErr } = await supabaseClient
    .from('orders').select('*').eq('id', orderId).single();
  if (fetchErr) { alert('Error: ' + fetchErr.message); return; }

  // Archive to completed_orders
  await supabaseClient.from('completed_orders').insert({
    original_id:      order.id,
    customer_name:    order.customer_name,
    customer_phone:   order.customer_phone,
    delivery_address: order.delivery_address,
    items:            order.items,
    total:            order.total,
  });

  // Delete from orders
  await supabaseClient.from('orders').delete().eq('id', orderId);

  // Animate removal and re-render
  const card = document.querySelector(`.order-card[data-id="${orderId}"]`);
  if (card) {
    card.style.transition = 'opacity 0.3s, transform 0.3s';
    card.style.opacity    = '0';
    card.style.transform  = 'translateX(40px)';
    setTimeout(() => renderOrders(), 350);
  } else {
    renderOrders();
  }
}

document.getElementById('refreshOrdersBtn').addEventListener('click', renderOrders);

// ===== MEDIA PREVIEW =====
let selectedFile = null;

prodMedia.addEventListener('change', () => {
  const file = prodMedia.files[0];
  if (!file) return;
  if (file.size > 50 * 1024 * 1024) {
    alert('File too large. Max 50MB.');
    prodMedia.value = '';
    return;
  }
  selectedFile = file;
  const url  = URL.createObjectURL(file);
  const type = file.type.startsWith('video') ? 'video' : 'image';

  uploadPlaceholder.style.display = 'none';
  mediaPreview.style.display      = 'flex';
  mediaPreview.innerHTML          = '';

  const label = document.createElement('span');
  label.classList.add('media-preview-label');
  label.textContent = type === 'video' ? '🎬 Video' : '🖼 Image';

  if (type === 'image') {
    const img = document.createElement('img');
    img.src = url;
    mediaPreview.appendChild(img);
  } else {
    const vid = document.createElement('video');
    vid.src = url; vid.controls = true; vid.muted = true;
    mediaPreview.appendChild(vid);
  }
  mediaPreview.appendChild(label);
});

resetFormBtn.addEventListener('click', () => {
  selectedFile                    = null;
  uploadPlaceholder.style.display = 'block';
  mediaPreview.style.display      = 'none';
  mediaPreview.innerHTML          = '';
  formFeedback.textContent        = '';
});

// ===== ADMIN FORM — real-time input guards =====
// Price + Stock: digits only, no letters
prodPrice.addEventListener('input', function() {
  this.value = this.value.replace(/[^0-9]/g, '');
});
prodStock.addEventListener('input', function() {
  this.value = this.value.replace(/[^0-9]/g, '');
});
// Product name: block digits
prodName.addEventListener('input', function() {
  if (/[0-9]/.test(this.value)) {
    this.value = this.value.replace(/[0-9]/g, '');
  }
});

// ===== ADD PRODUCT =====
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // ----- Validation -----
  let formValid = true;
  function fieldErr(el, msg) {
    if (msg) {
      el.style.borderColor = '#e53935';
      el.title = msg;
      el.setAttribute('placeholder', msg);
      formValid = false;
    } else {
      el.style.borderColor = '';
      el.title = '';
    }
  }

  fieldErr(prodName,  !prodName.value.trim()  ? 'Product name is required.' : '');
  fieldErr(prodCat,   !prodCat.value          ? 'Please select a category.' : '');

  const priceVal = parseInt(prodPrice.value);
  fieldErr(prodPrice,
    !prodPrice.value.trim()       ? 'Price is required.' :
    isNaN(priceVal) || priceVal < 1 ? 'Enter a valid price (numbers only, min 1).' : '');

  const stockVal = parseInt(prodStock.value);
  fieldErr(prodStock,
    prodStock.value.trim() === '' ? 'Stock quantity is required.' :
    isNaN(stockVal) || stockVal < 0 ? 'Enter a valid stock quantity (0 or more).' : '');

  fieldErr(prodDesc, !prodDesc.value.trim() ? 'Description is required.' : '');

  if (!selectedFile) {
    formFeedback.style.color = '#e53935';
    formFeedback.textContent = 'Please upload a product image or video.';
    formValid = false;
  }

  if (!formValid) {
    if (selectedFile) {
      formFeedback.style.color = '#e53935';
      formFeedback.textContent = 'Please fix the highlighted fields.';
    }
    return;
  }
  // ----- End Validation -----

  const submitBtn       = addForm.querySelector('button[type="submit"]');
  submitBtn.disabled    = true;
  submitBtn.textContent = 'Uploading...';
  formFeedback.style.color = '#2e7d32';
  formFeedback.textContent = 'Uploading media...';

  try {
    // 1. Upload to Supabase Storage
    const fileExt     = selectedFile.name.split('.').pop();
    const filePath    = `products/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabaseClient.storage
      .from(BUCKET)
      .upload(filePath, selectedFile, { upsert: false });

    if (uploadError) throw uploadError;

    // 2. Get public URL
    const { data: urlData } = supabaseClient.storage
      .from(BUCKET)
      .getPublicUrl(filePath);
    const mediaURL  = urlData.publicUrl;
    const mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';

    formFeedback.textContent = 'Saving product...';

    // 3. Insert into Supabase DB
    const stockQty = parseInt(prodStock.value);
    if (isNaN(stockQty) || stockQty < 0) throw new Error('Invalid stock quantity.');
    const { error: insertError } = await supabaseClient
      .from('products')
      .insert({
        name:         prodName.value.trim(),
        category:     prodCat.value,
        price:        parseInt(prodPrice.value),
        stock:        stockQty,
        description:  prodDesc.value.trim(),
        media_url:    mediaURL,
        media_type:   mediaType,
        storage_path: filePath,
      });

    if (insertError) throw insertError;

    formFeedback.textContent = `"${prodName.value.trim()}" added successfully!`;
    addForm.reset();
    selectedFile                    = null;
    uploadPlaceholder.style.display = 'block';
    mediaPreview.style.display      = 'none';
    mediaPreview.innerHTML          = '';
    loadProductCount();
    setTimeout(() => { formFeedback.textContent = ''; }, 3500);

  } catch (err) {
    formFeedback.style.color = '#e53935';
    formFeedback.textContent = 'Error: ' + err.message;
  } finally {
    submitBtn.disabled    = false;
    submitBtn.textContent = '+ Add Product';
  }
});

// ===== RENDER TABLE =====
const catLabels = {
  clothing:  'Clothing & Accessories',
  cosmetics: 'Cosmetics & Beauty',
  toys:      'Toys & Games',
};

async function renderTable(filterText = '', filterCategory = 'all') {
  tableBody.innerHTML    = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#888;">Loading...</td></tr>';
  emptyMsg.style.display = 'none';

  let query = supabaseClient.from('products').select('*').order('created_at', { ascending: false });
  if (filterCategory !== 'all') query = query.eq('category', filterCategory);
  if (filterText)                query = query.ilike('name', `%${filterText}%`);

  const { data: products, error } = await query;

  if (error) {
    tableBody.innerHTML = `<tr><td colspan="6" style="color:red;padding:20px;">${error.message}</td></tr>`;
    return;
  }

  if (!products || products.length === 0) {
    tableBody.innerHTML    = '';
    emptyMsg.style.display = 'block';
    return;
  }

  tableBody.innerHTML = products.map(p => {
    const stock     = parseInt(p.stock) || 0;
    const stockClass = stock === 0 ? 'stock-out' : stock <= 5 ? 'stock-low' : 'stock-in';
    const mediaEl    = p.media_type === 'video'
      ? `<video class="thumb-video" src="${p.media_url}" muted></video>`
      : `<img class="thumb" src="${p.media_url}" alt="${p.name}" />`;

    return `
      <tr>
        <td>${mediaEl}</td>
        <td><strong>${p.name}</strong><br/><span style="font-size:0.78rem;color:#888;">${(p.description||'').substring(0,50)}${(p.description||'').length>50?'…':''}</span></td>
        <td><span class="cat-chip ${p.category}">${catLabels[p.category] || p.category}</span></td>
        <td><strong>PKR ${p.price.toLocaleString()}</strong></td>
        <td>
          <div class="stock-edit-wrap">
            <input type="number" class="stock-number-input ${stockClass}" data-id="${p.id}" value="${stock}" min="0" style="width:72px;" />
            <span class="stock-label ${stockClass}">${stock === 0 ? 'Out of Stock' : stock <= 5 ? 'Low' : 'In Stock'}</span>
          </div>
        </td>
        <td><button class="btn-delete" data-id="${p.id}" data-path="${p.storage_path||''}">Delete</button></td>
      </tr>
    `;
  }).join('');
}

// Search & filter
searchInput.addEventListener('input',  () => renderTable(searchInput.value, filterCat.value));
filterCat.addEventListener('change',   () => renderTable(searchInput.value, filterCat.value));

// ===== STOCK CHANGE =====
tableBody.addEventListener('change', async (e) => {
  if (e.target.classList.contains('stock-number-input')) {
    const id       = e.target.dataset.id;
    const newStock = Math.max(0, parseInt(e.target.value) || 0);
    e.target.value = newStock;
    await supabaseClient.from('products').update({ stock: newStock }).eq('id', id);
    // Update label and color
    const label = e.target.nextElementSibling;
    const cls   = newStock === 0 ? 'stock-out' : newStock <= 5 ? 'stock-low' : 'stock-in';
    e.target.className = `stock-number-input ${cls}`;
    label.className    = `stock-label ${cls}`;
    label.textContent  = newStock === 0 ? 'Out of Stock' : newStock <= 5 ? 'Low' : 'In Stock';
  }
});

// ===== DELETE =====
let deleteTargetId   = null;
let deleteTargetPath = null;

tableBody.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-delete')) {
    deleteTargetId   = e.target.dataset.id;
    deleteTargetPath = e.target.dataset.path;
    deleteModal.style.display = 'flex';
  }
});

confirmDelete.addEventListener('click', async () => {
  if (!deleteTargetId) return;
  try {
    await supabaseClient.from('products').delete().eq('id', deleteTargetId);
    if (deleteTargetPath) {
      await supabaseClient.storage.from(BUCKET).remove([deleteTargetPath]);
    }
    loadProductCount();
    renderTable(searchInput.value, filterCat.value);
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
  deleteTargetId          = null;
  deleteTargetPath        = null;
  deleteModal.style.display = 'none';
});

cancelDelete.addEventListener('click', () => {
  deleteTargetId          = null;
  deleteTargetPath        = null;
  deleteModal.style.display = 'none';
});

deleteModal.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    deleteTargetId          = null;
    deleteTargetPath        = null;
    deleteModal.style.display = 'none';
  }
});

// ===== INIT =====
checkSession();
