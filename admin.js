/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                   RISHA — admin.js                          ║
 * ║        لوحة تحكم الإدارة: المنتجات، الطلبات، الزبائن       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/* ══════════════════════════════════════════════════
   ─── القسم الأول: إعدادات Firebase ───
   ══════════════════════════════════════════════════ */
const firebaseConfig = {
  databaseURL: "https://risha-2c8ab-default-rtdb.firebaseio.com/"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();


/* ══════════════════════════════════════════════════
   ─── القسم الثاني: بيانات الأدمن الثابتة ───
   ══════════════════════════════════════════════════ */
const ADMIN_CREDS = {
  username: 'Mzmoh2667',
  password: 'Mzmoh-2667-411'
};


/* ══════════════════════════════════════════════════
   ─── القسم الثالث: مفاتيح قاعدة البيانات ───
   ══════════════════════════════════════════════════ */
const DB = {
  PRODUCTS:     'risha_products',
  ORDERS:       'risha_orders',
  USERS:        'risha_users',
  ADMINSESSION: 'risha_admin_session',
};


/* ══════════════════════════════════════════════════
   ─── القسم الرابع: تسجيل الدخول والخروج ───
   ══════════════════════════════════════════════════ */

/**
 * معالجة تسجيل دخول الأدمن
 * ✅ مُصلَّح: ربط الحدث يتم هنا فقط (لا تكرار في DOMContentLoaded)
 */
function adminLogin(e) {
  e.preventDefault();

  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value;

  if (user !== ADMIN_CREDS.username || pass !== ADMIN_CREDS.password) {
    const err = document.getElementById('admin-login-error');
    if (err) {
      err.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
      err.classList.add('show');
    }
    return;
  }

  localStorage.setItem(DB.ADMINSESSION, '1');
  document.getElementById('admin-login-screen')?.classList.add('hidden');
  document.getElementById('admin-dashboard')?.classList.remove('hidden');
  initDashboard();
}

function adminLogout() {
  localStorage.removeItem(DB.ADMINSESSION);
  location.reload();
}


/* ══════════════════════════════════════════════════
   ─── القسم الخامس: قراءة وكتابة البيانات ───
   ══════════════════════════════════════════════════ */
function getOrders()   { return JSON.parse(localStorage.getItem(DB.ORDERS)   || '[]'); }
function getUsers()    { return JSON.parse(localStorage.getItem(DB.USERS)    || '[]'); }
function getProducts() { return JSON.parse(localStorage.getItem(DB.PRODUCTS) || '[]'); }
function saveOrders(o)   { localStorage.setItem(DB.ORDERS,   JSON.stringify(o)); }
function saveProducts(p) { localStorage.setItem(DB.PRODUCTS, JSON.stringify(p)); }
function saveUsers(u)    { localStorage.setItem(DB.USERS,    JSON.stringify(u)); }


/* ══════════════════════════════════════════════════
   ─── القسم السادس: التنقل بين أقسام لوحة التحكم ───
   ══════════════════════════════════════════════════ */
function showPanel(panelId) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`panel-${panelId}`)?.classList.add('active');
  document.querySelector(`[data-panel="${panelId}"]`)?.classList.add('active');

  const titles = {
    overview:  { title: 'نظرة عامة',     sub: 'إحصائيات ومؤشرات المتجر' },
    orders:    { title: 'إدارة الطلبات', sub: 'كل الطلبات الواردة من المتجر' },
    customers: { title: 'إدارة الزبائن', sub: 'عرض وتعديل وحذف حسابات الزبائن' },
    products:  { title: 'إدارة المنتجات',sub: 'إضافة، تعديل وحذف الريش المعروضة' },
  };

  if (titles[panelId]) {
    document.getElementById('admin-page-title').textContent = titles[panelId].title;
    document.getElementById('admin-page-sub').textContent   = titles[panelId].sub;
  }

  const loaders = {
    overview:  renderOverview,
    orders:    renderOrders,
    customers: renderCustomers,
    products:  renderAdminProducts,
  };
  loaders[panelId]?.();
}


