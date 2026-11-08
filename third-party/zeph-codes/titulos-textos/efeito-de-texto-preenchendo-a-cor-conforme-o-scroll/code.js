<!-- Carregar GSAP e ScrollTrigger -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

<script>
    document.addEventListener("DOMContentLoaded", function() {
        // Registrando o plugin ScrollTrigger do GSAP
        gsap.registerPlugin(ScrollTrigger);

        // Função para configurar as animações de scroll
        function setupScrollAnimations() {
            // Selecionando todos os elementos com a classe .txtdestaque
            const elements = document.querySelectorAll(".txtdestaque");

            elements.forEach((element) => {
                // Dividindo o texto em palavras manualmente
                const words = element.textContent.trim().split(/\s+/).map(word => `<span class="word">${word}</span>`).join(' ');
                element.innerHTML = words;

                // Selecionar todas as palavras
                const wordElements = element.querySelectorAll('.word');

                // Configurando a animação com GSAP e ScrollTrigger
                gsap.fromTo(wordElements, {
                    opacity: 0,
                    y: 20 // Deslocamento inicial para efeito de entrada
                }, {
                    opacity: 1,
                    y: 0, // Volta à posição original
                    duration: isMobile() ? 4 : 2, // Duração maior em dispositivos móveis
                    stagger: 0.2, // Intervalo entre o início das animações das palavras
                    scrollTrigger: {
                        trigger: element,
                        start: "top 85%", // Início da animação quando o topo do elemento está a 50% do topo da tela
                        end: "bottom 50%", // Fim da animação quando o final do elemento está a 20% do topo da tela
                        scrub: true
                    }
                });
            });
        }

        // Função para verificar se é um dispositivo móvel usando um media query
        function isMobile() {
            return window.matchMedia("(max-width: 767px)").matches;
        }

        // Chama a função para configurar as animações de scroll
        setupScrollAnimations();
    });
</script>