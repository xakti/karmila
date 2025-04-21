import './style.css'
import 'primeicons/primeicons.css'

import {createApp} from 'vue'
import {createWebHistory, createRouter} from 'vue-router'
import PrimeVue from "primevue/config"
import Aura from "@primeuix/themes/aura"
import ToastService from "primevue/toastservice";
import Tooltip from 'primevue/tooltip';
import routes from "./js/routes.js"
import App from './App.vue'

const router = createRouter({
    history: createWebHistory(),
    routes,
});

const app = createApp(App);
app.use(
    PrimeVue, {
        theme: {
            preset: Aura,
            options: {
                darkModeSelector: '.ui-dark'
            }
        }
    }
);
app.use(ToastService);
app.use(router);
app.directive("tooltip", Tooltip);
app.mount('#app');
