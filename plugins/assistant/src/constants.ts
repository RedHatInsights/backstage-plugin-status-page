import pkg from '../package.json';

export const SESSION_STORE_KEY = `${pkg.name}::threadId`;
export const SESSION_HEADER_KEY = 'x-assistant-thread-id';
