/* Nurvale Dental Studio demo: language toggle (EN/AR, RTL) + GSAP scroll motion.
   Content is fully visible without JS or with reduced motion; GSAP only adds motion. */
(function () {
  "use strict";

  var T = {
    en: {
      skip: "Skip to content", brand: "Nurvale Dental Studio", navBook: "Book a visit",
      heroEyebrow: "Family dentistry in a calm, bright studio",
      heroL1: "Gentle care", heroL2: "for every smile", heroL3: "in your city.",
      heroLead: "Check-ups, cleaning and cosmetic visits, booked online in under a minute. Arabic and English spoken.",
      heroCta: "Book your first visit", heroLink: "See our services",
      svcEyebrow: "Services", svcTitle: "Everything a family needs, in one place",
      s1t: "Check-ups and cleaning", s1p: "A full check, X-rays when needed, and a gentle professional clean. Most visits take 30 to 45 minutes.",
      s2t: "Whitening", s2p: "In-studio whitening or a take-home kit. We talk through the options and the price before we start.",
      s3t: "Fillings and repairs", s3p: "Tooth-coloured fillings and small repairs, with numbing that is explained step by step.",
      s4t: "Aligner consultations", s4p: "A first talk about clear aligners: what is involved, how long it may take, and what it costs.",
      docTag: "Your lead dentist", docEyebrow: "Meet the dentist", docTitle: "Dr. Your Name, here to explain every step",
      docP: "This is where your dentist's photo and short story go: where they trained, what they love about the work, and how they make nervous patients feel at ease.",
      st1: "days open each week", st2: "languages spoken", st3: "minutes for a first visit",
      hEyebrow: "Hours and location", hTitle: "Easy to reach, easy to park",
      d1: "Saturday to Wednesday", t1: "9:00 to 19:00", d2: "Thursday", t2: "9:00 to 15:00", d3: "Friday", t3: "Closed",
      addr: "Your street address and building name go here, with a link to Google Maps.",
      mapNote: "Map placeholder", mapAria: "Map placeholder",
      bookLine: "Pick a time that suits you, get a reminder the day before, and walk in to a team that already knows why you came.",
      bookCta: "Book online", bookSmall: "Or call the clinic. Your phone number and WhatsApp link go here.",
      foot: "Demo site by Luna HQ, made-up clinic.", lang: "العربية", langCode: "ar"
    },
    ar: {
      skip: "انتقل إلى المحتوى", brand: "استوديو نورفيل لطب الأسنان", navBook: "احجز زيارة",
      heroEyebrow: "طب أسنان للعائلة في استوديو هادئ ومشرق",
      heroL1: "رعاية لطيفة", heroL2: "لكل ابتسامة", heroL3: "في مدينتك.",
      heroLead: "فحوصات وتنظيف وزيارات تجميلية، تحجزها أونلاين في أقل من دقيقة. نتحدث العربية والإنجليزية.",
      heroCta: "احجز زيارتك الأولى", heroLink: "شاهد خدماتنا",
      svcEyebrow: "الخدمات", svcTitle: "كل ما تحتاجه العائلة في مكان واحد",
      s1t: "فحص وتنظيف", s1p: "فحص كامل، وصور أشعة عند الحاجة، وتنظيف احترافي لطيف. معظم الزيارات تستغرق من 30 إلى 45 دقيقة.",
      s2t: "تبييض الأسنان", s2p: "تبييض في العيادة أو عُدّة للاستخدام في المنزل. نشرح لك الخيارات والسعر قبل أن نبدأ.",
      s3t: "حشوات وترميم", s3p: "حشوات بلون الأسنان وترميمات بسيطة، مع شرح التخدير خطوة بخطوة.",
      s4t: "استشارة التقويم الشفاف", s4p: "جلسة أولى عن التقويم الشفاف: ما الذي يتضمنه، وكم قد يستغرق، وكم يكلف.",
      docTag: "طبيب الأسنان الرئيسي", docEyebrow: "تعرّف على الطبيب", docTitle: "د. اسمك هنا، ليشرح لك كل خطوة",
      docP: "هنا تضع صورة طبيبك وقصته القصيرة: أين تدرّب، وما الذي يحبه في عمله، وكيف يطمئن المرضى القلقين.",
      st1: "أيام عمل في الأسبوع", st2: "لغتان نتحدثهما", st3: "دقيقة للزيارة الأولى",
      hEyebrow: "المواعيد والموقع", hTitle: "سهل الوصول، وسهل الاصطفاف",
      d1: "من السبت إلى الأربعاء", t1: "9:00 حتى 19:00", d2: "الخميس", t2: "9:00 حتى 15:00", d3: "الجمعة", t3: "مغلق",
      addr: "هنا يوضع عنوان الشارع واسم المبنى، مع رابط إلى خرائط جوجل.",
      mapNote: "مكان الخريطة", mapAria: "مكان الخريطة",
      bookLine: "اختر الوقت الذي يناسبك، واستلم تذكيرًا قبل يوم، وادخل إلى فريق يعرف سبب زيارتك مسبقًا.",
      bookCta: "احجز أونلاين", bookSmall: "أو اتصل بالعيادة. هنا يوضع رقم الهاتف ورابط واتساب.",
      foot: "موقع تجريبي من Luna HQ، والعيادة غير حقيقية.", lang: "English", langCode: "en"
    }
  };

  var current = "en";
  var btn = document.getElementById("langBtn");
  var rebuildWords = function () {};

  function apply(lang) {
    current = lang;
    var d = T[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (d[k] != null) el.textContent = d[k];
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", d[el.getAttribute("data-i18n-aria")]);
    });
    document.title = d.brand + (lang === "ar" ? " (تجريبي)" : " (demo)");
    btn.textContent = d.lang;
    btn.setAttribute("lang", d.langCode);
    rebuildWords();
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }
  btn.addEventListener("click", function () { apply(current === "en" ? "ar" : "en"); });
  if (/[?&]lang=ar\b/.test(location.search)) apply("ar");

  /* ---------- motion ---------- */
  function initMotion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    var mm = gsap.matchMedia();

    mm.add({
      motion: "(prefers-reduced-motion: no-preference)",
      coarse: "(pointer: coarse)"
    }, function (ctx) {
      if (!ctx.conditions.motion) return; // reduced motion: page stays static and fully visible
      var lite = ctx.conditions.coarse;

      // HERO: masked line reveal + depth entrance
      var intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      intro.from(".hero .line-in", { yPercent: 110, duration: 1.1, stagger: 0.12 })
           .from(".hero .eyebrow, .hero .lead, .hero .cta-row", { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 }, "-=0.7")
           .from(".tooth-wrap", { scale: 0.8, opacity: 0, rotate: -8, duration: 1.4, ease: "elastic.out(1, 0.6)" }, 0.1)
           .from(".hero .ring", { scale: 0.6, opacity: 0, duration: 1.2, stagger: 0.1 }, 0.2);

      // HERO: depth parallax on scroll (bigger depth number moves more)
      var speeds = { 0: 10, 1: 25, 2: 50, 3: 80, 5: 120 };
      Object.keys(speeds).forEach(function (dep) {
        gsap.to(".hero .depth-" + dep, {
          yPercent: lite ? speeds[dep] / 3 : speeds[dep] / 1.6, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
        });
      });
      gsap.to(".hero-copy", { opacity: 0, y: -40, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });

      // SERVICES: pinned scrub sequence, one card at a time
      var svc = document.querySelector(".services");
      var cards = gsap.utils.toArray(".svc-card");
      var steps = gsap.utils.toArray(".svc-steps li");
      svc.classList.add("is-pinned");
      gsap.set(cards, { autoAlpha: 0, y: 60 });
      gsap.set(cards[0], { autoAlpha: 1, y: 0 });
      var stl = gsap.timeline({
        scrollTrigger: { trigger: ".services", start: "top top", end: "+=" + (cards.length * (lite ? 55 : 80)) + "%", scrub: 0.6, pin: true, anticipatePin: 1 }
      });
      cards.forEach(function (card, i) {
        stl.to(steps[i], { "--p": 1, duration: 1, ease: "none" }, i);
        if (i < cards.length - 1) {
          stl.to(card, { autoAlpha: 0, y: -60, scale: 0.96, duration: 0.45, ease: "power2.in" }, i + 0.55)
             .to(cards[i + 1], { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power2.out" }, i + 0.75);
        }
      });
      gsap.from(".svc-head h2", { y: 40, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: ".services", start: "top 75%" } });

      // DOCTOR: card rises with parallax, copy reveals, counters count up
      gsap.from(".doc-card", { y: 80, rotate: -3, opacity: 0, duration: 1.2, ease: "power3.out",
        scrollTrigger: { trigger: ".doctor", start: "top 70%" } });
      gsap.to(".doc-card", { yPercent: -10, ease: "none",
        scrollTrigger: { trigger: ".doctor", start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from(".doc-copy > *", { y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: "power3.out",
        scrollTrigger: { trigger: ".doc-copy", start: "top 75%" } });
      document.querySelectorAll(".count").forEach(function (el) {
        var to = +el.getAttribute("data-to"), o = { v: 0 };
        gsap.to(o, { v: to, duration: 1.6, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
          onUpdate: function () { el.textContent = Math.round(o.v); } });
      });

      // HOURS: roads draw in, pin drops
      document.querySelectorAll(".road").forEach(function (p) {
        var len = p.getTotalLength();
        gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut",
          scrollTrigger: { trigger: ".map", start: "top 80%" },
          onComplete: function () { if (p.closest(".thin")) { p.style.strokeDasharray = "10 10"; p.style.strokeDashoffset = 0; } } });
      });
      gsap.from(".pin", { y: -120, opacity: 0, duration: 1, ease: "bounce.out", delay: 0.8,
        scrollTrigger: { trigger: ".map", start: "top 80%" } });
      gsap.from(".hours-list div", { x: function () { return current === "ar" ? 30 : -30; }, opacity: 0, stagger: 0.08, duration: 0.7,
        scrollTrigger: { trigger: ".hours-list", start: "top 85%" } });

      // BOOKING: word-by-word scroll lighting (rebuilt when the language changes)
      var wordsTween = null;
      rebuildWords = function () {
        var el = document.getElementById("bookWords");
        if (wordsTween) { wordsTween.scrollTrigger && wordsTween.scrollTrigger.kill(); wordsTween.kill(); }
        var text = T[current].bookLine;
        el.setAttribute("aria-label", text);
        el.innerHTML = text.split(/(\s+)/).map(function (w) {
          return /^\s+$/.test(w) ? w : '<span class="w" aria-hidden="true">' + w + "</span>";
        }).join("");
        wordsTween = gsap.fromTo(el.querySelectorAll(".w"), { opacity: 0.18 }, { opacity: 1, stagger: 0.08, ease: "none",
          scrollTrigger: { trigger: ".book", start: "top 70%", end: "center 55%", scrub: true } });
      };
      rebuildWords();
      gsap.from(".book .btn-big", { scale: 0.85, opacity: 0, duration: 0.9, ease: "back.out(2)",
        scrollTrigger: { trigger: ".book .btn-big", start: "top 90%" } });

      return function () { // reverting (e.g. user turns on reduced motion)
        svc.classList.remove("is-pinned");
        rebuildWords = function () {};
        var el = document.getElementById("bookWords");
        el.textContent = T[current].bookLine; el.removeAttribute("aria-label");
      };
    });
  }

  if (document.readyState === "complete") initMotion();
  else window.addEventListener("load", initMotion);
})();
