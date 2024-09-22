import { Router } from "express";
import utilsRepository from "../Repository/Utils/utilsRespository.js";

const utilitarios = Router();

//lista de agentes comunitários
utilitarios.get('/listar_acs', async (req, res) => {
  const result = await new utilsRepository().listarACS();
  res.status(200).send(result);
});

export default utilitarios;