/* ══════════════════════════════════════════════════
   ─── القسم السابع: لوح النظرة العامة ───
   ══════════════════════════════════════════════════ */
function renderOverview() {
  const orders   = getOrders();
  const users    = getUsers();
  const products = getProducts();

  const totalRevenue = orders
    .filter(o => o.status !== 'ملغي')
    .reduce((s, o) => s + (o.total || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'قيد المعالجة').length;

  setText('stat-orders',    orders.length);
  setText('stat-customers', users.length);
  setText('stat-products',  products.length);
  setText('stat-revenue',   totalRevenue.toLocaleString('ar-IQ') + ' د.ع');
  setText('stat-pending',   pendingOrders);

  renderRecentOrders(orders.slice(0, 5));
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-tbody');
  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:rgba(245,240,232,0.3); padding:2rem;">لا توجد طلبات بعد</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><span style="font-family:var(--font-display);font-size:0.72rem;color:var(--gold)">${o.id}</span></td>
      <td>${o.userName || '—'}</td>
      <td>${(o.items || []).map(i => i.name).join('، ')}</td>
      <td style="color:var(--gold); font-weight:700">${(o.total || 0).toLocaleString('ar-IQ')} د.ع</td>
      <td>${getStatusBadge(o.status)}</td>
    </tr>
  `).join('');
}


/* ══════════════════════════════════════════════════
   ─── القسم الثامن: لوح إدارة الطلبات ───
   ══════════════════════════════════════════════════ */
function renderOrders(filterStatus = '') {
  let orders = getOrders();

  if (filterStatus) {
    orders = orders.filter(o => o.status === filterStatus);
  }

  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:rgba(245,240,232,0.3); padding:2rem;">لا توجد طلبات</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><span style="font-family:var(--font-display);font-size:0.72rem;color:var(--gold)">${o.id}</span></td>
      <td>
        <div style="font-size:0.9rem;">${o.userName || '—'}</div>
        <div style="font-size:0.75rem; color:rgba(245,240,232,0.4)">${o.userPhone || o.phone || ''}</div>
      </td>
      <td style="max-width:200px; font-size:0.82rem;">${(o.items || []).map(i => `${i.name} ×${i.qty}`).join('<br/>')}</td>
      <td style="color:var(--gold); font-weight:700">${(o.total || 0).toLocaleString('ar-IQ')} د.ع</td>
      <td>${o.userCity || o.address || '—'}</td>
      <td>${getStatusBadge(o.status)}</td>
      <td>
        <select class="form-select btn-sm"
                style="padding:0.35rem 0.7rem; font-size:0.78rem; min-width:140px;"
                onchange="updateOrderStatus('${o.id}', this.value)">
          ${getStatusOptions(o.status)}
        </select>
      </td>
    </tr>
  `).join('');
}

function getStatusOptions(current) {
  const statuses = ['قيد المعالجة','تم التأكيد','جاري التوصيل','تم التوصيل','ملغي'];
  return statuses.map(s =>
    `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`
  ).join('');
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const order  = orders.find(o => o.id === orderId);
  if (!order) return;

  order.status = newStatus;
  saveOrders(orders);

  /* تحديث Firebase أيضاً */
  database.ref('orders/' + orderId).update({ status: newStatus }).catch(() => {});

  adminToast(`تم تحديث حالة الطلب إلى: ${newStatus}`, 'green');
}

function filterOrders() {
  const val = document.getElementById('order-filter').value;
  renderOrders(val);
}


/* ══════════════════════════════════════════════════
   ─── القسم التاسع: لوح إدارة الزبائن ───
   ══════════════════════════════════════════════════ */
