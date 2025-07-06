const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'bienestar_emocional',
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar a MySQL:', err);
    return;
  }
  console.log('Conectado a MySQL');
});

// RUTA DE REGISTRO
app.post('/api/register', (req, res) => { 
  const { username, email, password } = req.body;
  db.query(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al registrar' });
      res.status(200).json({ message: 'Registrado con éxito' });
    }
  );
});

// PUERTO
app.listen(8001, () => {
  console.log('Servidor en http://localhost:8001');
});
