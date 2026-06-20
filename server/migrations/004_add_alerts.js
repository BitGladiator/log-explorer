exports.up = async (pgm) => {
  pgm.createTable("alert_rules", {
    id: { type: "serial", primaryKey: true },
    project_id: {
      type: "integer",
      references: '"projects"',
      onDelete: "CASCADE",
    },
    name: { type: "varchar(100)", notNull: true },
    rule_type: { type: "varchar(30)", notNull: true },
    level: { type: "varchar(10)" },
    threshold_count: { type: "integer", notNull: true },
    window_minutes: { type: "integer", notNull: true, default: 5 },
    keyword: { type: "text" },
    service: { type: "varchar(100)" },
    enabled: { type: "boolean", default: true },
    slack_webhook_url: { type: "text" },
    created_at: { type: "timestamp", default: pgm.func("NOW()") },
  });

  pgm.createTable("alert_triggers", {
    id: { type: "serial", primaryKey: true },
    alert_rule_id: {
      type: "integer",
      references: '"alert_rules"',
      onDelete: "CASCADE",
    },
    project_id: {
      type: "integer",
      references: '"projects"',
      onDelete: "CASCADE",
    },
    matched_count: { type: "integer", notNull: true },
    sample_logs: { type: "jsonb" }, 
    triggered_at: { type: "timestamp", default: pgm.func("NOW()") },
    acknowledged: { type: "boolean", default: false },
  });

  pgm.createIndex("alert_rules", ["project_id", "enabled"], {
    name: "idx_alert_rules_project",
  });

  pgm.createIndex("alert_triggers", ["project_id", "triggered_at"], {
    name: "idx_alert_triggers_project",
    order: { triggered_at: "DESC" },
  });
};

exports.down = async (pgm) => {
  pgm.dropTable("alert_triggers");
  pgm.dropTable("alert_rules");
};
