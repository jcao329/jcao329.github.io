const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.content-section');
const toggleBtn = document.getElementById('toggleBtn');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const chairItems = document.querySelectorAll('.chair-item');

// Navigation functionality
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        const pageId = link.getAttribute('data-page');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(pageId).classList.add('active');
    });
});

// Chair navigation
chairItems.forEach(chair => {
    chair.addEventListener('click', () => {
        const pageId = chair.getAttribute('data-page');
        
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(pageId).classList.add('active');
        
        // Update sidebar active state
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
    });
});

// Sidebar toggle functionality
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
```

Now you have three separate files! Just make sure they're all in the same folder:
```
