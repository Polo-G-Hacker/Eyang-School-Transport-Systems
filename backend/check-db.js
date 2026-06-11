import { query } from './src/db.js';

async function checkTables() {
  try {
    const res = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    console.log('Tables found in database:');
    if (res.rows.length === 0) {
      console.log('No tables found.');
    } else {
      res.rows.forEach(r => console.log('- ' + r.table_name));
    }
  } catch (err) {
    console.error('Error connecting to database:', err.message);
  } finally {
    process.exit();
  }
}

checkTables();
