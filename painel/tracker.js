// Rastreador do Meu Assistente IA
// Cole este codigo em todas as paginas do site (antes do </body>).
// Ele envia: visualizacoes de pagina, cliques em botoes/links e cadastros.
(function () {
  // CONFIGURE: endereço do painel (onde o server.js esta rodando)
  var ENDPOINT = window.TRACK_ENDPOINT || 'https://SEU-SERVIDOR/api/track';

  function enviar(dados) {
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  // 1) registra a pagina carregada
  enviar({ tipo: 'pagina', pagina: location.pathname });

  // 2) registra cliques em botoes e links
  document.addEventListener('click', function (ev) {
    var alvo = ev.target.closest('a, button, [role="button"], .btn');
    if (alvo) {
      enviar({
        tipo: 'clique',
        pagina: location.pathname,
        elemento: (alvo.innerText || alvo.id || alvo.className || 'elemento').toString().slice(0, 60)
      });
    }
  }, true);

  // 3) funcao para registrar cadastro (chame no seu codigo de cadastro)
  window.registrarCadastro = function (email) {
    enviar({ tipo: 'cadastro', pagina: location.pathname, email: email || '' });
  };

  // 4) funcao para registrar pagamento
  window.registrarPagamento = function (email, plano) {
    enviar({ tipo: 'pagamento', pagina: location.pathname, email: email || '', elemento: plano || '' });
  };
})();
