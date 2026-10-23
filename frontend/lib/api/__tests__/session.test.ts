import { apiClient } from '../apiClient';
import { getSession } from '../session';

jest.mock('../apiClient', () => ({ apiClient: { get: jest.fn() } }));

describe('getSession', () => {
  it('requests /auth/session and returns the body', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { enabled: true, authenticated: false },
    });

    await expect(getSession()).resolves.toEqual({
      enabled: true,
      authenticated: false,
    });
    expect(apiClient.get).toHaveBeenCalledWith('/auth/session');
  });
});
