import { Router } from "express";
import { authenticateToken } from "../Middleware/authMiddleware.js";
import { normalizarDataParaFormatoBanco } from "../Repository/Utils/functionNormalizarData.js";
import apsRepository from "../Repository/aps/apsRepository.js";


const atencaobasica = Router();

atencaobasica.use(authenticateToken);
console.log(authenticateToken)

atencaobasica.get('/registro_diario_aps', async (req, res) => {
  let { categoria, mes, ano } = req.query;
  if (!categoria) {
    categoria = null;
  }
  if (!mes) {
    mes = null;
  }
  if (!ano) {
    ano = null;
  }
  const result = await new apsRepository().atendimentoDiarioAps(categoria, mes, ano);
  res.status(200).send(result);
})

atencaobasica.get('/visita_domiciliar', async (req, res) => {
  let { equipe, mes, ano } = req.query;
  if (!equipe) {
    equipe = null;
  }
  if (!mes) {
    mes = null;
  }
  if (!ano) {
    ano = null;
  }
  const result = await new apsRepository().visitaDomiciliar(equipe, mes, ano);
  res.status(200).send(result);
})

atencaobasica.get('/cadastro_domiciliar', async (req, res) => {
  let {equipe, profissional } = req.query;
  if (!equipe) {
    equipe = null;
  }
  if (!profissional) {
    profissional = null;
  }
  const result = await new apsRepository().cadastroDomiciliar(equipe, profissional);  
  res.status(200).send(result);
})

atencaobasica.get('/geolocalizacao_domiciliar', async (req, res) => {
  let { equipe, profissional } = req.query;
  if (!equipe) {
    equipe = null;
  }
  if (!profissional) {
    profissional = null;
  }
  const result = await new apsRepository().geolocalizacaoDomiciliar(equipe, profissional);
  res.status(200).send(result);
})

atencaobasica.get('/calcular_iaf', async (req, res) => {
  let { cnes, mes, ano } = req.query;
    // Converter cnes para array, caso seja string separada por vírgulas
    if (cnes && typeof cnes === 'string') {
      cnes = cnes.split(','); // Converte "2458519,2458489" em ["2458519", "2458489"]
    }
    if (!Array.isArray(cnes)) {
      cnes = []; // Caso cnes não seja enviado ou seja inválido, inicializa como array vazio
    }    
  if (!mes) {
    mes = null;
  }
  if (!ano) {
    ano = null;
  }
  const result = await new apsRepository().calcularIaf(cnes, mes, ano);
  res.status(200).send(result);
})

atencaobasica.get('/dimensao_vinculo', async (req, res) => {
  let {quadrimestre, equipe} = req.query
   // Verifique se todos os parâmetros estão definidos
   if (!quadrimestre) {
    res.status(400).send({ error: 'Informe o Parâmetro Quadrimestre.' });
    return;
  }
  try {
    const result = await new apsRepository().dimensaoVinculo(quadrimestre, equipe)
    res.status(200).send(result);    
  } catch (error) {
    res.status(500).send({ error: 'Erro interno do servidor.' });    
  }  
})


atencaobasica.get('/ranking_cadastro', async (req, res) => {
  let {quadrimestre, equipe} = req.query
   // Verifique se todos os parâmetros estão definidos
   if (!quadrimestre) {
    res.status(400).send({ error: 'Informe o Parâmetro Quadrimestre ou População.' });
    return;
  }
  try {
    const result = await new apsRepository().rankingCadastro(quadrimestre, equipe)
    res.status(200).send(result);    
   
  } catch (error) {
    res.status(500).send({ error: 'Erro interno do servidor.'});    
  }  
})

atencaobasica.get('/pse_novo', async(req, res) => {
  let {inep, equipe, ano } = req.query;
  if (!inep) {
    inep = null;
  }
  if (!equipe) {
    equipe = null;    
  }
  if (!ano) {
    ano = null;  
  }  
  const result = await new apsRepository().pseNovo(inep, equipe, ano);
  res.status(200).send(result);
  // console.log(result)
})

atencaobasica.get('/lista_duplicados', async(req, res) => {
  const result = await new apsRepository().listaDuplicados();
  res.status(200).send(result);
})
// IVCF-20 
atencaobasica.get('/resumo_ivcf', async (req, res) => {
  let equipe =  req.query.equipe;
  let quadrimestre = req.query.quadrimestre;

    // Transforma os parâmetros
  const ineArray = equipe
    ? equipe.split(',').map(ine => ine.trim())
    : null;    
  const result = await new apsRepository().indicadorIVCF20(quadrimestre, ineArray);
  res.status(200).send(result);
})

atencaobasica.get('/listar_ivcf', async (req, res) => {
  let {quadrimestre, equipe} = req.query;

  if (!equipe) {
    equipe = null;
  }
  const result = await new apsRepository().listarIVCF20(quadrimestre, equipe);
  res.status(200).send(result);
})

// ------------------------------------ //

// LISTAR FCI SEM CNS E CPF
atencaobasica.get(`/listar_sem_documento`, async(req, res) => {
  let {equipe} = req.query;
  if (!equipe){
    equipe = null;
  }  
  const result = await new apsRepository().fciSemDocumento(equipe);
  res.status(200).send(result);
})

