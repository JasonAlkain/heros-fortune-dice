// Native details stays usable without JavaScript; add dismissal conveniences.
(function () {
    const menus = document.querySelectorAll('.site-menu');
    document.addEventListener('click', event => {
        menus.forEach(menu => {
            if (!menu.contains(event.target)) menu.open = false;
        });
    });
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        menus.forEach(menu => {
            if (!menu.open) return;
            menu.open = false;
            if (menu.contains(document.activeElement)) menu.querySelector('summary').focus();
        });
    });
})();
