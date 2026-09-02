/* ============================================================
   Colombe céleste — internationalisation de l'interface publique
   Ne traduit que les textes fixes de l'interface (menus, boutons,
   libellés). Le contenu ajouté depuis l'espace admin (présentation,
   photos, vidéos, témoignages) reste dans la langue où il a été saisi.
   ============================================================ */
var CC_I18N = (function () {
  "use strict";

  var DICT = {
    fr: {
      nav_chorale: "La chorale", nav_galerie: "Galerie", nav_videos: "Vidéos",
      nav_temoignages: "Témoignages", nav_reserver: "Réserver", nav_contact: "Contacter l'aumônerie",
      hero_eyebrow: "Aumônerie protestante du génie militaire",
      hero_subtitle: "Une chorale gospel qui élève les voix et les cœurs, au service des temps de culte et des moments de communion de l'aumônerie protestante du génie militaire.",
      hero_cta_listen: "Écouter la chorale", hero_cta_book: "Faire une demande de prestation",
      about_eyebrow: "Qui sommes-nous", about_title: "Des voix rassemblées par la foi",
      gallery_eyebrow: "En images", gallery_title: "Nos événements",
      gallery_subtitle: "Concerts, cultes et répétitions : des instants partagés en images.",
      gallery_empty: "Aucune photo pour le moment.",
      videos_eyebrow: "À écouter", videos_title: "Nos prestations en vidéo",
      videos_subtitle: "Retrouvez la chorale en pleine performance, lors de nos cultes et concerts.",
      videos_empty: "Aucune vidéo pour le moment.",
      testi_eyebrow: "Vos mots nous touchent", testi_title: "Ce que vous en dites",
      testi_subtitle: "Les retours de celles et ceux qui nous ont écoutés ou accueillis.",
      testi_empty: "Aucun témoignage publié pour le moment.",
      testi_form_title: "Laisser un message", testi_form_hint: "Votre message sera transmis à la chorale.",
      testi_name_label: "Votre nom", testi_name_ph: "Votre nom",
      testi_msg_label: "Votre message", testi_msg_ph: "Partagez votre ressenti...",
      testi_submit: "Envoyer mon message",
      reserve_eyebrow: "Inviter la chorale", reserve_title: "Faire une demande de prestation",
      reserve_intro: "Le lieu de culte de la chorale étant fixé au sein de l'aumônerie protestante du génie militaire, toute demande pour faire intervenir Colombe céleste doit être adressée au responsable de l'aumônerie, seul habilité à valider la venue de la chorale.",
      contact_card_title: "Contact de l'aumônerie", contact_card_note: "Pour toute demande de prestation, contactez directement le responsable.",
      contact_lbl_responsable: "Responsable de l'aumônerie", contact_lbl_phone: "Téléphone",
      contact_lbl_email: "E-mail", contact_lbl_address: "Lieu de culte",
      booking_form_title: "Votre demande", booking_form_hint: "Votre demande est enregistrée directement, sans quitter cette page.",
      b_name_label: "Nom et prénom", b_org_label: "Organisation / paroisse",
      b_email_label: "E-mail", b_phone_label: "Téléphone",
      b_type_label: "Type d'événement", b_date_label: "Date souhaitée",
      b_msg_label: "Votre message", b_msg_ph: "Décrivez votre demande...",
      b_submit: "Envoyer ma demande",
      opt_culte: "Culte dominical", opt_mariage: "Mariage religieux", opt_ceremonie: "Cérémonie militaire",
      opt_concert: "Concert / événement communautaire", opt_autre: "Autre",
      footer_tagline: "Chorale de l'aumônerie protestante du génie militaire.",
      footer_nav_title: "Navigation", footer_contact_title: "Contact",
      footer_link_reserve: "Réserver la chorale", footer_link_coords: "Coordonnées de l'aumônerie",
      footer_copyright_suffix: "Colombe céleste — Aumônerie protestante du génie militaire.",
      like_label: "J'aime", liked_label: "Aimé",
      theme_toggle_dark: "Mode sombre", theme_toggle_light: "Mode clair"
    },
    en: {
      nav_chorale: "The choir", nav_galerie: "Gallery", nav_videos: "Videos",
      nav_temoignages: "Testimonials", nav_reserver: "Book us", nav_contact: "Contact the chaplaincy",
      hero_eyebrow: "Protestant chaplaincy of the military engineer corps",
      hero_subtitle: "A gospel choir that lifts voices and hearts, serving worship services and moments of fellowship within the Protestant chaplaincy of the military engineer corps.",
      hero_cta_listen: "Listen to the choir", hero_cta_book: "Request a performance",
      about_eyebrow: "About us", about_title: "Voices gathered by faith",
      gallery_eyebrow: "In pictures", gallery_title: "Our events",
      gallery_subtitle: "Concerts, services and rehearsals: shared moments in pictures.",
      gallery_empty: "No photos yet.",
      videos_eyebrow: "Watch & listen", videos_title: "Our performances on video",
      videos_subtitle: "See the choir in full performance, during our services and concerts.",
      videos_empty: "No videos yet.",
      testi_eyebrow: "Your words move us", testi_title: "What people say",
      testi_subtitle: "Feedback from those who have heard or hosted us.",
      testi_empty: "No testimonials published yet.",
      testi_form_title: "Leave a message", testi_form_hint: "Your message will be shared with the choir.",
      testi_name_label: "Your name", testi_name_ph: "Your name",
      testi_msg_label: "Your message", testi_msg_ph: "Share your thoughts...",
      testi_submit: "Send my message",
      reserve_eyebrow: "Invite the choir", reserve_title: "Request a performance",
      reserve_intro: "As the choir's place of worship is fixed within the Protestant chaplaincy of the military engineer corps, any request to have Colombe céleste perform must be addressed to the chaplaincy's officer in charge, who alone can approve the choir's participation.",
      contact_card_title: "Chaplaincy contact", contact_card_note: "For any performance request, contact the officer in charge directly.",
      contact_lbl_responsable: "Chaplaincy officer in charge", contact_lbl_phone: "Phone",
      contact_lbl_email: "Email", contact_lbl_address: "Place of worship",
      booking_form_title: "Your request", booking_form_hint: "Your request is saved directly, without leaving this page.",
      b_name_label: "Full name", b_org_label: "Organisation / parish",
      b_email_label: "Email", b_phone_label: "Phone",
      b_type_label: "Type of event", b_date_label: "Preferred date",
      b_msg_label: "Your message", b_msg_ph: "Describe your request...",
      b_submit: "Send my request",
      opt_culte: "Sunday service", opt_mariage: "Religious wedding", opt_ceremonie: "Military ceremony",
      opt_concert: "Concert / community event", opt_autre: "Other",
      footer_tagline: "Choir of the Protestant chaplaincy of the military engineer corps.",
      footer_nav_title: "Navigation", footer_contact_title: "Contact",
      footer_link_reserve: "Book the choir", footer_link_coords: "Chaplaincy contact details",
      footer_copyright_suffix: "Colombe céleste — Protestant chaplaincy of the military engineer corps.",
      like_label: "Like", liked_label: "Liked",
      theme_toggle_dark: "Dark mode", theme_toggle_light: "Light mode"
    },
    de: {
      nav_chorale: "Der Chor", nav_galerie: "Galerie", nav_videos: "Videos",
      nav_temoignages: "Erfahrungsberichte", nav_reserver: "Chor buchen", nav_contact: "Militärseelsorge kontaktieren",
      hero_eyebrow: "Evangelische Militärseelsorge der Pioniertruppe",
      hero_subtitle: "Ein Gospelchor, der Stimmen und Herzen erhebt und den Gottesdiensten und Gemeinschaftsmomenten der evangelischen Militärseelsorge der Pioniertruppe dient.",
      hero_cta_listen: "Chor anhören", hero_cta_book: "Auftritt anfragen",
      about_eyebrow: "Über uns", about_title: "Stimmen, vom Glauben vereint",
      gallery_eyebrow: "In Bildern", gallery_title: "Unsere Veranstaltungen",
      gallery_subtitle: "Konzerte, Gottesdienste und Proben: gemeinsame Momente in Bildern.",
      gallery_empty: "Noch keine Fotos vorhanden.",
      videos_eyebrow: "Zum Anschauen", videos_title: "Unsere Auftritte im Video",
      videos_subtitle: "Erleben Sie den Chor bei Gottesdiensten und Konzerten.",
      videos_empty: "Noch keine Videos vorhanden.",
      testi_eyebrow: "Ihre Worte berühren uns", testi_title: "Das sagen andere",
      testi_subtitle: "Rückmeldungen von Menschen, die uns gehört oder empfangen haben.",
      testi_empty: "Noch keine Erfahrungsberichte veröffentlicht.",
      testi_form_title: "Nachricht hinterlassen", testi_form_hint: "Ihre Nachricht wird an den Chor weitergeleitet.",
      testi_name_label: "Ihr Name", testi_name_ph: "Ihr Name",
      testi_msg_label: "Ihre Nachricht", testi_msg_ph: "Teilen Sie Ihre Eindrücke mit...",
      testi_submit: "Nachricht senden",
      reserve_eyebrow: "Chor einladen", reserve_title: "Auftritt anfragen",
      reserve_intro: "Da der Gottesdienstort des Chores innerhalb der evangelischen Militärseelsorge der Pioniertruppe festgelegt ist, muss jede Anfrage für einen Auftritt von Colombe céleste an den Verantwortlichen der Militärseelsorge gerichtet werden, der allein über den Einsatz des Chores entscheidet.",
      contact_card_title: "Kontakt zur Militärseelsorge", contact_card_note: "Wenden Sie sich für Auftrittsanfragen direkt an den Verantwortlichen.",
      contact_lbl_responsable: "Verantwortlicher der Militärseelsorge", contact_lbl_phone: "Telefon",
      contact_lbl_email: "E-Mail", contact_lbl_address: "Gottesdienstort",
      booking_form_title: "Ihre Anfrage", booking_form_hint: "Ihre Anfrage wird direkt gespeichert, ohne diese Seite zu verlassen.",
      b_name_label: "Vor- und Nachname", b_org_label: "Organisation / Gemeinde",
      b_email_label: "E-Mail", b_phone_label: "Telefon",
      b_type_label: "Art der Veranstaltung", b_date_label: "Gewünschtes Datum",
      b_msg_label: "Ihre Nachricht", b_msg_ph: "Beschreiben Sie Ihre Anfrage...",
      b_submit: "Anfrage senden",
      opt_culte: "Sonntagsgottesdienst", opt_mariage: "Kirchliche Trauung", opt_ceremonie: "Militärische Zeremonie",
      opt_concert: "Konzert / Gemeindeveranstaltung", opt_autre: "Sonstiges",
      footer_tagline: "Chor der evangelischen Militärseelsorge der Pioniertruppe.",
      footer_nav_title: "Navigation", footer_contact_title: "Kontakt",
      footer_link_reserve: "Chor buchen", footer_link_coords: "Kontaktdaten der Militärseelsorge",
      footer_copyright_suffix: "Colombe céleste — Evangelische Militärseelsorge der Pioniertruppe.",
      like_label: "Gefällt mir", liked_label: "Gefällt mir",
      theme_toggle_dark: "Dunkler Modus", theme_toggle_light: "Heller Modus"
    },
    es: {
      nav_chorale: "El coro", nav_galerie: "Galería", nav_videos: "Vídeos",
      nav_temoignages: "Testimonios", nav_reserver: "Reservar", nav_contact: "Contactar con la capellanía",
      hero_eyebrow: "Capellanía protestante del cuerpo de ingenieros militares",
      hero_subtitle: "Un coro gospel que eleva voces y corazones, al servicio de los cultos y los momentos de comunión de la capellanía protestante del cuerpo de ingenieros militares.",
      hero_cta_listen: "Escuchar al coro", hero_cta_book: "Solicitar una actuación",
      about_eyebrow: "Quiénes somos", about_title: "Voces unidas por la fe",
      gallery_eyebrow: "En imágenes", gallery_title: "Nuestros eventos",
      gallery_subtitle: "Conciertos, cultos y ensayos: momentos compartidos en imágenes.",
      gallery_empty: "Todavía no hay fotos.",
      videos_eyebrow: "Para escuchar", videos_title: "Nuestras actuaciones en vídeo",
      videos_subtitle: "Descubra al coro en plena actuación, en nuestros cultos y conciertos.",
      videos_empty: "Todavía no hay vídeos.",
      testi_eyebrow: "Sus palabras nos conmueven", testi_title: "Lo que dicen de nosotros",
      testi_subtitle: "Opiniones de quienes nos han escuchado o acogido.",
      testi_empty: "Todavía no hay testimonios publicados.",
      testi_form_title: "Dejar un mensaje", testi_form_hint: "Su mensaje será transmitido al coro.",
      testi_name_label: "Su nombre", testi_name_ph: "Su nombre",
      testi_msg_label: "Su mensaje", testi_msg_ph: "Comparta su opinión...",
      testi_submit: "Enviar mi mensaje",
      reserve_eyebrow: "Invitar al coro", reserve_title: "Solicitar una actuación",
      reserve_intro: "Dado que el lugar de culto del coro está fijado dentro de la capellanía protestante del cuerpo de ingenieros militares, toda solicitud para que Colombe céleste actúe debe dirigirse al responsable de la capellanía, único autorizado para aprobar la participación del coro.",
      contact_card_title: "Contacto de la capellanía", contact_card_note: "Para cualquier solicitud de actuación, contacte directamente con el responsable.",
      contact_lbl_responsable: "Responsable de la capellanía", contact_lbl_phone: "Teléfono",
      contact_lbl_email: "Correo electrónico", contact_lbl_address: "Lugar de culto",
      booking_form_title: "Su solicitud", booking_form_hint: "Su solicitud se guarda directamente, sin salir de esta página.",
      b_name_label: "Nombre y apellidos", b_org_label: "Organización / parroquia",
      b_email_label: "Correo electrónico", b_phone_label: "Teléfono",
      b_type_label: "Tipo de evento", b_date_label: "Fecha deseada",
      b_msg_label: "Su mensaje", b_msg_ph: "Describa su solicitud...",
      b_submit: "Enviar mi solicitud",
      opt_culte: "Culto dominical", opt_mariage: "Boda religiosa", opt_ceremonie: "Ceremonia militar",
      opt_concert: "Concierto / evento comunitario", opt_autre: "Otro",
      footer_tagline: "Coro de la capellanía protestante del cuerpo de ingenieros militares.",
      footer_nav_title: "Navegación", footer_contact_title: "Contacto",
      footer_link_reserve: "Reservar al coro", footer_link_coords: "Datos de contacto de la capellanía",
      footer_copyright_suffix: "Colombe céleste — Capellanía protestante del cuerpo de ingenieros militares.",
      like_label: "Me gusta", liked_label: "Te gusta",
      theme_toggle_dark: "Modo oscuro", theme_toggle_light: "Modo claro"
    }
  };

  var LABELS = { fr: "Français", en: "English", de: "Deutsch", es: "Español" };

  function t(lang, key) {
    var d = DICT[lang] || DICT.fr;
    return d[key] || DICT.fr[key] || key;
  }

  function apply(lang) {
    if (!DICT[lang]) lang = "fr";
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(lang, el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(lang, el.getAttribute("data-i18n-ph")));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(lang, el.getAttribute("data-i18n-aria")));
    });
  }

  return { DICT: DICT, LABELS: LABELS, t: t, apply: apply };
})();
