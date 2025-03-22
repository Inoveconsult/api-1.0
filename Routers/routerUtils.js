import { Router } from "express";
import utilsRepository from "../Repository/Utils/utilsRespository.js";

const utilitarios = Router();

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

export default utilitarios;