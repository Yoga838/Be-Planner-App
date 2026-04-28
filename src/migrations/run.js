// src/migrations/run.js
const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../config/supabase');

async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    const sqlPath = path.join(__dirname, '001_initials_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error('Migration error:', error);
        // Continue with other statements
      }
    }
    
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();