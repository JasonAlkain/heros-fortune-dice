// Apply before CSS paints, so a saved dark preference does not flash light.
(function () {
  const key = 'heros-fortune-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {}
  function apply() {
    const dark = preference ? preference === 'dark' : system.matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.setAttribute('content', dark ? '#171c19' : '#f4f1e9');
    const button = document.getElementById('themeToggle');
    if (button) {
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    }
  }
  apply();
  system.addEventListener('change', () => { if (!preference) apply(); });
  document.addEventListener('DOMContentLoaded', () => {
    apply();
    const button = document.getElementById('themeToggle');
    if (!button) return;
    button.addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch {}
      apply();
    });
  });
})();
