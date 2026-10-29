import { state } from '../models/StateModel.js';
import { DATA } from '../models/DatabaseModel.js';
import { profInicio, profAgenda, profChamados, profHistorico } from './UIComponents.js';

export const ProfView = {
    getInicioHtml: profInicio,
    getAgendaHtml: profAgenda,
    getChamadosHtml: profChamados,
    getHistoricoHtml: profHistorico
};