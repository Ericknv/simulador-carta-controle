<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title data-i18n="title">Cartas de Controle X̄ e R</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" />
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />

  <style>
    body {
      background-color: #f8f9fa;
      color: #212529;
      font-family: Arial, sans-serif;
      padding-bottom: 100px;
      transition: background-color 0.3s, color 0.3s;
    }
    body.dark-mode {
      background-color: #1e1e2f;
      color: #ffffff;
    }
    .container {
      max-width: 900px;
      margin: auto;
      padding: 30px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
      transition: background 0.3s;
    }
    body.dark-mode .container {
      background: #2e2e3e;
    }
    .btn-inline button {
      margin: 5px 5px 5px 0;
    }
    canvas {
      margin-top: 30px;
      width: 100% !important;
      height: auto !important;
      background: #fff;
      border-radius: 5px;
    }
    body.dark-mode canvas {
      background: #3b3b4f;
    }
    #dadosTable input {
      width: 100%;
      padding: 8px;
      text-align: center;
    }
    #dadosTable, #tabela-fdc {
      width: 100%;
      margin-bottom: 20px;
      border-collapse: collapse;
    }
    #dadosTable td, #tabela-fdc td, #tabela-fdc th {
      border: 1px solid #ccc;
      padding: 8px;
    }
    .menu-fixo {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1055;
    }
    .menu-fixo button {
      background-color: #003366;
      color: white;
      border-radius: 10px;
      width: 64px;
      height: 64px;
      font-size: 1.4rem;
      padding: 0;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
    .dark-mode .btn {
      color: white;
    }
  </style>
</head>
<body>
  <div class="menu-fixo">
    <button class="btn shadow" data-bs-toggle="offcanvas" data-bs-target="#offcanvasMenu">
      <i class="fas fa-ellipsis-v"></i>
    </button>
  </div>

  <div class="offcanvas offcanvas-start" id="offcanvasMenu" tabindex="-1">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">Menu</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Fechar"></button>
    </div>
    <div class="offcanvas-body">
      <button class="btn btn-success w-100 mb-2" onclick="adicionarLinha()"><i class="fas fa-plus"></i> Adicionar Amostra</button>
      <button class="btn btn-warning w-100 mb-2" onclick="removerLinha()"><i class="fas fa-minus"></i> Remover Amostra</button>
      <button class="btn btn-danger w-100 mb-2" onclick="limparTabela()"><i class="fas fa-trash"></i> Limpar Tabela</button>
      <button class="btn btn-primary w-100 mb-2" onclick="gerarCartasControle()"><i class="fas fa-chart-line"></i> Gerar Cartas</button>
      <button class="btn btn-secondary w-100 mb-2" onclick="exportarPDF()"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
      <button class="btn btn-info w-100 mb-2" onclick="exportarCSV()"><i class="fas fa-download"></i> Exportar CSV</button>
      <input type="file" class="form-control mb-2" accept=".csv" onchange="importarCSV(event)" />
      <button class="btn btn-dark w-100 mb-2" onclick="alternarModoEscuro()"><i id="iconeModo" class="fas fa-moon"></i> <span id="textoModo">Modo Escuro</span></button>
    </div>
  </div>

  <div class="container mt-3">
    <div class="d-flex justify-content-between mb-3">
      <div>
        <button class="btn btn-dark" onclick="alternarModoEscuro()">
          <i id="iconeModo" class="fas fa-moon"></i> <span id="textoModo">Modo Escuro</span>
        </button>
      </div>
      <div class="d-flex">
        <select id="langSelect" class="form-select w-auto" onchange="setLanguage(this.value)">
          <option value="pt">Português</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>

    <h1 class="text-center" data-i18n="title">Cartas de Controle X̄ e R</h1>

    <label for="tamanho" data-i18n="sizeLabel">Tamanho da amostra (n):</label>
    <input type="number" id="tamanho" class="form-control" value="3" min="2" onchange="gerarTabelaInputs()" />

    <label data-i18n="fillLabel">Preencha os valores das amostras:</label>
    <div class="btn-inline">
      <button class="btn btn-success" onclick="adicionarLinha()" data-i18n-html="add">+ Adicionar Amostra</button>
      <button class="btn btn-warning" onclick="removerLinha()" data-i18n-html="remove">- Remover Amostra</button>
      <button class="btn btn-danger" onclick="limparTabela()" data-i18n-html="clear">🗑️ Limpar Tabela</button>
    </div>

    <table id="dadosTable"></table>

    <button class="btn btn-primary w-100" onclick="gerarCartasControle()" data-i18n-html="generate">Gerar Cartas</button>
    <button class="btn btn-secondary w-100 mt-2" onclick="exportarPDF()" data-i18n-html="export">📄 Exportar para PDF</button>

    <canvas id="graficoX"></canvas>
    <canvas id="graficoR"></canvas>
    <div id="fdc"></div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="script.js"></script>

  <script>
    function alternarModoEscuro() {
      document.body.classList.toggle('dark-mode');
      const escuro = document.body.classList.contains('dark-mode');
      document.getElementById('iconeModo').className = escuro ? 'fas fa-sun' : 'fas fa-moon';
      document.getElementById('textoModo').textContent = escuro ? 'Modo Claro' : 'Modo Escuro';
      localStorage.setItem('modoEscuro', escuro);
      if (typeof updateCharts === 'function') updateCharts();
    }

    window.addEventListener('DOMContentLoaded', () => {
      const escuro = localStorage.getItem('modoEscuro') === 'true';
      if (escuro) document.body.classList.add('dark-mode');
      document.getElementById('iconeModo').className = escuro ? 'fas fa-sun' : 'fas fa-moon';
      document.getElementById('textoModo').textContent = escuro ? 'Modo Claro' : 'Modo Escuro';
    });
  </script>
</body>
</html>
