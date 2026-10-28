import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "Meu Assistente IA <noreply@omeuassistenteia.com.br>";

// guarda codigos temporariamente (em producao usar banco/redis)
const codigos = new Map();

function gerarCodigo(){ return String(Math.floor(100000 + Math.random()*900000)); }

// envia codigo de confirmacao
app.post("/api/enviar-codigo", async (req, res) => {
  const { email } = req.body || {};
  if(!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){
    return res.status(400).json({ ok:false, erro:"E-mail invalido" });
  }
  const codigo = gerarCodigo();
  codigos.set(email, { codigo, criado: Date.now() });
  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Confirme seu e-mail — Meu Assistente IA",
      html: `<div style="margin:0;padding:0;background:#0a0e16;font-family:Segoe UI,Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#0e141f">
  <div style="background:linear-gradient(135deg,#141c2e,#0e141f);padding:30px 40px;text-align:center">
    <img src="https://omeuassistenteia.com.br/logo_axia_email.png" alt="Meu Assistente IA" width="72" height="72" style="border-radius:16px">
    <div style="margin-top:16px;font-size:24px;font-weight:800;color:#eef3f9">Meu <span style="color:#f4c15a">Assistente IA</span></div>
    <div style="color:#86b3c9;font-size:13px;letter-spacing:1px;margin-top:4px">ATENDIMENTO INTELIGENTE &middot; 24 HORAS</div>
  </div>
  <div style="padding:44px 40px">
    <h1 style="font-size:30px;line-height:1.25;color:#eef3f9;font-weight:800;margin:0 0 18px">Estamos felizes por ter voce aqui!</h1>
    <p style="font-size:17px;line-height:1.8;color:#aab6c2;margin:0 0 30px">Sua conta esta quase pronta. Confirme seu e-mail abaixo e libere a inteligencia artificial que vai atender seus clientes em todos os canais, 24 horas por dia.</p>
    <div style="background:rgba(244,193,90,.10);border:1px solid rgba(244,193,90,.35);border-radius:14px;padding:28px;text-align:center;margin:0 0 32px">
      <div style="font-size:13px;color:#f4c15a;letter-spacing:3px;margin-bottom:12px">SEU CODIGO DE CONFIRMACAO</div>
      <div style="font-size:44px;letter-spacing:14px;font-weight:800;color:#f4c15a">${codigo}</div>
    </div>
    <div style="margin:0 0 32px">
      <div style="display:flex;align-items:flex-start;margin-bottom:18px"><span style="color:#2fe0c4;font-size:20px;margin-right:14px">&#10003;</span><div style="color:#cdd9e8;font-size:16px;line-height:1.6">Atendimento em <strong style="color:#eef3f9">todos os canais</strong>: WhatsApp, Instagram, Facebook, Telegram e mais.</div></div>
      <div style="display:flex;align-items:flex-start;margin-bottom:18px"><span style="color:#2fe0c4;font-size:20px;margin-right:14px">&#10003;</span><div style="color:#cdd9e8;font-size:16px;line-height:1.6">Resposta em segundos, <strong style="color:#eef3f9">24 horas por dia</strong>, sem perder nenhum cliente.</div></div>
      <div style="display:flex;align-items:flex-start;margin-bottom:18px"><span style="color:#2fe0c4;font-size:20px;margin-right:14px">&#10003;</span><div style="color:#cdd9e8;font-size:16px;line-height:1.6">Linguagem humana e <strong style="color:#eef3f9">teste gratis por 7 dias</strong>, sem fidelidade.</div></div>
    </div>
    <div style="text-align:center;margin:0 0 12px">
      <a href="https://omeuassistenteia.com.br/confirmar.html" style="display:inline-block;background:linear-gradient(120deg,#f4c15a,#e8a93a);color:#241700;font-size:17px;font-weight:700;padding:16px 42px;border-radius:12px;text-decoration:none">Confirmar meu e-mail</a>
    </div>
    <p style="color:#7d97a8;font-size:13px;line-height:1.7;text-align:center;margin:18px 0 0">Este codigo expira em <strong style="color:#c3ccd6">15 minutos</strong>. Se voce nao fez este cadastro, pode ignorar este e-mail com seguranca.</p>
  </div>
  <div style="background:#0a0e16;padding:28px 40px;text-align:center;border-top:1px solid rgba(255,255,255,.06)">
    <div style="color:#6b7783;font-size:12px;line-height:2">
      Meu Assistente IA &middot; Atendimento inteligente em todos os canais<br>
      <a href="https://omeuassistenteia.com.br" style="color:#86b3c9;text-decoration:none">omeuassistenteia.com.br</a> &middot; 
      <a href="https://omeuassistenteia.com.br/politica-de-privacidade.html" style="color:#86b3c9;text-decoration:none">Privacidade</a> &middot; 
      <a href="https://omeuassistenteia.com.br/fale-conosco.html" style="color:#86b3c9;text-decoration:none">Contato</a><br><br>
      Voce recebeu este e-mail porque se cadastrou no Meu Assistente IA.
    </div>
  </div>
</div>
</div>`
    });
    res.json({ ok:true });
  } catch(e){
    console.error(e);
    res.status(500).json({ ok:false, erro:"Falha ao enviar e-mail" });
  }
});

