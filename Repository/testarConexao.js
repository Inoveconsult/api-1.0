import pool from "./db.js";

async function testarConexao() {
  try {
      await pool.connect();
      const result ='Conexão ao Postgres realizado com sucesso!!!';
      // console.log(result);
      return result;
      

      // for (const func of functions) {
      //     await createFunction(client, func.name, func.definition);
      // }
  } catch (error) {
      console.error('Error connecting to the database:', error);
  }
}
testarConexao();

export default testarConexao;