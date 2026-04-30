import { useState, useEffect } from 'react';
import { apiService } from '../infrastructure/api';
import { config, validateEnv } from '../config/config';
import './App.css';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: string;
}

interface ApiHealth {
  status: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
}

interface ApiConfig {
  environment: string;
  port: number;
  apiPrefix: string;
  appUrl: string;
  apiUrl: string;
  corsOrigin: string;
}

function App() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [health, setHealth] = useState<ApiHealth | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate environment variables
    if (!validateEnv()) {
      setError('Missing required environment variables. Check console for details.');
      setLoading(false);
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [healthRes, configRes, tenantsRes, usersRes] = await Promise.all([
        apiService.getHealth(),
        apiService.getConfig(),
        apiService.getTenants(),
        apiService.getUsers(),
      ]);

      setHealth(healthRes.data);
      setApiConfig(configRes.data);
      setTenants(tenantsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err: any) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <h2>Loading TenantOps...</h2>
        <p>Connecting to {config.api.url}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠️</div>
        <h2>Connection Error</h2>
        <p>{error}</p>
        <div className="debug-info">
          <p>API URL: {config.api.url}</p>
          <p>Environment: {config.app.env}</p>
          <p>Make sure the backend is running on {config.api.url}</p>
        </div>
        <button onClick={fetchData} className="retry-button">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>
            {config.app.name} <span className="version">v{config.app.version}</span>
          </h1>
          <p className="subtitle">Multi-tenant SaaS Platform</p>
          
          <div className="environment-badge">
            {config.app.env.toUpperCase()}
          </div>

          <div className="api-status">
            <div className={`status-indicator ${health?.status === 'healthy' ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              <span className="status-text">
                API: {health?.status === 'healthy' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="api-info">
              <code>{config.api.baseURL}</code>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Configuration Overview */}
        <section className="config-section">
          <h2>⚙️ Configuration</h2>
          <div className="config-grid">
            <div className="config-card">
              <h3>Frontend Config</h3>
              <ul>
                <li><strong>Environment:</strong> {config.app.env}</li>
                <li><strong>Version:</strong> {config.app.version}</li>
                <li><strong>API Base:</strong> {config.api.baseURL}</li>
                <li><strong>Debug Mode:</strong> {config.features.debug ? 'Enabled' : 'Disabled'}</li>
              </ul>
            </div>
            <div className="config-card">
              <h3>Backend Config</h3>
              <ul>
                <li><strong>Environment:</strong> {apiConfig?.environment}</li>
                <li><strong>Port:</strong> {apiConfig?.port}</li>
                <li><strong>API Prefix:</strong> {apiConfig?.apiPrefix}</li>
                <li><strong>CORS Origin:</strong> {apiConfig?.corsOrigin}</li>
              </ul>
            </div>
          </div>
        </section>

        {/* API Health Status */}
        <section className="health-section">
          <h2>💚 API Health Status</h2>
          <div className="health-card">
            <div className="health-details">
              <div className="health-item">
                <span className="label">Status:</span>
                <span className={`value status-${health?.status}`}>
                  {health?.status}
                </span>
              </div>
              <div className="health-item">
                <span className="label">Service:</span>
                <span className="value">{health?.service}</span>
              </div>
              <div className="health-item">
                <span className="label">Uptime:</span>
                <span className="value">{health?.uptime?.toFixed(2)}s</span>
              </div>
              <div className="health-item">
                <span className="label">Version:</span>
                <span className="value">{health?.version}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tenants Section */}
        <section className="tenants-section">
          <h2>🏢 Tenants ({tenants.length})</h2>
          <div className="tenants-grid">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="tenant-card">
                <h3>{tenant.name}</h3>
                <p className="tenant-slug">/{tenant.slug}</p>
                <div className="tenant-details">
                  <span className={`plan-badge ${tenant.plan}`}>
                    {tenant.plan}
                  </span>
                  <span className={`status-badge ${tenant.status}`}>
                    {tenant.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Users Section */}
        <section className="users-section">
          <h2>👥 Users ({users.length})</h2>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Tenant</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      {tenants.find(t => t.id === user.tenantId)?.name || user.tenantId}
                    </td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Connection Info */}
        <section className="info-section">
          <h2>🔗 Connection Information</h2>
          <div className="info-card">
            <h3>API Endpoints</h3>
            <ul className="endpoints-list">
              <li>
                <code>GET /health</code> - Health check
              </li>
              <li>
                <code>GET /config</code> - Configuration info
              </li>
              <li>
                <code>GET /tenants</code> - List tenants
              </li>
              <li>
                <code>GET /users</code> - List users
              </li>
              <li>
                <code>GET /docs</code> - Swagger documentation
              </li>
            </ul>
            
            <div className="links">
              <a href={`${config.api.url}/docs`} target="_blank" rel="noopener noreferrer" className="link-button">
                📚 View API Documentation
              </a>
              <a href={config.api.url} target="_blank" rel="noopener noreferrer" className="link-button">
                🔗 Open API Base URL
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          {config.app.name} • v{config.app.version} • {config.app.env} • 
          Connected to {config.api.url}
        </p>
        <p className="footer-note">
          Multi-tenant SaaS with React + NestJS • Environment variables configured
        </p>
      </footer>
    </div>
  );
}

export default App;
