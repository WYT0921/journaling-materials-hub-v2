(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ThreadsGifCollector = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const ALLOWED_HOSTS = new Set([
    "threads.com",
    "www.threads.com",
    "threads.net",
    "www.threads.net"
  ]);

  function parsePostLocation(urlValue) {
    const url = new URL(urlValue);
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
      throw new Error("请在 Threads 帖子页面使用此扩展");
    }
    const match = url.pathname.match(/^\/@([^/]+)\/post\/([^/?#]+)/i);
    if (!match) throw new Error("当前页面不是 Threads 单帖页面");
    return {
      username: match[1],
      postId: match[2],
      sourceUrl: `https://www.threads.com/@${match[1]}/post/${match[2]}`
    };
  }

  function findPostRoot(documentValue, postId) {
    const pagelets = Array.from(
      documentValue.querySelectorAll('[data-pagelet^="threads_post_page_"]')
    );
    return pagelets.find((element) =>
      element.querySelector(`a[href*="/post/${postId}"]`)
    ) || null;
  }

  function normalizeGiphyUrl(value) {
    if (!value) return null;
    let url;
    try {
      url = new URL(value);
    } catch (_) {
      return null;
    }
    if (!/^media\d+\.giphy\.com$/i.test(url.hostname)) return null;
    const match = url.pathname.match(/\.(gif|webp)$/i);
    if (!match) return null;
    return { url: url.href, type: match[1].toLowerCase() };
  }

  function extractFromDocument(documentValue, urlValue, nowValue) {
    const post = parsePostLocation(urlValue);
    const rootElement = findPostRoot(documentValue, post.postId);
    if (!rootElement) {
      throw new Error("未找到当前主帖，请等待页面加载完成后重试");
    }

    const seen = new Set();
    const media = [];
    for (const image of rootElement.querySelectorAll("img[src]")) {
      const item = normalizeGiphyUrl(image.currentSrc || image.src);
      if (!item || seen.has(item.url)) continue;
      seen.add(item.url);
      media.push(item);
    }

    return {
      version: 1,
      source: "threads",
      sourceUrl: post.sourceUrl,
      postId: post.postId,
      username: post.username,
      media,
      collectedAt: (nowValue || new Date()).toISOString()
    };
  }

  function collectCurrentPage() {
    return extractFromDocument(document, location.href, new Date());
  }

  return {
    parsePostLocation,
    findPostRoot,
    normalizeGiphyUrl,
    extractFromDocument,
    collectCurrentPage
  };
});
