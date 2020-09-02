console.log("content script running...")

const doubanBtn = document.createElement('button')
doubanBtn.className = 'NoBanBtn'
doubanBtn.textContent = "备份电影到 NoBan"

doubanBtn.onclick = () => {
    console.log("可以开始爬了")
    const DouId = document.querySelector(".user-info .pl").innerHTML.split("<br>")[0].trim()
    console.log("douban id:",DouId)
    // 接下来应该把 id 发给 background.js
    chrome.runtime.sendMessage({douId: DouId}, (response) => {})
}

window.onload = () => {
    let userInfo = document.querySelector(".user-info")
    // 首先自动获取用户id
    if (userInfo !== null){
        userInfo.appendChild(doubanBtn)
    }
}