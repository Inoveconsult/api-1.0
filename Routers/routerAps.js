import { Router } from "express";
import apsRepository from "../Repository/aps/apsRepository.js";

const atencaobasica = Router();

atencaobasica.get('/cidadao_vinculado', async (req, res) => {
  let {equipe, data} = req.query;  
  if (!equipe){
    equipe = null;
  }
  if (!data){
    data = null;
  }
  const result = await new apsRepository().cidadaoVinculado(equipe, data);  
  res.status(200).send(result);
})

atencaobasica.get('/crianca_ate_5_anos', async (req, res) => {
  let {equipe, data} = req.query;
  if (!equipe){
    equipe = null;
  }
  if (!data) {
    data = null;
  }
  const result = await new apsRepository().criancaCincoAnos(equipe, data);
  res.status(200).send(result);
})

atencaobasica.get('/idosos_65_anos_mais', async (req, res) => {
  let {equipe, data} = req.query;
  if(!equipe){
    equipe = null;
  }
  if (!data) {
    data = null;
  }
  const result = await new apsRepository().idosos(equipe, data);
  res.status(200).send(result);
})

atencaobasica.get('/fci_atualizadas', async (req, res) => {
  let {equipe, data} = req.query;
  if(!equipe){
    equipe = null;    
  }
  if(!data){
    data = null;
  }
  const result = await new apsRepository().fciAtualizadas(equipe, data);
  res.status(200).send(result);
})

atencaobasica.get('/registro_diario_aps', async (req, res) => {
  let {categoria, mes, ano} = req.query;
  if(!categoria) {
    categoria = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  } 
  const result = await new apsRepository().atendimentoDiarioAps(categoria, mes, ano);  
  res.status(200).send(result);
})


export default atencaobasica;