import { ApiResponse, User } from '@sitera/shared';
import { Platform } from 'react-native';

const BASE_URL = Platform.select({
  ios: 'http://localhost:4000/api',
  android: 'http://10.0.2.2:4000/api',
  default: 'http://localhost:4000/api',
});

export async function getMobileUsers(groupId?: string): Promise<User[]> {
  try {
    const headers: Record<string, string> = {};
    if (groupId) {
      headers['x-group-id'] = groupId;
    }
    const res = await fetch(`${BASE_URL}/users`, { headers });
    if (!res.ok) throw new Error('API Hatası');
    const data: ApiResponse<User[]> = await res.json();
    return data.data;
  } catch {
    // Fallback sample data using updated shared model
    return [
      {
        id: 'usr_mob_1',
        groupId: 'grp_default',
        name: 'Mobil Kullanıcı',
        email: 'mobile@sitera.dev',
        role: 'member',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}
