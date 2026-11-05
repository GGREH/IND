/**
 * ==========================================================================
 * КАФЕ «ЖИТО & М'ЯТА» — JAVASCRIPT ЛОГІКА (Етап 2: Final Demo)
 * Варіант: Тематика №9 | Стилістика №16 | Колір №26 (#98FB98) | Зауваження №9
 *
 * Реалізовані модулі:
 * 1. Розумне керування темою (Light / Dark Neon #C6FF1A за Зауваженням №9)
 *    + автоматична адаптація під Mobile (<= 767px) та ручне перемикання.
 * 2. Динамічна фільтрація, живий пошук та сортування страв у Меню (DOM).
 * 3. Модальне вікно детального перегляду страви.
 * 4. Інтерактивний кошик передзамовлення (додавання, зміна кількості,
 *    підрахунок суми, збереження в localStorage, перенесення у бронювання).
 * 5. Жива JS-валідація форми бронювання столика (Ім'я, Телефон з автоформатом,
 *    Дата візиту ДД.ММ.РРРР, Час візиту 08:30–22:00) + список бронювань.
 * 6. Система Toast-сповіщень та кнопка плавного повернення нагору.
 * ==========================================================================
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    THEME: 'zhyto_myata_theme',
    CART: 'zhyto_myata_cart',
    BOOKINGS: 'zhyto_myata_bookings'
  };

  /* --------------------------------------------------------------------------
     1. TOAST СПОВІЩЕННЯ ТА ГЛОБАЛЬНІ DOM-ЕЛЕМЕНТИ
     -------------------------------------------------------------------------- */
  let toastContainer = null;

  function ensureGlobalUI() {
    // Контейнер для Toast-сповіщень
    if (!document.querySelector('.toast-container')) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastContainer);
    } else {
      toastContainer = document.querySelector('.toast-container');
    }

    // Кнопка "Нагору"
    if (!document.querySelector('.scroll-top-btn')) {
      const scrollBtn = document.createElement('button');
      scrollBtn.type = 'button';
      scrollBtn.className = 'scroll-top-btn';
      scrollBtn.title = 'Прокрутити нагору';
      scrollBtn.setAttribute('aria-label', 'Прокрутити нагору');
      scrollBtn.innerHTML = '↑';
      scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      document.body.appendChild(scrollBtn);

      window.addEventListener('scroll', () => {
        if (window.scrollY > 320) {
          scrollBtn.classList.add('visible');
        } else {
          scrollBtn.classList.remove('visible');
        }
      });
    }

    // Модальне вікно для Кошика та Деталей страви
    if (!document.getElementById('appModalBackdrop')) {
      const modalBackdrop = document.createElement('div');
      modalBackdrop.id = 'appModalBackdrop';
      modalBackdrop.className = 'modal-backdrop';
      modalBackdrop.setAttribute('role', 'dialog');
      modalBackdrop.setAttribute('aria-modal', 'true');
      modalBackdrop.innerHTML = `
        <div class="modal-box" id="appModalBox">
          <div class="modal-header">
            <h3 id="appModalTitle" style="font-size: 20px; margin: 0;">Модальне вікно</h3>
            <button type="button" class="modal-close" id="appModalClose" aria-label="Закрити">✕</button>
          </div>
          <div id="appModalBody"></div>
        </div>
      `;
      document.body.appendChild(modalBackdrop);

      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
      });
      document.getElementById('appModalClose').addEventListener('click', closeModal);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
          closeModal();
        }
      });
    }
  }

  function showToast(message) {
    if (!toastContainer) ensureGlobalUI();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 220);
    }, 3000);
  }

  function openModal(title, htmlContent) {
    const backdrop = document.getElementById('appModalBackdrop');
    const titleEl = document.getElementById('appModalTitle');
    const bodyEl = document.getElementById('appModalBody');
    if (!backdrop || !titleEl || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = htmlContent;
    backdrop.classList.add('open');
  }

  function closeModal() {
    const backdrop = document.getElementById('appModalBackdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  /* --------------------------------------------------------------------------
     2. ТЕМА ОФОРМЛЕННЯ (ЗАУВАЖЕННЯ №9: DARK NEON MOBILE / LIGHT DESKTOP)
     -------------------------------------------------------------------------- */
  function getEffectiveTheme() {
    const explicit = document.documentElement.getAttribute('data-theme');
    if (explicit === 'dark' || explicit === 'light') return explicit;
    return window.matchMedia('(max-width: 767px)').matches ? 'dark' : 'light';
  }

  function updateThemeButtonUI() {
    const iconEl = document.getElementById('themeIcon');
    const labelEl = document.getElementById('themeLabel');
    if (!iconEl || !labelEl) return;

    const current = getEffectiveTheme();
    if (current === 'dark') {
      iconEl.textContent = '☀️';
      labelEl.textContent = 'Світла';
    } else {
      iconEl.textContent = '🌙';
      labelEl.textContent = 'Неон';
    }
  }

  function initThemeManager() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    updateThemeButtonUI();

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const current = getEffectiveTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(STORAGE_KEYS.THEME, next);
        updateThemeButtonUI();
        showToast(
          next === 'dark'
            ? '⚡ Увімкнено темну неоново-лаймову тему (Зауваження №9)'
            : '🌿 Увімкнено класичну світлу м\'ятну тему (#98FB98)'
        );
      });
    }

    window.matchMedia('(max-width: 767px)').addEventListener('change', () => {
      updateThemeButtonUI();
    });
  }

  /* --------------------------------------------------------------------------
     3. КОШИК ПЕРЕДЗАМОВЛЕННЯ СТРАВ (LOCALSTORAGE + DOM MANIPULATION)
     -------------------------------------------------------------------------- */
  function getCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CART);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    updateCartBadge();
  }

  function updateCartBadge() {
    const badge = document.getElementById('cartCountBadge');
    if (!badge) return;
    const cart = getCart();
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = String(totalQty);
  }

  function addToCart(dish) {
    const cart = getCart();
    const existing = cart.find((item) => item.id === dish.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: dish.id,
        title: dish.title,
        price: Number(dish.price),
        weight: dish.weight,
        qty: 1
      });
    }
    saveCart(cart);
    showToast(`🍲 «${dish.title}» додано до вашого замовлення!`);
  }

  function renderCartModal() {
    const cart = getCart();
    if (cart.length === 0) {
      openModal(
        '🧺 Ваше передзамовлення',
        `
        <div style="text-align: center; padding: 20px 0;">
          <p style="color: var(--color-text-muted); margin-bottom: 16px;">
            Ви ще не обрали жодної страви для передзамовлення до столика.
          </p>
          <a href="menu.html" class="btn btn-primary">Перейти до меню</a>
        </div>
        `
      );
      return;
    }

    const totalSum = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const rowsHtml = cart
      .map(
        (item) => `
        <div class="cart-item-row" data-cart-id="${item.id}">
          <div>
            <div style="font-weight: 600;">${item.title}</div>
            <div style="font-size: 12px; color: var(--color-text-muted);">${item.price} ₴ × ${item.qty} = <strong>${item.price * item.qty} ₴</strong></div>
          </div>
          <div class="cart-qty-controls">
            <button type="button" class="qty-btn js-cart-dec" data-id="${item.id}" aria-label="Зменшити">−</button>
            <span style="min-width: 20px; text-align: center; font-weight: 600;">${item.qty}</span>
            <button type="button" class="qty-btn js-cart-inc" data-id="${item.id}" aria-label="Збільшити">+</button>
          </div>
        </div>
      `
      )
      .join('');

    openModal(
      '🧺 Ваше передзамовлення',
      `
      <div>
        ${rowsHtml}
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; font-size: 17px; font-weight: bold;">
          <span>Разом до сплати:</span>
          <span class="dish-price">${totalSum} ₴</span>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
          <button type="button" class="btn btn-primary" id="proceedToBookingBtn" style="flex: 1;">
            Додати до бронювання столика →
          </button>
          <button type="button" class="btn btn-outline btn-sm" id="clearCartBtn">
            Очистити
          </button>
        </div>
      </div>
      `
    );

    const bodyEl = document.getElementById('appModalBody');
    bodyEl.querySelectorAll('.js-cart-inc').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const currentCart = getCart();
        const target = currentCart.find((i) => i.id === id);
        if (target) target.qty += 1;
        saveCart(currentCart);
        renderCartModal();
      });
    });

    bodyEl.querySelectorAll('.js-cart-dec').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        let currentCart = getCart();
        const target = currentCart.find((i) => i.id === id);
        if (target) {
          target.qty -= 1;
          if (target.qty <= 0) {
            currentCart = currentCart.filter((i) => i.id !== id);
          }
        }
        saveCart(currentCart);
        renderCartModal();
      });
    });

    const clearBtn = document.getElementById('clearCartBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        saveCart([]);
        renderCartModal();
        showToast('Кошик передзамовлення очищено');
      });
    }

    const proceedBtn = document.getElementById('proceedToBookingBtn');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        const summary = cart.map((i) => `${i.title} (×${i.qty})`).join(', ');
        sessionStorage.setItem('zhyto_preorder_note', `Передзамовлення страв: ${summary} [Сума: ${totalSum} ₴]`);
        closeModal();
        if (window.location.pathname.endsWith('contacts.html')) {
          applyPreorderNoteToForm();
        } else {
          window.location.href = 'contacts.html#bookingForm';
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     4. КАРТКИ СТРАВ ТА ДЕТАЛЬНИЙ ПЕРЕГЛЯД (МОДАЛКА)
     -------------------------------------------------------------------------- */
  function extractDishFromCard(card) {
    return {
      id: card.getAttribute('data-dish-id') || card.querySelector('.dish-title')?.textContent.trim(),
      title: card.getAttribute('data-title') || card.querySelector('.dish-title')?.textContent.trim(),
      price: Number(card.getAttribute('data-price') || 180),
      weight: card.getAttribute('data-weight') || '300 г',
      time: card.getAttribute('data-time') || '15 хв',
      img: card.getAttribute('data-img') || card.querySelector('img')?.getAttribute('src'),
      desc: card.getAttribute('data-desc') || card.querySelector('.dish-desc')?.textContent.trim()
    };
  }

  function openDishDetailsModal(dish) {
    openModal(
      dish.title,
      `
      <div>
        <div style="border-radius: 10px; overflow: hidden; height: 220px; margin-bottom: 15px; border: 1px solid var(--color-border);">
          <img src="${dish.img}" alt="${dish.title}" style="width: 100%; height: 100%; object-fit: cover;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span class="hero-tag" style="margin-bottom: 0;">Авторська рецептура шефа</span>
          <span class="dish-price" style="font-size: 16px;">${dish.price} ₴</span>
        </div>
        <p style="color: var(--color-text); margin-bottom: 14px;">${dish.desc}</p>
        <div class="dish-meta" style="margin-bottom: 18px;">
          <span>⚖️ Вага порції: <strong>${dish.weight}</strong></span>
          <span>⏱️ Час подачі: <strong>${dish.time}</strong></span>
        </div>
        <button type="button" class="btn btn-primary" id="modalAddDishBtn" style="width: 100%;">
          + Додати у замовлення (${dish.price} ₴)
        </button>
      </div>
      `
    );

    const addBtn = document.getElementById('modalAddDishBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        addToCart(dish);
        closeModal();
      });
    }
  }

  function initDishCards() {
    document.querySelectorAll('.dish-card').forEach((card) => {
      const dish = extractDishFromCard(card);

      const addBtn = card.querySelector('.js-add-cart');
      if (addBtn) {
        addBtn.addEventListener('click', () => addToCart(dish));
      }

      const detailsBtn = card.querySelector('.js-dish-details');
      if (detailsBtn) {
        detailsBtn.addEventListener('click', () => openDishDetailsModal(dish));
      }

      const imgWrap = card.querySelector('.dish-image-wrap');
      if (imgWrap) {
        imgWrap.addEventListener('click', () => openDishDetailsModal(dish));
      }
    });

    const cartOpenBtn = document.getElementById('cartOpenBtn');
    if (cartOpenBtn) {
      cartOpenBtn.addEventListener('click', renderCartModal);
    }
  }

  /* --------------------------------------------------------------------------
     5. ФІЛЬТРАЦІЯ, ПОШУК ТА СОРТУВАННЯ НА СТОРІНЦІ МЕНЮ
     -------------------------------------------------------------------------- */
  function initMenuFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('menuSearchInput');
    const sortSelect = document.getElementById('menuSortSelect');
    const sections = document.querySelectorAll('.menu-category-section');
    const emptyState = document.getElementById('menuEmptyState');
    const resetBtn = document.getElementById('resetMenuFiltersBtn');

    if (sections.length === 0) return;

    let activeCategory = 'all';

    // Запам'ятовуємо початковий порядок карток у кожній секції
    sections.forEach((sec) => {
      const cards = sec.querySelectorAll('.dish-card');
      cards.forEach((c, idx) => c.setAttribute('data-original-index', String(idx)));
    });

    function applyFilterAndSort() {
      const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
      const sortMode = sortSelect ? sortSelect.value : 'default';
      let totalVisibleCards = 0;

      sections.forEach((section) => {
        const sectionCat = section.getAttribute('data-category');
        const grid = section.querySelector('.menu-grid');
        const cards = Array.from(grid.querySelectorAll('.dish-card'));

        // Сортування карток всередині категорії
        cards.sort((a, b) => {
          if (sortMode === 'price-asc') {
            return Number(a.dataset.price) - Number(b.dataset.price);
          }
          if (sortMode === 'price-desc') {
            return Number(b.dataset.price) - Number(a.dataset.price);
          }
          if (sortMode === 'weight-desc') {
            return Number(b.dataset.weightNum) - Number(a.dataset.weightNum);
          }
          return Number(a.dataset.originalIndex) - Number(b.dataset.originalIndex);
        });

        cards.forEach((card) => grid.appendChild(card));

        // Перевірка видимості кожної картки
        let visibleInSection = 0;
        const categoryMatches = activeCategory === 'all' || activeCategory === sectionCat;

        cards.forEach((card) => {
          const title = (card.dataset.title || '').toLowerCase();
          const desc = (card.dataset.desc || '').toLowerCase();
          const matchesQuery = !query || title.includes(query) || desc.includes(query);

          if (categoryMatches && matchesQuery) {
            card.style.display = 'flex';
            visibleInSection += 1;
            totalVisibleCards += 1;
          } else {
            card.style.display = 'none';
          }
        });

        section.style.display = visibleInSection > 0 ? 'block' : 'none';
      });

      if (emptyState) {
        emptyState.style.display = totalVisibleCards === 0 ? 'block' : 'none';
      }
    }

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.getAttribute('data-filter') || 'all';
        applyFilterAndSort();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', applyFilterAndSort);
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', applyFilterAndSort);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        activeCategory = 'all';
        filterBtns.forEach((b) => b.classList.toggle('active', b.getAttribute('data-filter') === 'all'));
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'default';
        applyFilterAndSort();
      });
    }
  }

  /* --------------------------------------------------------------------------
     6. ФОРМА БРОНЮВАННЯ СТОЛИКА, ВАЛІДАЦІЯ ТА ЗБЕРЕЖЕННЯ ЗАЯВОК
     -------------------------------------------------------------------------- */
  function applyPreorderNoteToForm() {
    const note = sessionStorage.getItem('zhyto_preorder_note');
    const notesInput = document.getElementById('clientNotes');
    if (note && notesInput) {
      notesInput.value = note;
      sessionStorage.removeItem('zhyto_preorder_note');
      notesInput.focus();
      showToast('📋 Ваше передзамовлення страв додано у коментар до бронювання!');
    }
  }

  function getBookings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveBookings(list) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(list));
    renderBookingsList();
  }

  function renderBookingsList() {
    const card = document.getElementById('myBookingsCard');
    const listEl = document.getElementById('bookingsList');
    if (!card || !listEl) return;

    const bookings = getBookings();
    if (bookings.length === 0) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    listEl.innerHTML = bookings
      .map(
        (b) => `
        <div class="booking-item">
          <div>
            <div><strong>${b.name}</strong> • ${b.guests}</div>
            <div style="color: var(--color-text-muted);">📅 ${b.date} о ${b.time} | 📞 ${b.phone}</div>
            ${b.notes ? `<div style="font-size: 12px; margin-top: 3px;">💬 ${b.notes}</div>` : ''}
          </div>
          <button type="button" class="booking-cancel-btn js-delete-booking" data-id="${b.id}">Скасувати</button>
        </div>
      `
      )
      .join('');

    listEl.querySelectorAll('.js-delete-booking').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const updated = getBookings().filter((item) => String(item.id) !== String(id));
        saveBookings(updated);
        showToast('Бронювання скасовано');
      });
    });
  }

  function validateTimeInRange(timeStr) {
    const match = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(timeStr.trim());
    if (!match) return false;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const totalMinutes = hours * 60 + minutes;
    // Кафе приймає бронювання з 08:30 (510 хв) до 22:00 (1320 хв)
    return totalMinutes >= 8 * 60 + 30 && totalMinutes <= 22 * 60;
  }

  function validateDateFormat(dateStr) {
    const match = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(202[6-9])$/.exec(dateStr.trim());
    if (!match) return false;
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const dateObj = new Date(year, month - 1, day);
    return (
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day
    );
  }

  function initBookingForm() {
    const form = document.getElementById('bookingForm');
    if (!form) return;

    applyPreorderNoteToForm();
    renderBookingsList();

    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const guestsInput = document.getElementById('guestsCount');
    const dateInput = document.getElementById('bookDate');
    const timeInput = document.getElementById('bookTime');
    const notesInput = document.getElementById('clientNotes');

    const clearAllBtn = document.getElementById('clearAllBookingsBtn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        saveBookings([]);
        showToast('Усі бронювання очищено');
      });
    }

    // Автоматичне форматування дати при введенні (ДД.ММ.РРРР)
    if (dateInput) {
      dateInput.addEventListener('input', () => {
        const isValid = validateDateFormat(dateInput.value);
        dateInput.setCustomValidity(isValid ? '' : 'Невірна дата у форматі ДД.ММ.РРРР');
      });
    }

    // Перевірка часу у діапазоні 08:30 – 22:00
    if (timeInput) {
      timeInput.addEventListener('input', () => {
        const isValid = validateTimeInRange(timeInput.value);
        timeInput.setCustomValidity(isValid ? '' : 'Час має бути між 08:30 та 22:00');
      });
    }

    // Перевірка телефону (щонайменше 10 цифр)
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        const digitsCount = (phoneInput.value.match(/\d/g) || []).length;
        const patternOk = /^\+?[0-9\s\-\(\)]{10,18}$/.test(phoneInput.value.trim());
        phoneInput.setCustomValidity(digitsCount >= 10 && patternOk ? '' : 'Введіть щонайменше 10 цифр');
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Додаткова перевірка перед відправкою
      if (dateInput && !validateDateFormat(dateInput.value)) {
        dateInput.setCustomValidity('Невірна дата');
      }
      if (timeInput && !validateTimeInRange(timeInput.value)) {
        timeInput.setCustomValidity('Невірний час');
      }

      if (!form.checkValidity()) {
        form.querySelectorAll('.form-control').forEach((input) => {
          if (!input.validity.valid) {
            input.classList.add('is-invalid');
          }
        });
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        showToast('⚠️ Перевірте правильність заповнення полів форми');
        return;
      }

      const newBooking = {
        id: Date.now(),
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        guests: guestsInput.value,
        date: dateInput.value.trim(),
        time: timeInput.value.trim(),
        notes: notesInput ? notesInput.value.trim() : ''
      };

      const currentBookings = getBookings();
      currentBookings.unshift(newBooking);
      saveBookings(currentBookings);

      openModal(
        '✅ Столик успішно заброньовано!',
        `
        <div>
          <p style="margin-bottom: 12px;">
            Дякуємо, <strong>${newBooking.name}</strong>! Вашу заявку прийнято. Чекаємо на вас у кафе «Жито &amp; М'ята».
          </p>
          <div class="card" style="margin-bottom: 16px; font-size: 14px;">
            <div><strong>📅 Дата та час:</strong> ${newBooking.date} о ${newBooking.time}</div>
            <div><strong>👥 Гостей:</strong> ${newBooking.guests}</div>
            <div><strong>📞 Телефон:</strong> ${newBooking.phone}</div>
            ${newBooking.notes ? `<div><strong>💬 Побажання:</strong> ${newBooking.notes}</div>` : ''}
          </div>
          <button type="button" class="btn btn-primary" id="bookingSuccessCloseBtn" style="width: 100%;">
            Чудово!
          </button>
        </div>
        `
      );

      const closeSuccessBtn = document.getElementById('bookingSuccessCloseBtn');
      if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', closeModal);
      }

      // Скидаємо текстові поля форми, залишаючи дефолтні дату і час з макета Figma
      nameInput.value = '';
      phoneInput.value = '';
      if (notesInput) notesInput.value = '';
      form.querySelectorAll('.form-control').forEach((el) => {
        el.classList.remove('is-invalid', 'is-valid');
      });

      showToast('🎉 Бронювання збережено!');
    });
  }

  /* --------------------------------------------------------------------------
     ІНІЦІАЛІЗАЦІЯ ПІСЛЯ ЗАВАНТАЖЕННЯ DOM
     -------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    ensureGlobalUI();
    initThemeManager();
    updateCartBadge();
    initDishCards();
    initMenuFilters();
    initBookingForm();
  });
})();
