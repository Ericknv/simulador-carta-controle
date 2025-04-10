// script.js

let chartX = null;
let chartR = null;

function gerarTabelaInputs() {
  const n = parseInt(document.getElementById("tamanho").value);
  const tabela = document.getElementById("dadosTable");
  tabela.innerHTML = "";
  for (let i = 0; i < 5; i++) adicionarLinha();
}

function adicionarLinha() {
  const n = parseInt(document.getElementById("tamanho").value);
  const tabela = document.getElementById("dadosTable");
  const row = tabela.insertRow();
  for (let j = 0; j < n; j++) {
    const cell = row.insertCell();
    const input = document.createElement("input");
    input.type = "number";
    input.classList.add("form-control");
    input.placeholder = `A${tabela.rows.length} - V${j + 1}`;
    input.title = "Digite o valor da medição para esta posição";
    input.addEventListener("input", salvarLocal);
    cell.appendChild(input);
  }
  salvarLocal();
}

function removerLinha() {
  const tabela = document.getElementById("dadosTable");
  if (tabela.rows.length > 0) tabela.deleteRow(tabela.rows.length - 1);
  salvarLocal();
}

function limparTabela() {
  if (confirm("Tem certeza que deseja limpar os dados?")) {
    document.getElementById("dadosTable").innerHTML = "";
    localStorage.removeItem("dadosControle");
    salvarLocal();
  }
}

function salvarLocal() {
  const tabela = document.getElementById("dadosTable");
  const dados = [];
  for (const row of tabela.rows) {
    const valores = [];
    for (const cell of row.cells) {
      const val = parseFloat(cell.firstChild.value);
      valores.push(isNaN(val) ? "" : val);
    }
    dados.push(valores);
  }
  localStorage.setItem("dadosControle", JSON.stringify(dados));
}

function carregarLocal() {
  const dados = JSON.parse(localStorage.getItem("dadosControle"));
  if (!dados) return;
  const tabela = document.getElementById("dadosTable");
  tabela.innerHTML = "";
  for (const linha of dados) {
    const row = tabela.insertRow();
    for (const valor of linha) {
      const cell = row.insertCell();
      const input = document.createElement("input");
      input.type = "number";
      input.classList.add("form-control");
      input.placeholder = "valor";
      input.value = valor;
      input.addEventListener("input", salvarLocal);
      cell.appendChild(input);
    }
  }
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Carta de Controle X̄", 10, 10);
  const imgX = document.getElementById("graficoX").toDataURL();
  doc.addImage(imgX, 'PNG', 10, 15, 180, 80);
  doc.text("Carta de Controle R", 10, 100);
  const imgR = document.getElementById("graficoR").toDataURL();
  doc.addImage(imgR, 'PNG', 10, 105, 180, 80);
  doc.save("cartas_controle.pdf");
}

function exportarCSV() {
  let csv = "";
  const tabela = document.getElementById("dadosTable");
  for (const row of tabela.rows) {
    const linha = Array.from(row.cells).map(cell => cell.firstChild.value).join(",");
    csv += linha + "\n";
  }
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "amostras.csv";
  link.click();
}

function importarCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const linhas = e.target.result.trim().split("\n");
    const tabela = document.getElementById("dadosTable");
    tabela.innerHTML = "";
    for (const linha of linhas) {
      const row = tabela.insertRow();
      for (const valor of linha.split(",")) {
        const cell = row.insertCell();
        const input = document.createElement("input");
        input.type = "number";
        input.classList.add("form-control");
        input.value = valor;
        input.addEventListener("input", salvarLocal);
        cell.appendChild(input);
      }
    }
  };
  reader.readAsText(file);
}

