// functions.js

const functions = [
    //INDICADORES DE QUALIDADE

  {name:'Exodontias Permanente',
    definition:`create or replace function odonto_exodontias_permanente(
        p_equipe varchar default null,
        p_mes integer default null,
        p_ano integer default null)
        returns table (equipe varchar, procedimento varchar, total integer)
        as
        $$
        begin	
            return query
                SELECT 	  
                tde.no_equipe as nome,
                tdp.ds_proced as procedimento,
                COUNT(*):: integer as total
                FROM 
                    tb_fat_atend_odonto_proced tfaop 
                INNER JOIN 
                    tb_dim_equipe tde ON tde.co_seq_dim_equipe = tfaop.co_dim_equipe_1 
                INNER JOIN 
                    tb_dim_procedimento tdp ON tdp.co_seq_dim_procedimento = tfaop.co_dim_procedimento 
                WHERE (		       
                    tdp.co_proced = 'ABPO012' 
                        OR tdp.co_proced = '0414020138'
                    ) AND tfaop.co_dim_tempo >= '20240101' 
                and (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfaop.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)  
                AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfaop.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)     
                GROUP BY 
                    tde.no_equipe,
                    tde.nu_ine,
                    tdp.ds_proced;
        end;
        $$ language plpgsql;`
  },

  {name:'Trat Restaurador Atraumatico',
    definition: `create or replace function odonto_tra(
	p_equipe varchar default null,
	p_mes integer default null,
	p_ano integer default null)
    returns table (ine varchar, equipe varchar, total integer)
    language plpgsql
    as $$
    begin
        return query
        select 
        tde.nu_ine as ine,
        tde.no_equipe as equipe, 
        count(*)::INTEGER as total
        from tb_fat_atendimento_odonto tfao 
        inner join tb_fat_atend_odonto_proced tfaop on
        tfaop.co_fat_atd_odnt = tfao.co_seq_fat_atd_odnt 
        inner join tb_dim_procedimento tdp on
        tdp.co_seq_dim_procedimento = tfaop.co_dim_procedimento 
        inner join tb_dim_equipe tde on
        tde.co_seq_dim_equipe = tfao.co_dim_equipe_1 
        where tdp.co_proced = '0307010074' 
        and (p_equipe IS NULL OR tde.nu_ine = p_equipe)
        AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)  
        AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano) 
        AND tfao.co_dim_tempo >= '20240101' 
        group by tde.no_equipe, tde.nu_ine;	
    end;
    $$`
  },

  {name:'Primeira Consulta Odontologica',
    definition: `create or replace function odonto_primeira_consulta(
		p_equipe varchar default null,
		p_mes integer default null,
		p_ano integer default null)
        returns table (ine varchar, equipe varchar, total integer)
        language plpgsql
        as $$
        begin
            return query
            select
            tde.nu_ine as ine, 
            tde.no_equipe as equipe,
            count(tfao.co_dim_tipo_consulta)::integer as total
            from tb_fat_atendimento_odonto tfao 
            inner join tb_dim_tipo_consulta_odonto tdtco on
            tdtco.co_seq_dim_tipo_cnsulta_odonto = tfao.co_dim_tipo_consulta 
            inner join tb_dim_equipe tde on
            tde.co_seq_dim_equipe = tfao.co_dim_equipe_1 
            where tdtco.co_seq_dim_tipo_cnsulta_odonto = '1'
            and (p_equipe IS NULL OR tde.nu_ine = p_equipe)
            AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)  
            AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano) 
            and tfao.co_dim_tempo >= '20240101' 
            group by tde.no_equipe, tde.nu_ine;	
        end;
        $$`
  },

  {name: 'Tratamento Concluido',
    definition: `create or replace function odonto_tratamento_concluido(
	p_equipe varchar default null,
	p_mes integer default null,
	p_ano integer default null)
    returns table (ine varchar, equipe varchar, total integer)
    language plpgsql
    as $$
    begin
        return query
        select
        tde.nu_ine as ine, 
        tde.no_equipe as equipe,
        count(*)::integer as total
        from tb_fat_atendimento_odonto tfao 
        inner join tb_dim_equipe tde on
        tde.co_seq_dim_equipe = tfao.co_dim_equipe_1 
        where tfao.st_conduta_tratamento_concluid = 1 
        and tfao.co_dim_tempo >= '20240101' 
        and (p_equipe IS NULL OR tde.nu_ine = p_equipe)
        AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)  
        AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano) 
        group by tde.no_equipe, tde.nu_ine; 	
    end;
    $$`
  },

  {name:'Procedimentos Preventivos',
    definition: `create or replace function procedimentos_preventivos(
            p_equipe varchar default null,
            p_mes integer default null,
            p_ano integer default null)
        returns table (ine varchar, equipe varchar, cod_procedimento varchar, desc_procedimento varchar, total integer)
        language plpgsql
        as $$
        begin
            return query
            select 
                tde.nu_ine as ine,
                tde.no_equipe as equipe,
                tdp.co_proced as cod_procedimento,
                tdp.ds_proced as desc_procedimento,
                count(*)::integer as total
                from tb_fat_atend_odonto_proced tfaop 
                inner join tb_dim_procedimento tdp on
                tdp.co_seq_dim_procedimento = tfaop.co_dim_procedimento 
                inner join tb_dim_equipe tde on
                tde.co_seq_dim_equipe = tfaop.co_dim_equipe_1 
                where tdp.co_proced like '%0101020%' 
                and tfaop.co_dim_tempo >= '20240101'
                AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfaop.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)  
                AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfaop.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)  
                group by 
                    tde.nu_ine, 
                    tde.no_equipe,
                    tdp.co_proced,
                    tdp.ds_proced;	
        end;
        $$`
  },

  {name:'Escovação Supervisionada',
    definition: `create or replace function escovacao_supervisionada(
            p_equipe varchar default null,
            p_mes integer default null,
            p_ano integer default null)
            returns table (ine varchar, equipe varchar, cod_procedimento varchar, desc_procedimento varchar, total integer)
            language plpgsql
            as $$
            begin
                return query
                select 
                    tde.nu_ine as ine,
                    tde.no_equipe as equipe,
                    tdp.co_proced as cod_procedimento,
                    tdp.ds_proced as desc_procedimento,
                    count(*)::integer as total
                    from tb_fat_atend_odonto_proced tfaop 
                    inner join tb_dim_procedimento tdp on
                    tdp.co_seq_dim_procedimento = tfaop.co_dim_procedimento 
                    inner join tb_dim_equipe tde on
                    tde.co_seq_dim_equipe = tfaop.co_dim_equipe_1 
                    where tdp.co_proced = '0101020031'
                    and tfaop.co_dim_tempo >= '20240101'
                    AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                    AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfaop.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)  
                    AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfaop.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)  
                    group by 
                        tde.nu_ine, 
                        tde.no_equipe,
                        tdp.co_proced,
                        tdp.ds_proced;	
            end;
            $$`
  },
//-----------------------------------------------------------------//

// ----------------INDICADORES GERAIS ODONTOLOGIA ---------------- //

  {name:'Lista Atendimento Geral',
    definition:`create or replace function odonto_atendimentos_geral(
            p_equipe varchar default null,
            p_mes integer default null,
            p_ano integer default null)
            returns table (profissional varchar, cns varchar, cpf varchar, cidadao varchar, dt_nascimento varchar, dt_atendimento varchar)
            language plpgsql
            as $$
            begin
                return query
                select distinct
                tdp.no_profissional as profissional,
                cidadao.cns_cidadao::varchar as cns,
                cidadao.cpf_cidadao as cpf,
                cidadao.nome_cidadao as nome,
                to_char(to_date(cidadao.dt_nascimento::text, 'YYYY-MM-DD'), 'DD/MM/YYYY')::varchar as dt_nascimento, 
                to_char(to_date(tfao.co_dim_tempo::text, 'YYYYMMDD'), 'DD/MM/YYYY')::varchar as dt_atendimento
                from tb_fat_atendimento_odonto tfao
                inner join tb_dim_equipe tde on
                tde.co_seq_dim_equipe = tfao.co_dim_equipe_1
                inner join tb_dim_profissional tdp on
                tdp.co_seq_dim_profissional = tfao.co_dim_profissional_1 
                inner join (select distinct 
                fact.coDimEquipe as cod_equipe,
                tde.no_equipe as nome_equipe, 
                tb_fat_cidadao_pec.co_seq_fat_cidadao_pec  as cod_cidadao,
                tb_fat_cidadao_pec.no_cidadao as nome_cidadao,
                fact.nuCns as cns_cidadao,
                fact.cpf as cpf_cidadao,
                fact.noNomeMae as no_mome_mae,
                fact.dtNascimento as dt_nascimento,
                tb_dim_profissional.nu_cns as cns_profissional,
                tb_dim_profissional.no_profissional as nome_profissional    
                from
                    (
                        select distinct
                            tb_fat_cad_individual.co_dim_tipo_saida_cadastro as coDimTipoSaidaCadastro,
                            tb_fat_cad_individual.co_dim_equipe as coDimEquipe,
                            tb_fat_cad_individual.nu_cns as nuCns,
                            tb_fat_cad_individual.nu_cpf_cidadao as cpf,
                            tb_fat_cad_individual.co_fat_cidadao_pec as fciCidadaoPec,
                            tb_fat_cad_individual.co_dim_profissional as coDimProf,
                            cad_individual.no_mae_cidadao as noNomeMae,
                            tb_fat_cad_individual.dt_nascimento as dtNascimento
                        from
                            tb_fat_cad_individual tb_fat_cad_individual
                            join tb_dim_tipo_saida_cadastro tb_dim_tipo_saida_cadastro on tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro = tb_fat_cad_individual.co_dim_tipo_saida_cadastro
                            join tb_cds_cad_individual cad_individual on cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                        where
                            tb_fat_cad_individual.co_dim_cbo = 945 
                            --and tb_fat_cad_individual.co_dim_municipio in (select co_seq_dim_municipio from tb_dim_municipio where no_municipio = 'BRASÍLIA') --Nome do município
                            --and tb_fat_cad_individual.co_dim_unidade_saude in (select co_seq_dim_unidade_saude from tb_dim_unidade_saude where no_unidade_saude = 'Usf Jose Alves Teixeira') --Nome da unidade de saúde
                            and exists (
                                select
                                    1
                                from
                                    tb_fat_cidadao tb_fat_cidadao
                                where
                                    tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                    and (
                                        tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > (
                                            select
                                                to_char(CURRENT_DATE, 'YYYYMMDD') :: integer
                                        )
                                        and tb_fat_cidadao.co_dim_tempo <= (
                                            select
                                                to_char(CURRENT_DATE, 'YYYYMMDD') :: integer
                                        )
                                    )
                            )
                            and tb_fat_cad_individual.st_ficha_inativa = 0
                            and exists (
                                select
                                    1
                                from
                                    tb_fat_cidadao tb_fat_cidadao
                                    join tb_fat_cidadao tbFatCidadaoRaizz on tb_fat_cidadao.co_fat_cidadao_raiz = tbFatCidadaoRaizz.co_fat_cidadao_raiz
                                where
                                    tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                    and (
                                        tbFatCidadaoRaizz.co_dim_tempo_validade > (
                                            select
                                                to_char(CURRENT_DATE, 'YYYYMMDD') :: integer
                                        )
                                        and tbFatCidadaoRaizz.co_dim_tempo <= (
                                            select
                                                to_char(CURRENT_DATE, 'YYYYMMDD') :: integer
                                        )
                                    )
                                    and (
                                        tbFatCidadaoRaizz.st_vivo = 1
                                        and tbFatCidadaoRaizz.st_mudou = 0
                                    )
                            )
                            and tb_dim_tipo_saida_cadastro.nu_identificador = '-'
                    ) as fact
                    left join tb_dim_tipo_saida_cadastro tb_dim_tipo_saida_cadastro on fact.coDimTipoSaidaCadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    join tb_fat_cidadao_pec tb_fat_cidadao_pec on fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
                    join tb_dim_profissional tb_dim_profissional on fact.coDimProf = tb_dim_profissional.co_seq_dim_profissional
                    inner join tb_dim_equipe tde on
                    fact.coDimEquipe = tde.co_seq_dim_equipe) as cidadao on
                    cidadao.cod_cidadao = tfao.co_fat_cidadao_pec 
                    where tfao.co_dim_tempo >= '20240101'
                    AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                    AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)
                    AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)
                    ORDER BY dt_atendimento;
                    --and tdp.nu_cns = '	
            end;
            $$`

  },
  
  {name:'Total Atendimentos',
    definition: `create or replace function odonto_total_atendimento(
        p_equipe varchar default null,
        p_mes integer default null,
        p_ano integer default null)
        returns table (equipe varchar, total integer)
        language plpgsql
        as $$
        begin
            return query
            select 
            tde.nu_ine as equipe,
            count(co_seq_fat_atd_odnt)::integer as total
            from tb_fat_atendimento_odonto tfao
            inner join tb_dim_equipe tde on
                tde.co_seq_dim_equipe = tfao.co_dim_equipe_1 
            where tfao.co_dim_tempo >= '20240101'
            AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
            AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)
            AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)
            group by tde.nu_ine;		
        end;
        $$`
  },

  {name:'Atend. Demanda Espontanea',
    definition: `create or replace function demanda_espontanea(
            p_equipe varchar default null,
            p_mes integer default null,
            p_ano integer default null)
        returns table (equipe varchar, tipo_atendimento varchar, total integer)
        language plpgsql
        as $$
        begin
            return query
            select
                tde.nu_ine as equipe,
                tdta.ds_tipo_atendimento as tipo_atendimento,
                count(tfao.co_seq_fat_atd_odnt)::integer as total
                from tb_fat_atendimento_odonto tfao 
                inner join tb_dim_tipo_atendimento tdta on
                tdta.co_seq_dim_tipo_atendimento = tfao.co_dim_tipo_atendimento
                inner join tb_dim_equipe tde on
                tde.co_seq_dim_equipe = tfao.co_dim_equipe_1 
            where tfao.co_dim_tempo >= '20240101' 
                and tfao.co_dim_tipo_atendimento <> 3
                AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)
                AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)	
            group by tde.nu_ine, tdta.ds_tipo_atendimento, tfao.co_dim_tipo_atendimento;			
        end;
        $$`
  },

  {name: 'Atend. Agendada',
    definition:`create or replace function consulta_agendada(
        p_equipe varchar default null,
        p_mes integer default null,
        p_ano integer default null)
    returns table (equipe varchar, tipo_atendimento varchar, total integer)
    language plpgsql
    as $$
    begin
        return query
        select
            tde.nu_ine as equipe,
            tdta.ds_tipo_atendimento as tipo_atendimento,
            count(tfao.co_seq_fat_atd_odnt)::integer as total
            from tb_fat_atendimento_odonto tfao 
            inner join tb_dim_tipo_atendimento tdta on
            tdta.co_seq_dim_tipo_atendimento = tfao.co_dim_tipo_atendimento
            inner join tb_dim_equipe tde on
            tde.co_seq_dim_equipe = tfao.co_dim_equipe_1 
        where tfao.co_dim_tempo >= '20240101' 
            and tfao.co_dim_tipo_atendimento = 3
            AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
            AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)
            AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)	
        group by tde.nu_ine, tdta.ds_tipo_atendimento, tfao.co_dim_tipo_atendimento;			
    end;
    $$`
  },

  {name:'Tipo de Consulta_Odonto',
    definition: `create or replace function odonto_tipo_consulta(
	p_equipe varchar default null,
	p_mes integer default null,
	p_ano integer default null)
    returns table (equipe varchar, tipo_consulta varchar, total integer)
    language plpgsql
    as $$
    begin
        return query
        select 
        tde.nu_ine as equipe, 
        tdtco.ds_tipo_consulta_odonto as tipo_consulta,
        count(tfao.co_seq_fat_atd_odnt)::integer as total
        from tb_fat_atendimento_odonto tfao
        inner join tb_dim_tipo_consulta_odonto tdtco on
        tdtco.co_seq_dim_tipo_cnsulta_odonto = tfao.co_dim_tipo_consulta
        inner join tb_dim_equipe tde on
        tde.co_seq_dim_equipe = tfao.co_dim_equipe_1
        where co_dim_tempo >= '20240101'
        AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
        AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)
        AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)
        group by tde.nu_ine, tdtco.ds_tipo_consulta_odonto;	
    end;
    $$`
  },

  {name:'Atend. Odonto Sexo',
    definition: `create or replace function sexo_odonto(
	equipe VARCHAR default null,
	mes INTEGER default null,
	ano INTEGER default NULL)
    returns table (sexo VARCHAR, total integer)
    as
    $$
    begin
        return QUERY
        select tds.ds_sexo as sexo, count(*)::integer as total from tb_fat_atendimento_odonto tfao 
        inner join tb_dim_sexo tds on
        tfao.co_dim_sexo = tds.co_seq_dim_sexo 
        inner join tb_dim_equipe tde on
        tfao.co_dim_equipe_1 = tde.co_seq_dim_equipe
        where tfao.co_dim_tempo >= '20240101'
        AND (equipe IS NULL OR tde.nu_ine = equipe)
        AND (mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = mes)
        AND (ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = ano)
        group by tds.ds_sexo;	
    end;
    $$
    language plpgsql;`
  },

  {name:'Atendimento ate 12 anos',
    definition: `CREATE OR REPLACE FUNCTION odonto_fx_etaria_12(
    equipe VARCHAR DEFAULT NULL,
    mes INTEGER DEFAULT NULL,
    ano INTEGER DEFAULT NULL)
    RETURNS TABLE ("menor_1_ano" BIGINT, "_1ano" BIGINT, "_2anos" BIGINT, "_3anos" BIGINT, "_4anos" BIGINT, "_5anos" BIGINT, 
        "_6anos" BIGINT, "_7anos" BIGINT, "_8anos" BIGINT, "_9anos" BIGINT, "_10anos" BIGINT, "_11anos" BIGINT, "_12anos" BIGINT)
    AS
    $$
    BEGIN
        RETURN QUERY
        SELECT
            COUNT(*) FILTER (WHERE idade = 0) AS "< 1 ano",
            COUNT(*) FILTER (WHERE idade = 1) AS "1 ano",
            COUNT(*) FILTER (WHERE idade = 2) AS "2 anos",
            COUNT(*) FILTER (WHERE idade = 3) AS "3 anos",
            COUNT(*) FILTER (WHERE idade = 4) AS "4 anos",
            COUNT(*) FILTER (WHERE idade = 5) AS "5 anos",
            COUNT(*) FILTER (WHERE idade = 6) AS "6 anos",
            COUNT(*) FILTER (WHERE idade = 7) AS "7 anos",
            COUNT(*) FILTER (WHERE idade = 8) AS "8 anos",
            COUNT(*) FILTER (WHERE idade = 9) AS "9 anos",
            COUNT(*) FILTER (WHERE idade = 10) AS "10 anos",
            COUNT(*) FILTER (WHERE idade = 11) AS "11 anos",
            COUNT(*) FILTER (WHERE idade = 12) AS "12 anos"
        FROM (
            SELECT EXTRACT(YEAR FROM AGE(TO_DATE(CAST(co_dim_tempo AS TEXT), 'YYYYMMDD'), dt_nascimento))::INTEGER AS idade
            FROM tb_fat_atendimento_odonto tfao
            INNER JOIN tb_dim_equipe tde ON tfao.co_dim_equipe_1 = tde.co_seq_dim_equipe
            WHERE EXTRACT(YEAR FROM AGE(TO_DATE(CAST(co_dim_tempo AS TEXT), 'YYYYMMDD'), dt_nascimento))::INTEGER <= 12
                AND tfao.co_dim_tempo >= '20240101'
                AND (equipe IS NULL OR tde.nu_ine = equipe)
                AND (mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = mes)
                AND (ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = ano)
        ) AS subquery;
    END;
    $$
    LANGUAGE plpgsql;`
  },

  {name:'Procedimentos Realizados Odonto',
    definition: `create or replace function odonto_procedimentos(
        p_equipe varchar default null,
        p_mes integer default null,
        p_ano integer default null)
    returns table ( codigo varchar, procedimento varchar, total integer)
    language plpgsql
    as $$
    begin
        return query
            select 
                tdp.co_proced::varchar as codigo,
                tdp.ds_proced as procedimento,
                sum(tfaop.qt_procedimentos)::integer as total
            from 
                tb_fat_atend_odonto_proced tfaop
                inner join tb_fat_atendimento_odonto tfao on tfao.co_seq_fat_atd_odnt = tfaop.co_fat_atd_odnt 
                inner join tb_dim_equipe tde on tde.co_seq_dim_equipe = tfao.co_dim_equipe_1 
                inner join tb_dim_procedimento tdp on tdp.co_seq_dim_procedimento = tfaop.co_dim_procedimento
            where 
                tfaop.co_dim_tempo >= '20240101' 
                and tdp.co_proced not like '%0301010%' 
                and tdp.co_proced not like '%03010600%' 
                and tdp.co_proced not like '%01010201%'
                and tdp.co_proced not like '%ABPG042%' 
                AND (tfaop.co_dim_cbo_1 = 960 or tfaop.co_dim_cbo_1 = 1224 or tfaop.co_dim_cbo_1 = 1165)
                AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfaop.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)
                AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfaop.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)  
            group by
                tdp.co_proced,
                tdp.ds_proced
            order by total desc
            limit 10;
    end;
    $$;`
  },

  {name: 'Atendimento Diario',
    definition: `create or replace function odonto_atendimento_diario(
            p_mes integer default null,
            p_ano integer default null)
        returns table(
            equipe varchar, 
            profissional varchar, 
            _1 bigint, _2 bigint, _3 bigint, _4 bigint, _5 bigint, _6 bigint, _7 bigint, _8 bigint, _9 bigint,
            _10 bigint, _11 bigint, _12 bigint, _13 bigint, _14 bigint, _15 bigint, _16 bigint, _17 bigint, _18 bigint, 
            _19 bigint, _20 bigint, _21 bigint, _22 bigint, _23 bigint, _24 bigint, _25 bigint, _26 bigint, _27 bigint, _28 bigint,
            _29 bigint, _30 bigint, _31 bigint, total bigint)
        language plpgsql
        as $$
        declare
            v_mes integer;
            v_ano integer;
            v_dias_no_mes integer;
        begin
            -- Se os parâmetros de mês e ano forem nulos, calculamos o mês e ano do mês passado
            if p_mes is null or p_ano is null then
                select EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE)
                into v_mes, v_ano;
            else
                v_mes := p_mes;
                v_ano := p_ano;
            end if;

            -- Calcula a quantidade de dias no mês escolhido
            select EXTRACT(day FROM (DATE_TRUNC('month', TO_DATE(v_ano || '-' || v_mes || '-01', 'YYYY-MM-DD') + INTERVAL '1 month') - INTERVAL '1 day'))
            into v_dias_no_mes;

            return query
            select dias.no_equipe, dias.no_profissional,
                count(*) FILTER (where DIA = 1) as "_1",
                count(*) FILTER (where DIA = 2) as "_2",
                count(*) FILTER (where DIA = 3) as "_3",
                count(*) FILTER (where DIA = 4) as "_4",
                count(*) FILTER (where DIA = 5) as "_5",
                count(*) FILTER (where DIA = 6) as "_6",
                count(*) FILTER (where DIA = 7) as "_7",
                count(*) FILTER (where DIA = 8) as "_8",
                count(*) FILTER (where DIA = 9) as "_9",
                count(*) FILTER (where DIA = 10) as "_10",
                count(*) FILTER (where DIA = 11) as "_11",
                count(*) FILTER (where DIA = 12) as "_12",
                count(*) FILTER (where DIA = 13) as "_13",
                count(*) FILTER (where DIA = 14) as "_14",
                count(*) FILTER (where DIA = 15) as "_15",
                count(*) FILTER (where DIA = 16) as "_16",
                count(*) FILTER (where DIA = 17) as "_17",
                count(*) FILTER (where DIA = 18) as "_18",
                count(*) FILTER (where DIA = 19) as "_19",
                count(*) FILTER (where DIA = 20) as "_20",
                count(*) FILTER (where DIA = 21) as "_21",
                count(*) FILTER (where DIA = 22) as "_22",
                count(*) FILTER (where DIA = 23) as "_23",
                count(*) FILTER (where DIA = 24) as "_24",
                count(*) FILTER (where DIA = 25) as "_25",
                count(*) FILTER (where DIA = 26) as "_26",
                count(*) FILTER (where DIA = 27) as "_27",
                count(*) FILTER (where DIA = 28) as "_28",
                case when v_dias_no_mes >= 29 then count(*) FILTER (where DIA = 29) else null end as "_29",
                case when v_dias_no_mes >= 30 then count(*) FILTER (where DIA = 30) else null end as "_30",
                case when v_dias_no_mes = 31 then count(*) FILTER (where DIA = 31) else null end as "_31",
                count(*) as total
            from (
                select tde.no_equipe, tdp.no_profissional, 
                    EXTRACT(DAY FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) as DIA
                from tb_fat_atendimento_odonto tfao 
                inner join tb_dim_profissional tdp on tdp.co_seq_dim_profissional = tfao.co_dim_profissional_1
                inner join tb_dim_equipe tde on tde.co_seq_dim_equipe = tfao.co_dim_equipe_1
                where tdp.st_registro_valido = 1 
                and tfao.co_dim_cbo_1 = 960 
                and tfao.co_dim_tempo >= '20240101'
                AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = v_mes)
                AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = v_ano)
            ) as dias
            group by dias.no_equipe, dias.no_profissional;
        end;
        $$;`
  },

  {name: 'Vigilancia Saude Bucal',
    definition: `create or replace function vigilancia_bucal(
        p_equipe varchar default null,
        p_mes integer default null,
        p_ano integer default null)
        returns table (equipe varchar, abscesso_dentoalveola varchar, alterac_tecidos_moles varchar, fendas_fissuras_labio varchar,
                        dor_dente varchar, fluorose_dentaria varchar, traumat_dentoalveolar varchar, nao_identificado varchar)
        language plpgsql
        as $$
        begin
            return query
            select 
                tde.nu_ine,
                SUM(CASE WHEN st_vigil_abscesso_dentoalveola > 0 THEN 1 ELSE 0 END)::varchar AS abscesso_dentoalveola,
                --
                SUM(CASE WHEN st_vigil_alterac_tecidos_moles > 0 THEN 1 ELSE 0 END)::varchar AS alterac_tecidos_moles,
                ---
                SUM(CASE WHEN st_vigil_fendas_fissuras_labio > 0 THEN 1 ELSE 0 END)::varchar AS fendas_fissuras_labio,
                --
                SUM(CASE WHEN st_vigil_dor_dente > 0 THEN 1 ELSE 0 END)::varchar as dor_dente,
                --
                SUM(CASE WHEN st_vigil_fluorose_dentaria > 0 THEN 1 ELSE 0 END)::varchar AS fluorose_dentaria,
                -- 
                SUM(CASE WHEN st_vigil_traumat_dentoalveolar > 0 THEN 1 ELSE 0 END)::varchar AS traumat_dentoalveolar,
                -- 
                SUM(CASE WHEN st_vigil_nao_identificado > 0 THEN 1 ELSE 0 END)::varchar AS nao_identificado
            FROM 
                tb_fat_atendimento_odonto tfao    
            inner join tb_dim_equipe tde on tde.co_seq_dim_equipe = tfao.co_dim_equipe_1 
            where tfao.co_dim_tempo >= 	'20240101'
                AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)
                AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)		
            --and tde.nu_ine = '0001984675'
            group by
                tde.nu_ine;
        end;
        $$`
  },

  {name: 'Condições de Saúde', 
    definition: `create or replace function odonto_condicoes_saude(
        p_equipe varchar default null,
        p_mes integer default null,
        p_ano integer default null)
    returns table (equipe varchar, gestantes varchar, pac_especial varchar)
    language plpgsql
    as $$
    begin
        return query
        select 
            tde.nu_ine as equipe,
            SUM(case when st_gestante > 0 then 1 else 0 END)::VARCHAR as GESTANTES,
            SUM(case when st_paciente_necessidades_espec > 0 then 1 else 0 END)::VARCHAR as PAC_NECES_ESPECIAIS
        from tb_fat_atendimento_odonto tfao
        inner join tb_dim_equipe tde on tde.co_seq_dim_equipe = tfao.co_dim_equipe_1
        where tfao.co_dim_tempo >= '20240101'
            AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
            AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)
            AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano)		
        group by
            tde.nu_ine;
    end;
    $$`
  },

  /*------------------INDICADORES DE VINCULO -----------*/
  {name: 'Cidadao Vinculado',
    definition: `CREATE OR REPLACE FUNCTION cidadao_vinculado(
        p_equipe varchar DEFAULT NULL,
        p_data date DEFAULT NULL)
    RETURNS TABLE(cidadao_vinculado integer)
    LANGUAGE plpgsql
    AS $$
    declare
        v_data varchar;
    begin
        -- Se p_data for fornecida, converte para o formato 'YYYYMMDD', caso contrário, usa a data atual
        if p_data is not null then
            v_data := to_char(p_data, 'YYYYMMDD');
        else
            v_data := to_char(CURRENT_DATE, 'YYYYMMDD');
        end if;
        return query
        select count(*)::integer as cidadao_vinculado
        from (
            select
                tde.nu_ine ine_equipe, 
                tb_fat_cidadao_pec.co_seq_fat_cidadao_pec  as cod_cidadao,
                tb_fat_cidadao_pec.no_cidadao as nome_cidadao,
                fact.nuCns as cns_cidadao,
                fact.cpf as cpf_cidadao,
                fact.noNomeMae as no_mome_mae,
                fact.dtNascimento as dt_nascimento		
            from
                (
                    select
                        tb_fat_cad_individual.co_dim_tipo_saida_cadastro as coDimTipoSaidaCadastro,
                        tb_fat_cad_individual.co_dim_equipe as coDimEquipe,
                        tb_fat_cad_individual.nu_cns as nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao as cpf,
                        tb_fat_cad_individual.co_fat_cidadao_pec as fciCidadaoPec,
                        tb_fat_cad_individual.co_dim_profissional as coDimProf,
                        cad_individual.no_mae_cidadao as noNomeMae,
                        tb_fat_cad_individual.dt_nascimento as dtNascimento					
                    from
                        tb_fat_cad_individual tb_fat_cad_individual
                        join tb_dim_tipo_saida_cadastro tb_dim_tipo_saida_cadastro on tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro = tb_fat_cad_individual.co_dim_tipo_saida_cadastro
                        join tb_cds_cad_individual cad_individual on cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    where
                        tb_fat_cad_individual.co_dim_cbo = 945 
                        and exists (
                            select
                                1
                            from
                                tb_fat_cidadao tb_fat_cidadao
                            where
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                -- Substituição por v_data convertido para bigint
                                and tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > v_data::bigint
                                and tb_fat_cidadao.co_dim_tempo <= v_data::bigint
                        )
                        and tb_fat_cad_individual.st_ficha_inativa = 0
                    and exists (
                        select
                            1
                        from
                            tb_fat_cidadao tb_fat_cidadao
                            join tb_fat_cidadao tbFatCidadaoRaizz on tb_fat_cidadao.co_fat_cidadao_raiz = tbFatCidadaoRaizz.co_fat_cidadao_raiz
                        where
                            tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                            and (
                                tbFatCidadaoRaizz.co_dim_tempo_validade > v_data::bigint
                                and tbFatCidadaoRaizz.co_dim_tempo <= v_data::bigint
                            and (
                                tbFatCidadaoRaizz.st_vivo = 1
                                and tbFatCidadaoRaizz.st_mudou = 0
                            )
                    ))
                    and tb_dim_tipo_saida_cadastro.nu_identificador = '-') as fact
            left join tb_dim_tipo_saida_cadastro tb_dim_tipo_saida_cadastro on fact.coDimTipoSaidaCadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
            join tb_fat_cidadao_pec tb_fat_cidadao_pec on fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
            join tb_dim_profissional tb_dim_profissional on fact.coDimProf = tb_dim_profissional.co_seq_dim_profissional
            inner join tb_dim_equipe tde on fact.coDimEquipe = tde.co_seq_dim_equipe
            where p_equipe is null or tde.nu_ine = p_equipe
        ) as vinculados;
    end;
    $$`
  },

  {name:'Criancas ate 5 anos',
    definition: `CREATE OR REPLACE FUNCTION crianca_ate_5_anos(
        p_equipe varchar DEFAULT NULL,
        p_data date DEFAULT NULL)
    RETURNS TABLE(criancas integer)
    LANGUAGE plpgsql
    AS $$
    declare
        v_data varchar;
    begin
        -- Se p_data for fornecida, converte para o formato 'YYYYMMDD', caso contrário, usa a data atual
        if p_data is not null then
            v_data := to_char(p_data, 'YYYYMMDD');
        else
            v_data := to_char(CURRENT_DATE, 'YYYYMMDD');
        end if;
        return query
        select count(*)::integer as cidadao_vinculado
        from (
        select
        fact.coDimEquipe,
        fact.ine as ine,
        tb_fat_cidadao_pec.no_cidadao as nome_cidadao,
        fact.nuCns as cns_cidadao,
        fact.cpf as cpf_cidadao,
        fact.noNomeMae as no_mome_mae,
        fact.dtNascimento as dt_nascimento,
        fact.idade as idade,
        tb_dim_profissional.nu_cns as cns_profissional,
        tb_dim_profissional.no_profissional as nome_profissional       
    from
        (
            select
                tb_fat_cad_individual.co_dim_tipo_saida_cadastro as coDimTipoSaidaCadastro,
                tb_fat_cad_individual.nu_cns as nuCns,
                tb_fat_cad_individual.nu_cpf_cidadao as cpf,
                tb_fat_cad_individual.co_fat_cidadao_pec as fciCidadaoPec,
                tb_fat_cad_individual.co_dim_profissional as coDimProf,
                cad_individual.no_mae_cidadao as noNomeMae,
                tb_fat_cad_individual.dt_nascimento as dtNascimento,
                EXTRACT(YEAR FROM AGE(to_date(CURRENT_DATE::text, 'YYYY-MM-DD'), TO_DATE(CAST(tb_fat_cad_individual.dt_nascimento AS TEXT), 'YYYY-MM-DD')))::INTEGER AS idade,
                tde.co_seq_dim_equipe as coDimEquipe,    
                tde.nu_ine as ine
            from
                tb_fat_cad_individual tb_fat_cad_individual
                join tb_dim_tipo_saida_cadastro tb_dim_tipo_saida_cadastro on tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro = tb_fat_cad_individual.co_dim_tipo_saida_cadastro
                join tb_cds_cad_individual cad_individual on cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                join tb_dim_equipe tde on tde.co_seq_dim_equipe = tb_fat_cad_individual.co_dim_equipe
            where
                
                tb_fat_cad_individual.co_dim_cbo = 945 
                and exists (
                            select
                                1
                            from
                                tb_fat_cidadao tb_fat_cidadao
                            where
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                -- Substituição por v_data convertido para bigint
                                and tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > v_data::bigint
                                and tb_fat_cidadao.co_dim_tempo <= v_data::bigint
                        )
                    and tb_fat_cad_individual.st_ficha_inativa = 0
                    and exists (
                        select
                            1
                        from
                            tb_fat_cidadao tb_fat_cidadao
                            join tb_fat_cidadao tbFatCidadaoRaizz on tb_fat_cidadao.co_fat_cidadao_raiz = tbFatCidadaoRaizz.co_fat_cidadao_raiz
                        where
                            tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                            and (
                                tbFatCidadaoRaizz.co_dim_tempo_validade > v_data::bigint
                                and tbFatCidadaoRaizz.co_dim_tempo <= v_data::bigint
                            and (
                                tbFatCidadaoRaizz.st_vivo = 1
                                and tbFatCidadaoRaizz.st_mudou = 0
                            )
                    ))
            and tb_dim_tipo_saida_cadastro.nu_identificador = '-') as fact
            left join tb_dim_tipo_saida_cadastro tb_dim_tipo_saida_cadastro on fact.coDimTipoSaidaCadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
            join tb_fat_cidadao_pec tb_fat_cidadao_pec on fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
            join tb_dim_profissional tb_dim_profissional on fact.coDimProf = tb_dim_profissional.co_seq_dim_profissional
            inner join tb_dim_equipe tde on fact.coDimEquipe = tde.co_seq_dim_equipe
            where (p_equipe is null or tde.nu_ine = p_equipe) and fact.idade <= 5
        ) as vinculados;
    end;
    $$`
  },

  {name: 'Idosos 60 anos ou +',
    definition: `CREATE OR REPLACE FUNCTION idosos_65_anos_mais(
        p_equipe varchar DEFAULT NULL,
        p_data date DEFAULT NULL)
    RETURNS TABLE(idosos integer)
    LANGUAGE plpgsql
    AS $$
    declare
        v_data varchar;
    begin
        -- Se p_data for fornecida, converte para o formato 'YYYYMMDD', caso contrário, usa a data atual
        if p_data is not null then
            v_data := to_char(p_data, 'YYYYMMDD');
        else
            v_data := to_char(CURRENT_DATE, 'YYYYMMDD');
        end if;
        return query
        select count(*)::integer as cidadao_vinculado
        from (
        select
        fact.coDimEquipe,
        fact.ine as ine,
        tb_fat_cidadao_pec.no_cidadao as nome_cidadao,
        fact.nuCns as cns_cidadao,
        fact.cpf as cpf_cidadao,
        fact.noNomeMae as no_mome_mae,
        fact.dtNascimento as dt_nascimento,
        fact.idade as idade,
        tb_dim_profissional.nu_cns as cns_profissional,
        tb_dim_profissional.no_profissional as nome_profissional 		      
    from
        (
            select
                tb_fat_cad_individual.co_dim_tipo_saida_cadastro as coDimTipoSaidaCadastro,
                tb_fat_cad_individual.nu_cns as nuCns,
                tb_fat_cad_individual.nu_cpf_cidadao as cpf,
                tb_fat_cad_individual.co_fat_cidadao_pec as fciCidadaoPec,
                tb_fat_cad_individual.co_dim_profissional as coDimProf,
                cad_individual.no_mae_cidadao as noNomeMae,
                tb_fat_cad_individual.dt_nascimento as dtNascimento,
                EXTRACT(YEAR FROM AGE(to_date(CURRENT_DATE::text, 'YYYY-MM-DD'), TO_DATE(CAST(tb_fat_cad_individual.dt_nascimento AS TEXT), 'YYYY-MM-DD')))::INTEGER AS idade,
                tde.co_seq_dim_equipe as coDimEquipe,    
                tde.nu_ine as ine
            from
                tb_fat_cad_individual tb_fat_cad_individual
                join tb_dim_tipo_saida_cadastro tb_dim_tipo_saida_cadastro on tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro = tb_fat_cad_individual.co_dim_tipo_saida_cadastro
                join tb_cds_cad_individual cad_individual on cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                join tb_dim_equipe tde on tde.co_seq_dim_equipe = tb_fat_cad_individual.co_dim_equipe
            where
                
                tb_fat_cad_individual.co_dim_cbo = 945 
                and exists (
                            select
                                1
                            from
                                tb_fat_cidadao tb_fat_cidadao
                            where
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                -- Substituição por v_data convertido para bigint
                                and tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > v_data::bigint
                                and tb_fat_cidadao.co_dim_tempo <= v_data::bigint
                        )
                    and tb_fat_cad_individual.st_ficha_inativa = 0
                    and exists (
                        select
                            1
                        from
                            tb_fat_cidadao tb_fat_cidadao
                            join tb_fat_cidadao tbFatCidadaoRaizz on tb_fat_cidadao.co_fat_cidadao_raiz = tbFatCidadaoRaizz.co_fat_cidadao_raiz
                        where
                            tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                            and (
                                tbFatCidadaoRaizz.co_dim_tempo_validade > v_data::bigint
                                and tbFatCidadaoRaizz.co_dim_tempo <= v_data::bigint
                            and (
                                tbFatCidadaoRaizz.st_vivo = 1
                                and tbFatCidadaoRaizz.st_mudou = 0
                            )
                    ))
            and tb_dim_tipo_saida_cadastro.nu_identificador = '-') as fact
            left join tb_dim_tipo_saida_cadastro tb_dim_tipo_saida_cadastro on fact.coDimTipoSaidaCadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
            join tb_fat_cidadao_pec tb_fat_cidadao_pec on fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
            join tb_dim_profissional tb_dim_profissional on fact.coDimProf = tb_dim_profissional.co_seq_dim_profissional
            inner join tb_dim_equipe tde on fact.coDimEquipe = tde.co_seq_dim_equipe
            where (p_equipe is null or tde.nu_ine = p_equipe) and fact.idade >= 60
        ) as vinculados;
    end;
    $$`
  },

  {name: 'FCI Atualiadas',
    definition:`CREATE OR REPLACE FUNCTION fci_atualizadas(
        equipe VARCHAR DEFAULT NULL, 
        p_data date default null)
    RETURNS TABLE (
        --ine VARCHAR,
        --nome_equipe VARCHAR,
        FCIs_novas INTEGER,
        FCIs_atualizadas INTEGER,
        recusas INTEGER)
    AS $$
    DECLARE
        v_data varchar;
    BEGIN
            -- Se p_data for fornecida, converte para o formato 'YYYYMMDD', caso contrário, usa a data atual
        if p_data is not null then
            v_data := to_char(p_data, 'YYYYMMDD');
        else
            v_data := to_char(CURRENT_DATE, 'YYYYMMDD');
        end if;
        RETURN QUERY
        SELECT
            --fact.ine,
            --fact.nome_equipe AS nome_equipe,
            COALESCE(SUM(CASE WHEN ((fact.nuCns != '0' OR fact.nuCpfCidadao != '0') AND (fact.stRecusaCadastro = 0 AND fact.nuUuidFicha = fact.nuUuidFichaOrigem)) THEN 1 ELSE 0 END), 0)::INTEGER AS FCIs_novas,
            COALESCE(SUM(CASE WHEN ((fact.nuCns != '0' OR fact.nuCpfCidadao != '0') AND (fact.stRecusaCadastro = 0 AND fact.nuUuidFicha != fact.nuUuidFichaOrigem)) THEN 1 ELSE 0 END), 0)::INTEGER AS FCIs_atualizadas,
            COALESCE(SUM(CASE WHEN (fact.nuCns = '0' AND fact.nuCpfCidadao = '0' AND (fact.stRecusaCadastro = 0 AND fact.nuUuidFicha != fact.nuUuidFichaOrigem)) THEN 1 ELSE 0 END), 0)::INTEGER AS recusas
        FROM (
            SELECT
                tfci.co_dim_cbo AS coDimCbo,
                tfci.co_dim_equipe AS coDimEquipe,
                tfci.co_dim_municipio AS coDimMunicipio,
                tfci.co_dim_profissional AS coDimProfissional,
                tde.no_equipe AS nome_equipe,
                tde.nu_ine::varchar as ine,	
                tfci.co_dim_unidade_saude AS coDimUnidadeSaude,
                tfci.co_seq_fat_cad_individual AS coSeqFatCadIndividual,
                tfci.nu_cns AS nuCns,
                tfci.nu_cpf_cidadao AS nuCpfCidadao,
                tfci.nu_micro_area AS nuMicroArea,
                tfci.nu_uuid_ficha AS nuUuidFicha,
                tfci.nu_uuid_ficha_origem AS nuUuidFichaOrigem,
                tfci.st_recusa_cadastro AS stRecusaCadastro,
                tfci.st_ficha_inativa AS inativa,
                tfci.co_dim_tempo_validade
            FROM
                tb_fat_cad_individual tfci
            JOIN 
                tb_dim_profissional tdp ON tdp.co_seq_dim_profissional = tfci.co_dim_profissional
            JOIN 
                tb_dim_equipe tde ON tde.co_seq_dim_equipe = tfci.co_dim_equipe
            JOIN 
                tb_dim_municipio tdm ON tdm.co_seq_dim_municipio = tfci.co_dim_municipio
            JOIN
                tb_dim_unidade_saude tdus ON tdus.co_seq_dim_unidade_saude = tfci.co_dim_unidade_saude
            JOIN 
                tb_dim_cbo tdc ON tdc.co_seq_dim_cbo = tfci.co_dim_cbo
            WHERE
                tfci.st_gerado_automaticamente = '0' 
                AND tfci.st_ficha_inativa = 0
                AND AGE(v_data::date, TO_DATE(tfci.co_dim_tempo_validade::TEXT, 'YYYYMMDD')) <= INTERVAL '6 MONTH'
        ) AS fact
        WHERE
            (equipe IS NULL OR fact.ine = equipe)
            AND TO_DATE(fact.co_dim_tempo_validade::TEXT, 'YYYYMMDD') <= v_data::date            
        GROUP BY 
            fact.ine,
            fact.nome_equipe
        ORDER BY
            fact.nome_equipe;
    END;
    $$ LANGUAGE plpgsql;`
  },

  /*------------------INDICADORES GERAIS APS ------------*/
  {name:'Atendimento Diario ESF',
    definition: `create or replace function atendimento_diario_aps(
        p_profissional varchar default null,
        p_mes integer default null,
        p_ano integer default null)
    returns table(
        equipe varchar, 
        profissional varchar, 
        _1 bigint, _2 bigint, _3 bigint, _4 bigint, _5 bigint, _6 bigint, _7 bigint, _8 bigint, _9 bigint,
        _10 bigint, _11 bigint, _12 bigint, _13 bigint, _14 bigint, _15 bigint, _16 bigint, _17 bigint, _18 bigint, 
        _19 bigint, _20 bigint, _21 bigint, _22 bigint, _23 bigint, _24 bigint, _25 bigint, _26 bigint, _27 bigint, _28 bigint,
        _29 bigint, _30 bigint, _31 bigint, total bigint)
    language plpgsql
    as $$
    declare
        v_mes integer;
        v_ano integer;
        v_dias_no_mes integer;
    begin
        -- Se os parâmetros de mês e ano forem nulos, calculamos o mês e ano do mês passado
        if p_mes is null or p_ano is null then
            select EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE)
            into v_mes, v_ano;
        else
            v_mes := p_mes;
            v_ano := p_ano;
        end if;

        -- Calcula a quantidade de dias no mês escolhido
        select EXTRACT(day FROM (DATE_TRUNC('month', TO_DATE(v_ano || '-' || v_mes || '-01', 'YYYY-MM-DD') + INTERVAL '1 month') - INTERVAL '1 day'))
        into v_dias_no_mes;

        return query
        select dias.no_equipe, dias.no_profissional,
            count(*) FILTER (where DIA = 1) as "_1",
            count(*) FILTER (where DIA = 2) as "_2",
            count(*) FILTER (where DIA = 3) as "_3",
            count(*) FILTER (where DIA = 4) as "_4",
            count(*) FILTER (where DIA = 5) as "_5",
            count(*) FILTER (where DIA = 6) as "_6",
            count(*) FILTER (where DIA = 7) as "_7",
            count(*) FILTER (where DIA = 8) as "_8",
            count(*) FILTER (where DIA = 9) as "_9",
            count(*) FILTER (where DIA = 10) as "_10",
            count(*) FILTER (where DIA = 11) as "_11",
            count(*) FILTER (where DIA = 12) as "_12",
            count(*) FILTER (where DIA = 13) as "_13",
            count(*) FILTER (where DIA = 14) as "_14",
            count(*) FILTER (where DIA = 15) as "_15",
            count(*) FILTER (where DIA = 16) as "_16",
            count(*) FILTER (where DIA = 17) as "_17",
            count(*) FILTER (where DIA = 18) as "_18",
            count(*) FILTER (where DIA = 19) as "_19",
            count(*) FILTER (where DIA = 20) as "_20",
            count(*) FILTER (where DIA = 21) as "_21",
            count(*) FILTER (where DIA = 22) as "_22",
            count(*) FILTER (where DIA = 23) as "_23",
            count(*) FILTER (where DIA = 24) as "_24",
            count(*) FILTER (where DIA = 25) as "_25",
            count(*) FILTER (where DIA = 26) as "_26",
            count(*) FILTER (where DIA = 27) as "_27",
            count(*) FILTER (where DIA = 28) as "_28",
            case when v_dias_no_mes >= 29 then count(*) FILTER (where DIA = 29) else null end as "_29",
            case when v_dias_no_mes >= 30 then count(*) FILTER (where DIA = 30) else null end as "_30",
            case when v_dias_no_mes = 31 then count(*) FILTER (where DIA = 31) else null end as "_31",
            count(*) as total
        from (
            select tde.no_equipe, tdp.no_profissional, 
                EXTRACT(DAY FROM TO_DATE(tfai.co_dim_tempo::TEXT, 'YYYYMMDD')) as DIA
            from tb_fat_atendimento_individual tfai 
            inner join tb_dim_profissional tdp on tdp.co_seq_dim_profissional = tfai.co_dim_profissional_1
            inner join tb_dim_equipe tde on tde.co_seq_dim_equipe = tfai.co_dim_equipe_1
            where
                CASE
                    WHEN p_profissional = '999' THEN tfai.co_dim_cbo_1 not in(943, 944)
                    WHEN p_profissional = '943' THEN tfai.co_dim_cbo_1 = 943
                    WHEN p_profissional = '944' THEN tfai.co_dim_cbo_1 = 944
                    ELSE p_profissional is null
                END
            AND tdp.st_registro_valido = 1 
            AND tfai.co_dim_tempo >= '20240101'
            AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfai.co_dim_tempo::TEXT, 'YYYYMMDD')) = v_mes)
            AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfai.co_dim_tempo::TEXT, 'YYYYMMDD')) = v_ano)
        ) as dias
        group by dias.no_equipe, dias.no_profissional;
    end;
    $$;`
  },
  
  /*------------------- GESTANTES ------------------------*/
  {name: 'PRENATAL ODONTOLOGICO',
    definition: `create or replace function pre_natal_odontologico(
         p_equipe varchar default null,
         p_mes integer default null,
         p_ano integer default null)
         returns table (equipe varchar, cpf varchar, cns varchar, nome varchar, data_nascimento varchar,
                         dum varchar, dpp varchar, ig varchar, data_atendimento varchar)
         language plpgsql
         as $$
         begin
             return query
             with cte_gestantes as (
             select         
                 tb_fat_cidadao_pec.co_seq_fat_cidadao_pec::INTEGER AS cod_cidadao,
                 tde.co_seq_dim_equipe,
                 fact.nuCns as cns_cidadao,
                 fact.cpf AS cpf_cidadao,
                 tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                 fact.sexo,
                 fact.dtNascimento AS data_nascimento,
                 MIN(COALESCE(sub.menor_data_dum, tfai.co_dim_tempo_dum)) AS dum,
                 ROW_NUMBER() OVER (	PARTITION BY tfai.co_fat_cidadao_pec ORDER BY MIN(COALESCE(sub.menor_data_dum, tfai.co_dim_tempo_dum))) AS linha            
             FROM
             (
                 SELECT
                     tb_fat_cad_individual.co_dim_tipo_saida_cadastro AS coDimTipoSaidaCadastro,
                     tb_fat_cad_individual.co_dim_equipe AS coDimEquipe,            
                     tb_fat_cad_individual.nu_cns AS nuCns,
                     tb_fat_cad_individual.nu_cpf_cidadao AS cpf,                        
                     tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                     tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                     tb_fat_cad_individual.co_dim_sexo as sexo,                      
                     tb_fat_cad_individual.dt_nascimento AS dtNascimento
                 FROM
                     tb_fat_cad_individual tb_fat_cad_individual
                 JOIN
                     tb_dim_tipo_saida_cadastro tb_dim_tipo_saida_cadastro ON tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro = tb_fat_cad_individual.co_dim_tipo_saida_cadastro
                 JOIN
                     tb_cds_cad_individual cad_individual ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                 WHERE
                     tb_fat_cad_individual.co_dim_cbo = 945 
                     AND EXISTS (
                         SELECT 1
                         FROM tb_fat_cidadao tb_fat_cidadao
                         WHERE
                             tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                             AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                             AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                     )
                     AND tb_fat_cad_individual.st_ficha_inativa = 0
                     AND EXISTS (
                         SELECT 1
                         FROM tb_fat_cidadao tb_fat_cidadao
                         JOIN tb_fat_cidadao tbFatCidadaoRaizz ON tb_fat_cidadao.co_fat_cidadao_raiz = tbFatCidadaoRaizz.co_fat_cidadao_raiz
                         WHERE
                             tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                             AND tbFatCidadaoRaizz.co_dim_tempo_validade > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                             AND tbFatCidadaoRaizz.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                             AND tbFatCidadaoRaizz.st_vivo = 1
                             AND tbFatCidadaoRaizz.st_mudou = 0
                     )
                     AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
             ) AS fact
             LEFT JOIN tb_dim_tipo_saida_cadastro tb_dim_tipo_saida_cadastro ON fact.coDimTipoSaidaCadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
             JOIN tb_fat_cidadao_pec tb_fat_cidadao_pec ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec    
             join tb_dim_sexo tds on
             tds.co_seq_dim_sexo = fact.sexo    
             LEFT JOIN tb_dim_equipe tde ON fact.coDimEquipe= tde.co_seq_dim_equipe
             inner join tb_fat_atendimento_individual tfai on tfai.co_fat_cidadao_pec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
             LEFT JOIN (
                 SELECT 
                     nu_cpf_cidadao, 
                     nu_cns, 
                     MIN(co_dim_tempo_dum) AS menor_data_dum
                 FROM 
                     tb_fat_atendimento_individual
                 WHERE 
                     co_dim_tempo_dum IS NOT NULL 
                     AND co_dim_tempo_dum != '30001231'
                 GROUP BY 
                     nu_cpf_cidadao, 
                     nu_cns
             ) sub ON 
                 tfai.nu_cpf_cidadao = sub.nu_cpf_cidadao 
                 AND tfai.nu_cns = sub.nu_cns
                 AND tfai.co_dim_tempo_dum = sub.menor_data_dum
             WHERE 
                 tfai.co_dim_tempo >= '20240101'
                 AND  (
                     tfai.ds_filtro_ciaps LIKE '%|ABP001|%' 
                 OR tfai.ds_filtro_ciaps IN ('|ABP001|', '|W03|', '|W05|', '|W29|', '|W71|', '|W78|', '|W79|', '|W80|', '|W84|', '|W85|')
                 OR tfai.ds_filtro_cids IN ('|O11|', '|O120|', '|O121|', '|O122|', '|O13|', '|O140|', '|O141|', '|O149|', '|O150|', '|O151|',
                                                         '|O159|', '|O16|', '|O200|', '|O208|', '|O209|', '|O210|', '|O211|', '|O212|', '|O218|', '|O219|', 
                                                         '|O220|', '|O221|', '|O222|', '|O223|', '|O224|', '|O225|', '|O228|', '|O229|', '|O230|', '|O231|',
                                                         '|O232|', '|O233|', '|O234|', '|O235|', '|O239|', '|O299|', '|O300|', '|O301|', '|O302|', '|O308|',
                                                         '|O309|', '|O311|', '|O312|', '|O318|', '|O320|', '|O321|', '|O322|', '|O323|', '|O324|', '|O325|', 
                                                         '|O326|', '|O328|', '|O329|', '|O330|', '|O331|', '|O332|', '|O333|', '|O334|', '|O335|', '|O336|', 
                                                         '|O337|', '|O338|', '|O752|', '|O753|', '|O990|', '|O991|', '|O992|', '|O993|', '|O994|', '|O240|',
                                                         '|O241|', '|O242|', '|O243|', '|O244|', '|O249|', '|O25|', '|O260|', '|O261|', '|O263|', '|O264|', 
                                                         '|O265|', '|O268|', '|O269|', '|O280|', '|O281|', '|O282|', '|O283|', '|O284|', '|O285|', '|O288|',
                                                         '|O289|', '|O290|', '|O291|', '|O292|', '|O293|', '|O294|', '|O295|', '|O296|', '|O298|', '|O009|',
                                                         '|O339|', '|O340|', '|O341|', '|O342|', '|O343|', '|O344|', '|O345|', '|O346|', '|O347|', '|O348|',
                                                         '|O349|', '|O350|', '|O351|', '|O352|', '|O353|', '|O354|', '|O355|', '|O356|', '|O357|', '|O358|',
                                                         '|O359|', '|O360|', '|O361|', '|O362|', '|O363|', '|O365|', '|O366|', '|O367|', '|O368|', '|O369|',
                                                         '|O40|', '|O410|', '|O411|', '|O418|', '|O419|', '|O430|', '|O431|', '|O438|', '|O439|', '|O440|',
                                                         '|O441|', '|O460|', '|O468|', '|O469|', '|O470|', '|O471|', '|O479|', '|O48|', '|O995|', '|O996|',
                                                         '|O997|', '|Z640|', '|O00|', '|O10|', '|O12|', '|O14|', '|O15|', '|O20|', '|O21|', '|O22|', '|O23|',
                                                         '|O24|', '|O26|', '|O28|', '|O29|', '|O30|', '|O31|', '|O32|', '|O33|', '|O34|', '|O35|', '|O36|',
                                                         '|O41|', '|O43|', '|O44|', '|O46|', '|O47|', '|O98|', '|Z321|', '|Z33|', '|Z340|', '|Z348|', '|Z349|',
                                                         '|Z34|', '|Z35|', '|Z350|', '|Z351|', '|Z352|', '|Z353|', '|Z354|', '|Z357|', '|Z358|', '|Z359|',
                                                         '|Z36|')                    
                 )
                 AND NOT EXISTS (
                     SELECT 1
                     FROM tb_fat_atendimento_individual tfai_sub
                     WHERE tfai_sub.co_fat_cidadao_pec = tfai.co_fat_cidadao_pec
                     AND (
                         tfai_sub.ds_filtro_ciaps LIKE '%|ABP002|%' 
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W18|%'
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W19|%' 
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W70|%'
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W82|%'
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W83|%'
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W90|%'
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W91|%'
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W92|%'
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W93|%'
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W94|%'
                         OR tfai_sub.ds_filtro_ciaps LIKE '%|W96|%'
                     )
                 )
                 AND (
                     tfai.ds_filtro_cids NOT LIKE '%|O02|%'
                     AND tfai.ds_filtro_cids NOT LIKE '%|O03|%'
                     AND tfai.ds_filtro_cids NOT LIKE '%|O04|%'
                     AND tfai.ds_filtro_cids NOT LIKE '%|O06|%'
                     AND tfai.ds_filtro_cids NOT LIKE '%|O07|%'
                     AND tfai.ds_filtro_cids NOT LIKE '%|O08|%'
                     AND tfai.ds_filtro_cids NOT LIKE '%|O09|%'
                     AND tfai.ds_filtro_cids NOT LIKE '%|O80|%'
                     AND tfai.ds_filtro_cids NOT LIKE '%|O82|%'
                 )
             group by
                     tfai.co_fat_cidadao_pec,
                     tb_fat_cidadao_pec.co_seq_fat_cidadao_pec,
                     tde.co_seq_dim_equipe,
                     fact.nuCns,
                     fact.cpf,
                     tb_fat_cidadao_pec.no_cidadao,
                     fact.sexo,
                     fact.dtNascimento
         ),
         cte_atend_odontologico AS (
             SELECT DISTINCT 
                 co_fat_cidadao_pec, 
                 co_dim_tempo, 
                 co_dim_equipe_1 
             FROM tb_fat_atendimento_odonto tfao
         )
         SELECT DISTINCT     
             tde.nu_ine AS ine,     
             cte_gestantes.cns_cidadao::VARCHAR as cns, 
             cte_gestantes.cpf_cidadao::VARCHAR as cpf, 
             cte_gestantes.nome_cidadao, 
             TO_CHAR(TO_DATE(cte_gestantes.data_nascimento::text, 'YYYY-MM-DD'), 'DD/MM/YYYY')::VARCHAR data_nascimento,
             TO_CHAR(TO_DATE(cte_gestantes.dum::text, 'YYYYMMDD'),'DD/MM/YYYY')::VARCHAR AS DUM,
             TO_CHAR((TO_DATE(cte_gestantes.dum::text, 'YYYYMMDD') + INTERVAL '280 days'),'DD/MM/YYYY')::VARCHAR AS dpp,
             GREATEST(FLOOR((TO_DATE(cte_atend_odontologico.co_dim_tempo::TEXT, 'YYYYMMDD') - TO_DATE(cte_gestantes.dum::TEXT, 'YYYYMMDD')) / 7), 0)::VARCHAR AS ig,
             TO_CHAR(TO_DATE(cte_atend_odontologico.co_dim_tempo::text, 'YYYYMMDD'), 'DD/MM/YYYY')::VARCHAR AS data_atendimento
         FROM 
             cte_atend_odontologico
         JOIN cte_gestantes ON 
             cte_gestantes.cod_cidadao = cte_atend_odontologico.co_fat_cidadao_pec
             AND cte_gestantes.linha = 1 -- Mantém apenas o primeiro registro por paciente
         JOIN tb_dim_equipe tde ON 
             tde.co_seq_dim_equipe = cte_gestantes.co_seq_dim_equipe
         WHERE 
             cte_atend_odontologico.co_dim_tempo >= '20240101'
             AND (
                 (cte_gestantes.dum <= cte_atend_odontologico.co_dim_tempo AND cte_gestantes.dum IS NOT NULL AND cte_gestantes.dum != '30001231')
                 OR cte_gestantes.dum IS NULL
                 OR cte_gestantes.dum = '30001231')
             AND GREATEST(FLOOR((TO_DATE(cte_atend_odontologico.co_dim_tempo::TEXT, 'YYYYMMDD') - TO_DATE(cte_gestantes.dum::TEXT, 'YYYYMMDD')) / 7), 0) <= 42
                 AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                 AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(cte_atend_odontologico.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)
                 AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(cte_atend_odontologico.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano);		
         end;
         $$`
   }
   /*-----------------------------------------------------*/
];

export default functions;