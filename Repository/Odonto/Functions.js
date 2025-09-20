// functions.js

const functions = [
    //INDICADORES DE QUALIDADE ODONTOLOGIA
      {
        name: 'Primeira Consulta Odontologica Programática',
        definition: `CREATE OR REPLACE FUNCTION PRIMEIRA_CONSULTA(
            QUADRIMESTRE DATE,
            P_EQUIPE TEXT DEFAULT NULL)
        RETURNS TABLE(
            ESB_INE VARCHAR,
            PRIMEIRA_CONS_ODONTO INTEGER,
            CIDADAO_VINCULADOS INTEGER,
            COBERTURA_PRIM_CONS_ODONTO FLOAT,
            CLASSIFICACAO TEXT)
        AS $$
        BEGIN
            RETURN QUERY
            ---LISTA DE EQUIPES
            WITH CTE_EQUIPES AS (
                SELECT 
                    NU_INE AS INE,
                    NO_EQUIPE AS NOME_EQUIPE
                FROM TB_EQUIPE
                LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                WHERE ST_ATIVO = 1 AND NU_MS = '71'),
            --CALCULA QUANTIDADE PRIMEIRA CONSULTA ODONTOLOGICA PROGRAMATICA	
            PRIMEIRA_CONSULTA AS ( SELECT 
                    INE_SB,
                    COUNT(*) AS TOTAL_PRIMEIRA_CONSULTA
                FROM (
                    SELECT 
                        TDE.NU_INE AS INE_SB,
                        TFAO.CO_FAT_CIDADAO_PEC
                    FROM TB_FAT_ATENDIMENTO_ODONTO TFAO 
                    LEFT JOIN TB_FAT_ATEND_ODONTO_PROCED TFAOP 
                        ON TFAOP.CO_FAT_ATD_ODNT = TFAO.CO_SEQ_FAT_ATD_ODNT 
                    LEFT JOIN TB_DIM_PROCEDIMENTO TDP 
                        ON TDP.CO_SEQ_DIM_PROCEDIMENTO = TFAOP.CO_DIM_PROCEDIMENTO 
                    LEFT JOIN TB_DIM_EQUIPE TDE 
                        ON TDE.CO_SEQ_DIM_EQUIPE = TFAO.CO_DIM_EQUIPE_1
                    LEFT JOIN TB_DIM_CBO TDC 
                        ON TDC.CO_SEQ_DIM_CBO = TFAO.CO_DIM_CBO_1 	
                    WHERE 
                        (TDP.CO_PROCED = '0301010153'
                        OR TFAO.CO_DIM_TIPO_CONSULTA = 1)
                        AND TDC.NU_CBO IN ('223208', '223293', '223272')
                        AND TO_DATE(TFAO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= QUADRIMESTRE - INTERVAL '12 MONTHS'
                    GROUP BY 
                        TDE.NU_INE, 
                        TFAO.CO_FAT_CIDADAO_PEC,
                        TFAO.NU_ATENDIMENTO
                    HAVING 
                        COALESCE(COALESCE(TFAO.NU_ATENDIMENTO, 0), 0) = 1
                ) AS PACIENTES_FILTRADOS
                GROUP BY INE_SB),
            --LISTA AS EQUIPES VINCULADAS AS EQUIPES DE SAUDE BUCAL
            EQUIPE_VINCULADA AS (
                SELECT 
                    TDE1.NU_INE AS INE_PRINCIPAL,
                    TDE.NU_INE AS INE_VINCULADO
                FROM TB_DIM_VINCULACAO_EQUIPES TDVE
                JOIN TB_DIM_EQUIPE TDE1 ON TDVE.CO_DIM_EQUIPE_PRINCIPAL = TDE1.CO_SEQ_DIM_EQUIPE
                JOIN TB_DIM_EQUIPE TDE ON TDVE.CO_DIM_EQUIPE_VINCULADA = TDE.CO_SEQ_DIM_EQUIPE	
            ),
            RESUMO AS (SELECT 
                EQUIPES.INE, 
                PC.TOTAL_PRIMEIRA_CONSULTA,	
                PV.TOTAL_VINCULADO,
                ROUND(COALESCE(PC.TOTAL_PRIMEIRA_CONSULTA, 0)::NUMERIC / 
                COALESCE(PV.TOTAL_VINCULADO, 0)::NUMERIC * 100, 2) AS COBERTURA    
            FROM CTE_EQUIPES EQUIPES 
            JOIN EQUIPE_VINCULADA EV ON EV.INE_PRINCIPAL = EQUIPES.INE
            LEFT JOIN PRIMEIRA_CONSULTA PC ON PC.INE_SB = EQUIPES.INE
            LEFT JOIN LATERAL (
                SELECT * 
                FROM DIM_VINCULO(QUADRIMESTRE, EV.INE_VINCULADO) -- BUSCA A QUANTIDADE DE CIDADAO VINCULADOS
            ) AS PV ON TRUE)
            SELECT 
                INE,
                COALESCE(TOTAL_PRIMEIRA_CONSULTA, 0)::INTEGER AS TOTAL_PRIMEIRA_CONSULTA,
                TOTAL_VINCULADO::INTEGER,
                COBERTURA::FLOAT,
                CASE 
                    WHEN COBERTURA <= 1 THEN 'REGULAR'
                    WHEN COBERTURA > 1 AND COBERTURA <= 3 THEN 'SUFICIENTE'
                    WHEN COBERTURA > 3 AND COBERTURA <= 5 THEN 'BOM'
                    ELSE 'ÓTIMO'
                END AS CLASSIFICACAO	
            FROM RESUMO
            WHERE (P_EQUIPE IS NULL OR INE = P_EQUIPE) 
            ORDER BY COBERTURA DESC;	
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'Tratamento Odontológico Concluído',
        definition: `CREATE OR REPLACE FUNCTION TRATAMENTO_CONCLUIDO(
            QUADRIMESTRE DATE,
            P_EQUIPE VARCHAR DEFAULT NULL)
        RETURNS TABLE(
            ESB_INE VARCHAR,
            TRAT_CONCLUIDO INTEGER,
            PRIMEIRA_CONS_ODONTO INTEGER,
            PERC_COBERTURA FLOAT,
            CLASSIFICACAO TEXT)
        AS $$
        BEGIN
            RETURN QUERY
            WITH CTE_EQUIPES AS (
                SELECT 
                NU_INE AS INE,
                NO_EQUIPE AS NOME_EQUIPE
                FROM TB_EQUIPE
                LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                WHERE ST_ATIVO = 1 AND NU_MS = '71'
                ),
                PRIMEIRA_CONSULTA AS (
                    SELECT 
                        TDE.NU_INE AS INE_SB,
                        TFAO.CO_FAT_CIDADAO_PEC,
                        MIN(TO_DATE(TFAO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) AS DT_PRIMEIRA_CONSULTA
                    FROM TB_FAT_ATENDIMENTO_ODONTO TFAO 
                    LEFT JOIN TB_FAT_ATEND_ODONTO_PROCED TFAOP 
                        ON TFAOP.CO_FAT_ATD_ODNT = TFAO.CO_SEQ_FAT_ATD_ODNT 
                    LEFT JOIN TB_DIM_PROCEDIMENTO TDP 
                        ON TDP.CO_SEQ_DIM_PROCEDIMENTO = TFAOP.CO_DIM_PROCEDIMENTO 
                    LEFT JOIN TB_DIM_EQUIPE TDE 
                        ON TDE.CO_SEQ_DIM_EQUIPE = TFAO.CO_DIM_EQUIPE_1
                    LEFT JOIN TB_DIM_CBO TDC 
                        ON TDC.CO_SEQ_DIM_CBO = TFAO.CO_DIM_CBO_1 	
                    WHERE 
                        (TDP.CO_PROCED = '0301010153' OR TFAO.CO_DIM_TIPO_CONSULTA = 1)
                        AND TDC.NU_CBO IN ('223208', '223293', '223272')
                        AND TO_DATE(TFAO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') <= QUADRIMESTRE - INTERVAL '12 MONTHS'
                    GROUP BY 
                        TDE.NU_INE, 
                        TFAO.CO_FAT_CIDADAO_PEC
                ),
                TRATAMENTO_CONCLUIDO AS (
                    SELECT 
                        TDE.NU_INE AS INE,
                        PC.CO_FAT_CIDADAO_PEC,
                        COUNT(*) AS TOTAL_CONCLUIDO
                    FROM TB_FAT_ATENDIMENTO_ODONTO TFAO 
                    INNER JOIN TB_DIM_EQUIPE TDE 
                        ON TDE.CO_SEQ_DIM_EQUIPE = TFAO.CO_DIM_EQUIPE_1
                    INNER JOIN PRIMEIRA_CONSULTA PC 
                        ON PC.CO_FAT_CIDADAO_PEC = TFAO.CO_FAT_CIDADAO_PEC
                    WHERE 
                        ST_CONDUTA_TRATAMENTO_CONCLUID = 1 
                        AND TO_DATE(TFAO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= PC.DT_PRIMEIRA_CONSULTA + INTERVAL '12 MONTHS'
                    GROUP BY 
                        TDE.NU_INE, PC.CO_FAT_CIDADAO_PEC
                ),
                AGRUPADO_POR_EQUIPE AS (
                    SELECT 
                        INE,
                        COUNT(TOTAL_CONCLUIDO) AS TOTAL_CONCLUIDO
                    FROM TRATAMENTO_CONCLUIDO
                    GROUP BY INE
                ),
                TOTAL_PRIMEIRAS_CONSULTAS AS (
                    SELECT 
                        INE_SB AS INE,
                        COUNT(*) AS TOTAL_PRIMEIRA_CONSULTA
                    FROM PRIMEIRA_CONSULTA
                    GROUP BY INE_SB
                ),
                RESUMO AS (
                    SELECT 
                        EQUIPES.INE,
                        COALESCE(TC.TOTAL_CONCLUIDO, 0) AS TOTAL_CONCLUIDO,
                        COALESCE(PC.TOTAL_PRIMEIRA_CONSULTA, 0) AS TOTAL_PRIMEIRA_CONSULTA, 
                        COALESCE(
                            ROUND(
                                COALESCE(TC.TOTAL_CONCLUIDO, 0)::NUMERIC / 
                                NULLIF(COALESCE(PC.TOTAL_PRIMEIRA_CONSULTA, 0), 0) * 100
                            , 2)
                        , 0) AS COBERTURA    
                    FROM CTE_EQUIPES EQUIPES 
                    LEFT JOIN AGRUPADO_POR_EQUIPE TC 
                        ON TC.INE = EQUIPES.INE
                    LEFT JOIN TOTAL_PRIMEIRAS_CONSULTAS PC 
                        ON PC.INE = EQUIPES.INE
                )
                SELECT 
                    INE AS EQUIPE,
                    TOTAL_CONCLUIDO::INTEGER,
                    TOTAL_PRIMEIRA_CONSULTA::INTEGER,
                    COBERTURA::FLOAT,
                    CASE 
                        WHEN COBERTURA <= 25 THEN 'REGULAR'
                        WHEN COBERTURA > 25 AND COBERTURA <= 50 THEN 'SUFICIENTE'
                        WHEN COBERTURA > 50 AND COBERTURA <= 75 THEN 'BOM'
                        WHEN COBERTURA > 75 AND COBERTURA <= 100 THEN 'ÓTIMO'
                        ELSE 'DESCLASSIFICADO'
                    END AS CLASSIFICACAO	
                FROM RESUMO
                WHERE (P_EQUIPE IS NULL OR INE = P_EQUIPE) 
                ORDER BY COBERTURA DESC;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'Taxa de Exodontias na APS',
        definition: `CREATE OR REPLACE FUNCTION TX_EXODONTIAS(
            QUADRIMESTRE DATE,
            P_EQUIPE VARCHAR DEFAULT NULL)
        RETURNS TABLE(
            EQUIPE VARCHAR,
            EXODONTIAS INTEGER,
            PROCED_PREVENTIVOS INTEGER,
            RESULTADO FLOAT,
            CLASSIFICACAO TEXT)
        AS $$
        BEGIN
            RETURN QUERY
            WITH CTE_EQUIPES AS (
                SELECT 
                    NU_INE AS INE,
                    NO_EQUIPE AS NOME_EQUIPE
            FROM TB_EQUIPE
            LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
            WHERE ST_ATIVO = 1 AND NU_MS = '71'
            ),
            EXODONTIAS AS (
                SELECT 
                    TDE.NU_INE, 
                    COUNT(*) AS TOTAL
                FROM TB_FAT_ATENDIMENTO_ODONTO TFAO 
                LEFT JOIN TB_FAT_ATEND_ODONTO_PROCED TFAOP ON TFAOP.CO_FAT_ATD_ODNT = TFAO.CO_SEQ_FAT_ATD_ODNT 
                LEFT JOIN TB_DIM_PROCEDIMENTO TDP ON TDP.CO_SEQ_DIM_PROCEDIMENTO = TFAOP.CO_DIM_PROCEDIMENTO 
                LEFT JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFAO.CO_DIM_EQUIPE_1
                LEFT JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = TFAO.CO_DIM_CBO_1 
                WHERE 
                    TDP.CO_PROCED IN ('0414020138', '0414020146') 
                    AND TO_DATE(TFAO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= QUADRIMESTRE - INTERVAL '12 MONTHS'
                    AND TDC.NU_CBO IN ('223208', '223293', '223272')
                GROUP BY TDE.NU_INE
            ),
            PROCEDIMENTOS_PREVENTIVOS AS (
                SELECT 
                    TDE.NU_INE, 
                    COUNT(*) AS TOTAL
                FROM TB_FAT_ATENDIMENTO_ODONTO TFAO 
                LEFT JOIN TB_FAT_ATEND_ODONTO_PROCED TFAOP ON TFAOP.CO_FAT_ATD_ODNT = TFAO.CO_SEQ_FAT_ATD_ODNT 
                LEFT JOIN TB_DIM_PROCEDIMENTO TDP ON TDP.CO_SEQ_DIM_PROCEDIMENTO = TFAOP.CO_DIM_PROCEDIMENTO 
                LEFT JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFAO.CO_DIM_EQUIPE_1
                LEFT JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = TFAO.CO_DIM_CBO_1 
                WHERE 
                    TDP.CO_PROCED IN (
                        '0101020058', '0101020066', '0101020074', '0101020082', '0101020090',
                        '0307010015', '0307010031', '0307010066', '0307010074', '0307010082',
                        '0307010104', '0307010112', '0307010120', '0307010139', '0307020010', 
                        '0307020029', '0307020070', '0307030024', '0307030040', '0307030059',
                        '0307030067', '0307030075', '0307030083', '0414020138', '0414020146')
                    AND TDC.NU_CBO IN ('223208', '223293', '223272')
                    AND TO_DATE(TFAO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= QUADRIMESTRE - INTERVAL '12 MONTHS'
                GROUP BY TDE.NU_INE
            ),
            RESUMO AS (
                SELECT 
                    EQUIPE.INE,
                    COALESCE(SUM(EXO.TOTAL), 0) AS TOTAL_EXODONTIAS,
                    COALESCE(SUM(PP.TOTAL), 0) AS TOTAL_PROC_PREVENTIVOS,
                    COALESCE(ROUND(
                        (COALESCE(SUM(EXO.TOTAL), 0)::NUMERIC / NULLIF(COALESCE(SUM(PP.TOTAL), 0), 0)::NUMERIC) * 100, 
                        2
                    ),0) AS RAZAO
                FROM CTE_EQUIPES EQUIPE
                LEFT JOIN EXODONTIAS EXO ON EXO.NU_INE = EQUIPE.INE
                LEFT JOIN PROCEDIMENTOS_PREVENTIVOS PP ON PP.NU_INE = EQUIPE.INE
                --WHERE EQUIPE.INE = '0001728687'
                GROUP BY EQUIPE.INE 
                --ORDER BY RAZAO DESC 
            )
            SELECT 
                INE,
                TOTAL_EXODONTIAS::INTEGER,
                TOTAL_PROC_PREVENTIVOS::INTEGER,
                RAZAO::FLOAT,
                CASE 
                    WHEN RAZAO < 8 OR RAZAO >= 14 THEN 'REGULAR'
                    WHEN RAZAO >= 12 AND RAZAO < 14 THEN 'SUFICIENTE'
                    WHEN RAZAO >= 10 AND RAZAO < 12 THEN 'BOM'        
                    ELSE 'ÓTIMO'
                END AS CLASSIFICACAO
            FROM RESUMO
            WHERE (P_EQUIPE IS NULL OR INE = P_EQUIPE) --'0002039141'
            ORDER BY CLASSIFICACAO ASC;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'Escovação Supervisionada',
        definition: `CREATE OR REPLACE FUNCTION ESCOVACAO_SUPERVISIONADA(
            QUADRIMESTRE DATE,
            P_EQUIPE VARCHAR DEFAULT NULL)
        RETURNS TABLE(
            INE_ESB VARCHAR,
            ATIV_COLETIVA INTEGER,
            CIDADAO_VINCULADO INTEGER,
            COBER_ATV_COLETIVA FLOAT,
            CLASSIFICACAO TEXT)
        AS $$
        BEGIN
            RETURN QUERY
            WITH CTE_EQUIPES AS (
            SELECT 
                    NU_INE AS INE,
                    NO_EQUIPE AS NOME_EQUIPE
                FROM TB_EQUIPE
                LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                WHERE ST_ATIVO = 1 AND NU_MS = '71'),
            ATIV_COLETIVA AS (
                SELECT 
                    TDE.NU_INE, 
                    COUNT(*) AS TOTAL_ATV_COLETIVA 
                FROM TB_FAT_ATVDD_COLETIVA_PART TFACP
                JOIN TB_FAT_ATIVIDADE_COLETIVA TFAC ON TFAC.CO_SEQ_FAT_ATIVIDADE_COLETIVA = TFACP.CO_FAT_ATIVIDADE_COLETIVA
                LEFT JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = TFACP.CO_DIM_CBO 
                JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFACP.CO_DIM_EQUIPE 
                WHERE 
                    (TFACP.NU_PARTICIPANTE_CNS IS NOT NULL OR  TFACP.NU_CPF_PARTICIPANTE IS NOT NULL)
                AND TFAC.CO_DIM_TIPO_ATIVIDADE = 6 AND TFAC.DS_FILTRO_PRATICA_EM_SAUDE = '|9|'
                AND TO_DATE(TFACP.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') <= QUADRIMESTRE - INTERVAL '12 MONTHS'
                AND TDC.NU_CBO IN ('223208', '223293', '223272', '322405', '322245', '322415', '322430')
                AND (
                    DATE_PART('YEAR', TO_DATE(TFACP.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) - 
                    DATE_PART('YEAR', TFACP.DT_PARTICIPANTE_NASCIMENTO)
                    - CASE 
                        WHEN TO_CHAR(TO_DATE(TFACP.CO_DIM_TEMPO::TEXT, 'YYYYMMDD'), 'MMDD') < TO_CHAR(TFACP.DT_PARTICIPANTE_NASCIMENTO, 'MMDD')
                        THEN 1 ELSE 0 
                    END
                ) BETWEEN 6 AND 12
            GROUP BY TDE.NU_INE),
            EQUIPE_VINCULADA AS (
                SELECT 
                    TDE1.NU_INE AS INE_PRINCIPAL,
                    TDE.NU_INE AS INE_VINCULADO
                FROM TB_DIM_VINCULACAO_EQUIPES TDVE
                JOIN TB_DIM_EQUIPE TDE1 ON TDVE.CO_DIM_EQUIPE_PRINCIPAL = TDE1.CO_SEQ_DIM_EQUIPE
                JOIN TB_DIM_EQUIPE TDE ON TDVE.CO_DIM_EQUIPE_VINCULADA = TDE.CO_SEQ_DIM_EQUIPE    
            ),
            RESUMO AS (SELECT 
                EQUIPES.INE, 
                AC.TOTAL_ATV_COLETIVA::INTEGER,
                PV.TOTAL_VINCULADO::INTEGER,
                ROUND(COALESCE(AC.TOTAL_ATV_COLETIVA, 0)::NUMERIC / 
                COALESCE(PV.TOTAL_VINCULADO, 0)::NUMERIC * 100, 2)::FLOAT AS COBERTURA    
            FROM CTE_EQUIPES EQUIPES 
            JOIN EQUIPE_VINCULADA EV ON EV.INE_PRINCIPAL = EQUIPES.INE
            LEFT JOIN ATIV_COLETIVA AC ON AC.NU_INE = EQUIPES.INE
            LEFT JOIN LATERAL (
                SELECT * 
                FROM DIM_VINCULO(QUADRIMESTRE, EV.INE_VINCULADO)
            ) AS PV ON TRUE)
            SELECT 
                INE,
                COALESCE(TOTAL_ATV_COLETIVA, 0) AS TOTAL_ATV_COLETIVA,
                TOTAL_VINCULADO,
                COBERTURA,
                CASE 
                    WHEN COBERTURA <= 0.25 THEN 'REGULAR'
                    WHEN COBERTURA > 0.25 AND COBERTURA <= 0.5 THEN 'SUFICIENTE'
                    WHEN COBERTURA > 0.5 AND COBERTURA <= 1 THEN 'BOM'
                    ELSE 'ÓTIMO'
                END AS CLASSIFICACAO	
            FROM RESUMO
            WHERE (P_EQUIPE IS NULL OR INE = P_EQUIPE)
            ORDER BY COBERTURA DESC;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'Procedimentos Preventivos',
        definition: `CREATE OR REPLACE FUNCTION PROCEDIMENTO_PREVENTIVOS(
            QUADRIMESTRE DATE,
            P_EQUIPE VARCHAR DEFAULT NULL)
        RETURNS TABLE (
            SB_INE VARCHAR, 
            PROC_PREVENTIVO INTEGER,
            TOTAL_PROCEDIMENTOS INTEGER,
            PERCENTUAL FLOAT,
            CLASSIFICACAO TEXT)
        AS $$
        BEGIN
            RETURN QUERY
            WITH CTE_EQUIPES AS (
                SELECT 
                    NU_INE AS INE,
                    NO_EQUIPE AS NOME_EQUIPE
                FROM TB_EQUIPE
                LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                WHERE ST_ATIVO = 1 AND NU_MS = '71'),
            PROCEDIMENTOS_PREVENTIVOS AS (
                SELECT TDE.NU_INE, 
                    TDP.CO_PROCED AS CODIGO_SIGTAP, 
                    TDP.DS_PROCED AS PROCEDIMENTO, 
                    SUM(TFAOP.QT_PROCEDIMENTOS) AS TOTAL 
                FROM TB_FAT_ATENDIMENTO_ODONTO TFAO 
                LEFT JOIN TB_FAT_ATEND_ODONTO_PROCED TFAOP ON
                TFAOP.CO_FAT_ATD_ODNT = TFAO.CO_SEQ_FAT_ATD_ODNT 
                LEFT JOIN TB_DIM_PROCEDIMENTO TDP ON
                TDP.CO_SEQ_DIM_PROCEDIMENTO = TFAOP.CO_DIM_PROCEDIMENTO 
                LEFT JOIN TB_DIM_EQUIPE TDE ON
                TDE.CO_SEQ_DIM_EQUIPE = TFAO.CO_DIM_EQUIPE_1
                LEFT JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = TFAO.CO_DIM_CBO_1 
                WHERE TDP.CO_PROCED IN (
                    '0101020058', '0101020066', '0101020074', '0101020082', '0101020090',
                    '0101020104')
                    OR TDP.CO_PROCED LIKE '|ABPO%|'
                    AND TDC.NU_CBO IN ('223208', '223293', '223272', '322405', '322245', '322415', '322430')
                --AND TDE.NU_INE = '0001728687'
                AND TO_DATE(TFAO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= QUADRIMESTRE - INTERVAL '12 MONTHS' 
                GROUP BY TDE.NU_INE, TDP.CO_PROCED, TDP.DS_PROCED),
            TOTAL_PROCEDIMENTOS AS (
                SELECT 
                    TDE.NU_INE,
                    SUM(TFAOP.QT_PROCEDIMENTOS) AS TOTAL_GERAL 
                FROM TB_FAT_ATENDIMENTO_ODONTO TFAO 
                LEFT JOIN TB_FAT_ATEND_ODONTO_PROCED TFAOP ON
                TFAOP.CO_FAT_ATD_ODNT = TFAO.CO_SEQ_FAT_ATD_ODNT 
                LEFT JOIN TB_DIM_PROCEDIMENTO TDP ON
                TDP.CO_SEQ_DIM_PROCEDIMENTO = TFAOP.CO_DIM_PROCEDIMENTO 
                LEFT JOIN TB_DIM_EQUIPE TDE ON
                TDE.CO_SEQ_DIM_EQUIPE = TFAO.CO_DIM_EQUIPE_1
                LEFT JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = TFAO.CO_DIM_CBO_1 
                WHERE 
                    TDC.NU_CBO IN ('223208', '223293', '223272', '322405', '322245', '322415', '322430')
                    --AND TDE.NU_INE = '0001728687'
                    AND TO_DATE(TFAO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= QUADRIMESTRE - INTERVAL '12 MONTHS'
                    GROUP BY TDE.NU_INE),
            RESUMO AS (
                SELECT
                EQUIPE.INE AS INE,	
                COALESCE(SUM(PP.TOTAL), 0) AS PROC_PREV,
                COALESCE(SUM(TP.TOTAL_GERAL), 0) AS PROC_TOTAL,
                ROUND(COALESCE(SUM(PP.TOTAL), 0)::NUMERIC / NULLIF (COALESCE(SUM(TP.TOTAL_GERAL), 0)::NUMERIC, 0) * 100, 2) AS PERC_PROCEDIMENTOS	
                FROM CTE_EQUIPES EQUIPE
                LEFT JOIN PROCEDIMENTOS_PREVENTIVOS PP ON PP.NU_INE = EQUIPE.INE
                LEFT JOIN TOTAL_PROCEDIMENTOS TP ON TP.NU_INE = EQUIPE.INE
                GROUP BY EQUIPE.INE)	
            SELECT
                INE AS INE_ESB,
                PROC_PREV::INTEGER,
                PROC_TOTAL::INTEGER,
                PERC_PROCEDIMENTOS::FLOAT,
                CASE
                    WHEN PERCENTUAL < 40 OR PERCENTUAL > 85 THEN 'REGULAR'
                    WHEN PERCENTUAL >= 40 AND PERCENTUAL < 60 THEN 'SUFICIENTE'
                    WHEN PERCENTUAL >= 60 AND PERCENTUAL < 80 THEN 'BOM'
                    ELSE 'ÓTIMO'
                END AS CLASSIFICACAO
            FROM RESUMO
            WHERE (P_EQUIPE IS NULL OR INE = P_EQUIPE) --'0002039184'
            ORDER BY PERCENTUAL DESC; 
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'Trat Restaurador Atraumatico',
        definition: `CREATE OR REPLACE FUNCTION TRA(
            QUADRIMESTRE DATE,
            P_EQUIPE VARCHAR DEFAULT NULL)
        RETURNS TABLE(
            INE_ESB VARCHAR,
            TRA_TOTAL INTEGER,
            PROCED_RESTAURADOR INTEGER,
            RAZAO_TRA FLOAT,
            CLASSIFICACAO TEXT)
        AS $$
        BEGIN
            RETURN QUERY
            WITH CTE_EQUIPES AS (
            SELECT 
                NU_INE AS INE,
                NO_EQUIPE AS NOME_EQUIPE
            FROM TB_EQUIPE
            LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
            WHERE ST_ATIVO = 1 AND NU_MS = '71'
        ),
        TRA AS (
            SELECT 
                TDE.NU_INE, 
                COUNT(*) AS TOTAL
            FROM TB_FAT_ATENDIMENTO_ODONTO TFAO 
            LEFT JOIN TB_FAT_ATEND_ODONTO_PROCED TFAOP ON TFAOP.CO_FAT_ATD_ODNT = TFAO.CO_SEQ_FAT_ATD_ODNT 
            LEFT JOIN TB_DIM_PROCEDIMENTO TDP ON TDP.CO_SEQ_DIM_PROCEDIMENTO = TFAOP.CO_DIM_PROCEDIMENTO 
            LEFT JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFAO.CO_DIM_EQUIPE_1
            LEFT JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = TFAO.CO_DIM_CBO_1 
            WHERE 
                TDP.CO_PROCED = '0307010074' 
                AND TO_DATE(TFAO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= QUADRIMESTRE - INTERVAL '24 MONTHS'
                AND TDC.NU_CBO IN ('223208', '223293', '223272')
            GROUP BY TDE.NU_INE
        ),
        PROCEDIMENTOS_RESTAURADORES AS (
            SELECT 
                TDE.NU_INE, 
                COUNT(*) AS TOTAL
            FROM TB_FAT_ATENDIMENTO_ODONTO TFAO 
            LEFT JOIN TB_FAT_ATEND_ODONTO_PROCED TFAOP ON TFAOP.CO_FAT_ATD_ODNT = TFAO.CO_SEQ_FAT_ATD_ODNT 
            LEFT JOIN TB_DIM_PROCEDIMENTO TDP ON TDP.CO_SEQ_DIM_PROCEDIMENTO = TFAOP.CO_DIM_PROCEDIMENTO 
            LEFT JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFAO.CO_DIM_EQUIPE_1
            LEFT JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = TFAO.CO_DIM_CBO_1 
            WHERE 
                TDP.CO_PROCED IN (
                    '0307010031', '0307010082', '0307010090', '0307010104', '0307010112', '0307010120',
                    '0307010139', '0307010023',	'0307010040', '0307010074' )
                AND TDC.NU_CBO IN ('223208', '223293', '223272')
                AND TO_DATE(TFAO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= QUADRIMESTRE - INTERVAL '12 MONTHS'
            GROUP BY TDE.NU_INE
        ),
        RESUMO AS (
            SELECT 
                EQUIPE.INE,
                COALESCE(SUM(TRA.TOTAL), 0) AS TOTAL_TRA,
                COALESCE(SUM(PR.TOTAL), 0) AS TOTAL_PROC_RESTAURADOR,
                COALESCE(ROUND(
                    (COALESCE(SUM(TRA.TOTAL), 0)::NUMERIC / NULLIF(COALESCE(SUM(PR.TOTAL), 0), 0)::NUMERIC) * 100, 
                    2
                ),0) AS RAZAO
            FROM CTE_EQUIPES EQUIPE
            LEFT JOIN TRA ON TRA.NU_INE = EQUIPE.INE
            LEFT JOIN PROCEDIMENTOS_RESTAURADORES PR ON PR.NU_INE = EQUIPE.INE   
            GROUP BY EQUIPE.INE   
        )
        SELECT 
            INE,
            TOTAL_TRA::INTEGER,
            TOTAL_PROC_RESTAURADOR::INTEGER,
            RAZAO::FLOAT,
            CASE 
                WHEN RAZAO <= 3 THEN 'REGULAR'
                WHEN RAZAO > 3 AND RAZAO <= 6 THEN 'SUFICIENTE'
                WHEN RAZAO > 6 AND RAZAO <= 8 THEN 'BOM'        
                ELSE 'ÓTIMO'
            END AS CLASSIFICACAO
        FROM RESUMO
        WHERE (P_EQUIPE IS NULL OR INE = P_EQUIPE) --0002039192
        ORDER BY RAZAO DESC ;
        END;
        $$ LANGUAGE PLPGSQL;`
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
    // INDICADORES DE QUALIDADE NOVO FINANCIAMENTO
  

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
                AND (tfaop.co_dim_cbo_1 in (125, 439, 440, 460, 461, 661, 960, 1165, 8908))
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
            and tfao.co_dim_cbo_1 in (125, 439, 461, 661, 960, 8908)
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
        name: 'Dimensao Vinculo',
        definition: `CREATE OR REPLACE FUNCTION DIM_VINCULO(
            QUADRIMESTRE DATE,
            EQUIPE TEXT DEFAULT NULL
        )
        RETURNS TABLE(
            EQUIPES TEXT,
            TOTAL_VINCULADO INTEGER,    
            FCI_ATUALIZADA INTEGER,
            PERC_FCI_ATUALIZADA FLOAT,
            FCI_FCDT_ATUALIZADA INTEGER,
            CIDADAO_SEM_FCI INTEGER,
            CIDADOA_FCI_DESATUALIZADA INTEGER,
            CIDADAO_SEM_FCDT INTEGER,
            CIDADAO_SEM_CPF_CNS INTEGER,
            RESULTADO FLOAT,
            SCORE TEXT,
            CLASSIFICACAO TEXT
        ) AS $$
        BEGIN
            RETURN QUERY
            WITH CTE_EQUIPES AS (
                SELECT 
                    NU_INE AS INE,
                    NO_EQUIPE AS NOME_EQUIPE
                FROM TB_EQUIPE
                LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                WHERE ST_ATIVO = 1 AND NU_MS = '70' 
                ORDER BY NO_EQUIPE
            ),
            CTE_TOTAL_VINCULADOS AS ( --TOTAL CIDADAO VINCULCADO
                SELECT 
                    TOTAL_VINCULADOS.NU_INE_VINC_EQUIPE, 
                    COUNT(*) AS TOTAL_CIDADAO		        		
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TOTAL_VINCULADOS 
                WHERE (TOTAL_VINCULADOS.NU_CPF_CIDADAO IS NOT NULL OR TOTAL_VINCULADOS.NU_CNS_CIDADAO IS NOT NULL) 
                GROUP BY
                    TOTAL_VINCULADOS.NU_INE_VINC_EQUIPE
            ),
            CTE_FCI_ATUALIZADAS AS (--TOTAL DE FCI ATUALIZADAS
                SELECT 
                    TOTALFCI.NU_INE_VINC_EQUIPE,
                    COUNT(TOTALFCI.ST_POSSUI_FCI) AS TOTAL_FCI_ATUALIZADA		        		
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TOTALFCI 
                WHERE
                    TOTALFCI.DT_ULTIMA_ATUALIZACAO_CIDADAO <= QUADRIMESTRE 
                    AND TOTALFCI.ST_POSSUI_FCI = 1 AND TOTALFCI.ST_POSSUI_FCDT = 0 --OR TOTALFCI.ST_POSSUI_FCDT = 1)
                AND TOTALFCI.DT_ULTIMA_ATUALIZACAO_CIDADAO >= QUADRIMESTRE - INTERVAL '24 MONTHS'
                GROUP BY         	
                    TOTALFCI.NU_INE_VINC_EQUIPE        	
            ),
            CTE_CIDADAO_SEM_FCI AS (--CIDADAO SEM FCI
                SELECT 
                    TOTALSEMFCI.NU_INE_VINC_EQUIPE,
                    COUNT(TOTALSEMFCI.ST_POSSUI_FCI) AS TOTAL_SEM_FCI
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TOTALSEMFCI 
                WHERE 
                    TOTALSEMFCI.ST_POSSUI_FCI = 0 --AND TOTALSEMFCI.ST_USAR_CADASTRO_INDIVIDUAL = 0
                --OR TOTALSEMFCI.DT_ULTIMA_ATUALIZACAO_CIDADAO <= QUADRIMESTRE - INTERVAL '24 MONTHS'
                GROUP BY         	
                    TOTALSEMFCI.NU_INE_VINC_EQUIPE        	
            ),
            CTE_CIDADAO_FCI_DESATUALIZADA AS (--CIDADAO COM FCI DESATUALIZADA
                SELECT 
                    TOTALFCIDES.NU_INE_VINC_EQUIPE,
                    COUNT(TOTALFCIDES.ST_POSSUI_FCI) AS TOTAL_FCI_DESATUALIZADA
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TOTALFCIDES 
                WHERE 
                    DT_ULTIMA_ATUALIZACAO_CIDADAO <= QUADRIMESTRE
                    AND TOTALFCIDES.ST_POSSUI_FCI = 1 --AND TOTALSEMFCI.ST_USAR_CADASTRO_INDIVIDUAL = 0
                AND TOTALFCIDES.DT_ULTIMA_ATUALIZACAO_CIDADAO < QUADRIMESTRE - INTERVAL '24 MONTHS'
                GROUP BY         	
                    TOTALFCIDES.NU_INE_VINC_EQUIPE        	
            ),
            CTE_FCI_FCDT_ATUALIZADO AS (
                SELECT 
                    TOTAL_FCI_FCDT.NU_INE_VINC_EQUIPE,
                    COUNT(TOTAL_FCI_FCDT.ST_POSSUI_FCDT) AS TOTAL_FCI_FCDT 
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TOTAL_FCI_FCDT
                WHERE 
                    TOTAL_FCI_FCDT.ST_POSSUI_FCDT = 1 AND TOTAL_FCI_FCDT.ST_POSSUI_FCI = 1
                AND (TOTAL_FCI_FCDT.DT_ULTIMA_ATUALIZACAO_CIDADAO >= QUADRIMESTRE - INTERVAL '24 MONTHS'
                AND TOTAL_FCI_FCDT.DT_ATUALIZACAO_FCD >= QUADRIMESTRE - INTERVAL '24 MONTHS')
                GROUP BY
                    TOTAL_FCI_FCDT.NU_INE_VINC_EQUIPE
            ),
            CTE_CIDADAO_SEM_CPF_CNS AS (
                SELECT 
                    TOTAL_CPF_CNS.NU_INE_VINC_EQUIPE,	
                    COUNT(TOTAL_CPF_CNS.CO_SEQ_ACOMP_CIDADAOS_VINC) AS TOTAL_SEM_CPF_CNS
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TOTAL_CPF_CNS
                WHERE 
                    (TOTAL_CPF_CNS.NU_CPF_CIDADAO ISNULL 
                AND TOTAL_CPF_CNS.NU_CNS_CIDADAO ISNULL)
                GROUP BY
                    TOTAL_CPF_CNS.NU_INE_VINC_EQUIPE
            ),
            CTE_FCDT_DESATUALIZADA AS (
                SELECT 
                    TOTALSEMFCDT.NU_INE_VINC_EQUIPE,
                    COUNT(TOTALSEMFCDT.ST_POSSUI_FCDT) AS FCDT_DESATUALIZADA		        		
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TOTALSEMFCDT 
                WHERE 
                    -- Atualizado até o quadrimestre (ou seja, não no futuro)
                    TOTALSEMFCDT.DT_ULTIMA_ATUALIZACAO_CIDADAO <= QUADRIMESTRE		
                    -- Possui FCI
                    AND TOTALSEMFCDT.ST_POSSUI_FCI = 1 		
                    -- E uma destas condições:
                    AND (
                        -- Não possui FCDT
                        TOTALSEMFCDT.ST_POSSUI_FCDT = 0		        
                        -- OU		
                        -- 2 Última atualização da FCI tem mais de 2 anos (ou seja, está desatualizada)
                        OR TOTALSEMFCDT.DT_ULTIMA_ATUALIZACAO_CIDADAO < QUADRIMESTRE - INTERVAL '24 MONTHS'
                    )    
                GROUP BY         	
                    TOTALSEMFCDT.NU_INE_VINC_EQUIPE 
            )
            SELECT 
                CTE_EQUIPES.NOME_EQUIPE::TEXT AS EQUIPES,	
                COALESCE(TVC.TOTAL_CIDADAO, 0)::INTEGER AS TOTAL_CIDADAO,
                COALESCE(TFCIA.TOTAL_FCI_ATUALIZADA, 0)::INTEGER AS SOMENTE_FCI_ATUALIZADA,
                ROUND((COALESCE(TFCIA.TOTAL_FCI_ATUALIZADA + TFCDT.TOTAL_FCI_FCDT , 0) * 100)::NUMERIC / 
                COALESCE(TVC.TOTAL_CIDADAO, 0)::NUMERIC, 2)::FLOAT	AS PERC_FCI_ATUALIZADAS,
                COALESCE(TFCDT.TOTAL_FCI_FCDT, 0)::INTEGER AS FCI_FCDT_ATUALIZADAS,
                COALESCE(SEMFCI.TOTAL_SEM_FCI, 0)::INTEGER AS CIDADAO_SEM_FCI,
                COALESCE(FCIDESAT.TOTAL_FCI_DESATUALIZADA, 0)::INTEGER AS FCI_DESATUALIZADA,
                COALESCE(SEMFCDT.FCDT_DESATUALIZADA, 0)::INTEGER AS FCDT_DESATUALIZADA,
                COALESCE(CSCC.TOTAL_SEM_CPF_CNS, 0)::INTEGER AS CIDADAO_SEM_CPF_CNS,
                ROUND(((COALESCE(TFCIA.TOTAL_FCI_ATUALIZADA, 0) * 0.75 +  
                COALESCE(TFCDT.TOTAL_FCI_FCDT, 0) * 1.50) / 2500) * 100, 2)::FLOAT AS RESULTADO,
                TO_CHAR(CASE 
                    WHEN (((COALESCE(TFCIA.TOTAL_FCI_ATUALIZADA, 0) * 0.75 +  
                    COALESCE(TFCDT.TOTAL_FCI_FCDT, 0) * 1.50) / 2500) * 100) >= 85 THEN 3.00
                    WHEN (((COALESCE(TFCIA.TOTAL_FCI_ATUALIZADA, 0) * 0.75 +  
                    COALESCE(TFCDT.TOTAL_FCI_FCDT, 0) * 1.50) / 2500) * 100) BETWEEN 65 AND 84.9 THEN 2.25
                    WHEN (((COALESCE(TFCIA.TOTAL_FCI_ATUALIZADA, 0) * 0.75 +  
                    COALESCE(TFCDT.TOTAL_FCI_FCDT, 0) * 1.50) / 2500) * 100) BETWEEN 45 AND 64.9 THEN 1.50
                    ELSE 0.75
                END, 'FM999999990.00') AS SCORE,
                CASE 
                    WHEN (((COALESCE(TFCIA.TOTAL_FCI_ATUALIZADA, 0) * 0.75 +  
                    COALESCE(TFCDT.TOTAL_FCI_FCDT, 0) * 1.50) / 2500) * 100) >= 85 THEN 'ÓTIMO'
                    WHEN (((COALESCE(TFCIA.TOTAL_FCI_ATUALIZADA, 0) * 0.75 +  
                    COALESCE(TFCDT.TOTAL_FCI_FCDT, 0) * 1.50) / 2500) * 100) BETWEEN 65 AND 84.9 THEN 'BOM'
                    WHEN (((COALESCE(TFCIA.TOTAL_FCI_ATUALIZADA, 0) * 0.75 +  
                    COALESCE(TFCDT.TOTAL_FCI_FCDT, 0) * 1.50) / 2500) * 100) BETWEEN 45 AND 64.9 THEN 'SUFICIENTE'
                    ELSE 'REGULAR'
                END	AS CLASSIFICACAO
            FROM CTE_EQUIPES
            LEFT JOIN CTE_TOTAL_VINCULADOS TVC ON TVC.NU_INE_VINC_EQUIPE = CTE_EQUIPES.INE
            LEFT JOIN CTE_FCI_ATUALIZADAS TFCIA ON TFCIA.NU_INE_VINC_EQUIPE = CTE_EQUIPES.INE
            LEFT JOIN CTE_FCI_FCDT_ATUALIZADO TFCDT ON TFCDT.NU_INE_VINC_EQUIPE = CTE_EQUIPES.INE
            LEFT JOIN CTE_CIDADAO_SEM_CPF_CNS CSCC ON CSCC.NU_INE_VINC_EQUIPE = CTE_EQUIPES.INE
            LEFT JOIN CTE_CIDADAO_SEM_FCI SEMFCI ON SEMFCI.NU_INE_VINC_EQUIPE = CTE_EQUIPES.INE
            LEFT JOIN CTE_FCDT_DESATUALIZADA SEMFCDT ON SEMFCDT.NU_INE_VINC_EQUIPE = CTE_EQUIPES.INE
            LEFT JOIN CTE_CIDADAO_FCI_DESATUALIZADA FCIDESAT ON FCIDESAT.NU_INE_VINC_EQUIPE = CTE_EQUIPES.INE
            WHERE 
            (EQUIPE IS NULL OR CTE_EQUIPES.INE = EQUIPE)	
            ORDER BY
                RESULTADO DESC;    
        END;
        $$ LANGUAGE PLPGSQL;`
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
                fact.nuCns as cns_cidadao,
                fact.cpf as cpf_cidadao,
                fact.idade as idade
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
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 575, 945) --or  tb_fat_cad_individual.co_dim_cbo = 945 or tb_fat_cad_individual.co_dim_cbo = 395
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
                    group by
                        fact.nuCns,
                        fact.cpf,
                        fact.idade
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
            fact.nuCns as cns_cidadao,
            fact.cpf as cpf_cidadao,
            fact.idade as idade	      
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
                    tb_fat_cad_individual.co_dim_cbo in (395, 468, 575, 945) --or  tb_fat_cad_individual.co_dim_cbo = 945 or tb_fat_cad_individual.co_dim_cbo = 395
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
                group by
                    fact.nuCns,
                    fact.cpf,
                    fact.idade
            ) as vinculados;
        end;
        $$`
    },

  
    /*------------------INDICADORES GERAIS APS ------------*/
    {
        name: 'Atendimento Diario ESF',
        definition: `CREATE OR REPLACE FUNCTION ATENDIMENTO_DIARIO_APS(
                P_PROFISSIONAL VARCHAR DEFAULT NULL,
                P_MES INTEGER DEFAULT NULL,
                P_ANO INTEGER DEFAULT NULL)
            RETURNS TABLE(
                EQUIPE VARCHAR, 
                PROFISSIONAL VARCHAR, 
                _1 BIGINT, _2 BIGINT, _3 BIGINT, _4 BIGINT, _5 BIGINT, _6 BIGINT, _7 BIGINT, _8 BIGINT, _9 BIGINT,
                _10 BIGINT, _11 BIGINT, _12 BIGINT, _13 BIGINT, _14 BIGINT, _15 BIGINT, _16 BIGINT, _17 BIGINT, _18 BIGINT, 
                _19 BIGINT, _20 BIGINT, _21 BIGINT, _22 BIGINT, _23 BIGINT, _24 BIGINT, _25 BIGINT, _26 BIGINT, _27 BIGINT, _28 BIGINT,
                _29 BIGINT, _30 BIGINT, _31 BIGINT, TOTAL BIGINT)
            LANGUAGE PLPGSQL
            AS $$
            DECLARE
                V_MES INTEGER;
                V_ANO INTEGER;
                V_DIAS_NO_MES INTEGER;
            BEGIN
                -- SE OS PARÂMETROS DE MÊS E ANO FOREM NULOS, CALCULAMOS O MÊS E ANO DO MÊS PASSADO
                IF P_MES IS NULL OR P_ANO IS NULL THEN
                    SELECT EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE)
                    INTO V_MES, V_ANO;
                ELSE
                    V_MES := P_MES;
                    V_ANO := P_ANO;
                END IF;

                -- CALCULA A QUANTIDADE DE DIAS NO MÊS ESCOLHIDO
                SELECT EXTRACT(DAY FROM (DATE_TRUNC('MONTH', TO_DATE(V_ANO || '-' || V_MES || '-01', 'YYYY-MM-DD') + INTERVAL '1 MONTH') - INTERVAL '1 DAY'))
                INTO V_DIAS_NO_MES;
                RETURN QUERY
                SELECT DIAS.EQUIPE, DIAS.NO_PROFISSIONAL,
                    COUNT(*) FILTER (WHERE DIA = 1) AS "_1",
                    COUNT(*) FILTER (WHERE DIA = 2) AS "_2",
                    COUNT(*) FILTER (WHERE DIA = 3) AS "_3",
                    COUNT(*) FILTER (WHERE DIA = 4) AS "_4",
                    COUNT(*) FILTER (WHERE DIA = 5) AS "_5",
                    COUNT(*) FILTER (WHERE DIA = 6) AS "_6",
                    COUNT(*) FILTER (WHERE DIA = 7) AS "_7",
                    COUNT(*) FILTER (WHERE DIA = 8) AS "_8",
                    COUNT(*) FILTER (WHERE DIA = 9) AS "_9",
                    COUNT(*) FILTER (WHERE DIA = 10) AS "_10",
                    COUNT(*) FILTER (WHERE DIA = 11) AS "_11",
                    COUNT(*) FILTER (WHERE DIA = 12) AS "_12",
                    COUNT(*) FILTER (WHERE DIA = 13) AS "_13",
                    COUNT(*) FILTER (WHERE DIA = 14) AS "_14",
                    COUNT(*) FILTER (WHERE DIA = 15) AS "_15",
                    COUNT(*) FILTER (WHERE DIA = 16) AS "_16",
                    COUNT(*) FILTER (WHERE DIA = 17) AS "_17",
                    COUNT(*) FILTER (WHERE DIA = 18) AS "_18",
                    COUNT(*) FILTER (WHERE DIA = 19) AS "_19",
                    COUNT(*) FILTER (WHERE DIA = 20) AS "_20",
                    COUNT(*) FILTER (WHERE DIA = 21) AS "_21",
                    COUNT(*) FILTER (WHERE DIA = 22) AS "_22",
                    COUNT(*) FILTER (WHERE DIA = 23) AS "_23",
                    COUNT(*) FILTER (WHERE DIA = 24) AS "_24",
                    COUNT(*) FILTER (WHERE DIA = 25) AS "_25",
                    COUNT(*) FILTER (WHERE DIA = 26) AS "_26",
                    COUNT(*) FILTER (WHERE DIA = 27) AS "_27",
                    COUNT(*) FILTER (WHERE DIA = 28) AS "_28",
                    CASE WHEN V_DIAS_NO_MES >= 29 THEN COUNT(*) FILTER (WHERE DIA = 29) ELSE NULL END AS "_29",
                    CASE WHEN V_DIAS_NO_MES >= 30 THEN COUNT(*) FILTER (WHERE DIA = 30) ELSE NULL END AS "_30",
                    CASE WHEN V_DIAS_NO_MES = 31 THEN COUNT(*) FILTER (WHERE DIA = 31) ELSE NULL END AS "_31",
                    COUNT(*) AS TOTAL
                FROM (
                    SELECT TDE.NO_EQUIPE AS EQUIPE, TDP.NO_PROFISSIONAL, 
                        EXTRACT(DAY FROM TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) AS DIA
                    FROM TB_FAT_ATENDIMENTO_INDIVIDUAL TFAI 
                    INNER JOIN TB_DIM_PROFISSIONAL TDP ON TDP.CO_SEQ_DIM_PROFISSIONAL = TFAI.CO_DIM_PROFISSIONAL_1
                    INNER JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFAI.CO_DIM_EQUIPE_1
                    WHERE
                        CASE				
                            WHEN P_PROFISSIONAL IN (SELECT CO_SEQ_DIM_CBO::VARCHAR FROM TB_DIM_CBO 
                                                WHERE NU_CBO IN ('223565')) 
                                                THEN TFAI.CO_DIM_CBO_1 IN (SELECT CO_SEQ_DIM_CBO::INTEGER FROM TB_DIM_CBO 
                                                WHERE NU_CBO IN ('223565'))
                            WHEN P_PROFISSIONAL IN (SELECT CO_SEQ_DIM_CBO::VARCHAR FROM TB_DIM_CBO 
                                                WHERE NU_CBO IN ('225142')) 
                                                THEN TFAI.CO_DIM_CBO_1 IN (SELECT CO_SEQ_DIM_CBO::INTEGER FROM TB_DIM_CBO 
                                                WHERE NU_CBO IN ('225142'))
                            --WHEN P_PROFISSIONAL NOT IN ('55','57', '392', '465', '944', '8891') THEN TFAI.CO_DIM_CBO_1 IN (55, 57, 392, 465, 944, 8891)
                            ELSE P_PROFISSIONAL IS NULL
                        END
                    AND TDE.NU_INE IN (SELECT 
                        TB_EQUIPE.NU_INE AS INE			
                        FROM TB_EQUIPE
                        LEFT JOIN TB_TIPO_EQUIPE  ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                        LEFT JOIN TB_DIM_EQUIPE TDE1 ON TDE1.NU_INE = TB_EQUIPE.NU_INE 
                        WHERE ST_ATIVO = 1 AND NU_MS = '70' 
                    ORDER BY TB_EQUIPE.NO_EQUIPE)	
                    AND TDP.ST_REGISTRO_VALIDO = 1 
                    AND TFAI.CO_DIM_TEMPO >= '20240101'
                    AND (P_MES IS NULL OR EXTRACT(MONTH FROM TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) = V_MES)
                    AND (P_ANO IS NULL OR EXTRACT(YEAR FROM TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) = V_ANO)
                ) AS DIAS
                GROUP BY DIAS.EQUIPE, DIAS.NO_PROFISSIONAL;
            END;
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
        definition: `CREATE OR REPLACE FUNCTION CADASTRO_DOMICILIAR(
            P_EQUIPE VARCHAR DEFAULT null,
            P_PROFISSIONAL VARCHAR DEFAULT NULL
        )
        RETURNS TABLE(
            GEORREFERENCIADO BIGINT,
            NAO_GEORREFERENCIADO INTEGER,
            TOTAL INTEGER,
            PERCETUAL_GEORREFERENCIADO NUMERIC,
            PERCETUAL_NAO_GEORREFERENCIADO NUMERIC
        )
        LANGUAGE PLPGSQL
        AS $$
        BEGIN
            RETURN QUERY
            WITH DOMICILIOS_LOCALIZADOS AS (
                SELECT 
                    COUNT(*) AS TOTAL_LOCALIZADOS
                FROM TB_FAT_CAD_DOMICILIAR TFCD
                JOIN TB_CDS_DOMICILIO TCD ON TCD.CO_UNICO_DOMICILIO = TFCD.NU_UUID_FICHA_ORIGEM
                JOIN TB_DIM_PROFISSIONAL TDP 
                    ON TDP.CO_SEQ_DIM_PROFISSIONAL = TFCD.CO_DIM_PROFISSIONAL AND TDP.ST_REGISTRO_VALIDO = 1
                JOIN TB_DIM_EQUIPE TDE 
                    ON TDE.CO_SEQ_DIM_EQUIPE = TFCD.CO_DIM_EQUIPE
                WHERE TCD.NU_LONGITUDE IS NOT NULL -- DOMICÍLIOS LOCALIZADOS TÊM LONGITUDE (AJUSTADO PARA A TABELA CORRETA)
                AND TFCD.CO_DIM_TIPO_IMOVEL = 1  
                AND TFCD.CO_DIM_TEMPO <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                AND (P_EQUIPE IS NULL OR TDE.NU_INE = P_EQUIPE)
                AND (P_PROFISSIONAL IS NULL OR TDP.CO_SEQ_DIM_PROFISSIONAL = P_PROFISSIONAL::BIGINT)
            ),
            DOMICILIOS_NAO_LOCALIZADOS AS (
                SELECT 
                    COUNT(*) AS TOTAL_NAO_LOCALIZADOS
                FROM TB_FAT_CAD_DOMICILIAR TFCD
                JOIN TB_CDS_DOMICILIO TCD ON TCD.CO_UNICO_DOMICILIO = TFCD.NU_UUID_FICHA_ORIGEM
                JOIN TB_DIM_PROFISSIONAL TDP 
                    ON TDP.CO_SEQ_DIM_PROFISSIONAL = TFCD.CO_DIM_PROFISSIONAL AND TDP.ST_REGISTRO_VALIDO = 1
                JOIN TB_DIM_EQUIPE TDE 
                    ON TDE.CO_SEQ_DIM_EQUIPE = TFCD.CO_DIM_EQUIPE
                WHERE TCD.NU_LONGITUDE IS NULL -- DOMICÍLIOS NÃO LOCALIZADOS NÃO TÊM LONGITUDE (AJUSTADO PARA A TABELA CORRETA)    
                AND TFCD.CO_DIM_TIPO_IMOVEL = 1   
                AND TFCD.CO_DIM_TEMPO <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER
                AND (P_EQUIPE IS NULL OR TDE.NU_INE = P_EQUIPE)
                AND (P_PROFISSIONAL IS NULL OR TDP.CO_SEQ_DIM_PROFISSIONAL = P_PROFISSIONAL::BIGINT)
            )
            SELECT 
                DL.TOTAL_LOCALIZADOS AS GEORREFERENCIADOS,
                DNL.TOTAL_NAO_LOCALIZADOS::INTEGER AS NAO_GEORREFERENCIADOS,
                (DL.TOTAL_LOCALIZADOS + DNL.TOTAL_NAO_LOCALIZADOS)::INTEGER AS TOTAL_DOMICILIOS,
                -- CALCULAR PERCENTUAL DE GEORREFERENCIADOS COM TRATAMENTO PARA DIVISÃO POR ZERO
                CASE 
                    WHEN (DL.TOTAL_LOCALIZADOS + DNL.TOTAL_NAO_LOCALIZADOS) = 0 THEN 0
                    ELSE ROUND((CAST(DL.TOTAL_LOCALIZADOS AS DECIMAL) / (DL.TOTAL_LOCALIZADOS + DNL.TOTAL_NAO_LOCALIZADOS)) * 100, 2)
                END AS PERCENTUAL_GEORREFERENCIADOS,
                -- CALCULAR PERCENTUAL DE NÃO GEORREFERENCIADOS COM TRATAMENTO PARA DIVISÃO POR ZERO
                CASE 
                    WHEN (DL.TOTAL_LOCALIZADOS + DNL.TOTAL_NAO_LOCALIZADOS) = 0 THEN 0
                    ELSE ROUND((CAST(DNL.TOTAL_NAO_LOCALIZADOS AS DECIMAL) / (DL.TOTAL_LOCALIZADOS + DNL.TOTAL_NAO_LOCALIZADOS)) * 100, 2)
                END AS PERCENTUAL_NAO_GEORREFERENCIADOS
            FROM DOMICILIOS_LOCALIZADOS DL
            CROSS JOIN DOMICILIOS_NAO_LOCALIZADOS DNL;
        END;
        $$;`
    },

    {
        name: 'Geolocalizacao Domiciliar',
        definition: `CREATE OR REPLACE FUNCTION GEOLOCALIZACAO_DOMICILIAR(
                P_EQUIPE VARCHAR DEFAULT NULL,
                P_PROFISSIONAL VARCHAR DEFAULT NULL)
        RETURNS TABLE(INE VARCHAR, COD_PROFISSIONAL INTEGER,LOGRADOURO VARCHAR, NUM_DOMICILIO VARCHAR, 
                    BAIRRO VARCHAR, LATITUDE FLOAT8, LONGITUDE FLOAT8, ULTIMA_ATUALIZACAO VARCHAR, CADASTRO_COMPLETO TEXT)
        LANGUAGE PLPGSQL
        AS $$
        BEGIN
            RETURN QUERY
            SELECT	
                    TDE.NU_INE, 
                    TDP.CO_SEQ_DIM_PROFISSIONAL::INTEGER, 
                    TCD.NO_LOGRADOURO, 
                    TCD.NU_DOMICILIO, 
                    TCD.NO_BAIRRO, 
                    TFCD.NU_LATITUDE, 
                    TFCD.NU_LONGITUDE,
                    TO_CHAR(TO_DATE(TFCD.CO_DIM_TEMPO::TEXT, 'YYYYMMDD'),'DD/MM/YYYY')::VARCHAR AS DT_ATUALIZACAO,
                    CASE
                        WHEN TCD.ST_CADASTRO_COMPLETO = 1 THEN 'SIM'
                    ELSE 'NÃO'
                    END AS CADASTO_COMPLETO
                FROM TB_FAT_CAD_DOMICILIAR TFCD 
                JOIN TB_CDS_DOMICILIO TCD ON
                TCD.CO_UNICO_DOMICILIO = TFCD.NU_UUID_FICHA_ORIGEM 
                JOIN TB_DIM_PROFISSIONAL TDP ON
                TDP.CO_SEQ_DIM_PROFISSIONAL = TFCD.CO_DIM_PROFISSIONAL
                INNER JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFCD.CO_DIM_EQUIPE
                WHERE 
                    TFCD.NU_LATITUDE IS NOT NULL
                    AND TDP.ST_REGISTRO_VALIDO = 1
                    AND	(TFCD.CO_DIM_TEMPO_VALIDADE > TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER	
                    AND TFCD.CO_DIM_TEMPO <= TO_CHAR(CURRENT_DATE, 'YYYYMMDD')::INTEGER) 
                    AND (P_EQUIPE IS NULL OR TDE.NU_INE = P_EQUIPE)
                    AND (P_PROFISSIONAL IS NULL OR TFCD.CO_DIM_PROFISSIONAL = P_PROFISSIONAL::BIGINT);		
        END;
        $$`
    },

    {
        name: 'Calcular IAF',
        definition: `CREATE OR REPLACE FUNCTION calcular_iaf(
            param_cnes text [] DEFAULT NULL,
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
                (param_cnes IS NULL OR tdus.nu_cnes = any(param_cnes)) AND
                (param_mes IS NULL OR EXTRACT(MONTH FROM to_date(tfac.co_dim_tempo::text, 'YYYYMMDD')) = param_mes) AND
                (param_ano IS NULL OR EXTRACT(YEAR FROM to_date(tfac.co_dim_tempo::text, 'YYYYMMDD')) = param_ano) AND
                --AGE(CURRENT_DATE, TO_DATE(tfac.co_dim_tempo::TEXT, 'YYYYMMDD')) <= INTERVAL '1 year' AND
                --tfac.co_dim_tipo_atividade = 6 AND
                tfac.ds_filtro_pratica_em_saude in ('|11|', '|30|11|', '|30|')        
            GROUP BY
                tdus.no_unidade_saude,
                tdus.nu_cnes,			
                modalidade
            ORDER BY
                total_fichas desc;        
        END;
        $$ LANGUAGE plpgsql;`
    },

    {
        name:'Calcula PSE Novo',
        definition: `CREATE OR REPLACE FUNCTION PSE_NOVO (
	P_INEP VARCHAR DEFAULT NULL,
	P_EQUIPE VARCHAR DEFAULT NULL,
	P_ANO VARCHAR DEFAULT NULL)
RETURNS TABLE ( INEP VARCHAR, NOME_ESCOLA VARCHAR, ANO VARCHAR, TOTAL_GERAL BIGINT, QTD_TEMA_SAUDE BIGINT,
	QTD_PRATICA_SAUDE BIGINT, QTD_ACOES_PRIORITARIAS BIGINT, ALIMENT_SAUDAVEL BIGINT, CIDAN_DIREITOS BIGINT,
	DROGAS_TABACO BIGINT, VIOLEN_PAZ BIGINT, SAUDE_AMBIENT BIGINT, SAUDE_BUC BIGINT, SAUD_MENTAL BIGINT, SAUD_SEXUAL BIGINT,
	AGRAVOS_NEGLIG BIGINT, COMBAT_AEDES BIGINT, APP_FLUOR BIGINT, SAUD_OCULAR BIGINT, ESCOVACAO_SUPER BIGINT, ATVID_FISICA BIGINT,
	ANTROPOMET BIGINT, SAUD_AUDITIVA BIGINT, VACINA BIGINT, PREV_COVID BIGINT)
LANGUAGE PLPGSQL
AS $$
BEGIN
	RETURN QUERY
	WITH ATIVIDADES_FILTRADAS AS (
	    SELECT 
	        TFAC.CO_DIM_EQUIPE,
	        TDE.NU_INE,
	        TDE.NO_EQUIPE,
	        TDI.NU_IDENTIFICADOR,
	        TDI.NO_ESTABELECIMENTO, 
	        TFAC.CO_DIM_INEP,
	        TFAC.CO_DIM_TEMPO,
	        LEFT(TFAC.CO_DIM_TEMPO::TEXT, 4)::VARCHAR AS ANO,
	        DS_FILTRO_TEMA_PARA_SAUDE,
	        DS_FILTRO_PRATICA_EM_SAUDE,
	        CASE 
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|1|%' THEN 'ALIMENTACAO SAUDAVEL'
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|5|%' THEN 'CIDADANIA E DIREITOS HUMANOS'
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|7|%' THEN 'DEPENDENCIA QUIMICA/TABACO/ALCOOL/OUTRAS DROGAS'
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|13|%' THEN 'PREVENCAO DA VIOLENCIA E CULTURA DA PAZ'
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|14|%' THEN 'SAUDE AMBIENTAL'
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|15|%' THEN 'SAUDE BUCAL'
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|16|%' THEN 'SAUDE MENTAL'
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|17|%' THEN 'SAUDE SEXUAL E REPRODUTIVA'
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|19|%' THEN 'AGRAVOS NEGLIGENCIADOS'
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|29|%' THEN 'ACOES DE COMBATE AO AEDES AEGYPTI'
	            WHEN DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|2|%' THEN 'APLICACAO TOPICA DE FLUOR'
	            WHEN DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|3|%' THEN 'SAUDE OCULAR'
	            WHEN DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|9|%' THEN 'ESCOVACAO DENTAL SUPERVISIONADA'
	            WHEN DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|11|%' THEN 'PRATICAS CORPORAIS E ATIVIDADE FISICA'
	            WHEN DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|20|%' THEN 'ANTROPOMETRIA'
	            WHEN DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|22|%' THEN 'SAUDE AUDITIVA'
	            WHEN DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|24|%' THEN 'VERIFICACAO DE SITUACAO VACINAL'
	            WHEN DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|30|%' THEN 'PREVENCAO DE COVID NAS ESCOLAS'
	        END AS ATIVIDADE,
	        CASE 
	            WHEN DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|%' THEN 'TEMA'
	            WHEN DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|%' THEN 'PRATICA'
	        END AS ORIGEM
	    FROM TB_FAT_ATIVIDADE_COLETIVA TFAC 
	    LEFT JOIN TB_DIM_EQUIPE TDE ON TFAC.CO_DIM_EQUIPE = TDE.CO_SEQ_DIM_EQUIPE 
	    LEFT JOIN TB_DIM_INEP TDI ON TFAC.CO_DIM_INEP = TDI.CO_SEQ_DIM_INEP 
	    WHERE (
	        DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|1|%' OR
	        DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|5|%' OR
	        DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|7|%' OR
	        DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|13|%' OR
	        DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|14|%' OR
	        DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|15|%' OR
	        DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|16|%' OR
	        DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|17|%' OR
	        DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|19|%' OR
	        DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|29|%' OR
	        DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|2|%' OR 
	        DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|3|%' OR 
	        DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|9|%' OR 
	        DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|11|%' OR 
	        DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|20|%' OR 
	        DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|22|%' OR 
	        DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|24|%' OR 
	        DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|30|%'
	    )
	    AND TFAC.CO_DIM_INEP <> 1
	    AND TFAC.CO_DIM_TEMPO >= '20230101'
	    -- >>>> AQUI ESTÃO OS FILTROS PARAMETRIZÁVEIS <<<<
	    AND (P_INEP IS NULL OR TDI.NU_IDENTIFICADOR = P_INEP)
	    AND (P_EQUIPE IS NULL OR TDE.NU_INE = P_EQUIPE)
	    AND (P_ANO IS NULL OR LEFT(TFAC.CO_DIM_TEMPO::TEXT, 4) = P_ANO)
	),
	RESUMO_PIVOTADO AS (
	    SELECT 
	        A.NU_IDENTIFICADOR,
	        A.NO_ESTABELECIMENTO,
	        --A.NU_INE,
	        --A.NO_EQUIPE,
	        A.ANO::VARCHAR,
	        COUNT(*) AS TOTAL_GERAL,
	        SUM(CASE WHEN A.ORIGEM = 'TEMA' THEN 1 ELSE 0 END) AS QTDE_TEMA_SAUDE,
	        SUM(CASE WHEN A.ORIGEM = 'PRATICA' THEN 1 ELSE 0 END) AS QTDE_PRATICA_SAUDE,
	        SUM(CASE 
	            WHEN A.DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|1|%' OR
	                 A.DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|5|%' OR
	                 A.DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|13|%' OR
	                 A.DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|16|%' OR
	                 A.DS_FILTRO_TEMA_PARA_SAUDE LIKE '%|17|%' OR
	                 A.DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|11|%' OR
	                 A.DS_FILTRO_PRATICA_EM_SAUDE LIKE '%|20|%' 
	            THEN 1 ELSE 0 END) AS ACOES_PRIORITARIAS,
	        -- AQUI ENTRAM AS COLUNAS PIVOTADAS COMO ANTES
	        SUM(CASE WHEN A.ATIVIDADE = 'ALIMENTACAO SAUDAVEL' THEN 1 ELSE 0 END) AS ALIMENTACAO_SAUDAVEL,
	        SUM(CASE WHEN A.ATIVIDADE = 'CIDADANIA E DIREITOS HUMANOS' THEN 1 ELSE 0 END) AS CIDADANIA_DIREITOS,
	        SUM(CASE WHEN A.ATIVIDADE = 'DEPENDENCIA QUIMICA/TABACO/ALCOOL/OUTRAS DROGAS' THEN 1 ELSE 0 END) AS DROGAS,
	        SUM(CASE WHEN A.ATIVIDADE = 'PREVENCAO DA VIOLENCIA E CULTURA DA PAZ' THEN 1 ELSE 0 END) AS VIOLENCIA_PAZ,
	        SUM(CASE WHEN A.ATIVIDADE = 'SAUDE AMBIENTAL' THEN 1 ELSE 0 END) AS SAUDE_AMBIENTAL,
	        SUM(CASE WHEN A.ATIVIDADE = 'SAUDE BUCAL' THEN 1 ELSE 0 END) AS SAUDE_BUCAL,
	        SUM(CASE WHEN A.ATIVIDADE = 'SAUDE MENTAL' THEN 1 ELSE 0 END) AS SAUDE_MENTAL,
	        SUM(CASE WHEN A.ATIVIDADE = 'SAUDE SEXUAL E REPRODUTIVA' THEN 1 ELSE 0 END) AS SAUDE_SEXUAL,
	        SUM(CASE WHEN A.ATIVIDADE = 'AGRAVOS NEGLIGENCIADOS' THEN 1 ELSE 0 END) AS AGRAVOS,
	        SUM(CASE WHEN A.ATIVIDADE = 'ACOES DE COMBATE AO AEDES AEGYPTI' THEN 1 ELSE 0 END) AS COMBATE_AEDES,
	        SUM(CASE WHEN A.ATIVIDADE = 'APLICACAO TOPICA DE FLUOR' THEN 1 ELSE 0 END) AS FLUOR,
	        SUM(CASE WHEN A.ATIVIDADE = 'SAUDE OCULAR' THEN 1 ELSE 0 END) AS SAUDE_OCULAR,
	        SUM(CASE WHEN A.ATIVIDADE = 'ESCOVACAO DENTAL SUPERVISIONADA' THEN 1 ELSE 0 END) AS ESCOVACAO,
	        SUM(CASE WHEN A.ATIVIDADE = 'PRATICAS CORPORAIS E ATIVIDADE FISICA' THEN 1 ELSE 0 END) AS ATIVIDADE_FISICA,
	        SUM(CASE WHEN A.ATIVIDADE = 'ANTROPOMETRIA' THEN 1 ELSE 0 END) AS ANTROPOMETRIA,
	        SUM(CASE WHEN A.ATIVIDADE = 'SAUDE AUDITIVA' THEN 1 ELSE 0 END) AS SAUDE_AUDITIVA,
	        SUM(CASE WHEN A.ATIVIDADE = 'VERIFICACAO DE SITUACAO VACINAL' THEN 1 ELSE 0 END) AS VACINACAO,
	        SUM(CASE WHEN A.ATIVIDADE = 'PREVENCAO DE COVID NAS ESCOLAS' THEN 1 ELSE 0 END) AS COVID
	    FROM ATIVIDADES_FILTRADAS A
	    GROUP BY A.NU_IDENTIFICADOR, A.NO_ESTABELECIMENTO, A.ANO
	)
	SELECT * FROM RESUMO_PIVOTADO		
	ORDER BY NU_IDENTIFICADOR;	
END;
$$;`
    },

    {name:'Listagem Duplicados',
        definition: `CREATE OR REPLACE FUNCTION LISTAR_DUPLICADOS() 
        RETURNS TABLE (
            DUPLICADOS INTEGER,    
            CNS VARCHAR,
            CPF VARCHAR,
            NOME_CIDADAO VARCHAR,
            DT_NASC TEXT,
            NOME_MAE VARCHAR,
            ULTIMA_ATUALIZACAO TEXT,    
            NOME_EQUIPE VARCHAR
        ) AS $$
        BEGIN
            RETURN QUERY
        WITH TOTAL_DUPLICADOS AS (
                SELECT 
                    COUNT(*)/2 AS TOTAL  
                FROM TB_FAT_CIDADAO_PEC TFCP
                LEFT JOIN TB_CIDADAO TC ON
                    TC.CO_SEQ_CIDADAO = TFCP.CO_CIDADAO
                LEFT JOIN TB_DIM_EQUIPE TDE ON
                    TFCP.CO_DIM_EQUIPE_VINC = TDE.CO_SEQ_DIM_EQUIPE 
                WHERE 
                    TC.ST_UNIFICADO = 0
                    AND (
                        (TFCP.NO_CIDADAO, TFCP.CO_DIM_TEMPO_NASCIMENTO, TC.NO_MAE) IN (
                            SELECT 
                                TFCP_INNER.NO_CIDADAO, 
                                TFCP_INNER.CO_DIM_TEMPO_NASCIMENTO, 
                                TC_INNER.NO_MAE
                            FROM TB_FAT_CIDADAO_PEC TFCP_INNER
                            LEFT JOIN TB_CIDADAO TC_INNER ON
                                TC_INNER.CO_SEQ_CIDADAO = TFCP_INNER.CO_CIDADAO
                            GROUP BY 
                                TFCP_INNER.NO_CIDADAO, 
                                TFCP_INNER.CO_DIM_TEMPO_NASCIMENTO, 
                                TC_INNER.NO_MAE
                            HAVING COUNT(*) > 1
                        ) 
                        OR 
                        (TFCP.NO_CIDADAO, TFCP.CO_DIM_TEMPO_NASCIMENTO) IN (
                            SELECT 
                                TFCP_INNER.NO_CIDADAO, 
                                TFCP_INNER.CO_DIM_TEMPO_NASCIMENTO
                            FROM TB_FAT_CIDADAO_PEC TFCP_INNER
                            LEFT JOIN TB_CIDADAO TC_INNER ON
                                TC_INNER.CO_SEQ_CIDADAO = TFCP_INNER.CO_CIDADAO
                            GROUP BY 
                                TFCP_INNER.NO_CIDADAO, 
                                TFCP_INNER.CO_DIM_TEMPO_NASCIMENTO
                            HAVING COUNT(*) > 1
                        )
                    )
            ),
            LISTA_DUPLICADOS AS (
            SELECT 
                TFCP.NU_CNS AS CNS,
                TFCP.NU_CPF_CIDADAO AS CPF, 
                TFCP.NO_CIDADAO AS NOME_CIDADAO, 
                TO_CHAR(TO_DATE(TFCP.CO_DIM_TEMPO_NASCIMENTO::TEXT,'YYYYMMDD'), 'DD/MM/YYYY') AS DT_NASCIMENTO,
                TC.NO_MAE AS NOME_MAE, 
                TO_CHAR(CAST(TC.DT_ATUALIZADO AS DATE),'DD/MM/YYYY') AS ULTIMA_ATUALIZACAO, 
                TDE.NO_EQUIPE AS NOME_EQUIPE     
            FROM TB_FAT_CIDADAO_PEC TFCP
            LEFT JOIN TB_CIDADAO TC ON
                TC.CO_SEQ_CIDADAO = TFCP.CO_CIDADAO
            LEFT JOIN TB_DIM_EQUIPE TDE ON
                TFCP.CO_DIM_EQUIPE_VINC = TDE.CO_SEQ_DIM_EQUIPE 
            WHERE 
                TC.ST_UNIFICADO = 0
                AND (
                    (TFCP.NO_CIDADAO, TFCP.CO_DIM_TEMPO_NASCIMENTO, TC.NO_MAE) IN (
                        SELECT 
                            TFCP_INNER.NO_CIDADAO, 
                            TFCP_INNER.CO_DIM_TEMPO_NASCIMENTO, 
                            TC_INNER.NO_MAE
                        FROM TB_FAT_CIDADAO_PEC TFCP_INNER
                        LEFT JOIN TB_CIDADAO TC_INNER ON
                            TC_INNER.CO_SEQ_CIDADAO = TFCP_INNER.CO_CIDADAO
                        GROUP BY 
                            TFCP_INNER.NO_CIDADAO, 
                            TFCP_INNER.CO_DIM_TEMPO_NASCIMENTO, 
                            TC_INNER.NO_MAE
                        HAVING COUNT(*) > 1
                    ) 
                    OR 
                    (TFCP.NO_CIDADAO, TFCP.CO_DIM_TEMPO_NASCIMENTO) IN (
                        SELECT 
                            TFCP_INNER.NO_CIDADAO, 
                            TFCP_INNER.CO_DIM_TEMPO_NASCIMENTO
                        FROM TB_FAT_CIDADAO_PEC TFCP_INNER
                        LEFT JOIN TB_CIDADAO TC_INNER ON
                            TC_INNER.CO_SEQ_CIDADAO = TFCP_INNER.CO_CIDADAO
                        GROUP BY 
                            TFCP_INNER.NO_CIDADAO, 
                            TFCP_INNER.CO_DIM_TEMPO_NASCIMENTO
                        HAVING COUNT(*) > 1
                    )
                )
            ORDER BY TFCP.NO_CIDADAO
            )
            SELECT
                TD.TOTAL::INTEGER,
                LD.CNS,
                LD.CPF,
                LD.NOME_CIDADAO,
                LD.DT_NASCIMENTO,
                LD.NOME_MAE,
                LD.ULTIMA_ATUALIZACAO,
                CASE WHEN
                    LD.NOME_EQUIPE ISNULL THEN 'SEM VINCULO'
                    ELSE LD.NOME_EQUIPE
                END AS NOME_EQUIPE
            FROM TOTAL_DUPLICADOS TD
            CROSS JOIN LISTA_DUPLICADOS LD;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'FCI sem CNS & CPF',
        definition: `CREATE OR REPLACE FUNCTION FCI_SEM_DOCUMENTO (
            P_EQUIPE VARCHAR DEFAULT NULL)
        RETURNS TABLE(
            NOME VARCHAR,
            DATA_NASC VARCHAR, 
            SEXO VARCHAR, 
            CPF VARCHAR,
            CNS VARCHAR,
            ULTIMA_ATUALIZACAO VARCHAR,
            INE VARCHAR, 
            EQUIPE VARCHAR, 
            MICROAREA VARCHAR,
            TIPO_CADASTRO VARCHAR)
        AS $$
        BEGIN
            RETURN QUERY
                SELECT 
                NO_CIDADAO AS NOME,
                TO_CHAR(DT_NASCIMENTO_CIDADAO, 'DD/MM/YYYY')::VARCHAR AS DATA_NASC,
                NO_SEXO_CIDADAO AS SEXO,
                NU_CPF_CIDADAO AS CPF,
                NU_CNS_CIDADAO AS CNS,
                TO_CHAR(DT_ULTIMA_ATUALIZACAO_CIDADAO, 'DD/MM/YYYY')::VARCHAR AS ULTIMA_ATUALIZACAO,
                NU_INE_VINC_EQUIPE AS INE,
                NO_EQUIPE_VINC_EQUIPE AS NOME_EQUIPE,	
                NU_MICRO_AREA_TB_CIDADAO  AS MICRO_AREA,
                CASE 
                    WHEN ST_POSSUI_FCI = 1 THEN 'FCI'
                    ELSE 'CC'
                END::VARCHAR AS TIPO_CADASTRO
            FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
            WHERE 
                (NU_CNS_CIDADAO ISNULL AND NU_CPF_CIDADAO ISNULL)
                AND (P_EQUIPE IS NULL OR NU_INE_VINC_EQUIPE = P_EQUIPE)
            ORDER BY INE ASC;
        END;
            $$ LANGUAGE PLPGSQL;`
    },

    {
        name:'FCI DESATUALIZADAS',
        definition: `CREATE OR REPLACE FUNCTION FCI_DESATUALIZADA ( 
                    QUADRIMESTRE DATE,
                    EQUIPE VARCHAR DEFAULT NULL,	
                    PROFISSIONAL VARCHAR DEFAULT NULL)
                RETURNS TABLE(
                    INE VARCHAR,
                    EQUIPE_NOME VARCHAR,
                    NOME VARCHAR,
                    CNS VARCHAR,
                    CPF VARCHAR,
                    DT_NASCIMENTO VARCHAR,
                    FCI_ULTIMA_ATUALIZACAO VARCHAR,
                    FCDT_ULTIMA_ATUALIZACAO VARCHAR,
                    MICRO_AREA VARCHAR,
                    COD_PROFISSIONAL INTEGER,
                    CNS_PROFISSIONAL VARCHAR,
                    NOME_PROFISSIONAL VARCHAR,
                    DIAS_SEM_ATUALIZAR INTEGER)
                AS $$
                BEGIN
                    RETURN QUERY
                        WITH PROFISSIONAIS_ATIVOS AS (
                            SELECT 
                                CO_SEQ_DIM_PROFISSIONAL,
                                NU_CNS,
                                NO_PROFISSIONAL
                            FROM TB_DIM_PROFISSIONAL
                            WHERE ST_REGISTRO_VALIDO = 1
                        ),
                        CADASTROS_INDIVIDUAIS AS (
                            SELECT 
                                NU_UUID_FICHA,
                                CO_DIM_PROFISSIONAL, 
                                NU_MICRO_AREA,
                                CO_DIM_TEMPO, 
                                TDE.NU_INE,
                                TDE.NO_EQUIPE 
                            FROM TB_FAT_CAD_INDIVIDUAL TFCI
                            INNER JOIN TB_DIM_EQUIPE TDE ON TFCI.CO_DIM_EQUIPE = TDE.CO_SEQ_DIM_EQUIPE
                        ),
                        CIDADAOS_ACOMPANHADOS AS (
                            SELECT 
                                CO_UNICO_ULTIMA_FICHA,
                                NO_CIDADAO,
                                NU_CNS_CIDADAO,
                                NU_CPF_CIDADAO, 
                                DT_NASCIMENTO_CIDADAO,
                                DT_ULTIMA_ATUALIZACAO_CIDADAO,
                                DT_ATUALIZACAO_FCD 
                            FROM TB_ACOMP_CIDADAOS_VINCULADOS
                        )
                        SELECT 
                            CI.NU_INE,
                            CI.NO_EQUIPE,
                            CAC.NO_CIDADAO,
                            CAC.NU_CNS_CIDADAO,
                            CAC.NU_CPF_CIDADAO, 
                            TO_CHAR(TO_DATE(CAC.DT_NASCIMENTO_CIDADAO::TEXT, 'YYYY-MM-DD'), 'DD/MM/YYYY')::VARCHAR,
                            TO_CHAR(TO_DATE(CI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD'), 'DD/MM/YYYY')::VARCHAR,
                            TO_CHAR(CAC.DT_ATUALIZACAO_FCD, 'DD/MM/YYYY')::VARCHAR,   
                            CI.NU_MICRO_AREA,     
                            PA.CO_SEQ_DIM_PROFISSIONAL::INTEGER, 
                            PA.NU_CNS AS NU_CNS_PROFISSIONAL,
                            PA.NO_PROFISSIONAL,		
                            (CURRENT_DATE - TO_DATE(CI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD'))::INT AS DIAS  
                        FROM CIDADAOS_ACOMPANHADOS CAC
                        INNER JOIN CADASTROS_INDIVIDUAIS CI
                            ON CAC.CO_UNICO_ULTIMA_FICHA = CI.NU_UUID_FICHA
                        INNER JOIN PROFISSIONAIS_ATIVOS PA
                            ON CI.CO_DIM_PROFISSIONAL = PA.CO_SEQ_DIM_PROFISSIONAL
                        WHERE
                            TO_DATE(CI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') <= QUADRIMESTRE
                            AND TO_DATE(CI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') < (QUADRIMESTRE - INTERVAL '24 MONTHS')
                            AND (EQUIPE IS NULL OR CI.NU_INE = EQUIPE)
                            AND (PROFISSIONAL IS NULL OR PA.CO_SEQ_DIM_PROFISSIONAL = PROFISSIONAL::BIGINT)		    
                        ORDER BY NOME ASC;
                END;
            $$ LANGUAGE PLPGSQL;`        
    },

    {
        name: 'Cidadão sem FCDT',
        definition: `CREATE OR REPLACE FUNCTION CIDADAO_SEM_FCDT (
            P_EQUIPE VARCHAR DEFAULT NULL)
        RETURNS TABLE(
            NOME VARCHAR,
            DATA_NASC VARCHAR, 
            SEXO VARCHAR, 
            CPF VARCHAR,
            CNS VARCHAR,
            ULTIMA_ATUALIZACAO VARCHAR,
            INE VARCHAR, 
            EQUIPE VARCHAR, 
            MICROAREA VARCHAR,
            TIPO_CADASTRO VARCHAR)
        AS $$
        BEGIN
            RETURN QUERY
                SELECT 
                NO_CIDADAO AS NOME,
                TO_CHAR(DT_NASCIMENTO_CIDADAO, 'DD/MM/YYYY')::VARCHAR AS DATA_NASC,
                NO_SEXO_CIDADAO AS SEXO,
                CASE
                    WHEN NU_CPF_CIDADAO IS NULL THEN '****'
                    ELSE NU_CPF_CIDADAO 
                END AS CPF,		
                CASE 
                    WHEN NU_CNS_CIDADAO IS NULL THEN '****'
                    ELSE NU_CNS_CIDADAO
                END AS CNS,
                TO_CHAR(DT_ULTIMA_ATUALIZACAO_CIDADAO, 'DD/MM/YYYY')::VARCHAR AS ULTIMA_ATUALIZACAO,
                NU_INE_VINC_EQUIPE AS INE,
                NO_EQUIPE_VINC_EQUIPE AS NOME_EQUIPE,	
                CASE
                    WHEN NU_MICRO_AREA_TB_CIDADAO IS NOT NULL THEN NU_MICRO_AREA_TB_CIDADAO 
                    ELSE '****' 
                END AS MICRO_AREA,
                CASE 
                    WHEN ST_POSSUI_FCI = 1 THEN 'FCI'
                    ELSE 'CC'
                END::VARCHAR AS TIPO_CADASTRO
            FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
            WHERE
                (NU_CNS_CIDADAO IS NOT NULL OR NU_CPF_CIDADAO IS NOT NULL)
                AND (ST_POSSUI_FCDT = 0 AND ST_POSSUI_FCI = 1)
                AND	DT_ULTIMA_ATUALIZACAO_CIDADAO < (CURRENT_DATE - INTERVAL '24 MONTHS')
                AND (P_EQUIPE IS NULL OR NU_INE_VINC_EQUIPE = P_EQUIPE)
            ORDER BY NOME ASC;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'Cidadão sem FCI',
        definition: `CREATE OR REPLACE FUNCTION CIDADAO_SEM_FCI (
            P_EQUIPE VARCHAR DEFAULT NULL)
        RETURNS TABLE(
            NOME VARCHAR,
            DATA_NASC VARCHAR, 
            SEXO VARCHAR, 
            CPF VARCHAR,
            CNS VARCHAR,
            ULTIMA_ATUALIZACAO VARCHAR,
            INE VARCHAR, 
            EQUIPE VARCHAR, 
            MICROAREA VARCHAR,
            TIPO_CADASTRO VARCHAR)
        AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                NO_CIDADAO AS NOME,
                TO_CHAR(DT_NASCIMENTO_CIDADAO, 'DD/MM/YYYY')::VARCHAR AS DATA_NASC,
                NO_SEXO_CIDADAO AS SEXO,
                CASE
                    WHEN NU_CPF_CIDADAO IS NULL THEN '****'
                    ELSE NU_CPF_CIDADAO 
                END AS CPF,		
                CASE 
                    WHEN NU_CNS_CIDADAO IS NULL THEN '****'
                    ELSE NU_CNS_CIDADAO
                END AS CNS,
                TO_CHAR(DT_ULTIMA_ATUALIZACAO_CIDADAO, 'DD/MM/YYYY')::VARCHAR AS ULTIMA_ATUALIZACAO,
                NU_INE_VINC_EQUIPE AS INE,
                NO_EQUIPE_VINC_EQUIPE AS NOME_EQUIPE,	
                CASE
                    WHEN NU_MICRO_AREA_DOMICILIO  IS NOT NULL THEN NU_MICRO_AREA_DOMICILIO 
                    ELSE '****' 
                END AS MICRO_AREA,
                CASE 
                    WHEN ST_POSSUI_FCI = 1 THEN 'FCI'
                    ELSE 'CC'
                END::VARCHAR AS TIPO_CADASTRO
            FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
            WHERE
                (NU_CNS_CIDADAO IS NOT NULL OR NU_CPF_CIDADAO IS NOT NULL)
                AND ST_POSSUI_FCI = 0
                AND (P_EQUIPE IS NULL OR NU_INE_VINC_EQUIPE = P_EQUIPE)
            ORDER BY NOME ASC;
        END;
        $$ LANGUAGE PLPGSQL`
    },

    {
        name: 'Resumo IVCF-20',
        definition: `CREATE OR REPLACE FUNCTION RESUMO_IVCF(
            QUADRIMESTRE DATE,
            LISTA_INE TEXT[] DEFAULT NULL)
        RETURNS TABLE (
        INE VARCHAR,
        QTD_IDOSOS INTEGER,
        TOTAL_AVALIADOS INTEGER,
        PERC_IDOSOS_AVAL DECIMAL,
        BAIXO_RISCO INTEGER,
        PERC_BAIXO_RISCO DECIMAL,
        MODERADO_RISCO INTEGER,
        PERC_MODERADO_RISCO DECIMAL,
        ALTO_RISCO INTEGER,
        PERC_ALTO_RISCO DECIMAL
        ) AS $$
        BEGIN
        RETURN QUERY
        WITH CTE_EQUIPE AS (
            SELECT 
                NU_INE AS INE,
                NO_EQUIPE AS NOME_EQUIPE
            FROM TB_EQUIPE
            LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
            WHERE ST_ATIVO = 1 AND NU_MS = '70'
        ),
        CTE_IVCF_BAIXO AS (
            SELECT 
            TDE.NU_INE AS INE,
            COUNT(*) AS TOTAL_BAIXO
            FROM TB_FAT_IVCF TFI
            LEFT JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFI.CO_DIM_EQUIPE
            WHERE 
            TFI.NU_RESULTADO BETWEEN 0 AND 6
            AND TO_DATE(TFI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= QUADRIMESTRE - INTERVAL '12 MONTHS'
            GROUP BY TDE.NU_INE
        ),
        CTE_IVCF_MODERADO AS (
            SELECT 
            TDE.NU_INE AS INE,
            COUNT(*) AS TOTAL_MODERADO
            FROM TB_FAT_IVCF TFI
            LEFT JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFI.CO_DIM_EQUIPE
            WHERE 
            TFI.NU_RESULTADO BETWEEN 7 AND 14
            AND TO_DATE(TFI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= QUADRIMESTRE - INTERVAL '12 MONTHS'
            GROUP BY TDE.NU_INE
        ),
        CTE_IVCF_ALTO AS (
            SELECT 
            TDE.NU_INE AS INE,
            COUNT(*) AS TOTAL_ALTO
            FROM TB_FAT_IVCF TFI
            LEFT JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFI.CO_DIM_EQUIPE
            WHERE 
            TFI.NU_RESULTADO >= 15
            AND TO_DATE(TFI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') >= QUADRIMESTRE - INTERVAL '12 MONTHS'
            GROUP BY TDE.NU_INE
        ),
        CTE_IDOSOS AS (
            SELECT 
            TDE.NU_INE AS INE,
            COUNT(*) AS TOTAL_IDOSOS
            FROM TB_FAT_CIDADAO_PEC TFCP
            LEFT JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFCP.CO_DIM_EQUIPE_VINC
            WHERE EXTRACT(YEAR FROM AGE(QUADRIMESTRE, TO_DATE(TFCP.CO_DIM_TEMPO_NASCIMENTO::TEXT, 'YYYYMMDD'))) >= 60
            GROUP BY TDE.NU_INE
        )
        SELECT 
            CASE 
            WHEN LISTA_INE IS NULL THEN 'TOTAL_GERAL'::TEXT
            ELSE EQUIPES.INE
            END AS INE,
            SUM(COALESCE(IDOSOS.TOTAL_IDOSOS, 0))::INTEGER AS QTD_IDOSOS,
            (SUM(COALESCE(BAIXO.TOTAL_BAIXO, 0)) +
            SUM(COALESCE(MODERADO.TOTAL_MODERADO, 0)) +
            SUM(COALESCE(ALTO.TOTAL_ALTO, 0)))::INTEGER AS TOTAL_AVALIADOS,
            ROUND((SUM(COALESCE(BAIXO.TOTAL_BAIXO, 0)) +
            SUM(COALESCE(MODERADO.TOTAL_MODERADO, 0)) +
            SUM(COALESCE(ALTO.TOTAL_ALTO, 0)))/ SUM(COALESCE(IDOSOS.TOTAL_IDOSOS, 0)) * 100, 2)::DECIMAL AS PERC_IDOSOS_AVAL,
            SUM(COALESCE(BAIXO.TOTAL_BAIXO, 0))::INTEGER AS BAIXO_RISCO,
            ROUND(SUM(COALESCE(BAIXO.TOTAL_BAIXO, 0))/SUM(COALESCE(IDOSOS.TOTAL_IDOSOS, 0)) * 100, 2)::DECIMAL AS PERC_BAIXO_RISCO, 
            SUM(COALESCE(MODERADO.TOTAL_MODERADO, 0))::INTEGER AS MODERADO_RISCO,
            ROUND(SUM(COALESCE(MODERADO.TOTAL_MODERADO, 0))/SUM(COALESCE(IDOSOS.TOTAL_IDOSOS, 0)) * 100, 2)::DECIMAL AS PERC_MODERADO_RISCO, 
            SUM(COALESCE(ALTO.TOTAL_ALTO, 0))::INTEGER AS ALTO_RISCO,
            ROUND(SUM(COALESCE(ALTO.TOTAL_ALTO, 0))/SUM(COALESCE(IDOSOS.TOTAL_IDOSOS, 0)) * 100, 2)::DECIMAL AS PERC_ALTO_RISCO 
        FROM CTE_EQUIPE EQUIPES
        LEFT JOIN CTE_IVCF_BAIXO BAIXO ON BAIXO.INE = EQUIPES.INE
        LEFT JOIN CTE_IVCF_MODERADO MODERADO ON MODERADO.INE = EQUIPES.INE
        LEFT JOIN CTE_IVCF_ALTO ALTO ON ALTO.INE = EQUIPES.INE
        LEFT JOIN CTE_IDOSOS IDOSOS ON IDOSOS.INE = EQUIPES.INE
        WHERE (LISTA_INE IS NULL OR EQUIPES.INE = ANY(LISTA_INE))
        GROUP BY	
            CASE 
            WHEN LISTA_INE IS NULL THEN 'TOTAL_GERAL'::TEXT
            ELSE EQUIPES.INE
            END;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'Lista Idoso IVCF-20',
        definition: `CREATE OR REPLACE FUNCTION LISTA_IDOSOS_IVCF(
            QUADRIMESTRE DATE,
            P_EQUIPE VARCHAR DEFAULT NULL	
        )
        RETURNS TABLE (
            INE VARCHAR,
            NOME VARCHAR,
            DT_NASCIMENTO VARCHAR,
            IDADE INTEGER,
            CPF VARCHAR,
            CNS VARCHAR,
            DT_ATENDIMENTO VARCHAR,
            IVCF_20 INTEGER,
            CLASSIFICACAO VARCHAR	
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT  
            NU_INE AS EQUIPE,
            NO_CIDADAO AS NOME_CIDADAO,
            TO_CHAR(TO_DATE(TFCP.CO_DIM_TEMPO_NASCIMENTO::TEXT, 'YYYYMMDD'), 'DD/MM/YYYY')::VARCHAR AS DT_NASCIMENTO,
            EXTRACT(YEAR FROM AGE(QUADRIMESTRE, TO_DATE(TFCP.CO_DIM_TEMPO_NASCIMENTO::TEXT, 'YYYYMMDD')))::INTEGER AS IDADE,
            CASE
                WHEN TFCP.NU_CPF_CIDADAO IS NULL THEN '****'
                ELSE TFCP.NU_CPF_CIDADAO
            END AS CPF,   
            CASE
                WHEN TFCP.NU_CNS IS NULL THEN '****'
                ELSE TFCP.NU_CNS
            END AS CNS,  
            --TDC.NU_CBO,
            TO_CHAR(TO_DATE(TFI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD'), 'DD/MM/YYYY')::VARCHAR AS DT_ATENDIMENTO, 
            TFI.NU_RESULTADO::INTEGER AS IVCF_20,
            CASE
                WHEN TFI.NU_RESULTADO BETWEEN 0 AND 6 THEN 'BAIXO RISCO'
                WHEN TFI.NU_RESULTADO BETWEEN 7 AND 14 THEN 'MODERADO RISCO'
                ELSE 'ALTO RISCO'
            END ::VARCHAR AS CLASSIFICACAO
            --CO_DIM_TEMPO, 
            FROM TB_FAT_IVCF TFI 
            LEFT JOIN TB_FAT_CIDADAO_PEC TFCP ON TFCP.CO_SEQ_FAT_CIDADAO_PEC = TFI.CO_FAT_CIDADAO_PEC 
            LEFT JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFI.CO_DIM_EQUIPE
            LEFT JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = TFI.CO_DIM_CBO
            WHERE
                (P_EQUIPE IS NULL OR TDE.NU_INE = P_EQUIPE)
            ORDER BY
                EQUIPE ASC;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    /*-----------------INDICADORES DE QUALIDADE APS --------------------------------*/ 

        {
        name: 'Resumo Mais Acesso APS',
        definition: `CREATE OR REPLACE FUNCTION RESUMO_MAIS_ACESSO_APS(
            QUADRIMESTRE DATE,
            P_EQUIPE TEXT DEFAULT NULL)
        RETURNS TABLE(
            ESF VARCHAR,
            TOTAL_DEMANDA_PROGRAMADA INTEGER,
            TOTAL_ATENDIMENTOS INTEGER,
            PERC_MAIS_ACESSO FLOAT	
        ) AS $$
        BEGIN
            RETURN QUERY
            WITH CTE_EQUIPES AS (
                SELECT 
                    NU_INE AS INE,
                    NO_EQUIPE AS NOME_EQUIPE
                FROM TB_EQUIPE
                LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                WHERE ST_ATIVO = 1 AND NU_MS = '70' 
            ),
            CTE_CONS_AGENDADA AS (
                SELECT 
                    TDE.NU_INE, 
                    COUNT(*) AS CONS_AGENDADA
                FROM TB_FAT_ATENDIMENTO_INDIVIDUAL TFAI 
                INNER JOIN TB_DIM_TIPO_ATENDIMENTO TDTA 
                    ON TDTA.CO_SEQ_DIM_TIPO_ATENDIMENTO = TFAI.CO_DIM_TIPO_ATENDIMENTO
                LEFT JOIN TB_DIM_EQUIPE TDE 
                    ON TDE.CO_SEQ_DIM_EQUIPE = TFAI.CO_DIM_EQUIPE_1
                LEFT JOIN TB_DIM_CBO TDC 
                    ON TDC.CO_SEQ_DIM_CBO = TFAI.CO_DIM_CBO_1  
                WHERE CO_SEQ_DIM_TIPO_ATENDIMENTO = 2
                AND TDC.NU_CBO IN ('225142', '225130', '225170', '223505', '223565')		
                AND TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') 
                    BETWEEN QUADRIMESTRE - INTERVAL '12 MONTHS' AND QUADRIMESTRE
                GROUP BY TDE.NU_INE
            ),
            CTE_CUIDADO_CONTINUADO AS (
                SELECT 
                    TDE.NU_INE, 
                    COUNT(*) AS CUIDADO_CONTINUADO 
                FROM TB_FAT_ATENDIMENTO_INDIVIDUAL TFAI 
                INNER JOIN TB_DIM_TIPO_ATENDIMENTO TDTA 
                    ON TDTA.CO_SEQ_DIM_TIPO_ATENDIMENTO = TFAI.CO_DIM_TIPO_ATENDIMENTO
                LEFT JOIN TB_DIM_EQUIPE TDE 
                    ON TDE.CO_SEQ_DIM_EQUIPE = TFAI.CO_DIM_EQUIPE_1 
                LEFT JOIN TB_DIM_CBO TDC
                    ON TDC.CO_SEQ_DIM_CBO = TFAI.CO_DIM_CBO_1	
                WHERE CO_SEQ_DIM_TIPO_ATENDIMENTO = 3
                AND TDC.NU_CBO IN ('225142', '225130', '225170', '223505', '223565')		
                AND TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') 
                    BETWEEN QUADRIMESTRE - INTERVAL '12 MONTHS' AND QUADRIMESTRE
                GROUP BY TDE.NU_INE
            ),
            CTE_TOT_ATENDIMENTOS AS (
                SELECT TDE.NU_INE, COUNT(*) AS QTD_TOTAL_ATEND 
                FROM TB_FAT_ATENDIMENTO_INDIVIDUAL TFAI
                INNER JOIN TB_DIM_TIPO_ATENDIMENTO TDTA 
                    ON TDTA.CO_SEQ_DIM_TIPO_ATENDIMENTO = TFAI.CO_DIM_TIPO_ATENDIMENTO 
                LEFT JOIN TB_DIM_EQUIPE TDE 
                    ON TDE.CO_SEQ_DIM_EQUIPE = TFAI.CO_DIM_EQUIPE_1 
                LEFT JOIN TB_DIM_CBO TDC
                    ON TDC.CO_SEQ_DIM_CBO = TFAI.CO_DIM_CBO_1	
                WHERE 
                    TDC.NU_CBO IN ('225142', '225130', '225170', '223505', '223565')	
                    AND TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') 
                    BETWEEN QUADRIMESTRE - INTERVAL '12 MONTHS' AND QUADRIMESTRE
                GROUP BY TDE.NU_INE
            ),
            CTE_RESUMO AS (
                SELECT 	
                    EQUIPES.NOME_EQUIPE,
                    EQUIPES.INE,
                    COALESCE(AGENDA.CONS_AGENDADA, 0) + COALESCE(CONTINUADO.CUIDADO_CONTINUADO, 0) AS DEMANDA_PROGRAMADA,
                    COALESCE(ATENDIMENTO.QTD_TOTAL_ATEND, 0) AS ATENDIMENTOS
                FROM CTE_EQUIPES EQUIPES
                LEFT JOIN CTE_CONS_AGENDADA AGENDA ON AGENDA.NU_INE = EQUIPES.INE
                LEFT JOIN CTE_CUIDADO_CONTINUADO CONTINUADO ON CONTINUADO.NU_INE = EQUIPES.INE
                LEFT JOIN CTE_TOT_ATENDIMENTOS ATENDIMENTO ON ATENDIMENTO.NU_INE = EQUIPES.INE
                WHERE P_EQUIPE IS NULL OR EQUIPES.INE = P_EQUIPE
            )
            SELECT 
            CASE 
                WHEN P_EQUIPE IS NULL THEN 'TODAS AS EQUIPES' 
                ELSE MAX(CTE_RESUMO.NOME_EQUIPE) 
            END::VARCHAR AS ESF,  -- CAST ADICIONADO AQUI
                SUM(CTE_RESUMO.DEMANDA_PROGRAMADA)::INTEGER AS TOTAL_DEMANDA_PROGRAMADA,
                SUM(CTE_RESUMO.ATENDIMENTOS)::INTEGER AS TOTAL_ATENDIMENTOS,
                ROUND(
                    (CAST(SUM(CTE_RESUMO.DEMANDA_PROGRAMADA) AS NUMERIC) / NULLIF(SUM(CTE_RESUMO.ATENDIMENTOS), 0)) * 100,
                    2
                )::FLOAT AS PERC_MAIS_ACESSO
            FROM CTE_RESUMO;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

      {
        name: 'Mais Acesso APS',
        definition: `CREATE OR REPLACE FUNCTION MAIS_ACESSO_NOVO(
            QUADRIMESTRE DATE
            )
        RETURNS TABLE(
            EQUIPE VARCHAR,
            AGENDADO_1 INTEGER,
            ATENDI_1 INTEGER,
            PERCENT_1 FLOAT,
            AGENDADO_2 INTEGER,
            ATENDI_2 INTEGER,
            PERCENT_2 FLOAT,
            AGENDADO_3 INTEGER,
            ATENDI_3 INTEGER,
            PERCENT_3 FLOAT,
            AGENDADO_4 INTEGER,
            ATENDI_4 INTEGER,
            PERCENT_4 FLOAT,
            MESES TEXT[]
        ) AS $$
        BEGIN
            RETURN QUERY
            WITH CTE_EQUIPES AS (
            SELECT 
                NU_INE AS INE,
                NO_EQUIPE AS NOME_EQUIPE
            FROM TB_EQUIPE
            LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
            WHERE ST_ATIVO = 1 AND NU_MS = '70'
        ),
        CONSULTA_AGENDADA AS (
            SELECT 
                TDE.NU_INE, 
                DATE_TRUNC('MONTH', TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD'))::DATE AS AGENDADO_MES,
                COUNT(*) AS TOTAL_AGENDADO
            FROM TB_FAT_ATENDIMENTO_INDIVIDUAL TFAI 
            INNER JOIN TB_DIM_TIPO_ATENDIMENTO TDTA 
                ON TDTA.CO_SEQ_DIM_TIPO_ATENDIMENTO = TFAI.CO_DIM_TIPO_ATENDIMENTO
            LEFT JOIN TB_DIM_EQUIPE TDE 
                ON TDE.CO_SEQ_DIM_EQUIPE = TFAI.CO_DIM_EQUIPE_1
            LEFT JOIN TB_DIM_CBO TDC 
                ON TDC.CO_SEQ_DIM_CBO = TFAI.CO_DIM_CBO_1		 
            WHERE 
                CO_SEQ_DIM_TIPO_ATENDIMENTO IN (2, 3)
                AND TDC.NU_CBO IN ('225142', '225130', '225170', '223505', '223565')	
                AND TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') 
                    BETWEEN quadrimestre - INTERVAL '4 MONTHS' 
                    AND quadrimestre
            GROUP BY TDE.NU_INE, DATE_TRUNC('MONTH', TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD'))
        ),
        TOTAL_ATENDIMENTOS AS (
            SELECT 
                TDE.NU_INE,
                DATE_TRUNC('MONTH', TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) AS MES,
                COUNT(*) AS TOTAL_ATENDIMENTOS
            FROM TB_FAT_ATENDIMENTO_INDIVIDUAL TFAI 
            INNER JOIN TB_DIM_TIPO_ATENDIMENTO TDTA 
                ON TDTA.CO_SEQ_DIM_TIPO_ATENDIMENTO = TFAI.CO_DIM_TIPO_ATENDIMENTO
            LEFT JOIN TB_DIM_EQUIPE TDE 
                ON TDE.CO_SEQ_DIM_EQUIPE = TFAI.CO_DIM_EQUIPE_1
            LEFT JOIN TB_DIM_CBO TDC 
                ON TDC.CO_SEQ_DIM_CBO = TFAI.CO_DIM_CBO_1		 
            WHERE 
                TDC.NU_CBO IN ('225142', '225130', '225170', '223505', '223565')	
                AND TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') 
                    BETWEEN quadrimestre - INTERVAL '4 MONTHS' 
                    AND quadrimestre
            GROUP BY TDE.NU_INE, DATE_TRUNC('MONTH', TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD'))
        )
        SELECT 
            EQ.NOME_EQUIPE,    
            -- TOTAL AGENDADOS POR MÊS
            COALESCE(SUM(CA.TOTAL_AGENDADO) FILTER (WHERE CA.AGENDADO_MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '3 MONTHS')),0)::INTEGER AS MES1_AGENDADO,
            COALESCE(SUM(TA.TOTAL_ATENDIMENTOS) FILTER (WHERE TA.MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '3 MONTHS')),0)::INTEGER AS MES1_ATEND,
            ROUND(COALESCE(SUM(CA.TOTAL_AGENDADO) FILTER (WHERE CA.AGENDADO_MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '3 MONTHS')),0) /
                NULLIF(SUM(TA.TOTAL_ATENDIMENTOS) FILTER (WHERE TA.MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '3 MONTHS')),0) * 100, 2)::FLOAT AS PERC_1,
            COALESCE(SUM(CA.TOTAL_AGENDADO) FILTER (WHERE CA.AGENDADO_MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '2 MONTHS')),0)::INTEGER AS MES2_AGENDADO,
            COALESCE(SUM(TA.TOTAL_ATENDIMENTOS) FILTER (WHERE TA.MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '2 MONTHS')),0)::INTEGER AS MES2_ATEND,
            ROUND(COALESCE(SUM(CA.TOTAL_AGENDADO) FILTER (WHERE CA.AGENDADO_MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '2 MONTHS')),0) /
            NULLIF(SUM(TA.TOTAL_ATENDIMENTOS) FILTER (WHERE TA.MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '2 MONTHS')),0) * 100, 2 )::FLOAT AS PERC_2,
            COALESCE(SUM(CA.TOTAL_AGENDADO) FILTER (WHERE CA.AGENDADO_MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '1 MONTHS')),0)::INTEGER AS MES3_AGENDADO,
            COALESCE(SUM(TA.TOTAL_ATENDIMENTOS) FILTER (WHERE TA.MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '1 MONTHS')),0)::INTEGER AS MES3_ATEND,
            ROUND(COALESCE(SUM(CA.TOTAL_AGENDADO) FILTER (WHERE CA.AGENDADO_MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '1 MONTHS')),0) /
            NULLIF(SUM(TA.TOTAL_ATENDIMENTOS) FILTER (WHERE TA.MES = DATE_TRUNC('MONTH', quadrimestre - INTERVAL '1 MONTHS')),0) * 100, 2)::FLOAT AS PERC_3,
            COALESCE(SUM(CA.TOTAL_AGENDADO) FILTER (WHERE CA.AGENDADO_MES = DATE_TRUNC('MONTH', quadrimestre)),0)::INTEGER AS MES4_AGENDADO,       
            COALESCE(SUM(TA.TOTAL_ATENDIMENTOS) FILTER (WHERE TA.MES = DATE_TRUNC('MONTH', quadrimestre)),0)::INTEGER AS MES4_ATEND,
            ROUND(COALESCE(SUM(CA.TOTAL_AGENDADO) FILTER (WHERE CA.AGENDADO_MES = DATE_TRUNC('MONTH', quadrimestre)),0) /       
                NULLIF(SUM(TA.TOTAL_ATENDIMENTOS) FILTER (WHERE TA.MES = DATE_TRUNC('MONTH', quadrimestre)),0) *100, 2)::FLOAT AS PERC_4,
            -- LABELS DOS MESES (ÚTIL PRO FRONT)
        ARRAY[
        CASE TO_CHAR(DATE_TRUNC('MONTH', quadrimestre - INTERVAL '3 MONTHS'), 'Mon')
            WHEN 'Jan' THEN 'Jan'
            WHEN 'Feb' THEN 'Fev'
            WHEN 'Mar' THEN 'Mar'
            WHEN 'Apr' THEN 'Abr'
            WHEN 'May' THEN 'Mai'
            WHEN 'Jun' THEN 'Jun'
            WHEN 'Jul' THEN 'Jul'
            WHEN 'Aug' THEN 'Ago'
            WHEN 'Sep' THEN 'Set'
            WHEN 'Oct' THEN 'Out'
            WHEN 'Nov' THEN 'Nov'
            WHEN 'Dec' THEN 'Dez'
        END,
        CASE TO_CHAR(DATE_TRUNC('MONTH', quadrimestre - INTERVAL '2 MONTHS'), 'Mon')
            WHEN 'Jan' THEN 'Jan'
            WHEN 'Feb' THEN 'Fev'
            WHEN 'Mar' THEN 'Mar'
            WHEN 'Apr' THEN 'Abr'
            WHEN 'May' THEN 'Mai'
            WHEN 'Jun' THEN 'Jun'
            WHEN 'Jul' THEN 'Jul'
            WHEN 'Aug' THEN 'Ago'
            WHEN 'Sep' THEN 'Set'
            WHEN 'Oct' THEN 'Out'
            WHEN 'Nov' THEN 'Nov'
            WHEN 'Dec' THEN 'Dez'
        END,
        CASE TO_CHAR(DATE_TRUNC('MONTH', quadrimestre - INTERVAL '1 MONTHS'), 'Mon')
            WHEN 'Jan' THEN 'Jan'
            WHEN 'Feb' THEN 'Fev'
            WHEN 'Mar' THEN 'Mar'
            WHEN 'Apr' THEN 'Abr'
            WHEN 'May' THEN 'Mai'
            WHEN 'Jun' THEN 'Jun'
            WHEN 'Jul' THEN 'Jul'
            WHEN 'Aug' THEN 'Ago'
            WHEN 'Sep' THEN 'Set'
            WHEN 'Oct' THEN 'Out'
            WHEN 'Nov' THEN 'Nov'
            WHEN 'Dec' THEN 'Dez'
        END,
        CASE TO_CHAR(DATE_TRUNC('MONTH', quadrimestre), 'Mon')
            WHEN 'Jan' THEN 'Jan'
            WHEN 'Feb' THEN 'Fev'
            WHEN 'Mar' THEN 'Mar'
            WHEN 'Apr' THEN 'Abr'
            WHEN 'May' THEN 'Mai'
            WHEN 'Jun' THEN 'Jun'
            WHEN 'Jul' THEN 'Jul'
            WHEN 'Aug' THEN 'Ago'
            WHEN 'Sep' THEN 'Set'
            WHEN 'Oct' THEN 'Out'
            WHEN 'Nov' THEN 'Nov'
            WHEN 'Dec' THEN 'Dez'
        END
        ] AS meses_labels
        FROM CTE_EQUIPES EQ
        LEFT JOIN TOTAL_ATENDIMENTOS TA 
            ON TA.NU_INE = EQ.INE
        LEFT JOIN CONSULTA_AGENDADA CA 
            ON CA.NU_INE = EQ.INE
            AND CA.AGENDADO_MES = TA.MES
        GROUP BY EQ.NOME_EQUIPE
        ORDER BY EQ.NOME_EQUIPE;
        END;
        $$ language PLPGSQL;`
    },

    {
        name: 'POPULAÇÃO FEMININA',
        definition: `CREATE OR REPLACE FUNCTION POPULACAO_INDICADOR(
            QUADRIMESTRE DATE,
            P_EQUIPE TEXT DEFAULT NULL)
        RETURNS TABLE(
            EQUIPE VARCHAR,
            TOTAL_MULHERES INTEGER,
            MULHERES_COM_FCI INTEGER,
            MULHERES_FCI_ATUALIZADA INTEGER
            )
        AS $$
        BEGIN
            IF P_EQUIPE IS NULL THEN
                RETURN QUERY		
                WITH DIAGNOSTICO_MULHERES AS (
                SELECT
                    TACV.NU_INE_VINC_EQUIPE AS INE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                    ) AS TOTAL_MULHERES_COM_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '9 YEARS' AND INTERVAL '69 YEARS'
                    ) AS MULHERES_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '9 YEARS' AND INTERVAL '69 YEARS'
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTH'
                            AND QUADRIMESTRE
                    ) AS MULHERES_FCI_ATUALIZADAS
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                AND TACV.ST_POSSUI_FCI = 1
                --AND (P_EQUIPE IS NULL OR TACV.NU_INE_VINC_EQUIPE = P_EQUIPE)
                GROUP BY TACV.NU_INE_VINC_EQUIPE
                )
                SELECT 
                'TODAS AS EQUIPES'::VARCHAR V_INE,
                SUM(COALESCE(MULHERES_FCI, 0))::INTEGER AS MULHERES_FCI,
                SUM(COALESCE(TOTAL_MULHERES_COM_FCI, 0))::INTEGER AS TOTAL_MULHERES_COM_FCI,
                SUM(COALESCE(MULHERES_FCI_ATUALIZADAS, 0))::INTEGER AS MULHERES_FCI_ATUALIZADAS
            FROM DIAGNOSTICO_MULHERES;
        --	GROUP BY INE, MULHERES_FCI,TOTAL_MULHERES_COM_FCI, MULHERES_FCI_ATUALIZADAS 
        --	ORDER BY SUM(COALESCE(MULHERES_FCI_ATUALIZADAS, 0)) DESC;
            ELSE
                RETURN QUERY		
                WITH DIAGNOSTICO_MULHERES AS (
                SELECT
                    TACV.NU_INE_VINC_EQUIPE AS INE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                    ) AS TOTAL_MULHERES_COM_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '9 YEARS' AND INTERVAL '69 YEARS'
                    ) AS MULHERES_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '9 YEARS' AND INTERVAL '69 YEARS'
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTH'
                            AND QUADRIMESTRE
                    ) AS MULHERES_FCI_ATUALIZADAS
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                AND TACV.ST_POSSUI_FCI = 1
                AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                GROUP BY TACV.NU_INE_VINC_EQUIPE
                )
                SELECT 
                INE,
                SUM(COALESCE(MULHERES_FCI, 0))::INTEGER AS MULHERES_FCI,
                SUM(COALESCE(TOTAL_MULHERES_COM_FCI, 0))::INTEGER AS TOTAL_MULHERES_COM_FCI,
                SUM(COALESCE(MULHERES_FCI_ATUALIZADAS, 0))::INTEGER AS MULHERES_FCI_ATUALIZADAS
            FROM DIAGNOSTICO_MULHERES
            GROUP BY INE
            ORDER BY SUM(COALESCE(MULHERES_FCI_ATUALIZADAS, 0)) DESC;		
            END IF;	
        END;
        $$ LANGUAGE PLPGSQL;`
    },
    
    {
        name: 'CITOPATOLOGICO EM MULHERES DE 25 A 64 ANOS',
        definition: `CREATE OR REPLACE FUNCTION CITOPATOLOGICO(
            QUADRIMESTRE DATE,
            P_EQUIPE TEXT DEFAULT NULL
        )
        RETURNS TABLE (
            V_INE VARCHAR,
            EQUIPE_VINC VARCHAR,
            CITO_SOLICITADO INTEGER,
            CITO_AVALIADO INTEGER,
            TOTAL_CITOLOGIA INTEGER,
            TOTAL_MULHERES INTEGER,
            ESCORE FLOAT
        )
        AS $$
        BEGIN
            IF P_EQUIPE IS NULL THEN
                RETURN QUERY
                WITH CTE_EQUIPES AS (
                    SELECT NU_INE AS INE, NO_EQUIPE AS NOME_EQUIPE
                    FROM TB_EQUIPE
                    LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                    WHERE ST_ATIVO = 1 AND NU_MS IN ('70', '76')
                ),
                MULHERES_25_64_ANOS AS (
                    SELECT
                    TACV.NU_INE_VINC_EQUIPE AS INE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    ) AS TOTAL_MULHERES_COM_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '25 YEARS' AND INTERVAL '64 YEARS'
                    ) AS MULHERES_25_64,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '25 YEARS' AND INTERVAL '64 YEARS'
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTH'
                            AND QUADRIMESTRE
                    ) AS MULHERES_25_64_ATUALIZADAS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    --AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                ),
                EXAMES_SOLICITADOS AS (
                    SELECT TACV.NU_INE_VINC_EQUIPE, COUNT(CO_SEQ_FAT_CIDADAO_PEC) AS TOTAL_EXAMES_SOLICITADOS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    INNER JOIN (
                        SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                        FROM TB_FAT_CIDADAO_PEC
                        WHERE CO_CIDADAO IS NOT NULL
                    ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                    INNER JOIN (
                        SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                        WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                    ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                    INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                        EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) BETWEEN 25 AND 64
                    AND TDC.NU_CBO IN ('223505', '223565', '225130', '225142', '225170')
                    AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '36 MONTHS' AND QUADRIMESTRE
                    AND EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_SOLICITADOS), '|')) AS PROC
                        WHERE PROC IN ('0203010019', '0203010086')
                    )
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                ),
                EXAMES_AVALIADOS AS (
                    SELECT TACV.NU_INE_VINC_EQUIPE, COUNT(CO_SEQ_FAT_CIDADAO_PEC) AS TOTAL_EXAMES_AVALIADOS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    INNER JOIN (
                        SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                        FROM TB_FAT_CIDADAO_PEC
                        WHERE CO_CIDADAO IS NOT NULL
                    ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                    INNER JOIN (
                        SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                        WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                    ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                    INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                        EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) BETWEEN 25 AND 64
                    AND TDC.NU_CBO IN ('223505', '223565', '225130', '225142', '225170')
                    AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '36 MONTHS' AND QUADRIMESTRE
                    AND EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_AVALIADOS), '|')) AS PROC
                        WHERE PROC IN ('0203010019', '0203010086')
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_SOLICITADOS), '|')) AS PROC
                        WHERE PROC IN ('0203010019', '0203010086')
                    )
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                )
                SELECT
                NULL::VARCHAR AS V_INE,
                'TODAS AS EQUIPES'::VARCHAR AS EQUIPE_VINC,
                    SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0))::INTEGER,
                    SUM(COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0))::INTEGER,
                    SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0) + COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0))::INTEGER,
                    SUM(COALESCE(MULHER.MULHERES_25_64_ATUALIZADAS, 0))::INTEGER,
                    ROUND(
                        (SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0)::NUMERIC) + SUM(COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0)::NUMERIC)) * 0.2, 
                            --/NULLIF(SUM(COALESCE(MULHER.MULHERES_25_64_ATUALIZADAS, 0)), 0),
                            2)::FLOAT
                FROM CTE_EQUIPES EQUIPES
                LEFT JOIN MULHERES_25_64_ANOS MULHER ON MULHER.INE = EQUIPES.INE
                LEFT JOIN EXAMES_SOLICITADOS ES ON ES.NU_INE_VINC_EQUIPE = EQUIPES.INE
                LEFT JOIN EXAMES_AVALIADOS EA ON EA.NU_INE_VINC_EQUIPE = EQUIPES.INE;		
            ELSE
                RETURN QUERY
                    WITH CTE_EQUIPES AS (
                    SELECT NU_INE AS INE, NO_EQUIPE AS NOME_EQUIPE
                    FROM TB_EQUIPE
                    LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                    WHERE ST_ATIVO = 1 AND NU_MS IN ('70', '76')
                ),
                MULHERES_25_64_ANOS AS (
                SELECT
                    TACV.NU_INE_VINC_EQUIPE AS INE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    ) AS TOTAL_MULHERES_COM_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '25 YEARS' AND INTERVAL '64 YEARS'
                    ) AS MULHERES_25_64,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '25 YEARS' AND INTERVAL '64 YEARS'
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTH'
                            AND QUADRIMESTRE
                    ) AS MULHERES_25_64_ATUALIZADAS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                ),
                EXAMES_SOLICITADOS AS (
                    SELECT TACV.NU_INE_VINC_EQUIPE, COUNT(CO_SEQ_FAT_CIDADAO_PEC) AS TOTAL_EXAMES_SOLICITADOS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    INNER JOIN (
                        SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                        FROM TB_FAT_CIDADAO_PEC
                        WHERE CO_CIDADAO IS NOT NULL
                    ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                    INNER JOIN (
                        SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                        WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                    ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                    INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                        EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) BETWEEN 25 AND 64
                    AND TDC.NU_CBO IN ('223505', '223565', '225130', '225142', '225170')
                    AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '36 MONTHS' AND QUADRIMESTRE
                    AND EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_SOLICITADOS), '|')) AS PROC
                        WHERE PROC IN ('0203010019', '0203010086')
                    )
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                ),
                EXAMES_AVALIADOS AS (
                    SELECT TACV.NU_INE_VINC_EQUIPE, COUNT(CO_SEQ_FAT_CIDADAO_PEC) AS TOTAL_EXAMES_AVALIADOS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    INNER JOIN (
                        SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                        FROM TB_FAT_CIDADAO_PEC
                        WHERE CO_CIDADAO IS NOT NULL
                    ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                    INNER JOIN (
                        SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                        WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                    ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                    INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                        EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) BETWEEN 25 AND 64
                    AND TDC.NU_CBO IN ('223505', '223565', '225130', '225142', '225170')
                    AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '36 MONTHS' AND QUADRIMESTRE
                    AND EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_AVALIADOS), '|')) AS PROC
                        WHERE PROC IN ('0203010019', '0203010086')
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_SOLICITADOS), '|')) AS PROC
                        WHERE PROC IN ('0203010019', '0203010086')
                    )
                    AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE	
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                )
                SELECT
                    EQUIPES.INE,
                    EQUIPES.NOME_EQUIPE,
                    SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0))::INTEGER,
                    SUM(COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0))::INTEGER,
                    SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0) + COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0))::INTEGER,
                    SUM(COALESCE(MULHER.MULHERES_25_64_ATUALIZADAS, 0))::INTEGER,
                    ROUND(
                        (SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0)::NUMERIC) + SUM(COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0)::NUMERIC)) * 0.2, 
                        --	/NULLIF(SUM(COALESCE(MULHER.MULHERES_25_64_ATUALIZADAS, 0)), 0),
                        2
                    )::FLOAT
                FROM CTE_EQUIPES EQUIPES
                LEFT JOIN MULHERES_25_64_ANOS MULHER ON MULHER.INE = EQUIPES.INE
                LEFT JOIN EXAMES_SOLICITADOS ES ON ES.NU_INE_VINC_EQUIPE = EQUIPES.INE
                LEFT JOIN EXAMES_AVALIADOS EA ON EA.NU_INE_VINC_EQUIPE = EQUIPES.INE
                WHERE EQUIPES.INE = P_EQUIPE
                GROUP BY EQUIPES.INE, EQUIPES.NOME_EQUIPE, ES.TOTAL_EXAMES_SOLICITADOS, EA.TOTAL_EXAMES_AVALIADOS, MULHERES_25_64_ATUALIZADAS;
            END IF;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'VACINA HPV CRIANÇAS E ADOLESCENTES DE 9 A 14 ANOS',
        definition: `CREATE OR REPLACE FUNCTION VACINA_HPV(
            QUADRIMESTRE DATE,
            P_EQUIPE TEXT DEFAULT NULL)
        RETURNS TABLE(
            INE_VINC VARCHAR,
            EQUIPE_VINC VARCHAR,
            HPV4 INTEGER,
            HPV9 INTEGER,
            QTD_DOSES INTEGER,
            TOTAL_CRIANCA_ADOLES INTEGER,
            COBERTURA FLOAT)
        AS $$
        BEGIN
            IF P_EQUIPE IS NULL THEN
            RETURN QUERY
            WITH CTE_EQUIPES AS (
                    SELECT NU_INE AS INE, NO_EQUIPE AS NOME_EQUIPE
                    FROM TB_EQUIPE
                    LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                    WHERE ST_ATIVO = 1 AND NU_MS IN ('70', '76')
            ),
            CRIANCA_ADOLESCENTE AS (
                SELECT
                    TACV.NU_INE_VINC_EQUIPE AS INE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    ) AS TOTAL_MULHERES_COM_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '9 YEARS' AND INTERVAL '14 YEARS'
                    ) AS CRIANCA_ADOLESCENTE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '9 YEARS' AND INTERVAL '14 YEARS'
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTH'
                            AND QUADRIMESTRE
                    ) AS CRIANCA_ADOLESCENTE_ATUALIZADAS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    --AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
            ),
            IMUNO_1 AS (
                SELECT 
                    TACV.NU_INE_VINC_EQUIPE, 
                    COUNT(*) AS TOTAL_DOSES
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                INNER JOIN (SELECT TFCP.CO_CIDADAO, TFCP.CO_SEQ_FAT_CIDADAO_PEC FROM TB_FAT_CIDADAO_PEC TFCP
                WHERE TFCP.CO_CIDADAO IS NOT NULL) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                INNER JOIN (SELECT * FROM TB_FAT_VACINACAO TFV 
                WHERE TFV.CO_FAT_CIDADAO_PEC IS NOT NULL) IMUNO ON CIDADAO.CO_SEQ_FAT_CIDADAO_PEC = IMUNO.CO_FAT_CIDADAO_PEC 
                WHERE
                    TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND EXTRACT(YEAR FROM TO_DATE(IMUNO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) - EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) 
                        BETWEEN 9 AND 14
                    AND TO_DATE(IMUNO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') <= QUADRIMESTRE
                AND EXISTS (
                    SELECT 1
                FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM IMUNO.DS_FILTRO_IMUNOBIOLOGICO), '|')) AS IMUNO
                WHERE IMUNO IN ('67'))
                GROUP BY
                    TACV.NU_INE_VINC_EQUIPE
            ),
            IMUNO_2 AS (
                SELECT 
                    TACV.NU_INE_VINC_EQUIPE, 
                    COUNT(*) AS TOTAL_DOSES
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                INNER JOIN (SELECT TFCP.CO_CIDADAO, TFCP.CO_SEQ_FAT_CIDADAO_PEC FROM TB_FAT_CIDADAO_PEC TFCP
                WHERE TFCP.CO_CIDADAO IS NOT NULL) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                INNER JOIN (SELECT * FROM TB_FAT_VACINACAO TFV 
                WHERE TFV.CO_FAT_CIDADAO_PEC IS NOT NULL) IMUNO ON CIDADAO.CO_SEQ_FAT_CIDADAO_PEC = IMUNO.CO_FAT_CIDADAO_PEC 
                WHERE
                    TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND EXTRACT(YEAR FROM TO_DATE(IMUNO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) - EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) 
                        BETWEEN 9 AND 14
                    AND TO_DATE(IMUNO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') <= QUADRIMESTRE
                AND EXISTS (
                    SELECT 1
                FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM IMUNO.DS_FILTRO_IMUNOBIOLOGICO), '|')) AS IMUNO
                WHERE IMUNO IN ('93'))
                GROUP BY
                    TACV.NU_INE_VINC_EQUIPE
            )
            SELECT 
                NULL::VARCHAR AS V_INE,
                'TODAS AS EQUIPES'::VARCHAR AS V_NOME_EQUIPE,
                SUM(COALESCE(I1.TOTAL_DOSES, 0))::INTEGER AS HPV4,
                SUM(COALESCE(I2.TOTAL_DOSES, 0))::INTEGER AS HPV9,
                (SUM(COALESCE(I1.TOTAL_DOSES, 0)) + SUM(COALESCE(I2.TOTAL_DOSES, 0)))::INTEGER AS QTD_DOSES,		
                SUM(COALESCE(CA.CRIANCA_ADOLESCENTE_ATUALIZADAS, 0))::INTEGER AS TOTAL_CRIANCA_ADOLESCENTE,	
                ROUND((SUM(COALESCE(I1.TOTAL_DOSES, 0)) + SUM(COALESCE(I2.TOTAL_DOSES, 0)) ::NUMERIC) * 0.3, 
                    --/ NULLIF(SUM(COALESCE(CA.CRIANCA_ADOLESCENTE_ATUALIZADAS, 0)),0),
                    2)::FLOAT AS COBERTURA
            FROM CTE_EQUIPES EQUIPE
            LEFT JOIN CRIANCA_ADOLESCENTE CA ON CA.INE = EQUIPE.INE
            LEFT JOIN IMUNO_1 I1 ON I1.NU_INE_VINC_EQUIPE = EQUIPE.INE
            LEFT JOIN IMUNO_2 I2 ON I2.NU_INE_VINC_EQUIPE = EQUIPE.INE;
            --GROUP BY
            --EQUIPE.INE, EQUIPE.NOME_EQUIPE, I1.TOTAL_DOSES, I2.TOTAL_DOSES, CA.TOTAL_CRIANCA_ADOLESCENTE;
            ELSE
            RETURN QUERY
            WITH CTE_EQUIPES AS (
                    SELECT NU_INE AS INE, NO_EQUIPE AS NOME_EQUIPE
                    FROM TB_EQUIPE
                    LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                    WHERE ST_ATIVO = 1 AND NU_MS IN ('70', '76')
            ),
            CRIANCA_ADOLESCENTE AS (
                SELECT
                    TACV.NU_INE_VINC_EQUIPE AS INE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    ) AS TOTAL_MULHERES_COM_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '9 YEARS' AND INTERVAL '14 YEARS'
                    ) AS CRIANCA_ADOLESCENTE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '9 YEARS' AND INTERVAL '14 YEARS'
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTH'
                            AND QUADRIMESTRE
                    ) AS CRIANCA_ADOLESCENTE_ATUALIZADAS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
            ),
            IMUNO_1 AS (
                SELECT 
                    TACV.NU_INE_VINC_EQUIPE, 
                    COUNT(*) AS TOTAL_DOSES
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                INNER JOIN (SELECT TFCP.CO_CIDADAO, TFCP.CO_SEQ_FAT_CIDADAO_PEC FROM TB_FAT_CIDADAO_PEC TFCP
                WHERE TFCP.CO_CIDADAO IS NOT NULL) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                INNER JOIN (SELECT * FROM TB_FAT_VACINACAO TFV 
                WHERE TFV.CO_FAT_CIDADAO_PEC IS NOT NULL) IMUNO ON CIDADAO.CO_SEQ_FAT_CIDADAO_PEC = IMUNO.CO_FAT_CIDADAO_PEC 
                WHERE
                    TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND EXTRACT(YEAR FROM TO_DATE(IMUNO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) - EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) 
                        BETWEEN 9 AND 14
                    AND TO_DATE(IMUNO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') <= QUADRIMESTRE
                AND EXISTS (
                    SELECT 1
                FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM IMUNO.DS_FILTRO_IMUNOBIOLOGICO), '|')) AS IMUNO
                WHERE IMUNO IN ('67'))
                GROUP BY
                    TACV.NU_INE_VINC_EQUIPE
            ),
            IMUNO_2 AS (
                SELECT 
                    TACV.NU_INE_VINC_EQUIPE, 
                    COUNT(*) AS TOTAL_DOSES
                FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                INNER JOIN (SELECT TFCP.CO_CIDADAO, TFCP.CO_SEQ_FAT_CIDADAO_PEC FROM TB_FAT_CIDADAO_PEC TFCP
                WHERE TFCP.CO_CIDADAO IS NOT NULL) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                INNER JOIN (SELECT * FROM TB_FAT_VACINACAO TFV 
                WHERE TFV.CO_FAT_CIDADAO_PEC IS NOT NULL) IMUNO ON CIDADAO.CO_SEQ_FAT_CIDADAO_PEC = IMUNO.CO_FAT_CIDADAO_PEC 
                WHERE
                    TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND EXTRACT(YEAR FROM TO_DATE(IMUNO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) - EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) 
                        BETWEEN 9 AND 14
                    AND TO_DATE(IMUNO.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') <= QUADRIMESTRE
                AND EXISTS (
                    SELECT 1
                FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM IMUNO.DS_FILTRO_IMUNOBIOLOGICO), '|')) AS IMUNO
                WHERE IMUNO IN ('93'))
                GROUP BY
                    TACV.NU_INE_VINC_EQUIPE
            )
            SELECT 
                EQUIPE.INE,
                EQUIPE.NOME_EQUIPE,
                COALESCE(I1.TOTAL_DOSES, 0)::INTEGER AS HPV4,
                COALESCE(I2.TOTAL_DOSES, 0)::INTEGER AS HPV9,
                (COALESCE(I1.TOTAL_DOSES, 0) + COALESCE(I2.TOTAL_DOSES, 0))::INTEGER AS QTD_DOSES,
                SUM(COALESCE(CA.CRIANCA_ADOLESCENTE_ATUALIZADAS, 0))::INTEGER AS TOTAL_CRIANCA_ADOLESCENTE,	
                ROUND((COALESCE(I1.TOTAL_DOSES, 0) + COALESCE(I2.TOTAL_DOSES, 0)) ::NUMERIC * 0.3, 
                    --/ NULLIF(COALESCE(CA.CRIANCA_ADOLESCENTE_ATUALIZADAS, 0),0), 
                    2)::FLOAT AS COBERTURA
            FROM CTE_EQUIPES EQUIPE
            LEFT JOIN CRIANCA_ADOLESCENTE CA ON CA.INE = EQUIPE.INE
            LEFT JOIN IMUNO_1 I1 ON I1.NU_INE_VINC_EQUIPE = EQUIPE.INE
            LEFT JOIN IMUNO_2 I2 ON I2.NU_INE_VINC_EQUIPE = EQUIPE.INE
            WHERE EQUIPE.INE = P_EQUIPE
            GROUP BY
                EQUIPE.INE,	EQUIPE.NOME_EQUIPE, I1.TOTAL_DOSES, I2.TOTAL_DOSES, CRIANCA_ADOLESCENTE_ATUALIZADAS;	
            END IF;	
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'MAMOGRAFIA EME MULHERES DE 50 A 69 ANOS',
        definition: `CREATE OR REPLACE FUNCTION MAMOGRAFIA(
            QUADRIMESTRE DATE,
            P_EQUIPE TEXT DEFAULT NULL
        )
        RETURNS TABLE (
            V_INE VARCHAR,
            EQUIPE_VINC VARCHAR,
            MAMO_SOLICITADO INTEGER,
            MAMO_AVALIADO INTEGER,
            TOTAL_MAMOGRAFIA INTEGER,
            TOTAL_MULHERES INTEGER,
            ESCORE FLOAT
        )
        AS $$
        BEGIN
            IF P_EQUIPE IS NULL THEN
                RETURN QUERY
                WITH CTE_EQUIPES AS (
                    SELECT NU_INE AS INE, NO_EQUIPE AS NOME_EQUIPE
                    FROM TB_EQUIPE
                    LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                    WHERE ST_ATIVO = 1 AND NU_MS IN ('70', '76')
                ),
                MULHERES_50_69_ANOS AS (
                    SELECT
                    TACV.NU_INE_VINC_EQUIPE AS INE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    ) AS TOTAL_MULHERES_COM_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(TO_DATE('20250831', 'YYYYMMDD'), TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '50 YEARS' AND INTERVAL '69 YEARS'
                    ) AS MULHERES_50_69,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '50 YEARS' AND INTERVAL '69 YEARS'
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTH'
                            AND QUADRIMESTRE
                    ) AS MULHERES_50_69_ATUALIZADAS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    --AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                ),
                EXAMES_SOLICITADOS AS (
                    SELECT TACV.NU_INE_VINC_EQUIPE, COUNT(CO_SEQ_FAT_CIDADAO_PEC) AS TOTAL_EXAMES_SOLICITADOS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    INNER JOIN (
                        SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                        FROM TB_FAT_CIDADAO_PEC
                        WHERE CO_CIDADAO IS NOT NULL
                    ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                    INNER JOIN (
                        SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                        WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                    ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                    INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                        EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) BETWEEN 50 AND 69
                    AND TDC.NU_CBO IN ('223505', '223565', '225130', '225142', '225170')
                    AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '24 MONTHS' AND QUADRIMESTRE
                    AND EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_SOLICITADOS), '|')) AS PROC
                        WHERE PROC IN ('0204030188')
                    )
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                ),
                EXAMES_AVALIADOS AS (
                    SELECT TACV.NU_INE_VINC_EQUIPE, COUNT(CO_SEQ_FAT_CIDADAO_PEC) AS TOTAL_EXAMES_AVALIADOS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    INNER JOIN (
                        SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                        FROM TB_FAT_CIDADAO_PEC
                        WHERE CO_CIDADAO IS NOT NULL
                    ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                    INNER JOIN (
                        SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                        WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                    ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                    INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                        EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) BETWEEN 50 AND 69
                    AND TDC.NU_CBO IN ('223505', '223565', '225130', '225142', '225170')
                    AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '24 MONTHS' AND QUADRIMESTRE
                    AND EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_AVALIADOS), '|')) AS PROC
                        WHERE PROC IN ('0204030188')
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_SOLICITADOS), '|')) AS PROC
                        WHERE PROC IN ('0204030188')
                    )
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                )
                SELECT
                    NULL::VARCHAR AS V_INE,
                'TODAS AS EQUIPES'::VARCHAR AS EQUIPE_VINC,
                    SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0))::INTEGER,
                    SUM(COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0))::INTEGER,
                    SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0) + COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0))::INTEGER,
                    SUM(COALESCE(MULHER.MULHERES_50_69_ATUALIZADAS, 0))::INTEGER,
                    ROUND(
                        (SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0)::NUMERIC) + SUM(COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0)::NUMERIC)) * 0.2,
                            ---/NULLIF(SUM(COALESCE(MULHER.MULHERES_50_69_ATUALIZADAS, 0)), 0),
                        2)::FLOAT
                FROM CTE_EQUIPES EQUIPES
                LEFT JOIN MULHERES_50_69_ANOS MULHER ON MULHER.INE= EQUIPES.INE
                LEFT JOIN EXAMES_SOLICITADOS ES ON ES.NU_INE_VINC_EQUIPE = EQUIPES.INE
                LEFT JOIN EXAMES_AVALIADOS EA ON EA.NU_INE_VINC_EQUIPE = EQUIPES.INE;		
            ELSE
                RETURN QUERY
                    WITH CTE_EQUIPES AS (
                    SELECT NU_INE AS INE, NO_EQUIPE AS NOME_EQUIPE
                    FROM TB_EQUIPE
                    LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                    WHERE ST_ATIVO = 1 AND NU_MS IN ('70', '76')
                ),
                MULHERES_50_69_ANOS AS (
                    SELECT
                    TACV.NU_INE_VINC_EQUIPE AS INE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    ) AS TOTAL_MULHERES_COM_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '50 YEARS' AND INTERVAL '69 YEARS'
                    ) AS MULHERES_50_69,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '50 YEARS' AND INTERVAL '69 YEARS'
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTH'
                            AND QUADRIMESTRE
                    ) AS MULHERES_50_69_ATUALIZADAS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                ),
                EXAMES_SOLICITADOS AS (
                    SELECT TACV.NU_INE_VINC_EQUIPE, COUNT(CO_SEQ_FAT_CIDADAO_PEC) AS TOTAL_EXAMES_SOLICITADOS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    INNER JOIN (
                        SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                        FROM TB_FAT_CIDADAO_PEC
                        WHERE CO_CIDADAO IS NOT NULL
                    ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                    INNER JOIN (
                        SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                        WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                    ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                    INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                        EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) BETWEEN 50 AND 69
                    AND TDC.NU_CBO IN ('223505', '223565', '225130', '225142', '225170')
                    AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '24 MONTHS' AND QUADRIMESTRE
                    AND EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_SOLICITADOS), '|')) AS PROC
                        WHERE PROC IN ('0204030188')
                    )
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                ),
                EXAMES_AVALIADOS AS (
                    SELECT TACV.NU_INE_VINC_EQUIPE, COUNT(CO_SEQ_FAT_CIDADAO_PEC) AS TOTAL_EXAMES_AVALIADOS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    INNER JOIN (
                        SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                        FROM TB_FAT_CIDADAO_PEC
                        WHERE CO_CIDADAO IS NOT NULL
                    ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                    INNER JOIN (
                        SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                        WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                    ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                    INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                        EXTRACT(YEAR FROM TACV.DT_NASCIMENTO_CIDADAO) BETWEEN 50 AND 69
                    AND TDC.NU_CBO IN ('223505', '223565', '225130', '225142', '225170')
                    AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '24 MONTHS' AND QUADRIMESTRE
                    AND EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_AVALIADOS), '|')) AS PROC
                        WHERE PROC IN ('0204030188')
                    )
                    AND NOT EXISTS (
                        SELECT 1
                        FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_PROCED_SOLICITADOS), '|')) AS PROC
                        WHERE PROC IN ('0204030188')
                    )
                    AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE	
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                )
                SELECT
                    EQUIPES.INE,
                    EQUIPES.NOME_EQUIPE,
                    SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0))::INTEGER,
                    SUM(COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0))::INTEGER,
                    SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0) + COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0))::INTEGER,
                    SUM(COALESCE(MULHER.MULHERES_50_69_ATUALIZADAS, 0))::INTEGER,
                    ROUND(
                        (SUM(COALESCE(ES.TOTAL_EXAMES_SOLICITADOS, 0)::NUMERIC) + SUM(COALESCE(EA.TOTAL_EXAMES_AVALIADOS, 0)::NUMERIC)) * 0.2,
                        --/NULLIF(SUM(COALESCE(MULHER.MULHERES_50_69_ATUALIZADAS, 0)), 0),
                        2)::FLOAT
                FROM CTE_EQUIPES EQUIPES
                LEFT JOIN MULHERES_50_69_ANOS MULHER ON MULHER.INE = EQUIPES.INE
                LEFT JOIN EXAMES_SOLICITADOS ES ON ES.NU_INE_VINC_EQUIPE = EQUIPES.INE
                LEFT JOIN EXAMES_AVALIADOS EA ON EA.NU_INE_VINC_EQUIPE = EQUIPES.INE
                WHERE EQUIPES.INE = P_EQUIPE
                GROUP BY EQUIPES.INE, EQUIPES.NOME_EQUIPE, ES.TOTAL_EXAMES_SOLICITADOS, EA.TOTAL_EXAMES_AVALIADOS;
            END IF;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'SAUDE SEXUAL E REPRODUTIVA MULHERES DE 14 A 69 ANOS',
        definition: `CREATE OR REPLACE FUNCTION SAUDE_SEXUAL(
            QUADRIMESTRE DATE,
            P_EQUIPE TEXT DEFAULT NULL)
        RETURNS TABLE(
            V_INE VARCHAR,
            EQUIPE_VINC VARCHAR,
            ATEND_ENFER INTEGER,
            ATEND_MED INTEGER,
            TOTAL_ATENDIM INTEGER,
            MULHERES_TOTAL INTEGER,
            ESCORE_C FLOAT)
        AS $$
        BEGIN
            IF P_EQUIPE IS NULL THEN
            RETURN QUERY
                WITH CTE_EQUIPES AS (
                        SELECT NU_INE AS INE, NO_EQUIPE AS NOME_EQUIPE
                        FROM TB_EQUIPE
                        LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                        WHERE ST_ATIVO = 1 AND NU_MS IN ('70', '76')
                    ),
                    MULHERES_14_69 AS (
                    SELECT
                    TACV.NU_INE_VINC_EQUIPE AS INE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    ) AS TOTAL_MULHERES_COM_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '14 YEARS' AND INTERVAL '69 YEARS'
                    ) AS MULHERES_14_69,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '14 YEARS' AND INTERVAL '69 YEARS'
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTH'
                            AND QUADRIMESTRE
                    ) AS MULHERES_14_69_ATUALIZADAS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    --AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                    GROUP BY TACV.NU_INE_VINC_EQUIPE
                        ),
                    ATENDIMENTOS_ENFERMEIRO AS (
                        SELECT 
                            TACV.NU_INE_VINC_EQUIPE,					
                            COUNT(*) AS QTD_ATD
                        FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                        INNER JOIN (
                                    SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                                    FROM TB_FAT_CIDADAO_PEC
                                    WHERE CO_CIDADAO IS NOT NULL
                                    ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                        INNER JOIN (
                                    SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                                    WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                                    ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                        INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                        INNER JOIN TB_DIM_FAIXA_ETARIA TDFE ON TDFE.CO_SEQ_DIM_FAIXA_ETARIA = FAI.CO_DIM_FAIXA_ETARIA
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                            AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                                    EXTRACT(YEAR FROM FAI.DT_NASCIMENTO) BETWEEN 14 AND 69
                            AND TDC.NU_CBO IN ('223505', '223565')
                            AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTHS'
                                AND QUADRIMESTRE 	
                            AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '12 MONTHS'
                                AND QUADRIMESTRE 
                            AND EXISTS (
                                    SELECT 1
                                    FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_CIAPS), '|')) AS PROC
                                    WHERE PROC IN ('ABP003', 'P07', 'P08', 'P09', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 
                                                    'X01', 'X02', 'X03', 'X04', 'X05', 'X06', 'X07', 'X08', 'X09', 'X10',
                                                    'X11', 'X12', 'X13', 'X18', 'X20', 'X21', 'X22', 'X24', 'Y01', 'Y02',
                                                    'Y04', 'Y05', 'Y06', 'Y07', 'Y08', 'Y10', 'Y13', 'Y14', 'Y16', 'Y24')							
                                    )
                            GROUP BY TACV.NU_INE_VINC_EQUIPE
                        ),
                        ATENDIMENTOS_MEDICO AS (			
                        SELECT 
                            TACV.NU_INE_VINC_EQUIPE,					
                            COUNT(*) AS QTD_ATD
                        FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                        INNER JOIN (
                                    SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                                    FROM TB_FAT_CIDADAO_PEC
                                    WHERE CO_CIDADAO IS NOT NULL
                                    ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                        INNER JOIN (
                                    SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                                    WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                                    ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                        INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                        INNER JOIN TB_DIM_FAIXA_ETARIA TDFE ON TDFE.CO_SEQ_DIM_FAIXA_ETARIA = FAI.CO_DIM_FAIXA_ETARIA
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                            AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                                    EXTRACT(YEAR FROM FAI.DT_NASCIMENTO) BETWEEN 14 AND 69
                            AND TDC.NU_CBO IN ('225130', '225142', '225170')
                            AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTHS'
                                AND QUADRIMESTRE 	
                            AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '12 MONTHS'
                                AND QUADRIMESTRE 
                            AND EXISTS (
                                    SELECT 1
                                    FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_CIAPS), '|')) AS PROC
                                    WHERE PROC IN ('ABP003', 'P07', 'P08', 'P09', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 
                                                    'X01', 'X02', 'X03', 'X04', 'X05', 'X06', 'X07', 'X08', 'X09', 'X10',
                                                    'X11', 'X12', 'X13', 'X18', 'X20', 'X21', 'X22', 'X24', 'Y01', 'Y02',
                                                    'Y04', 'Y05', 'Y06', 'Y07', 'Y08', 'Y10', 'Y13', 'Y14', 'Y16', 'Y24')							
                                    )
                            OR EXISTS (
                                    SELECT 1
                                    FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_CIDS), '|')) AS PROC
                                    WHERE PROC IN ('Z70', 'Z700', 'Z701', 'Z702', 'Z703', 'Z708', 'Z709')							
                                    )
                        GROUP BY TACV.NU_INE_VINC_EQUIPE)					
                        SELECT 
                            NULL::VARCHAR AS V_INE,
                            'TODAS AS EQUIPES'::VARCHAR AS V_NOME_EQUIPE,
                            SUM(COALESCE(ATD_ENF.QTD_ATD, 0))::INTEGER,
                            SUM(COALESCE(ATD_MED.QTD_ATD::INTEGER, 0))::INTEGER,
                            SUM(COALESCE(ATD_ENF.QTD_ATD::INTEGER, 0) + COALESCE(ATD_MED.QTD_ATD::INTEGER, 0))::INTEGER,
                            SUM(COALESCE(MULHERES_14_69_ATUALIZADAS, 0))::INTEGER,				
                            ROUND(
                                (SUM(COALESCE(ATD_ENF.QTD_ATD, 0)::NUMERIC) + SUM(COALESCE(ATD_ENF.QTD_ATD, 0)::NUMERIC)) * 0.3,
                                -- / NULLIF(SUM(COALESCE(MULHER.MULHERES_14_69, 0)), 0),
                                2)::FLOAT
                        FROM CTE_EQUIPES EQUIPE
                        LEFT JOIN MULHERES_14_69 MULHER ON MULHER.INE = EQUIPE.INE
                        LEFT JOIN ATENDIMENTOS_ENFERMEIRO ATD_ENF ON ATD_ENF.NU_INE_VINC_EQUIPE = EQUIPE.INE
                        LEFT JOIN ATENDIMENTOS_MEDICO ATD_MED ON ATD_MED.NU_INE_VINC_EQUIPE = EQUIPE.INE;		
            ELSE
            RETURN QUERY
            WITH CTE_EQUIPES AS (
                    SELECT NU_INE AS INE, NO_EQUIPE AS NOME_EQUIPE
                    FROM TB_EQUIPE
                    LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                    WHERE ST_ATIVO = 1 AND NU_MS IN ('70', '76')
                ),
                MULHERES_14_69 AS (
                    SELECT
                    TACV.NU_INE_VINC_EQUIPE AS INE,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    ) AS TOTAL_MULHERES_COM_FCI,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '14 YEARS' AND INTERVAL '69 YEARS'
                    ) AS MULHERES_14_69,
                    COUNT(*) FILTER (
                        WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND TACV.ST_POSSUI_FCI = 1
                        AND AGE(QUADRIMESTRE, TACV.DT_NASCIMENTO_CIDADAO) BETWEEN INTERVAL '14 YEARS' AND INTERVAL '69 YEARS'
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTH'
                            AND QUADRIMESTRE
                    ) AS MULHERES_14_69_ATUALIZADAS
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                    AND TACV.ST_POSSUI_FCI = 1
                    AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                    GROUP BY TACV.NU_INE_VINC_EQUIPE),
                    ATENDIMENTOS_ENFERMEIRO AS (
                    SELECT 
                        TACV.NU_INE_VINC_EQUIPE,
                        COUNT(*) AS QTD_ATD
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    INNER JOIN (
                                SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                                FROM TB_FAT_CIDADAO_PEC
                                WHERE CO_CIDADAO IS NOT NULL
                                ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                    INNER JOIN (
                                SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                                WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                                ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                    INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                    INNER JOIN TB_DIM_FAIXA_ETARIA TDFE ON TDFE.CO_SEQ_DIM_FAIXA_ETARIA = FAI.CO_DIM_FAIXA_ETARIA
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                                EXTRACT(YEAR FROM FAI.DT_NASCIMENTO) BETWEEN 14 AND 69
                        AND TDC.NU_CBO IN ('223505', '223565')
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTHS'
                            AND QUADRIMESTRE 	
                        AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '12 MONTHS'
                            AND QUADRIMESTRE 
                        AND EXISTS (
                                SELECT 1
                                FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_CIAPS), '|')) AS PROC
                                WHERE PROC IN ('ABP003', 'P07', 'P08', 'P09', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 
                                                'X01', 'X02', 'X03', 'X04', 'X05', 'X06', 'X07', 'X08', 'X09', 'X10',
                                                'X11', 'X12', 'X13', 'X18', 'X20', 'X21', 'X22', 'X24', 'Y01', 'Y02',
                                                'Y04', 'Y05', 'Y06', 'Y07', 'Y08', 'Y10', 'Y13', 'Y14', 'Y16', 'Y24')							
                                )
                        AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                        GROUP BY TACV.NU_INE_VINC_EQUIPE),
                    ATENDIMENTOS_MEDICO AS (			
                    SELECT 
                        TACV.NU_INE_VINC_EQUIPE,
                        COUNT(*) AS QTD_ATD
                    FROM TB_ACOMP_CIDADAOS_VINCULADOS TACV
                    INNER JOIN (
                                SELECT CO_CIDADAO, CO_SEQ_FAT_CIDADAO_PEC
                                FROM TB_FAT_CIDADAO_PEC
                                WHERE CO_CIDADAO IS NOT NULL
                                ) CIDADAO ON CIDADAO.CO_CIDADAO = TACV.CO_CIDADAO
                    INNER JOIN (
                                SELECT * FROM TB_FAT_ATENDIMENTO_INDIVIDUAL
                                WHERE CO_FAT_CIDADAO_PEC IS NOT NULL
                                ) FAI ON FAI.CO_FAT_CIDADAO_PEC = CIDADAO.CO_SEQ_FAT_CIDADAO_PEC
                    INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = FAI.CO_DIM_CBO_1
                    INNER JOIN TB_DIM_FAIXA_ETARIA TDFE ON TDFE.CO_SEQ_DIM_FAIXA_ETARIA = FAI.CO_DIM_FAIXA_ETARIA
                    WHERE TACV.NO_SEXO_CIDADAO = 'FEMININO'
                        AND EXTRACT(YEAR FROM TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) -
                                EXTRACT(YEAR FROM FAI.DT_NASCIMENTO) BETWEEN 14 AND 69
                        AND TDC.NU_CBO IN ('225130', '225142', '225170')
                        AND TACV.DT_ULTIMA_ATUALIZACAO_CIDADAO BETWEEN QUADRIMESTRE - INTERVAL '24 MONTHS'
                            AND QUADRIMESTRE 	
                        AND TO_DATE(FAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD') BETWEEN QUADRIMESTRE - INTERVAL '12 MONTHS'
                            AND QUADRIMESTRE 
                        AND EXISTS (
                                SELECT 1
                                FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_CIAPS), '|')) AS PROC
                                WHERE PROC IN ('ABP003', 'P07', 'P08', 'P09', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 
                                                'X01', 'X02', 'X03', 'X04', 'X05', 'X06', 'X07', 'X08', 'X09', 'X10',
                                                'X11', 'X12', 'X13', 'X18', 'X20', 'X21', 'X22', 'X24', 'Y01', 'Y02',
                                                'Y04', 'Y05', 'Y06', 'Y07', 'Y08', 'Y10', 'Y13', 'Y14', 'Y16', 'Y24')							
                                )
                        OR EXISTS (
                                SELECT 1
                                FROM UNNEST(STRING_TO_ARRAY(TRIM(BOTH '|' FROM FAI.DS_FILTRO_CIDS), '|')) AS PROC
                                WHERE PROC IN ('Z70', 'Z700', 'Z701', 'Z702', 'Z703', 'Z708', 'Z709')							
                                )
                        AND TACV.NU_INE_VINC_EQUIPE = P_EQUIPE
                        GROUP BY TACV.NU_INE_VINC_EQUIPE	
                    )			
                    SELECT 
                        EQUIPE.INE,
                        EQUIPE.NOME_EQUIPE,
                        COALESCE(ATD_ENF.QTD_ATD, 0)::INTEGER,
                        COALESCE(ATD_MED.QTD_ATD, 0)::INTEGER,
                        SUM(COALESCE(ATD_ENF.QTD_ATD, 0) + COALESCE(ATD_MED.QTD_ATD, 0))::INTEGER,
                        MULHERES_14_69_ATUALIZADAS::INTEGER,				
                        ROUND(
                        (SUM(COALESCE(ATD_ENF.QTD_ATD, 0)::NUMERIC) + SUM(COALESCE(ATD_ENF.QTD_ATD, 0)::NUMERIC)) * 0.3,
                            --/ NULLIF(SUM(COALESCE(MULHER.MULHERES_14_69, 0)), 0), 
                            2)::FLOAT
                    FROM CTE_EQUIPES EQUIPE
                    LEFT JOIN MULHERES_14_69 MULHER ON MULHER.INE = EQUIPE.INE
                    LEFT JOIN ATENDIMENTOS_ENFERMEIRO ATD_ENF ON ATD_ENF.NU_INE_VINC_EQUIPE = EQUIPE.INE
                    LEFT JOIN ATENDIMENTOS_MEDICO ATD_MED ON ATD_MED.NU_INE_VINC_EQUIPE = EQUIPE.INE	
                    WHERE EQUIPE.INE = P_EQUIPE
                    GROUP BY
                        EQUIPE.INE,	EQUIPE.NOME_EQUIPE,	ATD_ENF.QTD_ATD, ATD_MED.QTD_ATD, MULHERES_14_69_ATUALIZADAS;
            END IF;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

     /*--------------------------------------------------------*/ 

    /*-----------------EMULTI --------------------------------*/ 
     
    {
        name: 'Atendimento Diário eMulti',
        definition: `CREATE OR REPLACE FUNCTION REGISTRO_DIARIO_EMULTI(
            P_EQUIPE VARCHAR DEFAULT NULL,
            P_MES INTEGER DEFAULT NULL,
            P_ANO INTEGER DEFAULT NULL)
        RETURNS TABLE(
            OCUPACAO VARCHAR, 
            PROFISSIONAL VARCHAR, 
            _1 BIGINT, _2 BIGINT, _3 BIGINT, _4 BIGINT, _5 BIGINT, _6 BIGINT, _7 BIGINT, _8 BIGINT, _9 BIGINT,
            _10 BIGINT, _11 BIGINT, _12 BIGINT, _13 BIGINT, _14 BIGINT, _15 BIGINT, _16 BIGINT, _17 BIGINT, _18 BIGINT, 
            _19 BIGINT, _20 BIGINT, _21 BIGINT, _22 BIGINT, _23 BIGINT, _24 BIGINT, _25 BIGINT, _26 BIGINT, _27 BIGINT, _28 BIGINT,
            _29 BIGINT, _30 BIGINT, _31 BIGINT, TOTAL BIGINT)
        LANGUAGE PLPGSQL
        AS $$
        DECLARE
            V_MES INTEGER;
            V_ANO INTEGER;
            V_DIAS_NO_MES INTEGER;
        BEGIN
            -- SE OS PARÂMETROS DE MÊS E ANO FOREM NULOS, CALCULAMOS O MÊS E ANO DO MÊS PASSADO
            IF P_MES IS NULL OR P_ANO IS NULL THEN
                SELECT EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE)
                INTO V_MES, V_ANO;
            ELSE
                V_MES := P_MES;
                V_ANO := P_ANO;
            END IF;

            -- CALCULA A QUANTIDADE DE DIAS NO MÊS ESCOLHIDO
            SELECT EXTRACT(DAY FROM (DATE_TRUNC('MONTH', TO_DATE(V_ANO || '-' || V_MES || '-01', 'YYYY-MM-DD') + INTERVAL '1 MONTH') - INTERVAL '1 DAY'))
            INTO V_DIAS_NO_MES;
            RETURN QUERY
            SELECT DIAS.OCUPACAO, DIAS.NO_PROFISSIONAL,
                COUNT(*) FILTER (WHERE DIA = 1) AS "_1",
                COUNT(*) FILTER (WHERE DIA = 2) AS "_2",
                COUNT(*) FILTER (WHERE DIA = 3) AS "_3",
                COUNT(*) FILTER (WHERE DIA = 4) AS "_4",
                COUNT(*) FILTER (WHERE DIA = 5) AS "_5",
                COUNT(*) FILTER (WHERE DIA = 6) AS "_6",
                COUNT(*) FILTER (WHERE DIA = 7) AS "_7",
                COUNT(*) FILTER (WHERE DIA = 8) AS "_8",
                COUNT(*) FILTER (WHERE DIA = 9) AS "_9",
                COUNT(*) FILTER (WHERE DIA = 10) AS "_10",
                COUNT(*) FILTER (WHERE DIA = 11) AS "_11",
                COUNT(*) FILTER (WHERE DIA = 12) AS "_12",
                COUNT(*) FILTER (WHERE DIA = 13) AS "_13",
                COUNT(*) FILTER (WHERE DIA = 14) AS "_14",
                COUNT(*) FILTER (WHERE DIA = 15) AS "_15",
                COUNT(*) FILTER (WHERE DIA = 16) AS "_16",
                COUNT(*) FILTER (WHERE DIA = 17) AS "_17",
                COUNT(*) FILTER (WHERE DIA = 18) AS "_18",
                COUNT(*) FILTER (WHERE DIA = 19) AS "_19",
                COUNT(*) FILTER (WHERE DIA = 20) AS "_20",
                COUNT(*) FILTER (WHERE DIA = 21) AS "_21",
                COUNT(*) FILTER (WHERE DIA = 22) AS "_22",
                COUNT(*) FILTER (WHERE DIA = 23) AS "_23",
                COUNT(*) FILTER (WHERE DIA = 24) AS "_24",
                COUNT(*) FILTER (WHERE DIA = 25) AS "_25",
                COUNT(*) FILTER (WHERE DIA = 26) AS "_26",
                COUNT(*) FILTER (WHERE DIA = 27) AS "_27",
                COUNT(*) FILTER (WHERE DIA = 28) AS "_28",
                CASE WHEN V_DIAS_NO_MES >= 29 THEN COUNT(*) FILTER (WHERE DIA = 29) ELSE NULL END AS "_29",
                CASE WHEN V_DIAS_NO_MES >= 30 THEN COUNT(*) FILTER (WHERE DIA = 30) ELSE NULL END AS "_30",
                CASE WHEN V_DIAS_NO_MES = 31 THEN COUNT(*) FILTER (WHERE DIA = 31) ELSE NULL END AS "_31",
                COUNT(*) AS TOTAL
            FROM (
                SELECT TDC.NO_CBO AS OCUPACAO, TDP.NO_PROFISSIONAL, 
                    EXTRACT(DAY FROM TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) AS DIA
                FROM TB_FAT_ATENDIMENTO_INDIVIDUAL TFAI 
                INNER JOIN TB_DIM_PROFISSIONAL TDP ON TDP.CO_SEQ_DIM_PROFISSIONAL = TFAI.CO_DIM_PROFISSIONAL_1
                INNER JOIN TB_DIM_EQUIPE TDE ON TDE.CO_SEQ_DIM_EQUIPE = TFAI.CO_DIM_EQUIPE_1
                INNER JOIN TB_DIM_CBO TDC ON TDC.CO_SEQ_DIM_CBO = TFAI.CO_DIM_CBO_1  
                WHERE
                TDE.NU_INE IN (SELECT 
                    TB_EQUIPE.NU_INE AS INE			
                    FROM TB_EQUIPE
                    LEFT JOIN TB_TIPO_EQUIPE  ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
                    LEFT JOIN TB_DIM_EQUIPE TDE1 ON TDE1.NU_INE = TB_EQUIPE.NU_INE 
                    WHERE ST_ATIVO = 1 AND NU_MS = '72' 
                    ORDER BY TB_EQUIPE.NO_EQUIPE)	
                AND TDP.ST_REGISTRO_VALIDO = 1 
                AND TFAI.CO_DIM_TEMPO >= '20240101'
                AND (P_EQUIPE IS NULL OR TDE.NU_INE = P_EQUIPE)
                AND (P_MES IS NULL OR EXTRACT(MONTH FROM TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) = V_MES)
                AND (P_ANO IS NULL OR EXTRACT(YEAR FROM TO_DATE(TFAI.CO_DIM_TEMPO::TEXT, 'YYYYMMDD')) = V_ANO)
            ) AS DIAS
            GROUP BY DIAS.OCUPACAO, DIAS.NO_PROFISSIONAL;
        END;
        $$;`
    },

    /*--------------------------------------------------------*/ 



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
                fact.nuCns AS cns_cidadao,
                fact.cpf AS cpf_cidadao
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
                    tb_fat_cad_individual.co_dim_cbo in (395, 468, 945) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
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
            WHERE 
            (tde.nu_ine = p_equipe or p_equipe IS NULL) and  tb_fat_cidadao_pec.st_faleceu = 0
            GROUP BY          
                fact.nuCns, 
                fact.cpf    
        ) AS total;
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
                    fact.nuCns AS cns_cidadao,
                    fact.cpf AS cpf_cidadao
                FROM (
                    SELECT
                        tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                        tb_fat_cad_individual.nu_cns AS nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                        tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                        --cad_individual.no_mae_cidadao AS noNomeMae,
                        --tb_fat_cad_individual.dt_nascimento AS dtNascimento,
                        --tb_fat_cad_individual.co_dim_sexo AS sexo,
                        tb_fat_cad_individual.co_dim_faixa_etaria AS idade
                    FROM
                        tb_fat_cad_individual
                    JOIN tb_dim_tipo_saida_cadastro 
                        ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    JOIN tb_cds_cad_individual cad_individual 
                        ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    WHERE
                        tb_fat_cad_individual.co_dim_cbo in(395, 468, 945) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
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
                WHERE 
                    (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                GROUP BY          
                    fact.nuCns, 
                    fact.cpf    
            ) AS autorreferidos;
        END;
        $$;
`
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
                        fact.nuCns AS cns_cidadao,
                        fact.cpf AS cpf_cidadao,
                        tds.ds_sexo AS sexo	            
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
                            tb_fat_cad_individual.co_dim_cbo in (395, 468, 945) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
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
                    group by fact.nucns, fact.cpf, tds.ds_sexo
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
                        fact.nuCns AS cns_cidadao,
                        fact.cpf AS cpf_cidadao,           
                        tds.ds_sexo AS sexo	           
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
                            tb_fat_cad_individual.co_dim_cbo in (395, 468, 945) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
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
                    WHERE (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                    group by fact.nucns, fact.cpf, tds.ds_sexo				
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
                            tb_fat_cad_individual.co_dim_cbo in (395, 468, 945) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
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
                            tb_fat_cad_individual.co_dim_cbo in (395, 468, 945) --or tb_fat_cad_individual.co_dim_cbo = 468 or tb_fat_cad_individual.co_dim_cbo = 945
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

    {   name: 'Diabeticos Clinicos',
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
                    fact.nuCns AS cns_cidadao,
                    fact.cpf AS cpf_cidadao
                FROM (
                    SELECT
                        tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                        tb_fat_cad_individual.nu_cns AS nuCns,
                        tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                        tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                        cad_individual.no_mae_cidadao AS noNomeMae,
                        tb_fat_cad_individual.dt_nascimento AS dtNascimento    
                    FROM
                        tb_fat_cad_individual
                    JOIN tb_dim_tipo_saida_cadastro 
                        ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                    JOIN tb_cds_cad_individual cad_individual 
                        ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                    WHERE
                        tb_fat_cad_individual.co_dim_cbo in (395, 468, 945)
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
                WHERE 
                (tde.nu_ine = p_equipe or p_equipe IS NULL) and  tb_fat_cidadao_pec.st_faleceu = 0
                GROUP BY  
                    fact.nuCns, 
                    fact.cpf 

            ) AS total;
            end;
            $$`
    },

    {   name: 'Diabeticos Autorreferidos',
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
                        fact.nuCns AS cns_cidadao,
                        fact.cpf AS cpf_cidadao
                    FROM (
                        SELECT
                            tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                            tb_fat_cad_individual.nu_cns AS nuCns,
                            tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                            tb_fat_cad_individual.co_dim_profissional AS coDimProf,
                            cad_individual.no_mae_cidadao AS noNomeMae,
                            tb_fat_cad_individual.dt_nascimento AS dtNascimento
                        FROM
                            tb_fat_cad_individual
                        JOIN tb_dim_tipo_saida_cadastro 
                            ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                        JOIN tb_cds_cad_individual cad_individual 
                            ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                        WHERE
                            tb_fat_cad_individual.co_dim_cbo in (395, 468, 945)
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
                    WHERE 
                        (p_equipe IS NULL OR tde.nu_ine = p_equipe)
                    GROUP BY  
                        fact.nuCns, 
                        fact.cpf
                ) AS autorreferidos;
            END;
            $$;`
    },

    {   name: 'Diabeticos Faixa Etaria',
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
                            fact.nuCns AS cns_cidadao,
                            fact.cpf AS cpf_cidadao,	            
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
                                tb_fat_cad_individual.co_dim_cbo in (395, 468, 945)
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
                            fact.nuCns AS cns_cidadao,
                            fact.cpf AS cpf_cidadao,
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
                                tb_fat_cad_individual.co_dim_cbo in (395, 468, 945)
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
                        fact.nuCns AS cns_cidadao,
                        fact.cpf AS cpf_cidadao,	            
                        tds.ds_sexo AS sexo	            
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
                            tb_fat_cad_individual.co_dim_cbo in (395, 468, 945)
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
                        fact.nuCns AS cns_cidadao,
                        fact.cpf AS cpf_cidadao,	            
                        tds.ds_sexo AS sexo
                    FROM (
                        SELECT
                            tb_fat_cad_individual.co_fat_cidadao_pec AS fciCidadaoPec,
                            tb_fat_cad_individual.nu_cns AS nuCns,
                            tb_fat_cad_individual.nu_cpf_cidadao AS cpf,
                            tb_fat_cad_individual.co_dim_sexo AS sexo
                        FROM
                            tb_fat_cad_individual
                        JOIN tb_dim_tipo_saida_cadastro 
                            ON tb_fat_cad_individual.co_dim_tipo_saida_cadastro = tb_dim_tipo_saida_cadastro.co_seq_dim_tipo_saida_cadastro
                        JOIN tb_cds_cad_individual cad_individual 
                            ON cad_individual.co_unico_ficha = tb_fat_cad_individual.nu_uuid_ficha
                        WHERE
                            tb_fat_cad_individual.co_dim_cbo in (395, 468, 945)
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
        name: 'Listar INE Escolas',
        definition: `CREATE OR REPLACE FUNCTION LISTAR_INEP()
            RETURNS TABLE(
                INEP VARCHAR, 
                NOME VARCHAR)
            LANGUAGE PLPGSQL
            AS $$
            BEGIN
                RETURN QUERY
                SELECT 
                    NU_IDENTIFICADOR,
                    NO_ESTABELECIMENTO
                FROM TB_DIM_INEP TDI 
                WHERE NO_ESTABELECIMENTO NOTNULL AND NU_IDENTIFICADOR <> '-';	
            END;
            $$`    
    },

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
                from tb_equipe
                left join tb_tipo_equipe on tp_equipe = co_seq_tipo_equipe 
                where st_ativo = 1 and nu_ms = '71' 
                order by no_equipe;
            end;
            $$`
    },

    {
        name: 'Lista ESF',
        definition: `CREATE OR REPLACE FUNCTION LISTAR_ESF()
        RETURNS TABLE (INE VARCHAR, NOMEEQUIPE VARCHAR)
        LANGUAGE PLPGSQL
        AS $$
        BEGIN
            RETURN QUERY
            SELECT DISTINCT
                NU_INE,
                NO_EQUIPE
            FROM TB_EQUIPE
            LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
            WHERE ST_ATIVO = 1 AND NU_MS = '70' 
            ORDER BY NO_EQUIPE;
        END;
        $$`
    },

    {
        name: 'Lista eMulti',
        definition: `CREATE OR REPLACE FUNCTION LISTAR_EMULTI()
        RETURNS TABLE (INE VARCHAR, NOMEEQUIPE VARCHAR)
        LANGUAGE PLPGSQL
        AS $$
        BEGIN
            RETURN QUERY
            SELECT DISTINCT
                NU_INE,
                NO_EQUIPE
            FROM TB_EQUIPE
            LEFT JOIN TB_TIPO_EQUIPE ON TP_EQUIPE = CO_SEQ_TIPO_EQUIPE
            WHERE ST_ATIVO = 1 AND NU_MS = '72' 
            ORDER BY NO_EQUIPE;
        END;
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
        definition: `CREATE OR REPLACE FUNCTION GETCATEGORIAS() 
            RETURNS TABLE(CODIGO BIGINT, NOME TEXT)
            LANGUAGE PLPGSQL
            AS $$
            BEGIN
                RETURN QUERY
                SELECT TDC.CO_SEQ_DIM_CBO AS CODIGO,
                    CASE 
                        WHEN NO_CBO = 'ENFERMEIRO DA ESTRATÉGIA DE SAÚDE DA FAMÍLIA' THEN 'ENFERMEIRO ESF'
                        WHEN NO_CBO = 'MÉDICO DA ESTRATÉGIA DE SAÚDE DA FAMÍLIA' THEN 'MÉDICO ESF'           
                    END AS NOME
                FROM TB_DIM_CBO TDC 
                WHERE CO_SEQ_DIM_CBO IN (
                    SELECT CO_SEQ_DIM_CBO FROM TB_DIM_CBO 
                    WHERE NU_CBO IN ('225142', '223565')
                ) 
                AND TDC.ST_REGISTRO_VALIDO = 1 
                ORDER BY CO_SEQ_DIM_CBO;
            END;
            $$`
    },

    {
        name: 'Listar Acs por Equipe',
        definition: `
        CREATE OR REPLACE FUNCTION LISTAR_ACS_EQUIPE(
            QUADRIMESTRE DATE,
            P_EQUIPE VARCHAR DEFAULT NULL,
            P_PROFISSIONAL VARCHAR DEFAULT NULL
        )
        RETURNS TABLE(
            INE_EQUIPE VARCHAR,
            EQUIPE VARCHAR,
            CODIGO_PROFISSIONAL INTEGER,
            PROFISSIONAL_NOME VARCHAR
        )
        AS $$
        BEGIN
            RETURN QUERY
                SELECT DISTINCT 
                    INE AS INE_EQUIPE,
                    EQUIPE_NOME AS EQUIPE,
                    COD_PROFISSIONAL AS CODIGO_PROFISSIONAL,
                    NOME_PROFISSIONAL AS PROFISSIONAL_NOME
                FROM FCI_DESATUALIZADA(QUADRIMESTRE, P_EQUIPE, P_PROFISSIONAL)
                ORDER BY EQUIPE_NOME;
        END;
        $$ LANGUAGE PLPGSQL;`
    },

    {
        name: 'Data Atualizacao',
        definition: `CREATE OR REPLACE FUNCTION ATUALIZACAO()
        RETURNS TABLE(
            ULTIMA_ATUALIZACAO VARCHAR)
        AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                TO_CHAR(MAX(TAE.DT_EVENTO), 'DD/MM/YYYY')::VARCHAR AS ATUALIZADO_EM
            FROM TB_AUDITORIA_EVENTO TAE 
            WHERE TAE.DT_EVENTO >= DATE '2025-01-01';	
        END;
        $$ LANGUAGE PLPGSQL;`
    },


    
];



export default functions;
