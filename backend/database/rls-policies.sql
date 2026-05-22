-- PostgreSQL Row Level Security policies for the Momesso technical test.
--
-- These policies use session settings expected to be set by the application
-- connection before querying protected tables:
--
--   SET LOCAL app.current_role = 'ADMIN';
--   SET LOCAL app.current_company_id = '1';
--
-- ADMIN can access all rows. USER can access rows from its own company.

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_admin_all ON companies;
DROP POLICY IF EXISTS companies_user_company ON companies;
DROP POLICY IF EXISTS users_admin_all ON users;
DROP POLICY IF EXISTS users_user_company ON users;
DROP POLICY IF EXISTS machines_admin_all ON machines;
DROP POLICY IF EXISTS machines_user_company ON machines;

CREATE POLICY companies_admin_all
  ON companies
  FOR ALL
  USING (current_setting('app.current_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

CREATE POLICY companies_user_company
  ON companies
  FOR SELECT
  USING (
    current_setting('app.current_role', true) = 'USER'
    AND id = NULLIF(current_setting('app.current_company_id', true), '')::integer
  );

CREATE POLICY users_admin_all
  ON users
  FOR ALL
  USING (current_setting('app.current_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

CREATE POLICY users_user_company
  ON users
  FOR ALL
  USING (
    current_setting('app.current_role', true) = 'USER'
    AND "companyId" = NULLIF(current_setting('app.current_company_id', true), '')::integer
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'USER'
    AND "companyId" = NULLIF(current_setting('app.current_company_id', true), '')::integer
  );

CREATE POLICY machines_admin_all
  ON machines
  FOR ALL
  USING (current_setting('app.current_role', true) = 'ADMIN')
  WITH CHECK (current_setting('app.current_role', true) = 'ADMIN');

CREATE POLICY machines_user_company
  ON machines
  FOR ALL
  USING (
    current_setting('app.current_role', true) = 'USER'
    AND "companyId" = NULLIF(current_setting('app.current_company_id', true), '')::integer
  )
  WITH CHECK (
    current_setting('app.current_role', true) = 'USER'
    AND "companyId" = NULLIF(current_setting('app.current_company_id', true), '')::integer
  );
