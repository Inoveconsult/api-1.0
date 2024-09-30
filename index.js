import 'dotenv/config';
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

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use('/', testeConexao);
app.use('/', criarfunction);
app.use('/', consultaodonto);
app.use('/', odontologia);
app.use('/', atencaobasica);
app.use('/', utilitarios);

// const server = process.env.URL_BACKEND;
 testarConexao();

// console.log(`${server}`);

app.listen(3000, () => console.log('Servidor funcionando'));