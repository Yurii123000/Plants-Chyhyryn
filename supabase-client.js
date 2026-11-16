/**
 * КЛІЄНТ ТА СЕРВІС РОБОТИ З SUPABASE (BOTANICA)
 * ============================================
 * Забезпечує підключення, завантаження фото в сховище,
 * отримання та видалення рослин.
 * Якщо ключі Supabase ще не налаштовані, автоматично
 * активує демонстраційний режим із збереженням у LocalStorage.
 */

// Демо-дані на випадок, якщо Supabase ще не налаштовано
const DEMO_PLANTS = [
  {
    id: 'demo-1',
    name: 'Монстера Деліціоза (Monstera Deliciosa)',
    price: 780,
    description: 'Висота 70 см, горщик 19 см. Розкішне різьблене листя, витривала, ідеальна для світлих кімнат без прямих сонячних променів. Полив 1 раз на тиждень.',
    image_url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=1000&q=80',
    image_path: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString()
  },
  {
    id: 'demo-2',
    name: 'Фікус Лірата (Ficus Lyrata)',
    price: 950,
    description: 'Висота 85 см, горщик 21 см. Велике скрипкоподібне листя глибокого зеленого кольору. Любить яскраве розсіяне світло та помірне зволоження ґрунту.',
    image_url: 'https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&w=1000&q=80',
    image_path: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'demo-3',
    name: 'Оливкове Дерево (Olea Europaea)',
    price: 1250,
    description: 'Висота 60 см, керамічний горщик. Середземноморський шарм, сріблясто-зелене листя. Добре переносить сонячні підвіконня та сухе повітря.',
    image_url: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1000&q=80',
    image_path: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: 'demo-4',
    name: 'Калатея Орбіфолія (Calathea Orbifolia)',
    price: 520,
    description: 'Висота 45 см, горщик 14 см. Кругле листя з графічними сріблястими смугами. Ввечері підіймає листя. Потребує високої вологості та напівтіні.',
    image_url: 'https://images.unsplash.com/photo-1599598425947-630b91e99d85?auto=format&fit=crop&w=1000&q=80',
    image_path: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString()
  },
  {
    id: 'demo-5',
    name: 'Заміокулькас (Zamioculcas Zamiifolia)',
    price: 640,
    description: 'Висота 65 см, горщик 17 см. Глянцеве темно-зелене листя. Надзвичайно невибагливий: переносить затінок та рідкісний полив раз на 2–3 тижні.',
    image_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=1000&q=80',
    image_path: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString()
  },
  {
    id: 'demo-6',
    name: 'Сансевієрія Лауренті (Sansevieria Laurentii)',
    price: 490,
    description: 'Висота 55 см, горщик 15 см. Елегантне вертикальне листя з золотисто-жовтою облямівкою. Потужний природний очищувач повітря, легкий у догляді.',
    image_url: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?auto=format&fit=crop&w=1000&q=80',
    image_path: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 6).toISOString()
  }
];

class BotanicalService {
  constructor() {
    this.client = null;
    this.isDemoMode = false;
    this.init();
  }

  init() {
    const hasUrl = CONFIG.SUPABASE_URL && CONFIG.SUPABASE_URL.trim().length > 10 && !CONFIG.SUPABASE_URL.includes('YOUR_PROJECT');
    const hasKey = CONFIG.SUPABASE_ANON_KEY && CONFIG.SUPABASE_ANON_KEY.trim().length > 20 && !CONFIG.SUPABASE_ANON_KEY.includes('YOUR_ANON');

    if (hasUrl && hasKey && window.supabase) {
      try {
        this.client = window.supabase.createClient(CONFIG.SUPABASE_URL.trim(), CONFIG.SUPABASE_ANON_KEY.trim());
        this.isDemoMode = false;
        console.info('🌿 [Botanica] Успішно підключено до Supabase!');
      } catch (err) {
        console.warn('⚠️ [Botanica] Помилка ініціалізації Supabase. Перемикання в демо-режим:', err);
        this.isDemoMode = true;
      }
    } else {
      this.isDemoMode = true;
      console.info('ℹ️ [Botanica] Працює в демонстраційному режимі. Щоб підключити базу, заповніть config.js');
    }
  }

  /**
   * Чи підключено сайт до реального Supabase
   */
  isSupabaseConnected() {
    return !this.isDemoMode && this.client !== null;
  }

