<script>
(function () {
  function onlyDigits(v){ return (v || "").replace(/\D/g, ""); }

  function formatBRPhone(digits) {
    digits = onlyDigits(digits);

    // Remove 55 se vier com DDI
    if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);

    digits = digits.slice(0, 11);

    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  }

  function init(){
    const input = document.querySelector('input[name="form_fields[telefone]"]');
    if (!input) return;

    // Importante: não usar type="tel" pra não ativar a validação chata do Elementor
    input.setAttribute("type", "text");
    input.setAttribute("inputmode", "numeric");
    input.setAttribute("autocomplete", "tel");
    input.setAttribute("maxlength", "15");
    input.setAttribute("placeholder", "Telefone / WhatsApp");

    const form = input.closest("form");

    function forceFormat(){
      input.value = formatBRPhone(input.value);
    }

    function digitsOk(){
      const d = onlyDigits(input.value);
      return d.length === 10 || d.length === 11;
    }

    input.addEventListener("input", forceFormat);
    input.addEventListener("blur", forceFormat);

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text");
      input.value = formatBRPhone(text);
    });

    if (form && !form.__phoneLock) {
      form.__phoneLock = true;

      form.addEventListener("submit", (e) => {
        forceFormat();
        if (!digitsOk()) {
          e.preventDefault();
          e.stopPropagation();
          input.focus();
        }
      }, true);
    }
  }

  const obs = new MutationObserver(init);
  obs.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("DOMContentLoaded", init);
})();
</script>