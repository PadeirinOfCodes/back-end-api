import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

let pool = null;

function conectarBD() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.URL_BD,
    });
  }
  return pool;
}

const db = conectarBD();

let dbStatus = "ok";
try {
  await db.query("SELECT 1");
  console.log("Conexão com o banco de dados estabelecida com sucesso!");
} catch (e) {
  dbStatus = e.message;
  console.error("Erro na conexão com o banco de dados:", dbStatus);
}

app.get("/", async (req, res) => {
  res.redirect("/index.html");
});

app.get("/api-status", async (req, res) => {
  console.log("Rota GET /api-status solicitada");
  res.json({
    message: "API para a atividade (CRUD Usuários)",
    author: "Ryan Gabriel Gonçalves Silva (com ajustes de Gemini)",
    statusBD: dbStatus,
  });
});

app.get("/usuarios", async (req, res) => {
  console.log("Rota GET /usuarios solicitada");
  try {
    const resultado = await db.query(
      "SELECT id, nome, email, data_criacao, status FROM usuarios ORDER BY id DESC"
    );
    const dados = resultado.rows;
    res.json(dados);
  } catch (e) {
    console.error("Erro ao buscar usuários:", e);
    res.status(500).json({
      erro: "Erro interno do servidor",
      mensagem: "Não foi possível buscar os usuários",
    });
  }
});

app.get("/usuarios/:id", async (req, res) => {
  console.log("Rota GET /usuarios/:id solicitada");

  try {
    const id = req.params.id;
    const consulta =
      "SELECT id, nome, email, data_criacao, status FROM usuarios WHERE id = $1";
    const resultado = await db.query(consulta, [id]);
    const dados = resultado.rows;

    if (dados.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    res.json(dados[0]);
  } catch (e) {
    console.error("Erro ao buscar usuário:", e);
    res.status(500).json({
      erro: "Erro interno do servidor",
    });
  }
});

app.post("/usuarios", async (req, res) => {
  console.log("Rota POST /usuarios solicitada");

  try {
    const data = req.body;
    if (!data.nome || !data.email || !data.senha) {
      return res.status(400).json({
        erro: "Dados inválidos",
        mensagem: "Todos os campos (nome, email, senha) são obrigatórios.",
      });
    }

    const consulta =
      "INSERT INTO usuarios (nome, email, senha, data_criacao, status) VALUES ($1, $2, $3, NOW(), $4) RETURNING id, nome, email, data_criacao, status";
    
    const status = data.status || 'Ativo'; 
    
    const usuario = [data.nome, data.email, data.senha, status];
    
    const resultado = await db.query(consulta, usuario);

    res.status(201).json({
      mensagem: "Usuário criado com sucesso!",
      data: resultado.rows[0],
    });
  } catch (e) {
    if (e.code === '23505' && e.constraint === 'usuarios_email_key') {
      console.error("Erro ao inserir usuário: E-mail já cadastrado", e.message);
      return res.status(409).json({
        erro: "Conflito de dados",
        mensagem: "O e-mail fornecido já está em uso."
      });
    }
    console.error("Erro ao inserir usuário:", e);
    res.status(500).json({
      erro: "Erro interno do servidor",
    });
  }
});

app.put("/usuarios/:id", async (req, res) => {
  console.log("Rota PUT /usuarios/:id solicitada");

  try {
    const id = req.params.id;
    let consulta = "SELECT * FROM usuarios WHERE id = $1";
    let resultado = await db.query(consulta, [id]);
    let usuario = resultado.rows;

    if (usuario.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const data = req.body;

    const nome = data.nome || usuario[0].nome;
    const email = data.email || usuario[0].email;
    const status = data.status || usuario[0].status;

    consulta =
      "UPDATE usuarios SET nome = $1, email = $2, status = $3 WHERE id = $4 RETURNING id, nome, email, data_criacao, status";
      
    resultado = await db.query(consulta, [
      nome,
      email,
      status,
      id,
    ]);

    res.status(200).json({
      message: "Usuário atualizado com sucesso!",
      data: resultado.rows[0],
    });
  } catch (e) {
    if (e.code === '23505' && e.constraint === 'usuarios_email_key') {
      console.error("Erro ao atualizar usuário: E-mail já cadastrado", e.message);
      return res.status(409).json({
        erro: "Conflito de dados",
        mensagem: "O e-mail fornecido já está em uso por outro usuário."
      });
    }
    console.error("Erro ao atualizar usuário:", e);
    res.status(500).json({
      erro: "Erro interno do servidor",
    });
  }
});

app.delete("/usuarios/:id", async (req, res) => {
  console.log("Rota DELETE /usuarios/:id solicitada");

  try {
    const id = req.params.id;
    let consulta = "SELECT * FROM usuarios WHERE id = $1";
    let resultado = await db.query(consulta, [id]);
    let dados = resultado.rows;

    if (dados.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    consulta = "DELETE FROM usuarios WHERE id = $1";
    resultado = await db.query(consulta, [id]);
    res.status(200).json({ mensagem: "Usuário excluido com sucesso!!" });
  } catch (e) {
    console.error("Erro ao excluir usuário:", e);
    res.status(500).json({
      erro: "Erro interno do servidor",
    });
  }
});

app.listen(port, () => {
  console.log(`Serviço rodando na porta: ${port}`);
  console.log(`Frontend disponível em http://localhost:${port}`);
});

