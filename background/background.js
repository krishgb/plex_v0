const apiURL = 'https://youtube.googleapis.com/youtube/v3/playlistItems'
const queries = {
    key: '<YOUTUBE_API_ID>',
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
            iconUrl: 'data:image/png;base64,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',
            title: 'Enter PIP mode',
            message: 'Please click the button to play video in PIP mode',
            contextMessage: 'BLah',
            buttons: [
                {
                    title: 'Btn1',
                }
            ]
        })
        console.log(d)
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