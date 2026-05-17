// Theme toggle: dark / light / system
(function(){
  function getStoredTheme(){ return localStorage.getItem('iv-theme') || 'system'; }
  function applyTheme(theme){
    const html = document.documentElement;
    html.classList.remove('theme-dark','theme-light');
    if(theme === 'dark') html.classList.add('theme-dark');
    else if(theme === 'light') html.classList.add('theme-light');
    else {
      // System default
      if(window.matchMedia('(prefers-color-scheme: light)').matches) html.classList.add('theme-light');
      else html.classList.add('theme-dark');
    }
  }
  function setTheme(theme){
    localStorage.setItem('iv-theme', theme);
    applyTheme(theme);
    // Update toggle button if exists
    const btn = document.getElementById('themeToggle');
    if(btn) btn.textContent = {dark:'🌙',light:'☀️',system:'💻'}[theme] || '💻';
  }
  function cycleTheme(){
    const current = getStoredTheme();
    const next = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
    setTheme(next);
  }
  // Apply on load
  applyTheme(getStoredTheme());
  // Update button icon on DOM ready
  document.addEventListener('DOMContentLoaded',function(){
    const btn=document.getElementById('themeToggle');
    if(btn) btn.textContent={dark:'🌙',light:'☀️',system:'💻'}[getStoredTheme()]||'💻';
  });
  // Expose globally
  window.cycleTheme = cycleTheme;
  window.setTheme = setTheme;
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if(getStoredTheme() === 'system') applyTheme('system');
  });
})();
