{"@context":"https://schema.org","@type":"HomeHealthCare","name":"G.Family Home Care Services - Dr. Roger's","url":"https://www.gfamilycare.com/","telephone":"+254704420485","email":"info@gfamilycare.com","address":{"@type":"PostalAddress","streetAddress":"123 Care Lane","addressLocality":"Dallas","addressRegion":"TX","postalCode":"75201","addressCountry":"US"}}

{
  "@context":"https://schema.org",
  "@type":"WebSite",
  "name":"G.Family Home Care Services",
  "url":"https://www.gfamilycare.com/",
  "potentialAction":{
    "@type":"SearchAction",
    "target":"https://www.gfamilycare.com/?q={search_term_string}",
    "query-input":"required name=search_term_string"
  }
}

{
  "@context":"https://schema.org",
  "@type":"FAQPage",
  "mainEntity":[
    {
      "@type":"Question",
      "name":"What home care services does G.Family provide?",
      "acceptedAnswer":{"@type":"Answer","text":"G.Family provides personal care, medical care, house calls, elderly care, advice and coordination, and on-call medical service."}
    },
    {
      "@type":"Question",
      "name":"Is care available outside normal business hours?",
      "acceptedAnswer":{"@type":"Answer","text":"G.Family advertises on-call medical support and assistance outside standard working hours. Contact the care team to confirm current availability and response arrangements."}
    },
    {
      "@type":"Question",
      "name":"How do I request a care consultation?",
      "acceptedAnswer":{"@type":"Answer","text":"Use the care consultation form on the website or call the listed contact number to discuss your care needs and next steps."}
    },
    {
      "@type":"Question",
      "name":"What does G.Family elderly care include?",
      "acceptedAnswer":{"@type":"Answer","text":"Yes. Elderly care supports safe daily living, comfort, dignity, independence and wellbeing at home."}
    }
  ]
}

(function(){
        const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        addEventListener('load', () => setTimeout(() => document.getElementById('page-loader')?.classList.add('done'), 250));
        
        const progress = document.getElementById('scroll-progress');
        const update = () => {
            const max = document.documentElement.scrollHeight - innerHeight;
            progress.style.width = (max ? scrollY / max * 100 : 0) + '%';
        };
        addEventListener('scroll', update, {passive: true});
        update();
        
        if(!reduce && 'IntersectionObserver' in window){
            const ob = new IntersectionObserver(es => es.forEach(e => {
                if(e.isIntersecting){ e.target.classList.add('show'); ob.unobserve(e.target); }
            }), {threshold: .12});
            document.querySelectorAll('.reveal').forEach(x => ob.observe(x));
        } else {
            document.querySelectorAll('.reveal').forEach(x => x.classList.add('show'));
        }
        
        if(!reduce && matchMedia('(pointer:fine)').matches){
            const dot = document.querySelector('.cursor-dot'), ring = document.querySelector('.cursor-ring');
            let x=0, y=0, rx=0, ry=0;
            addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.left = x+'px'; dot.style.top = y+'px'; });
            (function loop(){
                rx += (x - rx) * .2; ry += (y - ry) * .2;
                ring.style.left = rx+'px'; ring.style.top = ry+'px';
                requestAnimationFrame(loop);
            })();
            document.querySelectorAll('a, button, .interactive-card, input, select, textarea').forEach(el => {
                el.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
            });
        }
        
        if(!reduce && matchMedia('(pointer:fine)').matches){
            document.querySelectorAll('.interactive-card').forEach(card => {
                card.addEventListener('pointermove', e => {
                    const r = card.getBoundingClientRect(), px = (e.clientX - r.left)/r.width - .5, py = (e.clientY - r.top)/r.height - .5;
                    card.style.transform = 'perspective(900px) rotateX('+(-py*4)+'deg) rotateY('+(px*5)+'deg) translateY(-7px) scale(1.01)';
                });
                card.style.transition = 'transform 0.2s ease-out';
                card.addEventListener('pointerleave', () => card.style.transform = '');
            });
        }
        
        document.querySelectorAll('.btnfx, button').forEach(el => el.addEventListener('pointerdown', e => {
            const r = el.getBoundingClientRect(), size = Math.max(r.width, r.height), q = document.createElement('span');
            q.className = 'ripple'; q.style.width = q.style.height = size+'px';
            q.style.left = (e.clientX - r.left - size/2)+'px'; q.style.top = (e.clientY - r.top - size/2)+'px';
            el.appendChild(q); setTimeout(() => q.remove(), 700);
        }));
        
        const mt = document.getElementById('mobile-toggle'), mm = document.getElementById('mobile-menu');
        mt?.addEventListener('click', () => {
            const o = mm.classList.toggle('open');
            mt.setAttribute('aria-expanded', o);
            mt.innerHTML = o ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
        });
        mm?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            mm.classList.remove('open'); mt.setAttribute('aria-expanded', 'false'); mt.innerHTML = '<i class="fas fa-bars"></i>';
        }));
        
        const careForm = document.getElementById('care-form');
        const details = document.getElementById('details');
        const detailsCount = document.getElementById('details-count');
        details?.addEventListener('input', () => {
            if(detailsCount) detailsCount.textContent = `${details.value.length} / 1200`;
        });

        careForm?.addEventListener('submit', e => {
            e.preventDefault();
            const form = e.currentTarget;
            const st = document.getElementById('form-status');

            if(!form.checkValidity()){
                form.reportValidity();
                st.textContent = 'Please complete the required fields before continuing.';
                st.className = 'text-sm mt-3 text-amber-800 font-semibold';
                return;
            }

            const data = new FormData(form);
            const lines = [
                'Hello G.Family Care, I would like to request a free care consultation.',
                '',
                `Name: ${data.get('full_name') || ''}`,
                `Phone: ${data.get('phone') || ''}`,
                `Email: ${data.get('email') || 'Not provided'}`,
                `Preferred contact: ${data.get('preferred_contact') || 'WhatsApp'}`,
                `Care type: ${data.get('care_type') || ''}`,
                `Best contact time: ${data.get('preferred_time') || 'As soon as possible'}`,
                `City / service area: ${data.get('location') || 'Not provided'}`,
                '',
                `Care notes: ${data.get('details') || 'No additional notes'}`
            ];

            const whatsappUrl = 'https://wa.me/254720886526?text=' + encodeURIComponent(lines.join('\n'));
            st.innerHTML = 'Your consultation message is ready. <a class="underline font-bold" target="_blank" rel="noopener noreferrer" href="' + whatsappUrl + '">Open it in WhatsApp</a> if it did not open automatically.';
            st.className = 'text-sm mt-3 text-emerald-800 font-semibold';

            const popup = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            if(!popup) window.location.href = whatsappUrl;
        });
    })();
