<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.1/gsap.min.js"></script>

<script>
    document.addEventListener("DOMContentLoaded", function() {
        console.log('JS carregado!');
        const button = document.querySelector('.elementor-button-link');
        let lastPercentage = 0;  // Armazena a última posição do brilho
        const brilhoWidth = 15;  // Largura do brilho em porcentagem (15%)

        if (button) {
            // Usando mousemove para atualizar o brilho do after em tempo real
            button.addEventListener('mousemove', (e) => {
                const rect = button.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;  // Posição do mouse em relação ao botão
                const buttonWidth = rect.width;

                // Calcular a posição em porcentagem e centralizar o brilho
                let percentage = ((mouseX / buttonWidth) * 100) - (brilhoWidth / 2);

                // Ajuste de limites para garantir que o brilho não ultrapasse as bordas
                if (percentage < 0) {
                    percentage = 0;  // Impede o brilho de ultrapassar a borda esquerda
                }
                if (percentage > 100 - brilhoWidth) {
                    percentage = 100 - brilhoWidth;  // Impede o brilho de ultrapassar a borda direita
                }

                // Atualiza a variável CSS --left instantaneamente para centralizar o brilho
                button.style.setProperty('--left', `${percentage}%`);
                lastPercentage = percentage;  // Atualiza a última posição do brilho
            });

            // Quando o mouse sai do botão, mantém o brilho na última posição
            button.addEventListener('mouseleave', () => {
                // Mantém a última posição do brilho, mesmo após sair do botão
                button.style.setProperty('--left', `${lastPercentage}%`);
            });
        } else {
            console.log('Botão não encontrado!');
        }
    });
</script>
