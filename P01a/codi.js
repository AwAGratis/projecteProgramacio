import { App } from './src/App.js'; // Importem el component App
// Importem només els altres mòduls locals
import { PokemonTeamViewModel } from './viewModel.js'; // Mantén esta importación si es necesaria en otros contextos

document.addEventListener('DOMContentLoaded', () => {
    Vue.createApp(App).mount('#app'); // Monta Vue en el contenedor con ID "app"
    console.log('Vue.js App initialized successfully.');
});