function gerarCartasControle() {
  const tabela = document.getElementById("dadosTable");
  const n = parseInt(document.getElementById("tamanho").value);
  const amostras = [];

  for (const row of tabela.rows) {
    const linha = [];
    for (const cell of row.cells) {
      const val = parseFloat(cell.firstChild.value);
      if (!isNaN(val)) linha.push(val);
    }
    if (linha.length === n) amostras.push(linha);
  }

  if (amostras.length < 2) {
    alert("Insira ao menos duas amostras completas.");
    return;
  }

  const medias = amostras.map(a => a.reduce((a, b) => a + b, 0) / a.length);
  const amplitudes = amostras.map(a => Math.max(...a) - Math.min(...a));
  const mediaX = medias.reduce((a, b) => a + b, 0) / medias.length;
  const mediaR = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;

  const A2 = {2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577}[n] || 0.577;
  const D3 = {2: 0, 3: 0, 4: 0, 5: 0}[n] || 0;
  const D4 = {2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114}[n] || 2.114;

  const lscX = mediaX + A2 * mediaR;
  const licX = mediaX - A2 * mediaR;
  const lscR = D4 * mediaR;
  const licR = D3 * mediaR;

  const ctxX = document.getElementById("graficoX").getContext("2d");
  const ctxR = document.getElementById("graficoR").getContext("2d");
  if (chartX) chartX.destroy();
  if (chartR) chartR.destroy();

  const isDark = document.body.classList.contains("dark-mode");
  const textColor = isDark ? '#fff' : '#000';

  chartX = new Chart(ctxX, {
    type: 'line',
    data: {
      labels: medias.map((_, i) => `Amostra ${i + 1}`),
      datasets: [
        {
          label: 'Média (X̄)',
          data: medias,
          borderColor: '#007bff',
          backgroundColor: medias.map(v => (v > lscX || v < licX ? 'red' : '#007bff')),
          pointBackgroundColor: medias.map(v => (v > lscX || v < licX ? 'red' : '#007bff')),
          tension: 0.2
        },
        {
          label: 'Média Geral', data: Array(medias.length).fill(mediaX), borderColor: 'gray', borderDash: [5, 5]
        },
        {
          label: 'LSC', data: Array(medias.length).fill(lscX), borderColor: 'red', borderDash: [5, 5]
        },
        {
          label: 'LIC', data: Array(medias.length).fill(licX), borderColor: 'red', borderDash: [5, 5]
        }
      ]
    },
    options: {
      plugins: { legend: { labels: { color: textColor } }, title: { display: true, text: 'Carta X̄', color: textColor } },
      scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor } } }
    }
  });

  chartR = new Chart(ctxR, {
    type: 'line',
    data: {
      labels: amplitudes.map((_, i) => `Amostra ${i + 1}`),
      datasets: [
        {
          label: 'Amplitude (R)',
          data: amplitudes,
          borderColor: '#17a2b8',
          backgroundColor: amplitudes.map(v => (v > lscR || v < licR ? 'red' : '#17a2b8')),
          pointBackgroundColor: amplitudes.map(v => (v > lscR || v < licR ? 'red' : '#17a2b8')),
          tension: 0.2
        },
        {
          label: 'Média R', data: Array(amplitudes.length).fill(mediaR), borderColor: 'gray', borderDash: [5, 5]
        },
        {
          label: 'LSC', data: Array(amplitudes.length).fill(lscR), borderColor: 'red', borderDash: [5, 5]
        },
        {
          label: 'LIC', data: Array(amplitudes.length).fill(licR), borderColor: 'red', borderDash: [5, 5]
        }
      ]
    },
    options: {
      plugins: { legend: { labels: { color: textColor } }, title: { display: true, text: 'Carta R', color: textColor } },
      scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor } } }
    }
  });

  const fdcX = medias.map((v, i) => ({ tipo: 'X̄', amostra: i + 1, valor: v })).filter(p => p.valor > lscX || p.valor < licX);
  const fdcR = amplitudes.map((v, i) => ({ tipo: 'R', amostra: i + 1, valor: v })).filter(p => p.valor > lscR || p.valor < licR);

  const fdc = [...fdcX, ...fdcR];
  let html = "";
  if (fdc.length > 0) {
    html = `<h4>Pontos Fora de Controle</h4><table class='table table-bordered'><tr><th>Tipo</th><th>Amostra</th><th>Valor</th></tr>${fdc.map(p => `<tr><td>${p.tipo}</td><td>${p.amostra}</td><td>${p.valor.toFixed(2)}</td></tr>`).join('')}</table>`;
  } else {
    html = `<div class='alert alert-success mt-3'>Todos os pontos estão dentro dos limites de controle.</div>`;
  }
  document.getElementById("fdc").innerHTML = html;
}

window.onload = () => {
  carregarLocal();
};
