const express = require('express');
const mysql = require('mysql2/promise'); // 👈 importante usar .promise()
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let db;

(async () => {
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'bienestar_emocional',
    });

    console.log('✅ Conectado a MySQL');

    app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const query = 'INSERT INTO usuarios (usuario, email, password) VALUES (?, ?, ?)';
    const [result] = await db.query(query, [username, email, password]);

    res.status(201).json({ message: 'Usuario registrado con éxito', id: result.insertId });
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const query = 'SELECT * FROM usuarios WHERE usuario = ? AND password = ?';
    const [rows] = await db.query(query, [username, password]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];

    // ⚠️ Aquí normalmente generarías un token con JWT (opcional si no usas auth avanzada)
    const token = 'fake-token-123'; // puedes cambiarlo luego por un JWT real

    res.json({ token, user: { id: user.id_user, username: user.usuario, email: user.email } });
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});


    // 👇 Aquí va la ruta que me preguntaste
    app.get('/api/users', async (req, res) => {
      try {
        const [rows] = await db.query('SELECT * FROM usuarios');
        console.log('📦 Usuarios:', rows);
        res.json(rows);
      } catch (err) {
        console.error('❌ Error al obtener usuarios:', err);
        res.status(500).json({ error: 'Error del servidor' });
      }
    });

    // 👇 Aquí arranca el servidor
    app.listen(8001, () => {
      console.log('🚀 Servidor corriendo en http://localhost:8001');
    });
  } catch (err) {
    console.error('❌ Error al conectar a MySQL:', err);
  }
})();
