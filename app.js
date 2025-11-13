// ========================================
// NAVIGATION & PAGE SWITCHING
// ========================================

/**
 * Switches the active page by toggling CSS classes
 * @param {string} pageName - The name of the page to display (without '-page' suffix)
 * @returns {void}
 */
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(pageName + '-page');
    if (el) el.classList.add('active');
    updateNavigation(pageName);
}

/**
 * Display a non-blocking toast notification
 * @param {string} message - Message text
 * @param {'success'|'info'|'warn'|'error'} [type='info'] - Visual type
 * @param {number} [duration=4000] - Time in ms before auto-dismiss
 */
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toasts');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<div class="toast-body">${message}</div><button class="toast-close" aria-label="Close">&times;</button>`;
    container.appendChild(t);
    // Allow CSS animation frame
    requestAnimationFrame(() => t.classList.add('show'));

    const close = () => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 260);
    };

    const closeBtn = t.querySelector('.toast-close');
    if (closeBtn) closeBtn.addEventListener('click', close);

    if (duration > 0) setTimeout(close, duration);
}

// ========================================
// THEME / NIGHT MODE
// ========================================

/**
 * Apply theme ('dark' or 'light') and persist preference
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
    const doc = document.documentElement;
    if (theme === 'dark') {
        doc.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        doc.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
    updateThemeToggleIcon(theme);
}

/**
 * Update the theme toggle button icon/aria state
 * @param {'dark'|'light'} theme
 */
function updateThemeToggleIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}

/**
 * Launch lightweight confetti using canvas-confetti when available
 * @param {number} [particleCount=80]
 */
function launchConfetti(particleCount = 80) {
    if (typeof confetti === 'function') {
        confetti({
            particleCount,
            spread: 160,
            origin: { y: 0.6 }
        });
    }
}

/**
 * Updates navigation links visibility based on authentication status
 * Redirects users to appropriate page if not logged in
 * @param {string} currentPage - The currently active page name
 * @returns {void}
 */
function updateNavigation(currentPage) {
    const isLogged = localStorage.getItem('isLoggedIn') === 'true';
    const dash = document.getElementById('dashboard-link');
    const signout = document.getElementById('signout-link');
    if (dash) dash.style.display = isLogged ? 'inline' : 'none';
    if (signout) signout.style.display = isLogged ? 'inline' : 'none';

    if (isLogged && (currentPage === 'signin' || currentPage === 'signup')) {
        showPage('dashboard');
    } else if (!isLogged && ['dashboard','challenges','rewards','profile'].includes(currentPage)) {
        showPage('signin');
    }
}

/**
 * Logs out the current user by clearing localStorage and redirecting to signin
 * @returns {void}
 */
function signOut() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userName');
    showToast('You have been signed out.', 'info');
    showPage('signin');
}

// ========================================
// AUTHENTICATION HANDLERS
// ========================================

/**
 * Handles user sign-up form submission
 * Validates password match and stores user data in localStorage
 * @param {Event} e - The form submission event
 * @returns {void}
 */
function handleSignUp(e) {
    e.preventDefault();
    const pwd = document.getElementById('signup-password')?.value;
    const confirm = document.getElementById('signup-confirm-password')?.value;
    if (pwd !== confirm) {
        showToast('Passwords do not match!', 'warn');
        return;
    }
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', document.getElementById('signup-name')?.value || 'EcoWarrior');
    showToast('Account created successfully! Redirecting to dashboard...', 'success');
    showPage('dashboard');
}

/**
 * Handles user sign-in form submission
 * Sets authentication status and redirects to dashboard
 * @param {Event} e - The form submission event
 * @returns {void}
 */
function handleSignIn(e) {
    e.preventDefault();
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userName', 'EcoWarrior');
    showToast('Signed in successfully! Redirecting to dashboard...', 'success');
    showPage('dashboard');
}

// ========================================
// POSTS/SHARE WORK FUNCTIONS
// ========================================

/**
 * Retrieves all posts from localStorage
 * @returns {Array} Array of post objects with id, title, description, image, createdAt, author
 */
