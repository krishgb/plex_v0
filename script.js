const send_msg_to_page = async (id, msg) => {
    return (await chrome.tabs.sendMessage(id, msg))
}

document.addEventListener('DOMContentLoaded', async() => {
    // just sending a dummy message
    await chrome.runtime.sendMessage({type: 'dummy', msg: 'How are you Service HERO?'})

    // DOM elements
    const ele_switch = document.querySelector('input[type=checkbox]')
    const ele_minute = document.querySelector('input[type=number]')

    // plex_data, current tab
    const data = await chrome.storage.local.get('plex_data')
    const [tab] = await chrome.tabs.query({active:true, lastFocusedWindow: true})
    
    // check if switch is set on or off
    const is_persist = await chrome.storage.local.get(`${tab.id}`)
    console.log(is_persist)
    if(JSON.stringify(is_persist) === '{}') await chrome.storage.local.set({[tab.id]: {status: 'off', time: 1}})
    else if(is_persist[tab.id].status === 'on') {
        ele_minute.value = is_persist[tab.id].time
        ele_switch.checked = true
    }

    // check if plex_data is present in the local storage
    if(JSON.stringify(data) === '{}'){
        const res = await chrome.runtime.sendMessage({type: 'request', msg: 'plex_data'})
        if(!res.done) alert(res.err)
        else send_msg_to_page(tab.id, res.data)
    }

    // on toggling the switch
    ele_switch.addEventListener('change', async (e) => {
        
        // if the user switch off the PIP
        // 1. send stop message to the content script
        // 2. remove the tab id from the local storage
        if(!(e.target.checked)) {
            await send_msg_to_page(tab.id, {type: 'stop', msg: null})
            await chrome.storage.local.remove(`${tab.id}`)
            return
        }

        // if user switch to on the PIP
        // 1. send play message to the content script
        // 2. add the tab id to the local storage
        const minutes = parseInt(ele_minute.value) || 1
        await send_msg_to_page(tab.id, {type: "play", msg: {data, minutes}} )
        await chrome.storage.local.set({[tab.id]: {status: 'on', time: minutes}})
    })
})