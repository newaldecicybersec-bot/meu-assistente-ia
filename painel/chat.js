// Chat de atendimento - Meu Assistente IA (Axyia)
(function () {
  var END = window.CHAT_ENDPOINT || 'https://painel.omeuassistenteia.com.br';
  var estilos = '#chatAxyia{position:fixed;bottom:22px;right:22px;z-index:99999;font-family:Segoe UI,Arial,sans-serif}'+
  '#chatAxyia .bolha{width:60px;height:60px;border-radius:50%;background:#d4af37;color:#111;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:28px;box-shadow:0 6px 20px rgba(0,0,0,.35)}'+
  '#chatAxyia .caixa{display:none;width:340px;max-width:90vw;height:460px;background:#0b1220;border:1px solid #1e3050;border-radius:16px;overflow:hidden;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.5)}'+
  '#chatAxyia.aberto .caixa{display:flex}'+
  '#chatAxyia .topo{background:#111c2e;padding:14px 16px;color:#fff;font-weight:700;display:flex;justify-content:space-between;align-items:center}'+
  '#chatAxyia .fechar{cursor:pointer;font-size:20px;color:#8fa3bd}'+
  '#chatAxyia .msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}'+
  '#chatAxyia .m{padding:10px 13px;border-radius:12px;font-size:14px;line-height:1.45;max-width:82%}'+
  '#chatAxyia .bot{background:#16233a;color:#e8eef7;align-self:flex-start;border-bottom-left-radius:3px}'+
  '#chatAxyia .user{background:#d4af37;color:#111;align-self:flex-end;border-bottom-right-radius:3px}'+
  '#chatAxyia .barra{display:flex;gap:8px;padding:11px;border-top:1px solid #1e3050;background:#111c2e}'+
  '#chatAxyia input{flex:1;padding:11px;border-radius:9px;border:1px solid #243a5c;background:#0b1220;color:#fff;font-size:14px;outline:none}'+
  '#chatAxyia button.env{background:#d4af37;border:none;color:#111;font-weight:700;border-radius:9px;padding:0 16px;cursor:pointer}';
  var s = document.createElement('style'); s.innerHTML = estilos; document.head.appendChild(s);

  var w = document.createElement('div'); w.id = 'chatAxyia';
  w.innerHTML = '<div class="caixa"><div class="topo"><span>Axyia - Atendente</span><span class="fechar" onclick="document.getElementById(\'chatAxyia\').classList.remove(\'aberto\')">&times;</span></div>'+
    '<div class="msgs" id="chatMsgs"><div class="m bot">Ola! Sou a Axyia, do Meu Assistente IA. Como posso te ajudar hoje?</div></div>'+
    '<div class="barra"><input id="chatInput" placeholder="Escreva sua mensagem..."><button class="env" onclick="enviarChat()">Enviar</button></div></div>'+
    '<div class="bolha" onclick="document.getElementById(\'chatAxyia\').classList.toggle(\'aberto\')">💬</div>';
  document.body.appendChild(w);

  var etapa = 'conversa'; var dados = {};
  function addMsg(txt, quem) {
    var d = document.getElementById('chatMsgs');
    var m = document.createElement('div'); m.className = 'm ' + quem; m.textContent = txt;
    d.appendChild(m); d.scrollTop = d.scrollHeight;
  }
  window.enviarChat = function () {
    var i = document.getElementById('chatInput');
    var txt = i.value.trim(); if (!txt) return;
    addMsg(txt, 'user'); i.value = '';
    // fluxo de captura de lead
    if (etapa === 'pede_nome') { dados.nome = txt; etapa = 'pede_email'; addMsg('Obrigada! E o seu e-mail?', 'bot'); return; }
    if (etapa === 'pede_email') { dados.email = txt; etapa = 'pede_tel'; addMsg('Perfeito! E um telefone/WhatsApp para contato?', 'bot'); return; }
    if (etapa === 'pede_tel') {
      dados.telefone = txt;
      fetch(END + '/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) }).catch(function () {});
      etapa = 'conversa';
      addMsg('Pronto, ' + (dados.nome || '') + '! Registrei seus dados, nossa equipe entra em contato. Posso ajudar em mais alguma coisa?', 'bot');
      return;
    }
    // conversa normal com IA
    fetch(END + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensagem: txt }) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        addMsg(d.resposta || 'Pode repetir?', 'bot');
        // se a IA pediu contato, inicia a captura
        if (/e-mail|email|telefone|contato|proposta/i.test(d.resposta || '') && etapa === 'conversa') {
          etapa = 'pede_nome'; addMsg('Para eu te enviar, qual o seu nome?', 'bot');
        }
      })
      .catch(function () { addMsg('Desculpe, tive um problema. Pode falar no WhatsApp?', 'bot'); });
  };
  document.getElementById('chatInput').addEventListener('keyup', function (e) { if (e.key === 'Enter') window.enviarChat(); });
})();
