exports.up = async (pgm) => {
  pgm.createTable("error_clusters", {
    id: { type: "serial", primaryKey: true },
    project_id: {
      type: "integer",
      references: '"projects"',
      onDelete: "CASCADE",
    },
    cluster_key: { type: "varchar(64)", notNull: true },
    representative_message: { type: "text", notNull: true },
    level: { type: "varchar(10)", notNull: true },
    service: { type: "varchar(100)" },
    occurrence_count: { type: "integer", default: 1 },
    first_seen: { type: "timestamptz", notNull: true },
    last_seen: { type: "timestamptz", notNull: true },
    ai_summary: { type: "text" },
    ai_likely_cause: { type: "text" },
  });

  pgm.addConstraint(
    "error_clusters",
    "error_clusters_project_key_unique",
    "UNIQUE (project_id, cluster_key)"
  );

  pgm.createIndex("error_clusters", ["project_id", "last_seen"], {
    name: "idx_clusters_project_last_seen",
    order: { last_seen: "DESC" },
  });
};

exports.down = async (pgm) => {
  pgm.dropTable("error_clusters");
};
