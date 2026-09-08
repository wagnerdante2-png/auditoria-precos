# Auditoria de Preços — Painel Corporativo

Painel web estático e navegável para reuniões, construído a partir da planilha **Controle de Auditoria de Preços**.

## O que está disponível

- **Visão Executiva** com KPIs de etiquetas auditadas, meta, atingimento, divergências, produtos sem preço e descontos.
- **Navegação por competência**, de **2023-08** a **2026-08** conforme disponibilidade da base.
- **Escopo Total Rede, Regional ou Loja**.
- **Visão por Lojas** com busca, filtro por regional e status de meta.
- **Visão por Regionais** com consolidação dos indicadores.
- **Evolução Mensal** em gráfico de linhas para as cinco métricas principais.
- **Base de Dados** navegável e exportação da competência para CSV.
- **Sem backend e sem build**: basta abrir `index.html` no navegador.
- A base foi **embarcada no próprio projeto**, portanto funciona também sem conexão com internet.

## Dados incorporados

- **60 lojas**.
- **6 regionais vigentes**.
- Histórico de **descontos desde 08/2023**.
- Histórico de **etiquetas, divergências e produtos sem preço desde 11/2024**.
- Última competência com dados na planilha analisada: **08/2026**.
- Meta operacional considerada: **6.000 etiquetas por loja com registro no mês**.

A aplicação utiliza diretamente as abas históricas de **ETIQUETAS**, **DIVERGÊNCIAS**, **SEM PREÇO** e os dois blocos de **DESCONTOS** (valor e quantidade), sem depender das fórmulas da aba de resumo.

## Estrutura

```text
/
├── index.html
├── assets/
│   ├── app.js
│   └── styles.css
└── data/
    └── auditoria-data.js
```

## Execução

Abra `index.html` no Chrome, Edge ou outro navegador moderno. Não é necessário instalar Node, servidor local, banco de dados ou dependências.

## Integridade

A competência 08/2026 foi validada contra os totalizadores da planilha:

- Etiquetas auditadas: **424.421**
- Divergências: **2.820**
- Produtos sem preço: **21.184**
- Quantidade de descontos: **3.028**
- Valor de descontos: **R$ 33.419,38**
