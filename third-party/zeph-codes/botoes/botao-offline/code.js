<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
<script>
(function () {
    $(() => {
        const _F1n = $(`.container-botao`);
        const _Z4q = $(`.botao .elementor-button`);
        let _H3v;

        _Z4q.each(function (_L2p) {
            const _S5x = _F1n.eq(_L2p);
            const _W9d = $(this);


        _W9d.on("mousemove", function (_K6y) {
            window.clearTimeout(_H3v);
            _W9d.addClass("ativo");
        
            const _P7b = _S5x[0].getBoundingClientRect();
            const _G8t = _K6y.clientX - _P7b.left;
            const _J1v = Math.min(Math.max(_G8t / _P7b.width, 0), 1);
        
            _S5x[0].style.setProperty("--R4h", _J1v.toFixed(2));
            _S5x[0].style.setProperty("--K9y", (1 - _J1v).toFixed(2));
            _S5x[0].style.setProperty("--dg2", (_J1v * 0.2).toFixed(2));
            _S5x[0].style.setProperty("--dg1", ((1 - _J1v) * 0.2).toFixed(2));
        
            const _E2m = _W9d[0].getBoundingClientRect();
            const _O5z = _K6y.clientX - _E2m.left;
            const _M4p = (_O5z / _E2m.width) * 100 - 100;
            _W9d[0].style.setProperty("--J7p", `${_M4p}%`);
        });

        _W9d.on("mouseleave", function () {
            _W9d.removeClass("ativo");
            _H3v = window.setTimeout(function () {
                _S5x[0].style.setProperty("--R4h", "1");
                _S5x[0].style.setProperty("--K9y", "0");
                _W9d[0].style.setProperty("--J7p", "10%");
                _S5x[0].style.setProperty("--dg2", "0.2");
                _S5x[0].style.setProperty("--dg1", "0");
            }, 1000);
        });
        });
    });
})();
</script>