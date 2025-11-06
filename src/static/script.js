const themeButtons = document.querySelectorAll(".theme-btn");

themeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const theme = btn.getAttribute("data-theme");
    document.documentElement.setAttribute("data-theme", theme);
  });
});

function login() {
  // se connecter
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const overlay = document.getElementById("loading-overlay");
  overlay.style.display = "flex"; // afficher le loader

  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then((res) => res.json())
    .then((data) => {
      overlay.style.display = "none"; // cacher le loader
      document.getElementById("themeButtons").style.display = "none";

      if (data.success) {
        document.getElementById("login").style.display = "none";
        const bottomLeft = document.querySelector(".bottom-left");
        if (bottomLeft) bottomLeft.remove();
        document.getElementById("dashboard").style.display = "block";

        const greeting = document.getElementById("greeting");
        const hour = new Date().getHours();
        if (hour >= 19 || hour < 5)
          greeting.textContent = `Bonsoir ${data.infos.name} 🌙`;
        else if (hour >= 5 && hour < 12)
          greeting.textContent = `Bonjour ${data.infos.name} 👋`;
        else greeting.textContent = `Bon après-midi ${data.infos.name} ☀️`;

        loadGrades();
        loadHomework();
        loadPlanner();
        loadElo();
      } else {
        document.getElementById("error").innerText = data.error;
      }
    })
    .catch((err) => {
      overlay.style.display = "none";
      document.getElementById("error").innerText = "Une erreur est survenue.";
      console.error(err);
    });
}

function loadGrades_out() {
  // afficher une liste des moyennes (plus utilisé)
  fetch("/grades")
    .then((res) => res.json())
    .then((data) => {
      const list = document.getElementById("grades");
      list.innerHTML = "";
      for (let matiere in data) {
        const moyenne = data[matiere].average;
        const li = document.createElement("li");
        li.innerText = `${matiere} : ${moyenne}`;
        list.appendChild(li);
      }
    });
}

function loadGrades() {
  // dessiner le graphique des matières et de la moyenne générale
  fetch("/grades")
    .then((res) => {
      if (res.redirected) {
        window.location.href = res.url;
        return Promise.reject();
      }
      if (res.status === 302) {
        window.location.href = "/";
        return Promise.reject();
      }
      return res.json();
    })
    .then((data) => {
      let total = 0;
      let count = 0;
      const labels = [];
      const values = [];

      for (let matiere in data) {
        const moyenne = data[matiere].average;
        if (!isNaN(moyenne)) {
          labels.push(matiere);
          values.push(moyenne);
        }
      }

      drawAverageCircle(data["global_avg"]);
      drawBarChart(labels, values);
    });
}

function loadHomework() {
  // afficher les devoirs
  fetch("/homework")
    .then((res) => {
      if (res.redirected) {
        window.location.href = res.url;
        return Promise.reject();
      }
      if (res.status === 302) {
        window.location.href = "/";
        return Promise.reject();
      }
      return res.json();
    })
    .then((data) => {
      console.log("DEBUGGING");
      const list = document.getElementById("homework");
      list.innerHTML = ""; // On vide d'abord la liste

      // Vérifier si les devoirs existent
      let devoirsExistants = false;

      for (let matiere in data) {
        if (data[matiere].length > 0) {
          // Si la matière a des devoirs
          devoirsExistants = true;
          data[matiere].forEach((devoir) => {
            const li = document.createElement("li");
            li.innerHTML = `• <strong>${matiere}</strong> : ${devoir}`; //            li.innerText = `• ${matiere} : ${devoir}`;
            list.appendChild(li);
          });
        }
      }

      // Si aucune matière n'a de devoirs, afficher un message "Pas de devoirs"
      if (!devoirsExistants) {
        const li = document.createElement("li");
        li.innerText = "Pas de devoirs 🎉";
        list.appendChild(li);
      }
    });
}
function loadPlanner() {
  // afficher les cours de demain
  fetch("/planner")
    .then((res) => res.json())
    .then((data) => {
      const list = document.getElementById("planner");
      list.innerHTML = "";

      if (data.length === 0) {
        const li = document.createElement("li");
        li.innerText = "Pas cours 🎉";
        list.appendChild(li);
        return;
      }

      data.forEach((matiere) => {
        const li = document.createElement("li");
        li.innerText = `• ${matiere}`;
        list.appendChild(li);
      });
    })
    .catch((err) => console.error("Erreur planner:", err));
}
function loadElo() {
  fetch("/elo")
    .then((res) => res.json())
    .then((data) => {
      const list = document.getElementById("elo");
      list.innerHTML = "";

      const li = document.createElement("li");
      li.innerText = `${data} 😎`;
      list.appendChild(li);
    })
    .catch((err) => console.error("Erreur elo:", err));
}

