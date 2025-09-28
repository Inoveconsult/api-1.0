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

  async indicadorIVCF20(p1, p2) {
    try {
      const result = await super.getIvcf('resumo_ivcf', p1, p2);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async listarIVCF20(p1, p2) {
    try {
      const result = await super.getIvcf('LISTA_IDOSOS_IVCF', p1, p2);
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

    async geolocalizacaoDomiciliar(p1, p2) {
      try {
        const result = await super.getMensal('geolocalizacao_domiciliar', p1, p2);
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

    async pseNovo(p1, p2, p3){
      try {
        const result = await super.getAll('pse_novo', p1, p2, p3);
        return result;        
      } catch (error) {
        
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
    async fciDesatualizada(p1, p2, p3){
      try {
        const result = await super.getDesatualizadoAcs('fci_desatualizada', p1, p2, p3);
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

    //INDICADORES DE QUALIDADE APS
    async maisAcessoAps(p1) {
      try {
        const result = await super.getIndicadorMaisAcesso('mais_acesso_novo', p1);
        return result;
      } catch (error) {
        throw error;
      }
    }
    async resumoMaisAcesso(p1, p2) {
      try {
        const result = await super.getIndicadoresMQuadrimestres('resumo_mais_acesso_aps', p1, p2)
        return result;
      } catch (error) {
        throw error;        
      }
    }

    async populacaoIndicador(p1, p2) {
      try {
        const result = await super.getIndicadoresQuadrimestres('populacao_indicador', p1, p2)
        return result;
      } catch (error) {
        throw error;
      }
    }

    async saudeSexual(p1, p2) {
      try {
        const result = await super.getIndicadoresQuadrimestres('saude_sexual', p1, p2)
        return result;
      } catch (error) {
        throw error;
      }
    }

    async desenInfantil(p1, p2) {
      try {
        const result = await super.getIndicadoresQuadrimestres('desenv_infantil', p1, p2)
        return result;
      } catch (error) {
        throw error;
      }
    }

    async resumoDesenvInfantil(p1) {
      try {
        const result = await super.getResumido('desenv_infantil_resumo', p1)
        return result;                
      } catch (error) {
        throw error
      }
    }   
  
};

export default apsRepository;