import { Router } from "express";
import utilsRepository from "../Repository/Utils/utilsRespository.js";
import { authenticateToken } from "../Middleware/authMiddleware.js";
import { normalizarDataParaFormatoBanco } from "../Repository/Utils/functionNormalizarData.js";
import apsRepository from "../Repository/aps/apsRepository.js";

const utilitarios = Router();

utilitarios.use(authenticateToken)

//lista de agentes comunitários
utilitarios.get('/listar_acs', async (req, res) => {
  const result = await new utilsRepository().listarACS();
  res.status(200).send(result);
});

utilitarios.get('/listar_esb', async (req, res) => {
  const result = await new utilsRepository().listarESB();
  res.status(200).send(result);
})

utilitarios.get('/listar_esf', async (req, res) => {
  const result = await new utilsRepository().listarEsf();
  res.status(200).send(result);
})

utilitarios.get('/listar_categorias', async (req, res) => {
  const result = await new utilsRepository().listarCategorias()
  res.status(200).send(result);
})

utilitarios.get('/listar_cnes', async(req, res) => {
  const result = await new utilsRepository().listarCnes();
  res.status(200).send(result);
})

utilitarios.get('/listar_inep', async(req, res) => {
  const result = await new utilsRepository().listarInep();
  res.status(200).send(result);
})

utilitarios.get('/listar_emulti', async(req, res) => {
  const result = await new utilsRepository().listarEmulti();
  res.status(200).send(result);
})

utilitarios.get('/listar_acs_equipe', async(req, res) => {
  try {
    let { quadrimestre, equipe = null, profissional = null } = req.query;

  if (!quadrimestre) {
      return res.status(400).send({ error: 'Parâmetro "quadrimestre" é obrigatório.' });
  }
  
  // Normalize o formato da data aqui
    const quadrimestreNormalizado = normalizarDataParaFormatoBanco(quadrimestre);

  const result = await new utilsRepository().listarAcsEquipe(quadrimestreNormalizado, equipe, profissional);
    res.status(200).send(result);
  } catch (error) {
    console.error("Erro ao listar ACS por equipe:", error);
    res.status(500).send({ error: "Erro interno no servidor." });
  }

  
})

utilitarios.get('/atualizacao', async(req, res) => {
    const result = await new utilsRepository().dataAtualizacao();    
    res.status(200).send(result);
})



export default utilitarios;