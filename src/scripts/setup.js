// src/scripts/quick-setup.js
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

async function quickSetup() {
  console.log('🚀 Pixel Task Quest - Quick Setup\n');
  console.log('ℹ️  This script will check if tables exist and provide instructions.\n');
  
  try {
    // Coba query profiles table
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.log('❌ Database tables not found!\n');
        console.log('📋 Please follow these steps:');
        console.log('1. Open Supabase Dashboard:');
        console.log('   https://ngryejnicrwebpdadilw.supabase.co\n');
        console.log('2. Go to SQL Editor (click </> icon)\n');
        console.log('3. Copy the SQL from src/scripts/setup.sql\n');
        console.log('4. Paste and click RUN\n');
        console.log('5. After that, run: npm run seed\n');
        return;
      }
    }
    
    console.log('✅ Database tables exist!');
    console.log('📊 Current status:');
    console.log(`   - Profiles: ${data?.count || 0} users`);
    
    // Check quests
    const { count: questCount } = await supabaseAdmin
      .from('quests')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   - Quests: ${questCount || 0} quests`);
    
    if (questCount === 0) {
      console.log('\n💡 Database is empty. Run: npm run seed');
    }
    
  } catch (error) {
    console.error('Setup check failed:', error.message);
  }
}

quickSetup();