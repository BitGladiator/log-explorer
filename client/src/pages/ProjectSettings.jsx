import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProjects, rotateApiKey, deleteProject } from "../api/client.js";

const ProjectSettings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    getProjects().then((projects) => {
      setProject(projects.find((p) => String(p.id) === String(projectId)));
    });
  }, [projectId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(project.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRotate = async () => {
    if (
      !confirm(
        "Rotating will invalidate the current key immediately. Continue?"
      )
    )
      return;
    setRotating(true);
    try {
      const updated = await rotateApiKey(projectId);
      setProject((p) => ({ ...p, api_key: updated.api_key }));
    } finally {
      setRotating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this project and all its logs permanently?")) return;
    await deleteProject(projectId);
    navigate("/dashboard");
  };

  if (!project)
    return <div style={{ padding: "40px", color: "#a0aec0" }}>Loading...</div>;

  const curlExample = `curl -X POST ${
    import.meta.env.VITE_API_URL
  }/api/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${project.api_key}" \\
  -d '{"logs":[{"level":"info","message":"Hello from my app","service":"api"}]}'`;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 24px" }}>
      <button
        onClick={() => navigate(`/projects/${projectId}`)}
        style={{
          background: "none",
          border: "none",
          color: "#718096",
          cursor: "pointer",
          fontSize: "13px",
          padding: 0,
          marginBottom: "24px",
        }}
      >
        ← Back to logs
      </button>

      <h1
        style={{
          fontSize: "20px",
          fontWeight: "600",
          color: "#1a202c",
          margin: "0 0 4px",
        }}
      >
        {project.name}
      </h1>
      <p style={{ fontSize: "13px", color: "#718096", margin: "0 0 32px" }}>
        Project settings
      </p>

      <div
        style={{
          background: "#F7FAFC",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#718096",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: "0 0 12px",
          }}
        >
          API key
        </h3>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <code
            style={{
              flex: 1,
              background: "#1a202c",
              color: "#68D391",
              padding: "10px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {project.api_key}
          </code>
          <button
            onClick={handleCopy}
            style={{
              padding: "0 16px",
              background: copied ? "#276749" : "#2d3748",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <button
          onClick={handleRotate}
          disabled={rotating}
          style={{
            fontSize: "12px",
            color: "#9B2335",
            background: "none",
            border: "1px solid #FEB2B2",
            borderRadius: "6px",
            padding: "5px 12px",
            cursor: rotating ? "not-allowed" : "pointer",
          }}
        >
          {rotating ? "Rotating..." : "Rotate key"}
        </button>
      </div>

      <div
        style={{
          background: "#F7FAFC",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#718096",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: "0 0 12px",
          }}
        >
          Send your first log
        </h3>
        <pre
          style={{
            background: "#1a202c",
            color: "#cbd5e0",
            padding: "14px",
            borderRadius: "8px",
            fontSize: "11px",
            overflowX: "auto",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {curlExample}
        </pre>
      </div>

      <div
        style={{
          background: "#FFF5F5",
          border: "1px solid #FEB2B2",
          borderRadius: "12px",
          padding: "20px",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#9B2335",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            margin: "0 0 12px",
          }}
        >
          Danger zone
        </h3>
        <button
          onClick={handleDelete}
          style={{
            fontSize: "13px",
            color: "#fff",
            background: "#C53030",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          Delete project
        </button>
      </div>
    </div>
  );
};

export default ProjectSettings;
