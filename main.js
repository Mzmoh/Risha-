/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                   RISHA — main.js                           ║
 * ║     منطق المتجر: المنتجات، السلة، الطلبات، الواجهة          ║
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

const db = firebase.database();


/* ══════════════════════════════════════════════════
   ─── القسم الثاني: إعدادات بوت تلغرام ───
   ══════════════════════════════════════════════════ */
const TELEGRAM_CONFIG = {
  TOKEN:   'ضع_توكن_البوت_هنا',
  CHAT_ID: 'ضع_chat_id_هنا',
};


/* ══════════════════════════════════════════════════
   ─── القسم الثالث: مفاتيح التخزين المحلي ───
   ══════════════════════════════════════════════════ */
const KEYS = {
  CART:     'risha_cart',
  PRODUCTS: 'risha_products',
  ORDERS:   'risha_orders',
};


/* ══════════════════════════════════════════════════
   ─── القسم الرابع: المنتجات الافتراضية ───
   ══════════════════════════════════════════════════ */
const DEFAULT_PRODUCTS = [
  {
    id:    'prd-001',
    name:  'ريشة الطاووس الملكية',
    price: 7500,
    image: 'https://images.unsplash.com/photo-1585314614250-d213060e4abe?w=600&q=80',
    desc:  'ريشة طبيعية كاملة بألوانها الزرقاء والخضراء الآسرة، مثالية للزينة والديكور الراقي.',
    tag:   'الأكثر مبيعاً'
  },
  {
    id:    'prd-002',
    name:  'ريشة العين الذهبية',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1510218830377-2e994ea9087b?w=600&q=80',
    desc:  'ريشة نادرة تتميز ببقعة العين الذهبية اللامعة — قطعة فنية استثنائية.',
    tag:   'نادرة'
  },
  {
    id:    'prd-003',
    name:  'طقم ريش الزينة الفاخر',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?w=600&q=80',
    desc:  'مجموعة مختارة من ريش الطاووس الملوّن للتصميم الداخلي والمشاريع الإبداعية.',
    tag:   'طقم فاخر'
  },
  {
    id:    'prd-004',
    name:  'الريشة البيضاء الحصرية',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80',
    desc:  'ريشة طاووس أبيض نادرة — محدودة العدد ومثالية للمقتنيات الفاخرة.',
    tag:   'حصرية'
  },
  {
    id:    'prd-005',
    name:  'ريش السماء الزرقاء',
    price: 9500,
    image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600&q=80',
    desc:  'ريش طاووس هندي أصيل بتدرجات الأزرق السماوي — أناقة وجمال فائق.',
    tag:   'جديد'
  },
  {
    id:    'prd-006',
    name:  'ريش الزمرد الملكي',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1470167494176-c2e966a4eb3d?w=600&q=80',
    desc:  'مجموعة ريش بتدرجات الزمرد والذهبي — لإضفاء لمسة ملكية على مساحتك.',
    tag:   'مميز'
  }
];


/* ══════════════════════════════════════════════════
   ─── القسم الخامس: إدارة السلة ───
   ══════════════════════════════════════════════════ */
let cart = JSON.parse(localStorage.getItem(KEYS.CART) || '[]');

function saveCart() {
  localStorage.setItem(KEYS.CART, JSON.stringify(cart));
}

function getCartTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function addToCart(productId) {
  const products = getProducts();
  const product  = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(i => i.id === productId);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  saveCart();
  updateCartUI();
  showToast(`✓ تمت إضافة "${product.name}" للسلة`, 'gold');
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  saveCart();
  updateCartUI();
  renderCartSidebar();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
  renderCartSidebar();
}

function updateCartUI() {
  const count = getCartCount();
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = count;
}


/* ══════════════════════════════════════════════════
   ─── القسم السادس: المنتجات ───
   ══════════════════════════════════════════════════ */
function getProducts() {
  const stored = localStorage.getItem(KEYS.PRODUCTS);
  if (!stored) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  return JSON.parse(stored);
}

