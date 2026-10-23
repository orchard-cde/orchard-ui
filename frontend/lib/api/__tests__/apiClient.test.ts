import type { AxiosAdapter } from 'axios';
import { apiClient } from '../apiClient';

const unauthorizedAdapter: AxiosAdapter = (config) =>
  Promise.reject(
    Object.assign(new Error('Request failed with status code 401'), {
      config,
      isAxiosError: true,
      response: { status: 401, data: {}, headers: {}, config },
    })
  );

const settle = (request: Promise<unknown>) =>
  Promise.race([
    request.then(
      () => 'resolved',
      () => 'rejected'
    ),
    new Promise<string>((resolve) => setTimeout(() => resolve('pending'), 50)),
  ]);

describe('apiClient 401 handling', () => {
  beforeEach(() => {
    apiClient.defaults.adapter = unauthorizedAdapter;
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('rejects instead of redirecting while on /signin', async () => {
    window.history.pushState({}, '', '/signin');
    await expect(settle(apiClient.get('/api/groves'))).resolves.toBe('rejected');
  });

  it('rejects instead of redirecting when /auth/session itself returns 401', async () => {
    await expect(settle(apiClient.get('/auth/session'))).resolves.toBe('rejected');
  });

  it('redirects other 401s away from the current page', async () => {
    await expect(settle(apiClient.get('/api/groves'))).resolves.toBe('pending');
  });
});
