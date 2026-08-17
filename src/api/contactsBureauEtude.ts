import api from './index';
import { ContactBureauEtudeDTO, CreateBureauEtudeAdminPayload, PageResponse } from '../types';

export const submitContactBureauEtude = async (payload: Omit<ContactBureauEtudeDTO, 'id'|'version'|'createdAt'>) => {
  await api.post('/contacts-bureaux-etudes', payload);
};
export const listContactsBureauEtude = async (page=0,size=25,search='',archived=false): Promise<PageResponse<ContactBureauEtudeDTO>> =>
  (await api.get('/admin/contacts-bureaux-etudes',{params:{page,size,search:search||undefined,archived}})).data;
export const getContactBureauEtude = async (id:number): Promise<ContactBureauEtudeDTO> =>
  (await api.get(`/admin/contacts-bureaux-etudes/${id}`)).data;
export const markContacted = async (id:number) => { await api.patch(`/admin/contacts-bureaux-etudes/${id}/contacted`); };
export const setContactArchived = async (id:number,value:boolean) => { await api.patch(`/admin/contacts-bureaux-etudes/${id}/archived`,undefined,{params:{value}}); };
export const createBureauEtudeAdmin = async (payload:CreateBureauEtudeAdminPayload) =>
  (await api.post('/admin/bureaux-etudes',payload)).data;
export const validateAccountInvitation = async (token:string) => { await api.get('/account-invitations/validate',{params:{token}}); };
export const acceptAccountInvitation = async (token:string,password:string) => { await api.post('/account-invitations/accept',{token,password}); };
