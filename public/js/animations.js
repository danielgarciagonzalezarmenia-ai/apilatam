/* AppForge – scroll reveal + mouse-follow glow */
(function () {
  /* Scroll reveal: IntersectionObserver adds .visible to .reveal elements */
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });

  /* Mouse-follow glow: updates --mx / --my CSS custom properties */
  document.addEventListener('mousemove', function (e) {
    document.body.style.setProperty('--mx', e.clientX + 'px');
    document.body.style.setProperty('--my', e.clientY + 'px');
  });
})();
