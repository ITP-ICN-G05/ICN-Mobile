// Polyfill TextEncoder/TextDecoder for MSW
import { TextEncoder, TextDecoder } from 'util';
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('*/api/companies', () => {
    return HttpResponse.json([
      { id: 'c1', name: 'Alpha Steel', sectors: ['Manufacturing'], bookmarked: false },
      { id: 'c2', name: 'Beta Health', sectors: ['Healthcare'], bookmarked: true },
    ]);
  }),
];

export const server = setupServer(...handlers);
export { http };