/* ==========================================================
   L&F Medical Clinic — Full Website Administrator Dashboard
   Client-side session + localStorage persistence
   ========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var gate = document.getElementById('gate');
  var emailOut = document.getElementById('email');
  var logout = document.getElementById('logout');
  var logout2 = document.getElementById('logout-2');

  if (!window.GFAuth) {
    window.location.replace('index.html');
    return;
  }

  var session = window.GFAuth.requireSession('index.html');
  if (!session) return;

  if (emailOut) emailOut.textContent = session.email || '';
  if (gate) gate.classList.add('hidden');

  function doLogout() {
    window.GFAuth.logout();
    window.location.replace('index.html');
  }
  if (logout) logout.addEventListener('click', doLogout);
  if (logout2) logout2.addEventListener('click', doLogout);

  var KEYS = {
    leads: 'gfamily_leads',
    services: 'gfamily_services',
    clinic: 'gfamily_clinic',
    oncall: 'gfamily_oncall',
    banner: 'gfamily_announcement',
    site: 'gfamily_site_content',
    faqs: 'gfamily_faqs',
    ai: 'gfamily_ai_config',
    posts: 'gfamily_blog_posts'
  };

  function load(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function save(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      toast('Could not save — browser storage quota may be full.', true);
      return false;
    }
  }

  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg, isError) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.className = 'toast'; }, 2800);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function readFileAsDataUrl(file, maxMb, cb) {
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      toast('Image exceeds ' + maxMb + 'MB limit.', true);
      return;
    }
    var reader = new FileReader();
    reader.onload = function () { cb(String(reader.result || '')); };
    reader.onerror = function () { toast('Could not read image file.', true); };
    reader.readAsDataURL(file);
  }

  var SERVICE_HELPER_TEXT = 'Recommended: 800 × 600 px or 800 × 1000 px • Displays with zoom-to-fit • JPG, PNG, WebP • Max 2MB';

  var DEFAULT_SERVICES = [
    {
      id: 'personal',
      name: 'Personal Care',
      filePath: 'images/service-personal-care.jpg',
      img: '../images/service-personal-care.jpg',
      desc: 'Respectful day-to-day assistance that helps clients maintain hygiene, comfort, dignity, and independence at home.',
      provisions: [
        'Bathing and personal hygiene assistance',
        'Dressing and grooming support',
        'Safe mobility and transfer assistance',
        'Feeding and daily-living assistance where required'
      ],
      whiteFrame: true,
      zoomFit: true,
      visible: true
    },
    {
      id: 'medical',
      name: 'Medical Care',
      filePath: 'images/service-medical-care.jpg',
      img: '../images/service-medical-care.jpg',
      desc: 'Professional clinical support delivered with attention to safety, accurate treatment routines, and ongoing health monitoring.',
      provisions: [
        'Medication support as directed by the care plan',
        'Wound-care assistance and clinical follow-up',
        'Basic health observations and monitoring',
        'Communication with the appropriate clinical team'
      ],
      whiteFrame: true,
      zoomFit: true,
      visible: true
    },
    {
      id: 'housecalls',
      name: 'House Calls',
      filePath: 'images/service-house-calls.jpg',
      img: '../images/service-house-calls.jpg',
      desc: 'Convenient home visits for clients who need professional health assessment, follow-up, or care without travelling to a facility.',
      provisions: [
        'Home-based health assessments and reviews',
        'Follow-up visits after illness or discharge',
        'Routine monitoring and care-plan reviews',
        'Referral or escalation when further medical attention is needed'
      ],
      whiteFrame: true,
      zoomFit: true,
      visible: true
    },
    {
      id: 'coordination',
      name: 'Advice & Coordination',
      filePath: 'images/service-coordination.jpg',
      img: '../images/service-coordination.jpg',
      desc: 'Practical guidance that helps families understand care options, organise services, and keep communication clear between the people involved in a client\'s care.',
      provisions: [
        'Care planning and service coordination',
        'Guidance on next steps and available care options',
        'Communication with families and relevant providers',
        'Follow-up to help keep care organised'
      ],
      whiteFrame: true,
      zoomFit: true,
      visible: true
    },
    {
      id: 'elderly',
      name: 'Elderly Care',
      filePath: 'images/service-elderly-care.jpg',
      img: '../images/service-elderly-care.jpg',
      desc: 'Personalised support for older adults focused on safety, dignity, comfort, daily routines, and maintaining independence at home.',
      provisions: [
        'Support with daily routines and personal care',
        'Mobility and safety assistance',
        'Health observation and care-plan follow-up',
        'Respectful care that promotes comfort and independence'
      ],
      whiteFrame: true,
      zoomFit: true,
      visible: true
    }
  ];

  function ensureServiceShape(item, idx) {
    var fb = DEFAULT_SERVICES[idx] || DEFAULT_SERVICES[0];
    return {
      id: item.id || fb.id,
      name: item.name || fb.name,
      filePath: item.filePath || fb.filePath,
      img: item.img || fb.img,
      desc: item.desc || fb.desc,
      provisions: Array.isArray(item.provisions) && item.provisions.length ? item.provisions.slice() : fb.provisions.slice(),
      whiteFrame: item.whiteFrame !== false,
      zoomFit: item.zoomFit !== false,
      visible: item.visible !== false
    };
  }

  var DEFAULT_CLINIC = {
    address: 'Next to Faulu',
    town: 'Kiambu Town',
    postal: '00900',
    phone: '+254 (704) 420-485',
    phone2: '+254 (720) 886-526',
    email: 'info@gfamilycare.com'
  };

  var DEFAULT_SITE = {
    clinicName: "L&F Medical Clinic",
    tagline: "We care like family. Because you are family.",
    phoneDisplay: "+254 (704) 420-485",
    whatsappDisplay: "+254 (720) 886-526",
    whatsappRouting: "254720886526",
    email: "info@gfamilycare.com",
    address: "Next to Faulu, Kiambu Town, Postal Code: 00900, Kenya",
    heroTitle1: "Compassionate Care.",
    heroTitle2: "Professional Support.",
    heroTitle3: "Peace of Mind.",
    heroCta: "Request Free Consultation",
    heroSubtitle: "We provide high-quality home care services and on-call medical support — so you and your loved ones can live safely and comfortably at home.",
    heroBannerImg: "../images/service-house-calls.jpg",
    medicalCareWhiteFrame: true,
    medicalCareZoomFit: true,
    logoDataUrl: "",
    faviconDataUrl: "",
    ceoName: "Fridah Gitonga",
    ceoRole: "CEO, L&F Medical Clinic",
    ceoQuote: "Your health. Your family. Our priority. We care with heart, we serve with excellence.",
    oncallTitle: "On-Call Medical Service",
    oncallBadge: "Premium Feature Service",
    oncallDesc: "24/7/365 rapid on-call medical support and house calls for urgent health needs and clinical guidance.",
    assurance: "All L&F Medical Clinic personnel are certified, vetted, and operate under Dr. Roger's clinical medicine care directives.",
    socialFb: "https://www.facebook.com/gfamilycare",
    socialIg: "https://www.instagram.com/gfamilycare",
    socialTt: "https://www.tiktok.com/@gfamilycare",
    blogUrl: "https://lfmedicalclinic.blogspot.com/",
    copyright: "© 2026 L&F Medical Clinic & Dr. Roger's. All rights reserved.",
    motto: "G.FAMILY CARES. WE ARE HERE FOR YOU – TODAY, TOMORROW, ALWAYS.",
    chatbotEnabled: true,
    commitments: [
      { title: "Person-Centered", desc: "Care shaped around individual needs." },
      { title: "Respect & Dignity", desc: "Privacy, independence and respect matter." },
      { title: "Responsive Support", desc: "On-call support is available 24/7." },
      { title: "Family Partnership", desc: "Clear communication with families." }
    ]
  };

  var DEFAULT_FAQS = [
    { q: "What home care services does L&F Medical Clinic provide?", a: "L&F Medical Clinic provides personal care, medical care, house calls, elderly care, advice and coordination, and 24/7 on-call medical service." },
    { q: "Is care available outside normal business hours?", a: "Yes, 24/7 on-call medical support and triage are available. Call +254 (704) 420-485 for urgent assistance." },
    { q: "How do I request a care consultation?", a: "Complete the consultation form on the homepage or call/WhatsApp our care team to discuss your needs." },
    { q: "What does L&F Medical Clinic elderly care include?", a: "Elderly care supports daily routines, fall-prevention & mobility safety, health monitoring, dignity, comfort, and independence at home." }
  ];

  var DEFAULT_AI = {
    apiKey: "",
    model: "gpt-4o-mini",
    endpoint: "https://api.openai.com/v1/chat/completions",
    systemPrompt: ""
  };

  var DEFAULT_POSTS = [
    { id: "p1", title: "Home Blood Pressure & Senior Wellness Checklist", status: "Published", cover: "../images/service-elderly-care.jpg", summary: "Practical daily steps families in Kiambu Town can use to monitor blood pressure, hydration, and home safety." }
  ];

  var services = load(KEYS.services, DEFAULT_SERVICES).map(ensureServiceShape);
  var clinic = Object.assign({}, DEFAULT_CLINIC, load(KEYS.clinic, {}));
  var leads = load(KEYS.leads, []);
  var oncall = load(KEYS.oncall, true);
  var banner = load(KEYS.banner, { enabled: false, text: '' });
  var site = Object.assign({}, DEFAULT_SITE, load(KEYS.site, {}));
  var faqs = load(KEYS.faqs, DEFAULT_FAQS);
  var aiCfg = Object.assign({}, DEFAULT_AI, load(KEYS.ai, {}));
  var posts = load(KEYS.posts, DEFAULT_POSTS);

  var navItems = Array.prototype.slice.call(document.querySelectorAll('.nav-item'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var panelTitle = document.getElementById('panel-title');
  var TITLES = {
    overview: 'Overview & Status',
    topbar: 'Top Bar & Brand Identity',
    hero: 'Hero & Leadership',
    services: 'Services & Location',
    oncall: '24/7 On-Call Section',
    commitments: 'Care Commitments',
    leads: 'Consultation Leads',
    faq: 'FAQ & AI Chatbot',
    blog: 'Blog & Banner',
    footer: 'Footer & Social Links',
    account: 'Account & Backup'
  };

  function showPanel(name) {
    navItems.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-panel') === name); });
    panels.forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + name); });
    if (panelTitle) panelTitle.textContent = TITLES[name] || 'Dashboard';
    try { window.location.hash = name; } catch (e) {}
  }
  navItems.forEach(function (b) {
    b.addEventListener('click', function () { showPanel(b.getAttribute('data-panel')); });
  });
  var initial = (window.location.hash || '').replace('#', '');
  if (TITLES[initial]) showPanel(initial);

  function renderStats() {
    var active = services.filter(function (s) { return s.visible !== false; }).length;
    var newCount = leads.filter(function (l) { return l.status === 'New'; }).length;
    if (document.getElementById('stat-services')) document.getElementById('stat-services').textContent = active;
    if (document.getElementById('stat-leads')) document.getElementById('stat-leads').textContent = leads.length;
    if (document.getElementById('stat-new')) document.getElementById('stat-new').textContent = newCount;
    if (document.getElementById('stat-faqs')) document.getElementById('stat-faqs').textContent = faqs.length;
    if (document.getElementById('leads-badge')) document.getElementById('leads-badge').textContent = newCount;
  }

  function renderOncall() {
    var ot = document.getElementById('oncall-toggle');
    var os = document.getElementById('oncall-state');
    var ct = document.getElementById('chatbot-toggle');
    if (ot) ot.checked = !!oncall;
    if (os) os.textContent = 'Currently: ' + (oncall ? 'Available' : 'Busy');
    if (ct) ct.checked = site.chatbotEnabled !== false;
  }

  document.getElementById('oncall-toggle')?.addEventListener('change', function () {
    oncall = this.checked;
    save(KEYS.oncall, oncall);
    renderOncall();
    toast(oncall ? 'On-call status: Available' : 'On-call status: Busy');
  });

  document.getElementById('chatbot-toggle')?.addEventListener('change', function () {
    site.chatbotEnabled = this.checked;
    save(KEYS.site, site);
    toast(site.chatbotEnabled ? 'AI Care Assistant enabled' : 'AI Care Assistant hidden');
  });

  var SITE_FIELDS = [
    'clinicName', 'tagline', 'phoneDisplay', 'whatsappDisplay', 'whatsappRouting',
    'email', 'address', 'heroTitle1', 'heroTitle2', 'heroTitle3', 'heroCta',
    'heroSubtitle', 'ceoName', 'ceoRole', 'ceoQuote', 'oncallTitle',
    'oncallBadge', 'oncallDesc', 'assurance', 'socialFb', 'socialIg',
    'socialTt', 'blogUrl', 'copyright', 'motto'
  ];

  function applyMediaPreviews() {
    var logoSrc = site.logoDataUrl || '../images/logo.png';
    var favSrc = site.faviconDataUrl || '../images/favicon.png';
    var medSvc = services.find(function (s) { return s.id === 'medical'; });
    var medSrc = (medSvc && medSvc.img) ? medSvc.img : '../images/service-medical-care.jpg';

    if (document.getElementById('preview-logo')) document.getElementById('preview-logo').src = logoSrc;
    if (document.getElementById('admin-sidebar-logo')) document.getElementById('admin-sidebar-logo').src = logoSrc;
    if (document.getElementById('preview-favicon')) document.getElementById('preview-favicon').src = favSrc;
    if (document.getElementById('preview-hero-banner')) document.getElementById('preview-hero-banner').src = site.heroBannerImg || '../images/service-house-calls.jpg';

    var prevMed = document.getElementById('preview-medical-care');
    var medThumb = document.getElementById('admin-med-thumb');
    if (prevMed) {
      prevMed.src = medSrc;
      prevMed.style.objectFit = site.medicalCareZoomFit === false ? 'contain' : 'cover';
    }
    if (medThumb) {
      medThumb.style.background = site.medicalCareWhiteFrame === false ? '#f8fafc' : '#FFFFFF';
    }
  }

  function renderCommitments() {
    var comWrap = document.getElementById('commitments-list');
    if (!comWrap) return;
    var list = site.commitments || DEFAULT_SITE.commitments;
    comWrap.innerHTML = list.map(function (c, idx) {
      return '<div class="editor-card">' +
        '<div class="grid-2">' +
          '<label class="form-group"><span>Commitment #' + (idx + 1) + ' Title</span><input data-com-title="' + idx + '" type="text" maxlength="50" value="' + escapeHtml(c.title) + '"><span class="field-hint">Max 50 characters</span></label>' +
          '<label class="form-group"><span>Commitment #' + (idx + 1) + ' Description</span><input data-com-desc="' + idx + '" type="text" maxlength="120" value="' + escapeHtml(c.desc) + '"><span class="field-hint">Max 120 characters</span></label>' +
        '</div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
          '<button class="icon-btn" type="button" data-com-move="-1" data-idx="' + idx + '" title="Move up"><i class="fas fa-arrow-up"></i></button>' +
          '<button class="icon-btn" type="button" data-com-move="1" data-idx="' + idx + '" title="Move down"><i class="fas fa-arrow-down"></i></button>' +
          '<button class="icon-btn danger" type="button" data-com-del="' + idx + '" title="Delete"><i class="fas fa-trash"></i></button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  document.getElementById('add-commitment-btn')?.addEventListener('click', function () {
    site.commitments = site.commitments || [];
    site.commitments.push({ title: 'New Commitment', desc: 'Describe this care standard.' });
    renderCommitments();
  });

  document.getElementById('commitments-list')?.addEventListener('click', function (ev) {
    var moveBtn = ev.target.closest('[data-com-move]');
    var delBtn = ev.target.closest('[data-com-del]');
    if (moveBtn) {
      var idx = Number(moveBtn.getAttribute('data-idx'));
      var delta = Number(moveBtn.getAttribute('data-com-move'));
      var target = idx + delta;
      if (target < 0 || target >= site.commitments.length) return;
      var tmp = site.commitments[idx];
      site.commitments[idx] = site.commitments[target];
      site.commitments[target] = tmp;
      renderCommitments();
    } else if (delBtn) {
      var dIdx = Number(delBtn.getAttribute('data-com-del'));
      site.commitments.splice(dIdx, 1);
      renderCommitments();
    }
  });

  function renderSiteFields() {
    SITE_FIELDS.forEach(function (k) {
      var el = document.getElementById('site-' + k);
      if (el) el.value = site[k] || '';
    });
    if (document.getElementById('site-medicalCareWhiteFrame')) {
      document.getElementById('site-medicalCareWhiteFrame').checked = site.medicalCareWhiteFrame !== false;
    }
    if (document.getElementById('site-medicalCareZoomFit')) {
      document.getElementById('site-medicalCareZoomFit').checked = site.medicalCareZoomFit !== false;
    }
    applyMediaPreviews();
    renderCommitments();
  }

  document.getElementById('upload-logo')?.addEventListener('change', function (e) {
    readFileAsDataUrl(e.target.files[0], 1, function (url) {
      site.logoDataUrl = url;
      applyMediaPreviews();
      toast('Logo ready — click Save All Changes to persist.');
    });
  });

  document.getElementById('upload-favicon')?.addEventListener('change', function (e) {
    readFileAsDataUrl(e.target.files[0], 1, function (url) {
      site.faviconDataUrl = url;
      applyMediaPreviews();
      toast('Favicon ready — click Save All Changes to persist.');
    });
  });

  document.getElementById('upload-hero-banner')?.addEventListener('change', function (e) {
    readFileAsDataUrl(e.target.files[0], 3, function (url) {
      site.heroBannerImg = url;
      applyMediaPreviews();
      toast('Hero banner image ready — click Save All Changes to persist.');
    });
  });

  document.getElementById('upload-medical-care-hero')?.addEventListener('change', function (e) {
    readFileAsDataUrl(e.target.files[0], 2, function (url) {
      var med = services.find(function (s) { return s.id === 'medical'; });
      if (med) med.img = url;
      applyMediaPreviews();
      renderServices();
      toast('Medical Care photo updated — click Save All Changes to persist.');
    });
  });

  document.getElementById('site-medicalCareWhiteFrame')?.addEventListener('change', function () {
    site.medicalCareWhiteFrame = this.checked;
    applyMediaPreviews();
  });
  document.getElementById('site-medicalCareZoomFit')?.addEventListener('change', function () {
    site.medicalCareZoomFit = this.checked;
    applyMediaPreviews();
  });

  function renderFaqs() {
    var faqWrap = document.getElementById('faq-list');
    if (!faqWrap) return;
    faqWrap.innerHTML = faqs.map(function (item, idx) {
      return '<div class="editor-card">' +
        '<label class="form-group"><span>Question #' + (idx + 1) + '</span><input data-faq-q="' + idx + '" type="text" maxlength="140" value="' + escapeHtml(item.q) + '"><span class="field-hint">Max 140 characters</span></label>' +
        '<label class="form-group"><span>Answer</span><textarea data-faq-a="' + idx + '" maxlength="500">' + escapeHtml(item.a) + '</textarea><span class="field-hint">Max 500 characters • Synced automatically to AI Care Assistant</span></label>' +
        '<button class="icon-btn danger" type="button" data-del-faq="' + idx + '" aria-label="Delete FAQ"><i class="fas fa-trash"></i></button>' +
      '</div>';
    }).join('');
    renderStats();
  }

  function renderAiConfig() {
    if (document.getElementById('ai-api-key')) document.getElementById('ai-api-key').value = aiCfg.apiKey || '';
    if (document.getElementById('ai-model')) document.getElementById('ai-model').value = aiCfg.model || 'gpt-4o-mini';
    if (document.getElementById('ai-endpoint')) document.getElementById('ai-endpoint').value = aiCfg.endpoint || 'https://api.openai.com/v1/chat/completions';
    if (document.getElementById('ai-system-prompt')) document.getElementById('ai-system-prompt').value = aiCfg.systemPrompt || '';
  }

  document.getElementById('save-ai-config')?.addEventListener('click', function () {
    aiCfg = {
      apiKey: (document.getElementById('ai-api-key')?.value || '').trim(),
      model: (document.getElementById('ai-model')?.value || 'gpt-4o-mini').trim(),
      endpoint: (document.getElementById('ai-endpoint')?.value || 'https://api.openai.com/v1/chat/completions').trim(),
      systemPrompt: (document.getElementById('ai-system-prompt')?.value || '').trim()
    };
    save(KEYS.ai, aiCfg);
    toast('AI Care Assistant settings saved!');
  });

  document.getElementById('add-faq')?.addEventListener('click', function () {
    faqs.push({ q: 'New clinic question?', a: 'Enter verified clinic answer here.' });
    renderFaqs();
  });

  document.getElementById('faq-list')?.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-del-faq]');
    if (!btn) return;
    faqs.splice(Number(btn.getAttribute('data-del-faq')), 1);
    renderFaqs();
  });

  document.getElementById('save-all-site')?.addEventListener('click', function () {
    SITE_FIELDS.forEach(function (k) {
      var el = document.getElementById('site-' + k);
      if (el) site[k] = el.value.trim();
    });
    if (document.getElementById('site-medicalCareWhiteFrame')) {
      site.medicalCareWhiteFrame = document.getElementById('site-medicalCareWhiteFrame').checked;
    }
    if (document.getElementById('site-medicalCareZoomFit')) {
      site.medicalCareZoomFit = document.getElementById('site-medicalCareZoomFit').checked;
    }
    if (site.commitments) {
      site.commitments = site.commitments.map(function (c, idx) {
        var t = document.querySelector('[data-com-title="' + idx + '"]');
        var d = document.querySelector('[data-com-desc="' + idx + '"]');
        return {
          title: t ? t.value.trim() : c.title,
          desc: d ? d.value.trim() : c.desc
        };
      });
    }
    faqs = faqs.map(function (f, idx) {
      var q = document.querySelector('[data-faq-q="' + idx + '"]');
      var a = document.querySelector('[data-faq-a="' + idx + '"]');
      return {
        q: q ? q.value.trim() : f.q,
        a: a ? a.value.trim() : f.a
      };
    });
    save(KEYS.site, site);
    save(KEYS.services, services);
    save(KEYS.faqs, faqs);
    renderStats();
    applyMediaPreviews();
    toast('All website sections saved & synced!');
  });

  var serviceList = document.getElementById('service-list');
  function renderServices() {
    if (!serviceList) return;
    serviceList.innerHTML = '';
    services.forEach(function (s, idx) {
      var row = document.createElement('div');
      row.className = 'service-item';
      row.innerHTML =
        '<div class="svc-photo-wrap"><img src="' + escapeHtml(s.img) + '" alt="' + escapeHtml(s.name) + '" loading="lazy"></div>' +
        '<div class="si-body">' +
          '<strong>' + escapeHtml(s.name) + '</strong>' +
          '<span>' + escapeHtml(s.desc) + '</span>' +
          '<label style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:.75rem;font-weight:600;color:#334155;cursor:pointer">' +
            '<i class="fas fa-upload"></i> Replace Photo <input type="file" accept="image/jpeg,image/png,image/webp" data-svc-upload="' + idx + '" style="display:none">' +
          '</label>' +
        '</div>' +
        '<div class="si-actions">' +
          '<span class="pill ' + (s.visible !== false ? 'ok' : 'off') + '"><span class="dot"></span>' + (s.visible !== false ? 'Visible' : 'Hidden') + '</span>' +
          '<button class="icon-btn" type="button" data-act="up" data-idx="' + idx + '" title="Move up"><i class="fas fa-arrow-up"></i></button>' +
          '<button class="icon-btn" type="button" data-act="down" data-idx="' + idx + '" title="Move down"><i class="fas fa-arrow-down"></i></button>' +
          '<button class="icon-btn" type="button" data-act="toggle" data-idx="' + idx + '" title="Toggle visibility"><i class="fas fa-eye' + (s.visible !== false ? '-slash' : '') + '"></i></button>' +
          '<button class="icon-btn" type="button" data-act="edit" data-idx="' + idx + '" title="Edit service"><i class="fas fa-pen"></i></button>' +
          '<button class="icon-btn danger" type="button" data-act="del" data-idx="' + idx + '" title="Delete service"><i class="fas fa-trash"></i></button>' +
        '</div>';
      serviceList.appendChild(row);
    });
  }

  document.getElementById('add-service-btn')?.addEventListener('click', function () {
    var name = window.prompt('New service name');
    if (!name || !name.trim()) return;
    var desc = window.prompt('Service description') || 'Dedicated clinical & home care support.';
    services.push({
      id: 'svc-' + Date.now(),
      name: name.trim(),
      desc: desc.trim(),
      img: '../images/service-medical-care.jpg',
      visible: true
    });
    save(KEYS.services, services);
    renderServices();
    renderStats();
    toast('Service added');
  });

  serviceList?.addEventListener('click', function (ev) {
    var btn = ev.target.closest('button[data-act]');
    if (!btn) return;
    var idx = Number(btn.getAttribute('data-idx'));
    var act = btn.getAttribute('data-act');
    if (act === 'toggle') {
      services[idx].visible = services[idx].visible === false ? true : false;
      save(KEYS.services, services);
      renderServices();
      renderStats();
      toast(services[idx].name + (services[idx].visible ? ' is visible' : ' is hidden'));
    } else if (act === 'edit') {
      var name = window.prompt('Service name', services[idx].name);
      if (name === null) return;
      var desc = window.prompt('Short description', services[idx].desc);
      if (desc === null) return;
      services[idx].name = name.trim() || services[idx].name;
      services[idx].desc = desc.trim() || services[idx].desc;
      save(KEYS.services, services);
      renderServices();
      toast('Service updated');
    } else if (act === 'up' && idx > 0) {
      var tmpUp = services[idx - 1];
      services[idx - 1] = services[idx];
      services[idx] = tmpUp;
      save(KEYS.services, services);
      renderServices();
    } else if (act === 'down' && idx < services.length - 1) {
      var tmpDn = services[idx + 1];
      services[idx + 1] = services[idx];
      services[idx] = tmpDn;
      save(KEYS.services, services);
      renderServices();
    } else if (act === 'del') {
      if (!window.confirm('Remove this service?')) return;
      services.splice(idx, 1);
      save(KEYS.services, services);
      renderServices();
      renderStats();
      toast('Service removed');
    }
  });

serviceList?.addEventListener('input', function (ev) {
    var titleInp = ev.target.closest('input[data-svc-title]');
    var descTa = ev.target.closest('textarea[data-svc-desc]');
    var provTa = ev.target.closest('textarea[data-svc-provisions]');
    if (titleInp) {
      services[Number(titleInp.getAttribute('data-svc-title'))].name = titleInp.value;
    } else if (descTa) {
      services[Number(descTa.getAttribute('data-svc-desc'))].desc = descTa.value;
    } else if (provTa) {
      services[Number(provTa.getAttribute('data-svc-provisions'))].provisions = provTa.value
        .split(/\r?\n/)
        .map(function (line) { return line.trim(); })
        .filter(Boolean);
    }
  });

  serviceList?.addEventListener('change', function (ev) {
    var wfChk = ev.target.closest('input[data-svc-whiteframe]');
    var zfChk = ev.target.closest('input[data-svc-zoomfit]');
    if (wfChk) {
      services[Number(wfChk.getAttribute('data-svc-whiteframe'))].whiteFrame = wfChk.checked;
      renderServices();
      return;
    }
    if (zfChk) {
      services[Number(zfChk.getAttribute('data-svc-zoomfit'))].zoomFit = zfChk.checked;
      renderServices();
      return;
    }
  });

  serviceList?.addEventListener('change', function (ev) {
    var inp = ev.target.closest('input[data-svc-upload]');
    if (!inp || !inp.files[0]) return;
    var idx = Number(inp.getAttribute('data-svc-upload'));
    readFileAsDataUrl(inp.files[0], 2, function (url) {
      services[idx].img = url;
      save(KEYS.services, services);
      renderServices();
      applyMediaPreviews();
      toast('Service photo updated');
    });
  });

  var clinicInfo = document.getElementById('clinic-info');
  function renderClinic() {
    if (!clinicInfo) return;
    var rows = [
      ['Address', clinic.address],
      ['Town', clinic.town],
      ['Postal code', clinic.postal],
      ['Phone', clinic.phone],
      ['Second phone', clinic.phone2],
      ['Email', clinic.email]
    ];
    clinicInfo.innerHTML = rows.map(function (r) {
      var val = escapeHtml(r[1] || '—');
      if (r[0] === 'Email' && r[1]) val = '<a href="mailto:' + escapeHtml(r[1]) + '">' + val + '</a>';
      if (r[0].toLowerCase().indexOf('phone') > -1 && r[1]) val = '<a href="tel:' + escapeHtml(r[1].replace(/[^+\d]/g, '')) + '">' + val + '</a>';
      return '<div class="info-item"><div class="ii-label">' + r[0] + '</div><div class="ii-value">' + val + '</div></div>';
    }).join('');
  }

  var clinicModal = document.getElementById('clinic-modal');
  document.getElementById('edit-clinic')?.addEventListener('click', function () {
    document.getElementById('clinic-address').value = clinic.address || '';
    document.getElementById('clinic-town').value = clinic.town || '';
    document.getElementById('clinic-postal').value = clinic.postal || '';
    document.getElementById('clinic-phone').value = clinic.phone || '';
    document.getElementById('clinic-phone2').value = clinic.phone2 || '';
    document.getElementById('clinic-email').value = clinic.email || '';
    clinicModal.classList.add('open');
  });
  document.getElementById('clinic-cancel')?.addEventListener('click', function () { clinicModal.classList.remove('open'); });
  document.getElementById('clinic-form')?.addEventListener('submit', function (ev) {
    ev.preventDefault();
    clinic = {
      address: document.getElementById('clinic-address').value.trim(),
      town: document.getElementById('clinic-town').value.trim(),
      postal: document.getElementById('clinic-postal').value.trim(),
      phone: document.getElementById('clinic-phone').value.trim(),
      phone2: document.getElementById('clinic-phone2').value.trim(),
      email: document.getElementById('clinic-email').value.trim()
    };
    save(KEYS.clinic, clinic);
    renderClinic();
    clinicModal.classList.remove('open');
    toast('Clinic details saved');
  });

  var leadBody = document.getElementById('lead-body');
  var leadCount = document.getElementById('lead-count');
  var leadSearch = document.getElementById('lead-search');
  var leadFilter = document.getElementById('lead-filter');
  var leadModal = document.getElementById('lead-modal');
  var leadForm = document.getElementById('lead-form');
  var leadModalTitle = document.getElementById('lead-modal-title');

  function statusClass(s) {
    return s === 'New' ? 'new' : s === 'Contacted' ? 'contacted' : 'scheduled';
  }

  function renderLeads() {
    if (!leadBody) return;
    var q = (leadSearch && leadSearch.value || '').trim().toLowerCase();
    var f = leadFilter ? leadFilter.value : 'all';
    var rows = leads.filter(function (l) {
      if (f !== 'all' && l.status !== f) return false;
      if (!q) return true;
      return (l.name + ' ' + l.phone + ' ' + l.service + ' ' + (l.notes || '')).toLowerCase().indexOf(q) > -1;
    });
    leadBody.innerHTML = '';
    if (!rows.length) {
      leadBody.innerHTML = '<tr class="empty-row"><td colspan="6">No enquiries match this view yet.</td></tr>';
    } else {
      rows.forEach(function (l) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><span class="cell-strong">' + escapeHtml(l.name) + '</span><span class="cell-sub">' + escapeHtml(l.created ? new Date(l.created).toLocaleDateString() : '') + '</span></td>' +
          '<td><a href="tel:' + escapeHtml((l.phone || '').replace(/[^+\d]/g, '')) + '">' + escapeHtml(l.phone) + '</a></td>' +
          '<td>' + escapeHtml(l.service) + '</td>' +
          '<td><span class="pill ' + statusClass(l.status) + '"><span class="dot"></span>' + escapeHtml(l.status) + '</span></td>' +
          '<td style="max-width:260px">' + escapeHtml(l.notes || '—') + '</td>' +
          '<td style="text-align:right;white-space:nowrap">' +
            '<button class="icon-btn" type="button" data-lead="' + l.id + '" data-act="edit"><i class="fas fa-pen"></i></button> ' +
            '<button class="icon-btn danger" type="button" data-lead="' + l.id + '" data-act="del"><i class="fas fa-trash"></i></button>' +
          '</td>';
        leadBody.appendChild(tr);
      });
    }
    if (leadCount) leadCount.textContent = rows.length + ' of ' + leads.length + ' enquiries';
    renderStats();
  }

  function openLeadModal(lead) {
    leadModalTitle.textContent = lead ? 'Edit enquiry' : 'Add enquiry';
    document.getElementById('lead-id').value = lead ? lead.id : '';
    document.getElementById('lead-name').value = lead ? lead.name : '';
    document.getElementById('lead-phone').value = lead ? lead.phone : '';
    document.getElementById('lead-service').value = lead ? lead.service : 'Personal Care';
    document.getElementById('lead-status').value = lead ? lead.status : 'New';
    document.getElementById('lead-notes').value = lead ? (lead.notes || '') : '';
    leadModal.classList.add('open');
  }

  document.getElementById('add-lead')?.addEventListener('click', function () { openLeadModal(null); });
  document.getElementById('lead-cancel')?.addEventListener('click', function () { leadModal.classList.remove('open'); });
  leadForm?.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var id = document.getElementById('lead-id').value;
    var data = {
      name: document.getElementById('lead-name').value.trim(),
      phone: document.getElementById('lead-phone').value.trim(),
      service: document.getElementById('lead-service').value,
      status: document.getElementById('lead-status').value,
      notes: document.getElementById('lead-notes').value.trim()
    };
    if (!data.name || !data.phone) { toast('Name and phone are required.', true); return; }
    if (id) {
      leads = leads.map(function (l) { return l.id === id ? Object.assign({}, l, data) : l; });
      toast('Enquiry updated');
    } else {
      data.id = 'l' + Date.now();
      data.created = Date.now();
      leads.unshift(data);
      toast('Enquiry added');
    }
    save(KEYS.leads, leads);
    leadModal.classList.remove('open');
    renderLeads();
  });

  leadBody?.addEventListener('click', function (ev) {
    var btn = ev.target.closest('button[data-lead]');
    if (!btn) return;
    var id = btn.getAttribute('data-lead');
    var act = btn.getAttribute('data-act');
    if (act === 'edit') {
      var lead = leads.find(function (l) { return l.id === id; });
      if (lead) openLeadModal(lead);
    } else if (act === 'del') {
      if (!window.confirm('Delete this enquiry?')) return;
      leads = leads.filter(function (l) { return l.id !== id; });
      save(KEYS.leads, leads);
      renderLeads();
      toast('Enquiry deleted');
    }
  });
  leadSearch?.addEventListener('input', renderLeads);
  leadFilter?.addEventListener('change', renderLeads);

  var bannerToggle = document.getElementById('banner-toggle');
  var bannerText = document.getElementById('banner-text');
  var bannerStatus = document.getElementById('banner-status');

  function renderBanner() {
    if (bannerToggle) bannerToggle.checked = !!banner.enabled;
    if (bannerText) bannerText.value = banner.text || '';
    if (bannerStatus) {
      bannerStatus.textContent = banner.enabled && banner.text ? 'Banner is live on the homepage.' : 'Banner is currently hidden.';
    }
  }

  document.getElementById('save-banner')?.addEventListener('click', function () {
    var text = (bannerText.value || '').trim();
    var enabled = !!bannerToggle.checked;
    if (enabled && !text) { toast('Add a message before enabling the banner.', true); return; }
    banner = { enabled: enabled, text: text };
    save(KEYS.banner, banner);
    renderBanner();
    toast(enabled ? 'Banner published to homepage' : 'Banner saved');
  });

  document.getElementById('clear-banner')?.addEventListener('click', function () {
    banner = { enabled: false, text: '' };
    save(KEYS.banner, banner);
    renderBanner();
    toast('Banner cleared');
  });

  function renderPosts() {
    var wrap = document.getElementById('blog-posts-list');
    if (!wrap) return;
    wrap.innerHTML = posts.map(function (p, idx) {
      return '<div class="editor-card">' +
        '<div class="grid-2">' +
          '<label class="form-group"><span>Post Title</span><input data-post-title="' + idx + '" type="text" maxlength="110" value="' + escapeHtml(p.title) + '"><span class="field-hint">Max 110 characters</span></label>' +
          '<label class="form-group"><span>Status</span><select data-post-status="' + idx + '"><option' + (p.status === 'Published' ? ' selected' : '') + '>Published</option><option' + (p.status === 'Draft' ? ' selected' : '') + '>Draft</option></select></label>' +
        '</div>' +
        '<label class="form-group"><span>Summary / Body Excerpt</span><textarea data-post-summary="' + idx + '" maxlength="320">' + escapeHtml(p.summary) + '</textarea><span class="field-hint">Max 320 characters</span></label>' +
        '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">' +
          '<label class="btn-sm ghost" style="margin:0;cursor:pointer"><i class="fas fa-image"></i> Cover Photo<input type="file" accept="image/jpeg,image/png,image/webp" data-post-cover="' + idx + '" style="display:none"><span class="field-hint" style="margin:0 0 0 6px">1920×800 px max 3MB</span></label>' +
          '<div style="display:flex;gap:8px">' +
            '<button class="btn-sm" type="button" data-post-save="' + idx + '"><i class="fas fa-check"></i> Save Post</button>' +
            '<button class="icon-btn danger" type="button" data-post-del="' + idx + '"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  document.getElementById('add-post-btn')?.addEventListener('click', function () {
    posts.unshift({ id: 'p' + Date.now(), title: 'New Clinic Health Update', status: 'Draft', cover: '../images/service-house-calls.jpg', summary: 'Write a helpful health or clinic update.' });
    save(KEYS.posts, posts);
    renderPosts();
    toast('New draft post created');
  });

  document.getElementById('blog-posts-list')?.addEventListener('click', function (ev) {
    var saveBtn = ev.target.closest('[data-post-save]');
    var delBtn = ev.target.closest('[data-post-del]');
    if (saveBtn) {
      var idx = Number(saveBtn.getAttribute('data-post-save'));
      posts[idx].title = (document.querySelector('[data-post-title="' + idx + '"]')?.value || '').trim() || posts[idx].title;
      posts[idx].status = document.querySelector('[data-post-status="' + idx + '"]')?.value || 'Published';
      posts[idx].summary = (document.querySelector('[data-post-summary="' + idx + '"]')?.value || '').trim();
      save(KEYS.posts, posts);
      toast('Blog post saved');
    } else if (delBtn) {
      var dIdx = Number(delBtn.getAttribute('data-post-del'));
      posts.splice(dIdx, 1);
      save(KEYS.posts, posts);
      renderPosts();
      toast('Blog post deleted');
    }
  });

  document.getElementById('blog-posts-list')?.addEventListener('change', function (ev) {
    var inp = ev.target.closest('input[data-post-cover]');
    if (!inp || !inp.files[0]) return;
    var idx = Number(inp.getAttribute('data-post-cover'));
    readFileAsDataUrl(inp.files[0], 3, function (url) {
      posts[idx].cover = url;
      save(KEYS.posts, posts);
      toast('Cover image updated');
    });
  });

  function fmt(ts) {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleString(); } catch (e) { return '—'; }
  }
  if (document.getElementById('acct-email')) document.getElementById('acct-email').textContent = session.email || '—';
  if (document.getElementById('acct-issued')) document.getElementById('acct-issued').textContent = fmt(session.issued);
  if (document.getElementById('acct-expires')) document.getElementById('acct-expires').textContent = fmt(session.exp);
  if (document.getElementById('acct-remember')) document.getElementById('acct-remember').textContent = session.remember ? 'On (30 days)' : 'Off (8 hours)';

  document.getElementById('export-backup')?.addEventListener('click', function () {
    var payload = JSON.stringify({ site: site, services: services, clinic: clinic, faqs: faqs, leads: leads, banner: banner, aiCfg: aiCfg, posts: posts }, null, 2);
    var blob = new Blob([payload], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gfamilycare-full-backup.json';
    a.click();
  });

  document.getElementById('import-backup-file')?.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(String(r.result || '{}'));
        if (d.site) { site = Object.assign({}, DEFAULT_SITE, d.site); save(KEYS.site, site); }
        if (Array.isArray(d.services)) { services = d.services; save(KEYS.services, services); }
        if (d.clinic) { clinic = Object.assign({}, DEFAULT_CLINIC, d.clinic); save(KEYS.clinic, clinic); }
        if (Array.isArray(d.faqs)) { faqs = d.faqs; save(KEYS.faqs, faqs); }
        if (Array.isArray(d.leads)) { leads = d.leads; save(KEYS.leads, leads); }
        if (d.banner) { banner = d.banner; save(KEYS.banner, banner); }
        if (d.aiCfg) { aiCfg = Object.assign({}, DEFAULT_AI, d.aiCfg); save(KEYS.ai, aiCfg); }
        if (Array.isArray(d.posts)) { posts = d.posts; save(KEYS.posts, posts); }
        renderSiteFields(); renderServices(); renderClinic(); renderLeads(); renderFaqs(); renderAiConfig(); renderBanner(); renderPosts(); renderStats();
        toast('JSON backup restored!');
      } catch (err) {
        toast('Invalid JSON backup file.', true);
      }
    };
    r.readAsText(file);
  });

  document.getElementById('reset-site-defaults')?.addEventListener('click', function () {
    if (!window.confirm('Reset all site sections back to factory defaults?')) return;
    Object.keys(KEYS).forEach(function (k) { window.localStorage.removeItem(KEYS[k]); });
    site = Object.assign({}, DEFAULT_SITE);
    services = DEFAULT_SERVICES.slice();
    clinic = Object.assign({}, DEFAULT_CLINIC);
    faqs = DEFAULT_FAQS.slice();
    aiCfg = Object.assign({}, DEFAULT_AI);
    posts = DEFAULT_POSTS.slice();
    renderSiteFields(); renderServices(); renderClinic(); renderFaqs(); renderAiConfig(); renderBanner(); renderPosts(); renderStats();
    toast('All site content reset to defaults');
  });

  renderStats();
  renderOncall();
  renderSiteFields();
  renderServices();
  renderClinic();
  renderLeads();
  renderFaqs();
  renderAiConfig();
  renderBanner();
  renderPosts();
});

serviceList?.addEventListener('input', function (ev) {
    var bInp = ev.target.closest('input[data-svc-bullet-idx]');
    if (bInp) {
      var sIdx = Number(bInp.getAttribute('data-svc-bullet-idx'));
      var bIdx = Number(bInp.getAttribute('data-bullet-i'));
      if (!Array.isArray(services[sIdx].provisions)) services[sIdx].provisions = [];
      services[sIdx].provisions[bIdx] = bInp.value;
    }
  });

  serviceList?.addEventListener('click', function (ev) {
    var addBtn = ev.target.closest('button[data-bullet-add-svc]');
    if (addBtn) {
      var sIdx = Number(addBtn.getAttribute('data-bullet-add-svc'));
      if (!Array.isArray(services[sIdx].provisions)) services[sIdx].provisions = [];
      services[sIdx].provisions.push('New care provision item');
      renderServices();
      return;
    }
    var delBtn = ev.target.closest('button[data-bullet-del-svc]');
    if (delBtn) {
      var sIdx2 = Number(delBtn.getAttribute('data-bullet-del-svc'));
      var bIdx2 = Number(delBtn.getAttribute('data-bullet-del-i'));
      if (Array.isArray(services[sIdx2].provisions)) {
        services[sIdx2].provisions.splice(bIdx2, 1);
      }
      renderServices();
      return;
    }
  });
