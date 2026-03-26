import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrate = async () => {
  let client;
  let retries = 10;
  let delay = 5000;

  while (retries > 0) {
    try {
      client = await pool.connect();
      console.log('✅ Connected to database for migration');
      break;
    } catch (err) {
      retries -= 1;
      console.warn(`⏳ Database connection failed. Retrying... (${retries} left). Error: ${err.message}`);
      if (retries === 0) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`📂 Found ${files.length} migration file(s)`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`⏳ Running migration: ${file}`);
      await client.query(sql);
      console.log(`✅ Completed: ${file}`);
    }

    console.log('\n🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
