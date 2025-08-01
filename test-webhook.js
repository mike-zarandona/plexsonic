#!/usr/bin/env node

const testPayload = {
  event: 'media.play',
  user: true,
  owner: true,
  Account: {
    id: 1,
    thumb: 'https://plex.tv/users/123/avatar',
    title: 'themikez'
  },
  Server: {
    title: 'Test Server',
    uuid: 'test-server-uuid'
  },
  Player: {
    local: true,
    publicAddress: '192.168.1.100',
    title: 'Test Player',
    uuid: 'test-player-uuid'
  },
  Metadata: {
    librarySectionType: 'artist',
    ratingKey: '12345',
    key: '/library/metadata/12345',
    parentRatingKey: '12344',
    grandparentRatingKey: '12343',
    guid: 'local://12345',
    librarySectionID: 1,
    type: 'track',
    title: 'Test Song',
    grandparentKey: '/library/metadata/12343',
    parentKey: '/library/metadata/12344',
    grandparentTitle: 'Test Artist',
    parentTitle: 'Test Album',
    summary: 'A test song for debugging',
    index: 1,
    parentIndex: 1,
    ratingCount: 100,
    thumb: '/library/metadata/12344/thumb/1234567890',
    art: '/library/metadata/12343/art/1234567890',
    parentThumb: '/library/metadata/12344/thumb/1234567890',
    grandparentThumb: '/library/metadata/12343/thumb/1234567890',
    grandparentArt: '/library/metadata/12343/art/1234567890',
    addedAt: Date.now() / 1000,
    updatedAt: Date.now() / 1000,
    parentYear: 2024
  }
};

async function sendWebhook() {
  try {
    const response = await fetch('http://localhost:3001/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload: JSON.stringify(testPayload) })
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Error sending webhook:', error);
  }
}

sendWebhook();