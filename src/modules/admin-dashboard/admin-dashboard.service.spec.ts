import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  it('uses RPC result when available', async () => {
    const rpcPayload = {
      usersByRole: { DRIVER: 2 },
      usersByStatus: { ACTIVE: 5 },
      pendingVerifications: 1,
    };

    const supabase = {
      admin: {
        rpc: jest.fn().mockResolvedValue({ data: rpcPayload, error: null }),
        from: jest.fn(),
      },
    };

    const service = new AdminDashboardService(supabase as never);
    const result = await service.getReports();

    expect(supabase.admin.rpc).toHaveBeenCalledWith('admin_dashboard_reports', expect.any(Object));
    expect(result.usersByRole).toEqual({ DRIVER: 2 });
    expect(result.generatedAt).toBeDefined();
  });

  it('falls back to legacy aggregation when RPC missing', async () => {
    const supabase = {
      admin: {
        rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'function not found' } }),
        from: (table: string) => {
          const chain = {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            then: undefined as unknown,
          };

          if (table === 'profiles') {
            return {
              select: (cols: string, opts?: { count?: string; head?: boolean }) => {
                if (opts?.head) {
                  return {
                    eq: () => Promise.resolve({ count: 3, error: null, data: null }),
                  };
                }
                if (cols === 'role') {
                  return Promise.resolve({ data: [{ role: 'DRIVER' }, { role: 'DRIVER' }], error: null });
                }
                if (cols === 'status') {
                  return Promise.resolve({ data: [{ status: 'ACTIVE' }], error: null });
                }
                return Promise.resolve({ data: [], error: null });
              },
            };
          }

          if (table === 'appointments') {
            return {
              select: (cols: string) => {
                if (cols === 'type') {
                  return Promise.resolve({ data: [{ type: 'HEALTH' }], error: null });
                }
                return Promise.resolve({ data: [{ status: 'PENDING' }], error: null });
              },
            };
          }

          if (table === 'payments' || table === 'finance_records') {
            const rows =
              table === 'payments'
                ? [{ amount: 100, status: 'SUCCESS' }]
                : [{ type: 'INCOME', amount: 50 }];
            return {
              select: () => ({
                gte: () => Promise.resolve({ data: rows, error: null }),
              }),
            };
          }

          return chain;
        },
      },
    };

    const service = new AdminDashboardService(supabase as never);
    const result = await service.getReports();

    expect(result.usersByRole).toEqual({ DRIVER: 2 });
    expect(result.appointmentsByType).toEqual({ HEALTH: 1 });
    expect(result.pendingVerifications).toBe(3);
  });
});
