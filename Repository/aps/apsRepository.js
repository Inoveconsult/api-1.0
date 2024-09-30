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

    async visitaDomiciliar(p1, p2, p3){
      try {
        const result = await super.getAll('visita_domiciliar_diaria', p1, p2, p3,);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async geolocalizacao(p1, p2, p3){
      try {
        const result = await super.getAll('geolocalizacao', p1, p2, p3);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async calcularIaf(p1, p2, p3) {
      try {
        const result = await super.getAll('calcular_iaf', p1, p2, p3);
        return result;
      } catch (error) {
        throw error;
      }
    }


    //HIPERTENSOS
    async hasClinico(p1){
      try {
        const result = await super.getParametroEquipe('has_clinico', p1);
           return result;
      } catch (error) {
        throw error;        
      }
    }

    async hasAutorreferido(p1) {
      try {
        const result = await super.getParametroEquipe('has_autorreferidos', p1);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async hasSexo(p1) {
      try {
        const result = await super.getParametroEquipe('has_sexo', p1);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async hasFxEtaria(p1) {
      try {
        const result = await super.getParametroEquipe('has_fx_etaria', p1);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async hasTotalAtendidos(p1) {
      try {
        const result = await super.getParametroEquipe('hipertensos_atendidos', p1);
        return result;
      } catch (error) {
        throw error;
      }
    }

    //DIABETICOS
    async dmClinicos(p1) {
      try {
        const result = await super.getParametroEquipe('diabeticos_clinico', p1);
        return result;
      } catch (error) {
        throw error;        
      }
    }

    async dmAutorreferidos(p1) {
      try {
        const result = await super.getParametroEquipe('diabeticos_autorreferidos', p1);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async dmFxEtaria(p1) {
      try {
        const result = await super.getParametroEquipe('diabeticos_fx_etaria', p1);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async dmAtendidos(p1) {
      try {
        const result = await super.getParametroEquipe('diabeticos_atendidos', p1);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async dmSexo(p1) {
      try {
        const result = await super.getParametroEquipe('diabeticos_sexo', p1);
        return result
      } catch (error) {
        throw error;
      }
    }

  
};

export default apsRepository;