  /**
   * Отримати список усіх рослин (найновіші спочатку)
   */
  async getPlants() {
    if (this.isDemoMode) {
      // Отримуємо збережені в localStorage демо-дані або дефолтні
      const stored = localStorage.getItem('botanica_demo_plants');
      if (stored) {
        try {
          return { data: JSON.parse(stored), error: null };
        } catch (e) {
          console.error(e);
        }
      }
      return { data: DEMO_PLANTS, error: null };
    }

    try {
      const { data, error } = await this.client
        .from(CONFIG.PLANTS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Помилка завантаження рослин з Supabase:', error);
      return { data: [], error };
    }
  }

  /**
   * Завантаження фотографії у Supabase Storage
   * @param {File} file - файл фотографії
   * @returns {Promise<{imageUrl: string, imagePath: string, error: any}>}
   */
  async uploadPhoto(file) {
    if (this.isDemoMode) {
      // У демо-режимі конвертуємо в Base64 Data URL для збереження в LocalStorage
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            imageUrl: reader.result,
            imagePath: 'demo/' + Date.now() + '_' + file.name,
            error: null
          });
        };
        reader.onerror = (err) => resolve({ imageUrl: null, imagePath: null, error: err });
        reader.readAsDataURL(file);
      });
    }

    try {
      // Формуємо унікальне та безпечне ім'я файлу
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanName = file.name
        .substring(0, file.name.lastIndexOf('.'))
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 20);
      const fileName = `plant_${Date.now()}_${cleanName}.${ext}`;
      const filePath = `${fileName}`;

      // Завантажуємо файл у бакет 'plant-photos'
      const { data: uploadData, error: uploadError } = await this.client.storage
        .from(CONFIG.STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Отримуємо публічне посилання на фото
      const { data: urlData } = this.client.storage
        .from(CONFIG.STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return {
        imageUrl: urlData.publicUrl,
        imagePath: filePath,
        error: null
      };
    } catch (error) {
      console.error('Помилка завантаження фото у Supabase Storage:', error);
      return { imageUrl: null, imagePath: null, error };
    }
  }

  /**
   * Додати нову рослину в базу
   * @param {Object} plantData - { name, price, description, imageUrl, imagePath }
   */
  async addPlant({ name, price, description, imageUrl, imagePath }) {
    const newRecord = {
      name: name.trim(),
      price: parseFloat(price) || 0,
      description: (description || '').trim(),
      image_url: imageUrl,
      image_path: imagePath || null,
      is_available: true,
      created_at: new Date().toISOString()
    };

    if (this.isDemoMode) {
      const { data: currentPlants } = await this.getPlants();
      const updated = [{ ...newRecord, id: 'demo-' + Date.now() }, ...currentPlants];
      localStorage.setItem('botanica_demo_plants', JSON.stringify(updated));
      return { data: [newRecord], error: null };
    }

    try {
      const { data, error } = await this.client
        .from(CONFIG.PLANTS_TABLE)
        .insert([newRecord])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Помилка збереження рослини у Supabase:', error);
      return { data: null, error };
    }
  }

  /**
   * Видалити рослину та її фото зі сховища
   * @param {string} id - ідентифікатор рослини
   * @param {string} imagePath - шлях до фото в Storage
   */
  async deletePlant(id, imagePath) {
    if (this.isDemoMode) {
      const { data: currentPlants } = await this.getPlants();
      const updated = currentPlants.filter(p => p.id !== id);
      localStorage.setItem('botanica_demo_plants', JSON.stringify(updated));
      return { success: true, error: null };
    }

    try {
      // 1. Видаляємо запис із таблиці plants
      const { error: dbError } = await this.client
        .from(CONFIG.PLANTS_TABLE)
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      // 2. Якщо є шлях до фото у бакеті — видаляємо файл зі Storage
      if (imagePath && imagePath.trim().length > 0) {
        const { error: storageError } = await this.client.storage
          .from(CONFIG.STORAGE_BUCKET)
          .remove([imagePath]);

        if (storageError) {
          console.warn('Попередження: не вдалося видалити файл фото з Storage:', storageError);
        }
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Помилка видалення рослини:', error);
      return { success: false, error };
    }
  }

  /**
   * Скинути демо-дані до початкових (для тестування)
   */
  resetDemoData() {
    localStorage.removeItem('botanica_demo_plants');
  }
}

// Створюємо глобальний екземпляр сервісу
window.botanicalService = new BotanicalService();