function renderCustomers() {
  const users  = getUsers();
  const orders = getOrders();
  const tbody  = document.getElementById('customers-tbody');
  if (!tbody) return;

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:rgba(245,240,232,0.3); padding:2rem;">لا يوجد زبائن مسجلون بعد</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const userOrders = orders.filter(o => o.userId === u.id);
    const totalSpent = userOrders
      .filter(o => o.status !== 'ملغي')
      .reduce((s, o) => s + (o.total || 0), 0);

    const maskedPass = u.password
      ? u.password.substring(0, 2) + '••••' + u.password.slice(-1)
      : '—';

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:0.7rem;">
            <div style="width:36px;height:36px;border-radius:50%;
                        background:linear-gradient(135deg,var(--gold-dark),var(--gold));
                        display:flex;align-items:center;justify-content:center;
                        font-weight:700;font-size:0.9rem;color:var(--black);flex-shrink:0;">
              ${u.fullName?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style="font-size:0.9rem;">${u.fullName}</div>
              <div style="font-size:0.72rem;color:rgba(245,240,232,0.35);">${u.id}</div>
            </div>
          </div>
        </td>
        <td style="font-size:0.85rem; color:var(--white-dim); direction:ltr; text-align:right;">
          ${u.phone || u.contact || '—'}
        </td>
        <td>${u.city || '—'}</td>
        <td style="font-family:monospace; font-size:0.82rem; color:rgba(245,240,232,0.5);">
          <span title="اضغط لعرض" style="cursor:pointer;"
                onclick="togglePassword(this, '${u.password}')">
            ${maskedPass}
          </span>
        </td>
        <td style="text-align:center;">
          <button class="btn btn-outline btn-sm" onclick="showCustomerOrders('${u.id}')">
            ${userOrders.length} طلب
          </button>
        </td>
        <td style="color:var(--gold); font-weight:700; text-align:center;">
          ${totalSpent.toLocaleString('ar-IQ')} د.ع
        </td>
        <td>
          <div style="display:flex; gap:0.4rem; align-items:center; justify-content:center;">
            <button class="btn btn-outline btn-sm"
                    style="font-size:0.75rem; padding:0.3rem 0.6rem;"
                    onclick="openEditCustomerModal('${u.id}')">
              ✎ تعديل
            </button>
            <button class="btn btn-sm"
                    style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);
                           color:#f87171;font-size:0.75rem;padding:0.3rem 0.6rem;"
                    onclick="deleteCustomer('${u.id}')">
              ✕ حذف
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function togglePassword(el, password) {
  if (el.dataset.shown === 'true') {
    el.textContent = password.substring(0, 2) + '••••' + password.slice(-1);
    el.dataset.shown = 'false';
  } else {
    el.textContent = password;
    el.dataset.shown = 'true';
  }
}

function deleteCustomer(userId) {
  if (!confirm('هل أنت متأكد من حذف هذا الزبون؟')) return;

  let users = getUsers();
  users = users.filter(u => u.id !== userId);
  saveUsers(users);

  database.ref('users/' + userId).remove().catch(() => {});

  adminToast('تم حذف حساب الزبون بنجاح', 'green');
  renderCustomers();
}

function openEditCustomerModal(userId) {
  const users = getUsers();
  const user  = users.find(u => u.id === userId);
  if (!user) return;

  document.getElementById('edit-cust-id').value       = user.id;
  document.getElementById('edit-cust-name').value     = user.fullName || '';
  document.getElementById('edit-cust-phone').value    = user.phone || user.contact || '';
  document.getElementById('edit-cust-password').value = user.password || '';

  populateAdminCitySelect('edit-cust-city', user.city);
  openAdminModal('edit-customer-modal');
}

function populateAdminCitySelect(selectId, currentCity) {
  const cities = [
    'بغداد','البصرة','الموصل','أربيل','كركوك','النجف',
    'كربلاء','الحلة','الناصرية','العمارة','الديوانية',
    'السماوة','الرمادي','تكريت','الفلوجة','سامراء',
    'بعقوبة','الكوت','دهوك','السليمانية'
  ];
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">— اختر المدينة —</option>';
  cities.forEach(c => {
    sel.innerHTML += `<option value="${c}" ${c === currentCity ? 'selected' : ''}>${c}</option>`;
  });
}

function handleEditCustomer(e) {
  e.preventDefault();

  const userId   = document.getElementById('edit-cust-id').value;
  const fullName = document.getElementById('edit-cust-name').value.trim();
  const phone    = document.getElementById('edit-cust-phone').value.trim();
  const city     = document.getElementById('edit-cust-city').value;
  const password = document.getElementById('edit-cust-password').value;

  if (!fullName) {
    adminToast('اسم الزبون لا يمكن أن يكون فارغاً', 'red');
    return;
  }
  if (!phone || !/^07[3-9]\d{8}$/.test(phone)) {
    adminToast('رقم الهاتف غير صحيح — يجب أن يبدأ بـ 07 ويحتوي 11 رقماً', 'red');
    return;
  }
  if (!password || password.length < 6) {
    adminToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'red');
    return;
  }

  const users = getUsers();
  const idx   = users.findIndex(u => u.id === userId);
  if (idx === -1) {
    adminToast('لم يتم العثور على الزبون', 'red');
    return;
  }

  users[idx] = { ...users[idx], fullName, phone, contact: phone, city, password };
  saveUsers(users);

  database.ref('users/' + userId).update({ fullName, phone, city }).catch(() => {});

  closeAdminModal('edit-customer-modal');
  adminToast('تم تحديث بيانات الزبون بنجاح ✓', 'green');
  renderCustomers();
}

