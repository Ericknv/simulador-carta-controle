// script.js

// Tradução dinâmica
function setLanguage(lang) {
  const texts = {
    pt: {
      title: 'Cartas de Controle X̄ e R',
      sizeLabel: 'Tamanho da amostra (n):',
      fillLabel: 'Preencha os valores das amostras:',
      add: 'Adicionar Amostra',
      remove: 'Remover Amostra',
      clear: 'Limpar Tabela',
      generate: 'Gerar Cartas',
      export: 'Exportar para PDF',
      chartX: 'Carta de Controle X̄',
      chartR: 'Carta de Controle R',
      outControl: 'Pontos Fora de Controle',
      inControl: 'Todos os pontos estão dentro dos limites de controle.',
      darkMode: 'Modo Escuro'
    },
    en: {
      title: 'Control Charts X̄ and R',
      sizeLabel: 'Sample size (n):',
      fillLabel: 'Enter sample values:',
      add: 'Add Sample',
      remove: 'Remove Sample',
      clear: 'Clear Table',
      generate: 'Generate Charts',
      export: 'Export to PDF',
      chartX: 'Control Chart X̄',
      chartR: 'Control Chart R',
      outControl: 'Out of Control Points',
      inControl: 'All points are within control limits.',
      darkMode: 'Dark Mode'
    }
  };
  const t = texts[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerText = t[key];
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (t[key]) el.innerHTML = t[key];
  });
  localStorage.setItem('lang', lang);
}

window.addEventListener('DOMContentLoaded', () => {
  const lang = localStorage.getItem('lang') || 'pt';
  document.getElementById('langSelect').value = lang;
  setLanguage(lang);
  gerarTabelaInputs();
  restaurarAmostrasSalvas();
});

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  atualizarTemaGrafico();
}

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
    input.placeholder = `A${tabela.rows.length} - V${j+1}`;
    input.title = "Digite o valor da medição para esta amostra";
    input.addEventListener('input', salvarAmostrasLocal);
    cell.appendChild(input);
  }
  salvarAmostrasLocal();
}

function removerLinha() {
  const tabela = document.getElementById("dadosTable");
  if (tabela.rows.length > 1) tabela.deleteRow(tabela.rows.length - 1);
  salvarAmostrasLocal();
}

function limparTabela() {
  if (confirm("Tem certeza que deseja limpar a tabela?")) {
    document.getElementById("dadosTable").innerHTML = "";
    localStorage.removeItem('amostras');
  }
}

function salvarAmostrasLocal() {
  const tabela = document.getElementById("dadosTable");
  const dados = [];
  for (let i = 0; i < tabela.rows.length; i++) {
    const linha = [];
    for (let j = 0; j < tabela.rows[i].cells.length; j++) {
      linha.push(tabela.rows[i].cells[j].firstChild.value);
    }
    dados.push(linha);
  }
  localStorage.setItem("amostras", JSON.stringify(dados));
}

function restaurarAmostrasSalvas() {
  const json = localStorage.getItem("amostras");
  if (!json) return;
  const dados = JSON.parse(json);
  const tabela = document.getElementById("dadosTable");
  tabela.innerHTML = "";
  for (let i = 0; i < dados.length; i++) {
    const row = tabela.insertRow();
    for (let j = 0; j < dados[i].length; j++) {
      const cell = row.insertCell();
      const input = document.createElement("input");
      input.type = "number";
      input.value = dados[i][j];
      input.placeholder = `A${i+1} - V${j+1}`;
      input.title = "Digite o valor da medição para esta amostra";
      input.addEventListener('input', salvarAmostrasLocal);
      cell.appendChild(input);
    }
  }
}

