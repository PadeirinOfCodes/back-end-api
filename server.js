import express from "express";   
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();         // Carrega e processa o arquivo .env
const { Pool } = pkg;    // Utiliza a Classe Pool do Postgres
const app = express();              
const port = 3000;                

app.get("/", async (req, res) => {
  const db = new Pool({  
  connectionString: process.env.URL_BD,
});

let dbStatus = "ok";
try {
  await db.query("SELECT 1");
} catch (e) {
  dbStatus = e.message;
}        
  console.log("Rota GET / solicitada");
  res.json({
		message: "API para atividade",      
    author: "Ryan Gabriel Gonçalves Silva", 
    statusBD: dbStatus  
  });
});

app.listen(port, () => {           
  console.log(`Serviço rodando na porta:  ${port}`);
});