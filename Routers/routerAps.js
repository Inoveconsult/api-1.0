import { Router } from "express";
import apsRepository from "../Repository/aps/apsRepository.js";

const atencaobasica = Router();

atencaobasica.get('/crianca_ate_5_anos', async (req, res) => {
  let { equipe, data } = req.query;
  if (!equipe) {
    equipe = null;
  }
  if (!data) {
    data = null;
  }
  const result = await new apsRepository().criancaCincoAnos(equipe, data);
  res.status(200).send(result);
})

atencaobasica.get('/idosos_65_anos_mais', async (req, res) => {
  let { equipe, data } = req.query;
  if (!equipe) {
    equipe = null;
  }
  if (!data) {
    data = null;
  }
  const result = await new apsRepository().idosos(equipe, data);
  res.status(200).send(result);
})

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
  let { profissional, equipe } = req.query;
  if (!profissional) {
    profissional = null;
  }
  if (!equipe) {
    equipe = null;
  }
  const result = await new apsRepository().cadastroDomiciliar(profissional, equipe);
  res.status(200).send(result);
})

atencaobasica.get('/geolocalizacao_domiciliar', async (req, res) => {
  let { profissional } = req.query;
  if (!profissional) {
    profissional = null;
  }
  const result = await new apsRepository().geolocalizacaoDomiciliar(profissional);
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

atencaobasica.get('/calcular_pse', async(req, res) => {
  const result = await new apsRepository().calcularPse();
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


atencaobasica.get('/lista_duplicados', async(req, res) => {
  const result = await new apsRepository().listaDuplicados();
  res.status(200).send(result);
})

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
  let {equipe} = req.query;
  if (!equipe) {
    equipe = null;
  }  
  const result = await new apsRepository().fciDesatualizada(equipe);
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

//HIPERTENSOS

atencaobasica.get('/has_clinico', async (req, res) => {
  let { equipe } = req.query;
  if (!equipe) {
    equipe = null;
  }
  const result = await new apsRepository().hasClinico(equipe);
  res.status(200).send(result);

})

atencaobasica.get('/has_autorreferido', async (req, res) => {
  let { equipe } = req.query;
  if (!equipe) {
    equipe = null;
  }
  const result = await new apsRepository().hasAutorreferido(equipe);
  res.status(200).send(result);
})

atencaobasica.get('/has_sexo', async (req, res) => {
  let { equipe } = req.query;
  if (!equipe) {
    equipe = null;
  }
  const result = await new apsRepository().hasSexo(equipe);
  res.status(200).send(result);
})

atencaobasica.get('/has_fx_etaria', async (req, res) => {
  let { equipe } = req.query;
  if (!equipe) {
    equipe = null;
  }
  const result = await new apsRepository().hasFxEtaria(equipe);
  res.status(200).send(result);
})

atencaobasica.get('/hipertensos_atendidos', async (req, res) => {
  let { equipe } = req.query;
  if (!equipe) {
    equipe = null;
  }
  // if (!mes) {
  //   mes = null;
  // }    
  // if (!ano) {
  //   ano = null;
  // }
  const result = await new apsRepository().hasTotalAtendidos(equipe);
  res.status(200).send(result);
})

//DIABETICOS
atencaobasica.get('/diabeticos_clinicos', async (req, res) => {
  let { equipe } = req.query;
  if (!equipe) {
    equipe = null;
  }
  const result = await new apsRepository().dmClinicos(equipe);
  res.status(200).send(result);
})

atencaobasica.get('/diabeticos_autorreferidos', async (req, res) => {
  let { equipe } = req.query;
  if (!equipe) {
    equipe = null
  }
  const result = await new apsRepository().dmAutorreferidos(equipe);
  res.status(200).send(result);
}),

  atencaobasica.get('/diabeticos_fx_etaria', async (req, res) => {
    let { equipe } = req.query;
    if (!equipe) {
      equipe = null;
    }
    const result = await new apsRepository().dmFxEtaria(equipe);
    res.status(200).send(result);
  })

atencaobasica.get('/diabeticos_atendidos', async (req, res) => {
  let { equipe } = req.query;
  if (!equipe) {
    equipe = null;
  }
  const result = await new apsRepository().dmAtendidos(equipe);
  res.status(200).send(result);
})

atencaobasica.get('/diabeticos_sexo', async (req, res) => {
  let { equipe } = req.query;
  if (!equipe) {
    equipe = null;
  }
  const result = await new apsRepository().dmSexo(equipe);
  res.status(200).send(result);
})



export default atencaobasica;