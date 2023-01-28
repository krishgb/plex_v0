const apiURL = 'https://youtube.googleapis.com/youtube/v3/playlistItems'
const queries = {
    key: '<YOUR_YOUTUBE_API_ID>',
    part: 'snippet',
    playlistId: 'PLv2e03XKuK2ktxBEdOYcw2GP6Mub16l8s',
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

    return arr
}

document.addEventListener('DOMContentLoaded', async() => {
    const data = await fn()
    const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
    
    document.querySelector('input[type=checkbox]').addEventListener('change', async (e) => {
        if(!(e.target.checked)) {
            await chrome.tabs.sendMessage(tab.id, {type: 'stop', msg: null})        
            return
        }
        const minutes = parseInt(document.querySelector('input[type=number]').value) || 1
        await chrome.tabs.sendMessage(tab.id,{type: "play", msg: {data, minutes}})
    })
})
