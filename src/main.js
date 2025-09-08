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

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Toast, options);

app.mount('#app')
