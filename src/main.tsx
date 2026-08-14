import React from 'react'; import {createRoot} from 'react-dom/client'; import './styles.css'; import './canvas.css'; import './layout-fixes.css'; import App from './App'
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
