let download_img_urls = []; // 下载图片的url地址
let site = "";

(function () {
  // 扫描操作
  const downloader_scan_btn = document.getElementById("downloader_scan_btn");
  downloader_scan_btn.addEventListener("click", () => {
    // 清除旧数据
    clearData();

    // 获取当前活动标签页并发送消息
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;

      const activeTab = tabs[0];

      // 向内容脚本（content_script/*.js）发送消息
      chrome.tabs.sendMessage(
        activeTab.id,
        {
          action: "parseImage",
        },
        (response) => {
          // 处理来自内容脚本的响应
          if (chrome.runtime.lastError) {
            console.error("通信错误:", chrome.runtime.lastError);
            return;
          }

          download_img_urls = response.download_img_urls;
          site = response.site;

          // 解析图片
          if (download_img_urls && download_img_urls.length > 0) {
            const modal_body = document.querySelector(".downloader-modal-body");

            download_img_urls.forEach((url) => {
              const img = document.createElement("img");
              img.src = url;
              img.className = "downloader-preview-img";

              modal_body.appendChild(img);
            });
          }

          // 文本提示
          const modal_bottom = document.querySelector(
            ".downloader-modal-bottom"
          );
          modal_bottom.innerText = `扫描完成：共${download_img_urls.length}张图片`;
        }
      );
    });
  });

  // 下载操作
  const downloader_download_btn = document.getElementById(
    "downloader_download_btn"
  );
  downloader_download_btn.addEventListener("click", async () => {
    console.log(`图片列表：${download_img_urls}, ${site}`);
    if (!download_img_urls || download_img_urls.length === 0) {
      return;
    }

    // 以当前时间作为文件夹名称
    const now = Date.now();
    let count = 0;
    for (let index = 0; index < download_img_urls.length; index++) {
      let url = download_img_urls[index];
      // 生成文件名
      const filename = `images/${now}/${index}.jpg`;

      // 使用chrome.downloads API下载图片
      if (site === "amazon" || site === "temu") {
        chrome.downloads.download({
          url: url,
          filename: filename,
          conflictAction: "uniquify",
        });
      } else {
        await convertWebPToJPGInSW(url, filename);
      }

      count++;
    }

    // 文本提示
    const modal_bottom = document.querySelector(".downloader-modal-bottom");
    modal_bottom.innerText = `下载完成：共${count}张图片`;
  });
})();

// 清空数据
function clearData() {
  download_img_urls = []; // 下载图片的url地址
  site = "";
}

// 在Service Worker或后台脚本中使用
async function convertWebPToJPGInSW(url, filename) {
  let jpgUrl;
  try {
    // 获取图片数据
    const response = await fetch(url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    // 使用OffscreenCanvas转换
    const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = offscreen.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);

    // 转换为JPG
    const jpgBlob = await offscreen.convertToBlob({
      type: "image/jpeg",
      quality: 0.9,
    });
    jpgUrl = URL.createObjectURL(jpgBlob);

    // 下载转换后的图片
    chrome.downloads.download({
      url: jpgUrl,
      filename: filename,
      conflictAction: "uniquify",
    });
  } catch (error) {
    console.error(`转换错误:${url}, ${filename}`, error);
  } finally {
    // 避免内存泄露
    if (jpgUrl) {
      URL.revokeObjectURL(jpgUrl);
    }
  }
}
