-- The ingest migration recreates these views so it can change a generated
-- column's source precision. On a fresh database, the baseline materialized
-- view changesets below will create them again. On an upgraded database where
-- those changesets already ran, leave the existing views untouched.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM databasechangelog
    WHERE id = '4252a8b3-1e8f-4a8d-a9d2-fd527ab70213'
      AND author = 'Hidro_Smarth'
  ) THEN
    EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS consumption.mv_home_monthly_consumption';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM databasechangelog
    WHERE id = '7a2e26e5-8d0a-4f9b-c2e3-4b6d8f0a1235'
      AND author = 'Hidro_Smarth'
  ) THEN
    EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS consumption.mv_hourly_consumption_avg';
  END IF;
END;
$$;
