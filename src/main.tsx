import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useEditorStore } from './store/useEditorStore';

if (typeof window !== 'undefined') {
  (window as any).__editorStore = useEditorStore;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
