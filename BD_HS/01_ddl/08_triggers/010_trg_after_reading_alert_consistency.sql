-- ============================================================
-- TRIGGER: alertas por lectura consistentes e idempotentes
-- ============================================================

CREATE OR REPLACE FUNCTION consumption.fn_after_reading_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = consumption, alert_rate, home, device, public, pg_temp
AS $$
DECLARE
    v_rule RECORD;

    v_value DECIMAL(14,4);

    v_is_vacation BOOLEAN;

    v_local_date DATE;

    v_day_start TIMESTAMPTZ;
    v_day_end TIMESTAMPTZ;

    v_month_date DATE;
    v_month_start TIMESTAMPTZ;
    v_month_end TIMESTAMPTZ;

    v_dedup_key VARCHAR(160);
BEGIN

    v_local_date :=
        (
            NEW.recorded_at
            AT TIME ZONE 'America/Bogota'
        )::date;


    v_day_start :=
        v_local_date::timestamp
        AT TIME ZONE 'America/Bogota';


    v_day_end :=
        (v_local_date + 1)::timestamp
        AT TIME ZONE 'America/Bogota';


    v_month_date :=
        date_trunc(
            'month',
            v_local_date::timestamp
        )::date;


    v_month_start :=
        v_month_date::timestamp
        AT TIME ZONE 'America/Bogota';


    v_month_end :=
        (
            v_month_date
            + INTERVAL '1 month'
        )
        AT TIME ZONE 'America/Bogota';


    v_is_vacation :=
        home.fn_is_vacation_active(
            NEW.home_id,
            v_local_date
        );


    FOR v_rule IN

        SELECT
            rule_id,
            alert_type,
            threshold,
            unit

        FROM alert_rate.alert_rule

        WHERE home_id = NEW.home_id
          AND active = TRUE

          AND alert_type IN (
              'daily_limit',
              'monthly_limit',
              'excessive_consumption',
              'leak_detected'
          )

        ORDER BY
            alert_type,
            rule_id

    LOOP


        -- ====================================================
        -- LIMITE DIARIO / CONSUMO EXCESIVO
        -- ====================================================
        IF v_rule.alert_type IN (
            'daily_limit',
            'excessive_consumption'
        )
        THEN

            IF v_is_vacation THEN
                CONTINUE;
            END IF;


            SELECT COALESCE(
                SUM(sr.consumption_m3),
                0
            )
            INTO v_value

            FROM consumption.sensor_reading sr

            WHERE sr.home_id = NEW.home_id
              AND sr.recorded_at >= v_day_start
              AND sr.recorded_at < v_day_end;


            IF v_value > v_rule.threshold THEN

                v_dedup_key :=
                    format(
                        '%s:%s',
                        v_rule.alert_type,
                        v_local_date
                    );


                INSERT INTO alert_rate.alert_event (
                    rule_id,
                    home_id,
                    message,
                    detected_value,
                    status,
                    dedup_key
                )
                VALUES (
                    v_rule.rule_id,

                    NEW.home_id,

                    format(
                        'La regla %s supero el umbral de %s %s. Valor actual: %s.',
                        v_rule.alert_type,
                        v_rule.threshold,
                        v_rule.unit,
                        v_value
                    ),

                    v_value,

                    'Pending',

                    v_dedup_key
                )

                ON CONFLICT (
                    rule_id,
                    home_id,
                    dedup_key
                )
                WHERE dedup_key IS NOT NULL
                DO NOTHING;

            END IF;


        -- ====================================================
        -- LIMITE MENSUAL
        -- ====================================================
        ELSIF v_rule.alert_type = 'monthly_limit'
        THEN

            IF v_is_vacation THEN
                CONTINUE;
            END IF;


            SELECT COALESCE(
                SUM(sr.consumption_m3),
                0
            )
            INTO v_value

            FROM consumption.sensor_reading sr

            WHERE sr.home_id = NEW.home_id
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
                    status,
                    dedup_key
                )
                VALUES (
                    v_rule.rule_id,

                    NEW.home_id,

                    format(
                        'La regla monthly_limit supero el umbral de %s %s. Valor actual: %s.',
                        v_rule.threshold,
                        v_rule.unit,
                        v_value
                    ),

                    v_value,

                    'Pending',

                    v_dedup_key
                )

                ON CONFLICT (
                    rule_id,
                    home_id,
                    dedup_key
                )
                WHERE dedup_key IS NOT NULL
                DO NOTHING;

            END IF;


        -- ====================================================
        -- POSIBLE FUGA
        -- ====================================================
        ELSIF v_rule.alert_type = 'leak_detected'
        THEN

            -- Las fugas NO se silencian durante vacaciones.
            IF alert_rate.fn_is_leak_detected(
                NEW.device_id,
                NEW.recorded_at,
                CEIL(v_rule.threshold)::INTEGER
            )
            THEN

                v_dedup_key :=
                    format(
                        'leak_detected:%s:%s',
                        NEW.device_id,
                        v_local_date
                    );


                INSERT INTO alert_rate.alert_event (
                    rule_id,
                    home_id,
                    message,
                    detected_value,
                    status,
                    dedup_key
                )
                VALUES (
                    v_rule.rule_id,

                    NEW.home_id,

                    format(
                        'Posible fuga detectada en el dispositivo %s: flujo continuo por al menos %s minutos.',
                        NEW.device_id,
                        v_rule.threshold
                    ),

                    v_rule.threshold,

                    'Pending',

                    v_dedup_key
                )

                ON CONFLICT (
                    rule_id,
                    home_id,
                    dedup_key
                )
                WHERE dedup_key IS NOT NULL
                DO NOTHING;

            END IF;

        END IF;

    END LOOP;


    RETURN NEW;
END;
$$;


COMMENT ON FUNCTION
    consumption.fn_after_reading_insert()
IS
'Evalua reglas por lectura con periodos America/Bogota. Vacaciones suprime limites de consumo pero no fugas. dedup_key evita duplicados concurrentes.';