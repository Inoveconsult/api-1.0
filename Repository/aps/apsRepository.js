import baseRopository from "../baseRespository.js";

class apsRepository extends baseRopository{  
  //INDICADORES DE VINCULO
  async cidadaoVinculado(p1, p2){
    try {
      const result = await super.getVinculado('cidadao_vinculado', p1, p2);
      return result;
    } catch (error) {
      throw error;      
    }
  }

  async criancaCincoAnos(p1, p2){
    try {
      const result = await super.getVinculado('crianca_ate_5_anos', p1, p2);
      return result;
    } catch (error) {
      throw error;      
    }

  }

  async idosos(p1, p2) {
    try {
      const result = await super.getVinculado('idosos_65_anos_mais', p1, p2);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async fciAtualizadas(p1, p2) {
    try {
      const result = await super.getVinculado('fci_atualizadas', p1, p2);
      return result;
    } catch (error) {
      throw error;
    }
  }
  // INDICADORES GERAIS ESF  
    async atendimentoDiarioAps(p1, p2, p3){
      try {
        const result = await super.getAll('atendimento_diario_aps', p1, p2, p3);
        return result;
      } catch (error) {
        throw error;
      }
    };
  
};

export default apsRepository;