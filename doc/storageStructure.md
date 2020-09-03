## storage 内的存储结构

记一下我这个项目中存储到 `chrome.storage` 中的数据的结构。

### 豆瓣书影音条目数据的存储

- `doubanUser_douId` [Object]
    - douId [String: "douban_user_ID"]
    - movieCounts
      - "done": 123 
      - "wish": 123 
      - "ing": 123
    - bookCounts
      - "done": 123 
      - "wish": 123 
      - "ing": 123
    - musicCounts
      - "done": 123 
      - "wish": 123 
      - "ing": 123
    - movies
        - done: [Array of {subjectid:xxx, marks: rating,comment...}]
        - wish: [Array of {subjectid:xxx, marks: rating,comment...}]
        - ing: [Array of {subjectid:xxx, marks: rating,comment...}]
    - books
        - done: [Array of {subjectid:xxx, marks: rating,comment...}]
        - wish: [Array of {subjectid:xxx, marks: rating,comment...}]
        - ing: [Array of {subjectid:xxx, marks: rating,comment...}]
    - musics
        - done: [Array of {subjectid:xxx, marks: rating,comment...}]
        - wish: [Array of {subjectid:xxx, marks: rating,comment...}]
        - ing: [Array of {subjectid:xxx, marks: rating,comment...}]
- `MovieMap` [Map]
    - key：subjectId
    - val：movieItem
- `BookMap` [Map]
    - key：subjectId
    - val：bookItem
- `MusicMap` [Map]
    - key：subjectId
    - val：musicItem