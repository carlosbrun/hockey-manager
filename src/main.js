import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/js/all.js';
import 'material-design-icons-iconfont/dist/material-design-icons.css';

// Imprime las variables de entorno
console.log('API URL:', process.env.VUE_APP_API_URL);

createApp(App).use(router).mount('#app');