// confere o codigo
app.post("/api/confirmar-codigo", (req, res) => {
  const { email, codigo } = req.body || {};
  const reg = codigos.get(email);
  if(!reg) return res.status(400).json({ ok:false, erro:"Nenhum codigo enviado" });
  const expirado = Date.now() - reg.criado > 15*60*1000;
  if(expirado){ codigos.delete(email); return res.status(400).json({ ok:false, erro:"Codigo expirado" }); }
  if(reg.codigo !== String(codigo)) return res.status(400).json({ ok:false, erro:"Codigo incorreto" });
  codigos.delete(email);
  res.json({ ok:true });
});

app.get("/", (_req,res)=> res.json({ servico:"Meu Assistente IA", status:"ok" }));

const PORT = process.env.PORT || 3000;

// ---------- GOOGLE OAUTH ----------
const GOOGLE_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE = process.env.BASE_URL || "https://backend-agente-x8k2.onrender.com";
const SITE = process.env.SITE_URL || "https://omeuassistenteia.com.br";

app.get("/auth/google", (_req, res) => {
  const params = new URLSearchParams({
    client_id: GOOGLE_ID,
    redirect_uri: `${BASE}/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account"
  });
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + params.toString());
});

app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect(SITE + "/criar-conta.html?erro=sem_codigo");
  try {
    const tok = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_ID,
        client_secret: GOOGLE_SECRET,
        redirect_uri: `${BASE}/auth/google/callback`,
        grant_type: "authorization_code"
      })
    }).then(r => r.json());
    if (!tok.access_token) return res.redirect(SITE + "/criar-conta.html?erro=token");
    const u = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: "Bearer " + tok.access_token }
    }).then(r => r.json());
    // usuario autenticado via Google -> segue para o cadastro
    const q = new URLSearchParams({ email: u.email || "", nome: u.name || "", google: "1" });
    res.redirect(SITE + "/cadastro-pro.html?" + q.toString());
  } catch (e) {
    console.error(e);
    res.redirect(SITE + "/criar-conta.html?erro=oauth");
  }
});


// ---------- FACEBOOK OAUTH ----------
const FB_ID = process.env.FACEBOOK_APP_ID;
const FB_SECRET = process.env.FACEBOOK_APP_SECRET;

app.get("/auth/facebook", (_req, res) => {
  const params = new URLSearchParams({
    client_id: FB_ID,
    redirect_uri: `${BASE}/auth/facebook/callback`,
    scope: "email,public_profile",
    response_type: "code"
  });
  res.redirect("https://www.facebook.com/v18.0/dialog/oauth?" + params.toString());
});

app.get("/auth/facebook/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect(SITE + "/criar-conta.html?erro=sem_codigo");
  try {
    const tok = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` + new URLSearchParams({
      client_id: FB_ID, redirect_uri: `${BASE}/auth/facebook/callback`,
      client_secret: FB_SECRET, code
    })).then(r => r.json());
    if (!tok.access_token) return res.redirect(SITE + "/criar-conta.html?erro=token");
    const u = await fetch("https://graph.facebook.com/me?fields=id,name,email&access_token=" + tok.access_token).then(r => r.json());
    const q = new URLSearchParams({ email: u.email || "", nome: u.name || "", facebook: "1" });
    res.redirect(SITE + "/cadastro-pro.html?" + q.toString());
  } catch (e) {
    console.error(e);
    res.redirect(SITE + "/criar-conta.html?erro=oauth");
  }
});


// ---------- GITHUB OAUTH ----------
const GH_ID = process.env.GITHUB_CLIENT_ID;
const GH_SECRET = process.env.GITHUB_CLIENT_SECRET;

app.get("/auth/github", (_req, res) => {
  const params = new URLSearchParams({
    client_id: GH_ID,
    redirect_uri: `${BASE}/auth/github/callback`,
    scope: "read:user user:email"
  });
  res.redirect("https://github.com/login/oauth/authorize?" + params.toString());
});

