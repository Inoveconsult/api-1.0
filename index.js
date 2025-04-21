import 'dotenv/config';  // Para carregar variáveis de ambiente
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import testeConexao from './Routers/routerConection.js';
import testarConexao from './Repository/testarConexao.js';
// import InitFunctions from './Repository/Odonto/InitFunctions.js'
import iniciarFunctions from './Repository/Odonto/InitFunctions.js';
import criarfunction from './Routers/routerFunctionOdonto.js';
import consultaodonto from './Routers/teste.js';
import odontologia from './Routers/routerOdonto.js';
import atencaobasica from './Routers/routerAps.js';
import utilitarios from './Routers/routerUtils.js';

const app = express();

// URL do frontend (substitua com a URL real do seu frontend)
// Pode ser definida no arquivo .env
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Caso esteja em desenvolvimento

// Configuração do CORS
app.use(cors({
  origin: frontendUrl,  // Permite apenas requisições do frontend especificado
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'],  // Cabeçalhos permitidos
  credentials: true  // Se o seu backend e frontend estiverem em origens diferentes e utilizarem cookies
}));

// Middleware para tratar os dados enviados (JSON e URL-encoded)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Roteadores para diferentes funcionalidades
app.use('/', testeConexao);
app.use('/', criarfunction);
app.use('/', consultaodonto);
app.use('/', odontologia);
app.use('/', atencaobasica);
app.use('/', utilitarios);

// Função de teste de conexão
testarConexao();

// Inicia o servidor
const PORT = process.env.PORT || 3000; // Usa a porta do ambiente ou 3000 como padrão
app.listen(PORT, () => console.log(`Servidor funcionando na porta ${PORT}`));