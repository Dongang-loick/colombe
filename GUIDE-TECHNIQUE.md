# Guide technique — Colombe céleste

## 0. Le changement le plus important : une vraie base de données

Jusqu'ici, tout le contenu du site (coordonnées, photos, vidéos, textes...) était stocké **dans le navigateur** de la personne qui l'ajoutait. Résultat : modifier le site sur Chrome n'était pas visible sur Edge, ni sur le téléphone d'un visiteur.

**Ce n'est plus le cas.** Le site peut maintenant se connecter à **Supabase**, une vraie base de données en ligne. Une fois configuré (une seule fois), tout le contenu est stocké à un seul endroit et visible instantanément partout : n'importe quel navigateur, n'importe quel appareil.

**Seules les préférences d'affichage restent locales à l'appareil**, comme demandé : le mode sombre et la langue choisie.

---

## 1. Mise en place de Supabase (à faire une fois)

### Étape 1 — Créer les tables
1. Connectez-vous à votre compte Supabase, ouvrez votre projet
2. Menu de gauche → **SQL Editor** → **New query**
3. Ouvrez le fichier `supabase-schema.sql` fourni avec le site, copiez tout son contenu, collez-le, cliquez **Run**
4. Ça crée toutes les tables, les données de départ, et les règles de sécurité

### Étape 2 — Créer votre compte admin
1. Menu de gauche → **Authentication** → **Users** → **Add user**
2. Renseignez l'e-mail et le mot de passe que vous utiliserez pour vous connecter à l'admin du site
3. **Ce sont ces identifiants qui remplacent l'ancien mot de passe unique**

### Étape 3 — Connecter le site à votre base
1. Toujours dans Supabase : **Project Settings** → **API**
2. Copiez le **Project URL** et la clé **anon public**
3. Ouvrez `assets/repo.js`, tout en haut, remplissez :
   ```js
   var SUPABASE_URL = "https://votre-projet.supabase.co";
   var SUPABASE_ANON_KEY = "votre-clé-anon-ici";
   ```
4. Enregistrez, puis renvoyez ce fichier chez votre hébergeur

C'est tout. Rechargez `/admin`, connectez-vous avec l'e-mail/mot de passe créés à l'étape 2 : vous êtes connecté à la vraie base de données.

**Important sur la sécurité** : la clé "anon" n'est pas secrète — elle est faite pour être visible dans le code du site (c'est le fonctionnement normal de Supabase). Ce qui protège vraiment vos données, ce sont les règles de sécurité (RLS) définies dans `supabase-schema.sql` : tout le monde peut lire le contenu du site, mais seule une personne connectée avec le compte admin peut le modifier.

---

## 2. Photos et vidéos : envoi automatique (Cloudinary)

Pour que les photos/vidéos ajoutées soient hébergées correctement (et pas seulement dans le navigateur), configurez aussi Cloudinary — gratuit, 4 étapes, expliquées directement dans l'onglet **Coordonnées** de l'admin. Une fois fait :
- Choisir une photo/vidéo sur son PC ou son téléphone l'envoie **automatiquement** en ligne, invisible pour vous
- Le lien obtenu est stocké dans Supabase, donc visible par tous, sur tous les appareils
- Les vidéos obtiennent aussi une **vignette automatique** (image d'aperçu, plus d'écran noir)

