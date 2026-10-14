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
app.listen(PORT, ()=> console.log("Servidor Meu Agente IA no ar, porta", PORT));
