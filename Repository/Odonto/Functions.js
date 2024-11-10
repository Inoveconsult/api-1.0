// functions.js

const functions = [
    //INDICADORES DE QUALIDADE ODONTOLOGIA

    {
        name: 'Exodontias Permanente',
        definition: `create or replace function odonto_exodontias_permanente(
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

    {
        name: 'Trat Restaurador Atraumatico',
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

    {
        name: 'Primeira Consulta Odontologica',
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

    {
        name: 'Tratamento Concluido',
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

    {
        name: 'Procedimentos Preventivos',
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

    {
        name: 'Escovação Supervisionada',
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

    {
        name: 'Lista Atendimento Geral',
        definition: `create or replace function odonto_atendimentos_geral(
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

    {
        name: 'Total Atendimentos',
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

    {
        name: 'Atend. Demanda Espontanea',
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

    {
        name: 'Atend. Agendada',
        definition: `create or replace function consulta_agendada(
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

    {
        name: 'Tipo de Consulta_Odonto',
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

    {
        name: 'Atend. Odonto Sexo',
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

    {
        name: 'Atendimento ate 12 anos',
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

    {
        name: 'Procedimentos Realizados Odonto',
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
                AND (tfaop.co_dim_cbo_1 in (439, 440, 460, 461,960, 1165, 8908))
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

    {
        name: 'Atendimento Diario',
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
            and tfao.co_dim_cbo_1 in (439, 461, 960, 8908)
            and tfao.co_dim_tempo >= '20240101'
            AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = v_mes)
            AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfao.co_dim_tempo::TEXT, 'YYYYMMDD')) = v_ano)
        ) as dias
        group by dias.no_equipe, dias.no_profissional;
    end;
    $$;`
    },

    {
        name: 'Vigilancia Saude Bucal',
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

    {
        name: 'Condições de Saúde',
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
    {
        name: 'Cidadao Vinculado',
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
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892) --or  tb_fat_cad_individual.co_dim_cbo = 945 or tb_fat_cad_individual.co_dim_cbo = 395
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

    {
        name: 'Criancas ate 5 anos',
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
                tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892) --or  tb_fat_cad_individual.co_dim_cbo = 945 or tb_fat_cad_individual.co_dim_cbo = 395
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
    

    {
        name: 'Idosos 60 anos ou +',
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
                tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892) --or  tb_fat_cad_individual.co_dim_cbo = 945 or tb_fat_cad_individual.co_dim_cbo = 395
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

    {
        name: 'FCI Atualiadas',
        definition: `CREATE OR REPLACE FUNCTION fci_atualizadas(
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

    {name: 'Bolsa Familia',
        definition: `create or replace function bolsa_familia(
                p_equipe varchar default null)
            returns table(bolsa_familia integer)
            language plpgsql
            as $$
            begin
                return query
                select COUNT(*)::integer as pbf from (select tcbf.co_seq_cidadao_bolsa_familia, tcbf.no_cidadao, nu_documento, tp_documento,
                        ROW_NUMBER() OVER (
                            PARTITION BY tcbf.no_cidadao 
                            order by tcbf.no_cidadao asc
                        ) AS rn
                    from tb_cidadao_bolsa_familia tcbf
                    inner join tb_fat_cidadao_pec tfcp on tfcp.nu_cpf_cidadao = tcbf.nu_documento or tfcp.nu_cns = tcbf.nu_documento 	
                    inner join tb_dim_equipe tde on tde.co_seq_dim_equipe = tfcp.co_dim_equipe_vinc
                    where p_equipe is null or tde.nu_ine = p_equipe) as query_pbf;
            end;
            $$`
    },

    /*------------------INDICADORES GERAIS APS ------------*/
    {
        name: 'Atendimento Diario ESF',
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
                    WHEN p_profissional = '999' THEN tfai.co_dim_cbo_1 not in(391, 392, 458, 465, 943, 944, 8890, 8891)
                    WHEN p_profissional in ('238', '391', '458', '943', '8890') THEN tfai.co_dim_cbo_1 in (238, 391, 458, 943, 8890)
                    WHEN p_profissional in ('239', '392', '465', '944', '8891') THEN tfai.co_dim_cbo_1 in (239, 392, 465, 944, 8891)
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

    {
        name: 'Visita Domiciliar',
        definition: `create or replace function visita_domiciliar_diaria(
        p_equipe varchar default null,
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
                EXTRACT(DAY FROM TO_DATE(tfvd.co_dim_tempo::TEXT, 'YYYYMMDD')) as DIA
            from tb_fat_visita_domiciliar tfvd
            inner join tb_dim_profissional tdp on tdp.co_seq_dim_profissional = tfvd.co_dim_profissional
            inner join tb_dim_equipe tde on tde.co_seq_dim_equipe = tfvd.co_dim_equipe
            where
            tdp.st_registro_valido = 1 
            AND tfvd.co_dim_tempo >= '20240101'
            AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)	
            AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfvd.co_dim_tempo::TEXT, 'YYYYMMDD')) = v_mes)
            AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfvd.co_dim_tempo::TEXT, 'YYYYMMDD')) = v_ano)
        ) as dias
        group by dias.no_equipe, dias.no_profissional;
    end;
    $$;`
    },

    {
        name: 'Cadastro Domiciliar',
        definition: `create or replace function cadastro_domiciliar(
        p_profissional varchar default null,
        p_equipe varchar default null)
    returns table(georreferenciado bigint, nao_georreferenciado integer, total integer, percetual_georreferenciado numeric,
                percetual_nao_georreferenciado numeric)
    language plpgsql
    as $$
    begin 
        return query
        WITH domicilios_localizados AS (
        SELECT COUNT(*) AS total_localizados  
        FROM tb_fat_cad_domiciliar tfcd
        join tb_cds_domicilio tcd on
        tcd.co_unico_domicilio = tfcd.nu_uuid_ficha_origem
        JOIN tb_dim_profissional tdp 
        ON tdp.co_seq_dim_profissional = tfcd.co_dim_profissional and tdp.st_registro_valido = 1
        JOIN tb_dim_equipe tde 
        ON tde.co_seq_dim_equipe = tfcd.co_dim_equipe
        WHERE tcd.nu_longitude IS NOT NULL -- Domicílios localizados têm longitude (ajustado para a tabela correta)
        AND tcd.tp_cds_imovel = 1   
        AND (tfcd.co_dim_tempo_validade > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::integer	
        AND tfcd.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::integer)
        AND tfcd.co_dim_cbo in (395, 468, 945, 8892)	
        AND (p_profissional is null or tdp.nu_cns = p_profissional)
        AND (p_equipe is null or tde.nu_ine = p_equipe)
        
    ),
    domicilios_nao_localizados AS (
        SELECT COUNT(*) AS total_nao_localizados
        FROM tb_fat_cad_domiciliar tfcd
        join tb_cds_domicilio tcd on
        tcd.co_unico_domicilio = tfcd.nu_uuid_ficha_origem
        JOIN tb_dim_profissional tdp 
        ON tdp.co_seq_dim_profissional = tfcd.co_dim_profissional and tdp.st_registro_valido = 1
        JOIN tb_dim_equipe tde 
        ON tde.co_seq_dim_equipe = tfcd.co_dim_equipe
        WHERE tcd.nu_longitude IS NULL -- Domicílios não localizados não têm longitude (ajustado para a tabela correta)	
        AND tcd.tp_cds_imovel = 1   
        AND (tfcd.co_dim_tempo_validade > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::integer	
        AND tfcd.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::integer)
        AND tfcd.co_dim_cbo IN (395, 468, 945)
        AND (p_profissional IS NULL OR tdp.nu_cns = p_profissional)
        AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
    )
    SELECT 
        dl.total_localizados AS georreferenciados, 
        dnl.total_nao_localizados::integer AS nao_georreferenciados, 
        (dl.total_localizados + dnl.total_nao_localizados)::integer AS total_domicilios,
        -- Calcular percentual de georreferenciados com tratamento para divisão por zero
        CASE 
            WHEN (dl.total_localizados + dnl.total_nao_localizados) = 0 THEN 0
            ELSE ROUND((CAST(dl.total_localizados AS DECIMAL) / (dl.total_localizados + dnl.total_nao_localizados)) * 100, 2)
        END AS percentual_georreferenciados,
        -- Calcular percentual de não georreferenciados com tratamento para divisão por zero
        CASE 
            WHEN (dl.total_localizados + dnl.total_nao_localizados) = 0 THEN 0
            ELSE ROUND((CAST(dnl.total_nao_localizados AS DECIMAL) / (dl.total_localizados + dnl.total_nao_localizados)) * 100, 2)
        END AS percentual_nao_georreferenciados
    FROM domicilios_localizados dl
    CROSS JOIN domicilios_nao_localizados dnl;
    end;
    $$`
    },

    {
        name: 'Geolocalizacao Domiciliar',
        definition: `create or replace function geolocalizacao_domiciliar(
        p_profissional varchar default null)
    returns table(logradouro varchar, num_domicilio varchar, bairro varchar, latitude float8,
                longitude float8, ultima_atualizacao varchar, cadastro_completo text)
    language plpgsql
    as $$
    begin
        return query
            select 		
            tcd.no_logradouro, 
            tcd.nu_domicilio, 
            tcd.no_bairro, 
            tfcd.nu_latitude, 
            tfcd.nu_longitude,
            TO_CHAR(TO_DATE(tfcd.co_dim_tempo::text, 'YYYYMMDD'),'DD/MM/YYYY')::varchar as DT_ATUALIZACAO,
            case
                when tcd.st_cadastro_completo = 1 then 'SIM'
            else 'NÃO'
            end as cadasto_completo
            from tb_fat_cad_domiciliar tfcd 
            join tb_cds_domicilio tcd on
            tcd.co_unico_domicilio = tfcd.nu_uuid_ficha_origem 
            join tb_dim_profissional tdp on
            tdp.co_seq_dim_profissional = tfcd.co_dim_profissional 
            where 
                tfcd.nu_latitude is not null
                and tdp.st_registro_valido = 1
                and	(tfcd.co_dim_tempo_validade > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::integer	
            AND tfcd.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::integer) 
            and (p_profissional is null or tdp.nu_cns = p_profissional);		
    end;
    $$`
    },

    {
        name: 'Calcular IAF',
        definition: `CREATE OR REPLACE FUNCTION calcular_iaf(
                param_cnes VARCHAR DEFAULT NULL,
                param_mes INTEGER DEFAULT NULL,
                param_ano INTEGER DEFAULT NULL
            )
            RETURNS TABLE (
                cnes VARCHAR,
                UBS VARCHAR,
                total_fichas BIGINT,
                MODALIDADE VARCHAR
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    tdus.nu_cnes AS cnes,
                    tdus.no_unidade_saude AS UBS,        
                    COUNT(*) AS total_fichas,
                    (case  when co_dim_cbo in (751, 791, 1327) then 'II COM PEF 20H' else 'I SEM PEF' END)::VARCHAR as MODALIDADE
                FROM
                    tb_fat_atividade_coletiva tfac
                INNER JOIN
                    tb_dim_unidade_saude tdus ON tdus.co_seq_dim_unidade_saude = tfac.co_dim_unidade_saude
                WHERE
                    (param_cnes IS NULL OR tdus.nu_cnes = param_cnes) AND
                    (param_mes IS NULL OR EXTRACT(MONTH FROM to_date(tfac.co_dim_tempo::text, 'YYYYMMDD')) = param_mes) AND
                    (param_ano IS NULL OR EXTRACT(YEAR FROM to_date(tfac.co_dim_tempo::text, 'YYYYMMDD')) = param_ano) AND
                    --AGE(CURRENT_DATE, TO_DATE(tfac.co_dim_tempo::TEXT, 'YYYYMMDD')) <= INTERVAL '1 year' AND
                    --tfac.co_dim_tipo_atividade = 6 AND
                    tfac.ds_filtro_pratica_em_saude in ('|11|', '|30|11|', '|30|')        
                GROUP BY
                    tdus.no_unidade_saude,
                    tdus.nu_cnes,
                    co_dim_cbo
                ORDER BY
                    total_fichas desc;        
            END;
            $$ LANGUAGE plpgsql;`
    },

    {
        name:'Calcula PSE',
        definition:`create or replace function calcula_pse()
            returns table(
            QTD_ESCOLAS_ATENDIDAS INTEGER,
            QTD_ESCOLAS_ACOES_REALIZDAS INTEGER
            )
        language PLPGSQL
        as $$
        begin
            RETURN QUERY
                WITH CTE_ESCOLAS_REGISTRADAS AS( 
                select count(*) as TOTAL_ESCOLAS from (
                select ds_filtro_tema_para_saude, ds_filtro_pratica_em_saude, co_dim_inep, co_dim_tempo 
                from (
                SELECT 
                    ds_filtro_tema_para_saude,
                    ds_filtro_pratica_em_saude, 
                    co_dim_inep, 
                    co_dim_tempo,
                    ROW_NUMBER() OVER (
                        PARTITION BY co_dim_inep
                        ORDER BY co_dim_inep ASC
                    ) AS rn
                FROM 
                    tb_fat_atividade_coletiva tfac
                WHERE 
                    (
                    ds_filtro_tema_para_saude LIKE '%|1|%' OR 
                    ds_filtro_tema_para_saude LIKE '%|5|%' OR 
                    ds_filtro_tema_para_saude LIKE '%|7|%' OR 
                    ds_filtro_tema_para_saude LIKE '%|13|%' OR 
                    ds_filtro_tema_para_saude LIKE '%|14|%' OR 
                    ds_filtro_tema_para_saude LIKE '%|15|%' OR 
                    ds_filtro_tema_para_saude LIKE '%|16|%' OR 
                    ds_filtro_tema_para_saude LIKE '%|17|%' OR 
                    ds_filtro_tema_para_saude LIKE '%|19|%' OR 
                    ds_filtro_tema_para_saude LIKE '%|29|%' OR
                    ds_filtro_pratica_em_saude LIKE '%|2|%' OR 
                    ds_filtro_pratica_em_saude LIKE '%|3|%' OR 
                    ds_filtro_pratica_em_saude LIKE '%|9|%' OR 
                    ds_filtro_pratica_em_saude LIKE '%|11|%' OR 
                    ds_filtro_pratica_em_saude LIKE '%|20|%' OR 
                    ds_filtro_pratica_em_saude LIKE '%|22|%' OR 
                    ds_filtro_pratica_em_saude LIKE '%|24|%' OR 
                    ds_filtro_pratica_em_saude LIKE '%|30|%'
                    )
                    AND co_dim_tempo >= '20230101' 
                    AND (co_dim_inep IS NOT null and co_dim_inep > 1)
                    AND co_dim_inep IN (
                        SELECT co_dim_inep 
                        FROM tb_fat_atividade_coletiva
                        WHERE 
                            ds_filtro_tema_para_saude LIKE '%|1|%' OR 
                            ds_filtro_tema_para_saude LIKE '%|5|%' OR 
                            ds_filtro_tema_para_saude LIKE '%|7|%' OR 
                            ds_filtro_tema_para_saude LIKE '%|13|%' OR 
                            ds_filtro_tema_para_saude LIKE '%|14|%' OR 
                            ds_filtro_tema_para_saude LIKE '%|15|%' OR 
                            ds_filtro_tema_para_saude LIKE '%|16|%' OR 
                            ds_filtro_tema_para_saude LIKE '%|17|%' OR 
                            ds_filtro_tema_para_saude LIKE '%|19|%' OR 
                            ds_filtro_tema_para_saude LIKE '%|29|%' OR
                            ds_filtro_pratica_em_saude LIKE '%|2|%' OR 
                            ds_filtro_pratica_em_saude LIKE '%|3|%' OR 
                            ds_filtro_pratica_em_saude LIKE '%|9|%' OR 
                            ds_filtro_pratica_em_saude LIKE '%|11|%' OR 
                            ds_filtro_pratica_em_saude LIKE '%|20|%' OR 
                            ds_filtro_pratica_em_saude LIKE '%|22|%' OR 
                            ds_filtro_pratica_em_saude LIKE '%|24|%' OR 
                            ds_filtro_pratica_em_saude LIKE '%|30|%'
                    ) 
                ) as escolasregistradapse where rn = 1 order by escolasregistradapse.co_dim_inep asc) as atingidaspse
            ), CTE_ACOES_REGISTRADAS as (
                select COUNT(*) as ACOES_ESCOLAS from (
                SELECT 
                    ds_filtro_tema_para_saude,
                    ds_filtro_pratica_em_saude, 
                    co_dim_inep, 
                    co_dim_tempo,
                    ROW_NUMBER() OVER (
                        PARTITION BY co_dim_inep
                        ORDER BY co_dim_inep ASC
                    ) AS rn
                FROM 
                    tb_fat_atividade_coletiva tfac
                WHERE 
                    (   
                        (ds_filtro_tema_para_saude LIKE '%|1|%' OR
                        ds_filtro_pratica_em_saude LIKE '%|11|%' OR
                        ds_filtro_pratica_em_saude LIKE '%|20|%') OR
                        ds_filtro_tema_para_saude LIKE '%|5|%' OR 
                        ds_filtro_tema_para_saude LIKE '%|13|%' OR 
                        ds_filtro_tema_para_saude LIKE '%|16|%' OR 
                        ds_filtro_tema_para_saude LIKE '%|17|%' 	        
                    )
                    AND co_dim_tempo >= '20230101' 
                    AND (co_dim_inep IS NOT null and co_dim_inep > 1)
                    AND co_dim_inep IN (
                        SELECT co_dim_inep 
                        FROM tb_fat_atividade_coletiva
                        WHERE	                
                        (ds_filtro_tema_para_saude LIKE '%|1|%' OR
                        ds_filtro_pratica_em_saude LIKE '%|11|%' AND 
                        ds_filtro_pratica_em_saude LIKE '%|20|%') OR
                        ds_filtro_tema_para_saude LIKE '%|5|%' OR 
                        ds_filtro_tema_para_saude LIKE '%|13|%' OR 
                        ds_filtro_tema_para_saude LIKE '%|16|%' OR 
                        ds_filtro_tema_para_saude LIKE '%|17|%' 	        
                        ) 
                ) as ACOESPSE where rn = 1
            )
            SELECT 
                CTE_ESCOLAS_REGISTRADAS.TOTAL_ESCOLAS::INTEGER,
                CTE_ACOES_REGISTRADAS.ACOES_ESCOLAS::INTEGER
            FROM 
                CTE_ESCOLAS_REGISTRADAS,
                CTE_ACOES_REGISTRADAS;	
        end;
        $$`
    },
    /*-----------------HIPERTENSOS---------------------------*/
    {
        name: 'HAS Clinico',
        definition: `create or replace function has_clinico(
        p_equipe varchar default null)
    returns table(has_clinico integer)
    language plpgsql
    as $$
    begin
        return query
        SELECT count(*)::integer
    FROM (
        SELECT distinct
            fact.fciCidadaoPec AS fciCidadaoPec,    
            fact.nuCns AS cns_cidadao,
            fact.cpf AS cpf_cidadao,
            tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
            tds.ds_sexo AS sexo,
            fact.dtNascimento AS dt_nascimento,
            tdfe.ds_faixa_etaria AS idade,
            fact.noNomeMae AS no_mome_mae
        FROM (
            SELECT
                tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                tb_fat_cad_individual.nu_cns AS nuCns,
                tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                cad_individual.no_mae_cidadao AS noNomeMae,
                tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                tb_fat_cad_individual.co_dim_sexo AS sexo,
                tb_fat_cad_individual.co_dim_faixa_etaria AS idade
            FROM
                tb_fat_cad_individual
            JOIN tb_dim_tipo_saida_cadastro 
                ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
            JOIN tb_cds_cad_individual cad_individual 
                ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
            WHERE
                tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
                --AND (tb_fat_cad_individual.st_hipertensao_arterial = 1 or tb_fat_cad_individual.st_hipertensao_arterial is null)  -- Mantém a condição para hipertensos e não hipertensos
                AND tb_fat_cad_individual.st_ficha_inativa = 0 
                AND EXISTS (
                    SELECT 1
                    FROM tb_fat_cidadao
                    WHERE 
                        tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                        AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                        AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                )
                AND EXISTS (
                    SELECT 1
                    FROM tb_fat_atendimento_individual tfai 
                    WHERE 
                        tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                        AND (
                            tfai.ds_filtro_ciaps LIKE '%|ABP005|%' 
                            OR tfai.ds_filtro_ciaps IN ('|K86|', '|K87|') 
                            OR tfai.ds_filtro_cids IN (
                                '|I10|', '|I11|', '|I110|', '|I119|', '|I12Z|', '|I120|', '|I129|', '|I13|', '|I130|',
                                '|I131|', '|I132|', '|I139|', '|I15|', '|I150|', '|I151|', '|I152|', '|I158|', '|I159|',
                                '|O10|', '|O100|', '|O101|', '|O102|', '|O103|', '|O104|', '|O109|', '|O11|'
                            )
                        )
                ) 
                AND tb_dim_tipo_saida_cadastro.nu_identificador = '-' --and tb_fat_cidadao_pec.st_faleceu = 0
        ) AS fact
        LEFT JOIN tb_fat_cidadao_pec 
            ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
        JOIN tb_dim_equipe tde 
                ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc  
        JOIN tb_dim_sexo tds 
            ON tds.co_seq_dim_sexo = fact.sexo
        JOIN tb_dim_faixa_etaria tdfe 
            ON tdfe.co_seq_dim_faixa_etaria = fact.idade
        WHERE 
        (tde.nu_ine = p_equipe or p_equipe IS NULL) and  tb_fat_cidadao_pec.st_faleceu = 0
        GROUP BY 
            fact.fciCidadaoPec, 
            fact.nuCns, 
            fact.cpf, 
            tb_fat_cidadao_pec.no_cidadao, 
            tds.ds_sexo, 
            fact.dtNascimento, 
            tdfe.ds_faixa_etaria, 
            fact.noNomeMae
        --having count(fact.fciCidadaoPec) = 1
    ) AS total;
    --group by total.sexo;
    end;
    $$`
    },

    {
        name: 'HAS Autorreferidos',
        definition: `CREATE OR REPLACE FUNCTION has_autorreferidos(
        p_equipe VARCHAR DEFAULT NULL
    )
    RETURNS TABLE (has_autorrefidos INTEGER)
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        SELECT COUNT(*)::integer
        FROM (
            SELECT DISTINCT
                tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                fact.nuCns AS cns_cidadao,
                fact.cpf AS cpf_cidadao,
                fact.noNomeMae AS no_mome_mae,
                fact.dtNascimento AS dt_nascimento,
                tds.ds_sexo AS sexo,
                tdfe.ds_faixa_etaria AS idade
            FROM (
                SELECT
                    tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                    tb_fat_cad_individual.nu_cns AS nuCns,
                    tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                    tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                    cad_individual.no_mae_cidadao AS noNomeMae,
                    tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                    tb_fat_cad_individual.co_dim_sexo AS sexo,
                    tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                FROM
                    tb_fat_cad_individual
                JOIN tb_dim_tipo_saida_cadastro 
                    ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                JOIN tb_cds_cad_individual cad_individual 
                    ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                WHERE
                    tb_fat_cad_individual.co_dim_cbo in(395, 468, 945, 8892) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
                    AND tb_fat_cad_individual.st_hipertensao_arterial = 1
                    AND tb_fat_cad_individual.st_ficha_inativa = 0
                    AND EXISTS (
                        SELECT 1
                        FROM tb_fat_cidadao
                        WHERE 
                            tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                            AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                            AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM tb_fat_atendimento_individual tfai 
                        WHERE 
                            tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                            AND (
                                tfai.ds_filtro_ciaps LIKE '%|ABP005|%' 
                                OR tfai.ds_filtro_ciaps IN ('|K86|', '|K87|') 
                                OR tfai.ds_filtro_cids IN (
                                    '|I10|', '|I11|', '|I110|', '|I119|', '|I12Z|', '|I120|', '|I129|', '|I13|', '|I130|',
                                    '|I131|', '|I132|', '|I139|', '|I15|', '|I150|', '|I151|', '|I152|', '|I158|', '|I159|',
                                    '|O10|', '|O100|', '|O101|', '|O102|', '|O103|', '|O104|', '|O109|', '|O11|'
                                )
                            )
                    )
                    AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
            ) AS fact
            LEFT JOIN tb_fat_cidadao_pec 
                ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
            JOIN tb_dim_equipe tde 
                ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc 
            JOIN tb_dim_sexo tds 
                ON tds.co_seq_dim_sexo = fact.sexo
            JOIN tb_dim_faixa_etaria tdfe 
                ON tdfe.co_seq_dim_faixa_etaria = fact.idade
            WHERE 
                (p_equipe IS NULL OR tde.nu_ine = p_equipe)
        ) AS autorreferidos;
    END;
    $$;`
    },

    {
        name: 'HAS Sexo',
        definition: `create or replace function has_sexo(
        p_equipe varchar default null)
    returns table(sexo varchar, total bigint)
    language plpgsql
    as $$
    begin
        return query
            SELECT 
            COALESCE(t1.sexo, t2.sexo) AS sexo,
            COALESCE(t1.count_sexo, 0) + COALESCE(t2.count_sexo, 0)::integer AS total_sexo
        FROM (
            -- Query 1
            SELECT 
                teste.sexo, 
                COUNT(*) AS count_sexo
            FROM (
                SELECT DISTINCT
                    tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                    fact.nuCns AS cns_cidadao,
                    fact.cpf AS cpf_cidadao,
                    fact.noNomeMae AS no_mome_mae,
                    fact.dtNascimento AS dt_nascimento,
                    tds.ds_sexo AS sexo,
                    tdfe.ds_faixa_etaria AS idade
                FROM (
                    SELECT
                        tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                        tb_fat_cad_individual.nu_cns AS nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                        tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                        cad_individual.no_mae_cidadao AS noNomeMae,
                        tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                        tb_fat_cad_individual.co_dim_sexo AS sexo,
                        tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                    FROM
                        tb_fat_cad_individual
                    JOIN tb_dim_tipo_saida_cadastro 
                        ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    JOIN tb_cds_cad_individual cad_individual 
                        ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    WHERE
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
                        AND tb_fat_cad_individual.st_hipertensao_arterial = 1
                        AND tb_fat_cad_individual.st_ficha_inativa = 0
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_cidadao
                            WHERE 
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                                AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                        )
                        AND NOT EXISTS (
                            SELECT 1
                            FROM tb_fat_atendimento_individual tfai 
                            WHERE 
                                tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                                AND (
                                    tfai.ds_filtro_ciaps LIKE '%|ABP005|%' 
                                    OR tfai.ds_filtro_ciaps IN ('|K86|', '|K87|') 
                                    OR tfai.ds_filtro_cids IN (
                                        '|I10|', '|I11|', '|I110|', '|I119|', '|I12Z|', '|I120|', '|I129|', '|I13|', '|I130|',
                                        '|I131|', '|I132|', '|I139|', '|I15|', '|I150|', '|I151|', '|I152|', '|I158|', '|I159|',
                                        '|O10|', '|O100|', '|O101|', '|O102|', '|O103|', '|O104|', '|O109|', '|O11|'
                                    )
                                )
                        )
                        AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
                ) AS fact
                LEFT JOIN tb_fat_cidadao_pec 
                    ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
                JOIN tb_dim_equipe tde 
                    ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc 
                JOIN tb_dim_sexo tds 
                    ON tds.co_seq_dim_sexo = fact.sexo
                JOIN tb_dim_faixa_etaria tdfe 
                    ON tdfe.co_seq_dim_faixa_etaria = fact.idade
                WHERE (p_equipe IS NULL OR tde.nu_ine = p_equipe)
            ) AS teste
            GROUP BY teste.sexo
        ) AS t1
        FULL JOIN (
            -- Query 2
            SELECT 
                teste2.sexo, 
                COUNT(*) AS count_sexo
            FROM (
                SELECT DISTINCT
                    fact.fciCidadaoPec AS fciCidadaoPec,    
                    fact.nuCns AS cns_cidadao,
                    fact.cpf AS cpf_cidadao,
                    tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                    tds.ds_sexo AS sexo,
                    fact.dtNascimento AS dt_nascimento,
                    tdfe.ds_faixa_etaria AS idade,
                    fact.noNomeMae AS no_mome_mae
                FROM (
                    SELECT
                        tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                        tb_fat_cad_individual.nu_cns AS nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                        tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                        cad_individual.no_mae_cidadao AS noNomeMae,
                        tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                        tb_fat_cad_individual.co_dim_sexo AS sexo,
                        tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                    FROM
                        tb_fat_cad_individual
                    JOIN tb_dim_tipo_saida_cadastro 
                        ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    JOIN tb_cds_cad_individual cad_individual 
                        ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    WHERE
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
                        AND tb_fat_cad_individual.st_ficha_inativa = 0 
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_cidadao
                            WHERE 
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                                AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_atendimento_individual tfai 
                            WHERE 
                                tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                                AND (
                                    tfai.ds_filtro_ciaps LIKE '%|ABP005|%' 
                                    OR tfai.ds_filtro_ciaps IN ('|K86|', '|K87|') 
                                    OR tfai.ds_filtro_cids IN (
                                        '|I10|', '|I11|', '|I110|', '|I119|', '|I12Z|', '|I120|', '|I129|', '|I13|', '|I130|',
                                        '|I131|', '|I132|', '|I139|', '|I15|', '|I150|', '|I151|', '|I152|', '|I158|', '|I159|',
                                        '|O10|', '|O100|', '|O101|', '|O102|', '|O103|', '|O104|', '|O109|', '|O11|'
                                    )
                                )
                        ) 
                        AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
                ) AS fact
                LEFT JOIN tb_fat_cidadao_pec 
                    ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
                JOIN tb_dim_equipe tde 
                    ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc  
                JOIN tb_dim_sexo tds 
                    ON tds.co_seq_dim_sexo = fact.sexo
                JOIN tb_dim_faixa_etaria tdfe 
                    ON tdfe.co_seq_dim_faixa_etaria = fact.idade
                WHERE (p_equipe IS NULL OR tde.nu_ine = p_equipe)
            ) AS teste2
            GROUP BY teste2.sexo
        ) AS t2
        ON t1.sexo = t2.sexo;
    end;
    $$`
    },

    {
        name: 'HAS Faita Etaria',
        definition: `create or replace function has_fx_etaria(
        p_equipe varchar default null)
    returns table (faixa_etaria varchar, total bigint)
    language plpgsql
    as $$
    begin
        return query
            SELECT 
            COALESCE(t1.idade, t2.idade) AS fx_etaria,
            COALESCE(t1.count_sexo, 0) + COALESCE(t2.count_sexo, 0) AS total_fx_etaria
        FROM (
            -- Query 1
            SELECT 
                teste.idade, 
                COUNT(*) AS count_sexo
            FROM (
                SELECT DISTINCT
                    tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                    fact.nuCns AS cns_cidadao,
                    fact.cpf AS cpf_cidadao,
                    fact.noNomeMae AS no_mome_mae,
                    fact.dtNascimento AS dt_nascimento,
                    tds.ds_sexo AS sexo,
                    tdfe.ds_faixa_etaria AS idade
                FROM (
                    SELECT
                        tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                        tb_fat_cad_individual.nu_cns AS nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                        tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                        cad_individual.no_mae_cidadao AS noNomeMae,
                        tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                        tb_fat_cad_individual.co_dim_sexo AS sexo,
                        tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                    FROM
                        tb_fat_cad_individual
                    JOIN tb_dim_tipo_saida_cadastro 
                        ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    JOIN tb_cds_cad_individual cad_individual 
                        ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    WHERE
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
                        AND tb_fat_cad_individual.st_hipertensao_arterial = 1
                        AND tb_fat_cad_individual.st_ficha_inativa = 0
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_cidadao
                            WHERE 
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                                AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                        )
                        AND NOT EXISTS (
                            SELECT 1
                            FROM tb_fat_atendimento_individual tfai 
                            WHERE 
                                tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                                AND (
                                    tfai.ds_filtro_ciaps LIKE '%|ABP005|%' 
                                    OR tfai.ds_filtro_ciaps IN ('|K86|', '|K87|') 
                                    OR tfai.ds_filtro_cids IN (
                                        '|I10|', '|I11|', '|I110|', '|I119|', '|I12Z|', '|I120|', '|I129|', '|I13|', '|I130|',
                                        '|I131|', '|I132|', '|I139|', '|I15|', '|I150|', '|I151|', '|I152|', '|I158|', '|I159|',
                                        '|O10|', '|O100|', '|O101|', '|O102|', '|O103|', '|O104|', '|O109|', '|O11|'
                                    )
                                )
                        )
                        AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
                ) AS fact
                LEFT JOIN tb_fat_cidadao_pec 
                    ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
                JOIN tb_dim_equipe tde 
                    ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc 
                JOIN tb_dim_sexo tds 
                    ON tds.co_seq_dim_sexo = fact.sexo
                JOIN tb_dim_faixa_etaria tdfe 
                    ON tdfe.co_seq_dim_faixa_etaria = fact.idade
                WHERE  (tde.nu_ine = p_equipe or p_equipe IS NULL)
            ) AS teste
            GROUP BY teste.idade
        ) AS t1
        FULL JOIN (
            -- Query 2
            SELECT 
                teste2.idade, 
                COUNT(*) AS count_sexo
            FROM (
                SELECT DISTINCT
                    fact.fciCidadaoPec AS fciCidadaoPec,    
                    fact.nuCns AS cns_cidadao,
                    fact.cpf AS cpf_cidadao,
                    tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                    tds.ds_sexo AS sexo,
                    fact.dtNascimento AS dt_nascimento,
                    tdfe.ds_faixa_etaria AS idade,
                    fact.noNomeMae AS no_mome_mae
                FROM (
                    SELECT
                        tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                        tb_fat_cad_individual.nu_cns AS nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                        tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                        cad_individual.no_mae_cidadao AS noNomeMae,
                        tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                        tb_fat_cad_individual.co_dim_sexo AS sexo,
                        tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                    FROM
                        tb_fat_cad_individual
                    JOIN tb_dim_tipo_saida_cadastro 
                        ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    JOIN tb_cds_cad_individual cad_individual 
                        ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    WHERE
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
                        AND tb_fat_cad_individual.st_ficha_inativa = 0 
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_cidadao
                            WHERE 
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                                AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_atendimento_individual tfai 
                            WHERE 
                                tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                                AND (
                                    tfai.ds_filtro_ciaps LIKE '%|ABP005|%' 
                                    OR tfai.ds_filtro_ciaps IN ('|K86|', '|K87|') 
                                    OR tfai.ds_filtro_cids IN (
                                        '|I10|', '|I11|', '|I110|', '|I119|', '|I12Z|', '|I120|', '|I129|', '|I13|', '|I130|',
                                        '|I131|', '|I132|', '|I139|', '|I15|', '|I150|', '|I151|', '|I152|', '|I158|', '|I159|',
                                        '|O10|', '|O100|', '|O101|', '|O102|', '|O103|', '|O104|', '|O109|', '|O11|'
                                    )
                                )
                        ) 
                        AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
                ) AS fact
                LEFT JOIN tb_fat_cidadao_pec 
                    ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
                JOIN tb_dim_equipe tde 
                    ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc  
                JOIN tb_dim_sexo tds 
                    ON tds.co_seq_dim_sexo = fact.sexo
                JOIN tb_dim_faixa_etaria tdfe 
                    ON tdfe.co_seq_dim_faixa_etaria = fact.idade
                WHERE  (tde.nu_ine = p_equipe or p_equipe IS NULL)
            ) AS teste2
            GROUP BY teste2.idade
        ) AS t2
        ON t1.idade= t2.idade;	
    end;
    $$`
    },

    {
        name: 'Atendimento HAS',
        definition: `create or replace function hipertensos_atendidos(
        p_equipe varchar default null)
        --p_mes integer default null,
        --p_ano integer default null)
    returns table(total integer)
    language plpgsql
    as $$
    begin
        return query
        select count(*)::integer from (select tfcp.no_cidadao, tfcp.nu_cns, tfcp.nu_cpf_cidadao, tfcp.co_dim_tempo_nascimento,
        tfccf.co_dim_tempo_has as dt_atendimento, count(tfccf.co_dim_tempo_has) from tb_fat_consolidado_cidadao_fai tfccf
        left join tb_fat_cidadao_pec tfcp on tfcp.co_seq_fat_cidadao_pec = tfccf.co_fat_cidadao_pec 
        left join tb_dim_equipe tde on tde.co_seq_dim_equipe = tfcp.co_dim_equipe_vinc
        where AGE(CURRENT_DATE, to_date(tfccf.co_dim_tempo_has::text, 'YYYYMMDD')) <= INTERVAL '12 MONTH' --and tde.nu_ine ='0000041653'
        and tfcp.st_faleceu = 0
        AND (p_equipe IS NULL OR tde.nu_ine = p_equipe)
        --AND (p_mes IS NULL OR EXTRACT(MONTH FROM to_date(tfccf.co_dim_tempo_has::text, 'YYYYMMDD')) = p_mes)
        --AND (p_ano IS NULL OR EXTRACT(YEAR FROM to_date(tfccf.co_dim_tempo_has::text, 'YYYYMMDD')) = p_ano)
        group by tfcp.no_cidadao, tfcp.nu_cns, tfcp.nu_cpf_cidadao, tfcp.co_dim_tempo_nascimento, tfccf.co_dim_tempo_has
        having count(tfccf.co_dim_tempo_has) >= 1
        order by tfcp.no_cidadao  asc 
        ) as has_atendidos;
    end;
    $$`
    },

    /*--------------DIABETICOS-------------------------------*/
    {
        name: 'Diabeticos Atendidos',
        definition: `CREATE OR REPLACE FUNCTION diabeticos_atendidos(
        p_equipe varchar default null
        )	
    RETURNS TABLE (diabetico_atendidos INTEGER)
    LANGUAGE plpgsql
    AS $$
    BEGIN   
        -- Contar os atendimentos nos últimos 12 meses
        RETURN QUERY
        SELECT COUNT(*)::INTEGER 
        FROM tb_fat_atendimento_individual tfai
        INNER JOIN tb_dim_equipe tde 
            ON tde.co_seq_dim_equipe = tfai.co_dim_equipe_1 
        WHERE  AGE(CURRENT_DATE, to_date(tfai.co_dim_tempo::text, 'YYYYMMDD')) <= INTERVAL '12 MONTH' 
            ---to_date(tfai.co_dim_tempo::text, 'YYYYMMDD') >= (v_data - INTERVAL '12 MONTH')
        --AND to_date(tfai.co_dim_tempo::text, 'YYYYMMDD') <= v_data
        AND (tfai.ds_filtro_ciaps LIKE '%|ABP006|%' 
            OR tfai.ds_filtro_ciaps IN ('|T89|', '|T90|') 
            OR tfai.ds_filtro_cids IN ('|E10|', '|E100|', '|E101|', '|E102|', '|E103|', '|E104|', '|E105|', '|E106|', '|E107|', 
                '|E108|', 'E109|', '|E11|', '|E110|', '|E111|', '|E112|', '|E113|', '|E114|', '|E115|', '|E116|', '|E117|', '|E118|',
                '|E119|', '|E12|', '|E120|', '|E121|', '|E122|', '|E123|', '|E124|', '|E125|', '|E126|', '|E127|', '|E128|', '|E129|',
                '|E13|', '|E130|', '|E131|', '|E132|', '|E133|', '|E134|', '|E135|', '|E136|', '|E137|', '|E138|', '|E139|', '|E14|',
                '|E140|', '|E141|', '|E142|', '|E143|', '|E144|', '|E145|', '|E146|', '|E147|', '|E148|', '|E149|', '|O240|', '|O241|',
                '|O242|','|O243|', '|P702|'))
        -- Condição da equipe
        AND (p_equipe IS NULL OR tde.nu_ine = p_equipe);
        --AND (p_mes IS NULL OR EXTRACT(MONTH FROM TO_DATE(tfai.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_mes)
        --AND (p_ano IS NULL OR EXTRACT(YEAR FROM TO_DATE(tfai.co_dim_tempo::TEXT, 'YYYYMMDD')) = p_ano);
    END;
    $$;`
    },

    {
        name: 'Diabeticos Clinicos',
        definition: `create or replace function diabeticos_clinico(
        p_equipe varchar default null)
    returns table(diabetico_clinico integer)
    language plpgsql
    as $$
    begin
        return query
        SELECT count(*)::integer
    FROM (
        SELECT distinct
            fact.fciCidadaoPec AS fciCidadaoPec,    
            fact.nuCns AS cns_cidadao,
            fact.cpf AS cpf_cidadao,
            tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
            tds.ds_sexo AS sexo,
            fact.dtNascimento AS dt_nascimento,
            tdfe.ds_faixa_etaria AS idade,
            fact.noNomeMae AS no_mome_mae
        FROM (
            SELECT
                tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                tb_fat_cad_individual.nu_cns AS nuCns,
                tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                cad_individual.no_mae_cidadao AS noNomeMae,
                tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                tb_fat_cad_individual.co_dim_sexo AS sexo,
                tb_fat_cad_individual.co_dim_faixa_etaria AS idade
            FROM
                tb_fat_cad_individual
            JOIN tb_dim_tipo_saida_cadastro 
                ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
            JOIN tb_cds_cad_individual cad_individual 
                ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
            WHERE
                tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892)
                --AND (tb_fat_cad_individual.st_hipertensao_arterial = 1 or tb_fat_cad_individual.st_hipertensao_arterial is null)  -- Mantém a condição para hipertensos e não hipertensos
                AND tb_fat_cad_individual.st_ficha_inativa = 0 
                AND EXISTS (
                    SELECT 1
                    FROM tb_fat_cidadao
                    WHERE 
                        tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                        AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                        AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                )
                AND EXISTS (
                    SELECT 1
                    FROM tb_fat_atendimento_individual tfai 
                    WHERE 
                        tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                        AND (
                            tfai.ds_filtro_ciaps LIKE '%|ABP006|%' 
                            OR tfai.ds_filtro_ciaps IN ('|T89|', '|T90|') 
                                    OR tfai.ds_filtro_cids IN ('|E10|', '|E100|', '|E101|', '|E102|', '|E103|', '|E104|', '|E105|', '|E106|', '|E107|', 
                            '|E108|', 'E109|', '|E11|', '|E110|', '|E111|', '|E112|', '|E113|', '|E114|', '|E115|', '|E116|', '|E117|', '|E118|',
                            '|E119|', '|E12|', '|E120|', '|E121|', '|E122|', '|E123|', '|E124|', '|E125|', '|E126|', '|E127|', '|E128|', '|E129|',
                            '|E13|', '|E130|', '|E131|', '|E132|', '|E133|', '|E134|', '|E135|', '|E136|', '|E137|', '|E138|', '|E139|', '|E14|',
                            '|E140|', '|E141|', '|E142|', '|E143|', '|E144|', '|E145|', '|E146|', '|E147|', '|E148|', '|E149|', '|O240|', '|O241|',
                            '|O242|','|O243|', '|P702|')
                        )
                ) 
                AND tb_dim_tipo_saida_cadastro.nu_identificador = '-' --and tb_fat_cidadao_pec.st_faleceu = 0
        ) AS fact
        LEFT JOIN tb_fat_cidadao_pec 
            ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
        JOIN tb_dim_equipe tde 
                ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc  
        JOIN tb_dim_sexo tds 
            ON tds.co_seq_dim_sexo = fact.sexo
        JOIN tb_dim_faixa_etaria tdfe 
            ON tdfe.co_seq_dim_faixa_etaria = fact.idade
        WHERE 
        (tde.nu_ine = p_equipe or p_equipe IS NULL) and  tb_fat_cidadao_pec.st_faleceu = 0
        GROUP BY 
            fact.fciCidadaoPec, 
            fact.nuCns, 
            fact.cpf, 
            tb_fat_cidadao_pec.no_cidadao, 
            tds.ds_sexo, 
            fact.dtNascimento, 
            tdfe.ds_faixa_etaria, 
            fact.noNomeMae
        --having count(fact.fciCidadaoPec) = 1
    ) AS total;
    --group by total.sexo;
    end;
    $$`
    },

    {
        name: 'Diabeticos Autorreferidos',
        definition: `CREATE OR REPLACE FUNCTION diabeticos_autorreferidos(
        p_equipe VARCHAR DEFAULT NULL
    )
    RETURNS TABLE (diabetico_autorrefidos INTEGER)
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        SELECT COUNT(*)::integer
        FROM (
            SELECT DISTINCT
                tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                fact.nuCns AS cns_cidadao,
                fact.cpf AS cpf_cidadao,
                fact.noNomeMae AS no_mome_mae,
                fact.dtNascimento AS dt_nascimento,
                tds.ds_sexo AS sexo,
                tdfe.ds_faixa_etaria AS idade
            FROM (
                SELECT
                    tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                    tb_fat_cad_individual.nu_cns AS nuCns,
                    tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                    tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                    cad_individual.no_mae_cidadao AS noNomeMae,
                    tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                    tb_fat_cad_individual.co_dim_sexo AS sexo,
                    tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                FROM
                    tb_fat_cad_individual
                JOIN tb_dim_tipo_saida_cadastro 
                    ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                JOIN tb_cds_cad_individual cad_individual 
                    ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                WHERE
                    tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892)
                    AND tb_fat_cad_individual.st_diabete = 1
                    AND tb_fat_cad_individual.st_ficha_inativa = 0
                    AND EXISTS (
                        SELECT 1
                        FROM tb_fat_cidadao
                        WHERE 
                            tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                            AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                            AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM tb_fat_atendimento_individual tfai 
                        WHERE 
                            tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                            AND (
                                tfai.ds_filtro_ciaps LIKE '%|ABP006|%' 
                            OR tfai.ds_filtro_ciaps IN ('|T89|', '|T90|') 
                            OR tfai.ds_filtro_cids IN ('|E10|', '|E100|', '|E101|', '|E102|', '|E103|', '|E104|', '|E105|', '|E106|', '|E107|', 
                            '|E108|', 'E109|', '|E11|', '|E110|', '|E111|', '|E112|', '|E113|', '|E114|', '|E115|', '|E116|', '|E117|', '|E118|',
                            '|E119|', '|E12|', '|E120|', '|E121|', '|E122|', '|E123|', '|E124|', '|E125|', '|E126|', '|E127|', '|E128|', '|E129|',
                            '|E13|', '|E130|', '|E131|', '|E132|', '|E133|', '|E134|', '|E135|', '|E136|', '|E137|', '|E138|', '|E139|', '|E14|',
                            '|E140|', '|E141|', '|E142|', '|E143|', '|E144|', '|E145|', '|E146|', '|E147|', '|E148|', '|E149|', '|O240|', '|O241|',
                            '|O242|','|O243|', '|P702|')
                            )
                    )
                    AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
            ) AS fact
            LEFT JOIN tb_fat_cidadao_pec 
                ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
            JOIN tb_dim_equipe tde 
                ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc 
            JOIN tb_dim_sexo tds 
                ON tds.co_seq_dim_sexo = fact.sexo
            JOIN tb_dim_faixa_etaria tdfe 
                ON tdfe.co_seq_dim_faixa_etaria = fact.idade
            WHERE 
                (p_equipe IS NULL OR tde.nu_ine = p_equipe)
        ) AS autorreferidos;
    END;
    $$;`
    },

    {
        name: 'Diabeticos Faixa Etaria',
        definition: `create or replace function diabeticos_fx_etaria(
        p_equipe varchar default null)
    returns table (faixa_etaria varchar, total bigint)
    language plpgsql
    as $$
    begin
        return query
            SELECT 
            COALESCE(t1.idade, t2.idade) AS fx_etaria,
            COALESCE(t1.count_sexo, 0) + COALESCE(t2.count_sexo, 0) AS total_fx_etaria
        FROM (
            -- Query 1
            SELECT 
                teste.idade, 
                COUNT(*) AS count_sexo
            FROM (
                SELECT DISTINCT
                    tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                    fact.nuCns AS cns_cidadao,
                    fact.cpf AS cpf_cidadao,
                    fact.noNomeMae AS no_mome_mae,
                    fact.dtNascimento AS dt_nascimento,
                    tds.ds_sexo AS sexo,
                    tdfe.ds_faixa_etaria AS idade
                FROM (
                    SELECT
                        tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                        tb_fat_cad_individual.nu_cns AS nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                        tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                        cad_individual.no_mae_cidadao AS noNomeMae,
                        tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                        tb_fat_cad_individual.co_dim_sexo AS sexo,
                        tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                    FROM
                        tb_fat_cad_individual
                    JOIN tb_dim_tipo_saida_cadastro 
                        ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    JOIN tb_cds_cad_individual cad_individual 
                        ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    WHERE
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892)
                        AND tb_fat_cad_individual.st_diabete = 1
                        AND tb_fat_cad_individual.st_ficha_inativa = 0
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_cidadao
                            WHERE 
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                                AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                        )
                        AND NOT EXISTS (
                            SELECT 1
                            FROM tb_fat_atendimento_individual tfai 
                            WHERE 
                                tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                                AND (
                                    tfai.ds_filtro_ciaps LIKE '%|ABP006|%' 
                            OR tfai.ds_filtro_ciaps IN ('|T89|', '|T90|') 
                            OR tfai.ds_filtro_cids IN ('|E10|', '|E100|', '|E101|', '|E102|', '|E103|', '|E104|', '|E105|', '|E106|', '|E107|', 
                            '|E108|', 'E109|', '|E11|', '|E110|', '|E111|', '|E112|', '|E113|', '|E114|', '|E115|', '|E116|', '|E117|', '|E118|',
                            '|E119|', '|E12|', '|E120|', '|E121|', '|E122|', '|E123|', '|E124|', '|E125|', '|E126|', '|E127|', '|E128|', '|E129|',
                            '|E13|', '|E130|', '|E131|', '|E132|', '|E133|', '|E134|', '|E135|', '|E136|', '|E137|', '|E138|', '|E139|', '|E14|',
                            '|E140|', '|E141|', '|E142|', '|E143|', '|E144|', '|E145|', '|E146|', '|E147|', '|E148|', '|E149|', '|O240|', '|O241|',
                            '|O242|','|O243|', '|P702|'
                                    )
                                )
                        )
                        AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
                ) AS fact
                LEFT JOIN tb_fat_cidadao_pec 
                    ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
                JOIN tb_dim_equipe tde 
                    ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc 
                JOIN tb_dim_sexo tds 
                    ON tds.co_seq_dim_sexo = fact.sexo
                JOIN tb_dim_faixa_etaria tdfe 
                    ON tdfe.co_seq_dim_faixa_etaria = fact.idade
                WHERE  (tde.nu_ine = p_equipe or p_equipe IS NULL)
            ) AS teste
            GROUP BY teste.idade
        ) AS t1
        FULL JOIN (
            -- Query 2
            SELECT 
                teste2.idade, 
                COUNT(*) AS count_sexo
            FROM (
                SELECT DISTINCT
                    fact.fciCidadaoPec AS fciCidadaoPec,    
                    fact.nuCns AS cns_cidadao,
                    fact.cpf AS cpf_cidadao,
                    tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                    tds.ds_sexo AS sexo,
                    fact.dtNascimento AS dt_nascimento,
                    tdfe.ds_faixa_etaria AS idade,
                    fact.noNomeMae AS no_mome_mae
                FROM (
                    SELECT
                        tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                        tb_fat_cad_individual.nu_cns AS nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                        tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                        cad_individual.no_mae_cidadao AS noNomeMae,
                        tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                        tb_fat_cad_individual.co_dim_sexo AS sexo,
                        tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                    FROM
                        tb_fat_cad_individual
                    JOIN tb_dim_tipo_saida_cadastro 
                        ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    JOIN tb_cds_cad_individual cad_individual 
                        ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    WHERE
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892)
                        AND tb_fat_cad_individual.st_ficha_inativa = 0 
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_cidadao
                            WHERE 
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                                AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_atendimento_individual tfai 
                            WHERE 
                                tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                                AND (	                             
                                    tfai.ds_filtro_ciaps LIKE '%|ABP006|%' 
                            OR tfai.ds_filtro_ciaps IN ('|T89|', '|T90|') 
                            OR tfai.ds_filtro_cids IN ('|E10|', '|E100|', '|E101|', '|E102|', '|E103|', '|E104|', '|E105|', '|E106|', '|E107|', 
                            '|E108|', 'E109|', '|E11|', '|E110|', '|E111|', '|E112|', '|E113|', '|E114|', '|E115|', '|E116|', '|E117|', '|E118|',
                            '|E119|', '|E12|', '|E120|', '|E121|', '|E122|', '|E123|', '|E124|', '|E125|', '|E126|', '|E127|', '|E128|', '|E129|',
                            '|E13|', '|E130|', '|E131|', '|E132|', '|E133|', '|E134|', '|E135|', '|E136|', '|E137|', '|E138|', '|E139|', '|E14|',
                            '|E140|', '|E141|', '|E142|', '|E143|', '|E144|', '|E145|', '|E146|', '|E147|', '|E148|', '|E149|', '|O240|', '|O241|',
                            '|O242|','|O243|', '|P702|'
                                    )
                                )
                        ) 
                        AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
                ) AS fact
                LEFT JOIN tb_fat_cidadao_pec 
                    ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
                JOIN tb_dim_equipe tde 
                    ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc  
                JOIN tb_dim_sexo tds 
                    ON tds.co_seq_dim_sexo = fact.sexo
                JOIN tb_dim_faixa_etaria tdfe 
                    ON tdfe.co_seq_dim_faixa_etaria = fact.idade
                WHERE  (tde.nu_ine = p_equipe or p_equipe IS NULL)
            ) AS teste2
            GROUP BY teste2.idade
        ) AS t2
        ON t1.idade= t2.idade;	
    end;
    $$`
    },

    {
        name: 'Diabeticos Sexo',
        definition: `create or replace function diabeticos_sexo(
        p_equipe varchar default null)
    returns table(sexo varchar, total bigint)
    language plpgsql
    as $$
    begin
        return query
            SELECT 
            COALESCE(t1.sexo, t2.sexo) AS sexo,
            COALESCE(t1.count_sexo, 0) + COALESCE(t2.count_sexo, 0)::integer AS total_sexo
        FROM (
            -- Query 1
            SELECT 
                teste.sexo, 
                COUNT(*) AS count_sexo
            FROM (
                SELECT DISTINCT
                    tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                    fact.nuCns AS cns_cidadao,
                    fact.cpf AS cpf_cidadao,
                    fact.noNomeMae AS no_mome_mae,
                    fact.dtNascimento AS dt_nascimento,
                    tds.ds_sexo AS sexo,
                    tdfe.ds_faixa_etaria AS idade
                FROM (
                    SELECT
                        tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                        tb_fat_cad_individual.nu_cns AS nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                        tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                        cad_individual.no_mae_cidadao AS noNomeMae,
                        tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                        tb_fat_cad_individual.co_dim_sexo AS sexo,
                        tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                    FROM
                        tb_fat_cad_individual
                    JOIN tb_dim_tipo_saida_cadastro 
                        ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    JOIN tb_cds_cad_individual cad_individual 
                        ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    WHERE
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892)
                        AND tb_fat_cad_individual.st_diabete = 1
                        AND tb_fat_cad_individual.st_ficha_inativa = 0
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_cidadao
                            WHERE 
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                                AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                        )
                        AND NOT EXISTS (
                            SELECT 1
                            FROM tb_fat_atendimento_individual tfai 
                            WHERE 
                                tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                                AND (
                                    tfai.ds_filtro_ciaps LIKE '%|ABP006|%' 
                            OR tfai.ds_filtro_ciaps IN ('|T89|', '|T90|') 
                            OR tfai.ds_filtro_cids IN ('|E10|', '|E100|', '|E101|', '|E102|', '|E103|', '|E104|', '|E105|', '|E106|', '|E107|', 
                            '|E108|', 'E109|', '|E11|', '|E110|', '|E111|', '|E112|', '|E113|', '|E114|', '|E115|', '|E116|', '|E117|', '|E118|',
                            '|E119|', '|E12|', '|E120|', '|E121|', '|E122|', '|E123|', '|E124|', '|E125|', '|E126|', '|E127|', '|E128|', '|E129|',
                            '|E13|', '|E130|', '|E131|', '|E132|', '|E133|', '|E134|', '|E135|', '|E136|', '|E137|', '|E138|', '|E139|', '|E14|',
                            '|E140|', '|E141|', '|E142|', '|E143|', '|E144|', '|E145|', '|E146|', '|E147|', '|E148|', '|E149|', '|O240|', '|O241|',
                            '|O242|','|O243|', '|P702|'
                                    )
                                )
                        )
                        AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
                ) AS fact
                LEFT JOIN tb_fat_cidadao_pec 
                    ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
                JOIN tb_dim_equipe tde 
                    ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc 
                JOIN tb_dim_sexo tds 
                    ON tds.co_seq_dim_sexo = fact.sexo
                JOIN tb_dim_faixa_etaria tdfe 
                    ON tdfe.co_seq_dim_faixa_etaria = fact.idade
                WHERE (p_equipe IS NULL OR tde.nu_ine = p_equipe)
            ) AS teste
            GROUP BY teste.sexo
        ) AS t1
        FULL JOIN (
            -- Query 2
            SELECT 
                teste2.sexo, 
                COUNT(*) AS count_sexo
            FROM (
                SELECT DISTINCT
                    fact.fciCidadaoPec AS fciCidadaoPec,    
                    fact.nuCns AS cns_cidadao,
                    fact.cpf AS cpf_cidadao,
                    tb_fat_cidadao_pec.no_cidadao AS nome_cidadao,
                    tds.ds_sexo AS sexo,
                    fact.dtNascimento AS dt_nascimento,
                    tdfe.ds_faixa_etaria AS idade,
                    fact.noNomeMae AS no_mome_mae
                FROM (
                    SELECT
                        tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                        tb_fat_cad_individual.nu_cns AS nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                        tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                        cad_individual.no_mae_cidadao AS noNomeMae,
                        tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                        tb_fat_cad_individual.co_dim_sexo AS sexo,
                        tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                    FROM
                        tb_fat_cad_individual
                    JOIN tb_dim_tipo_saida_cadastro 
                        ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    JOIN tb_cds_cad_individual cad_individual 
                        ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    WHERE
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 945, 8892)
                        AND tb_fat_cad_individual.st_ficha_inativa = 0 
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_cidadao
                            WHERE 
                                tb_fat_cidadao.co_fat_cad_individual = tb_fat_cad_individual.co_seq_fat_cad_individual
                                AND tb_fat_cidadao.co_dim_tempo_valdd_unidd_saud > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                                AND tb_fat_cidadao.co_dim_tempo <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM tb_fat_atendimento_individual tfai 
                            WHERE 
                                tfai.co_fat_cidadao_pec = tb_fat_cad_individual.co_fat_cidadao_pec
                                AND (
                                    tfai.ds_filtro_ciaps LIKE '%|ABP006|%' 
                            OR tfai.ds_filtro_ciaps IN ('|T89|', '|T90|') 
                            OR tfai.ds_filtro_cids IN ('|E10|', '|E100|', '|E101|', '|E102|', '|E103|', '|E104|', '|E105|', '|E106|', '|E107|', 
                            '|E108|', 'E109|', '|E11|', '|E110|', '|E111|', '|E112|', '|E113|', '|E114|', '|E115|', '|E116|', '|E117|', '|E118|',
                            '|E119|', '|E12|', '|E120|', '|E121|', '|E122|', '|E123|', '|E124|', '|E125|', '|E126|', '|E127|', '|E128|', '|E129|',
                            '|E13|', '|E130|', '|E131|', '|E132|', '|E133|', '|E134|', '|E135|', '|E136|', '|E137|', '|E138|', '|E139|', '|E14|',
                            '|E140|', '|E141|', '|E142|', '|E143|', '|E144|', '|E145|', '|E146|', '|E147|', '|E148|', '|E149|', '|O240|', '|O241|',
                            '|O242|','|O243|', '|P702|'
                                    )
                                )
                        ) 
                        AND tb_dim_tipo_saida_cadastro.nu_identificador = '-'
                ) AS fact
                LEFT JOIN tb_fat_cidadao_pec 
                    ON fact.fciCidadaoPec = tb_fat_cidadao_pec.co_seq_fat_cidadao_pec
                JOIN tb_dim_equipe tde 
                    ON tde.co_seq_dim_equipe = tb_fat_cidadao_pec.co_dim_equipe_vinc  
                JOIN tb_dim_sexo tds 
                    ON tds.co_seq_dim_sexo = fact.sexo
                JOIN tb_dim_faixa_etaria tdfe 
                    ON tdfe.co_seq_dim_faixa_etaria = fact.idade
                WHERE (p_equipe IS NULL OR tde.nu_ine = p_equipe)
            ) AS teste2
            GROUP BY teste2.sexo
        ) AS t2
        ON t1.sexo = t2.sexo;
    end;
    $$`
    },

    /*-------------------------------------------------------*/
    /*------------------- GESTANTES ------------------------*/
    {
        name: 'PRENATAL ODONTOLOGICO',
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
    },
    /*-----------------------------------------------------*/
    /*------------FUNÇÕES AUXILIARES -----------------------------*/
    {
        name: 'Lista ACS',
        definition: `create or replace function listar_acs()
    returns table (cns varchar, profissional varchar)
    language plpgsql
    as $$
    begin
        return query
        select 
            tdp.nu_cns,
            tdp.no_profissional 
        from tb_dim_profissional tdp 
        join (select tcp.nu_cns, tcp.nu_cbo_2002 from tb_cds_prof tcp 
        where tcp.nu_cbo_2002 = '515105' and tcp.nu_ine is not null and tcp.nu_cns like '7%') as cds_prof on cds_prof.nu_cns = tdp.nu_cns 
        where tdp.st_registro_valido = 1 and cds_prof.nu_cns like '7%' and tdp.no_profissional not like 'Klin%'
        group by tdp.nu_cns, tdp.no_profissional  
        order by tdp.no_profissional asc;	
    end;
    $$`
    },

    {
        name: 'Listar ESB',
        definition: `create or replace function listar_esb()
    returns table (ine varchar, nomeequipe varchar)
    language plpgsql
    as $$
    begin
        return query
        select 
        nu_ine,
        no_equipe
        from tb_dim_equipe tde 
        where tde.no_equipe like ('ESB%') and st_registro_valido = 1
        order by no_equipe;
    end;
    $$`
    },

    {
        name: 'Lista ESF',
        definition: `create or replace function listar_esf()
    returns table (ine varchar, nomeequipe varchar)
    language plpgsql
    as $$
    begin
        return query
        select 
        nu_ine,
        no_equipe
        from tb_dim_equipe tde 
        where tde.no_equipe not like ('ESB%') and 
        st_registro_valido = 1
        order by no_equipe;
    end;
    $$`
    },

    {
        name: 'Lista Unidade de Saúde',
        definition: `create or replace function listar_cnes()
    returns table(cnes varchar, nome_unidade varchar)
    language plpgsql
    as $$
    begin
        return query
        select 
        nu_cnes,
        no_unidade_saude
        from tb_dim_unidade_saude tdus
        where tdus.ds_filtro is not null;
    end;
    $$`
    },

    {
        name: 'Lista Profissionais',
        definition: `create or replace function getcategorias()
    returns table(codigo bigint, nome text)
    language plpgsql
    as $$
    begin
        return query
        select tdc.co_seq_dim_cbo as codigo,
        case 
            when no_cbo = 'ENFERMEIRO DA ESTRATÉGIA DE SAÚDE DA FAMÍLIA' then 'ENFERMEIRO ESF'
            when no_cbo = 'MÉDICO DA ESTRATÉGIA DE SAÚDE DA FAMÍLIA' then 'MÉDICO ESF'
            when no_cbo = 'MÉDICO CLÍNICO' then 'MÉDICO CLÍNICO'
            when no_cbo = 'ENFERMEIRO' then 'ENFERMEIRO'
        end as nome
        from tb_dim_cbo tdc 
        where nu_cbo in ('225142', '223565') and tdc.st_registro_valido = 1
        order by co_seq_dim_cbo;
    end;
    $$`
    }
];



export default functions;