app.get("/auth/github/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect(SITE + "/criar-conta.html?erro=sem_codigo");
  try {
    const tok = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: GH_ID, client_secret: GH_SECRET, code, redirect_uri: `${BASE}/auth/github/callback` })
    }).then(r => r.json());
    if (!tok.access_token) return res.redirect(SITE + "/criar-conta.html?erro=token");
    const u = await fetch("https://api.github.com/user", {
      headers: { Authorization: "Bearer " + tok.access_token, "User-Agent": "meu-agente-ia" }
    }).then(r => r.json());
    const q = new URLSearchParams({ email: u.email || "", nome: u.name || u.login || "", github: "1" });
    res.redirect(SITE + "/cadastro-pro.html?" + q.toString());
  } catch (e) {
    console.error(e);
    res.redirect(SITE + "/criar-conta.html?erro=oauth");
  }
});


// ---------- LINKEDIN OAUTH ----------
const LI_ID = process.env.LINKEDIN_CLIENT_ID;
const LI_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

app.get("/auth/linkedin", (_req, res) => {
  const params = new URLSearchParams({
    client_id: LI_ID,
    redirect_uri: `${BASE}/auth/linkedin/callback`,
    scope: "openid profile email",
    response_type: "code"
  });
  res.redirect("https://www.linkedin.com/oauth/v2/authorization?" + params.toString());
});

app.get("/auth/linkedin/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect(SITE + "/criar-conta.html?erro=sem_codigo");
  try {
    const tok = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code", code,
        redirect_uri: `${BASE}/auth/linkedin/callback`,
        client_id: LI_ID, client_secret: LI_SECRET
      })
    }).then(r => r.json());
    if (!tok.access_token) return res.redirect(SITE + "/criar-conta.html?erro=token");
    const u = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: "Bearer " + tok.access_token }
    }).then(r => r.json());
    const q = new URLSearchParams({ email: u.email || "", nome: u.name || "", linkedin: "1" });
    res.redirect(SITE + "/cadastro-pro.html?" + q.toString());
  } catch (e) {
    console.error(e);
    res.redirect(SITE + "/criar-conta.html?erro=oauth");
  }
});


// ---------- MERCADO PAGO ----------
const MP_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_PUBLIC = process.env.MP_PUBLIC_KEY;

// cria preferencia de pagamento e devolve a URL do checkout
app.post("/api/criar-pagamento", async (req, res) => {
  const { plano, email, valor } = req.body || {};
  const itens = {
    basico:      { titulo: "Plano Basico - Meu Assistente IA",      valor: 29 },
    profissional:{ titulo: "Plano Profissional - Meu Assistente IA", valor: 59 },
    empresarial: { titulo: "Plano Empresarial - Meu Assistente IA", valor: 149 }
  };
  const item = itens[plano] || itens.basico;
  try {
    const pref = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { Authorization: "Bearer " + MP_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{ title: item.titulo, quantity: 1, unit_price: Number(valor) || item.valor, currency_id: "BRL" }],
        payer: { email: email || "" },
        back_urls: {
          success: SITE + "/painel.html",
          failure: SITE + "/pagamento.html",
          pending: SITE + "/painel.html"
        },
        auto_return: "approved",
        notification_url: BASE + "/api/webhook-mp"
      })
    }).then(r => r.json());
    if (!pref.init_point) return res.status(500).json({ ok:false, erro:"Falha ao criar pagamento", detalhe:pref });
    res.json({ ok:true, init_point: pref.init_point, public_key: MP_PUBLIC });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, erro:"Erro no pagamento" });
  }
});

// webhook do Mercado Pago (confirmaacao do pagamento)
app.post("/api/webhook-mp", (req, res) => {
  console.log("Webhook MP:", JSON.stringify(req.body));
  res.sendStatus(200);
});


// ===== Webhook do WhatsApp (Meta Cloud API) =====
const META_VERIFY_TOKEN = 'meuassistente_ia_2026';

// Verificacao do webhook (Meta envia GET na configuracao)
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === META_VERIFY_TOKEN) {
    console.log('Webhook WhatsApp VERIFICADO');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Recebimento de mensagens (Meta envia POST)
app.post('/webhook/whatsapp', (req, res) => {
  console.log('Webhook WhatsApp:', JSON.stringify(req.body));
  // TODO: encaminhar para o n8n / IA e responder
  res.sendStatus(200);
});

app.listen(PORT, ()=> console.log("Servidor Meu Assistente IA no ar, porta", PORT));
