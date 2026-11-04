import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

import '@fontsource-variable/fraunces/full.css'
import '@fontsource-variable/fraunces/full-italic.css'
import '@fontsource-variable/newsreader/index.css'
import '@fontsource-variable/newsreader/wght-italic.css'
import '@fontsource-variable/instrument-sans/index.css'
import '@fontsource-variable/chivo-mono/index.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/site.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
