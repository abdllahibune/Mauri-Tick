import {StrictMode, Component, ErrorInfo, ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler
window.onerror = function(msg, src, line) {
  console.error('MauriTick Error:', msg, src, line);
  return false;
};

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = {hasError: false};
  }
  static getDerivedStateFromError() { return {hasError: true}; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-black text-primary">عذراً، حدث خطأ ما</h1>
            <p className="text-gray-500">يرجى تحديث الصفحة أو المحاولة لاحقاً.</p>
            <button onClick={() => window.location.reload()} className="bg-primary text-white px-8 py-3 rounded-xl font-bold">تحديث الصفحة</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
