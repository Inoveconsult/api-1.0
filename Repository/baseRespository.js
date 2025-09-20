import pool from "./db.js";

class baseRopository {
  async getTotal(funcao, par1, par2) {
    try {
      const result = (await pool.query(`SELECT SUM(${par1}) as ${par1}, SUM(${par2}) as ${par2} FROM ${funcao}()`)).rows;
      return result;
    } catch (error) {
      throw error;
    }
  };

  async getSoma(funcao, par1) {
    try {
      const result = (await pool.query(`SELECT SUM(${par1}) as ${par1} FROM ${funcao}()`)).rows;
      return result;
    } catch (error) {
      throw error;
    }
  };

  async getAll(funcao, p1, p2, p3) {
    try {
      const result = (await pool.query(`SELECT * FROM ${funcao}($1, $2, $3)`, [p1, p2, p3])).rows;
      return result;
    } catch (error) {
      throw error;
    }
  };

   async getAllOdonto(funcao, p1, p2) {
    try {
      const result = (await pool.query(`SELECT * FROM ${funcao}($1, $2)`, [p1, p2])).rows;
      return result;
    } catch (error) {
      throw error;
    }
  };

  async getMensal(funcao, p1, p2) {
    try {
      const result = (await pool.query(`SELECT * FROM ${funcao}($1, $2)`, [p1, p2])).rows;
      return result;
    } catch (error) {
      throw error;
    }
  };

  async getContagem(funcao) {
    try {
      const result = (await pool.query(`SELECT COUNT(*) AS Total FROM ${funcao}()`)).rows;
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getSemParametro(funcao) {
    try {
      const result = (await pool.query(`SELECT * FROM ${funcao}()`)).rows;
      return result;
    } catch (error) {
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

  async getParametroEquipe(funcao, p1) {
    try {
      const result = (await pool.query(`SELECT * FROM ${funcao}($1)`, [p1])).rows;
      return result;
    } catch (error) {
      throw error;
    }
  }

  // LISTA CADASTROS DUPLICADOS 
  async getListarDuplicados(funcao) {
    try {
      const result = (await pool.query(`SELECT CPF, CNS, NOME_CIDADAO, DT_NASC, NOME_MAE, ULTIMA_ATUALIZACAO, NOME_EQUIPE FROM ${funcao}()`)).rows;
      return result;
    } catch (error) {
      throw error;
    }
  }

   // /DIMENSÃO VINCULO/ 
  async getDimensaoVinculo(funcao, p1, p2) {
    const result = (await pool.query(`
        SELECT 
            *
        FROM ${funcao}($1, $2)`, [p1, p2])).rows;
    return result;
  }

  async getRankingCadastro(funcao, p1, p2) {
    const result = (await pool.query(`
        SELECT 
          EQUIPES,
          TOTAL_VINCULADO,
          SCORE,
          CLASSIFICACAO,          
         CASE
            WHEN SCORE = '3' THEN '8.000,00'
            WHEN SCORE = '2.25' THEN '6.000,00'
            WHEN SCORE = '1.5' THEN '4.000,00'
            ELSE '2.000,00'
         END AS RECURSO_PREVISTO
        FROM ${funcao}($1, $2) 
        ORDER BY 
          RESULTADO DESC`, [p1, p2])).rows;        
    return result;
  }

  async getDimVinculo(funcao, p1) {
    try {
      const result = (await pool.query(`SELECT * FROM ${funcao}($1)`, [p1])).rows;
      return result;
    } catch (error) {
      throw error
    }
  }

  async getDesatualizadoAcs(funcao, p1, p2, p3) {
    try {
      const result = (await pool.query(`SELECT * FROM ${funcao}($1, $2, $3)`, [p1,p2, p3 ])).rows;
      return result;
    } catch (error) {
      throw error
    }
  }

  async getListarAcsEquipe(funcao, p1, p2, p3) {
    try {
      const result = (await pool.query(`SELECT * FROM ${funcao}($1, $2, $3)`, [p1, p2, p3])).rows;
      return result;
    } catch (error) {
      throw error;      
    }
  }

  async getIvcf(funcao, p1, p2) {
    try {
      const result = (await pool.query(`SELECT * FROM ${funcao}($1, $2)`, [p1, p2])).rows;
      return result;
    } catch (error) {
      throw error
      
    }
  }

  //INDICADORES DE QUADRIMESTRES
    async getIndicadoresQuadrimestres(funcao, p1, p2) {
      try {
        const result = (await pool.query(`SELECT * FROM ${funcao}($1, $2)`, [p1, p2])).rows;
        return result;
      } catch (error) {
        throw error        
      }   
    }
    //INDICADORES DE QUADRIMESTRES
    async getIndicadorMaisAcesso(funcao, p1) {
      try {
        const result = (await pool.query(`SELECT * FROM ${funcao}($1)`, [p1])).rows;
        return result;
      } catch (error) {
        throw error        
      }   
    }
}



export default baseRopository;