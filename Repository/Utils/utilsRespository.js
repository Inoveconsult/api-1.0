import baseRopository from "../baseRespository.js";

class utilsRepository extends baseRopository{
  //LISTA ACS
  async listarACS(){
   try {
    const result = await super.getSemParametro('listar_acs');
    return result;
   } catch (error) {
    throw error;
   } 
  }
}

export default utilsRepository;