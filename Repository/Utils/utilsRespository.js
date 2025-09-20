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

  async listarCategorias() {
    try {
      const result = await super.getSemParametro('getcategorias');
      return result;
    } catch (error) {
      throw error;
    }
  }

  async listarCnes() {
    try {
      const result = await super.getSemParametro('listar_cnes');
        return result;      
    } catch (error) {
      throw error;
    }
  }

  async listarInep() {
    try {
      const result = await super.getSemParametro('listar_inep');
        return result;
    } catch (error) {
      throw error;
    }
  }

  async listarEmulti (){
    try {
      const result = await super.getSemParametro('listar_emulti');
        return result;
    } catch (error) {
      throw error;
    }
  }

  async listarAcsEquipe(p1, p2, p3) {
      try {
        const result = await super.getListarAcsEquipe('listar_acs_equipe', p1, p2, p3);
        return result;
      } catch (error) {
        throw(error)
      }
   }

   async dataAtualizacao() {
    try {
      const result = await super.getSemParametro('atualizacao');
      return result;
    } catch (error) {
      throw (error);
    }
   }

}


export default utilsRepository;