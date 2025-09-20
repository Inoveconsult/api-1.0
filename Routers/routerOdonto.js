import { Router } from "express";
import odontoRepository from "../Repository/Odonto/odontoRepository.js";
import { authenticateToken } from "../Middleware/authMiddleware.js";

const odontologia = Router();

odontologia.use(authenticateToken)

//INDICADORES DE QUALIDADE 
odontologia.get('/primeira_consulta', async (req, res) => {
  let {quadrimestre, equipe} = req.query;
  if (!quadrimestre) {
    alert('Necessário informar o quadrimestre')
  }
  if(!equipe) {
    equipe = null;    
  }
  const result = await new odontoRepository().primeiraConsultaProgramatica(quadrimestre, equipe);
  res.status(200).send(result);
})

odontologia.get('/tratamento_concluido', async(req, res) =>{
  let {quadrimestre, equipe} = req.query;
  if (!quadrimestre) {
    alert('Necessário informar o quadrimestre')
  }
  if(!equipe) {
    equipe = null;    
  }
  const result = await new odontoRepository().totalTratamentoConcluido(quadrimestre, equipe);
  res.status(200).send(result);
});

odontologia.get('/taxa_exodontias', async (req, res) => {
   let {quadrimestre, equipe} = req.query;
  if (!quadrimestre) {
    alert('Necessário informar o quadrimestre')
  }
  if(!equipe) {
    equipe = null;    
  }  
  const result = await new odontoRepository().taxaExodontias(quadrimestre, equipe);
  res.status(200).send(result);
})

odontologia.get('/escovacao_supervisionada', async (req, res) => {
  let {quadrimestre, equipe} = req.query;
  if (!quadrimestre){
    alert('Necessário informar o quadrimestre')
  }
  if(!equipe) {
    equipe = null;    
  }
  const result = await new odontoRepository().escovacaoSupervisionada(quadrimestre, equipe);
  res.status(200).send(result);
})

odontologia.get('/procedimentos_preventivos', async (req, res) => {
  let {quadrimestre, equipe} = req.query;
  if(!quadrimestre){
    alert('Necesário informar o quadrimestre')
  }
  if(!equipe) {
    equipe = null;    
  }
  const result = await new odontoRepository().procedimentoPreventivo(quadrimestre, equipe);
  res.status(200).send(result);
})


odontologia.get('/tra', async (req, res) => {
  let {quadrimestre, equipe} = req.query;
  if (!quadrimestre){
    alert('Necessário informar o quadrimestre')
  }
  if(!equipe) {
    equipe = null;    
  }
  const result = await new odontoRepository().totalTRA(quadrimestre, equipe);
  res.status(200).send(result);
})

//INDICADORES GERAIS

odontologia.get('/prenatal_odontologico', async (req, res) => {
  let {equipe, mes, ano} = req.query;
  if(!equipe) {
    equipe = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  }    
  const result = await new odontoRepository().prenatalOdontologico(equipe, mes, ano);
  res.status(200).send(result);
})

odontologia.get('/atendimento_total', async (req, res) => {
  let {equipe, mes, ano} = req.query;
  if(!equipe) {
    equipe = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  }   
  const result = await new odontoRepository().atendimentoGeral(equipe, mes, ano);  
  res.status(200).send(result);
})

odontologia.get('/demanda_espontanea', async (req, res) => {
  let {equipe, mes, ano} = req.query;
  if(!equipe) {
    equipe = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  } 
  const result = await new odontoRepository().demandaEspontanea(equipe, mes, ano);
  res.status(200).send(result);

})

odontologia.get('/consulta_agendada', async (req, res) => {
  let {equipe, mes, ano} = req.query;
  if(!equipe) {
    equipe = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  } 
  const result = await new odontoRepository().consultaAgendada(equipe, mes, ano);
  res.status(200).send(result);
})

odontologia.get('/tipo_de_consulta', async (req, res) => {
  let {equipe, mes, ano} = req.query;
  if(!equipe) {
    equipe = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  } 
  const result = await new odontoRepository().TipoDeConsulta(equipe, mes, ano);
  res.status(200).send(result);
})

odontologia.get('/atendimento_sexo', async (req, res) => {
  let {equipe, mes, ano} = req.query;
  if(!equipe) {
    equipe = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  } 
  const result = await new odontoRepository().sexoOdonto(equipe, mes, ano);
  res.status(200).send(result);
})

odontologia.get('/faixa_etaria', async (req, res) => {
  let {equipe, mes, ano} = req.query;
  if(!equipe) {
    equipe = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  } 
  const result = await new odontoRepository().faixaEtaria(equipe, mes, ano);
  res.status(200).send(result);
})

odontologia.get('/odonto_procedimentos', async (req, res) => {
  let {equipe, mes, ano} = req.query;
  if(!equipe) {
    equipe = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  }
  const result = await new odontoRepository().procedimentosOdontologicos(equipe, mes, ano);
  res.status(200).send(result);
})

odontologia.get('/vigilancia_bucal', async (req, res) => {
  let {equipe, mes, ano} = req.query;
  if(!equipe) {
    equipe = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  }
  const result = await new odontoRepository().vigilanciaSaudeBucal(equipe, mes, ano);
  res.status(200).send(result);
})

odontologia.get('/pacientes_especiais', async(req, res) => {
  let {equipe, mes, ano} = req.query;
  if(!equipe) {
    equipe = null;    
  }
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  }
  const result = await new odontoRepository().pacientesEspeciais(equipe, mes, ano);
  res.status(200).send(result);
})

odontologia.get('/atendimento_diario', async (req, res) => {
  let {mes, ano} = req.query;
  if(!mes) {
    mes = null;
  }
  if(!ano){
    ano = null;
  }
  const result = await new odontoRepository().atendimentoDiario(mes, ano)
  res.status(200).send(result);
})
/*----PRE-NATAL ODONTOLOGICO----*/
odontologia.get('/gestantes_atendidas', async (req, res) => {
  const result = await new odontoRepository().atendimentoGestante();
  res.status(200).send(result);
})




// odontologia.get('/total_gestante', async (req, res) => {
//   const result = await new odontoRepository().totalGestante();
//   res.status(200).send(result);
// })

export default odontologia;