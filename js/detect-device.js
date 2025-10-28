(function(){
  function setBodyMode(){
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|iPhone|iPad|iPod|Windows Phone|Mobi/i.test(ua);
    const w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    if (isMobileUA || w <= 900) {
      document.body.classList.add('is-mobile'); document.body.classList.remove('is-desktop');
    } else {
      document.body.classList.add('is-desktop'); document.body.classList.remove('is-mobile');
    }
  }
  window.addEventListener('resize', setBodyMode);
  document.addEventListener('DOMContentLoaded', setBodyMode);
  setBodyMode();
})();
