const ALL_COUNTRIES = [
    { n: "Afghanistan", c: "+93" }, { n: "Albania", c: "+355" }, { n: "Algeria", c: "+213" }, { n: "Andorra", c: "+376" }, { n: "Angola", c: "+244" },
    { n: "Antigua and Barbuda", c: "+1-268" }, { n: "Argentina", c: "+54" }, { n: "Armenia", c: "+374" }, { n: "Australia", c: "+61" }, { n: "Austria", c: "+43" },
    { n: "Azerbaijan", c: "+994" }, { n: "Bahamas", c: "+1-242" }, { n: "Bahrain", c: "+973" }, { n: "Bangladesh", c: "+880" }, { n: "Barbados", c: "+1-246" },
    { n: "Belarus", c: "+375" }, { n: "Belgium", c: "+32" }, { n: "Belize", c: "+501" }, { n: "Benin", c: "+229" }, { n: "Bhutan", c: "+975" },
    { n: "Bolivia", c: "+591" }, { n: "Bosnia and Herzegovina", c: "+387" }, { n: "Botswana", c: "+267" }, { n: "Brazil", c: "+55" }, { n: "Brunei", c: "+673" },
    { n: "Bulgaria", c: "+359" }, { n: "Burkina Faso", c: "+226" }, { n: "Burundi", c: "+257" }, { n: "Cabo Verde", c: "+238" }, { n: "Cambodia", c: "+855" },
    { n: "Cameroon", c: "+237" }, { n: "Canada", c: "+1" }, { n: "Central African Republic", c: "+236" }, { n: "Chad", c: "+235" }, { n: "Chile", c: "+56" },
    { n: "China", c: "+86" }, { n: "Colombia", c: "+57" }, { n: "Comoros", c: "+269" }, { n: "Congo (Congo-Brazzaville)", c: "+242" }, { n: "Congo (Democratic Republic)", c: "+243" },
    { n: "Costa Rica", c: "+506" }, { n: "Croatia", c: "+385" }, { n: "Cuba", c: "+53" }, { n: "Cyprus", c: "+357" }, { n: "Czechia", c: "+420" },
    { n: "Denmark", c: "+45" }, { n: "Djibouti", c: "+253" }, { n: "Dominica", c: "+1-767" }, { n: "Dominican Republic", c: "+1-809" }, { n: "Ecuador", c: "+593" },
    { n: "Egypt", c: "+20" }, { n: "El Salvador", c: "+503" }, { n: "Equatorial Guinea", c: "+240" }, { n: "Eritrea", c: "+291" }, { n: "Estonia", c: "+372" },
    { n: "Eswatini", c: "+268" }, { n: "Ethiopia", c: "+251" }, { n: "Fiji", c: "+679" }, { n: "Finland", c: "+358" }, { n: "France", c: "+33" },
    { n: "Gabon", c: "+241" }, { n: "Gambia", c: "+220" }, { n: "Georgia", c: "+995" }, { n: "Germany", c: "+49" }, { n: "Ghana", c: "+233" },
    { n: "Greece", c: "+30" }, { n: "Grenada", c: "+1-473" }, { n: "Guatemala", c: "+502" }, { n: "Guinea", c: "+224" }, { n: "Guinea-Bissau", c: "+245" },
    { n: "Guyana", c: "+592" }, { n: "Haiti", c: "+509" }, { n: "Honduras", c: "+504" }, { n: "Hungary", c: "+36" }, { n: "Iceland", c: "+354" },
    { n: "India", c: "+91" }, { n: "Indonesia", c: "+62" }, { n: "Iran", c: "+98" }, { n: "Iraq", c: "+964" }, { n: "Ireland", c: "+353" },
    { n: "Israel", c: "+972" }, { n: "Italy", c: "+39" }, { n: "Jamaica", c: "+1-876" }, { n: "Japan", c: "+81" }, { n: "Jordan", c: "+962" },
    { n: "Kazakhstan", c: "+7" }, { n: "Kenya", c: "+254" }, { n: "Kiribati", c: "+686" }, { n: "Kuwait", c: "+965" }, { n: "Kyrgyzstan", c: "+996" },
    { n: "Laos", c: "+856" }, { n: "Latvia", c: "+371" }, { n: "Lebanon", c: "+961" }, { n: "Lesotho", c: "+266" }, { n: "Liberia", c: "+231" },
    { n: "Libya", c: "+218" }, { n: "Liechtenstein", c: "+423" }, { n: "Lithuania", c: "+370" }, { n: "Luxembourg", c: "+352" }, { n: "Madagascar", c: "+261" },
    { n: "Malawi", c: "+265" }, { n: "Malaysia", c: "+60" }, { n: "Maldives", c: "+960" }, { n: "Mali", c: "+223" }, { n: "Malta", c: "+356" },
    { n: "Marshall Islands", c: "+692" }, { n: "Mauritania", c: "+222" }, { n: "Mauritius", c: "+230" }, { n: "Mexico", c: "+52" }, { n: "Micronesia", c: "+691" },
    { n: "Moldova", c: "+373" }, { n: "Monaco", c: "+377" }, { n: "Mongolia", c: "+976" }, { n: "Montenegro", c: "+382" }, { n: "Morocco", c: "+212" },
    { n: "Mozambique", c: "+258" }, { n: "Myanmar", c: "+95" }, { n: "Namibia", c: "+264" }, { n: "Nauru", c: "+674" }, { n: "Nepal", c: "+977" },
    { n: "Netherlands", c: "+31" }, { n: "New Zealand", c: "+64" }, { n: "Nicaragua", c: "+505" }, { n: "Niger", c: "+227" }, { n: "Nigeria", c: "+234" },
    { n: "North Korea", c: "+850" }, { n: "North Macedonia", c: "+389" }, { n: "Norway", c: "+47" }, { n: "Oman", c: "+968" }, { n: "Pakistan", c: "+92" },
    { n: "Palau", c: "+680" }, { n: "Palestine State", c: "+970" }, { n: "Panama", c: "+507" }, { n: "Papua New Guinea", c: "+675" }, { n: "Paraguay", c: "+595" },
    { n: "Peru", c: "+51" }, { n: "Philippines", c: "+63" }, { n: "Poland", c: "+48" }, { n: "Portugal", c: "+351" }, { n: "Qatar", c: "+974" },
    { n: "Romania", c: "+40" }, { n: "Russia", c: "+7" }, { n: "Rwanda", c: "+250" }, { n: "Saint Kitts and Nevis", c: "+1-869" }, { n: "Saint Lucia", c: "+1-758" },
    { n: "Saint Vincent and the Grenadines", c: "+1-784" }, { n: "Samoa", c: "+685" }, { n: "San Marino", c: "+378" }, { n: "Sao Tome and Principe", c: "+239" }, { n: "Saudi Arabia", c: "+966" },
    { n: "Senegal", c: "+221" }, { n: "Serbia", c: "+381" }, { n: "Seychelles", c: "+248" }, { n: "Sierra Leone", c: "+232" }, { n: "Singapore", c: "+65" },
    { n: "Slovakia", c: "+421" }, { n: "Slovenia", c: "+386" }, { n: "Solomon Islands", c: "+677" }, { n: "Somalia", c: "+252" }, { n: "South Africa", c: "+27" },
    { n: "South Korea", c: "+82" }, { n: "South Sudan", c: "+211" }, { n: "Spain", c: "+34" }, { n: "Sri Lanka", c: "+94" }, { n: "Sudan", c: "+249" },
    { n: "Suriname", c: "+597" }, { n: "Sweden", c: "+46" }, { n: "Switzerland", c: "+41" }, { n: "Syria", c: "+963" }, { n: "Taiwan", c: "+886" },
    { n: "Tajikistan", c: "+992" }, { n: "Tanzania", c: "+255" }, { n: "Thailand", c: "+66" }, { n: "Timor-Leste", c: "+670" }, { n: "Togo", c: "+228" },
    { n: "Tonga", c: "+676" }, { n: "Trinidad and Tobago", c: "+1-868" }, { n: "Tunisia", c: "+216" }, { n: "Turkey", c: "+90" }, { n: "Turkmenistan", c: "+993" },
    { n: "Tuvalu", c: "+688" }, { n: "Uganda", c: "+256" }, { n: "Ukraine", c: "+380" }, { n: "United Arab Emirates", c: "+971" }, { n: "United Kingdom", c: "+44" },
    { n: "United States", c: "+1" }, { n: "Uruguay", c: "+598" }, { n: "Uzbekistan", c: "+998" }, { n: "Vanuatu", c: "+678" }, { n: "Venezuela", c: "+58" },
    { n: "Vietnam", c: "+84" }, { n: "Yemen", c: "+967" }, { n: "Zambia", c: "+260" }, { n: "Zimbabwe", c: "+263" }
];

