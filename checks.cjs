const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, 'site/index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.match(html, /referrerpolicy="strict-origin-when-cross-origin"/);

for (const protocol of ['https:', 'file:']) {
  const elements = {};
  let handlers;
  let loaded;
  let opened;
  let apiScript;
  const context = {
    document: {
      getElementById: id => elements[id] ||= {
        value: '', checked: true, hidden: true, addEventListener() {}
      },
      querySelectorAll: () => [],
      createElement: () => ({}),
      head: {appendChild(script) { apiScript = script; }}
    },
    window: {
      location: {protocol, origin: 'https://example.github.io', reload() {}},
      open(url) { opened = url; }
    },
    URL, URLSearchParams, Set,
    YT: {
      Player: function (id, options) {
        handlers = options.events;
        this.cueVideoById = data => { loaded = data; };
        this.loadVideoById = data => { loaded = data; };
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  assert.match(elements.resultsCount.innerText, /36/);
  context.applyTag('小鋼珠');
  assert.match(elements.resultsCount.innerText, /3/);

  if (protocol === 'https:') {
    const embed = new URL(elements.videoPlayer.src);
    assert.equal(embed.searchParams.get('origin'), 'https://example.github.io');
    assert.equal(embed.searchParams.get('enablejsapi'), '1');
    context.onYouTubeIframeAPIReady();
    handlers.onReady();
    context.jumpToItem(0, 40);
    assert.equal(loaded.startSeconds, 40);
    handlers.onError({data: 150, target: {getVideoData: () => ({video_id: 'BlWJsZIJ8wA'})}});
    assert.equal(elements.playbackFallback.hidden, false);
    assert.match(elements.playbackMessage.textContent, /限制/);
    context.jumpToItem(0, 50);
    assert.equal(opened, 'https://www.youtube.com/watch?v=BlWJsZIJ8wA&t=50s');
    context.jumpToItem(1, 124);
    assert.equal(elements.playbackFallback.hidden, true);
    assert.equal(loaded.videoId, '38tFHIkIFTs');
    assert.equal(loaded.startSeconds, 124);
    handlers.onError({data: 153, target: {getVideoData: () => ({video_id: '38tFHIkIFTs'})}});
    assert.match(elements.playbackMessage.textContent, /153/);
    assert.match(elements.fallbackLink.href, /t=124s$/);
    context.retryPlayback();
    assert.equal(elements.playbackFallback.hidden, true);
    apiScript.onerror();
    context.jumpToItem(1, 221);
    assert.match(opened, /t=221s$/);
  } else {
    context.jumpToItem(1, 124);
    assert.equal(elements.videoPlayer.src, undefined);
    assert.match(opened, /38tFHIkIFTs&t=124s$/);
  }

  elements.searchAllVideosCheckbox.checked = false;
  context.selectVideo(0);
  assert.match(elements.resultsCount.innerText, /無相符/);
  context.applyTag('<img src=x onerror=alert(1)>');
  assert(!elements.timelineList.innerHTML.includes('<img'));
  assert(elements.timelineList.innerHTML.includes('&lt;img'));
  console.log(`PASS ${protocol}: search, filters, timestamp links, playback fallback, safe input`);
}
