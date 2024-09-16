import pool from "./db.js";

function createFunction(client, functionName, functionDefinition) {
  try {
      pool.query(functionDefinition);
      const result = (`Função ${functionName} criada com sucesso.`);
      // console.log(result);
      return result;

  } catch (error) {
      console.error(`Error creating function ${functionName}:`, error);
  }
}

export default createFunction;