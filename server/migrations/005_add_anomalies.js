exports.up = async (pgm) => {
    pgm.createTable('project_baselines', {
      id: { type: 'serial', primaryKey: true },
      project_id: {
        type: 'integer',
        references: '"projects"',
        onDelete: 'CASCADE',
        unique: true,
      },
      avg_logs_per_minute: { type: 'numeric', default: 0 },
      stddev_logs_per_minute: { type: 'numeric', default: 0 },
      level_distribution: { type: 'jsonb', default: pgm.func("'{}'") },
      known_services: { type: 'jsonb', default: pgm.func("'[]'") },
      sample_count: { type: 'integer', default: 0 }, 
      updated_at: { type: 'timestamp', default: pgm.func('NOW()') },
    });
  
    pgm.createTable('anomalies', {
      id: { type: 'serial', primaryKey: true },
      project_id: {
        type: 'integer',
        references: '"projects"',
        onDelete: 'CASCADE',
      },
      anomaly_type: { type: 'varchar(40)', notNull: true },
      severity: { type: 'varchar(10)', notNull: true },
      description: { type: 'text', notNull: true },
      metric_value: { type: 'numeric' },
      baseline_value: { type: 'numeric' },
      ai_explanation: { type: 'text' },
      sample_logs: { type: 'jsonb' },
      detected_at: { type: 'timestamp', default: pgm.func('NOW()') },
      acknowledged: { type: 'boolean', default: false },
    });
  
    pgm.createIndex('anomalies', ['project_id', 'detected_at'], {
      name: 'idx_anomalies_project_detected',
      order: { detected_at: 'DESC' },
    });
  };
  
  exports.down = async (pgm) => {
    pgm.dropTable('anomalies');
    pgm.dropTable('project_baselines');
  };