atencaobasica.get('/fci_desatualizadas', async(req, res) => {
   let { quadrimestre, equipe = null, profissional = null } = req.query;

  if (!quadrimestre) {
      return res.status(400).send({ error: 'Parâmetro "quadrimestre" é obrigatório.' });
  }
  if (!equipe || equipe === "") {
    equipe = null;
  }

  if (!profissional || profissional === "") {
    profissional = null;
  }

  // Normalize o formato da data aqui
    const quadrimestreNormalizado = normalizarDataParaFormatoBanco(quadrimestre);
  const result = await new apsRepository().fciDesatualizada(quadrimestreNormalizado, equipe, profissional);
  res.status(200).send(result);
})

atencaobasica.get('/cidadao_sem_fcdt', async (req, res) => {
  let {equipe} = req.query;
  if (!equipe) {
    equipe =null;    
  }  
  const result = await new apsRepository().cidadaoSemFcdt(equipe);
  res.status(200).send(result);
});

atencaobasica.get('/cidadao_sem_fci', async (req, res) => {
  let {equipe} = req.query;
  if (!equipe) {
    equipe = null;
  }
  const result = await new apsRepository().cidadaoSemFci(equipe);
  res.status(200).send(result);
})

// EMULTI
atencaobasica.get('/atendimento_emulti', async(req, res) => {
  let {equipe, mes, ano } = req.query;
  if (!equipe) {
    equipe = null;
  }
  if (!mes) {
    mes = null;
  }
  if (!ano) {
    ano = null;
  }  
  const result = await new apsRepository().atendimentoEmulti(equipe, mes, ano);
  res.status(200).send(result);  
})
//-----------------------------------------------------------------------
//INDICADORES DE QUALIDADE ESF/EAP
atencaobasica.get('/mais_acesso_aps', async (req, res) => {
  let {quadrimestre} = req.query  
   // Verifique se todos os parâmetros estão definidos
  if (!quadrimestre) {
    res.status(400).send({ error: 'Informe o Parâmetro Quadrimestre.' });
    return;
  }  
  try {
    const result = await new apsRepository().maisAcessoAps(quadrimestre);
    res.status(200).send(result);      
  } catch (error) {
    res.status(500).send({ error: 'Erro interno do servidor.'});
  }
})

atencaobasica.get('/resumo_mais_acesso', async (req, res) => {
   let {quadrimestre, equipe} = req.query
   // Verifique se todos os parâmetros estão definidos
  if (!quadrimestre) {
    res.status(400).send({ error: 'Informe o Parâmetro Quadrimestre.' });
    return;
  }

  if (!equipe) {
    equipe = null
  }
  try {
    const result = await new apsRepository().resumoMaisAcesso(quadrimestre, equipe);
    res.status(200).send(result);      
  } catch (error) {
    res.status(500).send({ error: 'Erro interno do servidor.'});
  }
})

  atencaobasica.get('/saude_sexual', async (req, res) => {
   let {quadrimestre, equipe} = req.query
   // Verifique se todos os parâmetros estão definidos
  if (!quadrimestre) {
    res.status(400).send({ error: 'Informe o Parâmetro Quadrimestre.' });
    return;
  }
  if (!equipe) {
    equipe = null
  }
  try {
    const result = await new apsRepository().saudeSexual(quadrimestre, equipe);
    res.status(200).send(result);    
  } catch (error) {
    res.status(500).send({error: 'Erro interno no servidor.'})    
  }
  })

atencaobasica.get('/saude_crianca', async (req, res) => {
  let {quadrimestre, equipe} = req.query;
  if (!quadrimestre) {
    res.status(400).send({error: 'Informe o Parâmetro Quadrimestre.'});
    return;
  }
  if (!equipe) {
    equipe =null
  }
  try {
    const result = await new apsRepository().desenInfantil(quadrimestre, equipe);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({error: 'Erro interno no servidor.'});
  }
})

atencaobasica.get('/resumo_saude_crianca', async (req, res) => {
  let {quadrimestre, equipe } = req.query;
  if(!quadrimestre) {
    res.status(400).send({error: 'Informa o Parâmetro Quadrimestre.'});
    return;
  }
  if (!equipe) {
    equipe = null;
  }
  try {
    const result = await new apsRepository().resumoDesenvInfantil(quadrimestre, equipe);
    res.status(200).send(result)     
  } catch (error) {
    res.status(500).send({error: 'Erro Interno no servidor.'});
  }
})

atencaobasica.get('/saude_idoso', async (req, res) => {
  let {quadrimestre, equipe} = req.query;
  if (!quadrimestre) {
    res.status(400).send({error:'Informe o Parâmetro Quadrimestre.'});
    return;
  }
  if (!equipe) {
    equipe = null
  }
  try {
    const result = await new apsRepository().saudeDoIdoso(quadrimestre, equipe);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({error: 'Erro interno no servidor.'});
  }
})

atencaobasica.get('/resumo_saude_idoso', async (req, res) => {
  let {quadrimestre, equipe } = req.query;
  if (!quadrimestre) {
    res.status(400).send({error:'Informe o Parâmetro Quadrimestre.'});
    return;
  }
  if (!equipe) {
    equipe = null
  }
  try {
    const result = await new apsRepository().resumoSaudeIdoso(quadrimestre, equipe);
    res.status(200).send(result);    
  } catch (error) {
    res.status(500).send({error: 'Erro interno no servidor.'});    
  }
})


export default atencaobasica;