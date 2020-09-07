const amqplib = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const { mqLink, mqQueue } = config;
let mq;

const init = async () => {
  const conn = await amqplib.connect(mqLink);
  mq = await conn.createChannel();
  await mq.assertQueue(mqQueue);
};

const send = async (message) => {
  const m = typeof message === 'string' ? { message } : message;
  m.tempQueue = uuidv4();

  mq.sendToQueue(mqQueue, Buffer.from(JSON.stringify(m)));

  await mq.assertQueue(m.tempQueue, { autoDelete: true, expires: 1000 * 30 });
  return new Promise((resolve) => mq.consume(m.tempQueue,
    (res) => resolve(res ? JSON.parse(res.content.toString()) : {})));
};

module.exports = { init, send };
