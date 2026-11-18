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

    const loginPassword = document.getElementById('login-password');
    if(loginPassword) {
        loginPassword.addEventListener('keydown', (event) => {
            if(event.key === 'Enter') AuthController.login();
        });
    }
    
    AuthController.atualizaExplicacao();
    AuthController.atualizaLoginUsers();
}