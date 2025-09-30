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
);

CREATE INDEX idx_colecoes_usuario ON colecoes(usuario_id);
CREATE INDEX idx_colecoes_comic_vine ON colecoes(comic_vine_id);