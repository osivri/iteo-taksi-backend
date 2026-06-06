import { BadRequestException } from '@nestjs/common';
import { RatingsService } from './ratings.service';

describe('RatingsService', () => {
  it('rejects reused rating token', async () => {
    const supabase = {
      admin: {
        from: (table: string) => {
          if (table === 'driver_rating_tokens') {
            return {
              select: () => ({
                eq: () => ({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'tok1',
                      driver_id: 'd1',
                      is_active: true,
                      expires_at: null,
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'driver_ratings') {
            return {
              select: () => ({
                eq: () => ({
                  maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }),
                }),
              }),
            };
          }
          return {};
        },
      },
    };

    const service = new RatingsService(supabase as never);

    await expect(
      service.submitRating({ tokenId: 'tok1', score: 5 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
