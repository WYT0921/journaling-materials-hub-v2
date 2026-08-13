"use strict";

let collectedPayload = null;

const statusElement = document.getElementById("status");
const summaryElement = document.getElementById("summary");
const downloadButton = document.getElementById("download");

function setStatus(message, type) {
  statusElement.textContent = message;
  statusElement.className = `status${type ? ` ${type}` : ""}`;
}

function showSummary(payload) {
  const gifCount = payload.media.filter((item) => item.type === "gif").length;
  const webpCount = payload.media.filter((item) => item.type === "webp").length;
  document.getElementById("post-id").textContent = payload.postId;
  document.getElementById("gif-count").textContent = String(gifCount);
  document.getElementById("webp-count").textContent = String(webpCount);
  document.getElementById("total-count").textContent = String(payload.media.length);
  summaryElement.hidden = false;
}

async function inspectActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) throw new Error("无法识别当前标签页");

    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["extractor.js"] });
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => globalThis.ThreadsGifCollector.collectCurrentPage()
    });
    if (!result || !result.result) throw new Error("页面未返回采集结果");

    collectedPayload = result.result;
    showSummary(collectedPayload);
    downloadButton.disabled = collectedPayload.media.length === 0;
    setStatus(
      collectedPayload.media.length
        ? `已识别 ${collectedPayload.media.length} 个主帖动图，可以下载 JSON。`
        : "当前主帖未发现 Giphy GIF 或动态 WebP。",
      collectedPayload.media.length ? "success" : "error"
    );
  } catch (error) {
    collectedPayload = null;
    downloadButton.disabled = true;
    setStatus(error && error.message ? error.message : "采集失败，请刷新帖子后重试", "error");
  }
}

downloadButton.addEventListener("click", async () => {
  if (!collectedPayload) return;
  const json = JSON.stringify(collectedPayload, null, 2);
  const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;
  await chrome.downloads.download({
    url: dataUrl,
    filename: `threads-gif-${collectedPayload.postId}.json`,
    saveAs: true
  });
  setStatus("JSON 已生成，请把文件交给 manual-gif-asset-import。", "success");
});

inspectActiveTab();
