const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const sourcePath = path.join(__dirname, 'site/index.html');
const html = fs.readFileSync(sourcePath, 'utf8');
const match = html.match(/const playlistData\s*=\s*(\[[\s\S]*?\n    \]);/);
assert(match, 'Playlist data declaration not found');
// Evaluate only the local playlist declaration, never the HTML application.
const playlist = vm.runInNewContext(`(${match[1]})`, Object.create(null), {
  timeout: 1000,
  contextCodeGeneration: {strings: false, wasm: false}
});
const destination = path.join(__dirname, 'knowledge-base');
const segmentsPath = path.join(destination, 'segments');
fs.mkdirSync(segmentsPath, {recursive: true});

const formatTime = seconds => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
const records = [];
for (const video of playlist) {
  assert(/^[A-Za-z0-9_-]{11}$/.test(video.videoId), 'Invalid video ID');
  for (const [index, segment] of video.timeline.entries()) {
    assert(Number.isInteger(segment.start) && segment.start >= 0, 'Invalid timestamp');
    const record = {
      id: `walrus-${video.ep.replace('.', '-')}-${String(index + 1).padStart(2, '0')}`,
      episode: video.ep,
      video_id: video.videoId,
      video_title: video.title,
      segment_title: segment.title,
      start_seconds: segment.start,
      timestamp: formatTime(segment.start),
      keywords: [...segment.tags],
      description: segment.text,
      youtube_url: `https://www.youtube.com/watch?v=${video.videoId}`,
      youtube_timestamp_url: `https://www.youtube.com/watch?v=${video.videoId}&t=${segment.start}s`,
      source_file: 'site/index.html',
      source_type: 'html_preset_timeline',
      verification_status: 'not_independently_verified'
    };
    record.content = [
      `# ${record.episode}｜${record.segment_title}`,
      '',
      `文件編號：${record.id}`,
      `影片名稱：${record.video_title}`,
      `片段主題：${record.segment_title}`,
      `開始時間：${record.timestamp}（${record.start_seconds} 秒）`,
      `關鍵字：${record.keywords.join('、')}`,
      '',
      '內容說明：',
      record.description,
      '',
      `觀看此片段：${record.youtube_timestamp_url}`,
      `完整影片：${record.youtube_url}`,
      '',
      '來源：HTML 預置教學時間軸；說明與時間點尚未逐項核對原片，不是自動辨識逐字稿。',
      ''
    ].join('\n');
    records.push(record);
  }
}

assert.equal(records.length, 36);
assert.equal(new Set(records.map(record => record.id)).size, records.length);
for (const record of records) {
  const url = new URL(record.youtube_timestamp_url);
  assert.equal(url.searchParams.get('v'), record.video_id);
  assert.equal(url.searchParams.get('t'), `${record.start_seconds}s`);
  assert(record.content.includes(record.youtube_timestamp_url));
  fs.writeFileSync(path.join(segmentsPath, `${record.id}.md`), record.content, 'utf8');
}

fs.writeFileSync(path.join(destination, 'walrus-knowledge.md'), records.map(record => record.content).join('\n---\n\n'), 'utf8');
fs.writeFileSync(path.join(destination, 'walrus-knowledge.json'), JSON.stringify({
  schema_version: '1.0',
  title: 'WALRUS DIY 維修教學影片知識庫',
  source: 'site/index.html',
  video_count: playlist.length,
  segment_count: records.length,
  records
}, null, 2) + '\n', 'utf8');
fs.writeFileSync(path.join(destination, 'walrus-knowledge.jsonl'), records.map(record => JSON.stringify(record)).join('\n') + '\n', 'utf8');

const csvColumns = ['id', 'episode', 'video_title', 'segment_title', 'timestamp', 'start_seconds', 'keywords', 'description', 'youtube_timestamp_url', 'verification_status'];
const csvCell = value => '"' + String(Array.isArray(value) ? value.join('、') : value).replace(/"/g, '""') + '"';
fs.writeFileSync(path.join(destination, 'walrus-knowledge.csv'), '\uFEFF' + [
  csvColumns.map(csvCell).join(','),
  ...records.map(record => csvColumns.map(column => csvCell(record[column])).join(','))
].join('\r\n') + '\r\n', 'utf8');

console.log(`Exported ${playlist.length} videos / ${records.length} segments. All timestamp links match their source records.`);
