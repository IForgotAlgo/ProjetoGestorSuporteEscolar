import { AuthController } from '../controllers/AuthController.js';

export function renderAuthView() {
    // Configura os event listeners da tela de login
    document.querySelectorAll('.role-opt').forEach(o => {
        o.addEventListener('click', () => {
            AuthController.selecionaRole(o.dataset.role, o);
        });
    });
    
    const loginForm = document.getElementById('login-form');
    if(loginForm) loginForm.addEventListener('submit', event => {
        event.preventDefault();
        AuthController.login();
    });
    
    AuthController.atualizaExplicacao();
    AuthController.atualizaLoginUsers();
}