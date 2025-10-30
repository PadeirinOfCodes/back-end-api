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

app.get("/questoes/:id", async (req, res) => {
  console.log("Rota GET /questoes/:id solicitada"); // Log no terminal para indicar que a rota foi acessada

  try {
    const id = req.params.id; // Obtém o ID da questão a partir dos parâmetros da URL
    const db = conectarBD(); // Conecta ao banco de dados
    const consulta = "SELECT * FROM questoes WHERE id = $1"; // Consulta SQL para selecionar a questão pelo ID
    const resultado = await db.query(consulta, [id]); // Executa a consulta SQL com o ID fornecido
    const dados = resultado.rows; // Obtém as linhas retornadas pela consulta

    // Verifica se a questão foi encontrada
    if (dados.length === 0) {
      return res.status(404).json({ mensagem: "Questão não encontrada" }); // Retorna erro 404 se a questão não for encontrada
    }

    res.json(dados); // Retorna o resultado da consulta como JSON
  } catch (e) {
    console.error("Erro ao buscar questão:", e); // Log do erro no servidor
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

app.delete("/questoes/:id", async (req, res) => {
  console.log("Rota DELETE /questoes/:id solicitada"); // Log no terminal para indicar que a rota foi acessada

  try {
    const id = req.params.id; // Obtém o ID da questão a partir dos parâmetros da URL
    const db = conectarBD(); // Conecta ao banco de dados
    let consulta = "SELECT * FROM questoes WHERE id = $1"; // Consulta SQL para selecionar a questão pelo ID
    let resultado = await db.query(consulta, [id]); // Executa a consulta SQL com o ID fornecido
    let dados = resultado.rows; // Obtém as linhas retornadas pela consulta

    // Verifica se a questão foi encontrada
    if (dados.length === 0) {
      return res.status(404).json({ mensagem: "Questão não encontrada" }); // Retorna erro 404 se a questão não for encontrada
    }

    consulta = "DELETE FROM questoes WHERE id = $1"; // Consulta SQL para deletar a questão pelo ID
    resultado = await db.query(consulta, [id]); // Executa a consulta SQL com o ID fornecido
    res.status(200).json({ mensagem: "Questão excluida com sucesso!!" }); // Retorna o resultado da consulta como JSON
  } catch (e) {
    console.error("Erro ao excluir questão:", e); // Log do erro no servidor
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

app.post("/questoes", async (req, res) => {
  console.log("Rota POST /questoes solicitada"); // Log no terminal para indicar que a rota foi acessada

  try {
    const data = req.body; // Obtém os dados do corpo da requisição
    // Validação dos dados recebidos
    if (!data.enunciado || !data.disciplina || !data.tema || !data.nivel) {
      return res.status(400).json({
        erro: "Dados inválidos",
        mensagem:
          "Todos os campos (enunciado, disciplina, tema, nivel) são obrigatórios.",
      });
    }

    const db = conectarBD(); // Conecta ao banco de dados

    const consulta =
      "INSERT INTO questoes (enunciado,disciplina,tema,nivel) VALUES ($1,$2,$3,$4) "; // Consulta SQL para inserir a questão
    const questao = [data.enunciado, data.disciplina, data.tema, data.nivel]; // Array com os valores a serem inseridos
    const resultado = await db.query(consulta, questao); // Executa a consulta SQL com os valores fornecidos
    res.status(201).json({ mensagem: "Questão criada com sucesso!" }); // Retorna o resultado da consulta como JSON
  } catch (e) {
    console.error("Erro ao inserir questão:", e); // Log do erro no servidor
    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

app.put("/questoes/:id", async (req, res) => {
  console.log("Rota PUT /questoes solicitada"); // Log no terminal para indicar que a rota foi acessada

  try {
    const id = req.params.id; // Obtém o ID da questão a partir dos parâmetros da URL
    const db = conectarBD(); // Conecta ao banco de dados
    let consulta = "SELECT * FROM questoes WHERE id = $1"; // Consulta SQL para selecionar a questão pelo ID
    let resultado = await db.query(consulta, [id]); // Executa a consulta SQL com o ID fornecido
    let questao = resultado.rows; // Obtém as linhas retornadas pela consulta

    // Verifica se a questão foi encontrada
    if (questao.length === 0) {
      return res.status(404).json({ message: "Questão não encontrada" }); // Retorna erro 404 se a questão não for encontrada
    }

    const data = req.body; // Obtém os dados do corpo da requisição

    // Usa o valor enviado ou mantém o valor atual do banco
    data.enunciado = data.enunciado || questao[0].enunciado;
    data.disciplina = data.disciplina || questao[0].disciplina;
    data.tema = data.tema || questao[0].tema;
    data.nivel = data.nivel || questao[0].nivel;

    // Atualiza a questão
    consulta = "UPDATE questoes SET enunciado = $1, disciplina = $2, tema = $3, nivel = $4 WHERE id = $5";
    // Executa a consulta SQL com os valores fornecidos
    resultado = await db.query(consulta, [
      data.enunciado,
      data.disciplina,
      data.tema,
      data.nivel,
      id,
    ]);

    res.status(200).json({ message: "Questão atualizada com sucesso!" }); // Retorna o resultado da consulta como JSON
  } catch (e) {
    console.error("Erro ao atualizar questão:", e); // Log do erro no servidor
    res.status(500).json({
      erro: "Erro interno do servidor",
    });
  }
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

