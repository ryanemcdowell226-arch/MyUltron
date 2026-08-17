// public/ui/init.js
// Convenience initializer that injects the logo and a sample resizable window into the page when loaded.
(function(){
  function inject(){
    // inject CSS
    const cssFiles = ['/ui/logo.css','/ui/resizable-window.css'];
    cssFiles.forEach(href=>{ if (!document.querySelector(`link[href="${href}"]`)){ const l=document.createElement('link'); l.rel='stylesheet'; l.href=href; document.head.appendChild(l); } });

    // inject logo
    if (!document.getElementById('ultron-logo')){
      fetch('/ui/logo.html').then(r=>r.text()).then(html=>{ const div=document.createElement('div'); div.innerHTML = html; document.body.appendChild(div.firstElementChild); });
    }

    // inject sample window
    if (!document.querySelector('.resizable-window')){
      fetch('/ui/resizable-window.html').then(r=>r.text()).then(html=>{ const div=document.createElement('div'); div.innerHTML = html; document.body.appendChild(div.firstElementChild); });
    }
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') inject(); else window.addEventListener('DOMContentLoaded', inject);
})();
