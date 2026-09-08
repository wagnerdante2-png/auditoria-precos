# Auditoria de Preços — Painel Corporativo

Painel web estático, navegável e totalmente local para reuniões, construído a partir da planilha **Controle de Auditoria de Preços**.

## Versão Enterprise Prime v1.3

A v1.3 aprofunda a leitura executiva e corrige a semântica dos indicadores visuais.

### Principais melhorias

- **Tooltips explicativos** em semáforos e setas. Ao passar o mouse, o painel informa o período, a referência, o valor anterior/atual e o motivo do status.
- **Evolução Mensal refinada** com gráfico de linha mais nítido e dois gráficos complementares: colunas dos últimos 12 meses e variação percentual mês a mês.
- **Semáforo da Base de Dados corrigido**:
  - **Crítico:** loja abaixo da meta de 6.000 etiquetas **ou** quantidade/valor de descontos acima da média da rede na competência selecionada.
  - **Atenção:** meta atingida, porém quantidade ou valor de descontos entre 80% e 100% da média da rede.
  - **Saudável:** meta atingida e descontos abaixo da faixa de atenção.
- **Base de Dados** passa a exibir também quantidade e valor de descontos do mesmo mês do ano anterior.
- **Relatório PDF em todas as abas**, respeitando competência, escopo e filtros da tela. A impressão foi preparada para **A4 horizontal**.
- **Modal Cenário** nas abas Lojas e Regionais com comparativos de etiquetas, descontos, média da rede, regional e ano anterior, além de séries históricas.
- **Design minimalista enterprise**, com fundo totalmente dark, superfícies planas, bordas discretas e cores concentradas em gráficos, sinais e estados.

## Regras de tendência

As setas representam a variação matemática em relação à competência imediatamente anterior:

- **▲** valor subiu;
- **▼** valor caiu;
- **verde** = movimento favorável para o indicador;
- **vermelho** = movimento desfavorável.

Para etiquetas/atingimento, aumento é favorável. Para divergências, produtos sem preço e descontos, redução é considerada favorável na leitura operacional.

## Dados incorporados

- 60 lojas;
- 6 regionais vigentes;
- descontos desde 08/2023;
- etiquetas, divergências e produtos sem preço desde 11/2024;
- última competência da planilha: 08/2026;
- meta operacional: 6.000 etiquetas por loja/mês.

## Integridade de 08/2026

- Etiquetas auditadas: **424.421**
- Divergências: **2.820**
- Produtos sem preço: **21.184**
- Quantidade de descontos: **3.028**
- Valor de descontos: **R$ 33.419,38**
- Lojas com pelo menos 6.000 etiquetas: **42 de 60**

## Estrutura ativa v1.3

```text
/
├── index.html
├── assets/
│   ├── app-v13-core.js
│   ├── app-v13-main.js
│   ├── app-v13-analytics.js
│   ├── app-v13-init.js
│   ├── enterprise-v13.css
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

Não é necessário backend, Node, banco de dados ou conexão com a internet para o uso normal da versão local.