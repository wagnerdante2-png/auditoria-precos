# Auditoria de Preços — Painel Corporativo

Painel web estático e navegável para reuniões, construído a partir da planilha **Controle de Auditoria de Preços**.

## Versão Enterprise v1.2

A v1.2 foi refinada especificamente para leitura executiva rápida em reunião. O visual dark permanece, porém com linguagem **enterprise/corporativa**, menor uso de efeitos luminosos e aplicação de cor concentrada em status, tendências, alertas e gráficos.

### Melhorias v1.2

- **Scroll restaurado em todas as abas**, mantendo apenas a barra lateral e o cabeçalho como elementos fixos/sticky quando aplicável.
- **Cards de Lojas e Regionais compactados**, com maior densidade de informação e mais unidades visíveis simultaneamente.
- **Visão Executiva em “10 segundos”**, com gauge de atingimento, snapshot de divergências/sem preço/cobertura/descontos, prioridades e benchmark regional.
- **Análise Comparativa redesenhada**, deixando explícitos os três períodos: competência atual, mês anterior e mesmo mês do ano anterior. Os comparativos utilizam barras vetoriais, deltas e benchmark visual.
- **Recomendações mais diretas**, estruturadas em problema identificado → evidência → recomendação → responsável sugerido. A competência selecionada é a referência principal; histórico só é destacado quando há tendência persistente.
- **Base de Dados com legenda operacional** para semáforos e setas, filtros por regional/status, busca por loja e indicação explícita de que as setas representam a variação contra o mês anterior.
- **Filtros globais de competência, Total Rede, Regional e Loja** preservados e aplicados às visões analíticas.
- **Sem backend complexo e sem build**: toda a base permanece embarcada e funciona localmente.

## Regras visuais da Base de Dados

### Semáforo — situação da competência selecionada

Para cada loja, o semáforo considera **atingimento da meta** e a qualidade relativa à **média da rede na mesma competência**:

- **Saudável (verde):** atingimento ≥ 100% e taxas de divergências/sem preço até 115% da média da rede.
- **Atenção (âmbar):** atingimento entre 85% e 99,9% ou indicador de qualidade entre 115% e 150% da média da rede.
- **Crítico (vermelho):** atingimento < 85% ou indicador de qualidade acima de 150% da média da rede.

### Setas — tendência versus mês anterior

- A direção **▲ / ▼** mostra a variação matemática entre a competência selecionada e a competência imediatamente anterior.
- A cor representa o efeito gerencial do movimento: **verde = favorável**, **vermelho = desfavorável**.
- Em **etiquetas/atingimento**, subir é favorável.
- Em **divergências, produtos sem preço e descontos**, reduzir é tratado como favorável para a leitura operacional.

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
│   ├── app-v12-core.js
│   ├── app-v12-main.js
│   ├── app-v12-analytics.js
│   ├── app-v12-init.js
│   ├── enterprise-v12.css
│   ├── premium.css
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

Os dados foram fracionados em módulos estáticos apenas para manter o projeto organizado; para o usuário final, a navegação funciona como uma base única.

## Execução

Abra `index.html` no Chrome, Edge ou outro navegador moderno. Não é necessário instalar Node, banco de dados ou dependências. A versão portátil para Windows encapsula os mesmos arquivos e abre o painel automaticamente no navegador.

## Integridade

A competência 08/2026 permanece validada contra os totalizadores da planilha:

- Etiquetas auditadas: **424.421**
- Divergências: **2.820**
- Produtos sem preço: **21.184**
- Quantidade de descontos: **3.028**
- Valor de descontos: **R$ 33.419,38**
- Lojas com pelo menos 6.000 etiquetas: **42 de 60**

## Validações v1.2

- Os quatro módulos JavaScript da v1.2 foram validados sintaticamente com Node.
- As sete visões foram instanciadas em teste automatizado de runtime: **Visão Executiva, Análise Comparativa, Lojas, Regionais, Evolução Mensal, Recomendações e Base de Dados**.
- Filtros globais de competência/escopo e filtros de base foram exercitados no runtime de teste.
- A asserção interna da competência 08/2026 continua ativa no carregamento da aplicação.
