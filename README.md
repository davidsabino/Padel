# Padel

Resultados de Padel: ranking Elo dos nossos jogos de duplas e cruzadinhos.

**Dashboard:** https://davidsabino.github.io/padel/

## Como funciona

1. Cada jogo é registado num Google Form (botão "+ Registar jogo" na dashboard).
2. As respostas caem num Google Sheet.
3. A dashboard (`index.html`) lê o Sheet e calcula tudo: ranking individual, duplas, cruzadinhos, confrontos diretos e histórico.

## Regras do ranking

1. Todos começam com 1000 pontos Elo.
2. Nas duplas, o rating da dupla é a média dos dois jogadores, e ambos ganham ou perdem os mesmos pontos.
3. Ganhar a quem é mais forte dá mais pontos; ganhar a quem é mais fraco dá menos.
4. Jogo não terminado conta como empate (meio ponto para cada lado).
5. Os cruzadinhos têm um Elo próprio, separado das duplas.
6. Uma dupla só entra no ranking de duplas a partir de 3 jogos.

## Configuração

1. `Code.gs` é o Google Apps Script que cria o formulário e a folha de cálculo (executar a função `configurar` em script.google.com).
2. No início do código de `index.html`, preencher `DADOS_URL` e `FORM_URL` com os links que o script mostra.