function getPosts() {
    try {
        return JSON.parse(localStorage.getItem('posts') || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * Saves posts array to localStorage as JSON string
 * @param {Array} posts - Array of post objects to save
 * @returns {void}
 */
function savePosts(posts) {
    localStorage.setItem('posts', JSON.stringify(posts));
}

/**
 * Creates a DOM element for a single post card
 * Builds HTML with post metadata, title, image, and description
 * @param {Object} post - Post object containing id, title, description, image, createdAt, author
 * @returns {HTMLElement} A div element containing the formatted post card
 */
function createPostElement(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    const meta = document.createElement('div');
    meta.className = 'post-meta';
    meta.innerText = `${post.author || 'Anonymous'} • ${new Date(post.createdAt).toLocaleString()}`;
    const title = document.createElement('h3');
    title.innerText = post.title;
    const desc = document.createElement('p');
    desc.innerText = post.description;
    card.appendChild(meta);
    card.appendChild(title);

    if (post.image) {
        const img = document.createElement('img');
        img.src = post.image;
        img.alt = post.title;
        card.appendChild(img);
    }
    card.appendChild(desc);
    // Like button + count
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'space-between';
    actions.style.alignItems = 'center';
    actions.style.marginTop = '12px';

    const likeBtn = document.createElement('button');
    likeBtn.className = 'btn';
    likeBtn.style.padding = '8px 12px';
    likeBtn.style.borderRadius = '8px';
    likeBtn.innerHTML = `<i class="fas fa-heart"></i> <span class="likes-count">${post.likes || 0}</span>`;

    // Handle like toggle (persist per-user via likedPosts localStorage)
    likeBtn.addEventListener('click', () => {
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        const posts = getPosts();
        const idx = posts.findIndex(p => p.id === post.id);
        if (idx === -1) return;
        const p = posts[idx];
        const isLiked = likedPosts.includes(p.id);
        if (isLiked) {
            // unlike
            p.likes = Math.max(0, (p.likes || 0) - 1);
            const pos = likedPosts.indexOf(p.id);
            if (pos > -1) likedPosts.splice(pos, 1);
        } else {
            p.likes = (p.likes || 0) + 1;
            likedPosts.push(p.id);
        }
        savePosts(posts);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
        // update UI count
        likeBtn.querySelector('.likes-count').innerText = p.likes;
        // simple animation
        likeBtn.classList.add('active');
        setTimeout(() => likeBtn.classList.remove('active'), 300);
    });

    actions.appendChild(likeBtn);
    card.appendChild(actions);
    return card;
}

/**
 * Renders all posts to the DOM in a grid layout
 * Sorts posts by creation date (newest first) and displays or hides empty state
 * @returns {void}
 */
function renderPosts() {
    const posts = getPosts().sort((a, b) => b.createdAt - a.createdAt);
    const grid = document.getElementById('posts-grid');
    const noPosts = document.getElementById('no-posts');
    if (!grid) return;
    grid.innerHTML = '';
    if (!posts || posts.length === 0) {
        if (noPosts) noPosts.style.display = 'block';
        return;
    }

    if (noPosts) noPosts.style.display = 'none';
    posts.forEach(p => grid.appendChild(createPostElement(p)));
}

// ========================================
// LANGUAGE & TRANSLATION FUNCTIONS
// ========================================

/**
 * Translates a text key to Nepali if language is set to 'ne', otherwise returns original key
 * @param {string} key - The English text or translation key to translate
 * @returns {string} The translated text in Nepali or the original key if translation not found
 */
function t(key) {
    return document.documentElement.lang === 'ne'
        ? (translations.ne[key] || key)
        : key;
}

/**
 * Applies language translations to all page elements
 * Updates element text content and input placeholders based on selected language
 * Stores language preference and HTML lang attribute
 * @param {string} lang - Language code ('en' for English, 'ne' for Nepali)
 * @returns {void}
 */
function applyTranslations(lang) {
    document.documentElement.lang = (lang === 'ne' ? 'ne' : 'en');
    const map = translations.ne;
    document.querySelectorAll('h1,h2,h3,h4,h5,p,a,button,span,div,label,li').forEach(el => {
        const txt = el.innerText && el.innerText.trim();
        if (!txt) return;
        if (lang === 'ne' && map[txt]) {
            if (!el.dataset.en) el.dataset.en = txt;
            el.innerText = map[txt];
        } else if (lang !== 'ne' && el.dataset.en) {
            el.innerText = el.dataset.en;
        }
    });
    document.querySelectorAll('input,textarea').forEach(inp => {
        const ph = inp.placeholder && inp.placeholder.trim();
        if (!ph) return;
        if (lang === 'ne' && map[ph]) {
            if (!inp.dataset.enPlaceholder) inp.dataset.enPlaceholder = ph;
            inp.placeholder = map[ph];
        } else if (lang !== 'ne' && inp.dataset.enPlaceholder) {
            inp.placeholder = inp.dataset.enPlaceholder;
        }
    });
}

// ========================================
// TRANSLATIONS OBJECT - ENGLISH TO NEPALI
// ========================================

const translations = {
    ne: {
        'Eco Step': 'इको स्टेप',
        'Home': 'होम',
        'Dashboard': 'ड्यासबोर्ड',
        'Challenges': 'चुनौतिहरू',
        'Rewards': 'इनामहरू',
        'Profile': 'प्रोफाइल',
        'Sign Out': 'साइन आउट',
        'Sign Up': 'साइन अप',
        'Sign In': 'साइन इन',
        'Every Step Counts 🌿': 'हरेक चरणको महत्व छ 🌿',
        'Gamify your green journey — walk the talk for our planet.': 'तपाईंको हरियो यात्रालाई खेलझैं रमाइलो बनाउनुहोस् — हाम्रो ग्रहका लागि व्यवहारमा उतारौं।',
        'How It Works': 'कसरी कार्य गर्दछ',
        'Track Your Steps': 'आफ्नो पाइला ट्र्याक गर्नुहोस्',
        'Earn Rewards': 'इनाम कमाउनुहोस्',
        'Join Challenges': 'चुनौतिहरूमा सहभागी हुनुहोस्',
        'Track Impact': 'प्रभाव ट्र्याक गर्नुहोस्',
        'Create Account': 'खाता बनाउनुहोस्',
        'Full Name': 'पुरा नाम',
        'Email Address': 'इमेल ठेगाना',
        'Password': 'पासवर्ड',
        'Confirm Password': 'पासवर्ड पुष्टि गर्नुहोस्',
        'Already have an account?': 'पहिले नै खाता छ?',
        'Welcome Back': 'फेरि स्वागत छ',
        "Don't have an account?": 'खाता छैन?',
        'Your Eco Dashboard': 'तपाईंको इको ड्यासबोर्ड',
        'Your Eco Points': 'तपाईंका इको पोइन्टहरू',
        'Keep going green! Your actions are making a difference.': 'हरियो बनिरहनुहोस्! तपाइँका कार्यहरूले फरक पारिरहेका छन्।',
        'Available Rewards': 'उपलब्ध इनामहरू',
        'Invite friends to join Eco Step and compete in challenges together!': 'इको स्टेपमा साथीलाई आमन्त्रित गर्नुहोस् र सँगै चुनौतिमा प्रतिस्पर्धा गर्नुहोस्!',
        'Copy Invite Link': 'आमन्त्रण लिङ्क कपी गर्नुहोस्',
        'Eco Challenges': 'इको चुनौतीहरू',
        'Weekly Challenge': 'साप्ताहिक चुनौती',
        'Monthly Challenge': 'मासिक चुनौती',
        'Zero Waste Week': 'शून्य फोहोर हप्ता',
        'Community Challenge': 'समुदाय चुनौती',
        'Walk to Work': 'काममा पैदल जानुहोस्',
        'Plant a Tree': 'रुख रोप्नुहोस्',
        'Claim': 'दावी गर्नुहोस्',
        'Gamifying sustainability for a greener future.': 'हरियो भविष्यका लागि दिगोपनालाई खेलझैं बनाउँदै।',
        'Quick Links': 'छिटो लिङ्कहरू',
        'Resources': 'स्रोतहरू',
        'Contact Us': 'सम्पर्क गर्नुहोस्',
        'info@ecostep.np': 'info@ecostep.np',
        'Kathmandu, Nepal': 'काठमांडु, नेपाल',
        '+977-1-4441234': '+977-1-4441234',
        'Privacy Policy': 'गोपनीयता नीति',
        'Terms of Service': 'सेवा सर्तहरू',
        'All rights reserved.': 'सबै अधिकार सुरक्षित।',
        'passwords_mismatch': 'पासवर्ड मेल खाँदैनन्!',
        'account_created': 'खाता सफलतापूर्वक सिर्जना भयो! ड्यासबोर्डमा पुन:निर्देशन गर्दै...',
        'signed_in': 'सफलतापूर्वक साइन इन भयो! ड्यासबोर्डमा पुन:निर्देशन गर्दै...',
        'signed_out': 'तपाइँ साइन आउट भइसकेको छ।',
        'Share Work': 'आफ्नो काम साझा गर्नुहोस्',
        'Share Your Eco-Work': 'आफ्नो इको-काम साझा गर्नुहोस्',
        'Create a New Post': 'नयाँ पोष्ट बनाउनुहोस्',
        'Post Title': 'पोस्ट शीर्षक',
        'What eco-friendly action did you take?': 'तपाइंले कुन वातावरण अनुकूल कार्य गरेको छ?',
        'Description': 'विवरण',
        'Tell us more about your eco-friendly work...': 'आफ्नो पर्यावरण अनुकूल कार्यको बारेमा हामीलाई थप बताउनुहोस्...',
        'Image URL (optional)': 'छवि URL (वैकल्पिक)',
        'Post': 'पोष्ट गर्नुहोस्',
        'Recent Posts': 'हालको पोष्टहरू',
        'No posts yet. Be the first to share your eco-friendly work!': 'अहिलेसम्म कुनै पोष्ट छैन। आफ्नो पर्यावरण अनुकूल कार्य साझा गर्ने पहिलो व्यक्ति बनुहोस्!',
        'Your post has been shared! Thank you for contributing!': 'तपाईंको पोष्ट साझा गरिएको छ! योगदान दिएकोको लागि धन्यवाद!'
    }
};

// ========================================
// PAGE INITIALIZATION - DOM CONTENT LOADED
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize language toggle button and event listeners
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.innerText = document.documentElement.lang === 'ne' ? 'नेपाली' : 'EN | नेपाली';
        // Toggle between English and Nepali on button click
        langToggle.addEventListener('click', () => {
            const newLang = document.documentElement.lang === 'ne' ? 'en' : 'ne';
            applyTranslations(newLang);
            localStorage.setItem('siteLang', newLang);
            langToggle.innerText = newLang === 'ne' ? 'नेपाली' : 'EN | नेपाली';
        });
    }

    // Initialize theme toggle and apply saved / system preference
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            showToast(next === 'dark' ? 'Night mode enabled' : 'Light mode enabled', 'info', 1500);
        });
    }

    // Apply saved language preference from localStorage on page load
    const savedLang = localStorage.getItem('siteLang');
    if (savedLang) applyTranslations(savedLang);

    // Attach sign up form submission handler
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignUp);
    }

    // Attach sign in form submission handler
    const signinForm = document.getElementById('signin-form');
    if (signinForm) {
        signinForm.addEventListener('submit', handleSignIn);
    }

    // Attach post creation form handler with validation and storage
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('post-title').value.trim();
            const desc = document.getElementById('post-desc').value.trim();
            const image = document.getElementById('post-image').value.trim();
            // Validate that post has a title
            if (!title) {
                showToast('Please enter a post title', 'warn');
                return;
            }

            // Create new post object
            const posts = getPosts();
            const prevCount = posts.length;
            posts.push({
                id: Date.now(),
                title: title,
                description: desc,
                image: image || null,
                likes: 0,
                createdAt: Date.now(),
                author: localStorage.getItem('userName') || 'EcoWarrior'
            });

            // Save posts to localStorage and refresh the posts grid
            savePosts(posts);
            renderPosts();
            postForm.reset();
            showToast('Your post has been shared! Thank you for contributing!', 'success');
            // Celebrate first post
            if (prevCount === 0) {
                launchConfetti();
            }
        });
    }

    // Determine initial page based on login status
    if (localStorage.getItem('isLoggedIn') === 'true') {
        showPage('dashboard');
    } else {
        showPage('home');
    }

    // Load and display all posts from localStorage on page load
    renderPosts();

    // Hide splash after short delay (keep minimal time to show branding)
    setTimeout(() => {
        const s = document.getElementById('splash');
        if (s) s.style.display = 'none';
    }, 800);

    // Onboarding: show only if not completed
    const onboardCompleted = localStorage.getItem('onboardCompleted') === 'true';
    const onboarding = document.getElementById('onboarding');
    const onboardStep = document.getElementById('onboard-step');
    const onboardNext = document.getElementById('onboard-next');
    const onboardSkip = document.getElementById('onboard-skip');
    const modalClose = document.querySelector('.modal-close');

    const steps = [
        '<p>Welcome! Use Eco Step to track actions, earn points, and join community challenges.</p>',
        '<p>Share your eco-work on the community board and celebrate wins together.</p>',
        '<p>Enable dark mode and switch to Nepali from the top-right controls anytime.</p>'
    ];
    let stepIndex = 0;

    function showOnboard() {
        if (!onboarding) return;
        onboarding.classList.add('show');
        onboarding.setAttribute('aria-hidden', 'false');
        onboardStep.innerHTML = steps[stepIndex];
    }

    function closeOnboard(save = false) {
        if (!onboarding) return;
        onboarding.classList.remove('show');
        onboarding.setAttribute('aria-hidden', 'true');
        if (save) localStorage.setItem('onboardCompleted', 'true');
    }

    if (!onboardCompleted) showOnboard();

    if (onboardNext) onboardNext.addEventListener('click', () => {
        stepIndex++;
        if (stepIndex >= steps.length) {
            closeOnboard(true);
            showToast('Onboarding completed — enjoy Eco Step!', 'success');
        } else {
            onboardStep.innerHTML = steps[stepIndex];
        }
    });

    if (onboardSkip) onboardSkip.addEventListener('click', () => closeOnboard(true));
    if (modalClose) modalClose.addEventListener('click', () => closeOnboard(false));

    // Register service worker for PWA (best-effort)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js').then(reg => {
            console.log('Service Worker registered:', reg.scope);
        }).catch(err => console.warn('SW registration failed:', err));
    }

    // Initialize scroll reveal animations
    initScrollReveal();
    initChatbot();
});

