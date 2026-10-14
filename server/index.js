import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "Meu Agente IA <onboarding@resend.dev>";

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
      subject: "Confirme seu e-mail — Meu Agente IA",
      html: `<div style="font-family:Segoe UI,Arial,sans-serif;background:#0a0e16;padding:32px;color:#c3ccd6">
        <h2 style="color:#f4c15a;margin:0 0 12px">Meu Agente IA</h2>
        <p style="font-size:16px">Recebemos seu cadastro. Use o codigo abaixo para confirmar seu e-mail:</p>
        <div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#eef3f9;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:18px;text-align:center;margin:18px 0">${codigo}</div>
        <p style="color:#8fa0b0;font-size:13px">Se voce nao fez este cadastro, ignore este e-mail.</p>
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

app.get("/", (_req,res)=> res.json({ servico:"Meu Agente IA", status:"ok" }));

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

app.listen(PORT, ()=> console.log("Servidor Meu Agente IA no ar, porta", PORT));
