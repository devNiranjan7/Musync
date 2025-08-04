console.log("JS Initialized!");

let currentSong = new Audio();
let setVol = 80;

// FORMAT TIME
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// FETCH SONGS
async function getSongs(folder = "") {
    try {
        const res = await fetch(`songs/${folder}/index.json`);
        return await res.json();
    } catch (err) {
        console.error(`Failed to load songs from ${folder}`, err);
        return [];
    }
}

// LOAD SONGS IN UI
async function loadFolderSongs(folderName) {
    let songs = await getSongs(folderName);
    let songUL = document.querySelector(".songsList ul");
    songUL.innerHTML = "";

    if (songs.length === 0) {
        songUL.innerHTML = "<li>No songs found in this folder!</li>";
        return;
    }

    songs.forEach(song => {
        const [songName, artistName] = decodeURIComponent(song).replace(".mp3", "").split(" - ");
        const li = document.createElement("li");
        li.innerHTML = `
            <img width=25px class="invert" src="icons/music.svg" alt="music">
            <div class="songInfo">
                <div>${songName || "Unknown Title"}</div>
                <div>${artistName || "Unknown Artist"}</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="icons/play.svg" alt="play">
            </div>`;
        li.dataset.songFile = `${folderName}/${song}`;
        songUL.appendChild(li);
    });

    // ADD CLCIK TO PLAY
    document.querySelectorAll(".songsList ul li").forEach(li => {
        li.addEventListener("click", () => playMusic(li.dataset.songFile));
    });

    // AUTOPLAY FIRST SONG
    const firstSong = document.querySelector(".songsList ul li");
    if (firstSong) playMusic(firstSong.dataset.songFile);
}

// PLAY MUSIC
function playMusic(filename) {
    currentSong.src = `songs/${filename}`;
    currentSong.play();
    play.src = "icons/pause.svg";
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(filename.split("/")[1]).replace(".mp3", "");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// DISPLAY ALBUM CARDS
async function displayAlbums() {
    const container = document.querySelector(".cardContainer");
    try {
        const res = await fetch("albums.json");
        const albums = await res.json();

        albums.forEach(album => {
            const { folder, title, description } = album;
            container.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <img src="icons/play-box.svg" alt="Play-button">
                    </div>
                    <img src="songs/${folder}/cover.png" alt="Cover-Image">
                    <h2>${title}</h2>
                    <p>${description}</p>
                </div>`;
        });
    } catch (err) {
        console.error("Error loading albums:", err);
        container.innerHTML = "<p>Failed to load albums.</p>";
    }
}

// ON PAGE LOAD
window.addEventListener("DOMContentLoaded", () => {
    // SHOW DISCLAIMER
    setTimeout(() => {
        const banner = document.getElementById("disclaimerBanner");
        if (banner) banner.classList.add("show");
    }, 1500);

    // HAMBURGER MENU
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-130%";
        document.querySelector(".left").style.transition = "all 1s";
    });

    // PLAY/PAUSE BUTTON
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "icons/pause.svg";
        } else {
            currentSong.pause();
            play.src = "icons/play.svg";
        }
    });

    // SONG TIME & SEEKBAR
    currentSong.addEventListener("timeupdate", () => {
        if (!isNaN(currentSong.duration)) {
            const progress = (currentSong.currentTime / currentSong.duration) * 100;
            document.querySelector(".circle").style.left = `${progress}%`;
            document.querySelector(".progress-fill").style.width = `${progress}%`;
            document.querySelector(".songtime").innerHTML =
                `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        }
    });

    document.querySelector(".seekbar").addEventListener("click", (e) => {
        const seekbar = e.currentTarget;
        const rect = seekbar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = (offsetX / rect.width) * 100;

        currentSong.currentTime = (currentSong.duration * percent) / 100;
        document.querySelector(".circle").style.left = `${percent}%`;
        document.querySelector(".progress-fill").style.width = `${percent}%`;
    });

    // VOLUME
    const volumeSlider = document.querySelector(".range input[type='range']");
    const volumeIcon = document.querySelector(".songVolume > img");

    function updateVolumeUI(slider) {
        const percent = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, #1ed760 ${percent}%, #ccc ${percent}%)`;
    }

    updateVolumeUI(volumeSlider);

    volumeSlider.addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;
        setVol = e.target.value;
        updateVolumeUI(e.target);
        volumeIcon.src = (setVol == 0) ? "icons/mute.svg" : "icons/volume.svg";
    });

    volumeIcon.addEventListener("click", () => {
        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            volumeSlider.value = 0;
            volumeIcon.src = "icons/mute.svg";
        } else {
            currentSong.volume = setVol / 100;
            volumeSlider.value = setVol;
            volumeIcon.src = "icons/volume.svg";
        }
        updateVolumeUI(volumeSlider);
    });

    // NEXT/PREVIOUS
    next.addEventListener("click", () => {
        const allSongs = Array.from(document.querySelectorAll(".songsList li")).map(li => li.dataset.songFile);
        const current = decodeURIComponent(new URL(currentSong.src).pathname.split("/songs/")[1]);
        let index = allSongs.indexOf(current);
        if (index !== -1 && index + 1 < allSongs.length) {
            playMusic(allSongs[index + 1]);
        }
    });

    previous.addEventListener("click", () => {
        const allSongs = Array.from(document.querySelectorAll(".songsList li")).map(li => li.dataset.songFile);
        const current = decodeURIComponent(new URL(currentSong.src).pathname.split("/songs/")[1]);
        let index = allSongs.indexOf(current);
        if (index > 0) {
            playMusic(allSongs[index - 1]);
        }
    });

    // AUTO PLAY NEXT SONG ON END
    currentSong.addEventListener("ended", () => {
        const allSongs = Array.from(document.querySelectorAll(".songsList li")).map(li => li.dataset.songFile);
        const current = decodeURIComponent(new URL(currentSong.src).pathname.split("/songs/")[1]);
        let index = allSongs.indexOf(current);
        if (index !== -1 && index + 1 < allSongs.length) {
            playMusic(allSongs[index + 1]);
        }
    });

    // CARD CLICK
    document.querySelector(".cardContainer").addEventListener("click", (e) => {
        const card = e.target.closest(".card");
        if (card && card.dataset.folder) {
            loadFolderSongs(card.dataset.folder);
        }
    });

    // INITIAL ALBUM LOAD
    displayAlbums();
});