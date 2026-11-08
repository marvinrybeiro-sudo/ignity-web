<script>
    const darkBG = document.querySelectorAll(".dark");
    const bg = document.getElementById("bg");
    const darkScroll = window.innerHeight * 0.5;
    
    function darkMode(){
        darkBG.forEach(dark => {
            const darkTop = dark.getBoundingClientRect().top - darkScroll;
            const darkBottom = dark.getBoundingClientRect().bottom - darkScroll;
            
            if(darkTop < 10){
                bg.classList.add("cor");
            }
            else{
                bg.classList.remove("cor");
            }
            
            if(darkBottom < 0){
                bg.classList.remove("cor");
            }
            })
    }
    
    window.addEventListener("scroll", darkMode);
</script>