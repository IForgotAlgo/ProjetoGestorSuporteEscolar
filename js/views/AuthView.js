import { AuthController } from '../controllers/AuthController.js';

export function renderAuthView() {
    // Configura os event listeners da tela de login
    document.querySelectorAll('.role-opt').forEach(o => {
        o.addEventListener('click', () => {
            AuthController.selecionaRole(o.dataset.role, o);
        });
    });
    
    const btnLogin = document.getElementById('btn-login');
    if(btnLogin) {
        btnLogin.addEventListener('click', () => AuthController.login());
    }
    
    AuthController.atualizaExplicacao();
    AuthController.atualizaLoginUsers();
}