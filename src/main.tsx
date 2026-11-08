import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'


import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/site.css'
/* The product row's styles live here, not with the component that first needed
   them: they are the home page's, and a route-split import would have left the
   row unstyled until the textiles page happened to load. */
import './styles/products.css'
import './styles/journey.css'
import './styles/posters.css'
import './styles/logo-intro.css'
import './styles/mobile.css'

if (import.meta.env.MODE === 'posters') {
  import('./dev/PosterCapture').then(({default: Capture}) => ReactDOM.createRoot(document.getElementById('root')!).render(<Capture />))
} else ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
