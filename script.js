// Main interactive scripts for the author site
// Features: mobile menu, Amazon live viewer handling, smooth in-page links and small accessibility helpers

document.addEventListener('DOMContentLoaded', () => {
  initMenuToggle();
  initAmazonViewer();
  initSmoothScroll();
  initGlobalEscapeHandlers();
});

function initMenuToggle(){
  const btn = document.getElementById('menuBtn');
  const mobileNav = document.getElementById('mobileNav');
  if(!btn || !mobileNav) return;

  btn.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('show');
    btn.setAttribute('aria-expanded', String(isOpen));
    mobileNav.setAttribute('aria-hidden', String(!isOpen));
    if(isOpen){
      // move focus into the menu for keyboard users
      const firstLink = mobileNav.querySelector('a');
      firstLink && firstLink.focus();
    } else {
      btn.focus();
    }
  });

  // Close mobile nav on outside click
  document.addEventListener('click', (ev) => {
    if(!mobileNav.classList.contains('show')) return;
    if(mobileNav.contains(ev.target) || btn.contains(ev.target)) return;
    mobileNav.classList.remove('show');
    mobileNav.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
  });
}

// Amazon viewer logic
function initAmazonViewer(){
  const frame = document.getElementById('amazonFrame');
  const viewerOpenLink = document.getElementById('viewerOpenLink');
  const iframeFallback = document.getElementById('iframeFallback');
  const fallbackLink = document.getElementById('fallbackLink');
  const viewerTitle = document.getElementById('viewerTitle');

  // Attach click handlers to any primary book buttons that do not already use inline handlers
  document.querySelectorAll('.bookRow .btnPrimary').forEach(btn => {
    // avoid double-binding if inline onclick exists
    if(btn.getAttribute('data-bound')) return;
    btn.setAttribute('data-bound', '1');
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      openAmazon(btn);
    });
  });

  // Keep a reference to the fallback timer so we can cancel it on load
  let fallbackTimer = null;

  // Expose a global openAmazon for compatibility with inline attributes
  window.openAmazon = function(button){
    try{
      const article = (button instanceof Element) ? button.closest('.bookRow') : null;
      if(!article) return;
      const url = article.getAttribute('data-amazon-url');
      if(!url) return;

      viewerTitle.textContent = 'Viewing: ' + (article.querySelector('h2')?.textContent || 'Amazon');
      viewerOpenLink.href = url;
      fallbackLink.href = url;

      // hide fallback until we know if embedding failed
      iframeFallback.style.display = 'none';

      // reset src and try to set the iframe
      frame.removeAttribute('srcdoc');
      frame.src = url;
      frame.style.display = 'block';

      // set a short timer. if onload does not fire within this time, show fallback
      if(fallbackTimer) clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(() => {
        // likely blocked by X-Frame-Options or CSP
        showIframeFallback();
      }, 1400);

      // on successful load cancel fallback and ensure iframe is visible
      frame.onload = () => {
        if(fallbackTimer) clearTimeout(fallbackTimer);
        iframeFallback.style.display = 'none';
        frame.style.display = 'block';
        // focus the frame for keyboard users
        try{ frame.focus(); } catch(e){}
      };

      frame.onerror = () => {
        if(fallbackTimer) clearTimeout(fallbackTimer);
        showIframeFallback();
      };

      function showIframeFallback(){
        frame.style.display = 'none';
        iframeFallback.style.display = 'block';
      }

      // open in new tab link is already set above
    } catch (err){
      console.error('openAmazon error', err);
    }
  };
}

// Smooth scrolling for in-page links
function initSmoothScroll(){
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(ev){
      const href = this.getAttribute('href');
      // ignore links that are only '#'
      if(!href || href === '#' || href === '#0') return;
      const target = document.querySelector(href);
      if(target){
        ev.preventDefault();
        target.scrollIntoView({behavior:'smooth',block:'start'});
        // update the URL without adding history entries
        history.replaceState(null, '', href);
        // move focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({preventScroll:true});
      }
    });
  });
}

// Escape key closes mobile nav and dismisses any open fallback viewers
function initGlobalEscapeHandlers(){
  document.addEventListener('keydown', (ev) => {
    if(ev.key === 'Escape' || ev.key === 'Esc'){
      // close mobile nav
      const mobileNav = document.getElementById('mobileNav');
      const menuBtn = document.getElementById('menuBtn');
      if(mobileNav && mobileNav.classList.contains('show')){
        mobileNav.classList.remove('show');
        mobileNav.setAttribute('aria-hidden', 'true');
        menuBtn && menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn && menuBtn.focus();
      }

      // hide amazon iframe fallback if visible
      const iframeFallback = document.getElementById('iframeFallback');
      const amazonFrame = document.getElementById('amazonFrame');
      if(iframeFallback && iframeFallback.style.display === 'block'){
        iframeFallback.style.display = 'none';
        if(amazonFrame) amazonFrame.style.display = 'none';
      }
    }
  });
}

// Small helper in case pages use inline handlers that expect a global function
window.initSite = () => {
  // placeholder for any future initialisation hooks
};
