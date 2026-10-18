// Painel + Chat IA - Meu Assistente IA
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DB = path.join(__dirname, 'eventos.json');
const LEADS = path.join(__dirname, 'leads.json');
const ADMIN_SENHA = process.env.ADMIN_SENHA || 'dinho2026';
const XIAOMI_KEY = process.env.XIAOMI_API_KEY || '';
const XIAOMI_URL = (process.env.XIAOMI_BASE_URL || 'https://token-plan-sgp.xiaomimimo.com/v1').replace(/\/$/, '');
const MODELO = process.env.MIMO_MODEL || 'mimo-v2.6-pro';

function lerArq(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return []; } }
function gravarArq(f, l) { fs.writeFileSync(f, JSON.stringify(l, null, 2), 'utf8'); }

app.post('/api/track', (req, res) => {
  const e = req.body || {};
  const lista = lerArq(DB);
  lista.push({ tipo: e.tipo || 'clique', pagina: e.pagina || '', elemento: e.elemento || '', email: e.email || '', origem: e.origem || '', ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(), data: new Date().toISOString() });
  if (lista.length > 5000) lista.splice(0, lista.length - 5000);
  gravarArq(DB, lista);
  res.json({ ok: true });
});

app.post('/api/lead', (req, res) => {
  const e = req.body || {};
  const lista = lerArq(LEADS);
  lista.push({ nome: e.nome || '', email: e.email || '', telefone: e.telefone || '', mensagem: e.mensagem || '', ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(), data: new Date().toISOString() });
  gravarArq(LEADS, lista);
  res.json({ ok: true });
});

const SISTEMA = "Voce e a Axyia, atendente do 'Meu Assistente IA'. Responda em portugues do Brasil, de forma curta, amigavel e profissional. Nosso produto: atendente de IA que atende clientes no WhatsApp e redes sociais 24h. Planos: Basico R$49 (500 mensagens), Profissional R$99 (2.000 mensagens), Empresarial R$149 (5.000 mensagens), Assistente Completo R$249 (tudo + email, agenda, estoque). Se o visitante demonstrar interesse, peca nome, e-mail e telefone para enviar uma proposta. Nao invente precos ou promessas.";

app.post('/api/chat', async (req, res) => {
  const msg = (req.body && req.body.mensagem) || '';
  if (!msg) return res.json({ resposta: 'Como posso ajudar?' });
  if (!XIAOMI_KEY) return res.json({ resposta: 'Estou com dificuldade tecnica agora, mas posso te ajudar por WhatsApp.' });
  try {
    const r = await fetch(XIAOMI_URL + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + XIAOMI_KEY }, body: JSON.stringify({ model: MODELO, messages: [{ role: 'system', content: SISTEMA }, { role: 'user', content: msg }], max_tokens: 300 }) });
    const j = await r.json();
    const resposta = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || 'Pode repetir, por favor?';
    res.json({ resposta });
  } catch (e) { res.json({ resposta: 'Desculpe, tive um problema. Pode falar no WhatsApp?' }); }
});

function checar(req, res, next) {
  const senha = req.query.senha || req.headers['x-admin-senha'] || '';
  if (senha === ADMIN_SENHA) return next();
  res.status(401).json({ erro: 'senha incorreta' });
}
app.get('/api/eventos', checar, (req, res) => {
  const lista = lerArq(DB);
  res.json({ total: lista.length, cadastros: lista.filter(e => e.tipo === 'cadastro').length, cliques: lista.filter(e => e.tipo === 'clique').length, paginas: lista.filter(e => e.tipo === 'pagina').length, eventos: lista.slice(-300).reverse() });
});
app.get('/api/leads', checar, (req, res) => { res.json({ leads: lerArq(LEADS).slice(-200).reverse() }); });

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/tracker.js', (req, res) => { res.type('application/javascript'); res.sendFile(path.join(__dirname, 'tracker.js')); });
app.get('/chat.js', (req, res) => { res.type('application/javascript'); res.sendFile(path.join(__dirname, 'chat.js')); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('Painel+Chat rodando na porta', PORT));
