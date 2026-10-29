import { state } from '../models/StateModel.js';
import { DATA } from '../models/DatabaseModel.js';
import { adminDashboard, adminUsuarios, adminSalas, adminChamados } from './UIComponents.js';

export const AdminView = {
    getDashboardHtml: adminDashboard,
    getUsuariosHtml: adminUsuarios,
    getSalasHtml: adminSalas,
    getChamadosHtml: adminChamados
};