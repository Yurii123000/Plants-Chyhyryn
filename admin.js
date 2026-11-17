/**
 * ЛОГІКА ПАНЕЛІ АДМІНІСТРАТОРА (BOTANICA) - admin.html
 * ====================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Стан панелі
  let selectedPhotoFile = null;
  let plantToDelete = null;

  // DOM: Авторизація
  const authScreen = document.getElementById('authScreen');
  const adminDashboard = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('loginForm');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const logoutBtn = document.getElementById('logoutBtn');

  // DOM: Статус Supabase
  const supabaseStatusBadge = document.getElementById('supabaseStatusBadge');
  const supabaseStatusText = document.getElementById('supabaseStatusText');
  const setupHelpCard = document.getElementById('setupHelpCard');

  // DOM: Форма додавання
  const addPlantForm = document.getElementById('addPlantForm');
  const plantFileInput = document.getElementById('plantFileInput');
  const dropzone = document.getElementById('dropzone');
  const previewContainer = document.getElementById('previewContainer');
  const previewImg = document.getElementById('previewImg');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  const plantNameInput = document.getElementById('plantNameInput');
  const plantPriceInput = document.getElementById('plantPriceInput');
  const plantDescInput = document.getElementById('plantDescInput');
  const publishBtn = document.getElementById('publishBtn');
  const publishBtnText = document.getElementById('publishBtnText');
  const publishSpinner = document.getElementById('publishSpinner');

  // DOM: Список рослин
  const adminPlantsContainer = document.getElementById('adminPlantsContainer');
  const adminListSubtitle = document.getElementById('adminListSubtitle');
  const refreshListBtn = document.getElementById('refreshListBtn');

  // DOM: Модальне вікно видалення
  const confirmDeleteModal = document.getElementById('confirmDeleteModal');
  const deleteConfirmMessage = document.getElementById('deleteConfirmMessage');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const confirmDeleteActionBtn = document.getElementById('confirmDeleteActionBtn');

  // 1. ПЕРЕВІРКА АВТОРИЗАЦІЇ
  const isAuthenticated = sessionStorage.getItem('botanica_admin_auth') === 'true';
  if (isAuthenticated) {
    showDashboard();
  } else {
    showAuth();
  }

  // Обробка входу
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPassword = adminPasswordInput.value.trim();
    const correctPassword = (CONFIG.ADMIN_PASSWORD || 'My plans2026').trim();

    if (enteredPassword === correctPassword) {
      sessionStorage.setItem('botanica_admin_auth', 'true');
      showDashboard();
      showToast('Успішний вхід до панелі керування', 'success');
    } else {
      showToast('Невірний пароль! Спробуйте ще раз', 'error');
      adminPasswordInput.value = '';
      adminPasswordInput.focus();
    }
  });

  // Вихід з кабінету
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('botanica_admin_auth');
    showAuth();
    showToast('Ви вийшли з кабінету адміністратора', 'info');
  });

  function showAuth() {
    authScreen.style.display = 'block';
    adminDashboard.style.display = 'none';
  }

  function showDashboard() {
    authScreen.style.display = 'none';
    adminDashboard.style.display = 'block';
    updateSupabaseStatus();
    loadAdminPlants();
  }

  // 2. СТАТУС ПІДКЛЮЧЕННЯ SUPABASE
  function updateSupabaseStatus() {
    const isConnected = window.botanicalService.isSupabaseConnected();

    if (isConnected) {
      supabaseStatusBadge.style.background = '#EEF3EF';
      supabaseStatusBadge.style.color = 'var(--accent-sage)';
      supabaseStatusBadge.querySelector('span:first-child').style.background = '#4A6B53';
      supabaseStatusText.textContent = 'Supabase підключено';
      setupHelpCard.style.display = 'none';
    } else {
      supabaseStatusBadge.style.background = '#FAF5EB';
      supabaseStatusBadge.style.color = '#8A6A2E';
      supabaseStatusBadge.querySelector('span:first-child').style.background = '#C9933B';
      supabaseStatusText.textContent = 'Демо-режим (локально)';
      setupHelpCard.style.display = 'block';
    }
  }

  // 3. ОБРОБКА ВИБОРУ ТА ПЕРЕТЯГУВАННЯ ФОТО
  plantFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handlePhotoFile(file);
  });

  // Drag and drop події для дропзони
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handlePhotoFile(files[0]);
    }
  });

  function handlePhotoFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Будь ласка, оберіть файл зображення (JPG, PNG, WEBP)', 'error');
      return;
    }

    selectedPhotoFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      dropzone.style.display = 'none';
      previewContainer.classList.add('active');
    };
    reader.readAsDataURL(file);
  }

  removePhotoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetPhotoUpload();
  });

  function resetPhotoUpload() {
    selectedPhotoFile = null;
    plantFileInput.value = '';
    previewImg.src = '';
    previewContainer.classList.remove('active');
    dropzone.style.display = 'block';
  }

  // 4. ДОДАВАННЯ РОСЛИНИ НА САЙТ
  addPlantForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedPhotoFile) {
      showToast('Будь ласка, додайте фотографію рослини', 'error');
      return;
    }

    const name = plantNameInput.value.trim();
    const price = parseFloat(plantPriceInput.value);
    const description = plantDescInput.value.trim();

    if (!name || isNaN(price) || price <= 0) {
      showToast('Заповніть коректно назву та ціну рослини', 'error');
      return;
    }

    // Встановлюємо стан завантаження
    setPublishingState(true, 'Завантаження фото у сховище...');

    try {
      // 1. Завантаження фото в Supabase Storage
      const { imageUrl, imagePath, error: uploadError } = await window.botanicalService.uploadPhoto(selectedPhotoFile);

      if (uploadError || !imageUrl) {
        throw uploadError || new Error('Не вдалося отримати публічне посилання на фото');
      }

      setPublishingState(true, 'Збереження запису в базу даних...');

      // 2. Збереження запису в таблицю plants
      const { error: dbError } = await window.botanicalService.addPlant({
        name,
        price,
        description,
        imageUrl,
        imagePath
      });

      if (dbError) {
        throw dbError;
      }

      // Успішно!
      showToast(`Рослину «${name}» успішно опубліковано на сайті!`, 'success');

      // Очищення форми
      addPlantForm.reset();
      resetPhotoUpload();

      // Оновлюємо список
      await loadAdminPlants();

    } catch (err) {
      console.error('Помилка додавання рослини:', err);
      showToast('Помилка при публікації: ' + (err.message || 'Перевірте налаштування'), 'error');
    } finally {
      setPublishingState(false);
    }
  });

  function setPublishingState(isLoading, text = 'Опублікувати на сайті') {
    if (isLoading) {
      publishBtn.disabled = true;
      publishBtnText.textContent = text;
      publishSpinner.style.display = 'block';
    } else {
      publishBtn.disabled = false;
      publishBtnText.textContent = 'Опублікувати на сайті';
      publishSpinner.style.display = 'none';
    }
  }

  // 5. ЗАВАНТАЖЕННЯ СПИСКУ РОСЛИН
  refreshListBtn.addEventListener('click', loadAdminPlants);

  async function loadAdminPlants() {
    adminPlantsContainer.innerHTML = `
      <div style="padding: 2.5rem; text-align: center; color: var(--text-muted);">
        Оновлення списку...
      </div>
    `;

    try {
      const { data, error } = await window.botanicalService.getPlants();

      if (error) throw error;

      const plants = data || [];
      adminListSubtitle.textContent = `Всього на сайті: ${plants.length} позицій`;

      if (plants.length === 0) {
        adminPlantsContainer.innerHTML = `
          <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
            Наразі немає жодної рослини на сайті. Додайте першу з форми ліворуч!
          </div>
        `;
        return;
      }

      adminPlantsContainer.innerHTML = plants.map(plant => `
        <div class="admin-plant-row" id="row-${plant.id}">
          <img src="${escapeHtml(plant.image_url)}" alt="${escapeHtml(plant.name)}" class="admin-plant-thumb">
          
          <div class="admin-plant-details">
            <h4 class="admin-plant-name">${escapeHtml(plant.name)}</h4>
            <div class="admin-plant-meta">
              Додано: ${formatDate(plant.created_at)}
              ${plant.description ? ` • ${escapeHtml(plant.description.substring(0, 60))}...` : ''}
            </div>
          </div>

          <div class="admin-plant-price">
            ${formatPrice(plant.price)} грн
          </div>

          <button type="button" class="btn-danger" onclick="window.askDeletePlant('${plant.id}', '${encodeURIComponent(plant.name)}', '${plant.image_path || ''}')" title="Видалити рослину">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Видалити</span>
          </button>
        </div>
      `).join('');

    } catch (err) {
      console.error('Помилка завантаження списку в адмінці:', err);
      adminPlantsContainer.innerHTML = `
        <div style="padding: 2.5rem; text-align: center; color: var(--danger-color);">
          Не вдалося завантажити список рослин. Перевірте консоль браузера.
        </div>
      `;
    }
  }

  // 6. ВИДАЛЕННЯ РОСЛИНИ З ПІДТВЕРДЖЕННЯМ
  window.askDeletePlant = function(id, encodedName, imagePath) {
    const name = decodeURIComponent(encodedName);
    plantToDelete = { id, name, imagePath };

    deleteConfirmMessage.innerHTML = `Ви впевнені, що хочете видалити рослину <strong>«${escapeHtml(name)}»</strong>? Її фотографію також буде стерто зі сховища Supabase Storage.`;
    confirmDeleteModal.classList.add('active');
  };

  cancelDeleteBtn.addEventListener('click', () => {
    confirmDeleteModal.classList.remove('active');
    plantToDelete = null;
  });

  confirmDeleteModal.addEventListener('click', (e) => {
    if (e.target === confirmDeleteModal) {
      confirmDeleteModal.classList.remove('active');
      plantToDelete = null;
    }
  });

  confirmDeleteActionBtn.addEventListener('click', async () => {
    if (!plantToDelete) return;

    const { id, name, imagePath } = plantToDelete;
    confirmDeleteModal.classList.remove('active');

    try {
      const { success, error } = await window.botanicalService.deletePlant(id, imagePath);

      if (error || !success) {
        throw error || new Error('Помилка при видаленні');
      }

      showToast(`Рослину «${name}» видалено`, 'info');
      await loadAdminPlants();

    } catch (err) {
      console.error('Помилка видалення:', err);
      showToast('Не вдалося видалити: ' + (err.message || 'Спробуйте ще раз'), 'error');
    } finally {
      plantToDelete = null;
    }
  });

  // Допоміжні функції
  function formatPrice(price) {
    return Number(price).toLocaleString('uk-UA');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
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
