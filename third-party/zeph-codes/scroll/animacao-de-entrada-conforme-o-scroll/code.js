<script>
  const elementos = document.querySelectorAll('.scroll-left, .scroll-right, .scroll-bottom, .scroll-top');
  const posicaoScroll = window.innerHeight * 0.5;

  function fadeScroll(){
    elementos.forEach((el) => {
      const elementoTop = el.getBoundingClientRect().top - posicaoScroll;
      if (elementoTop < 320) {
        el.classList.add('ativo');
      } else {
        el.classList.remove('ativo');
      }
    });
  }

  window.addEventListener('scroll', fadeScroll, { passive: true });
  window.addEventListener('resize', fadeScroll);
  document.addEventListener('DOMContentLoaded', fadeScroll);
</script>