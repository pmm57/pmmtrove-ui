import './assets/main.css'
import "bootstrap/dist/css/bootstrap.min.css"
import "./assets/scss/styles.css"
import "bootstrap"

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import Toast from "vue-toastification";
// Import the CSS or use your own!
import "vue-toastification/dist/index.css";
const options = {
        position: 'top-right',
        timeout: 0,
        closeOnClick: true,
        draggable: true,
        hideProgressBar: false,
    }

import App from './App.vue'
import router from './router'
import { createAuth0 } from '@auth0/auth0-vue'

const app = createApp(App)


app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: window.location.origin
    },
    useRefreshTokens: true,
	cacheLocation: "localstorage",
  })
)
app.use(createPinia())
app.use(router)
app.use(Toast, options);

app.mount('#app')
