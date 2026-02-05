const { createSlackClient, validateToken, setPresence, setStatus } = require('./slack');

describe('slack', () => {
  test('createSlackClient returns client with token', () => {
    const client = createSlackClient('xoxp-test-token');
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  test('validateToken calls auth.test', async () => {
    const mockClient = {
      auth: {
        test: jest.fn().mockResolvedValue({ ok: true, user: 'testuser' })
      }
    };
    const result = await validateToken(mockClient);
    expect(mockClient.auth.test).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, user: 'testuser' });
  });

  test('setPresence calls users.setPresence', async () => {
    const mockClient = {
      users: {
        setPresence: jest.fn().mockResolvedValue({ ok: true })
      }
    };
    await setPresence(mockClient);
    expect(mockClient.users.setPresence).toHaveBeenCalledWith({ presence: 'auto' });
  });

  test('setStatus calls users.profile.set', async () => {
    const mockClient = {
      users: {
        profile: {
          set: jest.fn().mockResolvedValue({ ok: true })
        }
      }
    };
    await setStatus(mockClient, ':coffee:', 'Break time');
    expect(mockClient.users.profile.set).toHaveBeenCalledWith({
      profile: {
        status_emoji: ':coffee:',
        status_text: 'Break time'
      }
    });
  });
});
