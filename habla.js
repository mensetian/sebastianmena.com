// Cache for loaded translations
const translationCache = {};

// Supported languages
const supportedLanguages = ['en', 'es'];

// Default English translations as fallback
const defaultTranslations = {
    en: {
        title: "Sebastián Mena - Software Engineer",
        description: "Portfolio of Sebastián Mena, a skilled Software Engineer showcasing innovative projects and expertise.",
        keywords: "Sebastián Mena, Software Engineer, Portfolio, Web Development",
        ogDescription: "Explore the portfolio of Sebastián Mena, featuring cutting-edge software projects.",
        lang_switcher: "Language switcher: English selected"
    }
};

// Load translations from JSON file
async function loadTranslations(lang) {
    if (!supportedLanguages.includes(lang)) {
        console.warn(`Unsupported language: ${lang}. Falling back to 'en'.`);
        lang = 'en';
    }
    if (translationCache[lang]) {
        // console.log(`Using cached translations for ${lang}`);
        return translationCache[lang];
    }
    try {
        // console.log(`Fetching translations from /lang/${lang}.json`);
        const response = await fetch(`/lang/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: Failed to load translations for ${lang}`);
        }
        const translations = await response.json();
        // console.log(`Successfully loaded translations for ${lang}:`, translations);
        translationCache[lang] = translations;
        return translations;
    } catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
        delete translationCache[lang]; // Clear cache on failure
        if (lang === 'en') {
            // console.log(`Falling back to default English translations`);
            return defaultTranslations.en;
        }
        return {}; // Fallback to empty object for other languages
    }
}

// DOM elements
const langToggle = document.getElementById('lang-toggle');

// Apply language to the page
async function applyLocale(loc) {
    const texts = await loadTranslations(loc);

    // Update text content for elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (texts[key]) {
            element.textContent = texts[key];
        } else {
            console.warn(`Translation key "${key}" not found for language "${loc}"`);
        }
    });

    // Update meta tags and title
    if (texts.title) {
        document.title = texts.title;
    } else {
        console.warn(`Title translation not found for language "${loc}"`);
    }

    const metaMappings = [
        { selector: 'meta[name="description"]', key: 'description', attr: 'content' },
        { selector: 'meta[name="keywords"]', key: 'keywords', attr: 'content' },
        { selector: 'meta[property="og:title"]', key: 'title', attr: 'content' },
        { selector: 'meta[property="og:description"]', key: 'ogDescription', attr: 'content' }
    ];

    metaMappings.forEach(({ selector, key, attr }) => {
        if (texts[key]) {
            const metaElement = document.querySelector(selector);
            if (metaElement) {
                metaElement.setAttribute(attr, texts[key]);
            } else {
                console.warn(`Meta element "${selector}" not found in DOM`);
            }
        } else {
            console.warn(`Translation key "${key}" not found for language "${loc}"`);
        }
    });

    // Update language toggle and other UI elements
    if (langToggle) {
        langToggle.checked = (loc === 'es');
    } else {
        console.warn('Language toggle element not found');
    }
    document.documentElement.lang = loc;
    const languageSwitch = document.querySelector('.language-switch');
    if (languageSwitch) {
        languageSwitch.setAttribute('aria-label', texts['lang_switcher'] || `Language switcher: ${loc === 'en' ? 'English' : 'Spanish'} selected`);
    }
    localStorage.setItem('language', loc);
}

// Initialize language
async function initializeLanguage() {
    const savedLoc = localStorage.getItem('language');
    const browserLoc = navigator.language.startsWith('es') ? 'es' : 'en';
    const initialLoc = supportedLanguages.includes(savedLoc) ? savedLoc : browserLoc;
    // console.log(`Initializing language: ${initialLoc}`);
    await applyLocale(initialLoc);
}

// Event listener for toggle
if (langToggle) {
    langToggle.addEventListener('change', async () => {
        const newLoc = langToggle.checked ? 'es' : 'en';
        // console.log(`Switching language to: ${newLoc}`);
        await applyLocale(newLoc);
    });
}

// Run initialization
document.addEventListener('DOMContentLoaded', initializeLanguage);