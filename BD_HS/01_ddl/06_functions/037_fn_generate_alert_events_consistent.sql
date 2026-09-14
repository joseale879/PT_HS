-- ============================================================
-- ALERTAS: generacion periodica consistente e idempotente
-- ============================================================

CREATE OR REPLACE FUNCTION alert_rate.fn_generate_alert_events(
    p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = alert_rate, consumption, home, device, public, pg_temp
AS $$
DECLARE
    v_rule RECORD;
    v_device RECORD;

    v_value DECIMAL(14,4);

    v_created INTEGER := 0;
    v_inserted INTEGER := 0;

    v_is_vacation BOOLEAN;

    v_day_start TIMESTAMPTZ;
    v_day_end TIMESTAMPTZ;

    v_month_date DATE;
    v_month_start TIMESTAMPTZ;
    v_month_end TIMESTAMPTZ;

    v_reference_ts TIMESTAMPTZ;

    v_dedup_key VARCHAR(160);
BEGIN
    IF p_target_date IS NULL THEN
        RAISE EXCEPTION 'p_target_date no puede ser NULL';
    END IF;

    -- Periodos usando la zona horaria de negocio.
    v_day_start :=
        p_target_date::timestamp
        AT TIME ZONE 'America/Bogota';

    v_day_end :=
        (p_target_date + 1)::timestamp
        AT TIME ZONE 'America/Bogota';

    v_month_date :=
        date_trunc(
            'month',
            p_target_date::timestamp
        )::date;

    v_month_start :=
        v_month_date::timestamp
        AT TIME ZONE 'America/Bogota';

    v_month_end :=
        (v_month_date + INTERVAL '1 month')
        AT TIME ZONE 'America/Bogota';

    -- Para hoy se analiza hasta ahora.
    -- Para fechas historicas se usa el final del dia.
    v_reference_ts :=
        CASE
            WHEN p_target_date =
                (now() AT TIME ZONE 'America/Bogota')::date
            THEN now()

            ELSE
                (
                    (p_target_date + 1)::timestamp
                    AT TIME ZONE 'America/Bogota'
                ) - INTERVAL '1 millisecond'
        END;

    FOR v_rule IN
        SELECT
            rule_id,
            home_id,
            alert_type,
            threshold,
            unit

        FROM alert_rate.alert_rule

        WHERE active = TRUE

          AND alert_type IN (
              'daily_limit',
              'monthly_limit',
              'excessive_consumption',
              'no_reading'
          )

        ORDER BY
            home_id,
            alert_type,
            rule_id
    LOOP

        v_is_vacation :=
            home.fn_is_vacation_active(
                v_rule.home_id,
                p_target_date
            );

        -- En vacaciones se silencian alertas normales de consumo.
        -- no_reading continua activa porque seguimos queriendo saber
        -- si el dispositivo dejo de reportar.
        IF v_is_vacation
           AND v_rule.alert_type IN (
               'daily_limit',
               'monthly_limit',
               'excessive_consumption'
           )
        THEN
            CONTINUE;
        END IF;


        -- ====================================================
        -- LIMITE DIARIO / CONSUMO EXCESIVO
        -- ====================================================
        IF v_rule.alert_type IN (
            'daily_limit',
            'excessive_consumption'
        )
        THEN

            SELECT COALESCE(
                SUM(sr.consumption_m3),
                0
            )
            INTO v_value

            FROM consumption.sensor_reading sr

            WHERE sr.home_id = v_rule.home_id
              AND sr.recorded_at >= v_day_start
              AND sr.recorded_at < v_day_end;


            IF v_value > v_rule.threshold THEN

                v_dedup_key :=
                    format(
                        '%s:%s',
                        v_rule.alert_type,
                        p_target_date
                    );

                INSERT INTO alert_rate.alert_event (
                    rule_id,
                    home_id,
                    message,
                    detected_value,
                    dedup_key
                )
                VALUES (
                    v_rule.rule_id,

                    v_rule.home_id,

                    format(
                        'La regla %s supero el umbral configurado de %s %s.',
                        v_rule.alert_type,
                        v_rule.threshold,
                        v_rule.unit
                    ),

                    v_value,

                    v_dedup_key
                )

                ON CONFLICT (
                    rule_id,
                    home_id,
                    dedup_key
                )
                WHERE dedup_key IS NOT NULL
                DO NOTHING;


                GET DIAGNOSTICS
                    v_inserted = ROW_COUNT;

                v_created :=
                    v_created + v_inserted;

            END IF;


        -- ====================================================
        -- LIMITE MENSUAL
        -- ====================================================
        ELSIF v_rule.alert_type = 'monthly_limit'
        THEN

            SELECT COALESCE(
                SUM(sr.consumption_m3),
                0
            )
            INTO v_value

            FROM consumption.sensor_reading sr

            WHERE sr.home_id = v_rule.home_id
              AND sr.recorded_at >= v_month_start
              AND sr.recorded_at < v_month_end;


            IF v_value > v_rule.threshold THEN

                v_dedup_key :=
                    format(
                        'monthly_limit:%s',
                        v_month_date
                    );

                INSERT INTO alert_rate.alert_event (
                    rule_id,
                    home_id,
                    message,
                    detected_value,
                    dedup_key
                )
                VALUES (
                    v_rule.rule_id,

                    v_rule.home_id,

                    format(
                        'La regla monthly_limit supero el umbral configurado de %s %s.',
                        v_rule.threshold,
                        v_rule.unit
                    ),

                    v_value,

                    v_dedup_key
                )

                ON CONFLICT (
                    rule_id,
                    home_id,
                    dedup_key
                )
                WHERE dedup_key IS NOT NULL
                DO NOTHING;


                GET DIAGNOSTICS
                    v_inserted = ROW_COUNT;

                v_created :=
                    v_created + v_inserted;

            END IF;


        -- ====================================================
        -- DISPOSITIVO SIN LECTURAS
        -- ====================================================
        ELSIF v_rule.alert_type = 'no_reading'
        THEN

            FOR v_device IN

                SELECT hd.device_id

                FROM home.home_device hd

                JOIN device.device d
                  ON d.device_id = hd.device_id

                WHERE hd.home_id = v_rule.home_id

                  AND hd.status = 'Active'
                  AND d.status = 'Active'

                  -- No alertar apenas se instala un dispositivo.
                  AND hd.installed_at
                      <=
                      v_reference_ts
                      - (
                          v_rule.threshold
                          * INTERVAL '1 minute'
                      )

                  AND NOT EXISTS (

                      SELECT 1

                      FROM consumption.sensor_reading sr

                      WHERE sr.device_id =
                            hd.device_id

                        AND sr.home_id =
                            hd.home_id

                        AND sr.recorded_at
                            >
                            v_reference_ts
                            - (
                                v_rule.threshold
                                * INTERVAL '1 minute'
                            )

                        AND sr.recorded_at
                            <=
                            v_reference_ts
                  )

                ORDER BY hd.device_id

            LOOP

                v_dedup_key :=
                    format(
                        'no_reading:%s:%s',
                        v_device.device_id,
                        p_target_date
                    );


                INSERT INTO alert_rate.alert_event (
                    rule_id,
                    home_id,
                    message,
                    detected_value,
                    dedup_key
                )
                VALUES (
                    v_rule.rule_id,

                    v_rule.home_id,

                    format(
                        'El dispositivo %s no registra lecturas desde hace al menos %s minutos.',
                        v_device.device_id,
                        v_rule.threshold
                    ),

                    v_rule.threshold,

                    v_dedup_key
                )

                ON CONFLICT (
                    rule_id,
                    home_id,
                    dedup_key
                )
                WHERE dedup_key IS NOT NULL
                DO NOTHING;


                GET DIAGNOSTICS
                    v_inserted = ROW_COUNT;

                v_created :=
                    v_created + v_inserted;

            END LOOP;

        END IF;

    END LOOP;


    RETURN v_created;
END;
$$;


COMMENT ON FUNCTION
    alert_rate.fn_generate_alert_events(DATE)
IS
'Evalua reglas periodicas con limites America/Bogota, respeta vacaciones para consumo y utiliza dedup_key para idempotencia concurrente.';