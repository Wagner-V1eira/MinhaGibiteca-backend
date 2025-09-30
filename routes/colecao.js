const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");

const initCollectionsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS colecoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        comic_vine_id VARCHAR(100) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        numero INT NULL,
        imagem_url TEXT NULL,
        data_adicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'na_colecao',
        nota_pessoal TEXT NULL,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_comic (usuario_id, comic_vine_id)
      )
    `);
  } catch (error) {
    console.log("Tabela de coleções já existe ou erro:", error.message);
  }
};

initCollectionsTable();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM colecoes WHERE usuario_id = ? ORDER BY data_adicao DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error("ERRO AO BUSCAR COLEÇÕES:", error);
    res.status(500).json({ error: "Erro ao buscar coleções" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  const { comic_vine_id, titulo, numero, imagem_url, status = 'na_colecao' } = req.body;
  
  if (!comic_vine_id || !titulo) {
    return res.status(400).json({ error: "comic_vine_id e título são obrigatórios" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM colecoes WHERE usuario_id = ? AND comic_vine_id = ?",
      [req.user.id, comic_vine_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "Quadrinho já está na sua coleção" });
    }

    await pool.query(
      `INSERT INTO colecoes (usuario_id, comic_vine_id, titulo, numero, imagem_url, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, comic_vine_id, titulo, numero || null, imagem_url || null, status]
    );

    res.status(201).json({ message: "Quadrinho adicionado à coleção com sucesso" });
  } catch (error) {
    console.error("ERRO AO ADICIONAR À COLEÇÃO:", error);
    res.status(500).json({ error: "Erro ao adicionar quadrinho à coleção" });
  }
});

router.delete("/:comic_vine_id", authMiddleware, async (req, res) => {
  const { comic_vine_id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM colecoes WHERE comic_vine_id = ? AND usuario_id = ?",
      [comic_vine_id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item não encontrado na sua coleção" });
    }

    res.json({ message: "Quadrinho removido da coleção com sucesso" });
  } catch (error) {
    console.error("ERRO AO REMOVER DA COLEÇÃO:", error);
    res.status(500).json({ error: "Erro ao remover quadrinho da coleção" });
  }
});

router.put("/:comic_vine_id", authMiddleware, async (req, res) => {
  const { comic_vine_id } = req.params;
  const { status, nota_pessoal } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE colecoes SET status = ?, nota_pessoal = ? WHERE comic_vine_id = ? AND usuario_id = ?",
      [status || 'na_colecao', nota_pessoal || null, comic_vine_id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Item não encontrado na sua coleção" });
    }

    res.json({ message: "Item atualizado com sucesso" });
  } catch (error) {
    console.error("ERRO AO ATUALIZAR ITEM:", error);
    res.status(500).json({ error: "Erro ao atualizar item da coleção" });
  }
});

router.get("/check/:comic_vine_id", authMiddleware, async (req, res) => {
  const { comic_vine_id } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM colecoes WHERE usuario_id = ? AND comic_vine_id = ?",
      [req.user.id, comic_vine_id]
    );

    res.json({ 
      inCollection: rows.length > 0,
      item: rows.length > 0 ? rows[0] : null
    });
  } catch (error) {
    console.error("ERRO AO VERIFICAR COLEÇÃO:", error);
    res.status(500).json({ error: "Erro ao verificar coleção" });
  }
});

module.exports = router;