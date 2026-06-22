exports.up = async (pgm) => {
  
    pgm.addColumns('projects', {
      retention_days: {
        type: 'integer',
        default: 30,
      },
      storage_warning_threshold: {
        type: 'integer',
        default: 100000, 
      },
    });
  
    pgm.createTable('retention_runs', {
      id: { type: 'serial', primaryKey: true },
      project_id: {
        type: 'integer',
        references: '"projects"',
        onDelete: 'CASCADE',
      },
      deleted_count: { type: 'integer', notNull: true },
      oldest_kept: { type: 'timestamptz' },
      run_at: { type: 'timestamp', default: pgm.func('NOW()') },
    });
  
    pgm.createIndex('retention_runs', ['project_id', 'run_at'], {
      name: 'idx_retention_runs_project',
      order: { run_at: 'DESC' },
    });
  };
  
  exports.down = async (pgm) => {
    pgm.dropTable('retention_runs');
    pgm.dropColumns('projects', ['retention_days', 'storage_warning_threshold']);
  };