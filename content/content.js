document.body.innerHTML += `
    <div class="plex_div">
        <button>Enable PIP mode</button>
    </div>

    <style>
        .plex_div{
            background-color: #00000080;
            width: 300px !important;
            height: 150px !important;
            margin: auto;

            position: fixed !important;
            inset: 0 !important;
            
            display: grid;
            place-items: center;
        }
        .plex_div button{
            border: none;
            outline: none;
            background-color: green;
            color: black;
            padding: 10px 20px;
            font-size: 18px;
            box-shadow: 5px 5px 15px #000;
            border-radius: 5px;
            cursor: pointer;
        }
    </style>
`;
document.querySelector(".plex_div").style.display = "none";
document.querySelector(".plex_div button").onclick = () => {
  video_ele.requestPictureInPicture();
  console.log(document.querySelector(".plex_div"));
  document.querySelector(".plex_div").style.display = "none";
};

let video_ele = document.createElement("video");
video_ele.src = chrome.runtime.getURL("assets/z.mp4");
video_ele.controls = true;
video_ele.autoplay = true;
video_ele.width = "400";
video_ele.height = "400";
video_ele.id = crypto.randomUUID();

document.body.appendChild(video_ele);

let timeouts = [];
let play = false;

const sec_to_min = (min) => min * 1000 * 60;

const get_src = async (data, i) => {
  try {
    const _ = await fetch(`https://pytvd.vercel.app/getv/${data[i]}`);
    const { url } = (await _.json())[0];
    return [url, i];
  } catch (err) {
    get_src(data, i + 1);
  }
};

const start = async (data, time) => {
  let i = 0;
  const src = await get_src(data, i);
  i = src[1] + 1;
  video_ele.src = src[0];

  video_ele.onloadedmetadata = async () => {
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    if (!document.pictureInPictureEnabled)
      alert('Can\'t open video in "Picture In Picture" mode');
    try {
      const pipw = await video_ele.requestPictureInPicture();
    } catch (err) {
      console.log(err);
      chrome.runtime.sendMessage({ type: "PIP", msg: "pip not enabled" });
      document.querySelector(".plex_div").style.display = "grid";
    }
  };

  const play_on_end_and_leave = () => {
    if (!play) return;

    video_ele.removeAttribute("__pipcontrol__");

    const timeout = setTimeout(async () => {
      if (!play) return;
      const src = await get_src(data, i);
      i = src[1] + 1;
      video_ele.src = src[0];
      video_ele.setAttribute("__pipcontrol__", true);
      video_ele.onloadedmetadata = async () => {
        video_ele.play();
        try {
          const pipw = await video_ele.requestPictureInPicture();
        } catch (err) {
          console.log(err);
          chrome.runtime.sendMessage({ type: "PIP", msg: "pip not enabled" });
          document.querySelector(".plex_div").style.display = "grid";
        }
      };
    }, time);

    timeouts.push(timeout);
  };

  video_ele.onended = () => {
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    play_on_end_and_leave();
  };
  video_ele.onleavepictureinpicture = play_on_end_and_leave;
};

chrome.runtime.onMessage.addListener((message) => {
  const { type, msg } = message;
  console.log("Message: ", type);
  if (message.type === "stop") {
    play = false;
    video_ele.src = chrome.runtime.getURL("assets/z.mp4");
    video_ele.remove();
    if (document.pictureInPictureElement) document.exitPictureInPicture();
    for (let timeout in timeouts) clearTimeout(timeout);
    const v = document.createElement("video");
    v.src = chrome.runtime.getURL("assets/z.mp4");
    v.controls = true;
    v.autoplay = true;
    v.width = "400";
    v.height = "400";
    v.id = crypto.randomUUID();
    video_ele = v;
    return;
  }

  const { data, minutes } = msg;
  const time = sec_to_min(minutes);
  play = true;
  start(data.plex_data, time);
});
