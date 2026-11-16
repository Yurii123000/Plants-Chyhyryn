-- ====================================================================
-- СХЕМА БАЗИ ДАНИХ ТА НАЛАШТУВАННЯ ДЛЯ SUPABASE (BOTANICA)
-- ====================================================================
-- Скопіюйте весь вміст цього файлу та виконайте у вкладці:
-- Supabase Dashboard -> SQL Editor -> New query -> Run
-- ====================================================================

-- 1. СТВОРЕННЯ ТАБЛИЦІ РОСЛИН (plants)
create table if not exists public.plants (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    price numeric not null,
    description text default '',
    image_url text not null,
    image_path text default '',
    is_available boolean default true
);

-- Коментарі до колонок
comment on table public.plants is 'Таблиця декоративних рослин сайту-вітрини';
comment on column public.plants.name is 'Назва рослини';
comment on column public.plants.price is 'Ціна рослини в гривнях';
comment on column public.plants.description is 'Опис догляду, розмір та особливості';
comment on column public.plants.image_url is 'Пряме публічне посилання на фотографію';
comment on column public.plants.image_path is 'Шлях до файлу в Supabase Storage (для подальшого видалення)';

-- 2. УВІМКНЕННЯ ROW LEVEL SECURITY (RLS)
alter table public.plants enable row level security;

-- 3. ПОЛІТИКИ БЕЗПЕКИ ДЛЯ ТАБЛИЦІ plants
-- Дозволити читання всім відвідувачам (публічний доступ)
drop policy if exists "Дозволити читання рослин усім" on public.plants;
create policy "Дозволити читання рослин усім"
    on public.plants
    for select
    using (true);

-- Дозволити додавання нових рослин
drop policy if exists "Дозволити додавання рослин" on public.plants;
create policy "Дозволити додавання рослин"
    on public.plants
    for insert
    with check (true);

-- Дозволити оновлення рослин
drop policy if exists "Дозволити оновлення рослин" on public.plants;
create policy "Дозволити оновлення рослин"
    on public.plants
    for update
    using (true);

-- Дозволити видалення рослин
drop policy if exists "Дозволити видалення рослин" on public.plants;
create policy "Дозволити видалення рослин"
    on public.plants
    for delete
    using (true);

-- 4. СТВОРЕННЯ БАКЕТА СХОВИЩА (STORAGE BUCKET) ДЛЯ ФОТО
-- Створюємо публічний бакет 'plant-photos', якщо його ще не існує
insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do update set public = true;

-- 5. ПОЛІТИКИ БЕЗПЕКИ ДЛЯ СХОВИЩА ФОТОГРАФІЙ (storage.objects)
-- Дозволити перегляд фотографій усім
drop policy if exists "Публічний перегляд фотографій рослин" on storage.objects;
create policy "Публічний перегляд фотографій рослин"
    on storage.objects
    for select
    using (bucket_id = 'plant-photos');

-- Дозволити завантаження фотографій рослин
drop policy if exists "Завантаження фотографій рослин" on storage.objects;
create policy "Завантаження фотографій рослин"
    on storage.objects
    for insert
    with check (bucket_id = 'plant-photos');

-- Дозволити оновлення файлів у бакеті рослин
drop policy if exists "Оновлення фотографій рослин" on storage.objects;
create policy "Оновлення фотографій рослин"
    on storage.objects
    for update
    using (bucket_id = 'plant-photos');

-- Дозволити видалення фотографій при видаленні рослини
drop policy if exists "Видалення фотографій рослин" on storage.objects;
create policy "Видалення фотографій рослин"
    on storage.objects
    for delete
    using (bucket_id = 'plant-photos');
