-- =====================================================
-- SCRIPT DE EXPORTAÇÃO DE DADOS - MS BURGUER
-- Execute este SQL no seu próprio Supabase
-- =====================================================

-- IMPORTANTE: Primeiro execute o schema (migrations) no seu Supabase
-- O arquivo está em: supabase/migrations/20260115042428_remix_migration_from_pg_dump.sql

-- =====================================================
-- 1. PROFILES (usuários)
-- =====================================================
-- NOTA: Os user_id precisam existir no auth.users do seu Supabase
-- Você precisa criar os usuários primeiro via Auth

-- INSERT INTO profiles (id, user_id, name, email, phone, avatar_url, created_at, updated_at) VALUES
-- ('a6fc1fc6-e291-4c27-a874-c0099b964ddc', 'SEU_RESELLER_USER_ID', 'Michael', 'admin@gmail.com', NULL, NULL, now(), now()),
-- ('2b3c7e89-f09b-4b5e-a982-91a4640490e6', 'SEU_ADMIN_USER_ID', 'Admin MS BURGUER', 'restaurante@gmail.com', NULL, NULL, now(), now());

-- =====================================================
-- 2. USER_ROLES
-- =====================================================
-- INSERT INTO user_roles (user_id, role) VALUES
-- ('SEU_RESELLER_USER_ID', 'reseller'),
-- ('SEU_ADMIN_USER_ID', 'restaurant_admin');

