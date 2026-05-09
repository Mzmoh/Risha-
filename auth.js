/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║                   RISHA — auth.js                           ║
 * ║         نظام المصادقة: تسجيل الدخول، إنشاء الحساب          ║
 * ║                    وإدارة جلسة المستخدم                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ما هو هذا الملف؟
 *   يتحكم في كل ما يتعلق بهوية المستخدم:
 *   التسجيل، الدخول، الخروج، وحفظ الجلسة.
 *
 * لماذا يستخدم؟
 *   لفصل منطق المصادقة عن بقية الكود، مما يجعل الصيانة أسهل
 *   ويمنع تكرار الكود في main.js وأي ملف آخر.
 */

const Auth = (() => {

  /* ══════════════════════════════════════════════════
     ─── القسم الأول: مفاتيح التخزين المحلي ───
     ما هو؟  ثوابت تُمثّل أسماء المفاتيح في localStorage.
     لماذا؟  لتجنب الأخطاء الإملائية وتسهيل التعديل مستقبلاً.
     ══════════════════════════════════════════════════ */
  const KEYS = {
    USERS:   'risha_users',    // مفتاح قائمة المستخدمين المسجلين
    SESSION: 'risha_session',  // مفتاح جلسة المستخدم الحالي
  };

  /* ══════════════════════════════════════════════════
     ─── القسم الثاني: قائمة المدن العراقية ───
     ما هو؟  مصفوفة تحتوي أسماء المدن المتاحة للتسجيل.
     لماذا؟  لضمان توحيد أسماء المدن وتجنب الإدخال الحر.
     ══════════════════════════════════════════════════ */
  const CITIES = [
    'بغداد', 'البصرة', 'الموصل', 'أربيل', 'كركوك', 'النجف',
    'كربلاء', 'الحلة', 'الناصرية', 'العمارة', 'الديوانية',
    'السماوة', 'الرمادي', 'تكريت', 'الفلوجة', 'سامراء',
    'بعقوبة', 'الكوت', 'دهوك', 'السليمانية'
  ];

  /* ══════════════════════════════════════════════════
     ─── القسم الثالث: دوال القراءة والكتابة ───
     ما هو؟  دوال مساعدة لجلب وحفظ البيانات من/إلى localStorage.
     لماذا؟  لمركزة عمليات التخزين في مكان واحد.
     ══════════════════════════════════════════════════ */

  /**
   * جلب جميع المستخدمين المسجلين
   * @returns {Array} — مصفوفة كائنات المستخدمين
   */
  function getAllUsers() {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  }

  /**
   * حفظ قائمة المستخدمين بعد أي تعديل
   * @param {Array} users — المصفوفة المحدّثة
   */
  function saveUsers(users) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }

  /**
   * جلب بيانات المستخدم المسجّل حالياً (الجلسة النشطة)
   * @returns {Object|null} — بيانات المستخدم أو null إن لم يكن مسجلاً
   */
  function getSession() {
    const s = localStorage.getItem(KEYS.SESSION);
    return s ? JSON.parse(s) : null;
  }

  /**
   * حفظ جلسة المستخدم بعد تسجيل الدخول أو التسجيل
   * ملاحظة: لا نحفظ كلمة المرور في الجلسة للأمان
   * @param {Object} user — بيانات المستخدم الكاملة
   */
  function setSession(user) {
    const safe = { ...user };
    delete safe.password; // حذف كلمة المرور من نسخة الجلسة
    localStorage.setItem(KEYS.SESSION, JSON.stringify(safe));
  }

  /**
   * مسح الجلسة عند تسجيل الخروج
   */
  function clearSession() {
    localStorage.removeItem(KEYS.SESSION);
  }

  /* ══════════════════════════════════════════════════
     ─── القسم الرابع: دوال التحقق من البيانات ───
     ما هو؟  دوال تتحقق من صحة المدخلات قبل المعالجة.
     لماذا؟  لحماية قاعدة البيانات من البيانات الغير صالحة
             ولتوفير رسائل خطأ واضحة للمستخدم.
     ══════════════════════════════════════════════════ */

  /**
   * التحقق من صحة رقم الهاتف العراقي
   * يجب أن يبدأ بـ 07 ويحتوي 11 رقماً
   * @param {string} phone — رقم الهاتف المُدخَل
   * @returns {boolean} — true إن كان صحيحاً
   */
  function isValidPhone(phone) {
    return /^07[3-9]\d{8}$/.test(phone.replace(/\s/g, ''));
  }

  /**
   * التحقق من صحة البريد الإلكتروني (اختياري)
   * @param {string} email — البريد المُدخَل
   * @returns {boolean} — true إن كان صحيحاً أو فارغاً
   */
  function isValidEmail(email) {
    if (!email || email.trim() === '') return true; // اختياري، مسموح بتركه فارغاً
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ══════════════════════════════════════════════════
     ─── القسم الخامس: تسجيل مستخدم جديد ───
     ما هو؟  دالة تستقبل بيانات التسجيل وتُنشئ حساباً جديداً.
     لماذا؟  لإتاحة إنشاء حسابات جديدة بشكل آمن ومتحقق منه.
     ══════════════════════════════════════════════════ */

  /**
   * تسجيل مستخدم جديد
   * المتطلبات الإجبارية: الاسم، رقم الهاتف، كلمة المرور، المدينة
   * المتطلبات الاختيارية: البريد الإلكتروني
   *
   * @param {Object} params
   * @param {string} params.fullName  — الاسم الكامل (إجباري)
   * @param {string} params.phone     — رقم الهاتف (إجباري)
   * @param {string} params.email     — البريد الإلكتروني (اختياري)
   * @param {string} params.password  — كلمة المرور (إجباري)
   * @param {string} params.city      — المدينة (إجباري)
   * @returns {{ ok: boolean, msg?: string, user?: Object }}
   */
  function register({ fullName, phone, email, password, city }) {

    /* ── التحقق من الحقول الإجبارية ── */
    if (!fullName || !fullName.trim()) {
      return { ok: false, msg: 'يرجى إدخال الاسم الكامل.' };
    }
    if (!phone || !phone.trim()) {
      return { ok: false, msg: 'رقم الهاتف إجباري ولا يمكن تركه فارغاً.' };
    }
    if (!isValidPhone(phone.trim())) {
      return { ok: false, msg: 'رقم الهاتف غير صحيح. يجب أن يبدأ بـ 07 ويحتوي 11 رقماً.' };
    }
    if (!password) {
      return { ok: false, msg: 'يرجى إدخال كلمة المرور.' };
    }
    if (password.length < 6) {
      return { ok: false, msg: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' };
    }
    if (!city) {
      return { ok: false, msg: 'يرجى اختيار مدينتك.' };
    }

    /* ── التحقق من البريد الإلكتروني إن أُدخل ── */
    if (email && email.trim() && !isValidEmail(email.trim())) {
      return { ok: false, msg: 'صيغة البريد الإلكتروني غير صحيحة.' };
    }

    const users = getAllUsers();

    /* ── التحقق من عدم تكرار رقم الهاتف ── */
    const phoneExists = users.find(u => u.phone === phone.trim());
    if (phoneExists) {
      return { ok: false, msg: 'رقم الهاتف هذا مسجّل مسبقاً. هل تريد تسجيل الدخول؟' };
    }

    /* ── التحقق من عدم تكرار البريد إن أُدخل ── */
    if (email && email.trim()) {
      const emailExists = users.find(u => u.email === email.trim().toLowerCase());
      if (emailExists) {
        return { ok: false, msg: 'البريد الإلكتروني مسجّل مسبقاً.' };
      }
    }

    /* ── إنشاء كائن المستخدم الجديد ── */
    const newUser = {
      id:        'USR-' + Date.now(),
      fullName:  fullName.trim(),
      phone:     phone.trim(),                          // رقم الهاتف (إجباري - المعرّف الأساسي)
      email:     email ? email.trim().toLowerCase() : '', // البريد (اختياري)
      contact:   phone.trim(),                          // للتوافق مع الكود القديم
      password,                                         // في تطبيق حقيقي يجب تشفيرها بـ bcrypt
      city,
      role:      'customer',
      joinedAt:  new Date().toISOString(),
      orders:    []
    };

    users.push(newUser);
    saveUsers(users);

    /* تسجيل الدخول التلقائي بعد إنشاء الحساب */
    setSession(newUser);
    return { ok: true, user: newUser };
  }

  /* ══════════════════════════════════════════════════
     ─── القسم السادس: تسجيل الدخول ───
     ما هو؟  دالة تتحقق من بيانات الدخول وتُنشئ جلسة.
     لماذا؟  للسماح للمستخدمين المسجلين بالوصول لحساباتهم.
     ══════════════════════════════════════════════════ */

  /**
   * تسجيل الدخول برقم الهاتف وكلمة المرور
   * @param {Object} params
   * @param {string} params.phone    — رقم الهاتف (المعرّف الرئيسي)
   * @param {string} params.password — كلمة المرور
   * @returns {{ ok: boolean, msg?: string, user?: Object }}
   */
  function login({ phone, password }) {

    /* ── التحقق من عدم فراغ الحقول ── */
    if (!phone || !phone.trim()) {
      return { ok: false, msg: 'يرجى إدخال رقم الهاتف.' };
    }
    if (!password) {
      return { ok: false, msg: 'يرجى إدخال كلمة المرور.' };
    }

    const users = getAllUsers();

    /* ── البحث عن المستخدم برقم الهاتف ── */
    const user = users.find(
      u => (u.phone === phone.trim() || u.contact === phone.trim())
        && u.password === password
    );

    if (!user) {
      return { ok: false, msg: 'رقم الهاتف أو كلمة المرور غير صحيحة.' };
    }

    setSession(user);
    return { ok: true, user };
  }

  /* ══════════════════════════════════════════════════
     ─── القسم السابع: تحديث بيانات المستخدم ───
     ما هو؟  دالة لتعديل بيانات مستخدم موجود في القائمة.
     لماذا؟  لتحديث الطلبات أو أي بيانات أخرى دون إعادة إنشاء الحساب.
     ══════════════════════════════════════════════════ */

  /**
   * تحديث بيانات مستخدم بواسطة دالة mutator
   * @param {string}   userId  — معرّف المستخدم
   * @param {Function} updater — دالة تستقبل كائن المستخدم وتُعدّله مباشرة
   */
  function updateUser(userId, updater) {
    const users = getAllUsers();
    const idx   = users.findIndex(u => u.id === userId);
    if (idx === -1) return;

    updater(users[idx]);
    saveUsers(users);

    /* تحديث الجلسة إن كانت تخص نفس المستخدم */
    const session = getSession();
    if (session && session.id === userId) {
      setSession(users[idx]);
    }
  }

  /* ══════════════════════════════════════════════════
     ─── القسم الثامن: إنشاء خيارات المدن ───
     ما هو؟  دالة تملأ عنصر <select> بخيارات المدن العراقية.
     لماذا؟  لتوحيد طريقة عرض المدن في جميع نماذج التسجيل.
     ══════════════════════════════════════════════════ */

  /**
   * ملء عنصر Select بقائمة المدن العراقية
   * @param {string} selectId — معرّف عنصر الـ select في HTML
   */
  function populateCitySelect(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = '<option value="">— اختر مدينتك —</option>';
    CITIES.forEach(c => {
      sel.innerHTML += `<option value="${c}">${c}</option>`;
    });
  }

  /* ══════════════════════════════════════════════════
     ─── الواجهة العامة (Public API) ───
     ما هو؟  الدوال والمتغيرات المتاحة للاستخدام من ملفات أخرى.
     لماذا؟  لإخفاء التفاصيل الداخلية وعرض واجهة نظيفة فقط.
     ══════════════════════════════════════════════════ */
  return {
    register,
    login,
    logout:            clearSession,
    getSession,
    updateUser,
    getAllUsers,
    saveUsers,         // مُصدَّرة لاستخدامها في admin.js
    populateCitySelect,
    CITIES
  };

})();