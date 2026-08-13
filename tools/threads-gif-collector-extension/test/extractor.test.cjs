const assert = require("node:assert/strict");
const test = require("node:test");
const collector = require("../extractor.js");

function fakeDocument(postId, imageUrls, replyUrls = []) {
  const root = {
    querySelector(selector) {
      return selector.includes(`/post/${postId}`) ? {} : null;
    },
    querySelectorAll(selector) {
      assert.equal(selector, "img[src]");
      return imageUrls.map((src) => ({ src, currentSrc: src }));
    }
  };
  const reply = {
    querySelector() { return null; },
    querySelectorAll() { return replyUrls.map((src) => ({ src, currentSrc: src })); }
  };
  return {
    querySelectorAll(selector) {
      assert.equal(selector, '[data-pagelet^="threads_post_page_"]');
      return [root, reply];
    }
  };
}

test("normalizes a canonical Threads post and removes query parameters", () => {
  assert.deepEqual(
    collector.parsePostLocation("https://www.threads.com/@noxledger_/post/Db5iRw-CKxm?xmt=abc"),
    {
      username: "noxledger_",
      postId: "Db5iRw-CKxm",
      sourceUrl: "https://www.threads.com/@noxledger_/post/Db5iRw-CKxm"
    }
  );
});

test("rejects non-post and non-Threads pages", () => {
  assert.throws(() => collector.parsePostLocation("https://www.threads.com/@user"));
  assert.throws(() => collector.parsePostLocation("https://example.com/@user/post/abc"));
});

test("extracts only unique Giphy GIF/WebP from the matching main post", () => {
  const gif = "https://media2.giphy.com/media/a/200.gif";
  const webp = "https://media4.giphy.com/media/b/200.webp";
  const doc = fakeDocument("Db5iRw-CKxm", [
    gif,
    webp,
    gif,
    "https://scontent.example/avatar.jpg",
    "https://media4.giphy.com/media/c/200.png"
  ], ["https://media1.giphy.com/media/reply/200.gif"]);
  const result = collector.extractFromDocument(
    doc,
    "https://threads.com/@noxledger_/post/Db5iRw-CKxm",
    new Date("2026-08-12T12:00:00.000Z")
  );
  assert.deepEqual(result.media, [
    { type: "gif", url: gif },
    { type: "webp", url: webp }
  ]);
  assert.equal(result.collectedAt, "2026-08-12T12:00:00.000Z");
});

test("fails closed when the matching main post container is absent", () => {
  const doc = fakeDocument("another-id", []);
  assert.throws(() => collector.extractFromDocument(
    doc,
    "https://www.threads.com/@noxledger_/post/Db5iRw-CKxm"
  ), /未找到当前主帖/);
});