function renderProducts() {
  const container = document.getElementById('product-grid');
  if (!container) return;

  container.innerHTML = `
    <div style="grid-column:1/-1; text-align:center; padding:3rem; color:rgba(245,240,232,0.4);">
      <div style="font-size:2rem; margin-bottom:0.5rem;">⏳</div>
      <p>جارٍ تحميل المنتجات...</p>
    </div>`;

  db.ref('products').on('value', (snapshot) => {
    const products = [];
    snapshot.forEach((child) => {
      products.push(child.val());
    });

    /* حفظ في localStorage للاستخدام السريع */
    if (products.length) {
      localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    }

    const list = products.length ? products : getProducts();

    if (!list.length) {
      container.innerHTML = `
        <div style="grid-column:1/-1; padding:4rem 2rem; color:rgba(245,240,232,0.3); text-align:center;">
          <div style="font-size:3rem; margin-bottom:1rem;">🪶</div>
          <p>لا توجد منتجات متاحة حالياً</p>
        </div>`;
      return;
    }

    container.innerHTML = list.map((p, i) => `
      <div class="product-card" style="animation-delay:${i * 0.08}s">
        <div class="card-media">
          <img src="${p.image}" alt="${p.name}"
               onerror="this.src='https://placehold.co/600x400/1a1a1a/c9a84c?text=RISHA'"/>
          ${p.tag ? `<span class="card-tag">${p.tag}</span>` : ''}
        </div>
        <div class="card-body">
          <h3 class="card-name">${p.name}</h3>
          <p class="card-desc">${p.desc || ''}</p>
          <div class="card-footer">
            <div class="card-price">
              <small>د.ع</small>${Number(p.price).toLocaleString('ar-IQ')}
            </div>
            <button class="btn btn-outline btn-sm" onclick="handleAddToCart('${p.id}')">
              إضافة للسلة
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }, (error) => {
    /* احتياطي: عرض من localStorage إن فشل Firebase */
    console.warn('Firebase error, falling back to localStorage:', error);
    const list = getProducts();
    if (!list.length) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:rgba(245,240,232,0.3);">لا توجد منتجات</div>`;
      return;
    }
    container.innerHTML = list.map((p, i) => `
      <div class="product-card" style="animation-delay:${i * 0.08}s">
        <div class="card-media">
          <img src="${p.image}" alt="${p.name}"
               onerror="this.src='https://placehold.co/600x400/1a1a1a/c9a84c?text=RISHA'"/>
          ${p.tag ? `<span class="card-tag">${p.tag}</span>` : ''}
        </div>
        <div class="card-body">
          <h3 class="card-name">${p.name}</h3>
          <p class="card-desc">${p.desc || ''}</p>
          <div class="card-footer">
            <div class="card-price">
              <small>د.ع</small>${Number(p.price).toLocaleString('ar-IQ')}
            </div>
            <button class="btn btn-outline btn-sm" onclick="handleAddToCart('${p.id}')">
              إضافة للسلة
            </button>
          </div>
        </div>
      </div>
    `).join('');
  });
}


/* ══════════════════════════════════════════════════
   ─── القسم السابع: الطلبات + إشعارات تلغرام ───
   ══════════════════════════════════════════════════ */
function getAllOrders() {
  return JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]');
}

function saveOrders(orders) {
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
}

