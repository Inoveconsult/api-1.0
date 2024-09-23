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

  async listarESB(){
    try {
      const result = await super.getSemParametro('listar_esb');
      return result;
    } catch (error) {
      throw error;
    }
  }

  async listarEsf(){
    try {
      const result = await super.getSemParametro('listar_esf');
      return result;
    } catch (error) {
      throw error;
    }
  }


}


export default utilsRepository;