import express from 'express';
import pool from "../Repository/db.js";
import testarConexao from '../Repository/testarConexao.js';


const testeConexao = express.Router();

testeConexao.get('/conexao', async(req, res) => {
  try {
    const result = await testarConexao();
    res.status(200).json(result);

  }catch (error){
    console.error(error);
    res.status(500).json({error});
  }
});

export default testeConexao;