exports.up = async (pgm) => {

    pgm.createIndex('logs', ['project_id', 'timestamp'], {
      name: 'idx_logs_project_timestamp',
      order: { timestamp: 'DESC' },
    });
  
    pgm.createIndex('logs', ['project_id', 'level', 'timestamp'], {
      name: 'idx_logs_project_level_timestamp',
    });
  
    pgm.createIndex('logs', ['project_id', 'service', 'timestamp'], {
      name: 'idx_logs_project_service_timestamp',
    });

    pgm.sql(
      'CREATE INDEX idx_logs_search_vector ON logs USING GIN (search_vector)'
    );
  
   
    pgm.sql(
      'CREATE INDEX idx_logs_metadata ON logs USING GIN (metadata)'
    );
  
    
    pgm.sql(
      'CREATE INDEX idx_logs_message_trgm ON logs USING GIN (message gin_trgm_ops)'
    );
  };
  
  exports.down = async (pgm) => {
    pgm.dropIndex('logs', [], { name: 'idx_logs_project_timestamp' });
    pgm.dropIndex('logs', [], { name: 'idx_logs_project_level_timestamp' });
    pgm.dropIndex('logs', [], { name: 'idx_logs_project_service_timestamp' });
    pgm.sql('DROP INDEX IF EXISTS idx_logs_search_vector');
    pgm.sql('DROP INDEX IF EXISTS idx_logs_metadata');
    pgm.sql('DROP INDEX IF EXISTS idx_logs_message_trgm');
  };