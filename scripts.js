let tableCount = 0;
let combinedBarChart = null;
let pieChart = null;

// Adicionando evento para adicionar novas tabelas
document.getElementById('add-table').addEventListener('click', function() {
    tableCount++;
    const tableContainer = document.createElement('div');
    tableContainer.classList.add('table');
    tableContainer.dataset.tableName = `Tabela ${tableCount}`;

    tableContainer.innerHTML = `
        <input type="date" placeholder="Data" required>
        <input type="color" value="#${Math.floor(Math.random() * 16777215).toString(16)}" required>
        <button class="delete-table">Apagar Tabela</button>
        <div class="rows-container">
            <div>
                <input type="text" placeholder="Nome" required>
                <input type="number" placeholder="Número de vezes" required>
                <button class="delete-row">X</button>
            </div>
        </div>
        <button class="add-row">Adicionar Linha</button>
    `;

    document.getElementById('tables-container').appendChild(tableContainer);

    const dateInput = tableContainer.querySelector('input[type="date"]');
    dateInput.addEventListener('change', function() {
        tableContainer.dataset.tableName = dateInput.value;
        updateCharts();
    });

    tableContainer.querySelector('.add-row').addEventListener('click', function() {
        const rowContainer = document.createElement('div');
        rowContainer.innerHTML = `
            <input type="text" placeholder="Nome" required>
            <input type="number" placeholder="Número de vezes" required>
            <button class="delete-row">X</button>
        `;
        tableContainer.querySelector('.rows-container').appendChild(rowContainer);

        rowContainer.querySelector('.delete-row').addEventListener('click', function() {
            rowContainer.remove();
            updateCharts();
        });

        updateCharts();
    });

    tableContainer.querySelector('.delete-table').addEventListener('click', function() {
        tableContainer.remove();
        updateCharts();
    });

    updateCharts();
});

// Adicionando evento para atualizar os gráficos
document.getElementById('update-charts').addEventListener('click', function() {
    updateCharts();
});

// Adicionando evento para salvar o gráfico
document.getElementById('save-chart').addEventListener('click', function() {
    const canvas = document.getElementById('combinedBarChart');
    canvas.toBlob(function(blob) {
        saveAs(blob, 'grafico.png');
    });
});

// Função para atualizar os gráficos
function updateCharts() {
    let combinedLabels = new Set();
    let combinedBarData = {};
    let pieData = {};
    let pieColors = [];

    const tableContainers = document.querySelectorAll('.table');
    tableCount = tableContainers.length;

    let tableNames = [];

    // Coletar dados das tabelas e linhas
    tableContainers.forEach((tableContainer, i) => {
        const rows = tableContainer.querySelectorAll('.rows-container div');
        const dateInput = tableContainer.querySelector('input[type="date"]').value;
        const color = tableContainer.querySelector('input[type="color"]').value;

        const tableName = tableContainer.dataset.tableName || `Tabela ${i + 1}`;
        tableNames.push(tableName);

        rows.forEach(row => {
            const name = row.querySelector('input[type="text"]').value;
            const value = parseFloat(row.querySelector('input[type="number"]').value);
            if (name && !isNaN(value)) {
                combinedLabels.add(name);

                if (!combinedBarData[name]) {
                    combinedBarData[name] = [];
                }

                combinedBarData[name].push({
                    date: dateInput,
                    value: value,
                    color: color,
                    index: i + 1
                });

                if (!pieData[name]) {
                    pieData[name] = 0;
                }
                pieData[name] += value;
            }
        });
    });

    combinedLabels = Array.from(combinedLabels);

    let barDatasets = [];
    let pieLabels = [];
    let pieValues = [];

    // Coletar cores para o gráfico de pizza
    combinedLabels.forEach(label => {
        const colorInput = document.querySelector(`#pie-color-${label.replace(/\s+/g, '-')}`);
        const color = colorInput ? colorInput.value : `#${Math.floor(Math.random() * 16777215).toString(16)}`;

        combinedBarData[label].forEach((dataPoint, j) => {
            if (!barDatasets[j]) {
                barDatasets[j] = {
                    label: tableNames[j],
                    data: [],
                    backgroundColor: []
                };
            }
            barDatasets[j].data.push(dataPoint.value);
            barDatasets[j].backgroundColor.push(dataPoint.color);
        });

        pieLabels.push(label);
        pieValues.push(pieData[label]);
        pieColors.push(color);
    });

    // Atualizar ou criar o gráfico de barras
    if (!combinedBarChart) {
        combinedBarChart = new Chart(document.getElementById('combinedBarChart'), {
            type: 'bar',
            data: {
                labels: combinedLabels,
                datasets: barDatasets
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: false,
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(2) + '%';
                                return `${label}: ${percentage}`;
                            }
                        }
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'start',
                        color: '#000',
                        font: {
                            weight: 'bold',
                            size: 12
                        },
                        formatter: function(value) {
                            return value; // Exibe o valor dentro da barra
                        }
                    }
                }
            }
        });
    } else {
        combinedBarChart.data.labels = combinedLabels;
        combinedBarChart.data.datasets = barDatasets;
        combinedBarChart.update();
    }

    // Atualizar ou criar o gráfico de pizza
    if (!pieChart) {
        pieChart = new Chart(document.getElementById('pieChart'), {
            type: 'pie',
            data: {
                labels: pieLabels,
                datasets: [{
                    data: pieValues,
                    backgroundColor: pieColors
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(2) + '%';
                                return `${label}: ${percentage}`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        pieChart.data.labels = pieLabels;
        pieChart.data.datasets[0].data = pieValues;
        pieChart.data.datasets[0].backgroundColor = pieColors;
        pieChart.update();
    }
}

// Adicionando evento para adicionar cores personalizadas para o gráfico de pizza
document.getElementById('add-pie-color').addEventListener('click', function() {
    const pieColorsContainer = document.getElementById('pie-colors-container');
    const newColorInput = document.createElement('div');
    
    newColorInput.innerHTML = `
        <input type="text" placeholder="Nome da Fatia" required>
        <input type="color" required>
        <button class="delete-color">Remover Cor</button>
    `;
    
    pieColorsContainer.appendChild(newColorInput);

    newColorInput.querySelector('.delete-color').addEventListener('click', function() {
        newColorInput.remove();
        updateCharts();
    });
    
    updateCharts();
});
