(function () {
  "use strict";
  let esc = CC.escapeHtml;
  let data = null;
  let currentLang = CC.getLang();

  /* ---------- Thème (mode sombre) ---------- */
  CC.initTheme();
  let themeBtn = document.getElementById("theme-toggle");
  function updateThemeBtnLabel() {
    let isDark = CC.getTheme() === "dark";
    let label = CC_I18N.t(currentLang, isDark ? "theme_toggle_light" : "theme_toggle_dark");
    themeBtn.textContent = (isDark ? "☀️ " : "🌙 ") + label;
  }
  updateThemeBtnLabel();
  themeBtn.addEventListener("click", function () { CC.toggleTheme(); updateThemeBtnLabel(); });

  /* ---------- Langue ---------- */
  let langSelect = document.getElementById("lang-select");
  Object.keys(CC_I18N.LABELS).forEach(function (code) {
    let opt = document.createElement("option");
    opt.value = code;
    opt.textContent = CC_I18N.LABELS[code];
    langSelect.appendChild(opt);
  });
  langSelect.value = currentLang;
  CC_I18N.apply(currentLang);
  langSelect.addEventListener("change", function () {
    currentLang = langSelect.value;
    CC.setLang(currentLang);
    CC_I18N.apply(currentLang);
    updateThemeBtnLabel();
    if (data) { renderGallery(); renderVideos(); renderTestimonials(); }
  });

  /* ---------- NAV ---------- */
  let nav = document.getElementById("site-nav");
  window.addEventListener("scroll", function () {
    nav.classList.toggle("solid", window.scrollY > 40);
  });
  let navLinks = document.getElementById("nav-links");
  document.getElementById("nav-toggle").addEventListener("click", function () {
    let isOpen = navLinks.classList.toggle("open");
    this.textContent = isOpen ? "✕" : "☰";
    this.setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
  });
  navLinks.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      navLinks.classList.remove("open");
      let toggleBtn = document.getElementById("nav-toggle");
      toggleBtn.textContent = "☰";
      toggleBtn.setAttribute("aria-label", "Ouvrir le menu");
    });
  });

  /* ---------- Étoiles du ciel (décor) ---------- */
  let starsGroup = document.getElementById("stars");
  for (let i = 0; i < 28; i++) {
    let s = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    s.setAttribute("cx", Math.random() * 1200);
    s.setAttribute("cy", Math.random() * 380);
    s.setAttribute("r", (Math.random() * 1.3 + 0.4).toFixed(2));
    s.setAttribute("class", "star");
    s.style.opacity = (Math.random() * 0.6 + 0.15).toFixed(2);
    starsGroup.appendChild(s);
  }

  /* ---------- À propos ---------- */
  function renderAbout() {
    document.getElementById("about-p1").textContent = data.about.paragraph1;
    document.getElementById("about-p2").textContent = data.about.paragraph2;
    document.getElementById("about-verse").textContent = "« " + data.about.verseText + " »";
    document.getElementById("about-verse-ref").textContent = data.about.verseRef;

    let vg = document.getElementById("values-grid");
    vg.innerHTML = "";
    data.about.cards.forEach(function (c) {
      let div = document.createElement("div");
      div.className = "value-card";
      div.innerHTML =
        '<svg class="icn" viewBox="0 0 24 24" fill="none" width="34" height="34" style="color:let(--dawn-copper);margin-bottom:14px;" aria-hidden="true"><path d="M9 17V9a3 3 0 0 1 6 0v8M7 17c-3 0-5-2.5-5-6h2c0 2.5 1.3 4 3 4M17 17c3 0 5-2.5 5-6h-2c0 2.5-1.3 4-3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>' +
        "<h3>" + esc(c.title) + "</h3><p>" + esc(c.description) + "</p>";
      vg.appendChild(div);
    });
  }

  /* ---------- Galerie ---------- */
  let liked = {};
  try { liked = JSON.parse(localStorage.getItem(CC.LIKES_KEY) || "{}"); } catch (e) { liked = {}; }

  function renderGallery() {
    let el = document.getElementById("gallery-grid");
    el.innerHTML = "";
    if (!data.photos.length) {
      el.innerHTML = '<div class="empty-state"><svg class="icn" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.4" stroke="currentColor" stroke-width="1.5"/></svg><p>' + esc(CC_I18N.t(currentLang, "gallery_empty")) + "</p></div>";
      return;
    }
    let likeLabel = CC_I18N.t(currentLang, "like_label"), likedLabel = CC_I18N.t(currentLang, "liked_label");
    data.photos.forEach(function (p) {
      if (!CC.isSafeUrl(p.url)) return;
      let card = document.createElement("div");
      card.className = "photo-card";
      let isLiked = !!liked[p.id];
      card.innerHTML =
        '<img src="' + esc(p.url) + '" alt="' + esc(p.caption || "") + '" loading="lazy">' +
        '<button class="like-btn' + (isLiked ? " liked" : "") + '" type="button" data-id="' + esc(p.id) + '">' +
        '<svg viewBox="0 0 24 24" fill="' + (isLiked ? "currentColor" : "none") + '" aria-hidden="true"><path d="M12 21s-7-4.5-9.5-9C.7 8.4 2.3 5 5.6 5c1.9 0 3.4 1 4.4 2.5C11 6 12.5 5 14.4 5c3.3 0 4.9 3.4 3.1 7-2.5 4.5-9.5 9-9.5 9z" stroke="currentColor" stroke-width="1.6"/></svg>' +
        "<span>" + (isLiked ? esc(likedLabel) : esc(likeLabel)) + "</span></button>" +
        '<div class="cap">' + esc(p.caption || "") + "</div>";
      card.querySelector("img").addEventListener("click", function () { openLightbox(p.url, p.caption || ""); });
      preventCopy(card.querySelector("img"));
      card.querySelector(".like-btn").addEventListener("click", function (ev) {
        ev.stopPropagation();
        liked[p.id] = !liked[p.id];
        localStorage.setItem(CC.LIKES_KEY, JSON.stringify(liked));
        renderGallery();
      });
      el.appendChild(card);
    });
  }

  function openLightbox(url, cap) {
    if (!CC.isSafeUrl(url)) return;
    document.getElementById("lb-img").src = url;
    document.getElementById("lb-cap").textContent = cap;
    document.getElementById("lightbox").classList.add("open");
  }
  document.getElementById("lb-close").addEventListener("click", function () {
    document.getElementById("lightbox").classList.remove("open");
    document.getElementById("lb-img").src = "";
  });
  document.getElementById("lightbox").addEventListener("click", function (e) {
    if (e.target.id === "lightbox") { e.currentTarget.classList.remove("open"); document.getElementById("lb-img").src = ""; }
  });

  /* ---------- Protection légère contre la sauvegarde facile (dissuasive, pas absolue) ---------- */
  function preventCopy(el) {
    el.setAttribute("draggable", "false");
    el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    el.addEventListener("dragstart", function (e) { e.preventDefault(); });
  }

  /* ---------- Vidéos (vignette réelle, aperçu au survol, lecture en grand écran) ---------- */
  function renderVideos() {
    let el = document.getElementById("video-grid");
    el.innerHTML = "";
    let playable = data.videos.filter(function (v) { return v.url && CC.parseVideo(v.url); });
    if (!playable.length) {
      el.innerHTML = '<div class="empty-state"><svg class="icn" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4l14 8-14 8V4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg><p>' + esc(CC_I18N.t(currentLang, "videos_empty")) + "</p></div>";
      return;
    }
    playable.forEach(function (v) {
      let parsed = CC.parseVideo(v.url);
      let poster = v.thumbnail || parsed.autoThumb || null;
      let canHoverPreview = parsed.type === "file" || parsed.type === "indexeddb";
      let card = document.createElement("div");
      card.className = "video-card";
      card.innerHTML =
        '<button class="video-thumb" type="button" aria-label="Lire la vidéo ' + esc(v.title || "") + '"' +
        (poster ? ' style="background-image:url(&quot;' + esc(poster) + '&quot;);background-size:cover;background-position:center;"' : "") +
        '><div class="play"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></div></button>' +
        '<div class="video-info"><h3>' + esc(v.title || "Vidéo") + "</h3><p>" + esc(v.desc || "") + "</p></div>";
      let thumbBtn = card.querySelector(".video-thumb");
      
      if (poster) { let posterImgTest = new Image(); posterImgTest.src = poster; preventCopy(thumbBtn); }
      thumbBtn.addEventListener("click", function () { openVideoModal(v); });

      if (canHoverPreview) {
        let previewVideo = null;
        let hoverTimer = null;
        thumbBtn.addEventListener("mouseenter", function () {
          hoverTimer = setTimeout(function () {
            resolvePreviewSrc(v, parsed).then(function (src) {
              if (!src) return;
              previewVideo = document.createElement("video");
              previewVideo.className = "hover-preview-video";
              previewVideo.src = src; previewVideo.muted = true; previewVideo.loop = true; previewVideo.playsInline = true;
              previewVideo.setAttribute("controlsList", "nodownload noremoteplayback");
              preventCopy(previewVideo);
              thumbBtn.appendChild(previewVideo);
              previewVideo.play().catch(function () {});
            });
          }, 220); // léger délai pour éviter de déclencher sur un simple passage de souris
        });
        thumbBtn.addEventListener("mouseleave", function () {
          clearTimeout(hoverTimer);
          if (previewVideo) { previewVideo.pause(); previewVideo.remove(); previewVideo = null; }
        });
      }
      el.appendChild(card);
    });
  }

  // Récupère une URL de lecture directe pour l'aperçu au survol (sans passer par la modale).
  function resolvePreviewSrc(v, parsed) {
    if (parsed.type === "file") {
      // Si l'URL n'a pas déjà de paramètre de temps, on ajoute #t=0.1
      let src = parsed.src.includes("#t=") ? parsed.src : parsed.src + "#t=1";
      return Promise.resolve(src);
    }
    if (parsed.type === "indexeddb") {
      return CC.getVideoBlob(parsed.id).then(function (blob) { 
        return blob ? URL.createObjectURL(blob) + "#t=0.1" : null; 
      }).catch(function () { return null; });
    }
    return Promise.resolve(null);
  }

  let vmFrame = document.getElementById("vm-frame");
  let vmObjectUrl = null;
  function openVideoModal(v) {
    let parsed = CC.parseVideo(v.url);
    if (!parsed) return;
    document.getElementById("vm-title").textContent = v.title || "";
    let posterAttr = (v.thumbnail || parsed.autoThumb) ? ' poster="' + esc(v.thumbnail || parsed.autoThumb) + '"' : "";
    if (parsed.type === "iframe") {
      vmFrame.innerHTML = '<iframe src="' + esc(parsed.src) + '" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="' + esc(v.title || "Vidéo") + '"></iframe>';
      document.getElementById("video-modal").classList.add("open");
    } else if (parsed.type === "file") {
      vmFrame.innerHTML = '<video src="' + esc(parsed.src) + '"' + posterAttr + ' controls controlsList="nodownload noremoteplayback" autoplay playsinline></video>';
      preventCopy(vmFrame.querySelector("video"));
      document.getElementById("video-modal").classList.add("open");
    } else if (parsed.type === "indexeddb") {
      vmFrame.innerHTML = '<p style="color:#fff;text-align:center;padding:40px;">Chargement…</p>';
      document.getElementById("video-modal").classList.add("open");
      CC.getVideoBlob(parsed.id).then(function (blob) {
        if (!blob) { vmFrame.innerHTML = '<p style="color:#fff;text-align:center;padding:40px;">Vidéo introuvable sur cet appareil.</p>'; return; }
        vmObjectUrl = URL.createObjectURL(blob);
        vmFrame.innerHTML = '<video src="' + vmObjectUrl + '"' + posterAttr + ' controls controlsList="nodownload noremoteplayback" autoplay playsinline></video>';
        preventCopy(vmFrame.querySelector("video"));
      }).catch(function () {
        vmFrame.innerHTML = '<p style="color:#fff;text-align:center;padding:40px;">Erreur de lecture de la vidéo.</p>';
      });
    }
  }
  function closeVideoModal() {
    document.getElementById("video-modal").classList.remove("open");
    vmFrame.innerHTML = "";
    if (vmObjectUrl) { URL.revokeObjectURL(vmObjectUrl); vmObjectUrl = null; }
  }
  document.getElementById("vm-close").addEventListener("click", closeVideoModal);
  document.getElementById("video-modal").addEventListener("click", function (e) {
    if (e.target.id === "video-modal") closeVideoModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeVideoModal(); document.getElementById("lightbox").classList.remove("open"); }
  });

  /* ---------- Témoignages ---------- */
  function renderTestimonials() {
    let el = document.getElementById("testi-grid");
    el.innerHTML = "";
    if (!data.testimonials.length) {
      el.innerHTML = '<div class="empty-state" style="background:transparent;border-color:rgba(251,248,241,.3);color:rgba(251,248,241,.75);"><p>' + esc(CC_I18N.t(currentLang, "testi_empty")) + "</p></div>";
      return;
    }
    data.testimonials.forEach(function (t) {
      let card = document.createElement("div");
      card.className = "testi-card";
      card.innerHTML =
        '<svg class="quote-icn" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 15c-2 0-3-1.5-3-4 0-3 2-5.5 5-6l.5 1.5C7.5 7 6.5 8.3 6.3 10c1.6 0 2.7 1 2.7 2.5S8 15 7 15zm10 0c-2 0-3-1.5-3-4 0-3 2-5.5 5-6l.5 1.5c-2 .5-3 1.8-3.2 3.5 1.6 0 2.7 1 2.7 2.5S18 15 17 15z" fill="#e7b24c"/></svg>' +
        '<p class="msg">' + esc(t.message) + '</p><div class="who">' + esc(t.name || "Anonyme") + "</div>";
      el.appendChild(card);
    });
  }

  /* ---------- Coordonnées ---------- */
  function renderSettings() {
    document.getElementById("c-name").textContent = data.settings.responsable;
    document.getElementById("c-phone").textContent = data.settings.phone;
    document.getElementById("c-email").textContent = data.settings.email;
    document.getElementById("c-address").textContent = data.settings.address;
    enhanceStructuredData();
  }

  function enhanceStructuredData() {
    let s = data.settings;
    let isReal = function (v) { return v && v.indexOf("[") !== 0; };
    let ld = {
      "@context": "https://schema.org",
      "@type": "MusicGroup",
      "name": "Colombe céleste",
      "genre": "Gospel",
      "description": "Chorale gospel de l'aumônerie protestante du génie militaire.",
      "slogan": "Colombe céleste, oiseau du salut, lumière du ciel"
    };
    if (isReal(s.address)) ld.location = { "@type": "Place", "name": s.address };
    let contactPoint = {};
    if (isReal(s.phone)) contactPoint.telephone = s.phone;
    if (isReal(s.email)) contactPoint.email = s.email;
    if (isReal(s.responsable)) contactPoint.name = s.responsable;
    if (Object.keys(contactPoint).length) {
      contactPoint["@type"] = "ContactPoint";
      contactPoint.contactType = "booking";
      ld.contactPoint = contactPoint;
    }
    let script = document.getElementById("ld-json");
    if (script) script.textContent = JSON.stringify(ld, null, 2);
  }

  CC_REPO.load().then(function (loaded) {
    data = loaded;
    renderAbout(); renderGallery(); renderVideos(); renderTestimonials(); renderSettings();
  });
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Formulaires : jamais de redirection, jamais de changement de page ---------- */
  function showFormMsg(el, text, ok) {
    el.textContent = text;
    el.className = "form-msg " + (ok ? "ok" : "err");
  }

  document.getElementById("booking-form").addEventListener("submit", function (e) {
    e.preventDefault();
    let out = document.getElementById("b-form-msg");
    let name = document.getElementById("b-name").value.trim();
    let email = document.getElementById("b-email").value.trim();
    let msg = document.getElementById("b-msg").value.trim();
    if (!name || !email || !msg) { showFormMsg(out, "Merci de renseigner votre nom, votre e-mail et votre message.", false); return; }

    let entry = {
      kind: "reservation",
      name: name,
      org: document.getElementById("b-org").value.trim(),
      email: email,
      phone: document.getElementById("b-phone").value.trim(),
      type: document.getElementById("b-type").value,
      eventDate: document.getElementById("b-date").value,
      message: msg
    };
    let form = this;
    CC_REPO.sendMessage(entry).then(function () {
      if (data && data.settings) CC.trySendToEndpoint(data.settings.messageEndpoint, entry);
      showFormMsg(out, "Merci ! Votre demande a bien été enregistrée. Le responsable de l'aumônerie reviendra vers vous.", true);
      form.reset();
    });
  });

  document.getElementById("testi-form").addEventListener("submit", function (e) {
    e.preventDefault();
    let out = document.getElementById("t-form-msg");
    let name = document.getElementById("t-name").value.trim();
    let msg = document.getElementById("t-msg").value.trim();
    if (!name || !msg) { showFormMsg(out, "Merci de renseigner votre nom et votre message.", false); return; }
    let entry = { kind: "testimonial", name: name, message: msg };
    let form = this;
    CC_REPO.sendMessage(entry).then(function () {
      if (data && data.settings) CC.trySendToEndpoint(data.settings.messageEndpoint, entry);
      showFormMsg(out, "Merci pour votre message ! Il sera examiné avant publication.", true);
      form.reset();
    });
  });
})();
