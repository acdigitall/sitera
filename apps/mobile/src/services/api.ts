import { apiGetUsers, UserProfile } from '../api/client';

export const getMobileUsers = async (groupId?: string): Promise<UserProfile[]> => {
  try {
    const users = await apiGetUsers();
    if (users && users.length > 0) {
      return users;
    }
  } catch {}

  return [
    {
      id: 'usr-default',
      name: 'Mobil Kullanıcı',
      email: 'mobil@sitera.com',
      role: 'member',
      groupName: 'Sitera Vadisi',
      units: ['Daire 1'],
      flatNo: 'Daire 1',
    },
  ];
};
