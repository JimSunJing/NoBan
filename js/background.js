console.log("background.js is running...")

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message)
    // 下面应该开始爬虫
    mainControl(message.douId)
})

// 爬虫部分
// 主控制程序，翻页之类的
const mainControl = (douId) => {
    const url = "https://movie.douban.com/people/"+ douId + "/collect?sort=time&amp;start=0&amp;filter=all&amp;mode=list&amp;tags_sort=count"
    savePage(url, douId)
    
    
}

// 从items获取信息，存入chrome.storage
const saveItem = (item, douId) => {

}

// 进入subject页面进行信息收集，存入 chrome.storage

// 

// 获取dom
const savePage = (url, douId) => {
    fetchText(url).then((text) => {
        console.log(text)
        let dom =  new DOMParser().parseFromString(text, "text/html");
        // 获取 items 元素
        let items = dom.querySelectorAll(".item")
        console.log(items[0])
    }).catch(e => {
        console.log("error when fetching:",url,"info:",e);
    })
}

const fetchText = async (url) => {
    let response = await fetch(url)
    return await response.text()
}
