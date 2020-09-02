console.log("content script running...")

const doubanBtn = document.createElement('button')
doubanBtn.className = 'NoBanBtn'
doubanBtn.textContent = "备份电影到 NoBan"

const ItemCount = (counts) => {
    return Array.from(counts)
    .map((x)=>{
        let i = parseInt(x.innerText.split("部")[0])
        if (x.innerText.indexOf("在") !== -1){
            return {"ing": i}
        }else if (x.innerText.indexOf("想") !== -1){
            return {"wish": i}
        }
        return {"done": i}
    })
    .reduce((acc,curr)=>{
        return {...acc, ...curr}
    })
}

doubanBtn.onclick = () => {
    console.log("可以开始爬了")
    // 获取豆瓣用户的 ID
    const DouId = document.querySelector(".user-info .pl")
        .innerHTML.split("<br>")[0].trim()
    console.log("douban id:",DouId)
    // 获取条目计数
    // 电影
    const movieCounts = ItemCount(document.querySelectorAll("#movie h2 span a"))
    // 图书
    const bookCounts = ItemCount(document.querySelectorAll("#book h2 span a"))
    // 音乐 
    const musicCounts = ItemCount(document.querySelectorAll("#music h2 span a"))
    // 接下来应该把 id 发给 background.js
    chrome.runtime.sendMessage({
        douId: DouId, 
        movieCounts: movieCounts,
        bookCounts: bookCounts,
        musicCounts: musicCounts
    }, (response) => {console.log("response:",response)})
}

window.onload = () => {
    let userInfo = document.querySelector(".user-info")
    // 首先自动获取用户id
    if (userInfo !== null){
        userInfo.appendChild(doubanBtn)
    }
}