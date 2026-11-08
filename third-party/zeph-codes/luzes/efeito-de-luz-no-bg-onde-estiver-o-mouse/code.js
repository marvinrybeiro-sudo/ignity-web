<script> 
const cardsContainer = document.querySelector("#bgluz");
const cardsContents = document.querySelectorAll(".meio");

let isLargeScreen = window.matchMedia("(min-width: 1025px)").matches;

if (isLargeScreen) {
  let lastX = 0;
  let lastY = 0;

  cardsContainer.addEventListener("mousemove", (e) => {
    lastX = e.clientX;
    lastY = e.clientY;
    requestAnimationFrame(() => {
      cardsContents.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = lastX - rect.left;
        const y = lastY - rect.top;
        card.style.setProperty("--mouse-x", `${x}px`);
        card.style.setProperty("--mouse-y", `${y}px`);
      });
    });
  });
}
</script>