function login() {
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
      document.getElementById("dashboard").style.display = "block";
      document.getElementById("greeting").innerText = `Bonjour ${data.infos.name} 👋`;
      loadGrades();
      loadHomework();
      loadPlanner();
    } else {
      document.getElementById("error").innerText = data.error;
    }
  });
}

function loadGrades_out() {
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

function loadGrades() {
  fetch("/grades")
    .then(res => res.json())
    .then(data => {
      //const list = document.getElementById("grades");
      //list.innerHTML = '';

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

        //const li = document.createElement("li");
        // cannot delete Note in index.html, it break evrything
        //li.innerText = `${matiere} : ${data[matiere].average}`;
        //list.appendChild(li);
      }

      const generalAverage = total / count;

      drawAverageCircle(generalAverage);
      drawBarChart(labels, values);
    });
}

function loadHomework() {
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
function loadPlanner() {
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


function drawAverageCircle(average) {
  const ctx = document.getElementById("averageCircle").getContext("2d");
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ["Moyenne", "Reste"],
      datasets: [{
        data: [average, 20 - average],
        backgroundColor: ["#00D0FF", "#444"],//ici la couleur du cercle
        borderWidth: 0
      }]
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
      }
    }
  });
}

function drawBarChart(labels, values) {
  const ctx = document.getElementById("barChart").getContext("2d");
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: "Moyenne",
        data: values,
        backgroundColor: "#00D0FF"// ici la couleur des barres
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

