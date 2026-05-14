const axios = require('axios');

async function igDownload(url) {
  try {
    const res = await axios.get(`https://api.cobalt.tools/api/json`, {
      params: { url },
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
    });
    if (res.data && res.data.url) {
      return { url: res.data.url, filename: res.data.filename || 'instagram_media' };
    }
    throw new Error('No media URL returned');
  } catch (e) {
    throw new Error('Instagram download failed: ' + e.message);
  }
}

module.exports = { igDownload };
