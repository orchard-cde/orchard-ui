import { readCookie } from '../csrf';

describe('readCookie', () => {
  afterEach(() => {
    document.cookie = 'a=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'b=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('returns null when the cookie is missing', () => {
    expect(readCookie('missing')).toBeNull();
  });

  it('decodes a URL-encoded value', () => {
    document.cookie = 'a=x%20y%3D';
    expect(readCookie('a')).toBe('x y=');
  });

  it('finds the right cookie among several', () => {
    document.cookie = 'a=1';
    document.cookie = 'b=2';
    expect(readCookie('b')).toBe('2');
    expect(readCookie('a')).toBe('1');
  });
});
