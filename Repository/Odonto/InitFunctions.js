import pool from "../db.js";
import functions from "./Functions.js";
import createFunction from "../CreateFunctions.js";

function iniciarFunctions() {
  try {
      pool.connect(); 
      for (const func of functions) {
        createFunction(pool, func.name, func.definition);
      }
      const result = (`Função criada com sucesso.`);
      return result;
  } catch (error) {
      console.error('Error connecting to the database:', error);
  }
}

iniciarFunctions();

export default iniciarFunctions;