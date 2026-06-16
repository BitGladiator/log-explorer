import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { logout, getProjects, createProject } from '../api/client.js';

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/login');
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const project = await createProject({ name: newName.trim() });
      setProjects((p) => [project, ...p]);
      setNewName('');
      setCreating(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1a202c', margin: 0 }}>Log Explorer</h1>
          <p style={{ fontSize: '13px', color: '#718096', margin: '4px 0 0' }}>Query your logs in plain English</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#4a5568' }}>{user?.email}</span>
          <button onClick={handleLogout} style={{ fontSize: '13px', color: '#718096', background: 'none', border: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#2d3748', margin: 0 }}>Projects</h2>
        <button
          onClick={() => setCreating(true)}
          style={{ padding: '8px 16px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
        >
          New project
        </button>
      </div>

      {creating && (
        <div style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '12px', display: 'flex', gap: '10px' }}>
          <input
            autoFocus
            type="text"
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
          />
          <button onClick={handleCreate} style={{ padding: '8px 16px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
            Create
          </button>
          <button onClick={() => setCreating(false)} style={{ padding: '8px 12px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#718096', cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#a0aec0', fontSize: '14px', padding: '40px 0' }}>Loading...</div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
          <p style={{ color: '#a0aec0', fontSize: '14px', margin: '0 0 16px' }}>No projects yet.</p>
          <button onClick={() => setCreating(true)} style={{ padding: '9px 20px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            Create your first project
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              style={{ background: '#F7FAFC', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#a0aec0'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>{project.name}</div>
                <div style={{ fontSize: '12px', color: '#718096', marginTop: '3px' }}>
                  {project.logs_today || 0} logs today
                </div>
              </div>
              <span style={{ color: '#a0aec0', fontSize: '12px' }}>→</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Dashboard;