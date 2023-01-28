(() => {
    const video_ele = document.createElement('video')
    video_ele.src = chrome.runtime.getURL('assets/z.mp4')
    video_ele.controls = true
    video_ele.autoplay = true
    video_ele.width = 1
    video_ele.height = 1
    video_ele.id = crypto.randomUUID()

    document.body.appendChild(video_ele)
    
    const sec_to_min = min => min * 1000 * 60

    const get_src = async id => {
        const _ = await fetch(`https://pytvd.vercel.app/getv/${id}`)
        const {url} = (await _.json())[0]
        return url
    }

    const start = async(data, time) => {
        let i = 0
        video_ele.src = await get_src(data[i])
        
        video_ele.onloadedmetadata = async () => {
            if(document.pictureInPictureElement) document.exitPictureInPicture()
            if(!document.pictureInPictureEnabled) alert("Can't open video in \"Picture In Picture\" mode")
            await video_ele.requestPictureInPicture()
        }

        const play_on_end_and_leave = () => {
            setTimeout(async() => {
                video_ele.src = await get_src(data[++i])
                video_ele.onloadedmetadata = async () => {
                    video_ele.play()
                    await video_ele.requestPictureInPicture()
                }
            }, time)
        }

        video_ele.onended = play_on_end_and_leave
        video_ele.onleavepictureinpicture = play_on_end_and_leave
    }
    
    chrome.runtime.onMessage.addListener( (message) => {
        const {type, msg} = message
        console.log('Message: ', type)
        if(message.type === 'stop'){
            video_ele.src = chrome.runtime.getURL('assets/z.mp4')
            document.exitPictureInPicture()
            return
        }

        const {data, minutes} = msg
        const time = sec_to_min(minutes)

        start(data, time)
    })
}
)()