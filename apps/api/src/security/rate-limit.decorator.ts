import { SetMetadata, CustomDecorator } from '@nestjs/common';

export interface RateLimitOptions {
  limit: number;
  ttlSeconds?: number;
}

export const RATE_LIMIT_KEY = 'rate_limit_options';

export const RateLimit = (options: RateLimitOptions): CustomDecorator<string> =>
  SetMetadata(RATE_LIMIT_KEY, options);
