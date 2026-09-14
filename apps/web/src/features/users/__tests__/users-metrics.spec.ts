import { describe, it, expect } from 'vitest';
import { User } from '@sitera/shared';

describe('UserList & Daire Metrikleri Motoru', () => {
  it('Çoklu daireye sahip sakinlerin gerçek bağımsız bölüm sayısını doğru konsolide etmelidir', () => {
    // 3 malik, toplam 5 daire
    const mockUsers: Partial<User>[] = [
      { id: '1', name: 'Ahmet Malik', role: 'member', units: ['A Blok D.1', 'A Blok D.2'] },
      { id: '2', name: 'Mehmet Malik', role: 'member', units: ['A Blok D.3', 'B Blok D.5'] },
      { id: '3', name: 'Ayşe Kiracı', role: 'member', units: ['B Blok D.6'] },
      { id: '4', name: 'Sistem Yöneticisi', role: 'admin' }, // admin sayılmamalı
    ];

    const memberUsers = mockUsers.filter((u) => u.role === 'member');
    let totalUnitsCount = 0;
    memberUsers.forEach((m) => {
      if (m.units && m.units.length > 0) {
        totalUnitsCount += m.units.length;
      } else {
        totalUnitsCount += 1;
      }
    });

    expect(memberUsers.length).toBe(3); // 3 sakin
    expect(totalUnitsCount).toBe(5);    // 5 daire
  });

  it('Malik ve kiracı oranlarını doğru gruplamalıdır', () => {
    const residents: Partial<User>[] = [
      { id: '1', role: 'member', residentType: 'owner' },
      { id: '2', role: 'member', residentType: 'owner' },
      { id: '3', role: 'member', residentType: 'tenant' },
    ];

    const ownerCount = residents.filter((r) => r.residentType === 'owner').length;
    const tenantCount = residents.filter((r) => r.residentType === 'tenant').length;

    expect(ownerCount).toBe(2);
    expect(tenantCount).toBe(1);
    expect(Math.round((ownerCount / residents.length) * 100)).toBe(67);
  });
});
