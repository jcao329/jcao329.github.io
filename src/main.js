// dynamic accessor for current nav links (works with React-rendered DOM)
function getNavLinks(){ return document.querySelectorAll('.nav-link'); }
const sections = document.querySelectorAll('.content-section');
const toggleBtn = document.getElementById('toggleBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const chairItems = document.querySelectorAll('.chair-item');

// Navigation functionality (delegated to support dynamically-rendered sidebar)
document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (!link) return;
    const pageId = link.getAttribute('data-page');
    const targetSection = pageId && document.getElementById(pageId);

    // If the target section exists on this page, handle navigation in-page.
    if (targetSection) {
        e.preventDefault();
        Array.from(getNavLinks()).forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        sections.forEach(section => section.classList.remove('active'));
        targetSection.classList.add('active');
    }
    // otherwise, allow the link to navigate (e.g., to /index.html#thoughts)
});

// On load, if there's a hash pointing to a section, activate it
function activateHashSection(){
    // Resolve desired fragment in this priority:
    // 1. pending-clicked-href (extract fragment)
    // 2. URL hash
    // 3. pending-index-hash
    let fragment = '';
    try {
        const pendingHref = sessionStorage.getItem('pending-clicked-href');
        if (pendingHref) {
            const parts = pendingHref.split('#');
            fragment = parts[1] || '';
            sessionStorage.removeItem('pending-clicked-href');
        }
    } catch (e) { /* ignore */ }

    if (!fragment) fragment = window.location.hash.replace('#','');
    // fragment resolved from pending values or URL hash

    if (!fragment) {
        try {
            const pending = sessionStorage.getItem('pending-index-hash');
            if (pending) {
                fragment = pending;
                sessionStorage.removeItem('pending-index-hash');
                try { window.history.replaceState(null, '', '#' + fragment); } catch(e) {}
            }
        } catch (e) {}
    }

    // If a canonical pending key exists prefer it (set by include-sidebar on click)
    try {
        const pendingKey = sessionStorage.getItem('pending-key');
        if (pendingKey) {
            // canonical format: section:NAME or project:FILENAME
            const [kind, value] = pendingKey.split(':');
            if (kind === 'section' && value) {
                fragment = value;
            } else if (kind === 'project' && value) {
                // try to find an anchor whose href ends with the filename
                const anchors = Array.from(document.querySelectorAll('.nav-menu a'));
                const match = anchors.find(a => {
                    const ah = a.getAttribute('href') || '';
                    return ah.endsWith(value) || ah.includes(value);
                });
                if (match) {
                    match.classList.add('active');
                    sessionStorage.removeItem('pending-key');
                    sessionStorage.removeItem('pending-clicked-href');
                    return;
                }
            }
            sessionStorage.removeItem('pending-key');
        }
    } catch (e) { /* ignore */ }

    if (!fragment) return;

    const target = document.getElementById(fragment);
    if (!target) return;

    sections.forEach(s => s.classList.remove('active'));
    target.classList.add('active');

    // Clear previous active link
    Array.from(getNavLinks()).forEach(l => l.classList.remove('active'));

    // Try to find a matching nav link by data-page, then by href ending with the fragment, then by includes
    const byData = Array.from(getNavLinks()).find(l => l.getAttribute('data-page') === fragment);
    if (byData) {
        byData.classList.add('active');
        return;
    }

    // find by href fragment match
    const anchors = Array.from(document.querySelectorAll('.nav-menu a'));
    const byHref = anchors.find(a => {
        const ah = a.getAttribute('href') || '';
        return ah.endsWith('#' + fragment) || ah.includes('#' + fragment) || ah === fragment;
    });
    if (byHref) { byHref.classList.add('active'); return; }

    // final fallback: try includes
    const byInclude = anchors.find(a => {
        const ah = a.getAttribute('href') || '';
        return ah.includes(fragment) || fragment.includes(ah);
    });
    if (byInclude) byInclude.classList.add('active');
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', activateHashSection);
else activateHashSection();

// Chair navigation: if the section exists on this page, activate it in-place; otherwise navigate
chairItems.forEach(chair => {
    chair.addEventListener('click', () => {
        const pageId = chair.getAttribute('data-page');
        if (!pageId) return;

        const target = document.getElementById(pageId);
        if (target) {
            // in-page activation
            sections.forEach(section => section.classList.remove('active'));
            target.classList.add('active');

            // update sidebar active state
            Array.from(getNavLinks()).forEach(link => link.classList.remove('active'));
            const matching = Array.from(getNavLinks()).find(l => l.getAttribute('data-page') === pageId);
            if (matching) matching.classList.add('active');
            return;
        }

        // section not present on this page -> navigate to the appropriate HTML file
        let href = '/index.html';
        if (pageId === 'thoughts') href = '/thoughts.html';
        else if (pageId === 'about') href = '/about.html';
        else if (pageId === 'side-projects') href = '/projects.html';

        // preserve intent so the target page (or index) can highlight the right section
        try {
            sessionStorage.setItem('pending-key', 'section:' + pageId);
            sessionStorage.setItem('pending-clicked-href', href + (pageId ? '#' + pageId : ''));
        } catch (e) { /* ignore storage errors */ }

        window.location.assign(href);
    });
});

// Sidebar toggle functionality
// toggleBtn.addEventListener('click', () => {
if (toggleBtn && sidebar && mainContent) {
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');

        // Toggle between hamburger and X
        if (sidebar.classList.contains('collapsed')) {
            toggleBtn.textContent = '☰';
        } else {
            toggleBtn.textContent = '✕';
        }
    });
}

// Submenu toggle: open/close side-projects submenu
function bindSubmenuToggles(){
    const toggles = document.querySelectorAll('.submenu-toggle');
    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.closest('.has-submenu');
            if (!parent) return;
            const isOpen = parent.classList.toggle('open');
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    });
}

// Bind submenu toggles on load (main.js is loaded after sidebar injection)
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindSubmenuToggles);
else bindSubmenuToggles();

// If we are on a project page (path includes /projects/...), highlight the matching nav-link
function highlightCurrentProjectLink(){
    const path = window.location.pathname;
    // Try to match by filename (e.g., /projects/trains.html)
    const filename = path.substring(path.lastIndexOf('/') + 1);
    if (!filename) return;

    const matching = Array.from(document.querySelectorAll('.nav-menu a')).find(a => {
        const href = a.getAttribute('href') || '';
        return href.endsWith(filename) || href.includes(filename);
    });

    if (matching) {
        // clear other active states
        document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
        matching.classList.add('active');

        // open parent submenu if needed
        const parent = matching.closest('.has-submenu');
        if (parent) {
            parent.classList.add('open');
            const btn = parent.querySelector('.submenu-toggle');
            if (btn) btn.setAttribute('aria-expanded', 'true');
        }
    }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', highlightCurrentProjectLink);
else highlightCurrentProjectLink();
