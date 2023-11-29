import express, { Request, Response } from 'express';
const app = express();
import pool from './app/models/db';
import cors from 'cors';

const port: number = parseInt (process.env.PORT || '3000', 10);


app.use(express.json());
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello home server!");
});

// Nueva ruta /api
app.get("/api", async (req: Request, res: Response) => {
  try {
    // Obtener una conexión del pool
    const connection = await pool.getConnection();
    
    // Realizar operaciones en la base de datos según sea necesario
    res.json({ message: "Hello server!" });
    
    // Liberar la conexión de vuelta al pool
    connection.release();
  } catch (error: any) {
    res.status(500).json({ error: 'Error al conectar a la base de datos', details: error.message });
  }
});

// Nueva ruta /api/v1
app.get("/api/v1", (req: Request, res: Response) => {
  res.json({ message: "Hola desde boton" });
});

// nueva ruta para el registro de usuarios

app.post('/api/registro', async (req: Request, res: Response) => {
  const { username, correo, contraseña } = req.body;

  try {
    const connection = await pool.getConnection();

    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.execute('SELECT * FROM usuarios WHERE username = ? OR correo = ?', [username, correo]);

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      res.status(400).json({ mensaje: 'El usuario o correo ya están registrados' });
      return;
    }

    // Insertar el nuevo usuario en la base de datos
    const [result] = await connection.execute('INSERT INTO usuarios (username, correo, contraseña) VALUES (?, ?, ?)', [username, correo, contraseña]);

    connection.release();

    // Verificar si la inserción fue exitosa
    if (result && 'insertId' in result) {
      res.status(200).json({ mensaje: 'Usuario registrado correctamente', userId: result.insertId });
    } else {
      res.status(500).json({ mensaje: 'Error al registrar usuario' });
    }
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});


// nueva ruta para manejar el inicio de sesión
app.post('/api/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  console.log('Intento de inicio de sesión para el usuario:', username);

  try {
    // Obtener una conexión del pool
    const connection = await pool.getConnection();

    // Realizar la consulta para verificar las credenciales
    const [rows] = await connection.execute('SELECT * FROM usuarios WHERE username = ? AND contraseña = ?', [username, password]);

    // Liberar la conexión de vuelta al pool
    connection.release();

    if (Array.isArray(rows) && rows.length > 0) {
      res.status(200).json({ mensaje: 'Autenticación exitosa' });
    } else {
      res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error al autenticar usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

interface Pregunta {
  id_pregunta: number;
  id_categoria: number;
  enunciado: string;
  respuesta_correcta: string;
  respuesta_opcional_1: string;
  respuesta_opcional_2: string;
  respuesta_opcional_3: string;
}

interface Categoria {
  id_categoria: number;
}

const obtenerNombreDeUsuarioDesdeSesion = (req: Request): string | null => {
  const username = req.body?.username;

  // Verificar si se proporcionó un nombre de usuario
  if (username) {
    return username;
  }

  return null;
};

// Nueva ruta para obtener una pregunta aleatoria
app.get('/api/obtener-pregunta-aleatoria', async (req: Request, res: Response) => {
  try {
    const connection = await pool.getConnection();

    // Obtener una categoría aleatoria
    const [categorias] = await connection.execute('SELECT * FROM categorias ORDER BY RAND() LIMIT 1') as any;
    const categoriaId = categorias[0].id_categoria;

    // Obtener una pregunta aleatoria de la categoría seleccionada
    const [preguntas] = await connection.execute('SELECT * FROM preguntas WHERE id_categoria = ? ORDER BY RAND() LIMIT 1', [categoriaId]) as any;

    if (preguntas.length === 0) {
      res.status(404).json({ mensaje: 'No se encontraron preguntas para la categoría seleccionada' });
      return;
    }

    const pregunta = preguntas[0].enunciado;

    // Obtener todas las opciones para la pregunta seleccionada
    const opciones: string[] = [
      preguntas[0].respuesta_correcta,
      preguntas[0].respuesta_opcional_1,
      preguntas[0].respuesta_opcional_2,
      preguntas[0].respuesta_opcional_3,
    ];

    // Barajar las opciones de manera aleatoria
    opciones.sort(() => Math.random() - 0.5);

    connection.release();

    res.status(200).json({ pregunta, opciones });
  } catch (error) {
    console.error('Error al obtener pregunta aleatoria:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// Ruta para manejar la respuesta del usuario y registrar la puntuación
app.post('/api/verificar-respuesta', async (req: Request, res: Response) => {
  const { opcionSeleccionada, respuestaCorrecta } = req.body;
   

  try {
    
      const username = obtenerNombreDeUsuarioDesdeSesion(req);

      if (!username) {
        res.status(401).json({ mensaje: 'Usuario no autenticado' });
        return;
      }

      const connection = await pool.getConnection();

      if (opcionSeleccionada === respuestaCorrecta) {
      const puntosGanados = 500;

      await connection.execute('UPDATE usuarios SET puntos = puntos + ? WHERE username = ?', [puntosGanados, username]);

      console.log('Respuesta correcta. Sumar 500 puntos.');
      res.status(200).json({ mensaje: 'Respuesta correcta. Sumar 500 puntos.' });
    } else {
      const puntosPerdidos = 200;

      await connection.execute('UPDATE usuarios SET puntos = puntos - ? WHERE username = ?', [puntosPerdidos, username]);

      console.log('Respuesta incorrecta. Restar 200 puntos.');
      res.status(200).json({ mensaje: 'Respuesta incorrecta. Restar 200 puntos.' });

    }

    connection.release();
  } catch (error) {
    console.error('Error al procesar la respuesta del usuario:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
