import { createApp } from 'vue';
import router from './router';
import App from './App.vue';

// 创建Vue应用并使用路由器
const app = createApp(App);
app.use(router);
app.mount('#app');
