import baseRopository from "../baseRespository.js";

class apsRepository extends baseRopository{  
  //INDICADORES DE VINCULO
  async dimensaoVinculo(p1, p2) {
    try {
      const result = await super.getDimensaoVinculo('dim_vinculo', p1, p2);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async rankingCadastro(p1, p2) {
    try {
      const result = await super.getRankingCadastro('dim_vinculo', p1, p2);
      return result;
      console(result);
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

  // INDICADORS EMULTI
  async atendimentoEmulti(p1, p2, p3) {
    try {
      const result = await super.getAll('registro_diario_emulti', p1, p2, p3);
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

    async cadastroDomiciliar(p1, p2) {
      try {
        const result = await super.getMensal('cadastro_domiciliar', p1, p2);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async geolocalizacaoDomiciliar(p1) {
      try {
        const result = await super.getParametroEquipe('geolocalizacao_domiciliar', p1);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async calcularIaf(p1, p2, p3) {
      try {
        const result = await super.getCalcularIAF('calcular_iaf', p1, p2, p3);
        return result;
      } catch (error) {
        throw error;
      }
    }

    async calcularPse() {
      try {
        const result = await super.getSemParametro('calcula_pse');
        return result;
      } catch (error) {
        throw error;
      }
    }
    
    // CADASTROS DUPLICADOS


    async listaDuplicados(){
      try {
        const result = await super.getListarDuplicados('listar_duplicados');
        return result;
      } catch (error) {
        throw error;
      }
    }

    // FCI SEM CPF E CNS
    async fciSemDocumento(p1) {
      try {
        const result = await super.getDimVinculo('fci_sem_documento', p1);
        return result;
      } catch (error) {
        throw(error);
      }
    }

    // FCI DESATUALIZADAS
    async fciDesatualizada(p1, p2){
      try {
        const result = await super.getDesatualizadoAcs('fci_desatualizada', p1, p2);
        return result;
      } catch (error) {
        throw error;
      }
    }

    // CIDADÃO SEM FCDT
    async cidadaoSemFcdt(p1) {
      try {
        const result = await super.getDimVinculo('cidadao_sem_fcdt', p1);
        return result;
      } catch (error) {
        throw(error);
      }
    };

    // CIDADÃO SEM FCI
    async cidadaoSemFci (p1) {
      try {
        const result = await super.getDimVinculo('cidadao_sem_fci', p1);
        return result;        
      } catch (error) {
        throw(error);
      }
    };

    async getListarAcsEquuipe() {
      try {
        const result = await super.getListarAcsEquuipe('fci_desatualizada');
        return result;
      } catch (error) {
        throw(error)
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