-- =====================================================
-- 3. RESTAURANTS
-- =====================================================
INSERT INTO restaurants (id, name, slug, reseller_id, address, banner, logo, phone, whatsapp, delivery_time, delivery_fee, is_open, is_manual_mode, created_at, updated_at) VALUES
('0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'MS BURGUER', 'ms-burguer', 'SEU_RESELLER_USER_ID', NULL, NULL, NULL, NULL, NULL, '30-45 min', 0.00, true, true, now(), now());

-- NOTA: Substitua 'SEU_RESELLER_USER_ID' pelo user_id do reseller no seu Supabase

-- =====================================================
-- 4. RESTAURANT_SETTINGS
-- =====================================================
INSERT INTO restaurant_settings (id, restaurant_id, app_name, short_name, charge_mode, fixed_delivery_fee, min_delivery_time, max_delivery_time, loyalty_enabled, loyalty_points_per_real, loyalty_min_order_for_points, pix_key, pix_key_type, created_at, updated_at) VALUES
('7fef6499-dd67-451c-8b05-c2abf72cbbe9', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Cardápio', 'Cardápio', 'fixed', 0.00, 30, 50, false, 1, 0, NULL, NULL, now(), now());

-- =====================================================
-- 5. RESTAURANT_ADMINS
-- =====================================================
INSERT INTO restaurant_admins (id, restaurant_id, email, user_id, is_owner, password_hash, created_at, updated_at) VALUES
('c500dd24-a94d-4dce-8a84-d03f9731545e', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'restaurante@gmail.com', 'SEU_ADMIN_USER_ID', true, NULL, now(), now());

-- NOTA: Substitua 'SEU_ADMIN_USER_ID' pelo user_id do admin no seu Supabase

-- =====================================================
-- 6. CATEGORIES
-- =====================================================
INSERT INTO categories (id, restaurant_id, name, emoji, image_url, sort_order, active, created_at, updated_at) VALUES
('b49bab41-e321-4922-93c1-56e8b47ce44b', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Ofertas Exclusivas', '🍽️', NULL, 0, true, now(), now()),
('73822021-255a-4bad-a022-50932aee5ac3', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Combos', '🍽️', NULL, 1, true, now(), now()),
('07b64f92-ee1c-40c3-b1a4-d3af8fa36f1b', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Muuú Muuú', '🍽️', NULL, 2, true, now(), now()),
('e5f5a239-e09a-4248-a80d-504125adbce0', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Cocoricó', '🍽️', NULL, 3, true, now(), now()),
('268b91ca-e70c-488f-9840-07124055430d', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Oinc ... Oinc', '🍽️', NULL, 4, true, now(), now()),
('a5c8ced5-864e-4bb1-9717-f10dd1be28ba', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Sanduíche especial', '🍽️', NULL, 5, true, now(), now()),
('c9eac08c-fb76-4f76-9d42-e067fd224d98', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Sanduíches novos', '🍽️', NULL, 6, true, now(), now()),
('cc70bc25-a6a4-4c2d-9a07-fd4a26a62e37', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Açaí e outros', '🍽️', NULL, 7, true, now(), now()),
('78f2d5db-7a6c-4bfb-8132-485af5b0ad84', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Refeiçâo', '🍽️', NULL, 8, true, now(), now()),
('eb166157-310f-4328-9863-2b0536f7f206', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Saladas', '🍽️', NULL, 9, true, now(), now()),
('1b03c12d-0ca9-4a94-aeb7-56787cccc80f', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Bebidas', '🍽️', NULL, 10, true, now(), now()),
('b8ae56ec-f8ed-4d97-a0a8-93e1b36a613b', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Porções (1)', '🍽️', NULL, 11, true, now(), now());

-- =====================================================
-- 7. PRODUCTS (principais)
-- =====================================================
INSERT INTO products (id, restaurant_id, name, description, category, price, image_url, is_promo, promo_price, promo_expires_at, sold_out, active, visible, sort_order, extra_groups, created_at, updated_at) VALUES
('f36581e4-d5e1-491f-b994-a6570e5f9d41', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Big portuga', '3 paes 3 saladas 2 carnes de hamburguer 2 presuntos 2 queijos 2 porção de calabresas bacon 2 ovos 1 file de peito de frango', 'Ofertas Exclusivas', 33.75, 'https://static.ifood-static.com.br/image/upload/t_low/pratos/7f885f7a-eaba-4901-a9e3-c5c258fd1065/202304120514_4RU1_i.jpg', false, NULL, NULL, false, true, true, 0, '{}', now(), now()),
('f807833f-97f5-46e2-97b9-189bf6769408', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Pastel X tudo do portuga', 'Calabresa Salsicha frango Presunto queijo Coalho...acompanha nossa verdura fora aparte junto com nossa maionese temperada da casa', 'Ofertas Exclusivas', 7.60, NULL, false, NULL, NULL, false, true, true, 4, '{}', now(), now()),
('6f7540ab-208b-4d27-a23f-bd1a3ae56912', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Pastel carne muida do portuga', 'Carne muida queijo coalho Acompanha nossa verdura Acompanha nossa maionese especial', 'Ofertas Exclusivas', 9.00, NULL, false, NULL, NULL, false, true, true, 8, '{}', now(), now()),
('945e7d76-5516-4046-b1c3-ecb8050c5f0b', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Alaminuta do portuga refeiçao', 'Arroz empando de frango crocante batata frita alface e tomate', 'Ofertas Exclusivas', 19.00, NULL, false, NULL, NULL, false, true, true, 11, '{}', now(), now()),
('7d27868e-8014-421d-a11b-6ef49abbf797', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Combo x-bacon', 'X Bacon mais uma porção de batata frita, mais um refrigerante de 200 ml mais dois molhos especial', 'Combos', 35.00, NULL, false, NULL, NULL, false, true, true, 15, '{}', now(), now()),
('bffeebbb-99fa-4513-94a4-76286803ad40', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'X filé a portuguesa', 'Pão bola, pedacinhos de filé,queijo, vinagrete, molho barbecue, alface e tomate. Acompanha nossa maionese especial', 'Muuú Muuú', 11.50, NULL, false, NULL, NULL, false, true, true, 19, '{}', now(), now()),
('38c04b7c-25ff-4aa1-9fa4-27612b775fcc', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Doblo x do portuga', 'Pao bola 2 carnes de hamburguer 2 queijos mussarela alfacer duplo tomate duplo acompanha aparte nossa maionese da casa', 'Muuú Muuú', 19.00, NULL, false, NULL, NULL, false, true, true, 23, '{}', now(), now()),
('e96d23a1-593e-4482-a834-70a97ca90243', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'File mignon', 'Pão bola com gergelim, filé mignon e salada', 'Muuú Muuú', 19.50, NULL, false, NULL, NULL, false, true, true, 30, '{}', now(), now()),
('446943b4-327d-4e20-b73b-c36889dbd53e', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'X eeguer file de peito de frango', 'Pao bola peito de frango queijo mussarela ovo alface tomate acompanha aparte nossa maionese especial', 'Cocoricó', 16.25, NULL, false, NULL, NULL, false, true, true, 34, '{}', now(), now()),
('8797bef0-459b-4cb7-9b08-2ff28515c234', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 'Americano', 'Pão de caixa, queijo, ovo, presunto, salada.', 'Oinc ... Oinc', 4.20, NULL, false, NULL, NULL, false, true, true, 38, '{}', now(), now());

-- NOTA: O banco tem mais produtos. Execute a query abaixo para ver todos:
-- SELECT * FROM products WHERE restaurant_id = '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48';

-- =====================================================
-- 8. OPERATING_HOURS
-- =====================================================
INSERT INTO operating_hours (id, restaurant_id, day_of_week, start_time, end_time, active, created_at, updated_at) VALUES
('9fa623a0-0934-4e41-8c13-e3431cd873c3', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 0, '11:00:00', '23:00:00', false, now(), now()),
('bac53ab8-3603-4ba6-97e2-158c6f010b65', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 1, '11:00:00', '23:00:00', true, now(), now()),
('b04a93cd-9188-4949-8c1d-0a010b22a684', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 2, '11:00:00', '23:00:00', true, now(), now()),
('06d690e2-3de6-4a74-b5e7-1398f8fa0528', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 3, '11:00:00', '23:00:00', true, now(), now()),
('d1308c9f-9dd3-4a5d-838c-d53dc9ca6002', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 4, '11:00:00', '23:00:00', true, now(), now()),
('650f44aa-1b8b-4460-9738-b6404c932eac', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 5, '11:00:00', '23:00:00', true, now(), now()),
('1d21f527-9cd6-4818-b264-3039005b3061', '0eb4f640-7889-46e8-ab3b-1e4a3ba7dd48', 6, '11:00:00', '23:00:00', true, now(), now());

-- =====================================================
-- INSTRUÇÕES DE MIGRAÇÃO
-- =====================================================
/*
PASSO A PASSO:

1. CRIAR PROJETO SUPABASE
   - Vá em supabase.com e crie um novo projeto
   - Anote a URL e a anon key

2. EXECUTAR O SCHEMA
   - No SQL Editor do Supabase, execute o conteúdo do arquivo:
   - supabase/migrations/20260115042428_remix_migration_from_pg_dump.sql

3. CRIAR USUÁRIOS
   - No painel Auth do Supabase, crie os usuários:
   - Reseller: admin@gmail.com
   - Admin do restaurante: restaurante@gmail.com
   - Anote os user_id de cada um

4. SUBSTITUIR OS IDs
   - Neste arquivo, substitua:
   - 'SEU_RESELLER_USER_ID' pelo user_id do reseller
   - 'SEU_ADMIN_USER_ID' pelo user_id do admin

5. EXECUTAR ESTE SQL
   - Execute este arquivo no SQL Editor

6. CRIAR STORAGE BUCKETS
   - Vá em Storage e crie os buckets:
   - product-images (público)
   - category-images (público)

7. CONECTAR LOVABLE
   - Crie novo projeto no Lovable
   - Settings → Connectors → Supabase → Conectar
   - Use a URL e anon key do seu projeto
*/
