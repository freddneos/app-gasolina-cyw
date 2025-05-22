// Export table data to CSV and trigger download
const exportRelatorioToCSV = () => {
    // Get the currently displayed (filtered) abastecimentos
    const rows = Array.from(document.querySelectorAll('#relatorioTable tr'));
    if (!rows.length) {
        showAlert('Nenhum dado para exportar.', 'warning');
        return;
    }

    // Table headers
    const headers = ['Data', 'Usuário', 'Veículo', 'Posto', 'Combustível', 'Litros', 'KM'];
    const csvRows = [headers.join(',')];

    // Only export rows with 7 columns (skip loading or empty rows)
    rows.forEach(row => {
        const cols = Array.from(row.querySelectorAll('td'));
        if (cols.length === 7) {
            const values = cols.map(td => '"' + td.textContent.replace(/"/g, '""').trim() + '"');
            csvRows.push(values.join(','));
        }
    });

    if (csvRows.length === 1) {
        showAlert('Nenhum dado para exportar.', 'warning');
        return;
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_abastecimentos_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
// App Gasolina - JavaScript

// Configurações da API SheetDB
const API_BASE_URL = 'https://sheetdb.io/api/v1/6db94sirura40';

// Estado da aplicação
let currentUser = null;
let allData = {
    usuarios: [],
    veiculos: [],
    postos: [],
    abastecimentos: []
};

// Utilitários
const showLoading = () => {
    document.getElementById('loadingSpinner').classList.remove('d-none');
};

const hideLoading = () => {
    document.getElementById('loadingSpinner').classList.add('d-none');
};

const showAlert = (message, type = 'success') => {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    const alert = document.createElement('div');
    alert.id = alertId;
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        const alertElement = document.getElementById(alertId);
        if (alertElement) {
            alertElement.remove();
        }
    }, 5000);
};

const showScreen = (screenId) => {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    document.getElementById(screenId).classList.add('active');
};

const generateId = (prefix) => {
    return prefix + Date.now().toString().substr(-6);
};

// API Functions
const fetchData = async (endpoint) => {
    try {
        const response = await fetch(`${API_BASE_URL}?sheet=${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Data fetched from ${endpoint}:`, data);
        return data;
    } catch (error) {
        console.error(`Erro ao buscar dados de ${endpoint}:`, error);
        showAlert(`Erro ao carregar dados de ${endpoint}`, 'danger');
        return [];
    }
};

const postData = async (endpoint, data) => {
    try {
        // SheetDB requires data in { "data": [{ record }] } format
        const wrappedData = { data: [data] };
        console.log('Sending data to SheetDB in wrapped format:', wrappedData);
        
        const response = await fetch(`${API_BASE_URL}?sheet=${endpoint}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(wrappedData)
        });
        
        const responseText = await response.text();
        console.log('SheetDB response:', responseText);
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
        }
        
        return responseText ? JSON.parse(responseText) : {};
    } catch (error) {
        console.error(`Erro ao enviar dados para ${endpoint}:`, error);
        throw error;
    }
};

// Authentication
const login = async (username, pin) => {
    showLoading();
    
    try {
        const usuarios = await fetchData('usuarios');
        const user = usuarios.find(u => u.usuario === username && u.pin === pin);
        
        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            if (user.tipo === 'M') {
                await loadMotoristaScreen();
                showScreen('motoristaScreen');
            } else if (user.tipo === 'A') {
                await loadAdminScreen();
                showScreen('adminScreen');
            }
            
            showAlert(`Bem-vindo, ${user.nome}!`, 'success');
        } else {
            showAlert('Usuário ou PIN incorretos!', 'danger');
        }
    } catch (error) {
        showAlert('Erro ao fazer login. Tente novamente.', 'danger');
    } finally {
        hideLoading();
    }
};

const logout = () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showScreen('loginScreen');
    document.getElementById('loginForm').reset();
    showAlert('Logout realizado com sucesso!', 'info');
};

// Load data for different screens
const loadMotoristaScreen = async () => {
    showLoading();
    
    try {
        // Load vehicles and gas stations
        allData.veiculos = await fetchData('veiculos');
        allData.postos = await fetchData('postos');
        
        // Populate vehicle select
        const veiculoSelect = document.getElementById('veiculo');
        veiculoSelect.innerHTML = '<option value="">Selecione um veículo</option>';
        allData.veiculos.forEach(veiculo => {
            veiculoSelect.innerHTML += `<option value="${veiculo.id}">${veiculo.placa} - ${veiculo.cor}</option>`;
        });
        
        // Populate gas station select
        const postoSelect = document.getElementById('posto');
        postoSelect.innerHTML = '<option value="">Selecione um posto</option>';
        allData.postos.forEach(posto => {
            postoSelect.innerHTML += `<option value="${posto.id}">${posto.nome}</option>`;
        });
        
        // Set current date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('data').value = today;
        
        // Update header
        document.getElementById('userNameHeader').textContent = currentUser.nome;
        
    } catch (error) {
        showAlert('Erro ao carregar dados da tela', 'danger');
    } finally {
        hideLoading();
    }
};

const loadAdminScreen = async () => {
    showLoading();
    try {
        // Load all data
        allData.usuarios = await fetchData('usuarios');
        allData.veiculos = await fetchData('veiculos');
        allData.postos = await fetchData('postos');
        allData.abastecimentos = await fetchData('abastecimentos');

        // Populate filter selects
        populateFilterSelects();

        // Render dashboard cards
        renderDashboardCards();

        // Load reports
        await loadReports();

        // Update header
        document.getElementById('adminNameHeader').textContent = currentUser.nome;
    } catch (error) {
        console.log('ERROR:', error);   
        showAlert('Erro ao carregar dados da tela de administração', 'danger');
    } finally {
        hideLoading();
    }
};

// Render Morris.js dashboard cards


function renderDashboardCards() {
    // Clean up previous charts if any (Morris.js does not have a destroy method)
    if (window.totalAbastecimentosChart) {
        document.getElementById('totalAbastecimentosChart').innerHTML = '';
        window.totalAbastecimentosChart = null;
    }
    if (window.totalLitrosChart) {
        document.getElementById('totalLitrosChart').innerHTML = '';
        window.totalLitrosChart = null;
    }
    if (window.topUsuarioChart) {
        document.getElementById('topUsuarioChart').innerHTML = '';
        window.topUsuarioChart = null;
    }

    // 1. Total de abastecimentos (Bar Chart)
    window.totalAbastecimentosChart = new Morris.Bar({
        element: 'totalAbastecimentosChart',
        data: [
            { label: 'Abastecimentos', value: allData.abastecimentos.length }
        ],
        xkey: 'label',
        ykeys: ['value'],
        labels: ['Total'],
        barColors: ['#0d6efd'],
        hideHover: 'auto',
        resize: true
    });

    // 2. Total de litros abastecidos (Line Chart)
    // Para o gráfico de linha, mostrar evolução por mês
    const litrosPorMes = {};
    allData.abastecimentos.forEach(a => {
        const mes = (a.data || '').slice(0, 7); // yyyy-mm
        if (!litrosPorMes[mes]) litrosPorMes[mes] = 0;
        litrosPorMes[mes] += parseFloat(a.qtdlitros || 0);
    });
    const litrosPorMesArr = Object.keys(litrosPorMes).sort().map(mes => ({ mes, litros: parseFloat(litrosPorMes[mes].toFixed(2)) }));
    window.totalLitrosChart = new Morris.Line({
        element: 'totalLitrosChart',
        data: litrosPorMesArr.length ? litrosPorMesArr : [{ mes: '', litros: 0 }],
        xkey: 'mes',
        ykeys: ['litros'],
        labels: ['Litros'],
        lineColors: ['#198754'],
        parseTime: false,
        hideHover: 'auto',
        resize: true
    });

    // 3. Usuário com mais abastecimentos (Pie/Donut Chart)
    const userCount = {};
    allData.abastecimentos.forEach(a => {
        if (!userCount[a.idusuario]) userCount[a.idusuario] = 0;
        userCount[a.idusuario]++;
    });
    const userDonutData = Object.keys(userCount).map(uid => {
        const user = allData.usuarios.find(u => u.id === uid);
        return {
            label: user ? user.nome : 'N/A',
            value: userCount[uid]
        };
    });
    window.topUsuarioChart = new Morris.Donut({
        element: 'topUsuarioChart',
        data: userDonutData.length ? userDonutData : [{ label: 'N/A', value: 0 }],
        colors: ['#fd7e14', '#0d6efd', '#198754', '#6f42c1', '#dc3545', '#ffc107'],
        formatter: function (val) { return val + 'x'; },
        resize: true
    });
}

const populateFilterSelects = () => {
    // Filter by user
    const filtroUsuario = document.getElementById('filtroUsuario');
    filtroUsuario.innerHTML = '<option value="">Todos os usuários</option>';
    allData.usuarios.forEach(usuario => {
        filtroUsuario.innerHTML += `<option value="${usuario.id}">${usuario.nome}</option>`;
    });
    
    // Filter by vehicle
    const filtroVeiculo = document.getElementById('filtroVeiculo');
    filtroVeiculo.innerHTML = '<option value="">Todos os veículos</option>';
    allData.veiculos.forEach(veiculo => {
        filtroVeiculo.innerHTML += `<option value="${veiculo.id}">${veiculo.placa}</option>`;
    });
    
    // Filter by gas station
    const filtroPosto = document.getElementById('filtroPosto');
    filtroPosto.innerHTML = '<option value="">Todos os postos</option>';
    allData.postos.forEach(posto => {
        filtroPosto.innerHTML += `<option value="${posto.id}">${posto.nome}</option>`;
    });
};

const loadReports = async () => {
    const tableBody = document.getElementById('relatorioTable');
    
    if (allData.abastecimentos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum abastecimento encontrado</td></tr>';
        return;
    }
    
    let html = '';
    allData.abastecimentos.forEach(abastecimento => {
        const usuario = allData.usuarios.find(u => u.id === abastecimento.idusuario);
        const veiculo = allData.veiculos.find(v => v.id === abastecimento.idveiculo);
        const posto = allData.postos.find(p => p.id === abastecimento.idposto);
        
        const combustivelClass = 
            abastecimento.combustivel === 'AL' ? 'fuel-al' :
            abastecimento.combustivel === 'GA' ? 'fuel-ga' : 'fuel-di';
        
        const combustivelText = 
            abastecimento.combustivel === 'AL' ? 'Álcool' :
            abastecimento.combustivel === 'GA' ? 'Gasolina' : 'Diesel';
        
        html += `
            <tr>
                <td>${formatDate(abastecimento.data)}</td>
                <td>${usuario ? usuario.nome : 'N/A'}</td>
                <td>${veiculo ? veiculo.placa : 'N/A'}</td> 
                <td>${posto ? posto.nome : 'N/A'}</td>
                <td><span class="${combustivelClass}">${combustivelText}</span></td>
                <td>${parseFloat(abastecimento.qtdlitros).toFixed(2)}L</td>
                <td>${parseInt(abastecimento.quilometragem).toLocaleString()}km</td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
};

const aplicarFiltros = async () => {
    const filtroUsuario = document.getElementById('filtroUsuario').value;
    const filtroVeiculo = document.getElementById('filtroVeiculo').value;
    const filtroPosto = document.getElementById('filtroPosto').value;

    // Reload all data
    allData.abastecimentos = await fetchData('abastecimentos');

    // Apply filters
    let filteredData = allData.abastecimentos;

    if (filtroUsuario) {
        filteredData = filteredData.filter(a => a.idusuario === filtroUsuario);
    }

    if (filtroVeiculo) {
        filteredData = filteredData.filter(a => a.idveiculo === filtroVeiculo);
    }

    if (filtroPosto) {
        filteredData = filteredData.filter(a => a.idposto === filtroPosto);
    }

    // Update table and dashboard with filtered data
    const originalData = allData.abastecimentos;
    allData.abastecimentos = filteredData;
    renderDashboardCards();
    await loadReports();
    allData.abastecimentos = originalData; // Restore original data
};

// Utility functions
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

// Form handling
const handleAbastecimentoSubmit = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    
    // Ensure the object properties match exactly with your Google Sheets column headers
    const abastecimento = {
        id: generateId('ab'),
        data: document.getElementById('data').value,
        qtdlitros: parseFloat(document.getElementById('qtdLitros').value),
        combustivel: document.getElementById('combustivel').value,
        quilometragem: parseInt(document.getElementById('quilometragem').value),
        idposto: document.getElementById('posto').value,
        idusuario: currentUser.id,
        idveiculo: document.getElementById('veiculo').value
    };
    
    console.log('Sending abastecimento data:', abastecimento);
    
    // Add submitting class for visual feedback
    form.classList.add('submitting');
    showLoading();
    
    try {
        // Try with the { data: [record] } format directly
        const wrappedData = { data: [abastecimento] };
        
        const response = await fetch(`${API_BASE_URL}?sheet=abastecimentos`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(wrappedData)
        });
        
        const responseText = await response.text();
        console.log('SheetDB direct response:', responseText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
        }
        
        showAlert('Abastecimento registrado com sucesso!', 'success');
        form.reset();
        
        // Reset date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('data').value = today;
        
    } catch (error) {
        console.error('Error details:', error);
        showAlert('Erro ao registrar abastecimento. Verifique os dados e tente novamente.', 'danger');
    } finally {
        form.classList.remove('submitting');
        hideLoading();
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        
        if (currentUser.tipo === 'M') {
            loadMotoristaScreen();
            showScreen('motoristaScreen');
        } else if (currentUser.tipo === 'A') {
            loadAdminScreen();
            showScreen('adminScreen');
        }
    }
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const pin = document.getElementById('pin').value;
        await login(username, pin);
    });
    
    // Abastecimento form
    document.getElementById('abastecimentoForm').addEventListener('submit', handleAbastecimentoSubmit);
    
    // Enter key support for PIN field
    document.getElementById('pin').addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const pin = document.getElementById('pin').value;
            if (username && pin) {
                await login(username, pin);
            }
        }
    });

    // Download CSV button (admin screen)
    const downloadBtn = document.getElementById('downloadCsvBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', exportRelatorioToCSV);
    }
});