async function sendTelegramNotification(order) {
  if (
    !TELEGRAM_CONFIG.TOKEN ||
    TELEGRAM_CONFIG.TOKEN   === 'ضع_توكن_البوت_هنا' ||
    !TELEGRAM_CONFIG.CHAT_ID ||
    TELEGRAM_CONFIG.CHAT_ID  === 'ضع_chat_id_هنا'
  ) {
    console.info('💬 تلغرام: لم يتم تفعيله. أضف TOKEN و CHAT_ID في TELEGRAM_CONFIG.');
    return;
  }

  const itemsList = (order.items || [])
    .map(i => `   • ${i.name} × ${i.qty}  —  ${(i.price * i.qty).toLocaleString('ar-IQ')} د.ع`)
    .join('\n');

  const message = `
🛒 *طلب جديد من متجر ريشة*

👤 *الاسم:* ${order.userName || '—'}
📱 *الهاتف:* ${order.userPhone || order.phone || '—'}
📍 *المدينة:* ${order.userCity || order.address || '—'}

📦 *المنتجات المطلوبة:*
${itemsList}

💰 *السعر الكلي:* ${(order.total || 0).toLocaleString('ar-IQ')} د.ع
📋 *رقم الطلب:* \`${order.id}\`
🕐 *وقت الطلب:* ${new Date(order.placedAt).toLocaleString('ar-IQ')}
${order.notes ? `📝 *ملاحظات:* ${order.notes}` : ''}
  `.trim();

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_CONFIG.TOKEN}/sendMessage`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chat_id:    TELEGRAM_CONFIG.CHAT_ID,
          text:       message,
          parse_mode: 'Markdown'
        }),
      }
    );
    const result = await response.json();
    if (result.ok) {
      console.info('✅ تلغرام: تم إرسال الإشعار بنجاح');
    }
  } catch (err) {
    console.warn('⚠️ تلغرام: خطأ في الاتصال —', err.message);
  }
}

function placeOrder({ address, notes }) {
  const session = Auth.getSession();
  if (!session) return { ok: false, msg: 'يجب تسجيل الدخول أولاً' };
  if (!cart.length) return { ok: false, msg: 'سلة التسوق فارغة' };

  const order = {
    id:        'ORD-' + Date.now(),
    userId:    session.id,
    userName:  session.fullName,
    userPhone: session.phone || session.contact,
    userCity:  session.city,
    items:     cart.slice(),
    total:     getCartTotal(),
    address:   address || session.city,
    notes:     notes || '',
    status:    'قيد المعالجة',
    placedAt:  new Date().toISOString(),
  };

  const orders = getAllOrders();
  orders.unshift(order);
  saveOrders(orders);

  Auth.updateUser(session.id, user => {
    if (!user.orders) user.orders = [];
    user.orders.unshift(order.id);
  });

  cart = [];
  saveCart();
  updateCartUI();
  renderCartSidebar();

  return { ok: true, order };
}

function handlePlaceOrder(e) {
  e.preventDefault();
  const session = Auth.getSession();

  if (!session) {
    closeCart();
    openModal('auth-modal');
    showToast('يرجى تسجيل الدخول أولاً لإتمام الطلب', 'gold');
    return;
  }

  const address = document.getElementById('order-address')?.value || session?.city || '';
  const notes   = document.getElementById('order-notes')?.value   || '';

  const result = placeOrder({ address, notes });

  if (!result.ok) {
    showToast(result.msg, 'red');
    return;
  }

  db.ref('orders/' + result.order.id).set(result.order).catch(err => {
    console.warn('⚠️ Firebase: خطأ في مزامنة الطلب —', err);
  });

  sendTelegramNotification(result.order);

  closeCart();
  openModal('success-modal');
  document.getElementById('success-order-id').textContent = result.order.id;
}


/* ══════════════════════════════════════════════════
   ─── القسم الثامن: عرض السلة الجانبية ───
   ══════════════════════════════════════════════════ */
function renderCartSidebar() {
  const listEl = document.getElementById('cart-items-list');
  if (!listEl) return;

  if (!cart.length) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem; color:rgba(245,240,232,0.3);">
        <div style="font-size:3rem; margin-bottom:1rem;">🛒</div>
        <p style="font-size:0.9rem;">سلة التسوق فارغة</p>
        <p style="font-size:0.78rem; margin-top:0.5rem;">أضف منتجاً لتبدأ التسوق</p>
      </div>`;
  } else {
    listEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img class="cart-item-img"
             src="${item.image}"
             alt="${item.name}"
             onerror="this.src='https://placehold.co/64x64/1a1a1a/c9a84c?text=R'"/>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${(item.price * item.qty).toLocaleString('ar-IQ')} د.ع</div>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
      </div>
    `).join('');
  }

  const totalEl = document.getElementById('cart-total-val');
  if (totalEl) totalEl.textContent = getCartTotal().toLocaleString('ar-IQ') + ' د.ع';
}


/* ══════════════════════════════════════════════════
   ─── القسم التاسع: الواجهة (Modals, Sidebar, Toasts) ───
   ══════════════════════════════════════════════════ */
function openCart() {
  renderCartSidebar();
  document.getElementById('cart-overlay').style.display = 'block';
  document.getElementById('cart-sidebar').classList.add('open');
}

function closeCart() {
  document.getElementById('cart-overlay').style.display = 'none';
  document.getElementById('cart-sidebar').classList.remove('open');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function showToast(message, type = 'gold', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { gold: '✦', green: '✓', red: '✕' };
  const toast  = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '•'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}


/* ══════════════════════════════════════════════════
   ─── القسم العاشر: نظام المصادقة — UI ───
   ══════════════════════════════════════════════════ */
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`panel-${tab}`).classList.add('active');
}

function handleAddToCart(productId) {
  const session = Auth.getSession();
  if (!session) {
    openModal('auth-modal');
    showToast('يرجى تسجيل الدخول أولاً لإضافة المنتجات', 'gold');
    return;
  }
  addToCart(productId);
}

/**
 * معالجة نموذج إنشاء حساب جديد
 * ✅ مُصلَّح: يقرأ من reg-phone (بدلاً من reg-contact)
 */
function handleRegister(e) {
  e.preventDefault();

  const fullName = document.getElementById('reg-name').value.trim();
  const phone    = document.getElementById('reg-phone').value.trim(); // ✅ مُصلَّح
  const password = document.getElementById('reg-password').value;
  const city     = document.getElementById('reg-city').value;

  const errEl = document.getElementById('reg-error');
  if (errEl) errEl.classList.remove('show');

  const result = Auth.register({ fullName, phone, email: '', password, city });

  if (!result.ok) {
    if (errEl) {
      errEl.textContent = result.msg;
      errEl.classList.add('show');
    }
    return;
  }

  closeModal('auth-modal');
  updateNavAfterAuth();
  showToast(`مرحباً ${result.user.fullName}! تم إنشاء حسابك بنجاح 🎉`, 'green');
}

/**
 * معالجة نموذج تسجيل الدخول
 * ✅ مُصلَّح: يقرأ من login-phone (بدلاً من login-contact)
 */
function handleLogin(e) {
  e.preventDefault();

  const phone    = document.getElementById('login-phone').value.trim(); // ✅ مُصلَّح
  const password = document.getElementById('login-password').value;

  const errEl = document.getElementById('login-error');
  if (errEl) errEl.classList.remove('show');

  const result = Auth.login({ phone, password });

  if (!result.ok) {
    if (errEl) {
      errEl.textContent = result.msg;
      errEl.classList.add('show');
    }
    return;
  }

  closeModal('auth-modal');
  updateNavAfterAuth();
  showToast(`أهلاً بعودتك، ${result.user.fullName}!`, 'green');
}

function handleLogout() {
  Auth.logout();
  cart = [];
  saveCart();
  updateNavAfterAuth();
  updateCartUI();
  showToast('تم تسجيل خروجك بنجاح', 'gold');
  document.getElementById('user-dropdown')?.classList.remove('open');
}

function updateNavAfterAuth() {
  const session     = Auth.getSession();
  const loginBtn    = document.getElementById('nav-login-btn');
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userAvatar  = document.getElementById('user-avatar-text');
  const userNameEl  = document.getElementById('user-display-name');

  if (session) {
    loginBtn?.classList.add('hidden');
    userMenuBtn?.classList.remove('hidden');
    if (userAvatar) userAvatar.textContent = session.fullName.charAt(0).toUpperCase();
    if (userNameEl) userNameEl.textContent = session.fullName.split(' ')[0];
  } else {
    loginBtn?.classList.remove('hidden');
    userMenuBtn?.classList.add('hidden');
  }
}


/* ══════════════════════════════════════════════════
   ─── القسم الحادي عشر: الملف الشخصي ───
   ══════════════════════════════════════════════════ */
function openProfileModal() {
  const session = Auth.getSession();
  if (!session) { openModal('auth-modal'); return; }

  document.getElementById('profile-name').textContent    = session.fullName;
  document.getElementById('profile-contact').textContent = session.phone || session.contact || '—';
  document.getElementById('profile-city').textContent    = session.city || '—';
  document.getElementById('profile-joined').textContent  =
    new Date(session.joinedAt || Date.now()).toLocaleDateString('ar-IQ');

  const allOrders  = getAllOrders();
  const userOrders = allOrders.filter(o => o.userId === session.id);
  const ordersWrap = document.getElementById('profile-orders');

  if (!userOrders.length) {
    ordersWrap.innerHTML = `
      <div style="text-align:center; padding:2rem; color:rgba(245,240,232,0.3);">
        <p>لا توجد طلبات سابقة</p>
      </div>`;
  } else {
    ordersWrap.innerHTML = userOrders.map(o => `
      <div class="order-card">
        <div class="order-id"># ${o.id}</div>
        <div class="order-product">
          ${o.items.map(i => `${i.name} × ${i.qty}`).join('، ')}
        </div>
        <div class="order-meta">
          <span>💰 ${o.total.toLocaleString('ar-IQ')} د.ع</span>
          <span>📍 ${o.address || o.userCity}</span>
          <span>📅 ${new Date(o.placedAt).toLocaleDateString('ar-IQ')}</span>
          <span>${getStatusBadge(o.status)}</span>
        </div>
      </div>
    `).join('');
  }

  openModal('profile-modal');
  document.getElementById('user-dropdown')?.classList.remove('open');
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


/* ══════════════════════════════════════════════════
   ─── القسم الثاني عشر: أنيميشن ريش الطاووس ───
   ══════════════════════════════════════════════════ */
function initFeatherAnimation() {
  const canvas = document.getElementById('feather-canvas');
  if (!canvas) return;

  const palette = ['#0e5e5e','#1a5c3a','#1a3a8f','#c9a84c','#6a0dad','#0b4f4f'];
  const count   = 20;

  for (let i = 0; i < count; i++) {
    const div   = document.createElement('div');
    div.className = 'hero-feather';

    const left  = Math.random() * 100;
    const dur   = (7  + Math.random() * 10).toFixed(2);
    const delay = -(Math.random() * 18).toFixed(2);
    const size  = 35 + Math.random() * 55;
    const color = palette[Math.floor(Math.random() * palette.length)];
    const r0    = (Math.random() * 40 - 20).toFixed(1);
    const r1    = (parseFloat(r0) + Math.random() * 50 - 10).toFixed(1);

    div.style.cssText = `
      left: ${left}%;
      --r0: ${r0}deg;
      --r1: ${r1}deg;
      animation-duration: ${dur}s;
      animation-delay: ${delay}s;
    `;

    div.innerHTML = buildFeatherSVG(i, size, color);
    canvas.appendChild(div);
  }
}

function buildFeatherSVG(idx, size, color) {
  const h = size * 3;
  return `
  <svg viewBox="0 0 40 120" width="${size}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="fe${idx}" cx="50%" cy="28%" r="55%">
        <stop offset="0%"   stop-color="#e8c97a"/>
        <stop offset="35%"  stop-color="${color}"/>
        <stop offset="100%" stop-color="#050a0c"/>
      </radialGradient>
    </defs>
    <line x1="20" y1="0" x2="20" y2="120" stroke="${color}" stroke-width="1.8" opacity="0.85"/>
    <path d="M20 8 Q42 28 40 72 Q32 95 20 105" fill="none" stroke="${color}" stroke-width="0.9" opacity="0.55"/>
    <path d="M20 8 Q-2 28 0 72 Q8 95 20 105"  fill="none" stroke="${color}" stroke-width="0.9" opacity="0.55"/>
    ${[15,25,35,48,62,76].map(y=>`
    <line x1="20" y1="${y}" x2="${20 + Math.min(17,(y)*0.35)}" y2="${y+5}"
          stroke="${color}" stroke-width="0.55" opacity="0.45"/>`).join('')}
    ${[15,25,35,48,62,76].map(y=>`
    <line x1="20" y1="${y}" x2="${20 - Math.min(17,(y)*0.35)}" y2="${y+5}"
          stroke="${color}" stroke-width="0.55" opacity="0.45"/>`).join('')}
    <ellipse cx="20" cy="33" rx="10" ry="12" fill="url(#fe${idx})" opacity="0.9"/>
    <ellipse cx="20" cy="33" rx="5.5" ry="6.5" fill="${color}" opacity="0.75"/>
    <ellipse cx="20" cy="32" rx="2.8" ry="3.2" fill="#040810" opacity="0.95"/>
    <circle  cx="18.5" cy="30.5" r="1.1" fill="#ffffff" opacity="0.55"/>
  </svg>`;
}


/* ══════════════════════════════════════════════════
   ─── القسم الثالث عشر: شريط التنقل ───
   ══════════════════════════════════════════════════ */
function initNavbar() {
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('user-dropdown');
    const menuBtn  = document.getElementById('user-menu-btn');
    if (dropdown && !menuBtn?.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
}


/* ══════════════════════════════════════════════════
   ─── القسم الرابع عشر: ربط النماذج ───
   ══════════════════════════════════════════════════ */
function initForms() {
  /* أزرار إظهار/إخفاء كلمة المرور */
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (!input) return;
      const show = input.type === 'password';
      input.type  = show ? 'text' : 'password';
      btn.textContent = show ? '🙈' : '👁';
    });
  });

  /* نموذج التسجيل */
  document.getElementById('register-form')?.addEventListener('submit', handleRegister);

  /* نموذج تسجيل الدخول */
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);

  /* نموذج الطلب في السلة */
  document.getElementById('order-form')?.addEventListener('submit', handlePlaceOrder);

  /* تعبئة خيارات المدن في نموذج التسجيل */
  Auth.populateCitySelect('reg-city');
}


/* ══════════════════════════════════════════════════
   ─── القسم الخامس عشر: نقطة البداية ───
   ══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  renderProducts();
  updateCartUI();
  updateNavAfterAuth();
  initFeatherAnimation();
  initForms();

  window.addEventListener('storage', (e) => {
    if (e.key === KEYS.PRODUCTS) renderProducts();
  });

  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});


/* ══════════════════════════════════════════════════
   ─── دالة رفع المنتجات الأولية لـ Firebase ───
   اكتب uploadInitialProducts() في Console لتشغيلها
   ══════════════════════════════════════════════════ */
function uploadInitialProducts() {
  db.ref('products').set(
    DEFAULT_PRODUCTS.reduce((acc, p) => { acc[p.id] = p; return acc; }, {})
  ).then(() => console.log('✅ تم رفع المنتجات بنجاح'))
   .catch(e => console.error('❌ خطأ:', e));
}
