CREATE OR REPLACE FUNCTION home.fn_assert_home_has_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = home, public, pg_temp
AS $$
DECLARE
    v_home_id UUID;
BEGIN
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        v_home_id := NEW.home_id;
        IF EXISTS (SELECT 1 FROM home.home WHERE home_id = v_home_id)
           AND NOT EXISTS (
               SELECT 1
               FROM home.home_user
               WHERE home_id = v_home_id
                 AND home_role = 'Owner'
           ) THEN
            RAISE EXCEPTION 'El hogar % debe conservar al menos un Owner', v_home_id;
        END IF;
    END IF;

    IF TG_OP IN ('DELETE', 'UPDATE')
       AND (TG_OP = 'DELETE' OR OLD.home_id IS DISTINCT FROM NEW.home_id) THEN
        v_home_id := OLD.home_id;
        IF EXISTS (SELECT 1 FROM home.home WHERE home_id = v_home_id)
           AND NOT EXISTS (
               SELECT 1
               FROM home.home_user
               WHERE home_id = v_home_id
                 AND home_role = 'Owner'
           ) THEN
            RAISE EXCEPTION 'El hogar % debe conservar al menos un Owner', v_home_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_home_user_requires_owner ON home.home_user;

CREATE CONSTRAINT TRIGGER trg_home_user_requires_owner
AFTER INSERT OR UPDATE OR DELETE ON home.home_user
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION home.fn_assert_home_has_owner();

COMMENT ON FUNCTION home.fn_assert_home_has_owner() IS
'Garantiza que cada hogar existente conserve al menos un miembro con rol Owner.';
