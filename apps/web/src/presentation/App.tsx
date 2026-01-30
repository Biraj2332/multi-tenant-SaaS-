import { useState } from 'react';
import reactLogo from '../assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>TenantOps SaaS Platform</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>Click count: {count}</button>
        <p>
          Multi-tenant SaaS built with <strong>React + Vite</strong>
        </p>
        <div className="features">
          <h3>Architecture Features:</h3>
          <ul>
            <li>✅ DDD & Hexagonal Architecture</li>
            <li>✅ Monorepo with Turborepo</li>
            <li>✅ Multi-tenant SaaS</li>
            <li>✅ React 19 + TypeScript</li>
            <li>✅ NestJS Backend Ready</li>
          </ul>
        </div>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  );
}

export default App;
