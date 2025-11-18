const vitesse = 6;
let positionFond = 0;
let obstacles = [];
const jeuContainer = document.getElementById("jeu");
const obstaclesContainer = document.getElementById("obstacles");
const licorne = document.getElementById("licorne");
let licorneOverlay = null;
let hitboxDebug = null;

let overlay1 = null;
let overlay1_clone = null;
let overlay2 = null;
let overlay2_clone = null;
let overlay1_x = 0;
let overlay2_x = 0;
const vitesseOverlay1 = 2.5;
const vitesseOverlay2 = 4.7;

let licorneY = 600;
let velociteLicorne = 0;
const gravite = 0.55;
const saut = 14;

const gameOverContainer = document.getElementById("game-over");
let jeuTermine = false;

let distance = 0;
const distanceMinimum = 420;

let score = 0;
const scoreContainer = document.getElementById("score");

function saveScore(score) {
  let scores = JSON.parse(localStorage.getItem("scores")) || [];
  const dateActuelle = new Date().toLocaleDateString("fr-FR");
  scores.push({ valeur: score, date: dateActuelle });
  localStorage.setItem("scores", JSON.stringify(scores));
}

function affichageScores() {
  const tableau = document.getElementById("tableau-des-scores");
  let scores = JSON.parse(localStorage.getItem("scores")) || [];
  scores.sort((a, b) => b.valeur - a.valeur);
  scores = scores.slice(0, 20);
  tableau.innerHTML = "";
  scores.forEach((s, i) => {
    const ligne = document.createElement("div");
    ligne.innerHTML = `
      <div class="score-ligne">
        <span class="numero">${i + 1}</span>
        <span class="date">${s.date}</span>
        <span class="valeur">${s.valeur}</span>
      </div>
    `;
    tableau.appendChild(ligne);
  });
}

function collisionCirculaire(licorne, obstacle) {
  const L = licorne.getBoundingClientRect();
  const O = obstacle.getBoundingClientRect();
  const centreX = L.left + L.width / 2;
  const centreY = L.top + L.height / 2;
  const rayon = Math.min(L.width, L.height) / 2;
  const nearestX = Math.max(O.left, Math.min(centreX, O.right));
  const nearestY = Math.max(O.top, Math.min(centreY, O.bottom));
  const distX = centreX - nearestX;
  const distY = centreY - nearestY;
  return Math.sqrt(distX * distX + distY * distY) < rayon;
}

