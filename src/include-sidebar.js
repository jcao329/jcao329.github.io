(function(){
    // Helper: try multiple relative paths to find a file
        async function findPath(filename){
        const candidates = [
            `/${filename}`,
            `./${filename}`,
            `../${filename}`,
            `../../${filename}`
            ];
            for (const p of candidates){
                try {
                    const res = await fetch(p, {cache: 'no-store'});
                    if (res.ok) return p;
                } catch(e) {
                    // ignore and try next
                }
            }
            return null;
        }

        // Adjust nav link hrefs so they point to index.html when the current page is in a subfolder
        function adjustNavLinks(container){
            const anchors = container.querySelectorAll('.nav-menu a');
            // If current page is inside one or more folders, use ../ repeated accordingly
            const depth = window.location.pathname.split('/').filter(Boolean).length - 1; // depth=0 for root
            const prefix = depth > 0 ? '../'.repeat(depth) : '';
            anchors.forEach(a => {
                    const href = a.getAttribute('href');
                if (!href) return;

                    // convert index.html#... or /index.html#... to proper relative path
                if (href.startsWith('index.html') || href.startsWith('/index.html')){
                    const cleaned = href.replace(/^\//, '');
                    const newHref = prefix + cleaned;
                    a.setAttribute('href', newHref);
                }
            });
        }

        // Bind click handlers to ensure navigation works from nested pages
        function bindNavClick(container){
            const anchors = container.querySelectorAll('.nav-menu a');
            anchors.forEach(a => {
                    a.addEventListener('click', (e) => {
                        const href = a.getAttribute('href');
                        if (!href) return;

                        // If the href points to index.html and we're not on index, persist the fragment
                        // so the index page can highlight the requested section after navigation.
                        const onIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.split('/').filter(Boolean).length <= 1;
                        if (href.includes('index.html') && !onIndex) {
                            e.preventDefault();
                            try {
                                const frag = href.split('#')[1] || '';
                                if (frag) sessionStorage.setItem('pending-index-hash', frag);
                                // also remember the full clicked href to aid matching on the index page
                                sessionStorage.setItem('pending-clicked-href', href);
                                // store a canonical key: section:<name> for index fragments
                                if (frag) sessionStorage.setItem('pending-key', 'section:' + frag);
                                else sessionStorage.setItem('pending-key', 'section:home');
                            } catch (err) {
                                // ignore storage errors
                            }
                            console.log('include-sidebar: navigating to', href);
                            // Use location.assign to navigate relative to current location
                            window.location.assign(href);
                        }
                        // otherwise, allow the default click (including in-page interception by main.js)
                    });
                });
        }

        async function loadSidebar(){
            const container = document.getElementById('sidebar-container');
            if (!container) return;

            // Start a delayed loading indicator: only show if initialization takes >1s
            let pendingTimer = setTimeout(() => {
                try { document.documentElement.classList.add('loading-pending'); } catch(e) {}
            }, 1000);

            // Centralized ready marker: clear pending timer, remove pending class and add js-ready
            function markReady(){
                clearTimeout(pendingTimer);
                try { document.documentElement.classList.remove('loading-pending'); } catch(e) {}
                try { document.documentElement.classList.add('js-ready'); } catch(e) {}
            }

            let sidebarPath = await findPath('sidebar.html');
            if (!sidebarPath) {
                console.warn('sidebar.html not found at expected locations');
                // insert a minimal fallback sidebar with absolute links to index
                container.innerHTML = `
                    <aside class="sidebar" id="sidebar">
                        <div class="sidebar-header"><h1>jess's corner</h1><p>come get comfortable</p></div>
                        <ul class="nav-menu">
                            <li><a href="index.html#home" class="nav-link" data-page="home">home</a></li>
                            <li><a href="index.html#thoughts" class="nav-link" data-page="thoughts">substack</a></li>
                            <li><a href="index.html#side-projects" class="nav-link" data-page="side-projects">side projects</a></li>
                            <li><a href="index.html#about" class="nav-link" data-page="about">about me</a></li>
                        </ul>
                    </aside>
                `;

                // adjust links so they point back to the site's index from nested pages
                adjustNavLinks(container);
                // bind click handlers so navigation from nested pages persists the desired fragment
                bindNavClick(container);

                // ensure toggle button exists
                if (!document.getElementById('toggleBtn')){
                    const btn = document.createElement('button');
                    btn.id = 'toggleBtn';
                    btn.className = 'toggle-btn';
                    btn.textContent = '☰';
                    document.body.appendChild(btn);
                }

                // still try to load main.js then return
                let mainPath = await findPath('src/main.js');
                if (mainPath) {
                    // load React and our React sidebar, then load main.js
                    const sidebarReactPath = await findPath('src/sidebar.react.js');
                    const loadReactAndSidebar = () => new Promise((resolve) => {
                        // load React
                        const r = document.createElement('script');
                        r.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
                        r.onload = () => {
                            const rd = document.createElement('script');
                            rd.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
                            rd.onload = () => {
                                if (sidebarReactPath) {
                                    const sr = document.createElement('script');
                                    sr.src = sidebarReactPath;
                                    sr.onload = () => resolve();
                                    sr.onerror = () => resolve();
                                    document.body.appendChild(sr);
                                } else {
                                    resolve();
                                }
                            }
                            rd.onerror = () => resolve();
                            document.body.appendChild(rd);
                        };
                        r.onerror = () => resolve();
                        document.body.appendChild(r);
                    });

                    // load React & sidebar then main
                    await loadReactAndSidebar();

                    const s = document.createElement('script');
                    s.src = mainPath;
                    let settled = false;
                    const onceReady = () => { if (settled) return; settled = true; markReady(); };
                    s.onload = onceReady;
                    s.onerror = () => { console.debug('include-sidebar failed to load main.js', mainPath); onceReady(); };
                    setTimeout(onceReady, 2000);
                    document.body.appendChild(s);
                } else {
                    console.debug('src/main.js not found');
                    markReady();
                }
                return;
            }
            // loaded sidebar from: " + sidebarPath
            const html = await fetch(sidebarPath, {cache: 'no-store'}).then(r => r.text());
            container.innerHTML = html;

            // adjust links so they point back to the site's index from nested pages
            adjustNavLinks(container);
            // bind click handlers so navigation from nested pages persists the desired fragment
            bindNavClick(container);

        // ensure toggle button exists
        if (!document.getElementById('toggleBtn')){
            const btn = document.createElement('button');
            btn.id = 'toggleBtn';
            btn.className = 'toggle-btn';
            btn.textContent = '☰';
            document.body.appendChild(btn);
        }

        // load main.js to wire up behavior
        let mainPath;
        try { mainPath = await findPath('src/main.js'); } catch { mainPath = null; }
            if (mainPath) {
                const sidebarReactPath = await findPath('src/sidebar.react.js');
                const loadReactAndSidebar = () => new Promise((resolve) => {
                    const r = document.createElement('script');
                        r.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
                        r.onload = () => {
                            const rd = document.createElement('script');
                            rd.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
                            rd.onload = () => {
                                if (sidebarReactPath) {
                                    const sr = document.createElement('script');
                                    sr.src = sidebarReactPath;
                                    sr.onload = () => resolve();
                                    sr.onerror = () => resolve();
                                    document.body.appendChild(sr);
                                } else resolve();
                            };
                            rd.onerror = () => resolve();
                            document.body.appendChild(rd);
                        };
                        r.onerror = () => resolve();
                        document.body.appendChild(r);
                });
                    // load React & sidebar then main
                await loadReactAndSidebar();

                const s = document.createElement('script');
                s.src = mainPath;
                let settled = false;
                const onceReady = () => { if (settled) return; settled = true; markReady(); };
                s.onload = onceReady;
                s.onerror = () => { console.debug('include-sidebar failed to load main.js', mainPath); onceReady(); };
                setTimeout(onceReady, 2000);
                document.body.appendChild(s);
            } else {
                console.debug('src/main.js not found');
                markReady();
            }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSidebar);
    else loadSidebar();
})();