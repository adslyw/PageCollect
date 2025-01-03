chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "collectPage",
        title: "收藏",
        contexts: ["image", "video", "audio", "link"]
    });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "collectPage") {
        const resourceUrl = getResourceUrl(info);
        if (resourceUrl) {
            // 获取元素信息
            chrome.tabs.sendMessage(tab.id, {
                action: "getElementInfo",
                mediaType: info.mediaType,
                srcUrl: info.srcUrl,
                linkUrl: info.linkUrl
            }, (response) => {
                const title = getTitle(info, response);
                callAPI(resourceUrl, title);
            });
        } else {
            showNotification('错误', '无法获取资源链接');
        }
    }
});


// 获取标题
function getTitle(info, response) {
    if (!response) return info.srcUrl || info.linkUrl;

    // 优先使用 alt 属性作为标题
    if ((info.mediaType === 'image' || info.mediaType === 'video') && response.alt) {
        return response.alt;
    }
    // 其次使用元素标题
    if (response.title) {
        return response.title;
    }
    // 最后使用页面标题
    if (response.pageTitle) {
        return response.pageTitle;
    }
    // 都没有则使用URL
    return info.srcUrl || info.linkUrl;
}

// 获取不同类型资源的URL
function getResourceUrl(info) {
    if (info.mediaType === "image" || info.mediaType === "video" || info.mediaType === "audio") {
        return info.srcUrl;
    } else if (info.linkUrl) {
        return info.linkUrl;
    }

    return null;
}

// 显示通知的统一函数
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: title,
        message: message
    });
}

async function callAPI(url, title) {
  try {
    const response = await fetch('http://localhost/collection/pages/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Token '
      },
      body: JSON.stringify({
        address: url,
        title: title
      })
    });

    const data = await response.json();

    // 显示结果通知
    showNotification('收藏成功', '资源已成功保存');

  } catch (error) {
    console.error('API请求失败:', error);
    showNotification('收藏失败', error.message || '发送资源链接时出现错误');
  }
}