let cartaX, cartaR;
function gerarCartasControle() {
  const n = parseInt(document.getElementById("tamanho").value);
  const tabela = document.getElementById("dadosTable");
  const amostras = [];

  for (let i = 0; i < tabela.rows.length; i++) {
    const valores = [];
    for (let j = 0; j < n; j++) {
      const val = parseFloat(tabela.rows[i].cells[j].firstChild.value);
      if (!isNaN(val)) valores.push(val);
    }
    if (valores.length === n) amostras.push(valores);
  }

  if (amostras.length < 2) {
    alert("Preencha ao menos duas amostras completas.");
    return;
  }

  const medias = amostras.map(g => g.reduce((a, b) => a + b, 0) / g.length);
  const amplitudes = amostras.map(g => Math.max(...g) - Math.min(...g));

  const mediaX = medias.reduce((a, b) => a + b, 0) / medias.length;
  const mediaR = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;

  const A2 = {2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483}[n] || 0.577;
  const D3 = {2: 0, 3: 0, 4: 0, 5: 0, 6: 0.076}[n] || 0;
  const D4 = {2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004}[n] || 2.114;

  const lscX = mediaX + A2 * mediaR;
  const licX = mediaX - A2 * mediaR;
  const lscR = D4 * mediaR;
  const licR = D3 * mediaR;

  const labels = amostras.map((_, i) => `Amostra ${i + 1}`);
  const linha = len => Array(len);

  const fdcX = medias.map((v, i) => ({ tipo: 'X̄', index: i + 1, valor: v })).filter(p => p.valor > lscX || p.valor < licX);
  const fdcR = amplitudes.map((v, i) => ({ tipo: 'R', index: i + 1, valor: v })).filter(p => p.valor > lscR || p.valor < licR);
  const fdc = [...fdcX, ...fdcR];

  document.getElementById("fdc").innerHTML = fdc.length ?
    `<h3>Pontos Fora de Controle</h3><table id='tabela-fdc'><tr><th>Tipo</th><th>Amostra</th><th>Valor</th></tr>${fdc.map(p => `<tr><td>${p.tipo}</td><td>${p.index}</td><td>${p.valor}</td></tr>`).join('')}</table>` :
    `<h3>Todos os pontos estão dentro dos limites de controle.</h3>`;

  const cor = document.body.classList.contains('dark-mode') ? '#fff' : '#000';
  const corFora = '#d63031';

  const config = (id, dados, media, lsc, lic, titulo, corLinha) => new Chart(document.getElementById(id), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: titulo,
          data: dados,
          borderColor: corLinha,
          pointBackgroundColor: dados.map(v => v > lsc || v < lic ? corFora : corLinha),
          fill: false,
          tension: 0.3,
          pointRadius: 6,
          pointHoverRadius: 8
        },
        { label: 'Média', data: linha(dados.length).fill(media), borderColor: cor, borderDash: [5, 5], fill: false },
        { label: 'LSC', data: linha(dados.length).fill(lsc), borderColor: corFora, borderDash: [5, 5], fill: false },
        { label: 'LIC', data: linha(dados.length).fill(lic), borderColor: corFora, borderDash: [5, 5], fill: false }
      ]
    },
    options: {
      responsive: true,
      animation: {
        duration: 1000,
        easing: 'easeOutBounce'
      },
      plugins: {
        title: { display: true, text: titulo, color: cor },
        legend: { labels: { color: cor } }
      },
      scales: {
        x: { ticks: { color: cor } },
        y: { ticks: { color: cor } }
      }
    }
  });

  if (cartaX) cartaX.destroy();
  cartaX = config("graficoX", medias, mediaX, lscX, licX, "Carta de Controle X̄", '#0984e3');

  if (cartaR) cartaR.destroy();
  cartaR = config("graficoR", amplitudes, mediaR, lscR, licR, "Carta de Controle R", '#6c5ce7');
}

function atualizarTemaGrafico() {
  if (cartaX || cartaR) gerarCartasControle();
}

async function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  const canvasX = document.getElementById("graficoX");
  const canvasR = document.getElementById("graficoR");
  pdf.text("Carta de Controle X̄", 10, 10);
  pdf.addImage(canvasX.toDataURL("image/png"), 'PNG', 10, 15, 180, 80);
  pdf.text("Carta de Controle R", 10, 105);
  pdf.addImage(canvasR.toDataURL("image/png"), 'PNG', 10, 110, 180, 80);
  pdf.save("cartas_de_controle.pdf");
}