Sans Cloudinary configuré, le site continue de fonctionner (repli sur stockage navigateur, avec les limites déjà connues : 2 Mo/photo, propre à l'appareil).

---

## 3. Carte du projet (fichiers)

```
index.html            → Page publique (structure)
admin/index.html       → Page admin (structure), accessible via /admin
assets/style.css       → Apparence du site public + mode sombre
admin/admin.css        → Apparence de l'admin
assets/common.js       → Fonctions de base : sécurité, vidéos, Cloudinary, IndexedDB
assets/repo.js         → ⭐ Bascule Supabase ↔ stockage local (voir section 0)
assets/i18n.js         → Traductions (FR/EN/DE/ES)
assets/site.js         → Comportement de la page publique
admin/admin.js         → Comportement de l'admin
supabase-schema.sql    → Script à exécuter une fois dans Supabase
assets/favicon.svg     → Icône du site
robots.txt / sitemap.xml → Référencement (SEO)
```

---

## 4. Comment chaque élément est géré

Le schéma est maintenant : **Admin (formulaire) → `assets/repo.js` → Supabase (ou stockage local si non configuré) → Site public**

| Élément | Table Supabase | Géré dans (admin) | Affiché dans (site) |
|---|---|---|---|
| Coordonnées | `settings` | Onglet Coordonnées | `renderSettings()` |
| Présentation + verset | `about` | Onglet Qui sommes-nous | `renderAbout()` |
| Cartes de valeurs | `about_cards` | Onglet Qui sommes-nous | `renderAbout()` |
| Photos | `photos` | Onglet Photos | `renderGallery()` |
| Vidéos | `videos` | Onglet Vidéos | `renderVideos()` |
| Témoignages | `testimonials` | Onglet Témoignages | `renderTestimonials()` |
| Messages reçus | `messages` | Onglet Messages reçus | (formulaires publics) |

Chaque action (ajouter/modifier/supprimer) dans l'admin appelle une fonction de `CC_REPO` (ex. `CC_REPO.addPhoto(...)`), qui elle-même décide d'écrire dans Supabase ou en local selon la configuration — le reste du code n'a pas à s'en soucier.

### Vidéos : reconnaissance et vignettes
- `CC.parseVideo()` dans `common.js` reconnaît YouTube, Vimeo, fichier direct, ou fichier local (IndexedDB)
- Vignette YouTube : générée instantanément par une formule (`img.youtube.com/vi/ID/hqdefault.jpg`)
- Vignette Vimeo : récupérée via leur API publique (`fetchVimeoThumbnail`)
- Vignette d'un fichier importé : capturée automatiquement à partir de la vidéo elle-même (`generateVideoThumbnail`, dessine une image à partir de la 1ère seconde)

### Aperçu au survol
Pour les vidéos hébergées directement (Cloudinary ou fichier local), un survol de la souris lance un aperçu silencieux en boucle (`resolvePreviewSrc` + `hover-preview-video`). Pour les vidéos YouTube/Vimeo intégrées, ce n'est pas possible sans alourdir fortement la page (ça nécessiterait de charger leur lecteur complet) — seule la vignette réelle s'affiche.

### Protection contre le téléchargement
`preventCopy()` dans `site.js` désactive le clic droit et le glisser-déposer sur les images/vidéos, et `controlsList="nodownload"` retire le bouton de téléchargement des lecteurs vidéo. **Honnêteté technique** : aucune de ces protections n'empêche un visiteur déterminé (outils développeur, capture d'écran) — elles dissuadent l'usage courant, sans plus.

---

## 5. Variables importantes

Dans **`admin/admin.js`** :
```js
var ADMIN_PASSWORD = "colombe2026";            // repli si Supabase non configuré
var MAX_IMAGE_BYTES = 2 * 1024 * 1024;         // image en stockage local : 2 Mo
var MAX_IMAGE_BYTES_CLOUD = 10 * 1024 * 1024;  // image via Cloudinary : 10 Mo
var MAX_VIDEO_BYTES = 20 * 1024 * 1024;        // vidéo en stockage local : 20 Mo
var MAX_VIDEO_BYTES_CLOUD = 100 * 1024 * 1024; // vidéo via Cloudinary : 100 Mo
```

Dans **`assets/repo.js`** :
```js
var SUPABASE_URL = "";        // à remplir une fois (section 1)
var SUPABASE_ANON_KEY = "";   // à remplir une fois (section 1)
```

---

## 6. Autres réglages utiles

| Je veux... | Fichier | Où |
|---|---|---|
| Changer une couleur | `assets/style.css` | Variables tout en haut (`--dawn-gold`, `--sky-night`...) |
| Changer un texte traduit | `assets/i18n.js` | Cherchez la clé dans les 4 blocs `fr`/`en`/`de`/`es` |
| Changer la durée d'un message de confirmation | `admin/admin.js` | Fonctions `toast()` / `toastError()` |
| Ajouter une 5e langue | `assets/i18n.js` | Dupliquez un bloc de langue, ajoutez son code dans `LABELS` |
| Changer le nom de domaine (SEO) | `index.html`, `robots.txt`, `sitemap.xml` | Remplacez `https://www.colombe-celeste.example/` |

---

## 7. En cas de doute

Modifiez une seule chose à la fois, enregistrez, rechargez la page pour vérifier avant de continuer. Si l'admin affiche une erreur après une action, le message donne généralement la cause exacte (ex. "Session expirée ou droits insuffisants" → reconnectez-vous à l'admin).
