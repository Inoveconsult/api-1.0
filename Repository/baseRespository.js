import pool from "./db.js";

class baseRopository {
  async getTotal(funcao, par1, par2){
    try{
      const result = (await pool.query(`SELECT SUM(${par1}) as ${par1}, SUM(${par2}) as ${par2} FROM ${funcao}()`)).rows;     
        return result;
    }catch(error){
      throw error;
    }
  };

  async getSoma(funcao, par1){
    try{
      const result = (await pool.query(`SELECT SUM(${par1}) as ${par1} FROM ${funcao}()`)).rows;       
        return result;
    }catch(error){
      throw error;
    }
  };

  async getAll(funcao, p1, p2, p3){
    try{
      const result = (await pool.query(`SELECT * FROM ${funcao}($1, $2, $3)`, [p1,p2,p3])).rows;    
      return result;
    }catch(error){
      throw error;
    }
  };

  async getVinculado(funcao, p1, p2){
    try{
      const result = (await pool.query(`SELECT * FROM ${funcao}($1, $2)`, [p1,p2])).rows;    
      return result;      
    }catch(error){
      throw error;
    }
  };

  async getMensal(funcao, p1, p2){
    try{
      const result = (await pool.query(`SELECT * FROM ${funcao}($1, $2)`, [p1,p2])).rows;    
      return result;
    }catch(error){
      throw error;
    }
  };

  async getContagem(funcao){
    try{
      const result = (await pool.query(`SELECT COUNT(*) AS Total FROM ${funcao}()`)).rows;
      return result;
    }catch(error){
      throw error;
    }
  }

  async getSemParametro(funcao){
    try{
      const result = (await pool.query(`SELECT * FROM ${funcao}()`)).rows;
      return result;
    }catch(error){      
      throw error;
    }
  }

async getCalcularIAF(funcao, p1, p2, p3) {
  try {
    const result = (await pool.query(`SELECT * FROM ${funcao}($1::text[], $2, $3)`, [p1, p2, p3])).rows;
    return result;
  } catch (error) {
    throw error;
  }
}

  async getParametroEquipe(funcao, p1){
    try{
      const result = (await pool.query(`SELECT * FROM ${funcao}($1)`, [p1])).rows;
      return result;
    }catch(error){      
      throw error;
    }
  }

  async getBolsaFamilia(funcao, p1){
    try{
      const result = (await pool.query(`SELECT * FROM ${funcao}($1)`, [p1])).rows;
      return result;
    }catch(error){      
      throw error;
    }
  }
  // /CADASTROS DUPLICADOS/ 
  async getTotalDuplicados(funcao){
    try {
      const result = (await pool.query(`SELECT DISTINCT DUPLICADOS FROM ${funcao}()`)).rows;
      return result;
    } catch (error) {
      throw error;      
    }
  }
  // LISTA CADASTROS DUPLICADOS 
  async getListarDuplicados(funcao){
    try {
      const result = (await pool.query(`SELECT CPF, CNS, NOME_CIDADAO, DT_NASC, NOME_MAE, ULTIMA_ATUALIZACAO, NOME_EQUIPE FROM ${funcao}()`)).rows;
      return result;
    } catch (error) {
      throw error;
    }
  }

};


export default baseRopository;