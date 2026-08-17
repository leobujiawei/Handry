import React from 'react'; import {createRoot} from 'react-dom/client'; import './styles.css'; import './platform.css'; import './canvas.css'; import './layout-fixes.css'; import './element-tree.css'; import App from './App'
document.documentElement.dataset.platform=window.visualEditor.platform
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