// Échelle moyenne → image
const averageImages = [
  { min: 0.1, max: 2, src: "static/ranks/iron1.png" },
  { min: 2, max: 4, src: "static/ranks/iron2.png" },
  { min: 4, max: 6, src: "static/ranks/iron3.png" },
  { min: 6, max: 7, src: "static/ranks/bronze1.png" },
  { min: 7, max: 8, src: "static/ranks/bronze2.png" },
  { min: 8, max: 9, src: "static/ranks/bronze3.png" },
  { min: 9, max: 10, src: "static/ranks/silver1.png" },
  { min: 10, max: 11, src: "static/ranks/silver2.png" },
  { min: 11, max: 12, src: "static/ranks/silver3.png" },
  { min: 12, max: 13, src: "static/ranks/gold1.png" },
  { min: 13, max: 14, src: "static/ranks/gold2.png" },
  { min: 14, max: 15, src: "static/ranks/gold3.png" },
  { min: 15, max: 15.5, src: "static/ranks/platinum1.png" },
  { min: 15.5, max: 16, src: "static/ranks/platinum2.png" },
  { min: 16, max: 16.5, src: "static/ranks/platinum3.png" },
  { min: 16.5, max: 16.9, src: "static/ranks/diamond1.png" },
  { min: 17, max: 17.2, src: "static/ranks/diamond2.png" },
  { min: 17.2, max: 17.5, src: "static/ranks/diamond3.png" },
  { min: 17.5, max: 17.9, src: "static/ranks/ascendant1.png" },
  { min: 17.9, max: 18.2, src: "static/ranks/ascendant2.png" },
  { min: 18.2, max: 18.5, src: "static/ranks/ascendant3.png" },
  { min: 18.5, max: 18.9, src: "static/ranks/immortal1.png" },
  { min: 18.9, max: 19.2, src: "static/ranks/immortal2.png" },
  { min: 19.2, max: 19.5, src: "static/ranks/immortal3.png" },
  { min: 19.5, max: 999, src: "static/ranks/radiant.png" },
];

// Fonction pour trouver l’image correspondant à la moyenne
function getImageForAverage(average) {
  for (const img of averageImages) {
    if (average >= img.min && average < img.max) {
      return img.src;
    }
  }
  return "static/ranks/unranked.png"; // image par défaut si rien ne correspond
}

// Fonction principale pour dessiner le graphe
function drawAverageCircle(average) {
  const ctx = document.getElementById("averageCircle").getContext("2d");
  const imageSrc = getImageForAverage(average);
  const img = new Image();
  img.src = imageSrc;

  img.onload = () => {
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Moyenne", "Reste"],
        datasets: [
          {
            data: [average, 20 - average],

            backgroundColor: [
              getComputedStyle(document.documentElement)
                .getPropertyValue("--titles-and-graphs")
                .trim(),
              "#444",
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "80%",
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          title: {
            display: true,
            text: average.toFixed(2),
            color: "#FFFFFF",
            font: { size: 20 },
          },
        },
        animation: false,
      },
      plugins: [
        {
          id: "centerImage",
          afterDraw: (chart) => {
            const { ctx, chartArea } = chart;
            const xCenter = (chartArea.left + chartArea.right) / 2;
            const yCenter = (chartArea.top + chartArea.bottom) / 2;
            const size = chart.width * 0.5; // taille = 50 % du canvas

            ctx.save();
            ctx.drawImage(
              img,
              xCenter - size / 2,
              yCenter - size / 2,
              size,
              size,
            );
            ctx.restore();
          },
        },
      ],
    });
  };
}

function drawBarChart(labels, values) {
  // dessiner le graphe de moyennes
  const ctx = document.getElementById("barChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Moyenne",
          data: values,
          backgroundColor: getComputedStyle(document.documentElement)
            .getPropertyValue("--titles-and-graphs")
            .trim(), //"#00D0FF"// ici la couleur des barres
        },
      ],
    },
    options: {
      scales: {
        x: {
          ticks: { color: "#FFFFFF" },
        },
        y: {
          beginAtZero: true,
          max: 20,
          ticks: { color: "#FFFFFF" },
        },
      },
      plugins: {
        legend: {
          labels: { color: "#FFFFFF" },
        },
      },
    },
  });
}
