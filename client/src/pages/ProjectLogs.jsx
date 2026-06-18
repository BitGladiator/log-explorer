import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLogs, getProjects, naturalQuery, getClusters, analyzeCluster } from '../api/client.js';
import useLogStream from '../hooks/useLogStream.js';
import LogRow from '../components/LogRow.jsx';
import LogDetail from '../components/LogDetail.jsx';
import NaturalQueryBar from '../components/NaturalQueryBar.jsx';
import ClusterCard from '../components/ClusterCard.jsx';

const LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];

const ProjectLogs = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [historicalLogs, setHistoricalLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [activeTab, setActiveTab] = useState('logs'); 

  const [levelFilter, setLevelFilter] = useState(new Set());
  const [serviceFilter, setServiceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  const [clusters, setClusters] = useState([]);
  const [clustersLoading, setClustersLoading] = useState(false);

  const { streamedLogs, clearStream } = useLogStream(projectId, isLive);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    getProjects().then((projects) => {
      setProject(projects.find((p) => String(p.id) === String(projectId)));
    });
  }, [projectId]);

  const loadLogs = useCallback(() => {
    setLoading(true);
    const params = { limit: 200 };
    if (levelFilter.size > 0) params.level = [...levelFilter][0];
    if (serviceFilter) params.service = serviceFilter;
    if (debouncedSearch) params.search = debouncedSearch;

    getLogs(projectId, params)
      .then((res) => setHistoricalLogs(res.logs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId, levelFilter, serviceFilter, debouncedSearch]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const loadClusters = useCallback(() => {
    setClustersLoading(true);
    getClusters(projectId, { sinceHours: 24, limit: 20 })
      .then(setClusters)
      .catch(console.error)
      .finally(() => setClustersLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (activeTab === 'clusters') loadClusters();
  }, [activeTab, loadClusters]);

  const handleNaturalQuery = async (query) => {
    setQueryLoading(true);
    try {
      const result = await naturalQuery(projectId, query);
      setHistoricalLogs(result.logs);
      setIsLive(false);
      return result;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setQueryLoading(false);
    }
  };

  const handleAnalyzeCluster = async (clusterId) => {
    return analyzeCluster(projectId, clusterId);
  };

  const toggleLevel = (level) => {
    setLevelFilter((prev) => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const filteredStream = streamedLogs.filter((log) => {
    if (levelFilter.size > 0 && !levelFilter.has(log.level)) return false;
    if (serviceFilter && log.service !== serviceFilter) return false;
    if (debouncedSearch && !log.message.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
    return true;
  });

  const allLogs = isLive
    ? [...filteredStream, ...historicalLogs.filter((h) => !filteredStream.some((s) => s.id === h.id))]
    : historicalLogs;

  const services = [...new Set([...historicalLogs, ...streamedLogs].map((l) => l.service).filter(Boolean))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
          <h1 style={{ fontSize: '15px', fontWeight: '600', color: '#1a202c', margin: 0 }}>{project?.name || 'Loading...'}</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => navigate(`/projects/${projectId}/settings`)} style={{ fontSize: '12px', color: '#718096', background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}>
            Settings
          </button>
          <button
            onClick={() => { setIsLive((v) => !v); if (!isLive) clearStream(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500', color: isLive ? '#276749' : '#718096', background: isLive ? '#F0FFF4' : '#F7FAFC', border: `1px solid ${isLive ? '#9AE6B4' : '#e2e8f0'}`, borderRadius: '6px', padding: '5px 12px', cursor: 'pointer' }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLive ? '#38A169' : '#a0aec0' }} />
            {isLive ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '10px 20px 0', flexShrink: 0 }}>
        {['logs', 'clusters'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ padding: '7px 16px', fontSize: '13px', fontWeight: '500', border: 'none', borderBottom: activeTab === tab ? '2px solid #2d3748' : '2px solid transparent', background: 'none', color: activeTab === tab ? '#1a202c' : '#a0aec0', cursor: 'pointer' }}
          >
            {tab === 'logs' ? 'Live logs' : 'Error clusters'}
          </button>
        ))}
      </div>

      {activeTab === 'logs' && (
        <>
          <div style={{ padding: '12px 20px 8px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <NaturalQueryBar onQuery={handleNaturalQuery} loading={queryLoading} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, minWidth: '180px', padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '13px', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '5px' }}>
              {LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', padding: '5px 10px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', borderColor: levelFilter.has(level) ? '#2d3748' : '#e2e8f0', background: levelFilter.has(level) ? '#2d3748' : '#fff', color: levelFilter.has(level) ? '#fff' : '#718096' }}
                >
                  {level}
                </button>
              ))}
            </div>
            {services.length > 0 && (
              <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', color: '#4a5568', cursor: 'pointer', outline: 'none' }}>
                <option value="">All services</option>
                {services.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
            {loading && historicalLogs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>Loading logs...</div>
            ) : allLogs.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>No logs found.</div>
            ) : (
              allLogs.map((log, i) => <LogRow key={log.id || i} log={log} onClick={setSelectedLog} />)
            )}
          </div>

          <div style={{ padding: '8px 20px', fontSize: '11px', color: '#a0aec0', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
            {allLogs.length} logs shown {isLive && '· streaming live'}
          </div>
        </>
      )}

      {activeTab === 'clusters' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#FAFBFC' }}>
          <p style={{ fontSize: '12px', color: '#a0aec0', margin: '0 0 14px' }}>
            Similar errors grouped together — last 24 hours
          </p>
          {clustersLoading ? (
            <div style={{ color: '#a0aec0', fontSize: '13px' }}>Loading clusters...</div>
          ) : clusters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#a0aec0', fontSize: '13px', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
              No recurring errors in the last 24 hours.
            </div>
          ) : (
            clusters.map((cluster) => (
              <ClusterCard key={cluster.id} cluster={cluster} onAnalyze={handleAnalyzeCluster} />
            ))
          )}
        </div>
      )}

      <LogDetail log={selectedLog} onClose={() => setSelectedLog(null)} />

    </div>
  );
};

export default ProjectLogs;