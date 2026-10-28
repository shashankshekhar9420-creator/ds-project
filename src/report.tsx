import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReportView } from './components/ReportView';
import './index.css';

const rootElement = document.getElementById('report-root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ReportView isStandalonePage={true} />
    </StrictMode>
  );
}