function showCustomerOrders(userId) {
  const users  = getUsers();
  const orders = getOrders();
  const user   = users.find(u => u.id === userId);
  if (!user) return;

  const userOrders = orders.filter(o => o.userId === userId);
  const modal      = document.getElementById('customer-modal');
  if (!modal) return;

  document.getElementById('modal-customer-name').textContent = user.fullName;

  const totalSpent = userOrders
    .filter(o => o.status !== 'ملغي')
    .reduce((s, o) => s + (o.total || 0), 0);

  const statsEl = document.getElementById('modal-customer-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div style="display:flex; gap:1.5rem; flex-wrap:wrap; margin-bottom:1rem;">
        <div class="stat-card" style="flex:1; min-width:120px; padding:1rem;">
          <div class="stat-value" style="font-size:1.5rem;">${userOrders.length}</div>
          <div class="stat-label">إجمالي الطلبات</div>
        </div>
        <div class="stat-card" style="flex:1; min-width:120px; padding:1rem;">
          <div class="stat-value" style="font-size:1.3rem;">${totalSpent.toLocaleString('ar-IQ')}</div>
          <div class="stat-label">إجمالي الإنفاق (د.ع)</div>
        </div>
        <div class="stat-card" style="flex:1; min-width:120px; padding:1rem;">
          <div class="stat-value" style="font-size:1.3rem;">${user.city || '—'}</div>
          <div class="stat-label">المدينة</div>
        </div>
      </div>
    `;
  }

  const listEl = document.getElementById('modal-customer-orders');
  if (listEl) {
    if (!userOrders.length) {
      listEl.innerHTML = `<p style="color:rgba(245,240,232,0.3); text-align:center; padding:2rem;">لا توجد طلبات</p>`;
    } else {
      listEl.innerHTML = userOrders.map(o => `
        <div class="order-card">
          <div class="order-id"># ${o.id}</div>
          <div class="order-product">
            ${(o.items || []).map(i => `${i.name} × ${i.qty}`).join('، ')}
          </div>
          <div class="order-meta">
            <span>💰 ${(o.total || 0).toLocaleString('ar-IQ')} د.ع</span>
            <span>📅 ${new Date(o.placedAt).toLocaleDateString('ar-IQ')}</span>
            ${o.notes ? `<span>📝 ${o.notes}</span>` : ''}
            ${getStatusBadge(o.status)}
          </div>
        </div>
      `).join('');
    }
  }

  modal.classList.add('open');
}


/* ══════════════════════════════════════════════════
   ─── القسم العاشر: لوح إدارة المنتجات ───
   ══════════════════════════════════════════════════ */
function renderAdminProducts() {
  /* تحميل المنتجات من Firebase أولاً ثم localStorage كاحتياطي */
  database.ref('products').once('value').then(snapshot => {
    const products = [];
    snapshot.forEach(child => products.push(child.val()));

    if (products.length) {
      saveProducts(products); // تزامن مع localStorage
    }

    _drawProductsTable(products.length ? products : getProducts());
  }).catch(() => {
    _drawProductsTable(getProducts());
  });
}

function _drawProductsTable(products) {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  if (!products.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:rgba(245,240,232,0.3); padding:2rem;">لا توجد منتجات</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <img src="${p.image}" alt="${p.name}"
             style="width:52px;height:52px;border-radius:8px;object-fit:cover;border:1px solid var(--border);"
             onerror="this.style.opacity='0.3'; this.src='https://placehold.co/52x52/1a1a1a/c9a84c?text=R'"/>
      </td>
      <td style="font-family:var(--font-elegant); font-size:1rem;">${p.name}</td>
      <td style="color:var(--gold); font-weight:700">${Number(p.price).toLocaleString('ar-IQ')} د.ع</td>
      <td><span class="badge badge-gold">${p.tag || '—'}</span></td>
      <td>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <button class="btn btn-outline btn-sm" onclick="editProduct('${p.id}')">✎ تعديل</button>
          <button class="btn btn-sm"
                  style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#f87171;"
                  onclick="deleteProduct('${p.id}')">✕ حذف</button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * معالجة إضافة / تعديل منتج
 * ✅ مُصلَّح: يقرأ الصورة من حقل prod-image المخفي (يحتوي data URL أو URL)
 */
function handleAddProduct(e) {
  e.preventDefault();

  const name  = document.getElementById('prod-name').value.trim();
  const price = parseInt(document.getElementById('prod-price').value);
  const image = document.getElementById('prod-image').value.trim(); // ✅ حقل مخفي موحّد
  const desc  = document.getElementById('prod-desc').value.trim();
  const tag   = document.getElementById('prod-tag').value.trim();

  if (!name || !price) {
    adminToast('يرجى تعبئة الحقول المطلوبة (الاسم، السعر)', 'red');
    return;
  }

  if (!image) {
    adminToast('يرجى اختيار صورة للمنتج (رفع ملف أو رابط URL)', 'red');
    return;
  }

  const editId = document.getElementById('prod-edit-id').value;

  if (editId) {
    /* ── تعديل منتج موجود ── */
    /* إذا كانت الصورة data URL (ملف مرفوع) نحفظها مباشرة في localStorage
       وفي Firebase نضع إشارة لأن Firebase لا يدعم data URLs الكبيرة */
    const fbImage = image.startsWith('data:') ? '[uploaded-locally]' : image;

    database.ref('products/' + editId).update({ name, price, image: fbImage, desc, tag })
      .catch(() => {/* تجاهل أخطاء Firebase للصور المرفوعة محلياً */});

    const products = getProducts();
    const idx = products.findIndex(p => p.id === editId);
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, price, image, desc, tag };
      saveProducts(products);
    }

    document.getElementById('prod-edit-id').value = '';
    document.getElementById('prod-form-title').textContent = '+ إضافة منتج جديد';
    adminToast('تم تحديث المنتج بنجاح ✓', 'green');
    e.target.reset();
    _clearImagePreviews();
    _drawProductsTable(getProducts());

  } else {
    /* ── إضافة منتج جديد ── */
    const newProduct = {
      id: 'prd-' + Date.now(),
      name, price, image, desc, tag
    };

    /* حفظ في localStorage دائماً */
    const products = getProducts();
    products.push(newProduct);
    saveProducts(products);

    /* محاولة حفظ في Firebase (بدون data URL لأنه كبير جداً) */
    const fbProduct = { ...newProduct };
    if (fbProduct.image.startsWith('data:')) {
      fbProduct.image = '[uploaded-locally]';
    }
    database.ref('products/' + newProduct.id).set(fbProduct).catch(() => {});

    adminToast('تمت إضافة المنتج بنجاح ✓', 'green');
    e.target.reset();
    _clearImagePreviews();
    _drawProductsTable(getProducts());
  }
}

/* تصفير معاينات الصورة بعد الإضافة */
function _clearImagePreviews() {
  document.getElementById('prod-image').value = '';
  const p1 = document.getElementById('prod-image-preview');
  const p2 = document.getElementById('prod-image-url-preview');
  if (p1) p1.style.display = 'none';
  if (p2) p2.style.display = 'none';
  const fn = document.getElementById('upload-filename');
  if (fn) fn.textContent = '';
  const fileInput = document.getElementById('prod-image-file');
  if (fileInput) fileInput.value = '';
  const urlInput = document.getElementById('prod-image-url');
  if (urlInput) urlInput.value = '';
}

function editProduct(productId) {
  const products = getProducts();
  const p        = products.find(pr => pr.id === productId);
  if (!p) return;

  document.getElementById('prod-name').value    = p.name;
  document.getElementById('prod-price').value   = p.price;
  document.getElementById('prod-desc').value    = p.desc  || '';
  document.getElementById('prod-tag').value     = p.tag   || '';
  document.getElementById('prod-edit-id').value = p.id;
  document.getElementById('prod-form-title').textContent = '✎ تعديل المنتج';

  /* عرض الصورة الحالية */
  document.getElementById('prod-image').value = p.image;
  if (!p.image.startsWith('data:') && p.image !== '[uploaded-locally]') {
    /* صورة URL — أظهر في لوح URL */
    if (typeof switchImageTab === 'function') switchImageTab('url');
    const urlInput = document.getElementById('prod-image-url');
    if (urlInput) urlInput.value = p.image;
    if (typeof previewImageUrl === 'function') previewImageUrl(p.image);
  } else if (p.image.startsWith('data:')) {
    /* صورة مرفوعة — أظهر المعاينة */
    const preview = document.getElementById('prod-image-preview');
    if (preview) {
      preview.src = p.image;
      preview.style.display = 'block';
    }
  }

  document.getElementById('prod-name').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function deleteProduct(productId) {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

  let products = getProducts();
  products     = products.filter(p => p.id !== productId);
  saveProducts(products);

  database.ref('products/' + productId).remove().catch(() => {});

  _drawProductsTable(products);
  adminToast('تم حذف المنتج بنجاح', 'gold');
}


/* ══════════════════════════════════════════════════
   ─── القسم الحادي عشر: الأدوات المساعدة ───
   ══════════════════════════════════════════════════ */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function getStatusBadge(status) {
  const map = {
    'قيد المعالجة': 'badge-orange',
    'تم التوصيل':   'badge-green',
    'جاري التوصيل': 'badge-blue',
    'ملغي':         'badge-red',
    'تم التأكيد':   'badge-gold',
  };
  return `<span class="badge ${map[status] || 'badge-gold'}">${status}</span>`;
}

function adminToast(msg, type = 'gold') {
  const container = document.getElementById('admin-toast');
  if (!container) return;

  const icons = { gold: '✦', green: '✓', red: '✕' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || '•'}</span><span>${msg}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 350);
  }, 3500);
}

function openAdminModal(id)  { document.getElementById(id)?.classList.add('open'); }
function closeAdminModal(id) { document.getElementById(id)?.classList.remove('open'); }


/* ══════════════════════════════════════════════════
   ─── القسم الثاني عشر: التهيئة الأولية ───
   ══════════════════════════════════════════════════ */
function initDashboard() {
  showPanel('overview');

  document.getElementById('product-form')?.addEventListener('submit', handleAddProduct);
  document.getElementById('edit-customer-form')?.addEventListener('submit', handleEditCustomer);
  document.getElementById('order-filter')?.addEventListener('change', filterOrders);
}

document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem(DB.ADMINSESSION);

  if (isLoggedIn) {
    document.getElementById('admin-login-screen')?.classList.add('hidden');
    document.getElementById('admin-dashboard')?.classList.remove('hidden');
    initDashboard();
  } else {
    /* ✅ ربط حدث الإرسال بشكل صحيح */
    document.getElementById('admin-login-form')?.addEventListener('submit', adminLogin);
  }

  document.getElementById('admin-logout-btn')?.addEventListener('click', adminLogout);

  const y = document.getElementById('admin-year');
  if (y) y.textContent = new Date().getFullYear();
});