// ===== LIVE WAITLIST COUNTER =====
function updateWaitlistCounter() {
    // Find ALL elements that show the waitlist count
    const counterElements = document.querySelectorAll('.waitlist-count, .counter-number, [data-counter], .count');
    
    fetch('count.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const count = data.count;
                counterElements.forEach(el => {
                    // Animate the counter
                    animateCounter(el, count);
                });
            }
        })
        .catch(err => {
            console.log('Counter fetch failed, using default');
        });
}

function animateCounter(element, target) {
    const currentVal = parseInt(element.textContent) || 0;
    if (currentVal === target) return;

    const duration = 1500; // 1.5 seconds
    const start = currentVal;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (target - start) * easeOut);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ===== REFERRAL HANDLING =====
function handleReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    
    if (ref) {
        // Store referral
        localStorage.setItem('sella_ref', ref);
        
        // Auto-fill referral field if it exists
        const refInput = document.querySelector('input[name="referral_code"], input[name="referred_by"], #referral-code');
        if (refInput) {
            refInput.value = ref;
        }
        
        // Show referral banner
        if (!document.querySelector('.referral-banner')) {
            const banner = document.createElement('div');
            banner.className = 'referral-banner';
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#25D366;color:white;text-align:center;padding:10px;font-size:14px;z-index:10000;box-shadow:0 2px 10px rgba(0,0,0,0.1);font-weight:600;';
            banner.innerHTML = '👋 You were referred by a friend! Sign up and you both get rewards. <span style="cursor:pointer;margin-left:10px;opacity:0.8" onclick="this.parentElement.remove()">✕</span>';
            document.body.prepend(banner);
            
            // Adjust body padding to not hide navbar
            document.body.style.paddingTop = '40px';
        }
    }
    
    // Also check localStorage for previous referral
    const storedRef = localStorage.getItem('sella_ref');
    if (storedRef) {
        // If we don't have a ref in URL, still prepopulate if possible
        const refInput = document.querySelector('input[name="referral_code"], input[name="referred_by"], #referral-code');
        if (refInput && !refInput.value) {
            refInput.value = storedRef;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize
    updateWaitlistCounter();
    handleReferral();
    
    // Refresh counter every 30 seconds
    setInterval(updateWaitlistCounter, 30000);

    // 0. Populate Countries
    const cSelect = document.getElementById('country');
    const ccSelect = document.getElementById('country_code');
    
    if (cSelect && ccSelect) {
        ALL_COUNTRIES.forEach(item => {
            const opt1 = document.createElement('option');
            opt1.value = item.n;
            opt1.textContent = item.n;
            cSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = item.c;
            opt2.textContent = `${item.n} (${item.c})`;
            ccSelect.appendChild(opt2);
        });
        
        // Append "Other" at the end if not there
        const other1 = document.createElement('option');
        other1.value = "Other";
        other1.textContent = "Other";
        cSelect.appendChild(other1);

        const other2 = document.createElement('option');
        other2.value = "other";
        other2.textContent = "Other";
        ccSelect.appendChild(other2);
    }
    // 1. Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Simple CSS injection for active state handled in CSS preferably, but keeping existing logic
            if (window.innerWidth <= 768) {
                navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = 'white';
                navLinks.style.padding = '20px';
            }
        });
    }

    // 2. Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Country/IP Auto-detection
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            if (data.country_name) {
                const countrySelect = document.getElementById('country');
                const countryCodeSelect = document.getElementById('country_code');
                
                if (countrySelect) {
                    for (let option of countrySelect.options) {
                        if (option.value === data.country_name) {
                            option.selected = true;
                            break;
                        }
                    }
                }
                
                if (countryCodeSelect) {
                    const countryData = ALL_COUNTRIES.find(c => c.n === data.country_name);
                    if (countryData) {
                        countryCodeSelect.value = countryData.c;
                    }
                }
            }
        })
        .catch(err => console.log('IP detection failed, defaulting.'));

    // 4. Form Accordion
    const accordions = document.querySelectorAll('.accordion-header');
    accordions.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isOpen = content.style.display === 'block';
            
            // Close all
            document.querySelectorAll('.accordion-content').forEach(c => c.style.display = 'none');
            document.querySelectorAll('.accordion-header span').forEach(s => s.textContent = '+');
            
            if (!isOpen) {
                content.style.display = 'block';
                header.querySelector('span').textContent = '-';
            }
        });
    });

    // 4.5 Custom Country/Code Logic
    const countrySelectWrap = document.getElementById('country');
    const customCountryInput = document.getElementById('custom_country');
    const countryCodeSelectWrap = document.getElementById('country_code');
    const customCountryCodeInput = document.getElementById('custom_country_code');

    if (countrySelectWrap) {
        countrySelectWrap.addEventListener('change', () => {
            if (countrySelectWrap.value === 'Other') {
                customCountryInput.classList.remove('hidden');
                customCountryInput.required = true;
            } else {
                customCountryInput.classList.add('hidden');
                customCountryInput.required = false;
            }
        });
    }

    if (countryCodeSelectWrap) {
        countryCodeSelectWrap.addEventListener('change', () => {
            if (countryCodeSelectWrap.value === 'other') {
                customCountryCodeInput.classList.remove('hidden');
                customCountryCodeInput.required = true;
            } else {
                customCountryCodeInput.classList.add('hidden');
                customCountryCodeInput.required = false;
            }
        });
    }

    // 5. Chat Demo Loop
    const chatLoop = document.getElementById('chat-loop');
    if (chatLoop) {
        const demoMessages = [
            { type: 'incoming', text: 'Hi!' },
            { type: 'outgoing', text: 'Welcome to Amani Fashion! 👋<br><br><span class="btn-chat">🛍️ Shop</span> <span class="btn-chat">📦 Track Order</span>' },
            { type: 'incoming', text: '🛍️ Shop' },
            { type: 'outgoing', text: 'Choose a category:<br><br><span class="btn-chat">👕 Clothing</span> <span class="btn-chat">👟 Shoes</span>' },
            { type: 'incoming', text: 'Clothing' },
            { type: 'outgoing', text: '👕 1. Blue T-Shirt — KES 1,500<br>2. Red Dress — KES 3,000' },
            { type: 'incoming', text: '1' },
            { type: 'outgoing', text: 'Classic Blue T-Shirt — KES 1,500<br><br><span class="btn-chat">S</span> <span class="btn-chat">M</span> <span class="btn-chat">L</span>' },
            { type: 'incoming', text: 'L' },
            { type: 'outgoing', text: 'Added! 🛒 Total: KES 1,500<br><br><span class="btn-chat">💳 Pay Now</span>' },
            { type: 'incoming', text: 'Pay Now' },
            { type: 'outgoing', text: '✅ Payment received! Order #ORD-2025-0001 confirmed! 🎉' }
        ];

        let currentMsg = 0;
        function runDemo() {
            if (currentMsg >= demoMessages.length) {
                setTimeout(() => {
                    chatLoop.innerHTML = '';
                    currentMsg = 0;
                    runDemo();
                }, 3000);
                return;
            }

            const msg = demoMessages[currentMsg];
            const div = document.createElement('div');
            div.className = `message ${msg.type}`;
            div.innerHTML = msg.text;
            chatLoop.appendChild(div);
            
            chatLoop.scrollTop = chatLoop.scrollHeight;
            currentMsg++;
            setTimeout(runDemo, 2000);
        }
        runDemo();
    }

    // 6. Form Submission
    const form = document.getElementById('waitlist-form');
    const thankYou = document.getElementById('thank-you');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Joining...';

            const formData = new FormData(form);
            
            // Add referral from localStorage if exists and not already in form
            const storedRef = localStorage.getItem('sella_ref');
            if (storedRef && !formData.get('ref')) {
                formData.append('ref', storedRef);
            }
            
            fetch('submit.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    form.classList.add('hidden');
                    thankYou.classList.remove('hidden');
                    document.getElementById('position').textContent = data.position;
                    
                    const refUrl = `https://sella.kesug.com/?ref=${data.referral_code}`;
                    document.getElementById('referral-url').value = refUrl;
                    
                    // Set WhatsApp share link
                    const waText = encodeURIComponent(`I'm excited for SELLA! Join the waitlist for your WhatsApp store: ${refUrl}`);
                    document.getElementById('share-wa').href = `https://wa.me/?text=${waText}`;
                } else {
                    alert(data.error || 'Something went wrong. Please try again.');
                    submitBtn.disabled = false;
                    submitBtn.textContent = '🚀 Join the Waitlist';
                }
            })
            .catch(err => {
                console.error('Submit error:', err);
                alert('Connection error. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 Join the Waitlist';
            });
        });
    }

    // 7. Clipboard
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const urlInput = document.getElementById('referral-url');
            urlInput.select();
            document.execCommand('copy');
            alert('Referral link copied!');
        });
    }

    // 8. Intersection Observer for Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .problem-card, .step, .plan-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
});

