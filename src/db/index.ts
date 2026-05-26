import {Client, Pool} from 'pg'
import config from '../config';


// Database Connection
export const pool = new Pool({
  connectionString: config.connection_string,
})

export async function initDB() {
  const createUserTable = `
    -- 1. Create enum type for allowed roles if it doesn't exist
    DO $$ BEGIN
        CREATE TYPE user_role AS ENUM ('contributor', 'maintainer');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- 2. Create the users table
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role user_role NOT NULL DEFAULT 'contributor',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
    );

    -- 3. Create helper function for automatically updating timestamps
    CREATE OR REPLACE FUNCTION update_modified_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = TIMEZONE('utc', NOW());
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- 4. Apply the update trigger to the users table
    DROP TRIGGER IF EXISTS update_users_modtime ON users;
    CREATE TRIGGER update_users_modtime
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
  `;

  const createIssuesTable = `
    -- 1. Create enum type for allowed issue types if it doesn't exist
    DO $$ BEGIN
        CREATE TYPE issue_type AS ENUM ('bug', 'feature_request');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- 2. Create enum type for allowed workflow states if it doesn't exist
    DO $$ BEGIN
        CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- 3. Create the issues table
    CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type issue_type NOT NULL,
        status issue_status NOT NULL DEFAULT 'open',
        reporter_id INT NOT NULL, -- App layer validates that this exists in the users table
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
        
        -- Business logic validations enforced at the database layer
        CONSTRAINT chk_title_length CHECK (char_length(title) <= 150),
        CONSTRAINT chk_description_length CHECK (char_length(description) >= 20)
    );

    -- 4. Apply the automated update trigger to the issues table
    DROP TRIGGER IF EXISTS update_issues_modtime ON issues;
    CREATE TRIGGER update_issues_modtime
        BEFORE UPDATE ON issues
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column(); -- Reuses the function created in your users table script
  `;

  const client = await pool.connect();
  try {
    console.log('✅ Successfully connected to Supabase Postgres!');
    
    await client.query(createUserTable);
    await client.query(createIssuesTable);
    
    // Run a quick query to fetch the current server time
    const res = await client.query('SELECT NOW();');
    console.log('🕒 Supabase Server Time:', res.rows[0].now);
    
  } catch (error : any) {
    console.error('❌ Connection failed!', error.message);
  } finally {
    client.release();
  }
}

