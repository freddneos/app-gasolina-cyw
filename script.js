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
        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar dados de ${endpoint}:`, error);
        showAlert(`Erro ao carregar dados de ${endpoint}`, 'danger');
        return [];
    }
};

const postData = async (endpoint, data) => {
    try {
        const response = await fetch(`${API_BASE_URL}?sheet=${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
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
        
        // Load reports
        await loadReports();
        
        // Update header
        document.getElementById('adminNameHeader').textContent = currentUser.nome;
        
    } catch (error) {
        showAlert('Erro ao carregar dados da tela de administração', 'danger');
    } finally {
        hideLoading();
    }
};

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
        const usuario = allData.usuarios.find(u => u.id === abastecimento.id_usuario);
        const veiculo = allData.veiculos.find(v => v.id === abastecimento.id_veiculo);
        const posto = allData.postos.find(p => p.id === abastecimento.id_posto);
        
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
                <td>${parseFloat(abastecimento.qtd_litros).toFixed(2)}L</td>
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
        filteredData = filteredData.filter(a => a.id_usuario === filtroUsuario);
    }
    
    if (filtroVeiculo) {
        filteredData = filteredData.filter(a => a.id_veiculo === filtroVeiculo);
    }
    
    if (filtroPosto) {
        filteredData = filteredData.filter(a => a.id_posto === filtroPosto);
    }
    
    // Update table with filtered data
    const originalData = allData.abastecimentos;
    allData.abastecimentos = filteredData;
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
    const formData = new FormData(form);
    
    const abastecimento = {
        id: generateId('ab'),
        data: document.getElementById('data').value,
        qtd_litros: parseFloat(document.getElementById('qtdLitros').value),
        combustivel: document.getElementById('combustivel').value,
        quilometragem: parseInt(document.getElementById('quilometragem').value),
        id_posto: document.getElementById('posto').value,
        id_usuario: currentUser.id,
        id_veiculo: document.getElementById('veiculo').value
    };
    
    // Add submitting class for visual feedback
    form.classList.add('submitting');
    showLoading();
    
    try {
        await postData('abastecimentos', abastecimento);
        showAlert('Abastecimento registrado com sucesso!', 'success');
        form.reset();
        
        // Reset date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('data').value = today;
        
    } catch (error) {
        showAlert('Erro ao registrar abastecimento. Tente novamente.', 'danger');
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
});