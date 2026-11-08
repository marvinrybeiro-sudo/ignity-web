<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script><script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script><script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/SplitText.min.js"></script>


<script>
//animacao de entrada com barra de cor
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const SELECTOR = '.efeito-titulo .elementor-heading-title, .efeito-titulo-2 .elementor-heading-title';

  function getColor(h2) {
    if (h2.closest('.efeito-titulo-2')) return '#FFBEF9';
    if (h2.closest('.efeito-titulo')) return '#BD95FF';
    return '#BD95FF';
  }

  const debounce = (fn, wait=150) => {
    let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); };
  };

  function buildFor(h2){
    if (h2.__st)    { h2.__st.kill(); h2.__st = null; }
    if (h2.__split) { h2.__split.revert(); h2.__split = null; }

    const split = new SplitText(h2, { type: 'lines', linesClass: '__reveal-line' });
    h2.__split = split;

    const color = getColor(h2);
    const cs = getComputedStyle(h2);
    const ta = cs.textAlign;
    const lh = cs.lineHeight;

    split.lines.forEach(line => {
      const base = {
        position: 'relative',
        overflow: 'hidden',
        clipPath: 'inset(0% 100% 0% 0%)',
        ...(lh !== 'normal' ? { lineHeight: lh } : {})
      };

      if (ta === 'center') {
        gsap.set(line, {
          ...base,
          display: 'inline-block',
          marginLeft: 'auto',
          marginRight: 'auto',
          verticalAlign: 'top'  
        });
      } else {
        gsap.set(line, {
          ...base,
          display: 'block',
          width: 'fit-content'
        });
      }

      const bar = document.createElement('em');
      line.appendChild(bar);
      gsap.set(bar, {
        position: 'absolute',
        zIndex: 2,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: color,
        pointerEvents: 'none'
      });
    });

    const bars = split.lines.map(l => l.querySelector('em'));

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: h2,
        start: 'top 80%',
        toggleActions: "play none none none",
      }
    });

    tl.to(split.lines, {
      clipPath: 'inset(0% 0% 0% 0%)',
      ease: 'power3.out',
      duration: 0.5,
      stagger: 0.2
    }, 0);

    tl.to(bars, {
      left: '100%',
      ease: 'power3.out',
      duration: 0.5,
      stagger: 0.2
    }, 0.5);

    gsap.set(h2, { opacity: 1 });
    h2.__st = tl;
  }

  function initAll(){
    document.querySelectorAll(SELECTOR).forEach(buildFor);
  }

  const rebuild = debounce(() => {
    initAll();
    ScrollTrigger.refresh();
  }, 200);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
</script>

<style>
  .efeito-titulo .elementor-heading-title,
  .efeito-titulo-2 .elementor-heading-title{
    opacity: 1;
  }
</style>