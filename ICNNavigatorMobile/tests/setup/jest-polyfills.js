// Polyfills for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
const { ReadableStream, TransformStream } = require('stream/web');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;

// Mock BroadcastChannel
global.BroadcastChannel = class BroadcastChannel {
  constructor(name) {
    this.name = name;
  }
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
};

// Mock Request and Response
global.Request = class Request {
  constructor(url, options = {}) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = options.headers || {};
  }
  clone() { return this; }
};

global.Response = class Response {
  constructor(body, options = {}) {
    this.status = options.status || 200;
    this.statusText = options.statusText || 'OK';
    this.headers = options.headers || {};
    this.body = body;
  }
  static json(data) {
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  clone() { return this; }
};

// Mock fetch for MSW
require('whatwg-fetch');