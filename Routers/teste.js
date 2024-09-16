import json from "body-parser";
import pool from "../Repository/db.js";
import express from 'express';

const consultaodonto = express.Router();

// consultaodonto.get('/tipoconsultaodonto', async (req, res) => {
//   const teste = req.query;
//   // console.log(teste)
//   // const {equipe, mes, ano} = req.query;
//   // console.log(equipe, mes, ano);
//   const equipe = null;
//   const mes = null;
//   const ano = 2024;
//   console.log(equipe, mes, ano);
//   // if(teste){
//   //   const equipe = null;
//   //   const mes = 7;    
//   //   const ano = 2024;    
//   // }
//   const query = `select * from odonto_tipo_consulta($1,$2,$3)`;
//   try {
//     const result = await pool.query(query, [equipe, mes, ano])
//     res.status(200).json(result.rows[0]);
//   } catch (erro) {
//     console.log(erro);
//   }
// });

// consultaodonto.get('/tratamento_concluido', async (req, res) => {
//   // const teste = req.query;
//   // // console.log(teste)
//   // // const {equipe, mes, ano} = req.query;
//   // // console.log(equipe, mes, ano);
//   // const equipe = null;
//   // const mes = null;
//   // const ano = 2024;
//   // console.log(equipe, mes, ano);
//   // // if(teste){
//   // //   const equipe = null;
//   // //   const mes = 7;    
//   // //   const ano = 2024;    
//   // // }
//   const query = `select * from odonto_tratamento_concluido($1,$2,$3)`;
//   try {
//     const result = await pool.query(query, [null, null, null])
//     res.status(200).json(result.rows[0]);
//   } catch (erro) {
//     console.log(erro);
//   }
// });

consultaodonto.get('/consulta_por_cid', async (req, res) => {
  const {equipe, mes, ano} = req.params;
  // console.log(teste)
  // const {equipe, mes, ano} = req.query;
  // console.log(equipe, mes, ano);
  // const equipe = null;
  // const mes = 6;
  // const ano = 2024;
  console.log(equipe, mes, ano);
  // if(teste){
  //   const equipe = null;
  //   const mes = 7;    
  //   const ano = 2024;    
  // }
  const query = `select * from odonto_diagnostico_cid($1,$2,$3)`;
  try {
    const result = await pool.query(query, [equipe, mes, ano])
    res.status(200).json(result.rows);
  } catch (erro) {
    console.log(erro);
  }
});

consultaodonto.get('/consulta_por_ciap', async (req, res) => {
  const teste = req.query;
  // console.log(teste)
  // const {equipe, mes, ano} = req.query;
  // console.log(equipe, mes, ano);
  const equipe = null;
  const mes = 6;
  const ano = 2024;
  console.log(equipe, mes, ano);
  // if(teste){
  //   const equipe = null;
  //   const mes = 7;    
  //   const ano = 2024;    
  // }
  const query = `select * from odonto_diagnostico_ciap($1,$2,$3)`;
  try {
    const result = await pool.query(query, [equipe, mes, ano])
    res.status(200).json(result.rows);
  } catch (erro) {
    console.log(erro);
  }
});

consultaodonto.get('/procedimento_realizado', async (req, res) => {
  const teste = req.query;
  // console.log(teste)
  // const {equipe, mes, ano} = req.query;
  // console.log(equipe, mes, ano);
  // const equipe = null;
  // const mes = null;
  // const ano = 2024;
  // console.log(equipe, mes, ano);
  // if(teste){
  //   const equipe = null;
  //   const mes = 7;    
  //   const ano = 2024;    
  // }
  const query = `select * from odonto_atendimento_procedimento($1,$2,$3)`;
  try {
    const result = await pool.query(query, [null, null, null])
    res.status(200).send(result.rows);
  } catch (erro) {
    console.log(erro);
  }
});

consultaodonto.get('/total_exodontias', async (req, res) => {
 let { equipe, mes, ano } = req.query;
  const query = `select * from odonto_exodontias($1, $2, $3)`;
  try {
    if(!equipe) {
      equipe = null;
    }
    const result = await pool.query(query, [equipe, parseInt(mes), parseInt(ano)]);
    console.log(equipe, mes, ano);
    res.status(200).json(result.rows);
  } catch (erro) {
    console.log(erro);
  }
});

// consultaodonto.get('/procedimento_preventivo', async (req, res) => {
//   const teste = req.query;
//   // console.log(teste)
//   // const {equipe, mes, ano} = req.query;
//   // console.log(equipe, mes, ano);
//   const equipe = null;
//   const mes = 6;
//   const ano = 2024;
//   console.log(equipe, mes, ano);
//   // if(teste){
//   //   const equipe = null;
//   //   const mes = 7;    
//   //   const ano = 2024;    
//   // }
//   const query = `select * from odonto_atendimento_procedimento($1,$2,$3)`;
//   try {
//     const result = await pool.query(query, [equipe, mes, ano])
//     res.status(200).json(result.rows);
//   } catch (erro) {
//     console.log(erro);
//   }
// });

consultaodonto.get('/atendimento_realizado', async (req, res) => {

  let { equipe, mes, ano } = req.body;
 
  const query = `select * from odonto_tipo_atendimento($1,$2,$3)`;
  try {
    if (equipe === '') {
      equipe = null;
    }
    if (mes === 0) {
      mes = null;
    }
    if (ano === 0) {
      ano = null;
    }
    console.log(equipe, mes, ano)
    const result = await pool.query(query, [equipe, mes, ano])
    res.status(200).json(result.rows);

  } catch (erro) {
    console.log(erro);
  }
});

export default consultaodonto;