function jeu() {
  const obstaclesBas = Array.from({ length: 10 }, (_, i) => `obstacle${i + 1}.png`);
  const obstaclesHaut = Array.from({ length: 10 }, (_, i) => `obstacle${i + 1}haut.png`);
  const overlaysBas = Array.from({ length: 10 }, (_, i) => `obstacle${i + 1}-overlay.png`);
  const overlaysHaut = Array.from({ length: 10 }, (_, i) => `obstacle${i + 1}-overlay-haut.png`);

  licorneOverlay = document.createElement("img");
  licorneOverlay.src = "licorne-overlay.png";
  licorneOverlay.id = "licorne-overlay";
  jeuContainer.appendChild(licorneOverlay);

  hitboxDebug = document.createElement("div");
  hitboxDebug.id = "hitbox-debug";
  jeuContainer.appendChild(hitboxDebug);

  overlay1 = document.createElement("img");
  overlay1.src = "overlaybackground1.png";
  overlay1.id = "overlay1";
  overlay1.style.position = "absolute";
  overlay1.style.left = "0px";
  overlay1.style.bottom = "0px";
  jeuContainer.appendChild(overlay1);

  overlay1_clone = document.createElement("img");
  overlay1_clone.src = "overlaybackground1.png";
  overlay1_clone.id = "overlay1b";
  overlay1_clone.style.position = "absolute";
  overlay1_clone.style.left = overlay1.width + "px";
  overlay1_clone.style.bottom = "0px";
  jeuContainer.appendChild(overlay1_clone);

  overlay2 = document.createElement("img");
  overlay2.src = "overlaybackground2.png";
  overlay2.id = "overlay2";
  overlay2.style.position = "absolute";
  overlay2.style.left = "0px";
  overlay2.style.bottom = "0px";
  jeuContainer.appendChild(overlay2);

  overlay2_clone = document.createElement("img");
  overlay2_clone.src = "overlaybackground2.png";
  overlay2_clone.id = "overlay2b";
  overlay2_clone.style.position = "absolute";
  overlay2_clone.style.left = overlay2.width + "px";
  overlay2_clone.style.bottom = "0px";
  jeuContainer.appendChild(overlay2_clone);

  function updateLicorneOverlay() {
    const wL = licorne.width;
    const hL = licorne.height;
    const wO = licorneOverlay.width;
    const hO = licorneOverlay.height;
    licorneOverlay.style.left = licorne.offsetLeft + wL / 2 - wO / 2 + "px";
    licorneOverlay.style.bottom = licorneY + hL / 2 - hO / 2 + "px";

    const L = licorne.getBoundingClientRect();
    const rayon = Math.min(L.width, L.height) / 2;
    hitboxDebug.style.width = rayon * 2 + "px";
    hitboxDebug.style.height = rayon * 2 + "px";
    hitboxDebug.style.left = licorne.offsetLeft + (wL / 2 - rayon) + "px";
    hitboxDebug.style.bottom = licorneY + (hL / 2 - rayon) + "px";
  }

  function vol() {
    velociteLicorne = 13;
    licorne.src = "licorne2.png";
    licorneOverlay.src = "licorne2-overlay.png";
    setTimeout(() => {
      licorne.src = "licorne.png";
      licorneOverlay.src = "licorne-overlay.png";
    }, 350);
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") vol();
  });
  document.addEventListener("click", () => vol());

  function gameOver() {
    saveScore(score);
    jeuTermine = true;
    gameOverContainer.style.display = "flex";
  }

  function updateOverlayImages() {
    overlay1_x -= vitesseOverlay1;
    overlay2_x -= vitesseOverlay2;

    overlay1.style.left = overlay1_x + "px";
    overlay1_clone.style.left = overlay1_x + overlay1.width + "px";

    overlay2.style.left = overlay2_x + "px";
    overlay2_clone.style.left = overlay2_x + overlay2.width + "px";

    if (overlay1_x <= -overlay1.width) overlay1_x = 0;
    if (overlay2_x <= -overlay2.width) overlay2_x = 0;
  }

  function createObstacle(type, index) {
    const obstacle = document.createElement("img");
    obstacle.src = type === "bas" ? obstaclesBas[index] : obstaclesHaut[index];
    obstacle.classList.add("obstacle");
    if (type === "bas") obstacle.style.bottom = "0";
    else obstacle.style.top = "0";
    obstacle.style.left = "1400px";
    obstaclesContainer.appendChild(obstacle);

    obstacle.onload = () => {
      const overlay = document.createElement("img");
      overlay.src = type === "bas" ? overlaysBas[index] : overlaysHaut[index];
      overlay.classList.add("overlay", type === "bas" ? "overlay-bas" : "overlay-haut");
      overlay.style.visibility = "hidden";
      obstaclesContainer.appendChild(overlay);

      overlay.onload = () => {
        const obsW = obstacle.width;
        const ovW = overlay.width;
        overlay.style.left = 1400 + obsW / 2 - ovW / 2 + "px";
        overlay.style.visibility = "visible";

        obstacles.push({
          element: obstacle,
          overlay: overlay,
          x: 1400,
          dejaCompte: false,
        });
      };
    };
  }

  function popObstacle() {
    const index = Math.floor(Math.random() * 10);
    createObstacle("bas", index);
    createObstacle("haut", index);
    distance = 0;
  }

  function boucleJeu() {
    if (jeuTermine) return;

    positionFond -= vitesse * 0.8;
    jeuContainer.style.backgroundPosition = `${positionFond}px 0`;

    updateOverlayImages();

    velociteLicorne -= gravite;
    licorneY += velociteLicorne;
    licorne.style.bottom = licorneY + "px";

    updateLicorneOverlay();

    if (licorneY <= 0 || licorneY + licorne.offsetHeight >= jeuContainer.offsetHeight) {
      gameOver();
      return;
    }

    distance += vitesse;

    obstacles.forEach((obs, i) => {
      obs.x -= vitesse;
      obs.element.style.left = obs.x + "px";

      const obsW = obs.element.width;
      const ovW = obs.overlay.width;
      obs.overlay.style.left = obs.x + obsW / 2 - ovW / 2 + "px";

      if (collisionCirculaire(licorne, obs.element)) gameOver();

      if (obs.element.style.bottom === "0px") {
        if (!obs.dejaCompte && obs.x + obs.element.offsetWidth < licorne.offsetLeft) {
          score++;
          scoreContainer.innerHTML = score;
          obs.dejaCompte = true;
        }
      }

      if (obs.x < -400) {
        obs.overlay.remove();
        obs.element.remove();
        obstacles.splice(i, 1);
      }
    });

    if (distance >= distanceMinimum) popObstacle();

    requestAnimationFrame(boucleJeu);
  }

  boucleJeu();
}

function init() {
  jeu();
  affichageScores();
}

init();
