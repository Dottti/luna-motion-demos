// Nurvale Dental Studio (made-up clinic), premium demo: all page text in English and Arabic.
// Language comes from ?lang=ar|en, else the last choice (localStorage), else English. Applied before any motion
// starts, so split text and pinned sections are built on the final words. Switching language reloads the page.
export const T = {
  en: {
    skip: 'Skip to content', brand: 'Nurvale Dental Studio', navBook: 'Book a visit', lang: 'العربية',
    heroEyebrow: 'Family dentistry in a calm, bright studio',
    heroTitle: 'Gentle care for every smile.',
    heroLead: 'Check-ups, cleaning and cosmetic visits, booked online in under a minute. Arabic and English spoken.',
    heroCta: 'Book your first visit', heroLink: 'See our services', scroll: 'Scroll',
    svcEyebrow: 'Services', svcTitle: 'Everything a family needs, in one place',
    s1t: 'Check-ups and cleaning', s1p: 'A full check, X-rays when needed, and a gentle professional clean. Most visits take 30 to 45 minutes.',
    s2t: 'Whitening', s2p: 'In-studio whitening or a take-home kit. We talk through the options and the price before we start.',
    s3t: 'Fillings and repairs', s3p: 'Tooth-coloured fillings and small repairs, with numbing that is explained step by step.',
    s4t: 'Aligner consultations', s4p: 'A first talk about clear aligners: what is involved, how long it may take, and what it costs.',
    docEyebrow: 'Meet the dentist', docTitle: 'Dr. Your Name, here to explain every step', docTag: 'Your lead dentist',
    docP: "This is where your dentist's photo and short story go: where they trained, what they love about the work, and how they make nervous patients feel at ease.",
    st1: 'days open each week', st2: 'languages spoken', st3: 'minutes for a first visit',
    hEyebrow: 'Hours and location', hTitle: 'Easy to reach, easy to park',
    d1: 'Saturday to Wednesday', t1: '9:00 to 19:00', d2: 'Thursday', t2: '9:00 to 15:00', d3: 'Friday', t3: 'Closed',
    addr: 'Your street address and building name go here, with a link to Google Maps.', mapNote: 'Map placeholder',
    bookLine: 'Pick a time that suits you, get a reminder the day before, and walk in to a team that already knows why you came.',
    bookCta: 'Book online', bookSmall: 'Or call the clinic. Your phone number and WhatsApp link go here.',
    foot: 'Demo site by Luna HQ, made-up clinic.',
    // booking page
    bTitle: 'Book a visit', bLead: 'Choose a visit and a time. Your real booking tool connects here.',
    bType: 'Type of visit', bv1: 'Check-up and cleaning', bv2: 'Whitening consultation', bv3: 'Aligner consultation',
    bDay: 'Day', bTime: 'Time', bNote: 'Demo only: nothing is sent and no booking is made.',
    bCta: 'Continue', bBack: 'Back to the clinic',
    bName: 'Your name', bPhone: 'Phone number', bSent: 'Demo only: nothing was sent.', bHint: 'We only use it to confirm your visit.',
    days: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed'],
  },
  ar: {
    skip: 'انتقل إلى المحتوى', brand: 'استوديو نورفيل لطب الأسنان', navBook: 'احجز زيارة', lang: 'English',
    heroEyebrow: 'طب أسنان للعائلة في استوديو هادئ ومشرق',
    heroTitle: 'رعاية لطيفة لكل ابتسامة.',
    heroLead: 'فحوصات وتنظيف وزيارات تجميلية، تحجزها أونلاين في أقل من دقيقة. نتحدث العربية والإنجليزية.',
    heroCta: 'احجز زيارتك الأولى', heroLink: 'شاهد خدماتنا', scroll: 'مرّر',
    svcEyebrow: 'الخدمات', svcTitle: 'كل ما تحتاجه العائلة في مكان واحد',
    s1t: 'فحص وتنظيف', s1p: 'فحص كامل، وصور أشعة عند الحاجة، وتنظيف احترافي لطيف. معظم الزيارات تستغرق من 30 إلى 45 دقيقة.',
    s2t: 'تبييض الأسنان', s2p: 'تبييض في العيادة أو عُدّة للاستخدام في المنزل. نشرح لك الخيارات والسعر قبل أن نبدأ.',
    s3t: 'حشوات وترميم', s3p: 'حشوات بلون الأسنان وترميمات بسيطة، مع شرح التخدير خطوة بخطوة.',
    s4t: 'استشارة التقويم الشفاف', s4p: 'جلسة أولى عن التقويم الشفاف: ما الذي يتضمنه، وكم قد يستغرق، وكم يكلف.',
    docEyebrow: 'تعرّف على الطبيب', docTitle: 'د. اسمك هنا، ليشرح لك كل خطوة', docTag: 'طبيب الأسنان الرئيسي',
    docP: 'هنا تضع صورة طبيبك وقصته القصيرة: أين تدرّب، وما الذي يحبه في عمله، وكيف يطمئن المرضى القلقين.',
    st1: 'أيام عمل في الأسبوع', st2: 'لغتان نتحدثهما', st3: 'دقيقة للزيارة الأولى',
    hEyebrow: 'المواعيد والموقع', hTitle: 'سهل الوصول، وسهل الاصطفاف',
    d1: 'من السبت إلى الأربعاء', t1: '9:00 حتى 19:00', d2: 'الخميس', t2: '9:00 حتى 15:00', d3: 'الجمعة', t3: 'مغلق',
    addr: 'هنا يوضع عنوان الشارع واسم المبنى، مع رابط إلى خرائط جوجل.', mapNote: 'مكان الخريطة',
    bookLine: 'اختر الوقت الذي يناسبك، واستلم تذكيرًا قبل يوم، وادخل إلى فريق يعرف سبب زيارتك مسبقًا.',
    bookCta: 'احجز أونلاين', bookSmall: 'أو اتصل بالعيادة. هنا يوضع رقم الهاتف ورابط واتساب.',
    foot: 'موقع تجريبي من Luna HQ، والعيادة غير حقيقية.',
    bTitle: 'احجز زيارة', bLead: 'اختر نوع الزيارة والوقت. هنا تُربط أداة الحجز الحقيقية الخاصة بك.',
    bType: 'نوع الزيارة', bv1: 'فحص وتنظيف', bv2: 'استشارة تبييض', bv3: 'استشارة تقويم شفاف',
    bDay: 'اليوم', bTime: 'الوقت', bNote: 'نسخة تجريبية فقط: لا يُرسل شيء ولا يتم أي حجز.',
    bCta: 'متابعة', bBack: 'العودة إلى العيادة',
    bName: 'اسمك', bPhone: 'رقم الهاتف', bSent: 'نسخة تجريبية فقط: لم يُرسل شيء.', bHint: 'نستخدمه فقط لتأكيد موعدك.',
    days: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء'],
  },
};

