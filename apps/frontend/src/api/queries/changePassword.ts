import { apiRequest } from '../apiRequest';

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
  await apiRequest('/users/me/password', {
    method: 'PATCH',
    body: payload,
  });
};
