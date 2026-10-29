import { state } from './models/StateModel.js';
import { AuthController } from './controllers/AuthController.js';
import { renderAuthView } from './views/AuthView.js';
import { mostraSync } from './models/DatabaseModel.js';

console.log("Iniciando a aplicação...");

// Executa a configuração inicial de imediato
renderAuthView();
mostraSync(); // Retira a mensagem de "Conectando..."
initApp();

function initApp() {
    if (!state.role) {
        const loginScreen = document.getElementById('login-screen');
        const appSide = document.getElementById('app-side');
        const appProf = document.getElementById('app-prof');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (appSide) appSide.classList.remove('active');
        if (appProf) appProf.classList.remove('active');
        
        document.body.className = '';
    } else {
        AuthController.login();
    }
}