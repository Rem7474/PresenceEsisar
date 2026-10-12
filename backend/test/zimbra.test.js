import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { authenticateZimbra, uploadZimbraAttachment, sendZimbraMail, sendPresenceEmail, MailError } from '../src/zimbra.js';

const createMockZimbraServer = async (handler) => {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

test('authenticateZimbra réussit avec des identifiants valides', async () => {
  const mock = await createMockZimbraServer(async (req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const parsed = JSON.parse(body);
      assert.equal(parsed.Body.AuthRequest.account._content, 'jean@esisar.fr');
      assert.equal(parsed.Body.AuthRequest.password._content, 'secret123');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        Body: {
          AuthResponse: {
            authToken: [{ _content: 'mock_token_abc' }]
          }
        }
      }));
    });
  });

  try {
    const token = await authenticateZimbra('jean@esisar.fr', 'secret123', { baseUrl: mock.url });
    assert.equal(token, 'mock_token_abc');
  } finally {
    await mock.close();
  }
});

test('authenticateZimbra renvoie 401 si identifiants incorrects', async () => {
  const mock = await createMockZimbraServer(async (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      Body: {
        Fault: {
          Reason: { Text: 'authentication failed for [jean@esisar.fr]' },
          Detail: { Error: { Code: 'account.AUTH_FAILED' } }
        }
      }
    }));
  });

  try {
    await assert.rejects(
      async () => authenticateZimbra('jean@esisar.fr', 'bad_password', { baseUrl: mock.url }),
      (err) => {
        assert.ok(err instanceof MailError);
        assert.equal(err.status, 401);
        assert.match(err.message, /incorrect/i);
        return true;
      }
    );
  } finally {
    await mock.close();
  }
});

test('uploadZimbraAttachment extrait l\'AID correctement', async () => {
  const mock = await createMockZimbraServer(async (req, res) => {
    assert.equal(req.headers.cookie, 'ZM_AUTH_TOKEN=mock_token_abc');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end("200,'null','3e20790b-b50a-4298-b80c:774900a0'");
  });

  try {
    const aid = await uploadZimbraAttachment('mock_token_abc', {
      filename: 'attestation.pdf',
      content: Buffer.from('%PDF-test'),
      mimeType: 'application/pdf',
      baseUrl: mock.url
    });
    assert.equal(aid, '3e20790b-b50a-4298-b80c:774900a0');
  } finally {
    await mock.close();
  }
});

test('sendZimbraMail poste le message avec l\'attachement aid', async () => {
  const mock = await createMockZimbraServer(async (req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const parsed = JSON.parse(body);
      const m = parsed.Body.SendMsgRequest.m;
      assert.equal(m.attach.aid, 'mock_aid_123');
      assert.equal(m.su._content, 'Test Sujet');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        Body: {
          SendMsgResponse: {
            m: [{ id: 'msg_1' }]
          }
        }
      }));
    });
  });

  try {
    const ok = await sendZimbraMail('mock_token_abc', {
      to: 'dest@esisar.fr',
      cc: 'jean@esisar.fr',
      subject: 'Test Sujet',
      bodyText: 'Corps du message',
      aid: 'mock_aid_123',
      baseUrl: mock.url
    });
    assert.equal(ok, true);
  } finally {
    await mock.close();
  }
});

const withMockPresenceServer = async (run) => {
  let sentRecipients = null;
  const mock = await createMockZimbraServer(async (req, res) => {
    if (req.url === '/service/soap') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        const parsed = JSON.parse(body);
        if (parsed.Body.AuthRequest) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            Body: { AuthResponse: { authToken: [{ _content: 'token_mock' }] } }
          }));
        } else if (parsed.Body.SendMsgRequest) {
          sentRecipients = parsed.Body.SendMsgRequest.m.e;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            Body: { SendMsgResponse: { m: [{ id: 'ok_msg' }] } }
          }));
        }
      });
    } else if (req.url.startsWith('/service/upload')) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end("200,'0','aid_mock'");
    }
  });

  try {
    await run(mock.url, () => sentRecipients);
  } finally {
    await mock.close();
  }
};

test('sendPresenceEmail orchestre le flux complet Zimbra avec succès', async () => {
  await withMockPresenceServer(async (url, getRecipients) => {
    await sendPresenceEmail({
      name: 'Alice Martin',
      email: 'alice@esisar.fr',
      password: 'password123',
      filename: 'Attestation.pdf',
      subject: 'Feuille de présence',
      content: Buffer.from('%PDF-orchestration'),
      mimeType: 'application/pdf',
      baseUrl: url
    });
    assert.deepEqual(getRecipients(), [
      { t: 't', a: 'apprentissage@esisar.grenoble-inp.fr' },
      { t: 'c', a: 'alice@esisar.fr' }
    ]);
  });
});

test('sendPresenceEmail n\'ajoute pas de copie quand cc est faux', async () => {
  await withMockPresenceServer(async (url, getRecipients) => {
    await sendPresenceEmail({
      name: 'Alice Martin',
      email: 'alice@esisar.fr',
      password: 'password123',
      filename: 'Attestation.pdf',
      subject: 'Feuille de présence',
      content: Buffer.from('%PDF-orchestration'),
      cc: false,
      mimeType: 'application/pdf',
      baseUrl: url
    });
    assert.deepEqual(getRecipients(), [
      { t: 't', a: 'apprentissage@esisar.grenoble-inp.fr' }
    ]);
  });
});


