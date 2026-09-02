# Guide technique — Colombe céleste

Ce document explique comment est construit le site et comment le modifier vous-même, sans connaissances techniques poussées.

---

## 1. Carte du projet

```
index.html          → Page publique (structure)
admin/index.html    → Page admin (structure), accessible via /admin
assets/style.css    → Apparence du site public (couleurs, polices, mode sombre)
admin/admin.css     → Apparence de l'admin
assets/common.js    → Le "moteur" partagé : stockage, sécurité, vidéos
assets/i18n.js      → Traductions (FR/EN/DE/ES)
assets/site.js      → Comportement de la page publique
admin/admin.js      → Comportement de l'admin (ajout/modification/suppression)
assets/favicon.svg  → Icône du site
robots.txt / sitemap.xml → Référencement (SEO)
```

**Règle simple** : un texte fixe → modifiez le `.html`. Une couleur/taille/espacement → modifiez le `.css`. Un comportement (ce qui se passe quand on clique) → modifiez le `.js`.

---

## 2. Comment chaque élément du site est géré

Pour chaque élément, le même schéma se répète :
**Admin (formulaire) → stockage dans le navigateur → Site public (affichage)**

### Photos
- **Où on les ajoute** : `admin/index.html`, onglet Photos → `admin/admin.js`, section `PHOTOS`
- **Où elles sont stockées** : `localStorage`, dans `data.photos` (un tableau `{id, url, caption}`)
- **Où elles s'affichent** : `assets/site.js`, fonction `renderGallery()`
- **Taille max d'un fichier importé** : `MAX_IMAGE_BYTES` dans `admin/admin.js`

### Vidéos
- **Où on les ajoute** : onglet Vidéos → `admin/admin.js`, section `VIDEOS`
- **Où elles sont stockées** : deux cas différents
  - Un **lien YouTube/Vimeo** → juste le texte du lien dans `localStorage` (`data.videos`)
  - Un **fichier importé** → le fichier lui-même va dans **IndexedDB** (un espace de stockage à part, avec beaucoup plus de capacité), et seule une petite référence (`indexeddb:xxxxx`) est gardée dans `data.videos`
- **Où elles s'affichent** : `assets/site.js`, fonction `renderVideos()` + `openVideoModal()` (lecture en grand écran)
- **Taille max d'un fichier importé** : `MAX_VIDEO_BYTES` dans `admin/admin.js`
- **Reconnaissance du format** : fonction `parseVideo()` dans `assets/common.js` — c'est elle qui comprend qu'un lien est du YouTube, du Vimeo, ou un fichier

### Témoignages
- **Où on les ajoute** : onglet Témoignages → `admin/admin.js`, section `TEMOIGNAGES`
- **Où ils sont stockés** : `localStorage`, `data.testimonials`
- **Où ils s'affichent** : `assets/site.js`, fonction `renderTestimonials()`

### « Qui sommes-nous » (présentation, verset, cartes de valeurs)
- **Où on les modifie** : onglet Qui sommes-nous → `admin/admin.js`, sections `QUI SOMMES-NOUS`
- **Où c'est stocké** : `localStorage`, `data.about` (`paragraph1`, `paragraph2`, `verseText`, `verseRef`, `cards`)
- **Où ça s'affiche** : `assets/site.js`, fonction `renderAbout()`

### Coordonnées de contact
- **Où on les modifie** : onglet Coordonnées
- **Où c'est stocké** : `data.settings` (`responsable`, `phone`, `email`, `address`, `messageEndpoint`)
- **Où ça s'affiche** : `assets/site.js`, fonction `renderSettings()` — met aussi à jour automatiquement les données structurées SEO (`enhanceStructuredData()`)

### Messages reçus (contact + réservation)
- **Où ils arrivent** : formulaires de la page publique → `assets/site.js`, écouteurs sur `#booking-form` et `#testi-form`
- **Où ils sont stockés** : `localStorage`, sous une clé séparée (`CC.MSG_KEY`), pas mélangés avec le reste du contenu
- **Où on les lit** : onglet Messages reçus de l'admin → `renderMessages()` dans `admin/admin.js`
- **Important** : ces messages ne sont visibles que sur l'appareil/navigateur où ils ont été envoyés, sauf si vous configurez un service comme Formspree dans le champ "URL de réception" (Coordonnées)

### Mode sombre
- Géré par `CC.getTheme()`, `CC.toggleTheme()` dans `assets/common.js`
- Un attribut `data-theme="dark"` est posé sur la page, et `assets/style.css` contient les couleurs adaptées

### Langue
- Géré par `assets/i18n.js` (dictionnaire) + `CC_I18N.apply()`
- Ne traduit que les textes fixes (menus, boutons) — pas le contenu que vous rédigez vous-même

---

## 3. Variables importantes — où et comment les changer

Toutes dans **`admin/admin.js`**, tout en haut du fichier :

```js
var ADMIN_PASSWORD = "colombe2026";        // mot de passe de l'admin
var MAX_IMAGE_BYTES = 2 * 1024 * 1024;     // taille max d'une image importée (2 Mo)
var MAX_VIDEO_BYTES = 20 * 1024 * 1024;    // taille max d'une vidéo importée (20 Mo)
```

Pour changer une taille, changez uniquement le premier chiffre. Exemple, pour passer à 30 Mo :
```js
var MAX_VIDEO_BYTES = 30 * 1024 * 1024;
```

Un peu plus bas (fonction `updateStorageGauge`) :
```js
var approxLimitKB = 5000; // juste indicatif, pour la jauge visuelle de l'onglet admin
```

**Pourquoi deux limites différentes pour les vidéos ?**
- Les **liens YouTube/Vimeo** n'ont aucune limite : ils ne sont jamais stockés sur votre site.
- Les **fichiers importés directement** vont dans IndexedDB, qui accepte des dizaines, voire des centaines de Mo selon le navigateur — mais restent **propres à l'appareil** où ils ont été ajoutés tant que le site n'a pas de vrai serveur avec base de données. C'est très bien pour tester, mais **pour du contenu destiné au grand public, préférez toujours YouTube/Vimeo**.

---

## 4. Autres réglages utiles

| Je veux... | Fichier | Où |
|---|---|---|
| Changer une couleur | `assets/style.css` | Variables tout en haut (`--dawn-gold`, `--sky-night`...) |
| Changer un texte traduit | `assets/i18n.js` | Cherchez la clé dans les 4 blocs `fr`/`en`/`de`/`es` |
| Changer la durée d'affichage d'un message de confirmation | `admin/admin.js` | Fonction `toast()` / `toastError()`, valeur en millisecondes (`2600`, `5500`) |
| Ajouter une 5e langue | `assets/i18n.js` | Dupliquez un bloc de langue, ajoutez son code dans `LABELS` |
| Changer le nom de domaine (SEO) | `index.html`, `robots.txt`, `sitemap.xml` | Remplacez `https://www.colombe-celeste.example/` |

---

## 5. En cas de doute

Toujours procéder par petites étapes : modifiez une seule valeur, enregistrez, rechargez la page dans le navigateur pour vérifier que tout va bien, avant de passer à la suivante. Si quelque chose casse, comparez avec ce guide pour repérer ce qui a changé.
