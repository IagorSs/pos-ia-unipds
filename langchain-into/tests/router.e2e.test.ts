import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from '../src/server.ts';

test('command upper transforms message into UPPERCASE', async () => {
    const app = createServer();

    const msg = 'make This message UPPER please!';
    const expected = msg.toUpperCase();

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: {
            question: msg
        }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, expected);
});

test('command lower transforms message into LOWERCASE', async () => {
    const app = createServer();

    const msg = 'MAKE THIS MESSAGE loWER PLEASE!';
    const expected = msg.toLowerCase();

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: {
            question: msg
        }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, expected);
});

test('unknown command should return help message to user', async () => {
    const app = createServer();

    const msg = 'Hey there!';
    const expected = "Unknown command. Try some message containing 'upper' or 'lower'.";

    const response = await app.inject({
        method: 'POST',
        url: '/chat',
        body: {
            question: msg
        }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body, expected);
});
