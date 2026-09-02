/* ============================================================
   Colombe céleste — fonctions et données partagées
   Utilisé par le site public (assets/site.js) ET l'admin (admin/admin.js)
   ============================================================ */

var CC = (function () {
  "use strict";

  var STORAGE_KEY = "colombeCelesteData_v2";
  var MSG_KEY = "colombeCelesteMessages_v2";
  var LIKES_KEY = "colombeCelesteLikes_v2";
  var SESSION_KEY = "colombeCelesteAdminSession";

  /* -------- Contenu par défaut (à modifier depuis l'espace admin) -------- */
  var SEED_DATA = {
    settings: {
      responsable: "[Nom du responsable à compléter]",
      phone: "[Numéro à compléter]",
      email: "[Adresse e-mail à compléter]",
      address: "[Adresse à compléter]",
      messageEndpoint: ""
    },
    about: {
      paragraph1: "La chorale Colombe céleste réunit des choristes de l'aumônerie protestante du génie militaire, animés par une même envie : chanter la foi avec ferveur et partager la joie de l'Évangile en musique, du negro spiritual au gospel contemporain.",
      paragraph2: "Née au cœur de la vie de l'aumônerie, la chorale accompagne les cultes, les temps de recueillement et les célébrations de la communauté militaire et de leurs familles. Chaque répétition est un temps de prière autant qu'un temps de musique.",
      verseText: "Chantez à l'Éternel un cantique nouveau, car il a fait des merveilles.",
      verseRef: "Psaume 98:1",
      cards: [
        { id: "c1", title: "Foi & prière", description: "Chaque chant est porté comme une prière, au service des célébrations de l'aumônerie." },
        { id: "c2", title: "Voix & musique", description: "Un répertoire gospel et negro spiritual, travaillé avec exigence et enthousiasme." },
        { id: "c3", title: "Fraternité & service", description: "Une communauté soudée, au service des familles et de la vie de l'aumônerie militaire." }
      ]
    },
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1601931935521-2f7a2f0c2a68?w=700&q=80", caption: "Répétition du jeudi soir — photo d'exemple à remplacer" },
      { id: "p2", url: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=700&q=80", caption: "Concert de Noël à la chapelle — photo d'exemple à remplacer" },
      { id: "p3", url: "https://images.unsplash.com/photo-1509024312469-32f0b6c8b62c?w=700&q=80", caption: "Culte dominical — photo d'exemple à remplacer" }
    ],
    videos: [],
    testimonials: [
      { id: "t1", name: "Marie L.", message: "Un moment de grâce suspendu, ces voix nous ont portés jusqu'au ciel." },
      { id: "t2", name: "Cdt. Dupuis", message: "La chorale a magnifiquement accompagné notre cérémonie. Merci à toute l'équipe." },
      { id: "t3", name: "Famille R.", message: "Nos enfants en parlent encore. Quelle joie de les entendre chanter !" }
    ]
  };

  /* -------- Stockage -------- */
  function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(SEED_DATA);
      var parsed = JSON.parse(raw);
      // fusion défensive : si une clé manque (mise à jour du site), on complète avec le seed
      return Object.assign(clone(SEED_DATA), parsed, {
        settings: Object.assign({}, SEED_DATA.settings, parsed.settings || {}),
        about: Object.assign({}, SEED_DATA.about, parsed.about || {})
      });
    } catch (e) {
      console.error("Lecture des données impossible, retour au contenu par défaut.", e);
      return clone(SEED_DATA);
    }
  }

  function saveData(data) {
    var json;
    try {
      json = JSON.stringify(data);
    } catch (e) {
      return { ok: false, reason: "invalid" };
    }
    try {
      localStorage.setItem(STORAGE_KEY, json);
      return { ok: true };
    } catch (e) {
      console.error("Sauvegarde impossible (stockage plein ?).", e);
      return { ok: false, reason: "quota", sizeKB: Math.round(json.length / 1024) };
    }
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function uid() { return "id" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  var THEME_KEY = "colombeCelesteTheme";
  var LANG_KEY = "colombeCelesteLang";

  function getTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }
  function initTheme() { applyTheme(getTheme()); }
  function toggleTheme() {
    var next = getTheme() === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    return next;
  }

  function getLang() { return localStorage.getItem(LANG_KEY) || "fr"; }
  function setLang(lang) { localStorage.setItem(LANG_KEY, lang); }

  /* -------- Sécurité : échappement systématique de tout texte inséré dans le DOM -------- */
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Valide qu'une URL est bien http(s), une data-uri image/vidéo, ou une référence IndexedDB interne
  function isSafeUrl(url) {
    if (!url) return false;
    return /^https:\/\//i.test(url) || /^http:\/\//i.test(url) || /^data:(image|video)\//i.test(url) || /^indexeddb:[a-z0-9]+$/i.test(url);
  }

  /* -------- Vidéos : reconnaît YouTube / Vimeo / fichier direct et fabrique un lecteur qui fonctionne -------- */
  function parseVideo(url) {
    if (!url || !isSafeUrl(url)) return null;
    url = url.trim();

    if (/^indexeddb:/i.test(url)) return { type: "indexeddb", id: url.slice("indexeddb:".length) };
    if (/^data:video\//i.test(url)) return { type: "file", src: url };
    if (/\.(mp4|webm|ogv)(\?.*)?$/i.test(url)) return { type: "file", src: url };

    var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
    if (yt) return { type: "iframe", src: "https://www.youtube-nocookie.com/embed/" + yt[1] };

    var vim = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vim) return { type: "iframe", src: "https://player.vimeo.com/video/" + vim[1] };

    if (/\/embed\//i.test(url)) return { type: "iframe", src: url };

    return null; // format non reconnu : on ne l'affichera pas comme lecteur, pour éviter tout lien cassé
  }

  /* -------- Fichiers vidéo volumineux : stockés dans IndexedDB (capacité bien supérieure à localStorage) -------- */
  var VIDEO_DB_NAME = "colombeCelesteVideos";
  var VIDEO_STORE = "videoFiles";

  function openVideoDB() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("IndexedDB non disponible sur ce navigateur.")); return; }
      var req = indexedDB.open(VIDEO_DB_NAME, 1);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(VIDEO_STORE)) db.createObjectStore(VIDEO_STORE);
      };
      req.onsuccess = function (e) { resolve(e.target.result); };
      req.onerror = function (e) { reject(e.target.error || new Error("Erreur IndexedDB")); };
    });
  }
  function storeVideoBlob(id, blob) {
    return openVideoDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(VIDEO_STORE, "readwrite");
        tx.objectStore(VIDEO_STORE).put(blob, id);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function (e) { reject(e.target.error || new Error("Échec de l'écriture")); };
      });
    });
  }
  function getVideoBlob(id) {
    return openVideoDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(VIDEO_STORE, "readonly");
        var req = tx.objectStore(VIDEO_STORE).get(id);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function (e) { reject(e.target.error || new Error("Échec de la lecture")); };
      });
    });
  }
  function deleteVideoBlob(id) {
    return openVideoDB().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(VIDEO_STORE, "readwrite");
        tx.objectStore(VIDEO_STORE).delete(id);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      });
    }).catch(function () { return false; });
  }

  /* -------- Messages (contact / réservation / témoignages) — sans jamais changer de page -------- */
  function saveMessage(entry) {
    var list = [];
    try { list = JSON.parse(localStorage.getItem(MSG_KEY) || "[]"); } catch (e) { list = []; }
    entry.id = uid();
    entry.date = new Date().toISOString();
    list.unshift(entry);
    localStorage.setItem(MSG_KEY, JSON.stringify(list));
    return entry;
  }

  function getMessages() {
    try { return JSON.parse(localStorage.getItem(MSG_KEY) || "[]"); } catch (e) { return []; }
  }

  function deleteMessage(id) {
    var list = getMessages().filter(function (m) { return m.id !== id; });
    localStorage.setItem(MSG_KEY, JSON.stringify(list));
  }

  // Envoi optionnel vers un service tiers (ex. Formspree) configuré dans les réglages admin.
  // N'entraîne jamais de navigation : requête en arrière-plan uniquement.
  function trySendToEndpoint(endpoint, payload) {
    if (!endpoint || !/^https:\/\//i.test(endpoint)) return;
    try {
      var fd = new FormData();
      Object.keys(payload).forEach(function (k) { fd.append(k, payload[k]); });
      fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } }).catch(function () {});
    } catch (e) { /* silencieux : le message reste enregistré localement de toute façon */ }
  }

  return {
    STORAGE_KEY: STORAGE_KEY, MSG_KEY: MSG_KEY, LIKES_KEY: LIKES_KEY, SESSION_KEY: SESSION_KEY,
    THEME_KEY: THEME_KEY, LANG_KEY: LANG_KEY,
    loadData: loadData, saveData: saveData, clone: clone, uid: uid,
    escapeHtml: escapeHtml, isSafeUrl: isSafeUrl, parseVideo: parseVideo,
    saveMessage: saveMessage, getMessages: getMessages, deleteMessage: deleteMessage,
    trySendToEndpoint: trySendToEndpoint,
    getTheme: getTheme, applyTheme: applyTheme, initTheme: initTheme, toggleTheme: toggleTheme,
    getLang: getLang, setLang: setLang,
    storeVideoBlob: storeVideoBlob, getVideoBlob: getVideoBlob, deleteVideoBlob: deleteVideoBlob
  };
})();
