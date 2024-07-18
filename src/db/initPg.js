const createTables = async (db) => {
  try {
    await db.none(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        birthdate DATE,
        age INT,
        gender VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS health_profiles (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        height_cm INT,
        weight_kg FLOAT,
        blood_type VARCHAR(3),
        medical_history TEXT,
        genetic_data_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS medications (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255),
        dosage VARCHAR(100),
        frequency VARCHAR(100),
        start_date DATE,
        end_date DATE,
        photo_url VARCHAR(255),
        audio_name_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("PostgreSQL tables are set up.");
  } catch (error) {
    console.error("Error setting up PostgreSQL tables:", error);
    throw error;
  }
};

export default createTables;
