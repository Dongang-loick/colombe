-- ============================================================
-- Colombe céleste — schéma Supabase
-- À exécuter UNE SEULE FOIS dans Supabase : Dashboard → SQL Editor → New query → coller → Run
-- ============================================================

-- ---------- Coordonnées (une seule ligne) ----------
create table if not exists settings (
  id int primary key default 1,
  responsable text default '[Nom du responsable à compléter]',
  phone text default '[Numéro à compléter]',
  email text default '[Adresse e-mail à compléter]',
  address text default '[Adresse à compléter]',
  message_endpoint text default '',
  cloudinary_cloud text default '',
  cloudinary_preset text default '',
  constraint settings_single_row check (id = 1)
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- ---------- Qui sommes-nous : présentation + verset (une seule ligne) ----------
create table if not exists about (
  id int primary key default 1,
  paragraph1 text default '',
  paragraph2 text default '',
  verse_text text default '',
  verse_ref text default '',
  constraint about_single_row check (id = 1)
);
insert into about (id, paragraph1, paragraph2, verse_text, verse_ref) values (
  1,
  'La chorale Colombe céleste réunit des choristes de l''aumônerie protestante du génie militaire, animés par une même envie : chanter la foi avec ferveur et partager la joie de l''Évangile en musique, du negro spiritual au gospel contemporain.',
  'Née au cœur de la vie de l''aumônerie, la chorale accompagne les cultes, les temps de recueillement et les célébrations de la communauté militaire et de leurs familles.',
  'Chantez à l''Éternel un cantique nouveau, car il a fait des merveilles.',
  'Psaume 98:1'
) on conflict (id) do nothing;

-- ---------- Cartes de valeurs ----------
create table if not exists about_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ---------- Photos ----------
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text default '',
  created_at timestamptz default now()
);

-- ---------- Vidéos ----------
create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  title text default '',
  description text default '',
  thumbnail text,
  file_size_kb int,
  created_at timestamptz default now()
);

-- ---------- Témoignages ----------
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  created_at timestamptz default now()
);

-- ---------- Messages reçus (contact + réservation) ----------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text not null,
  email text,
  phone text,
  event_type text,
  event_date text,
  org text,
  message text not null,
  done boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Sécurité (Row Level Security)
-- Principe : tout le monde peut LIRE le contenu du site.
-- Seul un compte admin connecté (Supabase Auth) peut MODIFIER.
-- Exception : n'importe qui peut ENVOYER un message (formulaire de contact),
-- mais seul l'admin peut les lire/supprimer.
-- ============================================================

alter table settings enable row level security;
alter table about enable row level security;
alter table about_cards enable row level security;
alter table photos enable row level security;
alter table videos enable row level security;
alter table testimonials enable row level security;
alter table messages enable row level security;

create policy "public read settings" on settings for select using (true);
create policy "public read about" on about for select using (true);
create policy "public read about_cards" on about_cards for select using (true);
create policy "public read photos" on photos for select using (true);
create policy "public read videos" on videos for select using (true);
create policy "public read testimonials" on testimonials for select using (true);

create policy "admin write settings" on settings for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin write about" on about for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin all about_cards" on about_cards for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all photos" on photos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all videos" on videos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all testimonials" on testimonials for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public insert messages" on messages for insert with check (true);
create policy "admin read messages" on messages for select using (auth.role() = 'authenticated');
create policy "admin update messages" on messages for update using (auth.role() = 'authenticated');
create policy "admin delete messages" on messages for delete using (auth.role() = 'authenticated');

-- ============================================================
-- Dernière étape (à faire dans l'interface, pas en SQL) :
-- Authentication → Users → Add user → créez le compte du responsable
-- (l'e-mail et le mot de passe utilisés pour se connecter à l'admin du site)
-- ============================================================
