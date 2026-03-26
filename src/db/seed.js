import pool from '../config/db.js';

const DEFAULT_SERVICES = [
  'Hair Care',
  'Hair Colour',
  'Nail Bar',
  'Face',
  'Treatments',
  'Massage & Spa',
  "Men's Grooming",
  'Manicure & Pedicure',
  'Waxing',
  'Bleaching & Threading',
  'Bridal & Makeup',
];

const seed = async () => {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding default services...');

    await client.query('BEGIN');

    for (const serviceName of DEFAULT_SERVICES) {
      await client.query(
        `INSERT INTO default_services (name)
         VALUES ($1)
         ON CONFLICT (name) DO NOTHING`,
        [serviceName]
      );
    }

    await client.query('COMMIT');

    const result = await client.query('SELECT * FROM default_services ORDER BY name');
    console.log(`✅ Seeded ${result.rows.length} default services:`);
    result.rows.forEach((s) => console.log(`   - ${s.name}`));

    console.log('\n🎉 Seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
