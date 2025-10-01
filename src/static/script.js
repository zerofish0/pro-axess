function login() { //se connecter
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      document.getElementById("login").style.display = "none";
      document.querySelector('.bottom-left').remove();
      document.getElementById("dashboard").style.display = "block";

      const greeting = document.getElementById('greeting');
      const hour = new Date().getHours();
      if (hour >= 19 || hour < 5) {
        greeting.textContent = `Bonsoir ${data.infos.name} 🌙`;
      } else if (hour >= 5 && hour < 12) {
        greeting.textContent = `Bonjour ${data.infos.name} 👋`;
      } else {
        greeting.textContent = `Bon après-midi ${data.infos.name} ☀️`;
      }
      
      loadGrades();
      loadHomework();
      loadPlanner();
    } else {
      document.getElementById("error").innerText = data.error;
    }
  });
}

function loadGrades_out() { // afficher une liste des moyennes (plus utilisé)
  fetch("/grades")
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("grades");
      list.innerHTML = '';
      for (let matiere in data) {
        const moyenne = data[matiere].average;
        const li = document.createElement("li");
        li.innerText = `${matiere} : ${moyenne}`;
        list.appendChild(li);
      }
    });
}

function loadGrades() { // dessiner le graphique des matières et de la moyenne générale
  fetch("/grades")
    .then(res => res.json())
    .then(data => {

      let total = 0;
      let count = 0;
      const labels = [];
      const values = [];
      let globavg = data["global_avg"]

      delete data["global_avg"];
      for (let matiere in data) {
        const moyenne = data[matiere].average;
        if (!isNaN(moyenne)) {
          total += moyenne;
          count++;
          labels.push(matiere);
          values.push(moyenne);
        }
      }

      const generalAverage = total / count;

      drawAverageCircle(generalAverage);
      drawBarChart(labels, values);
    });
}

function loadHomework() { // afficher les devoirs
  fetch("/homework")
    .then(res => res.json())
    .then(data => {
      console.log("DEBUGGING");
      const list = document.getElementById("homework");
      list.innerHTML = ''; // On vide d'abord la liste

      // Vérifier si les devoirs existent
      let devoirsExistants = false;

      for (let matiere in data) {
        if (data[matiere].length > 0) { // Si la matière a des devoirs
          devoirsExistants = true;
          data[matiere].forEach(devoir => {
            const li = document.createElement("li");
            li.innerHTML = `• <strong>${matiere}</strong> : ${devoir}`;//            li.innerText = `• ${matiere} : ${devoir}`;
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
function loadPlanner() { // afficher les cours de demain
  fetch("/planner")
    .then(res => res.json())
    .then(data => {
      const list = document.getElementById("planner");
      list.innerHTML = '';

      if (data.length === 0) {
        const li = document.createElement("li");
        li.innerText = "Pas cours 🎉";
        list.appendChild(li);
        return;
      }

      data.forEach(matiere => {
        const li = document.createElement("li");
        li.innerText = `• ${matiere}`;
        list.appendChild(li);
      });
    })
    .catch(err => console.error("Erreur planner:", err));
}


// Échelle moyenne → image
const averageImages = [
  { min: 0, max: 7.99, src: "images/rouge.png" },
  { min: 8, max: 9.99, src: "images/orange.png" },
  { min: 10, max: 13.99, src: "images/jaune.png" },
  { min: 14, max: 15.99, src: "images/vert.png" },
  { min: 16, max: 20, src: "images/vert-fonce.png" }
];

// Fonction pour trouver l’image correspondant à la moyenne
function getImageForAverage(average) {
  for (const img of averageImages) {
    if (average >= img.min && average <= img.max) {
      return img.src;
    }
  }
  return "images/default.png"; // image par défaut si rien ne correspond
}

// Fonction principale pour dessiner le graphe
function drawAverageCircle(average) {
  const ctx = document.getElementById("averageCircle").getContext("2d");
  const imageSrc = getImageForAverage(average);
  const img = new Image();
  img.src = "static/icons/icon-512.png";//imageSrc;

  img.onload = () => {
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Moyenne", "Reste"],
        datasets: [
          {
            data: [average, 20 - average],
            backgroundColor: ["#1dfa00", "#444"],
            borderWidth: 0
          }
        ]
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
            font: { size: 20 }
          }
        },
        animation: false
      },
      plugins: [
        {
          id: "centerImage",
          afterDraw: chart => {
            const { ctx, chartArea } = chart;
            const xCenter = (chartArea.left + chartArea.right) / 2;
            const yCenter = (chartArea.top + chartArea.bottom) / 2;
            const size = chart.width * 0.5; // taille = 20 % du canvas

            ctx.save();
            ctx.drawImage(img, xCenter - size / 2, yCenter - size / 2, size, size);
            ctx.restore();
          }
        }
      ]
    });
  };
}


function drawBarChart(labels, values) { // dessiner le graphe de moyennes
  const ctx = document.getElementById("barChart").getContext("2d");
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: "Moyenne",
        data: values,
        backgroundColor: "#1dfa00" //"#00D0FF"// ici la couleur des barres
      }]
    },
    options: {
      scales: {
        x: {
          ticks: { color: "#FFFFFF" }
        },
        y: {
          beginAtZero: true,
          max: 20,
          ticks: { color: "#FFFFFF" }
        }
      },
      plugins: {
        legend: {
          labels: { color: "#FFFFFF" }
        }
      }
    }
  });
}

