import baseRopository from "../baseRespository.js";

class odontoRepository extends baseRopository{

  //INDICADORES DE QUALIDADE //

   async primeiraConsultaProgramatica(p1, p2){
    try{
      const result = await super.getAllOdonto('primeira_consulta', p1, p2);
      return result;
    }catch(error){
      throw error;
    }
  };

  async totalTratamentoConcluido(p1, p2){
    try{
      const result = await super.getAllOdonto('tratamento_concluido', p1, p2);
      return result;
    }catch(error){
      throw error;
    }
  };

  async taxaExodontias(p1, p2){
    try{
      const result = await super.getAllOdonto('tx_exodontias', p1, p2);
      return result;
    }catch(error){
      throw error;
    }
  };

  async escovacaoSupervisionada(p1, p2){
    try{
      const result = await super.getAllOdonto('escovacao_supervisionada', p1, p2);
      return result;
    }catch(error){
      throw error;
    }
  };

   async procedimentoPreventivo(p1, p2){
    try{
      const result = await super.getAllOdonto('procedimento_preventivos', p1, p2);
      return result;
    }catch(error){
      throw error;
    }
  }; 

  async totalTRA(p1, p2){
    try{
      const result = await super.getAllOdonto('tra', p1, p2);
      return result;
    }catch(error){
      throw error;
    }
  };



 

  


  // INDICADORES GERAIS ODONTOLOGIA

  async prenatalOdontologico(p1, p2, p3){
    try{
      const result = await super.getAll('pre_natal_odontologico', p1, p2, p3);
      return result;
    }catch(error){
      throw error;
    }
  }

  async procedimentosOdontologicos(p1, p2, p3) {
    try {
      const result = await super.getAll('odonto_procedimentos', p1, p2, p3);
      return result;      
    } catch (error) {
      throw error;
    }
  }

  async vigilanciaSaudeBucal(p1, p2, p3) {
    try {
      const result = await super.getAll('vigilancia_bucal', p1, p2, p3);
      return result;      
    } catch (error) {
      throw error;
    }
  }
  async atendimentoGeral(p1, p2, p3){
    try{
      const result = await super.getAll('odonto_total_atendimento', p1, p2, p3);
      return result;
    }catch(error){
      throw error;
    }
  }

// ================================================================================

  async consultaAgendada(p1, p2, p3){
    try{
      const result = await super.getAll('consulta_agendada', p1, p2, p3)
      return result;
    }catch(error){
      throw error;
    }
  }

  async TipoDeConsulta(p1, p2, p3){
    try{
      const result = await super.getAll('odonto_tipo_consulta', p1, p2, p3)
      return result;
    }catch(error){
      throw error;
    }

  }

  async sexoOdonto(p1, p2, p3){
    try{
      const result = await super.getAll('sexo_odonto', p1, p2, p3);
      return result;
    }catch(error){
      throw error;
    }
  }

  async faixaEtaria(p1, p2, p3){
    try{
      const result = await super.getAll('odonto_fx_etaria_12', p1, p2, p3);
      return result;
    }catch(error){
      throw error;
    }
  }

  async pacientesEspeciais(p1, p2, p3){
    try {
      const result = await super.getAll('odonto_condicoes_saude', p1, p2, p3)
      return result;
    } catch (error) {
      throw error;
    }
  }

  async atendimentoDiario(p1, p2) {
    try {
      const result = await super.getMensal('odonto_atendimento_diario', p1, p2);
      return result;
    } catch (error) {
      throw error
    }
  }


 


  async atendimentoCid(){
    try{
      const result = await super.getAll('odonto_diagnostico_cid');
      return result;
    }catch(error){
      throw error;
    }
  };


  async atendimentoCiap(){
    try{
      const result =await super.getAll('odonto_diagnostico_ciap');
      return result;
    }catch(error){
      throw error;
    }
  }





  async atendimentoGestante(){
    try{
      const result = await super.getAll('atend_odonto_gestante');
      return result;
    }catch(error){
      throw error;
    }
  }

  async totalGestante(){
    try{
      const result = await super.getContagem('prenatal_odontologico');
      return result;
    }catch(error){
      throw error;
    }
  }
 
}

export default odontoRepository;