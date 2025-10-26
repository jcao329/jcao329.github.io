(function(){
  // Minimal React-based sidebar to manage active state reliably across pages.
  // This file expects React and ReactDOM to be available as globals.
  const e = React.createElement;

  function Sidebar(){
    const [active, setActive] = React.useState(null);
    const [openSubmenu, setOpenSubmenu] = React.useState(false);

    React.useEffect(() => {
      // derive initial active: prefer pending-key, then URL hash, then project filename
      try {
        let initial = null;
        const pendingKey = sessionStorage.getItem('pending-key');
        if (pendingKey) {
          const [kind, val] = pendingKey.split(':');
          if (kind === 'section') initial = val;
          else if (kind === 'project') initial = val;
          sessionStorage.removeItem('pending-key');
        } else if (window.location.hash) {
          initial = window.location.hash.replace('#','');
        } else {
          // try clicked href
          const ph = sessionStorage.getItem('pending-clicked-href');
          if (ph) {
            const parts = ph.split('#');
            if (parts[1]) initial = parts[1];
            sessionStorage.removeItem('pending-clicked-href');
          }
          // finally, derive from current pathname (e.g., /thoughts.html, /about.html, /projects/trains.html)
          const path = window.location.pathname || '';
          const filename = path.substring(path.lastIndexOf('/') + 1);
          if (filename) {
            // map common filenames to section keys
            if (filename === 'index.html' || filename === '') initial = 'home';
            else if (filename === 'thoughts.html') initial = 'thoughts';
            else if (filename === 'about.html') initial = 'about';
            else if (filename.endsWith('.html')) initial = filename;
          }
        }

        if (initial) {
          setActive(initial);
          // auto-open submenu if the active item is a project or the side-projects section
          if (initial === 'side-projects' || initial.includes('trains') || initial.includes('froots') || initial === 'trains.html' || initial === 'froots.html') {
            setOpenSubmenu(true);
          }
        }
      } catch (e) {}
    }, []);

    function navigateTo(href, kind, val){
      try {
        if (kind && val) sessionStorage.setItem('pending-key', kind + ':' + val);
        sessionStorage.setItem('pending-clicked-href', href);
      } catch (e) {}
      window.location.assign(href);
    }

    return e('aside', {className: 'sidebar', id: 'sidebar'},
      e('div', {className:'sidebar-header'}, e('h1', null, "jess's corner"), e('p', null, 'come get comfortable')),
      e('ul', {className:'nav-menu'},
  e('li', null, e('a', {href: '/index.html', className: 'nav-link' + (active === 'home' ? ' active' : ''), onClick: (ev)=>{ ev.preventDefault(); setActive('home'); navigateTo('/index.html','section','home'); }}, 'home')),
  e('li', null, e('a', {href: '/thoughts.html', className: 'nav-link' + (active === 'thoughts' ? ' active' : ''), onClick: (ev)=>{ ev.preventDefault(); setActive('thoughts'); navigateTo('/thoughts.html','section','thoughts'); }}, 'substack')),
        e('li', {className: 'has-submenu'},
          e('div', {className: 'submenu-header'},
            e('a', {href: '/projects.html', className: 'nav-link' + (active === 'side-projects' ? ' active' : ''), 'data-page': 'side-projects', onClick: (ev)=>{ ev.preventDefault(); setActive('side-projects'); navigateTo('/projects.html','section','side-projects'); }}, 'side projects'),
            e('button', {className: 'submenu-toggle', 'courier-new': openSubmenu, onClick: (ev)=>{ ev.preventDefault(); setOpenSubmenu(s => !s); }}, 'currently working on:')
          ),
      openSubmenu && e('ul', {className: 'sub-menu'},
      e('li', null, e('a', {href: '/projects/trains.html', className: 'nav-link' + (active && (active.includes('trains') || active === 'trains.html') ? ' active' : ''), onClick: (ev)=>{ ev.preventDefault(); setActive('trains.html'); navigateTo('/projects/trains.html','project','trains.html'); }}, 'see train go')),
      e('li', null, e('a', {href: '/projects/froots.html', className: 'nav-link' + (active && (active.includes('froots') || active === 'froots.html') ? ' active' : ''), onClick: (ev)=>{ ev.preventDefault(); setActive('froots.html'); navigateTo('/projects/froots.html','project','froots.html'); }}, 'froots'))
          )
        ),
  e('li', null, e('a', {href: '/about.html', className: 'nav-link' + (active === 'about' ? ' active' : ''), onClick: (ev)=>{ ev.preventDefault(); setActive('about'); navigateTo('/about.html','section','about'); }}, 'about'))
      )
    );
  }

  // mount when DOM available
  function mount(){
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    try {
      ReactDOM.createRoot(container).render(React.createElement(Sidebar));
    } catch (e) {
      // older React versions fallback
      try { ReactDOM.render(React.createElement(Sidebar), container); } catch(e) {}
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

})();
