// import 'dotenv/config';
// import express from 'express';
// import cors from 'cors';
// import bodyParser from 'body-parser';
// import testeConexao from './Routers/routerConection.js';
// import testarConexao from './Repository/testarConexao.js';
// import iniciarFunctions from './Repository/Odonto/InitFunctions.js';
// import criarfunction from './Routers/routerFunctionOdonto.js';
// import consultaodonto from './Routers/teste.js';
// import odontologia from './Routers/routerOdonto.js';
// import atencaobasica from './Routers/routerAps.js';
// import utilitarios from './Routers/routerUtils.js';

// const app = express();

// // CORS dinâmico e seguro
// const allowedOrigins = [
//   'http://localhost:3000',
//   // 'https://main.d3i03sln9bakli.amplifyapp.com',
//   'https://api.inovegestor.com'
// ];

// const cors = require('cors');

// const corsOptions = {
//   origin: 'http://localhost:3001', // Seu frontend rodando em localhost:3001
//   methods: ['GET', 'POST', 'PUT', 'DELETE'], // Defina os métodos permitidos
//   credentials: true // Se precisar enviar cookies ou headers especiais
// };

// app.use(cors(corsOptions));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Rotas
// app.use('/', testeConexao);
// app.use('/', criarfunction);
// app.use('/', consultaodonto);
// app.use('/', odontologia);
// app.use('/', atencaobasica);
// app.use('/', utilitarios);
// app.use(cors(corsOptions));

// // Teste de conexão ao iniciar
// testarConexao();

// // Inicializa o servidor
// app.listen(3000, () => console.log('Servidor funcionando na porta 3000'));

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import testeConexao from './Routers/routerConection.js';
import testarConexao from './Repository/testarConexao.js';
import iniciarFunctions from './Repository/Odonto/InitFunctions.js'; // Parece não usado ainda
import criarfunction from './Routers/routerFunctionOdonto.js';
import consultaodonto from './Routers/teste.js';
import odontologia from './Routers/routerOdonto.js';
import atencaobasica from './Routers/routerAps.js';
import utilitarios from './Routers/routerUtils.js';

const app = express();

// CORS dinâmico e seguro
const allowedOrigins = [
  'http://localhost:3001',
  'https://api.inovegestor.com'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rotas
app.use('/', testeConexao);
app.use('/', criarfunction);
app.use('/', consultaodonto);
app.use('/', odontologia);
app.use('/', atencaobasica);
app.use('/', utilitarios);

// Teste de conexão ao iniciar
testarConexao();

// Inicializa o servidor
app.listen(3000, () => console.log('Servidor funcionando na porta 3000'));
