console.log("background.js is running...")

const UserKey = (douId) => {
    return "douban_user_" + douId
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message)
    if (sender.url.indexOf("www.douban.com/people") !== -1) {
        window.userInfo = message
        // 下面应该开始爬虫
        const Ukey = UserKey(message.douId)
        chrome.storage.local.set({ [Ukey]: message }, () => {
            console.log("user info saved", message)
        })
        movieMainControl()
    }
    sendResponse("background got the message..")
})

// 爬虫部分
// 主控制程序，翻页之类的
const movieMainControl = () => {
    // 电影看过爬取
    let page = 0
    const url = "https://movie.douban.com/people/" + userInfo.douId +
        "/collect?sort=time&amp;start=" + page * 30 +
        "&amp;filter=all&amp;mode=list&amp;tags_sort=count"
    if (!saveMoviePage(url)) {
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
const getUserMovies = (douId, type) => {
    chrome.storage.local.get(UserKey(douId), (data) => {
        // data["user_xxx"]["movies"] 应该是 {"done":Array,...}
        return data.movies[type]
    })
}

const setUserMovies = async (douId, type, userMovies) => {
    const Ukey = UserKey(douId)
    chrome.storage.local.get([Ukey], (data)=>{
        let newUser = {
            ...data,
            movies: {
                ...data.movies,
                [type]: userMovies
            }
        }
        chrome.storage.set({[Ukey]: newUser}, (newUser)=>{
            console.log("user movies updated,",newUser)
        })
    })
}

const getStorage = (key) => {
    let res
    chrome.storage.local.get(key,(data) => {
        // 如果没有会返回 空 Object
        res = data
    })
    return res
}

const setMovieMap = (map) => {
    chrome.storage.local.set({"movieMap": map},(map)=>{
        console.log("movieMap stored...",map)
    })
}

const getType = (url) => {
    if (url.indexOf("collect") !== -1)
        return "done"
    else if (url.indexOf("wish") !== -1)
        return "wish"
    return "ing"
}

// 获取dom
const saveMoviePage = (url) => {
    fetchText(url)
    .then((text) => {
        // 爬取类别
        const Type = getType(url)
        // 标记是否已经爬到历史记录
        let finished = false
        // console.log(text)
        let dom = new DOMParser().parseFromString(text, "text/html");
        // 获取 items 元素
        let items = Array.from(dom.querySelectorAll(".item"))
        // 先获取所有已经保存好的电影条目ID，避免多次爬取
        chrome.storage.local.get("movieMap",(mmap) => {
            console.log("mmap:", mmap)
            if (Object.keys(mmap).length === 0 && mmap.constructor === Object){
                window.movieMap = new Map()
            }else{ 
                window.movieMap = mmap 
            }
            console.log("movieMap:", movieMap)
            const movieIds = Array.from(movieMap.keys())
            chrome.storage.local.get(UserKey(userInfo.douId), (data) => {
                // data["user_xxx"]["movies"] 应该是 {"done":Array,...}
                let userMovies = data.hasOwnProperty("movies")? data.movies[Type] : newDoneWishIng()
                console.log("userMovies:",userMovies)
                userMovies = Array.from(userMovies).map((data)=>{return data.subjectId})
                movieItemHelper(items, movieIds, userMovies, movieMap, userInfo.douId, Type)
            })
        })
    }).catch(e => {
        console.log("error when fetching:", url, "info:", e);
    })
}

const newDoneWishIng = () => {return {"done": [], "wish": [], "ing": []}}

const movieItemHelper = async (items, movieIds, userMovies, movieMap, douId, Type) => {
    // 对每个item进行处理
    items.map((item) => {
        const subjectId = item.querySelector("a").href.split("/")[4]
        // 判断是否之前存入用户的 movies 了
        if (userMovies.indexOf(subjectId) !== -1){
            let marks = { 
                "用户评分": item.querySelector(".date span").className.charAt(6),
                "标记时间": item.querySelector(".date").innerText.trim(),
                "短评": item.querySelector(".comment") !== null ? 
                    item.querySelector(".comment").innerText.trim() : "..."
            }
            userMovies.push({
                "subjectId":movie.subjectId,
                "marks": movie.marks
            })
            console.log("UserMovies updated:",userMovies)
            setUserMovies(douId,Type,userMovies)
        }
    })
}

// 从items获取信息，存入chrome.storage
const getMovieItem = async (item, movieIds, userMovies) => {
    const subjectId = item.querySelector("a").href.split("/")[4]
    // 判断是否之前存入用户的 movies 了
    if (userMovies.indexOf(subjectId) !== -1) return false

    // 判断是否已经爬取过详细信息了
    if (movieIds.indexOf(subjectId) !== -1){
        return {
            "subjectId": subjectId,
            "item": null
        }
    }

    let movieItem = {
        "电影名": item.querySelector(".title a").innerText.trim(),
    }
    console.log("simple item:",movieItem)
    // 详细信息收集
    let details = movieDetail(subjectId)
    movieItem = {
        ...movieItem,
        ...details
    }
    console.log("movieItem in [getMovieItem]",movieItem)
    // 返回一个movie对象
    return {
        "subjectId": subjectId,
        "item": movieItem
    }
}

// 进入subject页面进行信息收集，存入 chrome.storage
const movieDetail = (movieSubjectId) => {
    // 拼接url
    const url = 'https://movie.douban.com/subject/' + movieSubjectId
    fetchText(url)
    .then((text) => {
        const dom = new DOMParser().parseFromString(text, "text/html");
        let details = {
            "年份": dom.querySelector(".year").innerText.replace("(","").replace(")",""),
            "封面": dom.querySelector("#mainpic img").src.replace("webp","jpg")
        }
        const infos = Array.from(dom.querySelector("#info").innerText.split(/\r?\n/))
        // console.log("infos:",infos)
        details = infos.reduce((acc, curr)=>{
            const k = curr.split(": ")[0]
            const v = curr.split(": ")[1]
            return {
                ...acc,
                ...{[k]: v}
            }
        }
        ,details)
        console.log("movie item detail:",details)
        // 直接返回detail Object
        return details
    }).catch(e => {
        console.log("error when fetching:", url, "info:", e);
        return null
    })
}

// 检查条目的更新，将条目调入最新状态的数组

// 


