/**
 * КОНФІГУРАЦІЯ САЙТУ «BOTANICA» (Рослини Чигирин)
 * ==============================================
 * 
 * Для підключення до вашої бази даних Supabase:
 * 1. Зареєструйтесь на https://supabase.com (це безкоштовно)
 * 2. Створіть новий проєкт
 * 3. Перейдіть у Project Settings -> API
 * 4. Скопіюйте Project URL та anon public key і вставте їх нижче.
 * 5. Виконайте SQL-скрипт з файлу schema.sql у вкладці SQL Editor вашого Supabase.
 */

const CONFIG = {
  // Посилання на ваш проєкт Supabase (наприклад: 'https://abcdefghijklm.supabase.co')
  // Якщо залишити порожнім, сайт працюватиме в демонстраційному режимі з красивими прикладами рослин
  SUPABASE_URL: 'https://ostoqxpccrxnntrcxbsb.supabase.co',

  // Публічний анонімний ключ (anon public) з налаштувань API Supabase
  SUPABASE_ANON_KEY: 'sb_publishable_h9BwgbMIMbKLKR2_-eUDNA_uGya3nU9',

  // Назва таблиці з рослинами в базі даних Supabase
  PLANTS_TABLE: 'plants',

  // Назва сховища (Storage Bucket) у Supabase для зберігання фотографій рослин
  STORAGE_BUCKET: 'plant-photos',

  // Ваш логін (username) у Telegram без знака @ для отримання замовлень
  // Клієнт при замовленні перейде в діалог з вами з готовим текстом
  TELEGRAM_USERNAME: '+38 (093)0633397',

  // Номер телефону для зв'язку (за бажанням)
  PHONE_NUMBER: '+38 (093)0633397',

  // Пароль для входу в панель адміністратора (admin.html)
  // ОБОВ'ЯЗКОВО змініть на власний надійний пароль!
  ADMIN_PASSWORD: 'My plans2026',

  // Загальні текстові налаштування
  SITE_NAME: 'Рослини Чигирин',
  SITE_SUBTITLE: 'Колекція декоративних та кімнатних рослин • Чигирин',
  LOCATION: 'с.Рацеве, Черкаська обл.',
  CURRENCY: 'грн'
};
