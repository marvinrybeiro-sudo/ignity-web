<script>
  document.addEventListener("DOMContentLoaded", function () {
      
      
    // Frases que vão entrar no lugar do texto
    const titles = ["amazing", "new", "wonderful", "beautiful", "smart"];
    
    
    const DURATION = 2000; // tempo entre trocas (ms)
    const ANIM_TIME = 300; // tempo da transição (ms) tem que bater com o CSS

    const spans = document.querySelectorAll(
      ".elementor-heading-title .textomudando"
    );

    if (!spans.length) return;

    spans.forEach(function (span) {
      let index = 0;
      span.textContent = titles[index];

      span.classList.add("entrando");

      setInterval(function () {
        // fase de saída
        span.classList.remove("entrando");
        span.classList.add("saindo");

        setTimeout(function () {
          // troca o texto quando já sumiu
          index = (index + 1) % titles.length;
          span.textContent = titles[index];

          // entra de novo
          span.classList.remove("saindo");
          span.classList.add("entrando");
        }, ANIM_TIME);
      }, DURATION);
    });
  });
</script>
