import './assets/main.css'
import "bootstrap/dist/css/bootstrap.min.css"
import "./assets/scss/styles.css"
import "bootstrap"
import { shouldUseAuth0 } from '@/auth/authMode'

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

if (shouldUseAuth0) {
    app.use(
        createAuth0({
            domain: import.meta.env.VITE_AUTH0_DOMAIN,
            clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
            authorizationParams: {
            redirect_uri: import.meta.env.VITE_AUTH0_REDIRECT_URI
            },
            useRefreshTokens: true,
            cacheLocation: "localstorage",
        })
    )
} else {
   console.log('Auth0 disabled — using mockAuth')
}


app.use(createPinia())
app.use(router)
app.use(Toast, options);

app.mount('#app')
