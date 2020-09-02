console.log("background.js is running...")

const UserKey = (douId) => {
    return "douban_user_" + douId
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message)
    if (sender.url.indexOf("www.douban.com/people") !== -1) {
        // 下面应该开始爬虫
        const Ukey = UserKey(message.douId)
        chrome.storage.local.set({ Ukey: message }, () => {
            console.log("user info saved", message)
        })
        movieMainControl(message)
    }
    sendResponse("background got the message..")
})

// 爬虫部分
// 主控制程序，翻页之类的
const movieMainControl = (userInfo) => {
    // 电影看过爬取
    let page = 0
    const url = "https://movieItem.douban.com/people/" + userInfo.douId +
        "/collect?sort=time&amp;start=" + page * 30 +
        "&amp;filter=all&amp;mode=list&amp;tags_sort=count"
    if (!saveMoviePage(url, userInfo)) {
        // 已有重复爬取条目，可退出
        return false
    }


}
// 异步请求页面
const fetchText = async (url) => {
    let response = await fetch(url)
    return await response.text()
}

// 获取storage内的movie id
const getUserMovies = (douId) => {
    chrome.storage.local.get("user_" + douId, (data) => {
        // data["movies"] 应该是 Array
        return data["movies"] === null ? null :
            data["movies"].map((row) => { row["subjectId"] })
    })
}

// 获取dom
const saveMoviePage = (url, userInfo) => {
    fetchText(url)
    .then((text) => {
        // 标记是否已经爬到历史记录
        let finished = false
        // console.log(text)
        let dom = new DOMParser().parseFromString(text, "text/html");
        // 先获取所有已经保存好的电影条目ID，避免多次爬取
        const movieIds = getUserMovies(userInfo.douId)
        // 获取 items 元素
        let items = Array.from(dom.querySelectorAll(".item"))
        let movieMap = Map()
        for (let i = 0; i<= items.length; i++){
            let movie = getMovieItem(item, userInfo.douId, movieIds)
            if (movie === false) {
                // 意味着有重复爬取的条目了，标记一下
                finished = true
                break
            }else {
                // 有点怪怪的。。。2020年9月2日23点52分睡觉
                movieMap.set(movie.subjectId, movieItem)
            }
        }
    }).catch(e => {
        console.log("error when fetching:", url, "info:", e);
    })
}


// 从items获取信息，存入chrome.storage
const getMovieItem = (item, douId, movieIds) => {
    const subjectId = item.querySelector("a").href.split("/")[4]
    if (movieIds.findIndex((x) => { x === subjectId }) !== -1) {
        return false
    }
    let movieItem = {
        "subjectId": subjectId,
        "电影名": item.querySelector(".title a").innerText,
        "豆瓣链接": item.querySelector("a").href,
        "我的评分": item.querySelector(".date span").className.charat(6),
        "标记时间": item.querySelector(".date").innerText.trim(),
        "短评": items[4].querySelector(".comment") !== null ? 
            items[4].querySelector(".comment").innerText.trim() : "..."
    }
    console.log("simple:",movieItem)
    // 详细信息收集
    const details = movieDetail(subjectId)
    movieItem = {
        ...movieItem,
        ...details
    }
    // 返回一个movie对象
    return movieItem
}

// 进入subject页面进行信息收集，存入 chrome.storage
const movieDetail = (movieSubjectId) => {
    // 拼接url
    const url = 'https://movieItem.douban.com/subject/' + movieSubjectId
    fetchText(url)
    .then((text) => {
        const dom = new DOMParser().parseFromString(text, "text/html");
        let details = {
            "年份": dom.querySelector(".year").innerText.replace("(","").replace(")",""),
            "封面": dom.querySelector("#mainpic img").src.replace("webp","jpg")
        }
        const infos = Array.from(dom.querySelector("#info").innerText.split(/\r?\n/))
        infos.reduce((acc, curr)=>{
            const k = curr.split(": ")[0]
            const v = curr.split(": ")[1]
            return {
                ...acc,
                ...{[k]: v}
            }
        }
        ,details)
        console.log(details)
        // 直接返回detail Object
        return details
    }).catch(e => {
        console.log("error when fetching:", url, "info:", e);
        return null
    })
}

// 


