/* ============================================================
   Colombe céleste — couche d'accès aux données (repository)

   Donne au reste du site (site.js / admin.js) une interface UNIQUE,
   qu'il y ait ou non une base Supabase configurée :
     - Si SUPABASE_URL / SUPABASE_ANON_KEY sont renseignés ci-dessous :
       toutes les données (contenu + messages) vivent dans Supabase,
       visibles instantanément sur n'importe quel appareil/navigateur.
     - Sinon : repli automatique sur le stockage local déjà existant
       (fonctionne, mais propre à un seul navigateur).

   Seules les préférences d'affichage (thème, langue) restent toujours
   locales à l'appareil : ce sont des préférences, pas du contenu du site.
   ============================================================ */

/* ====== À COMPLÉTER UNE FOIS (voir supabase-schema.sql pour la mise en place) ====== */
var SUPABASE_URL = "https://mvywpaipicfcgpygtjzy.supabase.co";        // ex: "https://xxxxxxxx.supabase.co"
var SUPABASE_ANON_KEY = "sb_publishable_k2LjaPSGI1hwjTvyli5iDg_YuTNZsgn";   // clé publique "anon" (Project Settings → API)
/* ==================================================================================== */

var CC_REPO = (function () {
  "use strict";

  var SESSION_KEY = "colombeCelesteSbSession";

  function isRemote() { return !!(SUPABASE_URL && SUPABASE_ANON_KEY); }

  /* -------- Session admin (Supabase Auth) -------- */
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch (e) { return null; }
  }
  function isLoggedIn() { return isRemote() ? !!getSession() : (sessionStorage.getItem(CC.SESSION_KEY) === "1"); }

  function login(email, password) {
    if (!isRemote()) {
      return Promise.resolve({ ok: false, error: "Supabase n'est pas configuré." });
    }
    return fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password })
    }).then(function (r) { return r.json().then(function (body) { return { status: r.status, body: body }; }); })
      .then(function (res) {
        if (res.status !== 200 || !res.body.access_token) {
          return { ok: false, error: (res.body && (res.body.error_description || res.body.msg)) || "Identifiants incorrects." };
        }
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(res.body));
        return { ok: true };
      }).catch(function () { return { ok: false, error: "Impossible de contacter le serveur." }; });
  }
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(CC.SESSION_KEY);
  }

  function authToken() {
    var s = getSession();
    return (s && s.access_token) || SUPABASE_ANON_KEY;
  }
  function sbHeaders(needsWrite) {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + (needsWrite ? authToken() : SUPABASE_ANON_KEY),
      "Content-Type": "application/json",
      Prefer: "return=representation"
    };
  }
  function sbUrl(table, query) { return SUPABASE_URL + "/rest/v1/" + table + (query ? "?" + query : ""); }

  function sbGet(table, query) {
    return fetch(sbUrl(table, query), { headers: sbHeaders(false) })
      .then(function (r) { if (!r.ok) throw new Error("Lecture impossible (" + table + ")"); return r.json(); });
  }
  function sbInsert(table, row) {
    return fetch(sbUrl(table), { method: "POST", headers: sbHeaders(true), body: JSON.stringify(row) })
      .then(function (r) { return r.json().then(function (body) { return { status: r.status, body: body }; }); })
      .then(function (res) {
        if (res.status < 200 || res.status >= 300) throw new Error(extractErr(res.body));
        return Array.isArray(res.body) ? res.body[0] : res.body;
      });
  }
  function sbUpdate(table, id, patch) {
    return fetch(sbUrl(table, "id=eq." + id), { method: "PATCH", headers: sbHeaders(true), body: JSON.stringify(patch) })
      .then(function (r) { return r.json().then(function (body) { return { status: r.status, body: body }; }); })
      .then(function (res) {
        if (res.status < 200 || res.status >= 300) throw new Error(extractErr(res.body));
        return Array.isArray(res.body) ? res.body[0] : res.body;
      });
  }
  function sbDelete(table, id) {
    return fetch(sbUrl(table, "id=eq." + id), { method: "DELETE", headers: sbHeaders(true) })
      .then(function (r) { if (!r.ok) throw new Error("Suppression impossible."); return true; });
  }
  function extractErr(body) {
    if (!body) return "Erreur inconnue.";
    if (body.message) return /row-level security/i.test(body.message) ? "Session expirée ou droits insuffisants. Reconnectez-vous." : body.message;
    return "Erreur inconnue.";
  }

  /* ================= CHARGEMENT COMPLET ================= */
  function load() {
    if (!isRemote()) return Promise.resolve(CC.loadData());
    return Promise.all([
      sbGet("settings"), sbGet("about"), sbGet("about_cards", "order=sort_order.asc"),
      sbGet("photos", "order=created_at.asc"), sbGet("videos", "order=created_at.asc"),
      sbGet("testimonials", "order=created_at.asc")
    ]).then(function (r) {
      var s = r[0][0] || {}, a = r[1][0] || {};
      return {
        settings: {
          responsable: s.responsable || "[Nom du responsable à compléter]",
          phone: s.phone || "[Numéro à compléter]",
          email: s.email || "[Adresse e-mail à compléter]",
          address: s.address || "[Adresse à compléter]",
          messageEndpoint: s.message_endpoint || "",
          cloudinaryCloud: s.cloudinary_cloud || "",
          cloudinaryPreset: s.cloudinary_preset || ""
        },
        about: {
          paragraph1: a.paragraph1 || "", paragraph2: a.paragraph2 || "",
          verseText: a.verse_text || "", verseRef: a.verse_ref || "",
          cards: r[2].map(function (c) { return { id: c.id, title: c.title, description: c.description }; })
        },
        photos: r[3].map(function (p) { return { id: p.id, url: p.url, caption: p.caption }; }),
        videos: r[4].map(function (v) { return { id: v.id, url: v.url, title: v.title, desc: v.description, thumbnail: v.thumbnail, fileSizeKB: v.file_size_kb }; }),
        testimonials: r[5].map(function (t) { return { id: t.id, name: t.name, message: t.message }; })
      };
    }).catch(function (e) {
      console.error("Supabase indisponible, repli sur le stockage local.", e);
      return CC.loadData();
    });
  }

  /* ================= SETTINGS ================= */
  function saveSettings(patch) {
    if (!isRemote()) {
      var data = CC.loadData();
      Object.assign(data.settings, patch);
      return Promise.resolve(CC.saveData(data));
    }
    return sbUpdate("settings", 1, {
      responsable: patch.responsable, phone: patch.phone, email: patch.email, address: patch.address,
      message_endpoint: patch.messageEndpoint, cloudinary_cloud: patch.cloudinaryCloud, cloudinary_preset: patch.cloudinaryPreset
    }).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }

  /* ================= ABOUT ================= */
  function saveAboutText(patch) {
    if (!isRemote()) {
      var data = CC.loadData();
      Object.assign(data.about, patch);
      return Promise.resolve(CC.saveData(data));
    }
    return sbUpdate("about", 1, { paragraph1: patch.paragraph1, paragraph2: patch.paragraph2, verse_text: patch.verseText, verse_ref: patch.verseRef })
      .then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }
  function addAboutCard(card) {
    if (!isRemote()) {
      var data = CC.loadData();
      var item = { id: CC.uid(), title: card.title, description: card.description };
      data.about.cards.push(item);
      var r = CC.saveData(data); return Promise.resolve(r.ok ? { ok: true, item: item } : r);
    }
    return sbInsert("about_cards", { title: card.title, description: card.description })
      .then(function (row) { return { ok: true, item: { id: row.id, title: row.title, description: row.description } }; })
      .catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }
  function updateAboutCard(id, patch) {
    if (!isRemote()) {
      var data = CC.loadData();
      var c = data.about.cards.find(function (x) { return x.id === id; });
      if (c) Object.assign(c, patch);
      return Promise.resolve(CC.saveData(data));
    }
    return sbUpdate("about_cards", id, patch).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }
  function deleteAboutCard(id) {
    if (!isRemote()) {
      var data = CC.loadData();
      data.about.cards = data.about.cards.filter(function (x) { return x.id !== id; });
      return Promise.resolve(CC.saveData(data));
    }
    return sbDelete("about_cards", id).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }

  /* ================= Générique pour photos / vidéos / témoignages (stockage local) ================= */
  function localAdd(listName, buildItem) {
    var data = CC.loadData();
    var item = buildItem();
    data[listName].push(item);
    var r = CC.saveData(data);
    return r.ok ? { ok: true, item: item } : r;
  }
  function localUpdate(listName, id, patch) {
    var data = CC.loadData();
    var it = data[listName].find(function (x) { return x.id === id; });
    if (it) Object.assign(it, patch);
    return CC.saveData(data);
  }
  function localDelete(listName, id) {
    var data = CC.loadData();
    data[listName] = data[listName].filter(function (x) { return x.id !== id; });
    return CC.saveData(data);
  }

  /* ================= PHOTOS ================= */
  function addPhoto(photo) {
    if (!isRemote()) return Promise.resolve(localAdd("photos", function () { return { id: CC.uid(), url: photo.url, caption: photo.caption }; }));
    return sbInsert("photos", { url: photo.url, caption: photo.caption })
      .then(function (row) { return { ok: true, item: { id: row.id, url: row.url, caption: row.caption } }; })
      .catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }
  function updatePhoto(id, patch) {
    if (!isRemote()) return Promise.resolve(localUpdate("photos", id, patch));
    return sbUpdate("photos", id, patch).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }
  function deletePhoto(id) {
    if (!isRemote()) return Promise.resolve(localDelete("photos", id));
    return sbDelete("photos", id).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }

  /* ================= VIDEOS ================= */
  function addVideo(video) {
    if (!isRemote()) return Promise.resolve(localAdd("videos", function () {
      return { id: CC.uid(), url: video.url, title: video.title, desc: video.desc, thumbnail: video.thumbnail, fileSizeKB: video.fileSizeKB };
    }));
    return sbInsert("videos", { url: video.url, title: video.title, description: video.desc, thumbnail: video.thumbnail, file_size_kb: video.fileSizeKB })
      .then(function (row) { return { ok: true, item: { id: row.id, url: row.url, title: row.title, desc: row.description, thumbnail: row.thumbnail, fileSizeKB: row.file_size_kb } }; })
      .catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }
  function updateVideo(id, patch) {
    if (!isRemote()) return Promise.resolve(localUpdate("videos", id, patch));
    var row = {};
    if ("url" in patch) row.url = patch.url;
    if ("title" in patch) row.title = patch.title;
    if ("desc" in patch) row.description = patch.desc;
    if ("thumbnail" in patch) row.thumbnail = patch.thumbnail;
    if ("fileSizeKB" in patch) row.file_size_kb = patch.fileSizeKB;
    return sbUpdate("videos", id, row).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }
  function deleteVideo(id) {
    if (!isRemote()) return Promise.resolve(localDelete("videos", id));
    return sbDelete("videos", id).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }

  /* ================= TEMOIGNAGES ================= */
  function addTestimonial(t) {
    if (!isRemote()) return Promise.resolve(localAdd("testimonials", function () { return { id: CC.uid(), name: t.name, message: t.message }; }));
    return sbInsert("testimonials", { name: t.name, message: t.message })
      .then(function (row) { return { ok: true, item: { id: row.id, name: row.name, message: row.message } }; })
      .catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }
  function updateTestimonial(id, patch) {
    if (!isRemote()) return Promise.resolve(localUpdate("testimonials", id, patch));
    return sbUpdate("testimonials", id, patch).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }
  function deleteTestimonial(id) {
    if (!isRemote()) return Promise.resolve(localDelete("testimonials", id));
    return sbDelete("testimonials", id).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, reason: "remote", message: e.message }; });
  }

  /* ================= MESSAGES ================= */
  function sendMessage(entry) {
    if (!isRemote()) { CC.saveMessage(entry); return Promise.resolve({ ok: true }); }
    return sbInsert("messages", {
      kind: entry.kind, name: entry.name, email: entry.email || null, phone: entry.phone || null,
      event_type: entry.type || null, event_date: entry.eventDate || null, org: entry.org || null, message: entry.message
    }).then(function () { return { ok: true }; }).catch(function () {
      // Pas bloquant pour le visiteur : on garde une copie locale si l'envoi distant échoue.
      CC.saveMessage(entry);
      return { ok: true, fallback: true };
    });
  }
  function getMessages() {
    if (!isRemote()) return Promise.resolve(CC.getMessages());
    return sbGet("messages", "order=created_at.desc").then(function (rows) {
      return rows.map(function (m) {
        return { id: m.id, kind: m.kind, name: m.name, email: m.email, phone: m.phone, type: m.event_type, eventDate: m.event_date, org: m.org, message: m.message, done: m.done, date: m.created_at };
      });
    }).catch(function () { return []; });
  }
  function deleteMessage(id) {
    if (!isRemote()) { CC.deleteMessage(id); return Promise.resolve({ ok: true }); }
    return sbDelete("messages", id).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, message: e.message }; });
  }
  function toggleMessageDone(id, current) {
    if (!isRemote()) {
      var list = CC.getMessages();
      var m = list.find(function (x) { return x.id === id; });
      if (m) m.done = !current;
      localStorage.setItem(CC.MSG_KEY, JSON.stringify(list));
      return Promise.resolve({ ok: true });
    }
    return sbUpdate("messages", id, { done: !current }).then(function () { return { ok: true }; }).catch(function (e) { return { ok: false, message: e.message }; });
  }

  return {
    isRemote: isRemote, isLoggedIn: isLoggedIn, login: login, logout: logout,
    load: load,
    saveSettings: saveSettings,
    saveAboutText: saveAboutText, addAboutCard: addAboutCard, updateAboutCard: updateAboutCard, deleteAboutCard: deleteAboutCard,
    addPhoto: addPhoto, updatePhoto: updatePhoto, deletePhoto: deletePhoto,
    addVideo: addVideo, updateVideo: updateVideo, deleteVideo: deleteVideo,
    addTestimonial: addTestimonial, updateTestimonial: updateTestimonial, deleteTestimonial: deleteTestimonial,
    sendMessage: sendMessage, getMessages: getMessages, deleteMessage: deleteMessage, toggleMessageDone: toggleMessageDone
  };
})();
