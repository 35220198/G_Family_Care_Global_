/**
 * L&F Medical Clinic — Upgraded AI Care Assistant Widget
 * Supports OpenAI-compatible API integration (configured via Admin CMS)
 * plus an intelligent built-in general health, wellness, and clinic knowledge engine.
 */
(function () {
  if (window.__lfChatbotLoaded) return;
  window.__lfChatbotLoaded = true;

  const DEFAULT_KB = {
    clinicName: "L&F Medical Clinic (Dr. Roger's)",
    ceo: "Fridah Gitonga",
    phoneDisplay: "+254 (704) 420-485",
    phoneRaw: "+254704420485",
    whatsappDisplay: "+254 (720) 886-526",
    whatsappRaw: "254720886526",
    email: "info@gfamilycare.com",
    address: "Next to Faulu, Kiambu Town, Postal Code: 00900, Kenya",
    hours: "24/7 On-Call Medical Service (including weekends and public holidays)",
    services: [
      { id: "personal", name: "Personal Care", keywords: ["personal", "bathing", "hygiene", "dressing", "grooming", "mobility", "transfer", "feeding", "daily"], summary: "Respectful day-to-day assistance at home including bathing & personal hygiene, dressing & grooming, safe mobility/transfer support, and feeding/daily-living assistance." },
      { id: "medical", name: "Medical Care", keywords: ["medical", "medication", "wound", "clinical", "monitoring", "nurse", "treatment"], summary: "In-home clinical support including medication management per care plan, wound-care dressing & clinical follow-up, vital-signs monitoring, and physician coordination." },
      { id: "housecalls", name: "House Calls", keywords: ["house call", "home visit", "visit", "doctor visit", "discharge", "assessment"], summary: "Convenient home visits for medical assessments, post-illness or post-discharge follow-ups, routine care-plan reviews, and timely clinical escalation." },
      { id: "coordination", name: "Advice & Coordination", keywords: ["advice", "coordination", "plan", "planning", "family", "organise", "organize", "guidance"], summary: "Practical care planning, guidance on available care options, clear communication between families and providers, and ongoing follow-up." },
      { id: "elderly", name: "Elderly Care", keywords: ["elderly", "senior", "older", "aging", "aged", "parent", "grandparent", "independence"], summary: "Personalised support for older adults focused on daily routines, fall-prevention & mobility safety, health observation, dignity, comfort, and independence at home." },
      { id: "oncall", name: "24/7 On-Call Medical Service", keywords: ["24/7", "on-call", "on call", "urgent", "emergency", "night", "weekend", "holiday", "triage"], summary: "Round-the-clock on-call medical triage and prompt home visits available 24/7/365, including weekends and public holidays." }
    ]
  };

  const GENERAL_HEALTH_TOPICS = [
    {
      pattern: /\b(blood pressure|hypertension|bp|high bp|low bp)\b/,
      title: "Blood Pressure & Hypertension Guidance",
      body: "Normal resting blood pressure for most adults is near <strong>120/80 mmHg</strong>. Consistently elevated readings (140/90 mmHg or higher) warrant clinical review. Helpful daily habits include reducing excess salt, staying active safely, managing stress, taking prescribed medications consistently, and keeping a blood pressure log. Our nurses assist with routine home BP checks."
    },
    {
      pattern: /\b(diabetes|blood sugar|glucose|insulin|diabetic)\b/,
      title: "Blood Sugar & Diabetes Support",
      body: "Balanced meals rich in fiber and lean protein, regular hydration, consistent medication/insulin routines, daily foot checks, and glucose tracking help stabilize blood sugar. Seek medical evaluation for persistent high readings, dizziness, confusion, or signs of low blood sugar. Our team supports home monitoring and daily routines."
    },
    {
      pattern: /\b(fever|temperature|chills|flu|cold|cough|malaria|typhoid|infection)\b/,
      title: "Fever, Cough & Acute Illness Care",
      body: "Rest, oral fluids, and light clothing help manage mild fever or viral symptoms. Seek prompt clinical evaluation if fever is high (e.g. above 39°C / 102.2°F), lasts more than 48 hours, or comes with severe headache, chest discomfort, breathing difficulty, or persistent vomiting. Our <strong>House Calls</strong> team can visit at home."
    },
    {
      pattern: /\b(wound|ulcer|bedsore|pressure sore|dressing|stitches|surgical|cut|burn)\b/,
      title: "Wound & Post-Surgical Care",
      body: "Keep wounds clean, protected, and dressed according to clinical instructions. Watch for redness spreading around the area, warmth, swelling, pus, worsening pain, or fever. Our clinicians provide sterile in-home wound care and follow-up."
    },
    {
      pattern: /\b(dementia|alzheimer|memory|confusion|fall|falls|mobility|stroke recovery|rehab)\b/,
      title: "Senior Mobility, Memory & Home Safety",
      body: "To reduce fall risks at home, keep walkways clear, add bright lighting and grab bars/non-slip mats, maintain predictable routines, and track hydration and medications. Our <strong>Elderly Care</strong> specialists provide dignified daily support."
    },
    {
      pattern: /\b(nutrition|diet|hydration|dehydration|water|sleep|stress|wellness|exercise|healthy)\b/,
      title: "Everyday Wellness, Nutrition & Hydration",
      body: "Consistent hydration, balanced meals with vegetables and whole grains, restorative sleep, and gentle movement suited to individual ability form a strong foundation for daily health."
    }
  ];

  function getLiveContext() {
    let site = {};
    let services = DEFAULT_KB.services;
    let faqs = [];
    let aiCfg = { apiKey: "", model: "gpt-4o-mini", endpoint: "https://api.openai.com/v1/chat/completions", systemPrompt: "" };
    let oncallAvailable = true;

    try {
      site = JSON.parse(localStorage.getItem("gfamily_site_content") || "{}") || {};
      if (site.chatbotEnabled === false) return null;

      const savedServices = JSON.parse(localStorage.getItem("gfamily_services") || "null");
      if (Array.isArray(savedServices) && savedServices.length) {
        services = savedServices.filter(s => s.visible !== false).map(s => ({
          id: s.id || "svc",
          name: s.name,
          keywords: s.name.toLowerCase().split(/\W+/).filter(w => w.length > 2),
          summary: s.desc
        }));
      }

      const savedFaqs = JSON.parse(localStorage.getItem("gfamily_faqs") || "null");
      if (Array.isArray(savedFaqs)) faqs = savedFaqs;

      const savedAi = JSON.parse(localStorage.getItem("gfamily_ai_config") || "null");
      if (savedAi && typeof savedAi === "object") aiCfg = Object.assign(aiCfg, savedAi);

      const savedOncall = JSON.parse(localStorage.getItem("gfamily_oncall") || "true");
      oncallAvailable = savedOncall !== false;
    } catch (_) {}

    return {
      clinicName: site.clinicName || DEFAULT_KB.clinicName,
      ceo: site.ceoName || DEFAULT_KB.ceo,
      phoneDisplay: site.phoneDisplay || DEFAULT_KB.phoneDisplay,
      phoneRaw: (site.phoneDisplay || DEFAULT_KB.phoneRaw).replace(/[^+\d]/g, ""),
      whatsappDisplay: site.whatsappDisplay || DEFAULT_KB.whatsappDisplay,
      whatsappRaw: (site.whatsappRouting || site.whatsappDisplay || DEFAULT_KB.whatsappRaw).replace(/\D/g, ""),
      email: site.email || DEFAULT_KB.email,
      address: site.address || DEFAULT_KB.address,
      oncallDesc: site.oncallDesc || DEFAULT_KB.hours,
      oncallAvailable,
      services,
      faqs,
      aiCfg
    };
  }

  const initialCtx = getLiveContext();
  if (!initialCtx) return;

  const style = document.createElement("style");
  style.textContent = `
    #lf-chat-launcher {
      position: fixed; right: 20px; bottom: 20px; z-index: 99990;
      display: inline-flex; align-items: center; gap: 10px;
      background: linear-gradient(135deg, #047857, #064e3b);
      color: #ffffff; border: 2px solid rgba(255,255,255,.22);
      border-radius: 999px; padding: 12px 18px;
      font: 600 13px 'Poppins', sans-serif; cursor: pointer;
      box-shadow: 0 14px 34px rgba(2, 44, 34, 0.28);
      transition: transform .25s ease, box-shadow .25s ease;
    }
    #lf-chat-launcher:hover { transform: scale(1.04); box-shadow: 0 18px 40px rgba(2, 44, 34, 0.36); }
    #lf-chat-launcher .lf-pulse {
      width: 9px; height: 9px; border-radius: 50%; background: #fbbf24;
      box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.25);
    }
    #lf-chat-window {
      position: fixed; right: 20px; bottom: 82px; z-index: 99991;
      width: min(400px, calc(100vw - 28px)); max-height: min(600px, calc(100vh - 104px));
      background: #ffffff; border-radius: 22px; overflow: hidden;
      border: 1px solid #d1fae5;
      box-shadow: 0 24px 60px rgba(2, 44, 34, 0.24);
      display: none; flex-direction: column;
      font-family: 'Poppins', sans-serif;
    }
    #lf-chat-window.open { display: flex; }
    .lf-chat-head {
      background: linear-gradient(135deg, #064e3b, #047857);
      color: #fff; padding: 14px 16px;
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
    }
    .lf-chat-body {
      padding: 14px; overflow-y: auto; flex: 1;
      background: #f8fafc; display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
    }
    .lf-msg {
      max-width: 88%; padding: 10px 13px; border-radius: 16px;
      font-size: 12.5px; line-height: 1.55; word-wrap: break-word;
    }
    .lf-msg.bot {
      background: #ffffff; color: #1e293b; align-self: flex-start;
      border: 1px solid #e2e8f0; border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
    }
    .lf-msg.user {
      background: #047857; color: #ffffff; align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .lf-msg a { color: #047857; font-weight: 700; text-decoration: underline; }
    .lf-disclaimer {
      background: #fffbeb; border-top: 1px solid #fef3c7; border-bottom: 1px solid #f1f5f9;
      color: #78350f; font-size: 10.5px; line-height: 1.4; padding: 7px 12px;
    }
    .lf-disclaimer a { color: #b45309; font-weight: 700; text-decoration: underline; }
    .lf-chips {
      display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px;
      background: #ffffff; border-top: 1px solid #f1f5f9;
    }
    .lf-chip {
      font-size: 11px; font-weight: 600; color: #065f46;
      background: #ecfdf5; border: 1px solid #a7f3d0;
      border-radius: 999px; padding: 5px 10px; cursor: pointer;
    }
    .lf-chip:hover { background: #d1fae5; }
    .lf-chat-foot {
      display: flex; gap: 8px; padding: 10px 12px;
      background: #ffffff; border-top: 1px solid #e2e8f0;
    }
    .lf-chat-foot input {
      flex: 1; border: 1px solid #cbd5e1; border-radius: 12px;
      padding: 9px 12px; font-size: 12.5px; outline: none;
    }
    .lf-chat-foot input:focus { border-color: #047857; }
    .lf-chat-foot button {
      background: #047857; color: #fff; border: none; border-radius: 12px;
      padding: 0 14px; font-weight: 600; cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "lf-chat-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open L&F AI Care Assistant");
  launcher.innerHTML = `<span class="lf-pulse"></span><i class="fas fa-comment-medical"></i><span>AI Care Assistant</span>`;

  const win = document.createElement("aside");
  win.id = "lf-chat-window";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-label", "L&F Medical Clinic AI Care Assistant");
  win.innerHTML = `
    <div class="lf-chat-head">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:12px;background:rgba(255,255,255,.15);display:grid;place-items:center;color:#fbbf24;">
          <i class="fas fa-user-nurse"></i>
        </div>
        <div>
          <div style="font-weight:700;font-size:13.5px;">L&amp;F AI Care Assistant</div>
          <div style="font-size:10.5px;color:#a7f3d0;">General Health &amp; Clinic Support</div>
        </div>
      </div>
      <button type="button" id="lf-chat-close" aria-label="Close chat" style="background:rgba(255,255,255,.14);border:none;color:#fff;width:30px;height:30px;border-radius:50%;cursor:pointer;">
        <i class="fas fa-xmark"></i>
      </button>
    </div>
    <div class="lf-chat-body" id="lf-chat-body"></div>
    <div class="lf-disclaimer">
      <i class="fas fa-circle-info"></i> Educational health information only — not a medical diagnosis. For urgent symptoms, call our 24/7 line: <a href="tel:${initialCtx.phoneRaw}">${escapeHtml(initialCtx.phoneDisplay)}</a>.
    </div>
    <div class="lf-chips" id="lf-chat-chips">
      <button type="button" class="lf-chip" data-q="What home care services do you offer?">Our Services</button>
      <button type="button" class="lf-chip" data-q="How do I manage high blood pressure at home?">Blood Pressure Tips</button>
      <button type="button" class="lf-chip" data-q="How do 24/7 on-call house calls work?">24/7 House Calls</button>
      <button type="button" class="lf-chip" data-q="Where are you located and how do I book?">Location &amp; Booking</button>
    </div>
    <form class="lf-chat-foot" id="lf-chat-form">
      <input type="text" id="lf-chat-input" placeholder="Ask a health or clinic question..." autocomplete="off" required />
      <button type="submit" aria-label="Send message"><i class="fas fa-paper-plane"></i></button>
    </form>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(win);

  const bodyEl = document.getElementById("lf-chat-body");
  const formEl = document.getElementById("lf-chat-form");
  const inputEl = document.getElementById("lf-chat-input");
  const chatHistory = [];

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatAiText(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  function appendMessage(html, sender) {
    const div = document.createElement("div");
    div.className = `lf-msg ${sender}`;
    if (sender === "user") div.textContent = html;
    else div.innerHTML = html;
    bodyEl.appendChild(div);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return div;
  }

  function buildSystemPrompt(ctx) {
    const svcText = ctx.services.map(s => `- ${s.name}: ${s.summary}`).join("\n");
    const faqText = ctx.faqs.map(f => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
    return [
      `You are the AI Care Assistant for ${ctx.clinicName}, led by CEO ${ctx.ceo} under Dr. Roger's clinical medicine oversight.`,
      `Location: ${ctx.address}`,
      `24/7 Phone: ${ctx.phoneDisplay} | WhatsApp: ${ctx.whatsappDisplay} | Email: ${ctx.email}`,
      `24/7 On-Call Status: ${ctx.oncallAvailable ? "Currently Available 24/7" : "Busy — call line for dispatch"} (${ctx.oncallDesc})`,
      `\nClinic Services:\n${svcText}`,
      faqText ? `\nClinic FAQs:\n${faqText}` : "",
      ctx.aiCfg.systemPrompt ? `\nAdditional Clinic Instructions:\n${ctx.aiCfg.systemPrompt}` : "",
      `\nGuidelines: Answer both general health/wellness questions accurately with evidence-based educational guidance AND clinic-specific questions using the verified details above. Never prescribe drugs or give a definitive diagnosis. Always advise calling ${ctx.phoneDisplay} immediately for urgent or emergency symptoms.`
    ].join("\n");
  }

  function generateBuiltInReply(rawQuery, ctx) {
    const q = rawQuery.toLowerCase().trim();

    if (/\b(chest pain|stroke|bleeding heavily|unconscious|can't breathe|cannot breathe|shortness of breath|suicide|overdose|severe pain|heart attack|seizure)\b/.test(q)) {
      return `<strong>Urgent Symptom Alert:</strong> Please seek immediate emergency medical care or call our 24/7 on-call clinical line right away at <a href="tel:${ctx.phoneRaw}">${escapeHtml(ctx.phoneDisplay)}</a>.<br><br>Our rapid on-call medical team is available around the clock for urgent triage.`;
    }

    for (const item of ctx.faqs) {
      if (item.q && item.a) {
        const qWords = item.q.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        const hits = qWords.filter(w => q.includes(w)).length;
        if (hits >= 2) {
          return `${escapeHtml(item.a)}<br><br><span style="font-size:11px;color:#64748b;">Need personalized help? Call <a href="tel:${ctx.phoneRaw}">${escapeHtml(ctx.phoneDisplay)}</a>.</span>`;
        }
      }
    }

    for (const topic of GENERAL_HEALTH_TOPICS) {
      if (topic.pattern.test(q)) {
        return `<strong>${topic.title}</strong><br>${topic.body}<br><br>Would you like to arrange an in-home clinical visit or speak with a nurse? Call <a href="tel:${ctx.phoneRaw}">${escapeHtml(ctx.phoneDisplay)}</a> or <a href="https://wa.me/${ctx.whatsappRaw}" target="_blank" rel="noopener noreferrer">chat on WhatsApp</a>.`;
      }
    }

    if (/\b(price|pricing|cost|how much|fee|fees|charges|rates|nhif|sha|insurance)\b/.test(q)) {
      return `Care plans are tailored to each client's medical and daily-living needs. Request a free, no-obligation quote via <a href="https://wa.me/${ctx.whatsappRaw}?text=${encodeURIComponent("Hello L&F Medical Clinic, I would like to enquire about care rates and options.")}" target="_blank" rel="noopener noreferrer">WhatsApp (${escapeHtml(ctx.whatsappDisplay)})</a> or call <a href="tel:${ctx.phoneRaw}">${escapeHtml(ctx.phoneDisplay)}</a>.`;
    }

    if (/\b(where|location|address|kiambu|faulu|directions|map|phone|number|call|email|whatsapp|contact|hours|open)\b/.test(q)) {
      return `<strong>${escapeHtml(ctx.clinicName)}</strong><br>• <strong>Address:</strong> ${escapeHtml(ctx.address)}<br>• <strong>Hours:</strong> 24/7 On-Call Medical Service<br>• <strong>24/7 Phone:</strong> <a href="tel:${ctx.phoneRaw}">${escapeHtml(ctx.phoneDisplay)}</a><br>• <strong>WhatsApp:</strong> <a href="https://wa.me/${ctx.whatsappRaw}" target="_blank" rel="noopener noreferrer">${escapeHtml(ctx.whatsappDisplay)}</a><br>• <strong>Email:</strong> <a href="mailto:${escapeHtml(ctx.email)}">${escapeHtml(ctx.email)}</a>`;
    }

    if (/\b(book|appointment|consult|consultation|schedule|enquire|inquiry|start)\b/.test(q)) {
      return `You can arrange a free care consultation in two easy ways:<br>1. Fill out the <a href="#contact">Consultation Form</a> on this page to send your details straight to WhatsApp.<br>2. Call our 24/7 line at <a href="tel:${ctx.phoneRaw}">${escapeHtml(ctx.phoneDisplay)}</a>.`;
    }

    for (const svc of ctx.services) {
      if (svc.keywords.some(kw => q.includes(kw))) {
        return `<strong>${escapeHtml(svc.name)}</strong><br>${escapeHtml(svc.summary)}<br><br><a href="#contact">Request a free consultation</a> or call <a href="tel:${ctx.phoneRaw}">${escapeHtml(ctx.phoneDisplay)}</a> to get started.`;
      }
    }

    if (/\b(service|services|offer|provide|help|care|what do you do)\b/.test(q)) {
      const list = ctx.services.map(s => `• <strong>${escapeHtml(s.name)}</strong>`).join("<br>");
      return `<strong>${escapeHtml(ctx.clinicName)}</strong> offers comprehensive home &amp; clinical care:<br>${list}<br><br>Ask about any service or general health question, or call <a href="tel:${ctx.phoneRaw}">${escapeHtml(ctx.phoneDisplay)}</a>.`;
    }

    if (/^(hi|hello|hey|good morning|good afternoon|good evening|habari|jambo)\b/.test(q)) {
      return `Hello! Welcome to <strong>${escapeHtml(ctx.clinicName)}</strong>. You can ask me general health and wellness questions (such as blood pressure, diabetes, fever, wound care, or senior safety) as well as anything about our home care services, house calls, and 24/7 on-call team.`;
    }

    return `Thank you for your question. While I can share general health guidance and clinic information, our licensed clinicians can give you personalized medical advice.<br><br>• <strong>24/7 Clinical Line:</strong> <a href="tel:${ctx.phoneRaw}">${escapeHtml(ctx.phoneDisplay)}</a><br>• <strong>WhatsApp Care Team:</strong> <a href="https://wa.me/${ctx.whatsappRaw}" target="_blank" rel="noopener noreferrer">${escapeHtml(ctx.whatsappDisplay)}</a><br>• Or <a href="#contact">request a free home care consultation</a>.`;
  }

  async function handleUserQuery(text) {
    const ctx = getLiveContext() || initialCtx;
    appendMessage(text, "user");
    chatHistory.push({ role: "user", content: text });

    if (ctx.aiCfg && ctx.aiCfg.apiKey && ctx.aiCfg.apiKey.trim()) {
      const typingEl = appendMessage('<i class="fas fa-circle-notch fa-spin"></i> Thinking...', "bot");
      try {
        const endpoint = (ctx.aiCfg.endpoint || "https://api.openai.com/v1/chat/completions").trim();
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + ctx.aiCfg.apiKey.trim()
          },
          body: JSON.stringify({
            model: (ctx.aiCfg.model || "gpt-4o-mini").trim(),
            temperature: 0.4,
            max_tokens: 450,
            messages: [
              { role: "system", content: buildSystemPrompt(ctx) },
              ...chatHistory.slice(-8)
            ]
          })
        });
        if (!res.ok) throw new Error("API error " + res.status);
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();
        if (reply) {
          chatHistory.push({ role: "assistant", content: reply });
          typingEl.innerHTML = formatAiText(reply) + `<br><br><span style="font-size:11px;color:#64748b;">24/7 Urgent Line: <a href="tel:${ctx.phoneRaw}">${escapeHtml(ctx.phoneDisplay)}</a></span>`;
          bodyEl.scrollTop = bodyEl.scrollHeight;
          return;
        }
      } catch (_) {
        typingEl.remove();
      }
    }

    const fallbackHtml = generateBuiltInReply(text, ctx);
    setTimeout(() => appendMessage(fallbackHtml, "bot"), 180);
  }

  appendMessage(
    `Welcome to <strong>${escapeHtml(initialCtx.clinicName)}</strong>! Ask me general health and wellness questions or anything about our home care services, 24/7 house calls, and Kiambu Town clinic.`,
    "bot"
  );

  launcher.addEventListener("click", () => {
    const isOpen = win.classList.toggle("open");
    if (isOpen) inputEl.focus();
  });

  document.getElementById("lf-chat-close").addEventListener("click", () => {
    win.classList.remove("open");
  });

  document.getElementById("lf-chat-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".lf-chip");
    if (!chip) return;
    handleUserQuery(chip.getAttribute("data-q"));
  });

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    handleUserQuery(text);
  });
})();
