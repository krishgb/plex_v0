const apiURL = 'https://youtube.googleapis.com/youtube/v3/playlistItems'
const queries = {
    key: '<YOUTUBE_AUTH_API_KEY>',
    part: 'snippet',
    playlistId: 'PLC3y8-rFHvwisvxhZ135pogtX7_Oe3Q3A',
    maxResults: 50
}

const fn = async (arr = [], pageToken = undefined) => {
    let mappedCred = (Object.keys(queries).map(i => `${i}=${queries[i]}`).join('&') )
    mappedCred += pageToken ? `&pageToken=${pageToken}` : ''

    const data = await fetch(`${apiURL}?${mappedCred}`)
    const json = await data.json()
    for(let i of json.items) arr.push(i.snippet.resourceId.videoId)

    if('nextPageToken' in json){
        fn(arr, json.nextPageToken)
    }

    await chrome.storage.local.set({plex_data: arr})
    return arr
}

const get_data_err = async (func) => {
    try{
        const data = await func()
        return {done: true, data}
    }catch(err) {
        return {done: false, err}
    }
}


chrome.runtime.onMessage.addListener(async (message, sender, response) => {
    const update_time = await chrome.storage.local.get('plex_update_time')
    if(Date.now() > update_time) {
        await fn()
        await chrome.storage.local.set({
            plex_update_time: Date.now() + (60 * 30 * 1000) 
        })
    }
    
    if(message.type === 'request' && message.msg === 'plex_data'){
        const res = await get_data_err(fn)
        response(res)
    }

    if(message.type === 'PIP'){
        const d = await chrome.notifications.create({
            type: 'basic',
            iconUrl: 'https://media.istockphoto.com/id/1008257354/vector/vector-handwritten-logo-letter-p.jpg?s=612x612&w=0&k=20&c=MOqC78DYxbAikOxuDUPBTmt63k0AEai9LfhS7h3FkmU=',
            title: 'Enter PIP mode',
            message: 'Please click the button to play video in PIP mode',
            contextMessage: 'PIP video',
            buttons: [
                {
                    title: 'Go to website',
                }
            ]
        })
        const dd = await chrome.notifications.onButtonClicked.addListener((id, btnidx) => {
            if(btnidx === 0){
                chrome.tabs.move([sender.tab.id], {
                    index: 0
                })
                chrome.tabs.update(sender.tab.id, {active:true})
            }
        })
        console.log(dd)
    }
})