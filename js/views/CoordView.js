import { state } from '../models/StateModel.js';
import { DATA } from '../models/DatabaseModel.js';
import { coordAcompanhamento, coordChamados } from './UIComponents.js';

export const CoordView = {
    getAcompanhamentoHtml: coordAcompanhamento,
    getChamadosHtml: coordChamados
};