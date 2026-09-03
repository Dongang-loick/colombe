(function () {
  "use strict";
  var esc = CC.escapeHtml;

  /* Utilisé uniquement si Supabase n'est PAS configuré (voir assets/repo.js). */
  var ADMIN_PASSWORD = "colombe2026";

  var MAX_IMAGE_BYTES = 2 * 1024 * 1024;         // repli local (pas de Cloudinary) : 2 Mo
  var MAX_IMAGE_BYTES_CLOUD = 10 * 1024 * 1024;  // via Cloudinary : 10 Mo
  var MAX_VIDEO_BYTES = 20 * 1024 * 1024;        // repli local (IndexedDB) : 20 Mo
  var MAX_VIDEO_BYTES_CLOUD = 100 * 1024 * 1024; // via Cloudinary : 100 Mo

  var data = null; // rempli après connexion, voir enterDashboard()

  function errMsg(res) {
    if (!res) return "Échec de l'enregistrement.";
    if (res.reason === "quota") return "Stockage plein (" + res.sizeKB + " Ko) : fichier trop volumineux pour ce navigateur.";
    if (res.message) return res.message;
    return "Échec de l'enregistrement.";
  }
  function toast(text) {
    var t = document.getElementById("save-toast");
    t.textContent = text; t.className = "save-toast show";
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }
  function toastError(text) {
    var t = document.getElementById("save-toast");
    t.textContent = text; t.className = "save-toast show error";
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 6000);
  }

  /* ============ AUTHENTIFICATION ============ */
  var gate = document.getElementById("admin-gate");
  var dashboard = document.getElementById("admin-dashboard");
  var emailField = document.getElementById("admin-email");
  var remoteNotice = document.getElementById("admin-mode-notice");

  if (CC_REPO.isRemote()) {
    emailField.style.display = "block";
    remoteNotice.textContent = "Connecté à la base de données partagée — visible sur tous les appareils.";
  } else {
    emailField.style.display = "none";
    remoteNotice.textContent = "Mode local (Supabase non configuré) — voir assets/repo.js pour l'activer.";
  }

  function enterDashboard() {
    gate.style.display = "none";
    dashboard.style.display = "block";
    CC_REPO.load().then(function (d) {
      data = d;
      renderAll();
      updateStorageGauge();
    });
  }

  if (CC_REPO.isLoggedIn()) enterDashboard();

  document.getElementById("admin-login").addEventListener("click", doLogin);
  document.getElementById("admin-pass").addEventListener("keydown", function (e) { if (e.key === "Enter") doLogin(); });

  function doLogin() {
    var err = document.getElementById("admin-err");
    var btn = document.getElementById("admin-login");
    err.textContent = "";
    if (CC_REPO.isRemote()) {
      var email = document.getElementById("admin-email").value.trim();
      var pass = document.getElementById("admin-pass").value;
      if (!email || !pass) { err.textContent = "Renseignez l'e-mail et le mot de passe du compte admin."; return; }
      btn.disabled = true; btn.textContent = "Connexion…";
      CC_REPO.login(email, pass).then(function (res) {
        btn.disabled = false; btn.textContent = "Se connecter";
        if (res.ok) enterDashboard(); else err.textContent = res.error;
      });
    } else {
      var val = document.getElementById("admin-pass").value;
      if (val === ADMIN_PASSWORD) { sessionStorage.setItem(CC.SESSION_KEY, "1"); enterDashboard(); }
      else err.textContent = "Mot de passe incorrect.";
    }
  }
  document.getElementById("admin-logout").addEventListener("click", function () {
    CC_REPO.logout();
    location.reload();
  });

  /* ============ THEME (mode sombre) — préférence locale, comme demandé ============ */
  CC.initTheme();
  var themeBtn = document.getElementById("theme-toggle");
  function updateThemeBtn() { themeBtn.textContent = CC.getTheme() === "dark" ? "☀️ Mode clair" : "🌙 Mode sombre"; }
  updateThemeBtn();
  themeBtn.addEventListener("click", function () { CC.toggleTheme(); updateThemeBtn(); });

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

  function updateStorageGauge() {
    var gauge = document.getElementById("storage-gauge");
    if (!gauge) return;
    if (CC_REPO.isRemote()) { gauge.innerHTML = "<span>☁ Stockage en base de données — pas de limite de navigateur</span>"; return; }
    var used = 0;
    try { used = (localStorage.getItem(CC.STORAGE_KEY) || "").length; } catch (e) {}
    var approxLimitKB = 5000;
    var usedKB = Math.round(used / 1024);
    var pct = Math.min(100, Math.round((usedKB / approxLimitKB) * 100));
    gauge.innerHTML = '<div class="gauge-bar"><div class="gauge-fill" style="width:' + pct + '%"></div></div><span>' + usedKB + " Ko utilisés sur environ " + approxLimitKB + " Ko disponibles</span>";
  }

  /* ============ QUI SOMMES-NOUS : présentation & verset ============ */
  function fillAbout() {
    document.getElementById("ab-p1").value = data.about.paragraph1;
    document.getElementById("ab-p2").value = data.about.paragraph2;
    document.getElementById("ab-verse").value = data.about.verseText;
    document.getElementById("ab-verse-ref").value = data.about.verseRef;
  }
  document.getElementById("ab-save").addEventListener("click", function () {
    var patch = {
      paragraph1: document.getElementById("ab-p1").value.trim() || data.about.paragraph1,
      paragraph2: document.getElementById("ab-p2").value.trim() || data.about.paragraph2,
      verseText: document.getElementById("ab-verse").value.trim() || data.about.verseText,
      verseRef: document.getElementById("ab-verse-ref").value.trim() || data.about.verseRef
    };
    CC_REPO.saveAboutText(patch).then(function (res) {
      if (res.ok) { Object.assign(data.about, patch); toast("Présentation enregistrée."); }
      else toastError(errMsg(res));
    });
  });

  /* ============ QUI SOMMES-NOUS : cartes de valeurs ============ */
  var cardEditingId = null;
  function renderCards() {
    var el = document.getElementById("card-list");
    el.innerHTML = data.about.cards.length ? "" : '<p class="empty-mini">Aucune carte pour le moment.</p>';
    data.about.cards.forEach(function (c) {
      var row = document.createElement("div");
      row.className = "admin-list-item";
      row.innerHTML = '<div class="meta"><strong>' + esc(c.title) + "</strong><span>" + esc(c.description) + '</span></div><div class="actions"><button type="button" class="a-edit">Modifier</button><button type="button" class="a-del">Supprimer</button></div>';
      row.querySelector(".a-edit").addEventListener("click", function () { startEditCard(c); });
      row.querySelector(".a-del").addEventListener("click", function () {
        if (!confirm("Supprimer cette carte ?")) return;
        CC_REPO.deleteAboutCard(c.id).then(function (res) {
          if (res.ok) { data.about.cards = data.about.cards.filter(function (x) { return x.id !== c.id; }); toast("Carte supprimée."); renderCards(); }
          else toastError(errMsg(res));
        });
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
    document.getElementById("cd-title").value = ""; document.getElementById("cd-desc").value = "";
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
    if (cardEditingId) {
      var editId = cardEditingId;
      CC_REPO.updateAboutCard(editId, { title: title, description: desc }).then(function (res) {
        if (res.ok) {
          var c = data.about.cards.find(function (x) { return x.id === editId; });
          if (c) { c.title = title; c.description = desc; }
          toast("Carte modifiée."); resetCardForm(); renderCards();
        } else errEl.textContent = errMsg(res);
      });
    } else {
      CC_REPO.addAboutCard({ title: title, description: desc }).then(function (res) {
        if (res.ok) { data.about.cards.push(res.item); toast("Carte ajoutée."); resetCardForm(); renderCards(); }
        else errEl.textContent = errMsg(res);
      });
    }
  });

  /* ============ PHOTOS ============ */
  var phEditingId = null;
  var phExistingUrl = null;
  var phPendingFile = null;

  document.getElementById("ph-file").addEventListener("change", function (e) {
    var file = e.target.files[0];
    var errEl = document.getElementById("ph-err");
    errEl.textContent = ""; phPendingFile = null;
    var prev = document.getElementById("ph-preview");
    if (!file) { document.getElementById("ph-filename").textContent = ""; prev.classList.remove("show"); return; }
    var cloudOn = CC.isCloudinaryConfigured(data.settings);
    var limit = cloudOn ? MAX_IMAGE_BYTES_CLOUD : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      errEl.textContent = "Image trop lourde (" + (file.size / 1024 / 1024).toFixed(1) + " Mo). Limite actuelle : " + Math.round(limit / 1024 / 1024) + " Mo.";
      e.target.value = ""; document.getElementById("ph-filename").textContent = "";
      return;
    }
    phPendingFile = file;
    prev.src = URL.createObjectURL(file); prev.classList.add("show");
    document.getElementById("ph-filename").textContent = file.name + " (" + (file.size / 1024 / 1024).toFixed(1) + " Mo)" + (cloudOn ? " — sera envoyée automatiquement" : "");
  });

  function renderPhotos() {
    var el = document.getElementById("ph-list");
    el.innerHTML = data.photos.length ? "" : '<p class="empty-mini">Aucune photo ajoutée.</p>';
    data.photos.forEach(function (p) {
      var row = document.createElement("div");
      row.className = "admin-list-item";
      var isCloud = /^https:\/\/res\.cloudinary\.com\//i.test(p.url);
      row.innerHTML =
        '<img class="thumb" src="' + esc(p.url) + '" alt="">' +
        '<div class="meta"><strong>' + esc(p.caption || "Sans légende") + "</strong><span>" + (isCloud ? "☁ Hébergée automatiquement" : esc(p.url.slice(0, 60)) + "…") + '</span></div>' +
        '<div class="actions"><button type="button" class="a-edit">Modifier</button><a class="a-dl" download="photo.jpg">Télécharger</a><button type="button" class="a-del">Supprimer</button></div>';
      row.querySelector(".a-dl").href = p.url;
      row.querySelector(".a-edit").addEventListener("click", function () { startEditPhoto(p); });
      row.querySelector(".a-del").addEventListener("click", function () {
        if (!confirm("Supprimer cette photo ?")) return;
        CC_REPO.deletePhoto(p.id).then(function (res) {
          if (res.ok) { data.photos = data.photos.filter(function (x) { return x.id !== p.id; }); toast("Photo supprimée."); renderPhotos(); }
          else toastError(errMsg(res));
        });
      });
      el.appendChild(row);
    });
    updateStorageGauge();
  }
  function startEditPhoto(p) {
    phEditingId = p.id; phPendingFile = null; phExistingUrl = p.url;
    var isLocalData = p.url.indexOf("data:") === 0;
    document.getElementById("ph-url").value = isLocalData ? "" : p.url;
    document.getElementById("ph-cap").value = p.caption || "";
    var prev = document.getElementById("ph-preview");
    prev.src = p.url; prev.classList.add("show");
    document.getElementById("ph-filename").textContent = isLocalData ? "Fichier existant conservé (choisissez un nouveau fichier pour le remplacer)" : "";
    document.getElementById("ph-submit").textContent = "Enregistrer les modifications";
    document.getElementById("ph-cancel").style.display = "inline-block";
    document.getElementById("photo-form").scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function resetPhotoForm() {
    phEditingId = null; phPendingFile = null; phExistingUrl = null;
    document.getElementById("ph-url").value = ""; document.getElementById("ph-cap").value = "";
    document.getElementById("ph-file").value = ""; document.getElementById("ph-filename").textContent = "";
    var prev = document.getElementById("ph-preview"); prev.src = ""; prev.classList.remove("show");
    document.getElementById("ph-submit").textContent = "Ajouter la photo";
    document.getElementById("ph-cancel").style.display = "none";
    document.getElementById("ph-err").textContent = "";
  }
  document.getElementById("ph-cancel").addEventListener("click", resetPhotoForm);
  document.getElementById("ph-submit").addEventListener("click", function () {
    var errEl = document.getElementById("ph-err");
    var submitBtn = document.getElementById("ph-submit");
    var cap = document.getElementById("ph-cap").value.trim();
    errEl.textContent = "";

    function proceed(finalUrl) {
      if (!finalUrl || !CC.isSafeUrl(finalUrl)) { errEl.textContent = "Choisissez une image ou collez un lien valide."; return; }
      if (phEditingId) {
        var editId = phEditingId;
        CC_REPO.updatePhoto(editId, { url: finalUrl, caption: cap }).then(function (res) {
          if (res.ok) {
            var p = data.photos.find(function (x) { return x.id === editId; });
            if (p) { p.url = finalUrl; p.caption = cap; }
            toast("Photo modifiée."); resetPhotoForm(); renderPhotos();
          } else errEl.textContent = errMsg(res);
        });
      } else {
        CC_REPO.addPhoto({ url: finalUrl, caption: cap }).then(function (res) {
          if (res.ok) { data.photos.push(res.item); toast("Photo ajoutée."); resetPhotoForm(); renderPhotos(); }
          else errEl.textContent = errMsg(res);
        });
      }
    }

    if (phPendingFile && CC.isCloudinaryConfigured(data.settings)) {
      submitBtn.disabled = true;
      CC.uploadToCloudinary(phPendingFile, "image", data.settings, function (pct) { submitBtn.textContent = "Envoi en cours… " + pct + "%"; })
        .then(function (res) { submitBtn.disabled = false; submitBtn.textContent = phEditingId ? "Enregistrer les modifications" : "Ajouter la photo"; proceed(res.url); })
        .catch(function (e) { submitBtn.disabled = false; submitBtn.textContent = phEditingId ? "Enregistrer les modifications" : "Ajouter la photo"; errEl.textContent = "Échec de l'envoi automatique : " + e.message; });
    } else if (phPendingFile) {
      var reader = new FileReader();
      reader.onload = function () { proceed(reader.result); };
      reader.readAsDataURL(phPendingFile);
    } else if (phExistingUrl) {
      proceed(phExistingUrl);
    } else {
      proceed(document.getElementById("ph-url").value.trim());
    }
  });

  /* ============ VIDEOS ============ */
  var vdEditingId = null;
  var vdExistingUrl = null;
  var vdExistingThumb = null;
  var vdPendingFile = null;

  document.getElementById("vd-file").addEventListener("change", function (e) {
    var file = e.target.files[0];
    var errEl = document.getElementById("vd-err");
    errEl.textContent = ""; vdPendingFile = null;
    if (!file) { document.getElementById("vd-filename").textContent = ""; return; }
    var cloudOn = CC.isCloudinaryConfigured(data.settings);
    var limit = cloudOn ? MAX_VIDEO_BYTES_CLOUD : MAX_VIDEO_BYTES;
    if (file.size > limit) {
      errEl.textContent = "Fichier trop lourd (" + (file.size / 1024 / 1024).toFixed(1) + " Mo). Limite actuelle : " + Math.round(limit / 1024 / 1024) + " Mo.";
      e.target.value = ""; document.getElementById("vd-filename").textContent = "";
      return;
    }
    vdPendingFile = file;
    document.getElementById("vd-filename").textContent = file.name + " (" + (file.size / 1024 / 1024).toFixed(1) + " Mo)" + (cloudOn ? " — sera envoyée automatiquement" : "");
  });

  function renderVideos() {
    var el = document.getElementById("vd-list");
    el.innerHTML = data.videos.length ? "" : '<p class="empty-mini">Aucune vidéo ajoutée.</p>';
    data.videos.forEach(function (v) {
      var parsed = CC.parseVideo(v.url);
      var isLocalFile = parsed && parsed.type === "indexeddb";
      var isCloud = /^https:\/\/res\.cloudinary\.com\//i.test(v.url);
      var row = document.createElement("div");
      row.className = "admin-list-item";
      var metaLine = !parsed ? "⚠ format vidéo non reconnu"
        : isLocalFile ? "📁 Fichier stocké dans ce navigateur" + (v.fileSizeKB ? " (" + (v.fileSizeKB / 1024).toFixed(1) + " Mo)" : "")
        : isCloud ? "☁ Hébergée automatiquement" : esc(v.url.slice(0, 60)) + "…";
      row.innerHTML =
        (v.thumbnail ? '<img class="thumb" src="' + esc(v.thumbnail) + '" alt="">' : '') +
        '<div class="meta"><strong>' + esc(v.title || "Sans titre") + '</strong><span>' + metaLine + '</span></div>' +
        '<div class="actions"><button type="button" class="a-edit">Modifier</button>' +
        (!isLocalFile ? '<a class="a-open" target="_blank" rel="noopener noreferrer">Ouvrir</a><button type="button" class="a-copy">Copier le lien</button>' : '<button type="button" class="a-preview">Aperçu</button>') +
        '<button type="button" class="a-del">Supprimer</button></div>';
      var openLink = row.querySelector(".a-open"); if (openLink) openLink.href = v.url;
      row.querySelector(".a-edit").addEventListener("click", function () { startEditVideo(v); });
      var copyBtn = row.querySelector(".a-copy");
      if (copyBtn) copyBtn.addEventListener("click", function () { if (navigator.clipboard) navigator.clipboard.writeText(v.url).then(function () { toast("Lien copié."); }); });
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
        CC_REPO.deleteVideo(v.id).then(function (res) {
          if (res.ok) {
            data.videos = data.videos.filter(function (x) { return x.id !== v.id; });
            if (refToDelete) CC.deleteVideoBlob(refToDelete);
            toast("Vidéo supprimée."); renderVideos();
          } else toastError(errMsg(res));
        });
      });
      el.appendChild(row);
    });
    updateStorageGauge();
  }
  function startEditVideo(v) {
    vdEditingId = v.id; vdPendingFile = null;
    var isLocalFile = v.url.indexOf("indexeddb:") === 0;
    vdExistingUrl = v.url;
    vdExistingThumb = v.thumbnail || null;
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
    vdEditingId = null; vdExistingUrl = null; vdExistingThumb = null; vdPendingFile = null;
    document.getElementById("vd-url").value = ""; document.getElementById("vd-title").value = ""; document.getElementById("vd-desc").value = "";
    document.getElementById("vd-file").value = ""; document.getElementById("vd-filename").textContent = "";
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
    var resetLabel = function () { submitBtn.textContent = vdEditingId ? "Enregistrer les modifications" : "Ajouter la vidéo"; };

    function proceed(finalUrl, sizeKB, brandNewIndexedId, thumbnail) {
      if (!finalUrl || !CC.isSafeUrl(finalUrl) || !CC.parseVideo(finalUrl)) {
        errEl.textContent = "Format non reconnu. Utilisez un lien YouTube, Vimeo, ou un fichier vidéo (.mp4/.webm).";
        if (brandNewIndexedId) CC.deleteVideoBlob(brandNewIndexedId);
        return;
      }
      var replacedOldRef = (vdEditingId && brandNewIndexedId && vdExistingUrl && vdExistingUrl.indexOf("indexeddb:") === 0) ? vdExistingUrl.slice("indexeddb:".length) : null;
      var finalThumb = thumbnail || (vdEditingId ? vdExistingThumb : null);
      var payload = { url: finalUrl, title: title, desc: desc, fileSizeKB: sizeKB, thumbnail: finalThumb };

      if (vdEditingId) {
        var editId = vdEditingId;
        CC_REPO.updateVideo(editId, payload).then(function (res) {
          if (res.ok) {
            var v = data.videos.find(function (x) { return x.id === editId; });
            if (v) { v.url = finalUrl; v.title = title; v.desc = desc; if (sizeKB) v.fileSizeKB = sizeKB; v.thumbnail = finalThumb || v.thumbnail; }
            if (replacedOldRef) CC.deleteVideoBlob(replacedOldRef);
            toast("Vidéo modifiée."); resetVideoForm(); renderVideos();
          } else { errEl.textContent = errMsg(res); if (brandNewIndexedId) CC.deleteVideoBlob(brandNewIndexedId); }
        });
      } else {
        CC_REPO.addVideo(payload).then(function (res) {
          if (res.ok) { data.videos.push(res.item); toast("Vidéo ajoutée."); resetVideoForm(); renderVideos(); }
          else { errEl.textContent = errMsg(res); if (brandNewIndexedId) CC.deleteVideoBlob(brandNewIndexedId); }
        });
      }
    }

    if (vdPendingFile && CC.isCloudinaryConfigured(data.settings)) {
      var cloudFile = vdPendingFile;
      submitBtn.disabled = true;
      CC.uploadToCloudinary(cloudFile, "video", data.settings, function (pct) { submitBtn.textContent = "Envoi en cours… " + pct + "%"; })
        .then(function (res) { submitBtn.disabled = false; resetLabel(); proceed(res.url, Math.round(cloudFile.size / 1024), null, res.thumbnail); })
        .catch(function (e) { submitBtn.disabled = false; resetLabel(); errEl.textContent = "Échec de l'envoi automatique : " + e.message; });
    } else if (vdPendingFile) {
      var file = vdPendingFile;
      var newId = CC.uid();
      submitBtn.disabled = true; submitBtn.textContent = "Enregistrement du fichier…";
      Promise.all([CC.storeVideoBlob(newId, file), CC.generateVideoThumbnail(file)]).then(function (results) {
        submitBtn.disabled = false; resetLabel();
        proceed("indexeddb:" + newId, Math.round(file.size / 1024), newId, results[1]);
      }).catch(function (e) {
        submitBtn.disabled = false; resetLabel();
        errEl.textContent = "Impossible d'enregistrer ce fichier dans ce navigateur (" + (e && e.message ? e.message : "erreur inconnue") + ").";
      });
    } else if (vdExistingUrl) {
      proceed(vdExistingUrl, null, null, null);
    } else {
      var typedUrl = document.getElementById("vd-url").value.trim();
      if (!typedUrl) { errEl.textContent = "Choisissez un fichier vidéo ou collez un lien."; return; }
      var parsedTyped = CC.parseVideo(typedUrl);
      if (parsedTyped && parsedTyped.autoThumb) {
        proceed(typedUrl, null, null, parsedTyped.autoThumb);
      } else if (/vimeo\.com/i.test(typedUrl)) {
        submitBtn.disabled = true; submitBtn.textContent = "Vérification du lien…";
        CC.fetchVimeoThumbnail(typedUrl).then(function (thumb) { submitBtn.disabled = false; resetLabel(); proceed(typedUrl, null, null, thumb); });
      } else {
        proceed(typedUrl, null, null, null);
      }
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
      row.innerHTML = '<div class="meta"><strong>' + esc(t.name) + "</strong><span>" + esc(t.message.slice(0, 70)) + '…</span></div><div class="actions"><button type="button" class="a-edit">Modifier</button><button type="button" class="a-del">Supprimer</button></div>';
      row.querySelector(".a-edit").addEventListener("click", function () { startEditTesti(t); });
      row.querySelector(".a-del").addEventListener("click", function () {
        if (!confirm("Supprimer ce témoignage ?")) return;
        CC_REPO.deleteTestimonial(t.id).then(function (res) {
          if (res.ok) { data.testimonials = data.testimonials.filter(function (x) { return x.id !== t.id; }); toast("Témoignage supprimé."); renderTestis(); }
          else toastError(errMsg(res));
        });
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
    document.getElementById("ts-name").value = ""; document.getElementById("ts-msg").value = "";
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
    if (tsEditingId) {
      var editId = tsEditingId;
      CC_REPO.updateTestimonial(editId, { name: name, message: msg }).then(function (res) {
        if (res.ok) {
          var t = data.testimonials.find(function (x) { return x.id === editId; });
          if (t) { t.name = name; t.message = msg; }
          toast("Témoignage modifié."); resetTestiForm(); renderTestis();
        } else errEl.textContent = errMsg(res);
      });
    } else {
      CC_REPO.addTestimonial({ name: name, message: msg }).then(function (res) {
        if (res.ok) { data.testimonials.push(res.item); toast("Témoignage publié."); resetTestiForm(); renderTestis(); }
        else errEl.textContent = errMsg(res);
      });
    }
  });

  /* ============ MESSAGES REÇUS ============ */
  function renderMessages() {
    var el = document.getElementById("msg-list");
    el.innerHTML = '<p class="empty-mini">Chargement…</p>';
    CC_REPO.getMessages().then(function (msgs) {
      el.innerHTML = msgs.length ? "" : '<p class="empty-mini">Aucun message enregistré.</p>';
      msgs.forEach(function (m) {
        var box = document.createElement("div");
        box.className = "msg-item" + (m.done ? " done" : "");
        var label = m.kind === "reservation" ? "Demande de prestation" : "Témoignage";
        var details = m.kind === "reservation" ? [m.email, m.phone, m.type, m.eventDate, m.org].filter(Boolean).map(esc).join(" · ") : "";
        box.innerHTML =
          '<div class="top"><span class="tag">' + esc(label) + '</span><span class="date">' + new Date(m.date).toLocaleString("fr-FR") + '</span></div>' +
          "<strong>" + esc(m.name) + "</strong>" + (details ? '<div class="details">' + details + "</div>" : "") +
          '<p class="body-text">' + esc(m.message) + '</p>' +
          '<div class="actions"><button type="button" class="a-done">' + (m.done ? "Marquer non traité" : "Marquer traité") + '</button><button type="button" class="a-del">Supprimer</button></div>';
        box.querySelector(".a-done").addEventListener("click", function () { CC_REPO.toggleMessageDone(m.id, m.done).then(function () { renderMessages(); }); });
        box.querySelector(".a-del").addEventListener("click", function () {
          if (!confirm("Supprimer ce message ?")) return;
          CC_REPO.deleteMessage(m.id).then(function () { renderMessages(); });
        });
        el.appendChild(box);
      });
    });
  }

  /* ============ COORDONNEES ============ */
  function fillSettings() {
    var s = data.settings;
    document.getElementById("s-name").value = s.responsable.indexOf("[") === 0 ? "" : s.responsable;
    document.getElementById("s-phone").value = s.phone.indexOf("[") === 0 ? "" : s.phone;
    document.getElementById("s-email").value = s.email.indexOf("[") === 0 ? "" : s.email;
    document.getElementById("s-address").value = s.address.indexOf("[") === 0 ? "" : s.address;
    document.getElementById("s-endpoint").value = s.messageEndpoint || "";
    document.getElementById("s-cloud-name").value = s.cloudinaryCloud || "";
    document.getElementById("s-cloud-preset").value = s.cloudinaryPreset || "";
    updateCloudStatus();
  }
  function updateCloudStatus() {
    var el = document.getElementById("cloud-status");
    if (!el) return;
    el.textContent = CC.isCloudinaryConfigured(data.settings) ? "✓ Envoi automatique activé" : "Non configuré — repli sur le stockage local";
    el.style.color = CC.isCloudinaryConfigured(data.settings) ? "#3f7d4c" : "var(--ink-soft)";
  }
  document.getElementById("s-save").addEventListener("click", function () {
    var patch = {
      responsable: document.getElementById("s-name").value.trim() || "[Nom du responsable à compléter]",
      phone: document.getElementById("s-phone").value.trim() || "[Numéro à compléter]",
      email: document.getElementById("s-email").value.trim() || "[Adresse e-mail à compléter]",
      address: document.getElementById("s-address").value.trim() || "[Adresse à compléter]",
      messageEndpoint: document.getElementById("s-endpoint").value.trim(),
      cloudinaryCloud: data.settings.cloudinaryCloud, cloudinaryPreset: data.settings.cloudinaryPreset
    };
    CC_REPO.saveSettings(patch).then(function (res) {
      if (res.ok) { Object.assign(data.settings, patch); toast("Coordonnées enregistrées."); }
      else toastError(errMsg(res));
    });
  });
  document.getElementById("s-cloud-save").addEventListener("click", function () {
    var patch = Object.assign({}, data.settings, {
      cloudinaryCloud: document.getElementById("s-cloud-name").value.trim(),
      cloudinaryPreset: document.getElementById("s-cloud-preset").value.trim()
    });
    CC_REPO.saveSettings(patch).then(function (res) {
      if (res.ok) { Object.assign(data.settings, patch); toast("Configuration enregistrée."); updateCloudStatus(); }
      else toastError(errMsg(res));
    });
  });
})();
