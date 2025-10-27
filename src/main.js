// small helpers to reduce repetition
function onReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
}

const q = (sel, ctx=document) => ctx.querySelector(sel);
const qAll = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

const sections = () => qAll('.content-section');
const getNavLinks = () => qAll('.nav-link');

const sessionGet = (k) => { try { return sessionStorage.getItem(k); } catch(e) { return null; } };
const sessionSet = (k,v) => { try { sessionStorage.setItem(k,v); } catch(e) {} };
const sessionRemove = (k) => { try { sessionStorage.removeItem(k); } catch(e) {} };

function clearActiveLinks(){ getNavLinks().forEach(l => l.classList.remove('active')); }
function setActiveLink(link){ if (link) link.classList.add('active'); }

function activateSectionById(id){
    if (!id) return false;
    const target = q('#' + CSS.escape(id));
    if (!target) return false;
    sections().forEach(s => s.classList.remove('active'));
    target.classList.add('active');
    clearActiveLinks();

    // try to find matching nav-link by data-page
    const byData = getNavLinks().find(l => l.getAttribute('data-page') === id);
    if (byData) { setActiveLink(byData); return true; }

    // try by href match
    const anchors = qAll('.nav-menu a');
    const byHref = anchors.find(a => {
        const ah = a.getAttribute('href') || '';
        return ah.endsWith('#' + id) || ah.includes('#' + id) || ah === id;
    });
    if (byHref) { setActiveLink(byHref); return true; }

    const byInclude = anchors.find(a => {
        const ah = a.getAttribute('href') || '';
        return ah.includes(id) || id.includes(ah);
    });
    if (byInclude) { setActiveLink(byInclude); return true; }
    return true;
}

function resolvePending(){
    // priority: pending-clicked-href -> URL hash -> pending-index-hash -> pending-key (section/project)
    let fragment = '';
    const pendingHref = sessionGet('pending-clicked-href');
    if (pendingHref){
        const parts = pendingHref.split('#'); fragment = parts[1] || '';
        sessionRemove('pending-clicked-href');
    }
    if (!fragment) fragment = window.location.hash.replace('#','');
    if (!fragment){
        const pending = sessionGet('pending-index-hash');
        if (pending){ fragment = pending; sessionRemove('pending-index-hash'); try{ window.history.replaceState(null,'','#'+fragment);}catch(e){} }
    }

    // handle pending-key specially
    const pendingKey = sessionGet('pending-key');
    if (pendingKey){
        const [kind, value] = (pendingKey || '').split(':');
        if (kind === 'section' && value) { fragment = value; }
        else if (kind === 'project' && value){
            // try to activate an anchor matching the filename
            const anchors = qAll('.nav-menu a');
            const match = anchors.find(a => { const ah = a.getAttribute('href')||''; return ah.endsWith(value) || ah.includes(value); });
            if (match){ setActiveLink(match); sessionRemove('pending-key'); sessionRemove('pending-clicked-href'); return null; }
        }
        sessionRemove('pending-key');
    }
    return fragment || null;
}

// main activation on load
function handleInitialActivation(){
    const frag = resolvePending();
    if (!frag) return;
    activateSectionById(frag);
}

onReady(handleInitialActivation);

// delegated nav-link click handling (works with dynamically-rendered sidebar)
document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (!link) return;
    const pageId = link.getAttribute('data-page');
    const target = pageId && q('#' + CSS.escape(pageId));
    if (target){
        e.preventDefault();
        activateSectionById(pageId);
    }
    // otherwise allow navigation (e.g., to /index.html#thoughts)
});

// Chair navigation helper
function navigateToSectionOrPage(pageId){
    if (!pageId) return;
    const target = q('#' + CSS.escape(pageId));
    if (target){ activateSectionById(pageId); return; }
    let href = '/index.html';
    if (pageId === 'thoughts') href = '/thoughts.html';
    else if (pageId === 'about') href = '/about.html';
    else if (pageId === 'side-projects') href = '/projects.html';
    try{ sessionSet('pending-key','section:'+pageId); sessionSet('pending-clicked-href', href + (pageId?('#'+pageId):'')); }catch(e){}
    window.location.assign(href);
}

// bind chair click handlers
onReady(()=>{
    const chairs = qAll('.chair-item');
    chairs.forEach(chair => chair.addEventListener('click', ()=> navigateToSectionOrPage(chair.getAttribute('data-page'))));
});

// Sidebar toggle
onReady(()=>{
    const tgl = q('#toggleBtn');
    const side = q('#sidebar');
    const main = q('#mainContent');
    if (tgl && side && main){
        tgl.addEventListener('click', ()=>{
            side.classList.toggle('collapsed'); main.classList.toggle('expanded');
            tgl.textContent = side.classList.contains('collapsed') ? '☰' : '✕';
        });
    }
});

// submenu toggles
function bindSubmenuToggles(){
    qAll('.submenu-toggle').forEach(btn => btn.addEventListener('click', ()=>{
        const parent = btn.closest('.has-submenu'); if (!parent) return;
        const isOpen = parent.classList.toggle('open'); btn.setAttribute('aria-expanded', isOpen? 'true':'false');
    }));
}
onReady(bindSubmenuToggles);

// highlight project page links when on a project page
function highlightCurrentProjectLink(){
    const path = window.location.pathname || '';
    const filename = path.substring(path.lastIndexOf('/')+1);
    if (!filename) return;
    const anchors = qAll('.nav-menu a');
    const match = anchors.find(a => { const href = a.getAttribute('href')||''; return href.endsWith(filename) || href.includes(filename); });
    if (!match) return;
    anchors.forEach(a => a.classList.remove('active'));
    match.classList.add('active');
    const parent = match.closest('.has-submenu'); if (parent){ parent.classList.add('open'); const btn = parent.querySelector('.submenu-toggle'); if (btn) btn.setAttribute('aria-expanded','true'); }
}
onReady(highlightCurrentProjectLink);
