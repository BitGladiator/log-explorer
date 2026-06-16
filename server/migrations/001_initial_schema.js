exports.up = async (pgm) => {

    pgm.sql('CREATE EXTENSION IF NOT EXISTS vector');
  
    pgm.sql('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  
    pgm.createTable('users', {
      id: { type: 'serial', primaryKey: true },
      email: { type: 'varchar(255)', unique: true, notNull: true },
      password_hash: { type: 'text', notNull: true },
      name: { type: 'varchar(100)' },
      created_at: { type: 'timestamp', default: pgm.func('NOW()') },
    });

    pgm.createTable('projects', {
      id: { type: 'serial', primaryKey: true },
      user_id: {
        type: 'integer',
        references: '"users"',
        onDelete: 'CASCADE',
      },
      name: { type: 'varchar(100)', notNull: true },
      slug: { type: 'varchar(100)', notNull: true },
      api_key: { type: 'varchar(64)', unique: true, notNull: true },
      created_at: { type: 'timestamp', default: pgm.func('NOW()') },
    });
  
    pgm.addConstraint(
      'projects',
      'projects_user_slug_unique',
      'UNIQUE (user_id, slug)'
    );
  
    pgm.createTable('logs', {
      id: { type: 'bigserial', primaryKey: true },
      project_id: {
        type: 'integer',
        references: '"projects"',
        onDelete: 'CASCADE',
      },
      level: {
        type: 'varchar(10)',
        notNull: true,
      },
      message: { type: 'text', notNull: true },
      service: { type: 'varchar(100)' },
      host: { type: 'varchar(255)' },
      timestamp: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
      metadata: { type: 'jsonb', default: '{}' },
      search_vector: { type: 'tsvector' },
    });
  

    pgm.sql(`
      CREATE OR REPLACE FUNCTION logs_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          setweight(to_tsvector('english', coalesce(NEW.message, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.service, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(NEW.host, '')), 'C');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  
    pgm.sql(`
      CREATE TRIGGER logs_search_vector_trigger
      BEFORE INSERT OR UPDATE ON logs
      FOR EACH ROW EXECUTE FUNCTION logs_search_vector_update();
    `);
  

    pgm.createTable('ingestion_stats', {
      id: { type: 'serial', primaryKey: true },
      project_id: {
        type: 'integer',
        references: '"projects"',
        onDelete: 'CASCADE',
      },
      date: { type: 'date', notNull: true, default: pgm.func('CURRENT_DATE') },
      logs_ingested: { type: 'integer', default: 0 },
      bytes_ingested: { type: 'bigint', default: 0 },
    });
  
    pgm.addConstraint(
      'ingestion_stats',
      'ingestion_stats_project_date_unique',
      'UNIQUE (project_id, date)'
    );
  };
  
  exports.down = async (pgm) => {
    pgm.dropTable('ingestion_stats');
    pgm.dropTable('logs');
    pgm.dropTable('projects');
    pgm.dropTable('users');
    pgm.sql('DROP EXTENSION IF EXISTS vector');
    pgm.sql('DROP EXTENSION IF EXISTS pg_trgm');
  };