/**
 * Initialize IntersectionObserver to reveal elements with .reveal
 */
function initScrollReveal() {
    const selectors = ['.feature-card', '.dashboard-card', '.metric-card', '.post-card', '.hero-text', '.hero-image'];
    const elements = selectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));
    elements.forEach(el => el.classList.add('reveal'));

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // if you want one-time reveal, unobserve
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    elements.forEach(el => obs.observe(el));
}

// ========================================
// GEMINI TRASH-TO-TREASURE CHATBOT
// ========================================

const GEMINI_API_KEY = ;
let genAI = null;
let chatSession = null;

/**
 * Initialize Gemini API and chatbot UI
 */
function initChatbot() {
    try {
        // Initialize Google Generative AI
        genAI = window.GoogleGenerativeAI ? new window.GoogleGenerativeAI(GEMINI_API_KEY) : null;
        if (!genAI) {
            console.warn('Google Generative AI SDK not loaded');
            return;
        }

        const toggleBtn = document.getElementById('chatbot-toggle');
        const closeBtn = document.getElementById('chatbot-close');
        const sendBtn = document.getElementById('chatbot-send');
        const input = document.getElementById('chatbot-input');
        const panel = document.getElementById('chatbot-panel');

        if (!toggleBtn || !panel) return;

        // Toggle chatbot panel visibility
        toggleBtn.addEventListener('click', () => {
            const isOpen = panel.classList.contains('open');
            if (isOpen) {
                panel.classList.remove('open');
                toggleBtn.setAttribute('aria-expanded', 'false');
                panel.setAttribute('aria-hidden', 'true');
            } else {
                panel.classList.add('open');
                toggleBtn.setAttribute('aria-expanded', 'true');
                panel.setAttribute('aria-hidden', 'false');
                input.focus();
                // Add welcome message on first open
                if (panel.querySelector('.chatbot-message') === null) {
                    addChatMessage('Hello! 👋 I\'m your Trash to Treasure AI assistant. I help you turn waste into creative, eco-friendly treasures! What do you want to upcycle or repurpose today?', 'bot');
                }
            }
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('open');
                toggleBtn.setAttribute('aria-expanded', 'false');
                panel.setAttribute('aria-hidden', 'true');
            });
        }

        // Send message on button click or Enter key
        if (sendBtn) {
            sendBtn.addEventListener('click', sendChatMessage);
        }

        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                }
            });
        }
    } catch (error) {
        console.error('Error initializing chatbot:', error);
    }
}

