console.log("JS Initialized!");

window.addEventListener("DOMContentLoaded", () => {
    // SHOW DISCLAIMER BANNER
    setTimeout(() => {
        const banner = document.getElementById("disclaimerBanner");
        if (banner) banner.classList.add("show");
    }, 1500);
});

let currentSong = new Audio();

// FORMAT SECONDS TO MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// FETCH SONGS FROM A FOLDER
async function getSongs(folder = "") {
    try {
        const res = await fetch(`songs/${folder}/index.json`);
        const songs = await res.json();
        return songs;
    } catch (error) {
        console.error(`Failed to fetch index.json from "${folder}":`, error);
        return [];
    }
}

// LOAD AND DISPLAY SONGS IN UI
async function loadFolderSongs(folderName) {
    let songs = await getSongs(folderName);
    let songUL = document.querySelector(".songsList ul");

    songUL.innerHTML = "";

    if (songs.length === 0) {
        songUL.innerHTML = "<li>No songs found in this folder!</li>";
        return;
    }

    songs.forEach(song => {
        const decodedName = decodeURIComponent(song).replace(".mp3", "");
        const [songName, artistName] = decodedName.split(" - ");
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
            </div>
        `;

        li.dataset.songFile = `${folderName}/${song}`;
        songUL.appendChild(li);
    });

    // ADD CLICK LISTENER TO EACH SONG
    document.querySelectorAll(".songsList ul li").forEach(e => {
        e.addEventListener("click", () => {
            const filename = e.dataset.songFile;
            playMusic(filename);
        });
    });

    // AUTO-PLAY THE FIRST SONG
    const firstSong = document.querySelector(".songsList ul li");
    if (firstSong) {
        const filename = firstSong.dataset.songFile;
        playMusic(filename);
    }
}

// PLAY MUSIC BY FILENAME
function playMusic(filename) {
    currentSong.src = `songs/${filename}`;
    currentSong.play();
    play.src = "icons/pause.svg";
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(filename.split("/")[1]).replace(".mp3", "");
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// HANDLE CARD CLICK TO LOAD FOLDER
document.querySelector(".cardContainer").addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card && card.dataset.folder) {
        loadFolderSongs(card.dataset.folder);
    }
});

// DOM LOADED
window.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-130%";
        document.querySelector(".left").style.transition = "all 1s";
    });

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "icons/pause.svg";
        } else {
            currentSong.pause();
            play.src = "icons/play.svg";
        }
    });

    // SEEKBAR PROGRESS
    currentSong.addEventListener("timeupdate", () => {
        if (!isNaN(currentSong.duration)) {
            const progress = (currentSong.currentTime / currentSong.duration) * 100;
            document.querySelector(".circle").style.left = progress + "%";
            document.querySelector(".progress-fill").style.width = progress + "%";
            document.querySelector(".songtime").innerHTML =
                `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        }
    });

    // SEEKBAR CLICK
    document.querySelector(".seekbar").addEventListener("click", e => {
        const seekbar = e.currentTarget;
        const rect = seekbar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = (offsetX / rect.width) * 100;

        document.querySelector(".circle").style.left = percent + "%";
        document.querySelector(".progress-fill").style.width = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // VOLUME CONTROL
    const volumeSlider = document.querySelector(".range input[type='range']");

    function updateSliderBackground(slider) {
        const value = slider.value;
        const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(to right, #1ed760 ${percent}%, #ccc ${percent}%)`;
    }

    updateSliderBackground(volumeSlider);

    volumeSlider.addEventListener("input", (e) => {
        currentSong.volume = e.target.value / 100;
        setVol = e.target.value;
        updateSliderBackground(e.target);

        const icon = document.querySelector(".songVolume > img");
        if (e.target.value == 0) {
            icon.src = "icons/mute.svg";
        } else {
            icon.src = "icons/volume.svg";
        }
    })

    // MUTE BUTTON
    document.querySelector(".songVolume > img").addEventListener("click", (e) => {
        const slider = document.querySelector(".range input[type='range']");
        const icon = e.target;

        if (currentSong.volume > 0) {
            currentSong.volume = 0;
            slider.value = 0;
            icon.src = "icons/mute.svg";
        } else {
            currentSong.volume = setVol / 100;
            slider.value = setVol;
            icon.src = "icons/volume.svg";
        }

        updateSliderBackground(slider);
    });

    // NEXT/PREVIOUS BUTTONS
    next.addEventListener("click", () => {
        const allSongs = Array.from(document.querySelectorAll(".songsList li")).map(li => li.dataset.songFile);
        let index = allSongs.indexOf(currentSong.src.split("/songs/")[1]);
        if (index + 1 < allSongs.length) {
            playMusic(allSongs[index + 1]);
        }
    });

    previous.addEventListener("click", () => {
        const allSongs = Array.from(document.querySelectorAll(".songsList li")).map(li => li.dataset.songFile);
        let index = allSongs.indexOf(currentSong.src.split("/songs/")[1]);
        if (index - 1 >= 0) {
            playMusic(allSongs[index - 1]);
        }
    });
});

// DISPLAY ALBUMS (FOLDERS) AS CARDS
async function displayAlbums() {
    let cardContainer = document.querySelector(".cardContainer");

    try {
        let res = await fetch("albums.json");
        let albums = await res.json();

        albums.forEach(album => {
            const { folder, title, description } = album;

            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <img src="icons/play-box.svg" alt="Play-button">
                    </div>
                    <img src="songs/${folder}/cover.png" alt="Cover-Image">
                    <h2>${title}</h2>
                    <p>${description}</p>
                </div>
            `;
        });
    } catch (err) {
        console.error("Error loading albums:", err);
        cardContainer.innerHTML = "<p>Failed to load albums.</p>";
    }
}

displayAlbums();