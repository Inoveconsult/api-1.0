import jwt from 'jsonwebtoken';

const SECRET_KEY = '9285B8F8E77C8A36C8CD4FD4E45E2'; // A mesma usada na outra API pra gerar o token

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // pega o token do header Authorization: Bearer TOKEN  

  if (!token) {
    return res.status(401).json({ message: 'Token não informado.' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido.' });
    }

    req.user = user; // salva o payload do token no req.user
    next(); // segue para a próxima rota
  });
};
