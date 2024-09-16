import express from 'express';
import pool from "../Repository/db.js";
import iniciarFunctions from '../Repository/Odonto/InitFunctions.js';


const criarfunction = express.Router();

criarfunction.get('/atualizar', async (req, res) => {
  try {
    const result = iniciarFunctions();    
    res.status(200).send(result);

  }catch (error){
    console.error(error);
    res.status(500).json({error});
  }
});



export default criarfunction;