import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  groupId?: string;
  userId?: string;
  userRole?: string;
  timestamp: number;
}

const asyncLocalStorage = new AsyncLocalStorage<TenantContextData>();

export class TenantContext {
  static run<T>(data: TenantContextData, callback: () => T): T {
    return asyncLocalStorage.run(data, callback);
  }

  static get(): TenantContextData | undefined {
    return asyncLocalStorage.getStore();
  }

  static getGroupId(): string | undefined {
    return asyncLocalStorage.getStore()?.groupId;
  }

  static getUserRole(): string | undefined {
    return asyncLocalStorage.getStore()?.userRole;
  }

  static getUserId(): string | undefined {
    return asyncLocalStorage.getStore()?.userId;
  }
}
