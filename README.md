# Auditoria de Preços — Painel Corporativo

Painel web estático, navegável e totalmente local para reuniões, construído a partir da planilha **Controle de Auditoria de Preços**.

## Versão Enterprise Prime v1.3.2

A v1.3.2 corrige o pacote v1.3.1 e consolida a rodada visual/funcional solicitada para reunião.

### Principais melhorias

- **Botão Cenário corrigido de forma definitiva** em Lojas e Regionais, com acionamento delegado e modal independente do hotfix anterior.
- **Gráficos de Evolução confinados à área visual**, evitando linhas/eixos extrapolarem o container.
- **Modal Cenário com marcadores, grade e escala**, deixando a leitura das séries históricas mais clara.
- **Comparativos do modal**: selecionado x regional/rede x mesmo mês do ano anterior para etiquetas, quantidade de descontos e valor de descontos.
- **Logotipo Maravilhas do Lar** otimizado e aplicado no topo da navegação lateral.
- **Selo BPM / Escritório de Processos** aplicado de forma reduzida na barra lateral.
- **Fundo dark enterprise reforçado**, com superfícies mais discretas e cor concentrada em gráficos, estados e sinais.
- **Tooltips explicativos** em semáforos e setas, informando período, referência e motivo do status.
- **Evolução Mensal** mantém gráfico de linha e gráficos complementares de colunas e variação mês a mês.
- **Semáforo da Base de Dados**:
  - **Crítico:** abaixo da meta de 6.000 etiquetas **ou** quantidade/valor de descontos acima da média da rede na competência selecionada.
  - **Atenção:** meta atingida, porém quantidade ou valor de descontos entre 80% e 100% da média da rede.
  - **Saudável:** meta atingida e descontos abaixo da faixa de atenção.
- **Relatório PDF em todas as abas**, respeitando competência, escopo e filtros da tela, preparado para A4 horizontal.

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
- Quantidade de descontos: **2.923**
- Valor de descontos: **R$ 31.752,38**
- Lojas com pelo menos 6.000 etiquetas: **42 de 60**

## Estrutura ativa

```text
/
├── index.html
├── assets/
│   ├── app-v13-core.js
│   ├── app-v13-main.js
│   ├── app-v13-analytics.js
│   ├── app-v13-init.js
│   ├── app-v132-fix.js
│   ├── enterprise-v13.css
│   ├── enterprise-v132.css
│   ├── logo-mdl.svg
│   ├── selo-processos.svg
│   └── ...
└── data/
    └── base histórica embarcada
```

Não é necessário backend, Node, banco de dados ou conexão com a internet para o uso normal da versão local.