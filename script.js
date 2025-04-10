// script.js

let cartaX, cartaR;

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
      export: 'Exportar PDF',
      darkMode: 'Modo Escuro',
      lightMode: 'Modo Claro',
      noOut: 'Todos os pontos estão dentro dos limites de controle.',
      outPoints: 'Pontos Fora de Controle'
    },
    en: {
      title: 'Control Charts X̄ and R',
      sizeLabel: 'Sample size (n):',
      fillLabel: 'Enter sample values:',
      add: 'Add Sample',
      remove: 'Remove Sample',
      clear: 'Clear Table',
      generate: 'Generate Charts',
      export: 'Export PDF',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      noOut: 'All points are within control limits.',
      outPoints: 'Out of Control Points'
    }
  };

  const t = texts[lang];
  document.title = t.title;
  document.querySelector('[data-i18n="title"]').innerText = t.title;
  document.querySelector('[data-i18n="sizeLabel"]').innerText = t.sizeLabel;
  document.querySelector('[data-i18n="fillLabel"]').innerText = t.fillLabel;

  document.querySelectorAll('[data-i18n-html]').forEach(btn => {
    const key = btn.getAttribute('data-i18n-html');
    if (t[key]) btn.innerHTML = btn.innerHTML.replace(/>.+<\//, `>${t[key]}</`);
  });

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });

  const modo = document.body.classList.contains('dark-mode') ? 'lightMode' : 'darkMode';
  const icone = document.getElementById('iconeModo');
  const texto = document.getElementById('textoModo');
  icone.className = modo === 'lightMode' ? 'fas fa-sun' : 'fas fa-moon';
  texto.textContent = t[modo];

  localStorage.setItem('lang', lang);
}

function alternarModoEscuro() {
  document.body.classList.toggle('dark-mode');
  const lang = localStorage.getItem('lang') || 'pt';
  setLanguage(lang);
  atualizarEstiloGraficos();
  localStorage.setItem('modoEscuro', document.body.classList.contains('dark-mode'));
}

function atualizarEstiloGraficos() {
  const cor = document.body.classList.contains('dark-mode') ? '#fff' : '#000';
  if (cartaX) {
    cartaX.options.plugins.title.color = cor;
    cartaX.options.plugins.legend.labels.color = cor;
    cartaX.update();
  }
  if (cartaR) {
    cartaR.options.plugins.title.color = cor;
    cartaR.options.plugins.legend.labels.color = cor;
    cartaR.update();
  }
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
    cell.appendChild(input);
  }
}

function removerLinha() {
  const tabela = document.getElementById("dadosTable");
  if (tabela.rows.length > 1) tabela.deleteRow(tabela.rows.length - 1);
}

function limparTabela() {
  document.getElementById("dadosTable").innerHTML = "";
  document.getElementById("fdc").innerHTML = "";
  if (cartaX) cartaX.destroy();
  if (cartaR) cartaR.destroy();
}

function gerarCartasControle() {
  const n = parseInt(document.getElementById("tamanho").value);
  const tabela = document.getElementById("dadosTable");
  const amostras = Array.from(tabela.rows)
    .map(row => Array.from(row.cells)
      .map(cell => parseFloat(cell.firstChild.value)))
    .filter(amostra => amostra.length === n && amostra.every(v => !isNaN(v)));

  if (amostras.length < 2) return alert("Preencha ao menos duas amostras completas.");

  const medias = amostras.map(am => am.reduce((a, b) => a + b) / am.length);
  const amplitudes = amostras.map(am => Math.max(...am) - Math.min(...am));

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
  const cor = document.body.classList.contains('dark-mode') ? '#fff' : '#000';

  const outX = medias.map((v, i) => (v < licX || v > lscX) ? i + 1 : null).filter(Boolean);
  const outR = amplitudes.map((v, i) => (v < licR || v > lscR) ? i + 1 : null).filter(Boolean);

  document.getElementById("fdc").innerHTML = (outX.length || outR.length)
    ? `<h5>${getText('outPoints')}</h5><p>${[...outX.map(i => `X̄ A${i}`), ...outR.map(i => `R A${i}`)].join(', ')}</p>`
    : `<h5>${getText('noOut')}</h5>`;

  if (cartaX) cartaX.destroy();
  if (cartaR) cartaR.destroy();

  const ctxX = document.getElementById("graficoX").getContext("2d");
  cartaX = new Chart(ctxX, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {label: 'X̄', data: medias, borderColor: '#0984e3', backgroundColor: 'rgba(9,132,227,0.1)'},
        {label: 'Média', data: Array(medias.length).fill(mediaX), borderColor: cor, borderDash: [5, 5], fill: false},
        {label: 'LSC', data: Array(medias.length).fill(lscX), borderColor: '#d63031', borderDash: [5, 5]},
        {label: 'LIC', data: Array(medias.length).fill(licX), borderColor: '#d63031', borderDash: [5, 5]}
      ]
    },
    options: {plugins: {legend: {labels: {color: cor}}, title: {display: true, text: 'Carta X̄', color: cor}}}
  });

  const ctxR = document.getElementById("graficoR").getContext("2d");
  cartaR = new Chart(ctxR, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {label: 'R', data: amplitudes, borderColor: '#6c5ce7', backgroundColor: 'rgba(108,92,231,0.1)'},
        {label: 'Média', data: Array(amplitudes.length).fill(mediaR), borderColor: cor, borderDash: [5, 5], fill: false},
        {label: 'LSC', data: Array(amplitudes.length).fill(lscR), borderColor: '#d63031', borderDash: [5, 5]},
        {label: 'LIC', data: Array(amplitudes.length).fill(licR), borderColor: '#d63031', borderDash: [5, 5]}
      ]
    },
    options: {plugins: {legend: {labels: {color: cor}}, title: {display: true, text: 'Carta R', color: cor}}}
  });
}

function getText(key) {
  const lang = localStorage.getItem('lang') || 'pt';
  const dict = {
    pt: {
      noOut: 'Todos os pontos estão dentro dos limites de controle.',
      outPoints: 'Pontos Fora de Controle'
    },
    en: {
      noOut: 'All points are within control limits.',
      outPoints: 'Out of Control Points'
    }
  };
  return dict[lang][key];
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text("Carta de Controle X̄", 10, 10);
  pdf.addImage(document.getElementById("graficoX").toDataURL(), 'PNG', 10, 15, 180, 80);
  pdf.text("Carta de Controle R", 10, 105);
  pdf.addImage(document.getElementById("graficoR").toDataURL(), 'PNG', 10, 110, 180, 80);
  pdf.save("cartas_de_controle.pdf");
}

window.addEventListener("DOMContentLoaded", () => {
  const lang = localStorage.getItem('lang') || 'pt';
  const escuro = localStorage.getItem('modoEscuro') === 'true';
  document.body.classList.toggle('dark-mode', escuro);
  setLanguage(lang);
  gerarTabelaInputs();
});
