/**
 * ГОЛОВНИЙ СКРИПТ ВІТРИНИ (BOTANICA) - index.html
 * ==============================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Ініціалізація текстових налаштувань з config.js
  applySiteConfig();

  // 2. Стан додатку
  let allPlants = [];
  let currentSelectedPlant = null;

  // DOM Елементи
  const plantsGrid = document.getElementById('plantsGrid');
  const searchInput = document.getElementById('searchInput');
  const plantsCountText = document.getElementById('plantsCountText');
  const demoNotification = document.getElementById('demoNotification');

  // Елементи модального вікна замовлення
  const orderModal = document.getElementById('orderModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalPlantImg = document.getElementById('modalPlantImg');
  const modalPlantTitle = document.getElementById('modalPlantTitle');
  const modalPlantPrice = document.getElementById('modalPlantPrice');
  const modalMessageText = document.getElementById('modalMessageText');
  const modalTelegramBtn = document.getElementById('modalTelegramBtn');
  const copyMessageBtn = document.getElementById('copyMessageBtn');
  const copyBtnText = document.getElementById('copyBtnText');

  // Елементи вікна деталей
  const detailModal = document.getElementById('detailModal');
  const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
  const detailModalImg = document.getElementById('detailModalImg');
  const detailPlantName = document.getElementById('detailPlantName');
  const detailPlantPrice = document.getElementById('detailPlantPrice');
  const detailPlantDesc = document.getElementById('detailPlantDesc');
  const detailOrderBtn = document.getElementById('detailOrderBtn');

  // 3. Перевірка демонстраційного режиму
  if (window.botanicalService.isDemoMode) {
    if (demoNotification) demoNotification.style.display = 'flex';
  }

  // 4. Завантаження рослин
  loadPlants();

  // 5. Події пошуку
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterPlants(query);
  });

  // Закриття модальних вікон
  closeModalBtn.addEventListener('click', closeOrderModal);
  closeDetailModalBtn.addEventListener('click', closeDetailModal);

  orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) closeOrderModal();
  });

  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeDetailModal();
  });

  // Копіювання тексту замовлення
  copyMessageBtn.addEventListener('click', () => {
    const textToCopy = modalMessageText.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      copyBtnText.textContent = '✓ Текст скопійовано!';
      setTimeout(() => {
        copyBtnText.textContent = 'Скопіювати текст повідомлення';
      }, 2500);
      showToast('Текст замовлення скопійовано в буфер обміну', 'success');
    }).catch(err => {
      console.error('Помилка копіювання:', err);
    });
  });

  // Перехід до замовлення з вікна деталей
  detailOrderBtn.addEventListener('click', () => {
    closeDetailModal();
    if (currentSelectedPlant) {
      openOrderModal(currentSelectedPlant);
    }
  });

  // Закриття по Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOrderModal();
      closeDetailModal();
    }
  });

  /**
   * Завантаження списку рослин
   */
  async function loadPlants() {
    try {
      const { data, error } = await window.botanicalService.getPlants();

      if (error) {
        throw error;
      }

      allPlants = data || [];
      renderPlants(allPlants);
    } catch (err) {
      console.error('Помилка отримання рослин:', err);
      plantsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3 class="empty-title">Не вдалося завантажити рослини</h3>
          <p class="empty-subtitle">Перевірте підключення до мережі або налаштування Supabase у файлі config.js.</p>
        </div>
      `;
      plantsCountText.textContent = 'Помилка завантаження';
    }
  }

  /**
   * Відображення карток рослин у сітці
   */
  function renderPlants(plants) {
    plantsCountText.innerHTML = `В наявності: <strong>${plants.length}</strong> ${getPlantWord(plants.length)}`;

    if (!plants || plants.length === 0) {
      plantsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h3 class="empty-title">Колекція оновлюється</h3>
          <p class="empty-subtitle">Наразі немає доданих позицій або нічого не знайдено за вашим запитом. Завітайте згодом!</p>
        </div>
      `;
      return;
    }

    plantsGrid.innerHTML = plants.map(plant => `
      <article class="plant-card" data-id="${plant.id}">
        <div class="card-media" onclick="window.viewPlantDetail('${plant.id}')" style="cursor: pointer;">
          <img src="${escapeHtml(plant.image_url)}" alt="${escapeHtml(plant.name)}" class="card-img" loading="lazy">
          <span class="card-price-badge">${formatPrice(plant.price)} ${CONFIG.CURRENCY}</span>
        </div>

        <div class="card-body">
          <h3 class="card-title" onclick="window.viewPlantDetail('${plant.id}')" style="cursor: pointer;">
            ${escapeHtml(plant.name)}
          </h3>
          <p class="card-desc">
            ${escapeHtml(plant.description || 'Декоративна кімнатна рослина для гармонійного інтер\'єру.')}
          </p>

          <div class="card-footer">
            <div class="card-price-text">
              ${formatPrice(plant.price)} <span>${CONFIG.CURRENCY}</span>
            </div>

            <button type="button" class="btn-order" onclick="window.initOrder('${plant.id}')">
              <span>Замовити</span>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.196 1.006.128.83.946z"/>
              </svg>
            </button>
          </div>
        </div>
      </article>
    `).join('');
  }

  /**
   * Фільтрація рослин через поле пошуку
   */
  function filterPlants(query) {
    if (!query) {
      renderPlants(allPlants);
      return;
    }

    const filtered = allPlants.filter(plant => {
      const name = (plant.name || '').toLowerCase();
      const desc = (plant.description || '').toLowerCase();
      return name.includes(query) || desc.includes(query);
    });

    renderPlants(filtered);
  }

  /**
   * Відкриття модального вікна замовлення через Telegram
   */
  window.initOrder = function(plantId) {
    const plant = allPlants.find(p => p.id === plantId);
    if (!plant) return;

    currentSelectedPlant = plant;

    modalPlantImg.src = plant.image_url;
    modalPlantTitle.textContent = plant.name;
    modalPlantPrice.textContent = `${formatPrice(plant.price)} ${CONFIG.CURRENCY}`;

    // Формування персоналізованого тексту повідомлення для Telegram
    const orderMessage = `Добрий день! Хочу замовити рослину: «${plant.name}» (ціна: ${formatPrice(plant.price)} ${CONFIG.CURRENCY}). Підкажіть, будь ласка, наявність та деталі доставки.`;
    modalMessageText.textContent = `«${orderMessage}»`;

    // Посилання на прямий перехід у діалог Telegram із заповненим текстом
    const telegramUrl = `https://t.me/${CONFIG.TELEGRAM_USERNAME}?text=${encodeURIComponent(orderMessage)}`;
    modalTelegramBtn.href = telegramUrl;

    orderModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  /**
   * Перегляд детальної інформації про рослину
   */
  window.viewPlantDetail = function(plantId) {
    const plant = allPlants.find(p => p.id === plantId);
    if (!plant) return;

    currentSelectedPlant = plant;

    detailModalImg.src = plant.image_url;
    detailPlantName.textContent = plant.name;
    detailPlantPrice.textContent = `${formatPrice(plant.price)} ${CONFIG.CURRENCY}`;
    detailPlantDesc.textContent = plant.description || 'Невибаглива та доглянута рослина, що стане окрасою вашого дому.';

    detailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  function closeOrderModal() {
    orderModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function closeDetailModal() {
    detailModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Застосування текстових змінних з config.js
   */
  function applySiteConfig() {
    if (document.getElementById('siteTitle')) {
      document.getElementById('siteTitle').textContent = CONFIG.SITE_NAME || 'Botanica';
    }
    if (document.getElementById('siteSubtitle')) {
      document.getElementById('siteSubtitle').textContent = CONFIG.SITE_SUBTITLE || 'Колекція декоративних рослин • Чигирин';
    }
    if (document.getElementById('footerLocation')) {
      document.getElementById('footerLocation').textContent = `📍 ${CONFIG.LOCATION || 'м. Чигирин, Черкаська обл.'}`;
    }
    if (document.getElementById('footerPhone')) {
      document.getElementById('footerPhone').textContent = `📞 ${CONFIG.PHONE_NUMBER || '+38 (098) 000-00-00'}`;
    }
    if (document.getElementById('telegramUsernameText')) {
      document.getElementById('telegramUsernameText').textContent = CONFIG.TELEGRAM_USERNAME || 'botanica';
    }
    if (document.getElementById('footerTelegramLink')) {
      document.getElementById('footerTelegramLink').href = `https://t.me/${CONFIG.TELEGRAM_USERNAME || 'botanica'}`;
    }
    if (document.getElementById('telegramHeaderLink')) {
      document.getElementById('telegramHeaderLink').href = `https://t.me/${CONFIG.TELEGRAM_USERNAME || 'botanica'}`;
    }
    if (document.getElementById('currentYear')) {
      document.getElementById('currentYear').textContent = new Date().getFullYear();
    }
  }

  // Допоміжні функції форматування
  function formatPrice(price) {
    return Number(price).toLocaleString('uk-UA');
  }

  function getPlantWord(count) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod10 === 1 && mod100 !== 11) return 'рослина';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'рослини';
    return 'рослин';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
