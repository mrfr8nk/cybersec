const ytdl = require('ytdl-core');

function extractVideoId(url) {
  try {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

async function ytDownload(url, format = 'mp4') {
  try {
    const info = await ytdl.getInfo(url);
    let filter;
    if (format === 'mp3' || format === 'audio') {
      filter = f => f.mimeType?.includes('audio') && !f.mimeType?.includes('video');
    } else {
      filter = f => f.qualityLabel === '360p' && f.mimeType?.includes('mp4');
    }
    const fmt = ytdl.chooseFormat(info.formats, { filter: filter || 'videoandaudio', quality: format === 'mp3' ? 'highestaudio' : '360p' });
    return {
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      url: fmt.url,
      format: fmt.mimeType,
    };
  } catch (e) {
    throw new Error('YouTube download failed: ' + e.message);
  }
}

module.exports = { ytDownload, extractVideoId };
