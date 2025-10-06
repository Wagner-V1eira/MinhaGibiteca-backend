const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");

const SECRET = process.env.JWT_SECRET || "segredo";

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nome, email FROM usuarios");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

router.post("/register", async (req, res) => {
  const { nome, email, senha } = req.body;
  
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  try {
    const [existingUser] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return res.status(409).json({ error: "Usuário já cadastrado" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await pool.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
      [nome, email, senhaHash]
    );

    res.status(201).json({ message: "Usuário cadastrado com sucesso" });
  } catch (error) {
    console.error("ERRO NO CADASTRO:", error);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Email e senha obrigatórios" });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const usuario = rows[0];

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({ 
      message: "Login bem-sucedido", 
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error("ERRO NO LOGIN:", error); 
    res.status(500).json({ error: "Erro no servidor" });
  }
});

module.exports = router;
