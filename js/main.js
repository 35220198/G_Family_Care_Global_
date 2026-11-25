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
                'Hello L&F Medical Clinic, I would like to request a free care consultation.',
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
    }
(function applyCmsToPublicSite(){
            try {
                const site = JSON.parse(localStorage.getItem('gfamily_site_content') || 'null');
                const services = JSON.parse(localStorage.getItem('gfamily_services') || 'null');
                const banner = JSON.parse(localStorage.getItem('gfamily_announcement') || 'null');

                const serviceDomMap = {
                    personal: {
                        wrap: 'wrap-service-personal',
                        img: 'img-service-personal',
                        title: 'title-service-personal',
                        desc: 'desc-service-personal',
                        list: 'list-service-personal'
                    },
                    medical: {
                        wrap: 'medical-care-photo-wrap',
                        img: 'img-service-medical',
                        title: 'title-service-medical',
                        desc: 'desc-service-medical',
                        list: 'list-service-medical'
                    },
                    housecalls: {
                        wrap: 'wrap-service-housecalls',
                        img: 'img-service-housecalls',
                        title: 'title-service-housecalls',
                        desc: 'desc-service-housecalls',
                        list: 'list-service-housecalls'
                    },
                    coordination: {
                        wrap: 'wrap-service-coordination',
                        img: 'img-service-coordination',
                        title: 'title-service-coordination',
                        desc: 'desc-service-coordination',
                        list: 'list-service-coordination'
                    },
                    elderly: {
                        wrap: 'wrap-service-elderly',
                        img: 'img-service-elderly',
                        title: 'title-service-elderly',
                        desc: 'desc-service-elderly',
                        list: 'list-service-elderly'
                    }
                };

                if (Array.isArray(services)) {
                    services.forEach(s => {
                        const map = serviceDomMap[s.id];
                        if (!map) return;

                        const cardEl = document.querySelector('article[data-service-id="' + s.id + '"]');
                        if (cardEl) {
                            cardEl.style.display = s.visible === false ? 'none' : '';
                        }

                        const wrapEl = document.getElementById(map.wrap);
                        const imgEl = document.getElementById(map.img);
                        const titleEl = document.getElementById(map.title);
                        const descEl = document.getElementById(map.desc);
                        const listEl = document.getElementById(map.list);

                        if (wrapEl) {
                            const useWhite = s.whiteFrame !== false;
                            wrapEl.style.background = useWhite ? '#FFFFFF' : 'transparent';
                            wrapEl.style.padding = useWhite ? '10px' : '0';
                        }
                        if (imgEl) {
                            if (s.img) imgEl.src = String(s.img).replace(/^\.\.\//, '');
                            const zoomFit = s.zoomFit !== false;
                            imgEl.style.objectFit = zoomFit ? 'cover' : 'contain';
                            imgEl.style.objectPosition = zoomFit ? 'center top' : 'center';
                        }
                        if (titleEl && s.name) titleEl.textContent = s.name;
                        if (descEl && s.desc) descEl.textContent = s.desc;
                        if (listEl && Array.isArray(s.provisions) && s.provisions.length) {
                            listEl.innerHTML = s.provisions.map(item => {
                                const li = document.createElement('li');
                                li.innerHTML = '<i class="fas fa-check text-emerald-600 mr-2"></i>';
                                li.appendChild(document.createTextNode(item));
                                return li.outerHTML;
                            }).join('');
                        }
                    });
                }

                if (site) {
                    if (site.logoDataUrl) {
                        document.querySelectorAll('img[src*="images/logo.png"], #brand-logo-img').forEach(img => { img.src = site.logoDataUrl; });
                    }
                    if (site.faviconDataUrl) {
                        document.querySelectorAll('link[rel*="icon"]').forEach(lnk => { lnk.href = site.faviconDataUrl; });
                    }
                    const h2Spans = document.querySelectorAll('h1 span, .hero-headline span');
                    if (h2Spans[0] && site.heroTitle1) h2Spans[0].textContent = site.heroTitle1;
                    if (h2Spans[1] && site.heroTitle2) h2Spans[1].textContent = site.heroTitle2;
                    if (h2Spans[2] && site.heroTitle3) h2Spans[2].textContent = site.heroTitle3;

                    if (site.heroCta) {
                        const primaryCta = document.querySelector('.hero-cta-primary');
                        if (primaryCta) {
                            const icon = primaryCta.querySelector('i');
                            primaryCta.textContent = ' ' + site.heroCta;
                            if (icon) primaryCta.prepend(icon);
                        }
                    }

                    if (site.phoneDisplay) {
                        const telClean = String(site.phoneDisplay).replace(/[^+\d]/g, '') || '+254704420485';
                        document.querySelectorAll('a[href^="tel:"]').forEach(a => a.setAttribute('href', 'tel:' + telClean));
                    }

                    const pqBadge = document.getElementById('provider-quote-badge');
                    const pqText = document.getElementById('provider-quote-text');
                    const pqInitials = document.getElementById('provider-quote-initials');
                    const pqName = document.getElementById('provider-quote-name');
                    const pqRole = document.getElementById('provider-quote-role');
                    if (pqBadge && site.providerBadge) pqBadge.textContent = site.providerBadge;
                    if (pqText && site.ceoQuote) pqText.textContent = site.ceoQuote;
                    if (pqInitials && site.providerInitials) pqInitials.textContent = site.providerInitials;
                    if (pqName && site.ceoName) pqName.textContent = site.ceoName;
                    if (pqRole && site.ceoRole) pqRole.textContent = site.ceoRole;
                    if (site.copyright) {
                        document.querySelectorAll('footer p').forEach(p => {
                            if (p.textContent.includes('All rights reserved') || p.textContent.includes('©')) {
                                p.textContent = site.copyright;
                            }
                        });
                    }
                }

                if (banner && banner.enabled && banner.text) {
                    let bar = document.getElementById('cms-top-banner');
                    if (!bar) {
                        bar = document.createElement('div');
                        bar.id = 'cms-top-banner';
                        bar.style.cssText = 'background:#064e3b;color:#fff;font-size:13px;font-weight:600;padding:10px 16px;text-align:center;border-bottom:2px solid #f59e0b;';
                        document.body.prepend(bar);
                    }
                    bar.textContent = banner.text;
                }
            } catch (_) {}
        })();
})();
