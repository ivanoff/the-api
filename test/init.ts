import { beforeAll, afterAll } from "bun:test";
import { TestClient } from './lib';
import { TheAPI } from '../src';

const theAPI = new TheAPI();
await theAPI.init();
const { app } = theAPI;
const c = new TestClient({ app });

beforeAll(async () => {
  await c.deleteTables();
});

afterAll(async () => {
  await c.deleteTables();
});