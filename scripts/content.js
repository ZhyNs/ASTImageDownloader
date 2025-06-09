// 监听来自扩展的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "parseImage") {
    const hostname = window.location.hostname;
    let site = "";
    if (hostname.indexOf("temu.com") !== -1) {
      site = "temu";
    } else if (hostname.indexOf("amazon.com") !== -1) {
      site = "amazon";
    } else if (hostname.indexOf("shein") !== -1) {
      site = "shein";
    } else {
      console.error("图片下载器解析错误，url地址不正确：" + hostname);
      return;
    }
    const download_img_urls = parseImage(site);

    sendResponse({
      download_img_urls: download_img_urls,
      site: site,
    });
  }

  // 返回true表示异步响应
  return true;
});

// 图片css样式选择器
const css_selectors = {
  temu: "._22_BWn2A ._3eDhqCfZ",
  shein: ".swiper-item.cursor-zoom-in img",
  amazon: ".imgTagWrapper img",
};

// 解析图片
function parseImage(site) {
  // 图片列表
  const imgs = document.querySelectorAll(css_selectors[site]);
  if (!imgs || imgs.length === 0) {
    return [];
  }

  const img_urls = [];
  for (const i in imgs) {
    console.log(imgs[i].src);
    // url格式化
    const url = formatUrl(imgs[i].src);
    if (!url) {
      continue;
    }

    if (site === "shein" && !isWebPByURL(url)) {
      continue;
    }

    img_urls.push(url);
  }

  console.log("图片列表", img_urls);
  return img_urls;
}

// 判断是否webp格式图片
function isWebPByURL(url) {
  return url.toLowerCase().endsWith(".webp");
}

// url格式化
function formatUrl(url) {
  // 如果url为空，则返回空字符串
  if (!url) {
    return "";
  }

  // 查找?的位置
  const questionMarkIndex = url.indexOf("?");

  // 如果找到问号，返回问号之前的部分
  return questionMarkIndex !== -1 ? url.substring(0, questionMarkIndex) : url;
}