export function currentLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'ar' || q === 'en') { try { localStorage.setItem('nurvale-lang', q); } catch (e) { /* ignore */ } return q; }
  try { const s = localStorage.getItem('nurvale-lang'); if (s === 'ar' || s === 'en') return s; } catch (e) { /* ignore */ }
  return 'en';
}

export function applyLang(lang) {
  const d = T[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { const v = d[el.dataset.i18n]; if (v != null) el.textContent = v; });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => { const v = d[el.dataset.i18nAria]; if (v != null) el.setAttribute('aria-label', v); });
  document.title = (document.body.dataset.page === 'book' ? d.bTitle + ' · ' : '') + d.brand + (lang === 'ar' ? ' (تجريبي)' : ' (demo)');
  const btn = document.getElementById('langBtn');
  if (btn) {
    btn.textContent = d.lang; btn.setAttribute('lang', lang === 'ar' ? 'en' : 'ar');
    btn.addEventListener('click', () => {
      const next = lang === 'ar' ? 'en' : 'ar';
      try { localStorage.setItem('nurvale-lang', next); } catch (e) { /* ignore */ }
      const u = new URL(location.href); u.searchParams.set('lang', next); location.href = u.toString();
    });
  }
  // keep the language on links to the other page
  document.querySelectorAll('a[data-keep-lang]').forEach((a) => { const u = new URL(a.getAttribute('href'), location.href); u.searchParams.set('lang', lang); a.href = u.toString(); });
  return d;
}
