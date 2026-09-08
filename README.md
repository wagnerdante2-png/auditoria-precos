# Auditoria de Preços — Painel Corporativo

Painel web estático e navegável para reuniões, construído a partir da planilha **Controle de Auditoria de Preços**.

## Versão premium v1.1

A versão atual foi refinada para uso executivo em reunião, com layout mais compacto e corporativo, navegação global por competência/escopo e novas leituras gerenciais.

### O que está disponível

- **Visão Executiva** com KPIs de etiquetas auditadas, atingimento, divergências por mil, produtos sem preço por mil, descontos e lojas na meta.
- **Análise Comparativa** com comparação contra mês anterior e ano anterior, benchmark por regional/loja e maiores evoluções/retrações do período.
- **Navegação global por competência**, de **2023-08** a **2026-08** conforme disponibilidade da base.
- **Escopo Total Rede, Regional ou Loja**, aplicado às visões analíticas.
- **Visão por Lojas** com busca em tempo real, filtro por regional, semáforo de situação e acesso direto à visão/recomendações da loja.
- **Visão por Regionais** com consolidação, tendência e acesso direto à visão/recomendações da regional.
- **Evolução Mensal** em gráfico de linhas para as cinco métricas principais.
- **Recomendações** geradas por regras determinísticas e explicáveis, considerando meta, tendência e benchmark da própria base.
- **Base de Dados** com semáforos, setas de tendência versus mês anterior e exportação para CSV.
- **Sem backend complexo e sem build**: a aplicação é totalmente estática e a base está embarcada.

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
│   ├── app-v11.js
│   ├── premium.css
│   ├── app.js
│   └── styles.css
└── data/
    ├── core.js
    ├── labels.js
    ├── divergences.js
    ├── noPrice.js
    ├── discountCount.js
    ├── discountValue.js
    └── finalize.js
```

Os dados foram fracionados em módulos estáticos apenas para manter o repositório leve e fácil de manter; para o usuário final, a navegação funciona como uma base única.

## Execução

Abra `index.html` no Chrome, Edge ou outro navegador moderno. Não é necessário instalar Node, banco de dados ou dependências. A versão portátil para Windows pode encapsular esses mesmos arquivos e abrir o painel automaticamente no navegador.

## Integridade

A competência 08/2026 permanece validada contra os totalizadores da planilha:

- Etiquetas auditadas: **424.421**
- Divergências: **2.820**
- Produtos sem preço: **21.184**
- Quantidade de descontos: **3.028**
- Valor de descontos: **R$ 33.419,38**
- Lojas com pelo menos 6.000 etiquetas: **42 de 60**

## Validações v1.1

- `app-v11.js` validado sintaticamente com Node.
- Todas as sete visões foram instanciadas em teste automatizado de runtime: Visão Executiva, Análise Comparativa, Lojas, Regionais, Evolução Mensal, Recomendações e Base de Dados.
- Filtros globais de competência, Regional e Loja foram exercitados em teste automatizado.
- A asserção interna da competência 08/2026 continua ativa no carregamento da aplicação.