/**
 * Add a message to the chat display
 * @param {string} message - The message text
 * @param {'user'|'bot'|'error'|'loading'} type - Message type
 */
function addChatMessage(message, type = 'bot') {
    const messagesDiv = document.getElementById('chatbot-messages');
    if (!messagesDiv) return;

    const msgEl = document.createElement('div');
    msgEl.className = `chatbot-message ${type}`;

    if (type === 'loading') {
        msgEl.innerHTML = '<div class="chatbot-loading-dots"><span></span><span></span><span></span></div>';
    } else {
        msgEl.textContent = message;
    }

    messagesDiv.appendChild(msgEl);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Send a chat message to Gemini API
 */
async function sendChatMessage() {
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    if (!input || !sendBtn) return;

    const message = input.value.trim();
    if (!message) return;

    // Add user message
    addChatMessage(message, 'user');
    input.value = '';
    input.style.height = 'auto';

    // Disable send button and show loading
    sendBtn.disabled = true;
    addChatMessage('', 'loading');

    try {
        // Initialize model if not already done
        if (!genAI) {
            genAI = new window.GoogleGenerativeAI(GEMINI_API_KEY);
        }

        // Initialize chat session if needed
        if (!chatSession) {
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            chatSession = model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: 'You are an expert in sustainable living and creative upcycling. Help users turn their trash into treasure with eco-friendly ideas. Be encouraging, creative, and provide practical, actionable suggestions for repurposing waste materials. Include specific materials, tools, and step-by-step instructions when relevant.'
                    },
                    {
                        role: 'model',
                        parts: 'I understand! I\'m your Trash to Treasure guide. I specialize in helping you transform waste into creative, eco-friendly treasures. I\'ll provide practical, inspiring ideas for upcycling and repurposing items you have at home. Ask me anything about turning trash into treasure! 🌿♻️'
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 256,
                    temperature: 0.7,
                },
            });
        }

        // Send message and get response
        const result = await chatSession.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        // Remove loading message
        const loadingMsg = document.querySelectorAll('.chatbot-message.loading');
        if (loadingMsg.length > 0) {
            loadingMsg[loadingMsg.length - 1].remove();
        }

        // Add bot response
        addChatMessage(text, 'bot');

        // Celebrate eco-tips in chat by playing a subtle toast
        if (text.toLowerCase().includes('idea') || text.toLowerCase().includes('upcycl')) {
            showToast('💡 Great eco-idea! Save this tip for later.', 'success', 3000);
        }
    } catch (error) {
        console.error('Chatbot error:', error);

        // Remove loading message
        const loadingMsg = document.querySelectorAll('.chatbot-message.loading');
        if (loadingMsg.length > 0) {
            loadingMsg[loadingMsg.length - 1].remove();
        }

        // Show error message
        const errorMsg = error.message?.includes('API') 
            ? 'API error: Check your connection or API key. Please try again.'
            : 'Sorry, something went wrong. Please try again.';
        addChatMessage(errorMsg, 'error');
    } finally {
        sendBtn.disabled = false;
    }
}

// ========================================
// MOBILE MENU TOGGLE
// ========================================

// Handle mobile menu button click to show/hide navigation links
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', function() {
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            if (navLinks.style.display === 'flex') {
                // Hide menu if currently visible
                navLinks.style.display = 'none';
            } else {
                // Show menu with flex layout and positioning
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.backgroundColor = 'white';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
            }
        }
    });
}


