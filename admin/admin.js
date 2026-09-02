(function () {
  "use strict";
  var esc = CC.escapeHtml;

  /* À modifier avant mise en ligne : remplacez ce mot de passe par le vôtre. */
  var ADMIN_PASSWORD = "colombe2026";

  var MAX_IMAGE_BYTES = 2 * 1024 * 1024;    // 2 Mo — images : stockées en base64 dans localStorage (quota limité)
  var MAX_VIDEO_BYTES = 20 * 1024 * 1024;   // 20 Mo — vidéos : stockées dans IndexedDB (bien plus de marge)

  var data = CC.loadData();

  /* ============ Enregistrement fiable : on vérifie VRAIMENT que ça a marché ============ */
  function commit(mutator, successMsg) {
    var snapshot = CC.clone(data);
    mutator();
    var result = CC.saveData(data);
    if (!result.ok) {
      Object.keys(data).forEach(function (k) { delete data[k]; });
      Object.assign(data, snapshot);
      if (result.reason === "quota") {
        toastError("Échec : stockage plein (fichier trop volumineux, environ " + result.sizeKB + " Ko). Utilisez un lien YouTube/Vimeo, ou une image plus légère.");
      } else {
        toastError("Échec de l'enregistrement. Réessayez avec un contenu plus léger.");
      }
      return false;
    }
    toast(successMsg || "Modifications enregistrées.");
    return true;
  }

  function toast(text) {
    var t = document.getElementById("save-toast");
    t.textContent = text;
    t.className = "save-toast show";
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }
  function toastError(text) {
    var t = document.getElementById("save-toast");
    t.textContent = text;
    t.className = "save-toast show error";
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove("show"); }, 5500);
  }

  /* ============ AUTHENTIFICATION ============ */
  var gate = document.getElementById("admin-gate");
  var dashboard = document.getElementById("admin-dashboard");

  function showDashboard() {
    gate.style.display = "none";
    dashboard.style.display = "block";
    renderAll();
    updateStorageGauge();
  }

  if (sessionStorage.getItem(CC.SESSION_KEY) === "1") showDashboard();

  document.getElementById("admin-login").addEventListener("click", doLogin);
  document.getElementById("admin-pass").addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });

  function doLogin() {
    var val = document.getElementById("admin-pass").value;
    var err = document.getElementById("admin-err");
    if (val === ADMIN_PASSWORD) {
      err.textContent = "";
      sessionStorage.setItem(CC.SESSION_KEY, "1");
      showDashboard();
    } else {
      err.textContent = "Mot de passe incorrect.";
    }
  }
  document.getElementById("admin-logout").addEventListener("click", function () {
    sessionStorage.removeItem(CC.SESSION_KEY);
    location.reload();
  });

  /* ============ THEME (mode sombre) ============ */
  CC.initTheme();
  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    updateThemeBtn();
    themeBtn.addEventListener("click", function () { CC.toggleTheme(); updateThemeBtn(); });
  }
  function updateThemeBtn() {
    if (!themeBtn) return;
    themeBtn.textContent = CC.getTheme() === "dark" ? "☀️ Mode clair" : "🌙 Mode sombre";
  }

  /* ============ NAVIGATION ENTRE ONGLETS ============ */
  document.getElementById("admin-nav").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-pane]");
    if (!btn) return;
    document.querySelectorAll(".admin-nav button").forEach(function (b) { b.classList.remove("active"); });
    document.querySelectorAll(".admin-pane").forEach(function (p) { p.classList.remove("active"); });
    btn.classList.add("active");
    document.querySelector('.admin-pane[data-pane="' + btn.dataset.pane + '"]').classList.add("active");
  });

  function renderAll() {
    fillAbout(); renderCards();
    renderPhotos(); renderVideos(); renderTestis(); renderMessages();
    fillSettings();
  }

  /* ============ Jauge de stockage utilisé (aide à anticiper le problème) ============ */
  function updateStorageGauge() {
    var gauge = document.getElementById("storage-gauge");
    if (!gauge) return;
    var used = 0;
    try { used = (localStorage.getItem(CC.STORAGE_KEY) || "").length; } catch (e) {}
    var approxLimitKB = 5000; // estimation prudente et courante (varie selon les navigateurs)
    var usedKB = Math.round(used / 1024);
    var pct = Math.min(100, Math.round((usedKB / approxLimitKB) * 100));
    gauge.innerHTML =
      '<div class="gauge-bar"><div class="gauge-fill" style="width:' + pct + '%"></div></div>' +
      '<span>' + usedKB + " Ko utilisés sur environ " + approxLimitKB + " Ko disponibles</span>";
  }

  /* ============ QUI SOMMES-NOUS : présentation & verset ============ */
  function fillAbout() {
    document.getElementById("ab-p1").value = data.about.paragraph1;
    document.getElementById("ab-p2").value = data.about.paragraph2;
    document.getElementById("ab-verse").value = data.about.verseText;
    document.getElementById("ab-verse-ref").value = data.about.verseRef;
  }
  document.getElementById("ab-save").addEventListener("click", function () {
    var p1 = document.getElementById("ab-p1").value.trim();
    var p2 = document.getElementById("ab-p2").value.trim();
    var vt = document.getElementById("ab-verse").value.trim();
    var vr = document.getElementById("ab-verse-ref").value.trim();
    commit(function () {
      data.about.paragraph1 = p1 || data.about.paragraph1;
      data.about.paragraph2 = p2 || data.about.paragraph2;
      data.about.verseText = vt || data.about.verseText;
      data.about.verseRef = vr || data.about.verseRef;
    }, "Présentation enregistrée.");
  });

  /* ============ QUI SOMMES-NOUS : cartes de valeurs ============ */
  var cardEditingId = null;
  function renderCards() {
    var el = document.getElementById("card-list");
    el.innerHTML = data.about.cards.length ? "" : '<p class="empty-mini">Aucune carte pour le moment.</p>';
    data.about.cards.forEach(function (c) {
      var row = document.createElement("div");
      row.className = "admin-list-item";
      row.innerHTML =
        '<div class="meta"><strong>' + esc(c.title) + "</strong><span>" + esc(c.description) + '</span></div>' +
        '<div class="actions"><button type="button" class="a-edit">Modifier</button><button type="button" class="a-del">Supprimer</button></div>';
      row.querySelector(".a-edit").addEventListener("click", function () { startEditCard(c); });
      row.querySelector(".a-del").addEventListener("click", function () {
        if (!confirm("Supprimer cette carte ?")) return;
        if (commit(function () { data.about.cards = data.about.cards.filter(function (x) { return x.id !== c.id; }); }, "Carte supprimée.")) renderCards();
      });
      el.appendChild(row);
    });
  }
  function startEditCard(c) {
    cardEditingId = c.id;
    document.getElementById("cd-title").value = c.title;
    document.getElementById("cd-desc").value = c.description;
    document.getElementById("cd-submit").textContent = "Enregistrer les modifications";
    document.getElementById("cd-cancel").style.display = "inline-block";
    document.getElementById("card-form").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function resetCardForm() {
    cardEditingId = null;
    document.getElementById("cd-title").value = "";
    document.getElementById("cd-desc").value = "";
    document.getElementById("cd-submit").textContent = "Ajouter la carte";
    document.getElementById("cd-cancel").style.display = "none";
    document.getElementById("cd-err").textContent = "";
  }
  document.getElementById("cd-cancel").addEventListener("click", resetCardForm);
  document.getElementById("cd-submit").addEventListener("click", function () {
    var title = document.getElementById("cd-title").value.trim();
    var desc = document.getElementById("cd-desc").value.trim();
    var errEl = document.getElementById("cd-err");
    errEl.textContent = "";
    if (!title || !desc) { errEl.textContent = "Merci de renseigner un titre et une description."; return; }
    var ok;
    if (cardEditingId) {
      var editId = cardEditingId;
      ok = commit(function () {
        var c = data.about.cards.find(function (x) { return x.id === editId; });
        if (c) { c.title = title; c.description = desc; }
      }, "Carte modifiée.");
    } else {
      ok = commit(function () { data.about.cards.push({ id: CC.uid(), title: title, description: desc }); }, "Carte ajoutée.");
    }
    if (ok) { resetCardForm(); renderCards(); }
  });

  /* ============ Sélecteur de fichier générique (aperçu + data-URL + garde-fou de taille) ============ */
  function wireFilePicker(inputId, maxBytes, onLoaded, onTooBig, previewImgId) {
    document.getElementById(inputId).addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      if (file.size > maxBytes) {
        onTooBig(file);
        e.target.value = "";
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        onLoaded(reader.result, file.name);
        if (previewImgId) {
          var img = document.getElementById(previewImgId);
          img.src = reader.result;
          img.classList.add("show");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  /* ============ PHOTOS ============ */
  var phPendingUrl = null;
  var phEditingId = null;
  wireFilePicker("ph-file", MAX_IMAGE_BYTES,
    function (dataUrl, name) { phPendingUrl = dataUrl; document.getElementById("ph-filename").textContent = name; document.getElementById("ph-err").textContent = ""; },
    function (file) { document.getElementById("ph-err").textContent = "Image trop lourde (" + Math.round(file.size / 1024 / 1024 * 10) / 10 + " Mo). Limite : 2 Mo. Compressez l'image ou choisissez-en une autre."; },
    "ph-preview"
  );

  function renderPhotos() {
    var el = document.getElementById("ph-list");
    el.innerHTML = data.photos.length ? "" : '<p class="empty-mini">Aucune photo ajoutée.</p>';
    data.photos.forEach(function (p) {
      var row = document.createElement("div");
      row.className = "admin-list-item";
      row.innerHTML =
        '<img class="thumb" src="' + esc(p.url) + '" alt="">' +
        '<div class="meta"><strong>' + esc(p.caption || "Sans légende") + "</strong><span>" + esc(p.url.slice(0, 60)) + '…</span></div>' +
        '<div class="actions">' +
        '<button type="button" class="a-edit">Modifier</button>' +
        '<a class="a-dl" download="photo.jpg">Télécharger</a>' +
        '<button type="button" class="a-del">Supprimer</button>' +
        "</div>";
      row.querySelector(".a-dl").href = p.url;
      row.querySelector(".a-edit").addEventListener("click", function () { startEditPhoto(p); });
      row.querySelector(".a-del").addEventListener("click", function () {
        if (!confirm("Supprimer cette photo ?")) return;
        if (commit(function () { data.photos = data.photos.filter(function (x) { return x.id !== p.id; }); }, "Photo supprimée.")) renderPhotos();
      });
      el.appendChild(row);
    });
    updateStorageGauge();
  }
  function startEditPhoto(p) {
    phEditingId = p.id;
    phPendingUrl = p.url.indexOf("data:") === 0 ? p.url : null;
    document.getElementById("ph-url").value = p.url.indexOf("data:") === 0 ? "" : p.url;
    document.getElementById("ph-cap").value = p.caption || "";
    var prev = document.getElementById("ph-preview");
    prev.src = p.url; prev.classList.add("show");
    document.getElementById("ph-filename").textContent = p.url.indexOf("data:") === 0 ? "Fichier existant conservé (choisissez un nouveau fichier pour le remplacer)" : "";
    document.getElementById("ph-submit").textContent = "Enregistrer les modifications";
    document.getElementById("ph-cancel").style.display = "inline-block";
    document.getElementById("photo-form").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function resetPhotoForm() {
    phEditingId = null; phPendingUrl = null;
    document.getElementById("ph-url").value = "";
    document.getElementById("ph-cap").value = "";
    document.getElementById("ph-file").value = "";
    document.getElementById("ph-filename").textContent = "";
    var prev = document.getElementById("ph-preview");
    prev.src = ""; prev.classList.remove("show");
    document.getElementById("ph-submit").textContent = "Ajouter la photo";
    document.getElementById("ph-cancel").style.display = "none";
    document.getElementById("ph-err").textContent = "";
  }
  document.getElementById("ph-cancel").addEventListener("click", resetPhotoForm);
  document.getElementById("ph-submit").addEventListener("click", function () {
    var url = phPendingUrl || document.getElementById("ph-url").value.trim();
    var cap = document.getElementById("ph-cap").value.trim();
    var errEl = document.getElementById("ph-err");
    errEl.textContent = "";
    if (!url || !CC.isSafeUrl(url)) { errEl.textContent = "Choisissez une image ou collez un lien valide (commençant par https://)."; return; }
    var ok;
    if (phEditingId) {
      var editId = phEditingId;
      ok = commit(function () {
        var p = data.photos.find(function (x) { return x.id === editId; });
        if (p) { p.url = url; p.caption = cap; }
      }, "Photo modifiée.");
    } else {
      ok = commit(function () { data.photos.push({ id: CC.uid(), url: url, caption: cap }); }, "Photo ajoutée.");
    }
    if (ok) { resetPhotoForm(); renderPhotos(); }
  });

  /* ============ VIDEOS ============ */
  var vdEditingId = null;
  var vdExistingUrl = null;   // référence indexeddb: conservée si l'admin ne choisit pas un nouveau fichier
  var vdPendingFile = null;   // fichier brut choisi via l'explorateur, pas encore enregistré

  document.getElementById("vd-file").addEventListener("change", function (e) {
    var file = e.target.files[0];
    var errEl = document.getElementById("vd-err");
    errEl.textContent = "";
    vdPendingFile = null;
    if (!file) { document.getElementById("vd-filename").textContent = ""; return; }
    if (file.size > MAX_VIDEO_BYTES) {
      errEl.textContent = "Fichier trop lourd (" + (file.size / 1024 / 1024).toFixed(1) + " Mo). Limite actuelle : " + (MAX_VIDEO_BYTES / 1024 / 1024) + " Mo.";
      e.target.value = "";
      document.getElementById("vd-filename").textContent = "";
      return;
    }
    vdPendingFile = file;
    document.getElementById("vd-filename").textContent = file.name + " (" + (file.size / 1024 / 1024).toFixed(1) + " Mo)";
  });

  function renderVideos() {
    var el = document.getElementById("vd-list");
    el.innerHTML = data.videos.length ? "" : '<p class="empty-mini">Aucune vidéo ajoutée.</p>';
    data.videos.forEach(function (v) {
      var parsed = CC.parseVideo(v.url);
      var isLocalFile = parsed && parsed.type === "indexeddb";
      var row = document.createElement("div");
      row.className = "admin-list-item";
      var metaLine = !parsed ? "⚠ format vidéo non reconnu"
        : isLocalFile ? "📁 Fichier stocké dans ce navigateur" + (v.fileSizeKB ? " (" + (v.fileSizeKB / 1024).toFixed(1) + " Mo)" : "")
        : esc(v.url.slice(0, 60)) + "…";
      row.innerHTML =
        '<div class="meta"><strong>' + esc(v.title || "Sans titre") + '</strong><span>' + metaLine + '</span></div>' +
        '<div class="actions">' +
        '<button type="button" class="a-edit">Modifier</button>' +
        (!isLocalFile ? '<a class="a-open" target="_blank" rel="noopener noreferrer">Ouvrir</a><button type="button" class="a-copy">Copier le lien</button>' : '<button type="button" class="a-preview">Aperçu</button>') +
        '<button type="button" class="a-del">Supprimer</button>' +
        "</div>";
      var openLink = row.querySelector(".a-open");
      if (openLink) openLink.href = v.url;
      row.querySelector(".a-edit").addEventListener("click", function () { startEditVideo(v); });
      var copyBtn = row.querySelector(".a-copy");
      if (copyBtn) copyBtn.addEventListener("click", function () {
        if (navigator.clipboard) navigator.clipboard.writeText(v.url).then(function () { toast("Lien copié."); });
      });
      var previewBtn = row.querySelector(".a-preview");
      if (previewBtn) previewBtn.addEventListener("click", function () {
        previewBtn.textContent = "Chargement…";
        CC.getVideoBlob(parsed.id).then(function (blob) {
          previewBtn.textContent = "Aperçu";
          if (!blob) { toast("Fichier introuvable dans ce navigateur."); return; }
          window.open(URL.createObjectURL(blob), "_blank");
        });
      });
      row.querySelector(".a-del").addEventListener("click", function () {
        if (!confirm("Supprimer cette vidéo ?")) return;
        var refToDelete = isLocalFile ? parsed.id : null;
        if (commit(function () { data.videos = data.videos.filter(function (x) { return x.id !== v.id; }); }, "Vidéo supprimée.")) {
          if (refToDelete) CC.deleteVideoBlob(refToDelete);
          renderVideos();
        }
      });
      el.appendChild(row);
    });
    updateStorageGauge();
  }
  function startEditVideo(v) {
    vdEditingId = v.id;
    vdPendingFile = null;
    var isLocalFile = v.url.indexOf("indexeddb:") === 0;
    vdExistingUrl = isLocalFile ? v.url : null;
    document.getElementById("vd-url").value = isLocalFile ? "" : v.url;
    document.getElementById("vd-title").value = v.title || "";
    document.getElementById("vd-desc").value = v.desc || "";
    document.getElementById("vd-file").value = "";
    document.getElementById("vd-filename").textContent = isLocalFile ? "Fichier existant conservé (choisissez un nouveau fichier pour le remplacer)" : "";
    document.getElementById("vd-submit").textContent = "Enregistrer les modifications";
    document.getElementById("vd-cancel").style.display = "inline-block";
    document.getElementById("video-form").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function resetVideoForm() {
    vdEditingId = null; vdExistingUrl = null; vdPendingFile = null;
    document.getElementById("vd-url").value = "";
    document.getElementById("vd-title").value = "";
    document.getElementById("vd-desc").value = "";
    document.getElementById("vd-file").value = "";
    document.getElementById("vd-filename").textContent = "";
    document.getElementById("vd-submit").textContent = "Ajouter la vidéo";
    document.getElementById("vd-cancel").style.display = "none";
    document.getElementById("vd-err").textContent = "";
  }
  document.getElementById("vd-cancel").addEventListener("click", resetVideoForm);
  document.getElementById("vd-submit").addEventListener("click", function () {
    var errEl = document.getElementById("vd-err");
    var submitBtn = document.getElementById("vd-submit");
    errEl.textContent = "";
    var title = document.getElementById("vd-title").value.trim();
    var desc = document.getElementById("vd-desc").value.trim();

    function proceed(finalUrl, sizeKB, brandNewIndexedId) {
      if (!finalUrl || !CC.isSafeUrl(finalUrl) || !CC.parseVideo(finalUrl)) {
        errEl.textContent = "Format non reconnu. Utilisez un lien YouTube, Vimeo, ou un fichier vidéo (.mp4/.webm).";
        if (brandNewIndexedId) CC.deleteVideoBlob(brandNewIndexedId);
        return;
      }
      var replacedOldRef = (vdEditingId && brandNewIndexedId && vdExistingUrl) ? vdExistingUrl.slice("indexeddb:".length) : null;
      var ok;
      if (vdEditingId) {
        var editId = vdEditingId;
        ok = commit(function () {
          var v = data.videos.find(function (x) { return x.id === editId; });
          if (v) { v.url = finalUrl; v.title = title; v.desc = desc; if (sizeKB) v.fileSizeKB = sizeKB; }
        }, "Vidéo modifiée.");
      } else {
        ok = commit(function () {
          var item = { id: CC.uid(), url: finalUrl, title: title, desc: desc };
          if (sizeKB) item.fileSizeKB = sizeKB;
          data.videos.push(item);
        }, "Vidéo ajoutée.");
      }
      if (ok) {
        if (replacedOldRef) CC.deleteVideoBlob(replacedOldRef);
        resetVideoForm(); renderVideos();
      } else if (brandNewIndexedId) {
        CC.deleteVideoBlob(brandNewIndexedId); // évite un fichier orphelin si l'enregistrement échoue
      }
    }

    if (vdPendingFile) {
      var file = vdPendingFile;
      var newId = CC.uid();
      submitBtn.disabled = true; submitBtn.textContent = "Enregistrement du fichier…";
      CC.storeVideoBlob(newId, file).then(function () {
        submitBtn.disabled = false; submitBtn.textContent = vdEditingId ? "Enregistrer les modifications" : "Ajouter la vidéo";
        proceed("indexeddb:" + newId, Math.round(file.size / 1024), newId);
      }).catch(function (e) {
        submitBtn.disabled = false; submitBtn.textContent = vdEditingId ? "Enregistrer les modifications" : "Ajouter la vidéo";
        errEl.textContent = "Impossible d'enregistrer ce fichier dans ce navigateur (" + (e && e.message ? e.message : "erreur inconnue") + ").";
      });
    } else if (vdExistingUrl) {
      proceed(vdExistingUrl, null, null);
    } else {
      var typedUrl = document.getElementById("vd-url").value.trim();
      if (!typedUrl) { errEl.textContent = "Choisissez un fichier vidéo ou collez un lien."; return; }
      proceed(typedUrl, null, null);
    }
  });

  /* ============ TEMOIGNAGES ============ */
  var tsEditingId = null;
  function renderTestis() {
    var el = document.getElementById("ts-list");
    el.innerHTML = data.testimonials.length ? "" : '<p class="empty-mini">Aucun témoignage publié.</p>';
    data.testimonials.forEach(function (t) {
      var row = document.createElement("div");
      row.className = "admin-list-item";
      row.innerHTML =
        '<div class="meta"><strong>' + esc(t.name) + "</strong><span>" + esc(t.message.slice(0, 70)) + '…</span></div>' +
        '<div class="actions"><button type="button" class="a-edit">Modifier</button><button type="button" class="a-del">Supprimer</button></div>';
      row.querySelector(".a-edit").addEventListener("click", function () { startEditTesti(t); });
      row.querySelector(".a-del").addEventListener("click", function () {
        if (!confirm("Supprimer ce témoignage ?")) return;
        if (commit(function () { data.testimonials = data.testimonials.filter(function (x) { return x.id !== t.id; }); }, "Témoignage supprimé.")) renderTestis();
      });
      el.appendChild(row);
    });
  }
  function startEditTesti(t) {
    tsEditingId = t.id;
    document.getElementById("ts-name").value = t.name;
    document.getElementById("ts-msg").value = t.message;
    document.getElementById("ts-submit").textContent = "Enregistrer les modifications";
    document.getElementById("ts-cancel").style.display = "inline-block";
    document.getElementById("testi-form-admin").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function resetTestiForm() {
    tsEditingId = null;
    document.getElementById("ts-name").value = "";
    document.getElementById("ts-msg").value = "";
    document.getElementById("ts-submit").textContent = "Publier";
    document.getElementById("ts-cancel").style.display = "none";
    document.getElementById("ts-err").textContent = "";
  }
  document.getElementById("ts-cancel").addEventListener("click", resetTestiForm);
  document.getElementById("ts-submit").addEventListener("click", function () {
    var name = document.getElementById("ts-name").value.trim();
    var msg = document.getElementById("ts-msg").value.trim();
    var errEl = document.getElementById("ts-err");
    errEl.textContent = "";
    if (!name || !msg) { errEl.textContent = "Merci de renseigner un nom et un message."; return; }
    var ok;
    if (tsEditingId) {
      var editId = tsEditingId;
      ok = commit(function () {
        var t = data.testimonials.find(function (x) { return x.id === editId; });
        if (t) { t.name = name; t.message = msg; }
      }, "Témoignage modifié.");
    } else {
      ok = commit(function () { data.testimonials.push({ id: CC.uid(), name: name, message: msg }); }, "Témoignage publié.");
    }
    if (ok) { resetTestiForm(); renderTestis(); }
  });

  /* ============ MESSAGES REÇUS ============ */
  function renderMessages() {
    var el = document.getElementById("msg-list");
    var msgs = CC.getMessages();
    el.innerHTML = msgs.length ? "" : '<p class="empty-mini">Aucun message enregistré sur cet appareil.</p>';
    msgs.forEach(function (m) {
      var box = document.createElement("div");
      box.className = "msg-item" + (m.done ? " done" : "");
      var label = m.kind === "reservation" ? "Demande de prestation" : "Témoignage";
      var details = m.kind === "reservation"
        ? [m.email, m.phone, m.type, m.eventDate, m.org].filter(Boolean).map(esc).join(" · ")
        : "";
      box.innerHTML =
        '<div class="top"><span class="tag">' + esc(label) + '</span><span class="date">' + new Date(m.date).toLocaleString("fr-FR") + '</span></div>' +
        "<strong>" + esc(m.name) + "</strong>" +
        (details ? '<div class="details">' + details + "</div>" : "") +
        '<p class="body-text">' + esc(m.message) + "</p>" +
        '<div class="actions"><button type="button" class="a-done">' + (m.done ? "Marquer non traité" : "Marquer traité") + '</button><button type="button" class="a-del">Supprimer</button></div>';
      box.querySelector(".a-done").addEventListener("click", function () { toggleMessageDone(m.id); renderMessages(); });
      box.querySelector(".a-del").addEventListener("click", function () {
        if (!confirm("Supprimer ce message ?")) return;
        CC.deleteMessage(m.id); renderMessages();
      });
      el.appendChild(box);
    });
  }
  function toggleMessageDone(id) {
    var list = CC.getMessages();
    var m = list.find(function (x) { return x.id === id; });
    if (m) m.done = !m.done;
    localStorage.setItem(CC.MSG_KEY, JSON.stringify(list));
  }

  /* ============ COORDONNEES ============ */
  function fillSettings() {
    var s = data.settings;
    document.getElementById("s-name").value = s.responsable.indexOf("[") === 0 ? "" : s.responsable;
    document.getElementById("s-phone").value = s.phone.indexOf("[") === 0 ? "" : s.phone;
    document.getElementById("s-email").value = s.email.indexOf("[") === 0 ? "" : s.email;
    document.getElementById("s-address").value = s.address.indexOf("[") === 0 ? "" : s.address;
    document.getElementById("s-endpoint").value = s.messageEndpoint || "";
  }
  document.getElementById("s-save").addEventListener("click", function () {
    var name = document.getElementById("s-name").value.trim();
    var phone = document.getElementById("s-phone").value.trim();
    var email = document.getElementById("s-email").value.trim();
    var address = document.getElementById("s-address").value.trim();
    var endpoint = document.getElementById("s-endpoint").value.trim();
    commit(function () {
      data.settings.responsable = name || "[Nom du responsable à compléter]";
      data.settings.phone = phone || "[Numéro à compléter]";
      data.settings.email = email || "[Adresse e-mail à compléter]";
      data.settings.address = address || "[Adresse à compléter]";
      data.settings.messageEndpoint = endpoint;
    }, "Coordonnées enregistrées.");
  });
})();
