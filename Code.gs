/**
 * PADEL ENTRE AMIGOS · Configuração automática do Google Form + Google Sheet
 *
 * Como usar:
 *  1. Abre https://script.google.com e cria um "Novo projeto".
 *  2. Apaga o código que lá estiver, cola este ficheiro inteiro e guarda.
 *  3. Escolhe a função "configurar" no topo e carrega em "Executar".
 *     (Na primeira vez a Google pede autorização: aceita com a tua conta.)
 *  4. Abre "Registo de execução": aparecem o link do formulário e o link de dados.
 *
 * Para acrescentar um jogador mais tarde: muda o nome em NOVO_JOGADOR
 * (lá em baixo) e executa a função "adicionarJogador".
 *
 * Para mudar o nome de um jogador: preenche NOME_ANTIGO e NOME_NOVO
 * e executa a função "renomearJogador" (muda no formulário e nos jogos já registados).
 */

var JOGADORES = [
  'Mikezitos', 'Ramalho', 'Pita', 'Chico', 'Fonseca', 'Brito',
  'Sardo', 'Sabino', 'Bernardo Troia', 'Guilherme Silva', 'Marcelo Ramos'
];

var NOVO_JOGADOR = 'Nome do novo jogador';

// Para mudar o nome de um jogador: escreve aqui o nome antigo e o novo
// e executa a função "renomearJogador".
var NOME_ANTIGO = 'Maiquezitos';
var NOME_NOVO = 'Mikezitos';

function configurar() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('FORM_ID')) {
    Logger.log('Já estava configurado. Para refazer do zero, apaga as propriedades do script.');
    mostrarLinks();
    return;
  }

  // 1. Formulário
  var form = FormApp.create('Padel · Registar jogo');
  form.setDescription('Regista aqui cada jogo (duplas ou cruzadinho). Os resultados aparecem na dashboard.');
  form.setProgressBar(false);
  form.setConfirmationMessage('Jogo registado! Obrigado.');

  form.addDateItem().setTitle('Data do jogo').setRequired(true);
  var tipo = form.addMultipleChoiceItem().setTitle('Tipo de jogo').setRequired(true);

  var pDupla = form.addPageBreakItem().setTitle('Duplas')
    .setHelpText('Escolhe os quatro jogadores. A Equipa A é a que aparece primeiro no resultado.');
  lista(form, 'Equipa A · Jogador 1');
  lista(form, 'Equipa A · Jogador 2');
  lista(form, 'Equipa B · Jogador 1');
  lista(form, 'Equipa B · Jogador 2');

  var pCruz = form.addPageBreakItem().setTitle('Cruzadinho')
    .setHelpText('Um contra um. O Jogador A é o que aparece primeiro no resultado.');
  lista(form, 'Cruzadinho · Jogador A');
  lista(form, 'Cruzadinho · Jogador B');

  var pFim = form.addPageBreakItem().setTitle('Resultado');
  // Quem acaba a secção Duplas salta a secção Cruzadinho
  pCruz.setGoToPage(pFim);

  form.addTextItem().setTitle('Resultado (sets)')
    .setHelpText('Do ponto de vista da Equipa A (ou do Jogador A), sets separados por espaço. Exemplo: 6/4 3/6 6/2')
    .setRequired(true);
  form.addMultipleChoiceItem().setTitle('Estado do jogo')
    .setChoiceValues(['Terminado', 'Não terminado (conta como empate)'])
    .setRequired(true);
  lista(form, 'Registado por');

  tipo.setChoices([
    tipo.createChoice('Dupla', pDupla),
    tipo.createChoice('Cruzadinho', pCruz)
  ]);

  // 2. Folha de cálculo ligada
  var ss = SpreadsheetApp.create('Padel · Jogos');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  Utilities.sleep(2000);

  var folha = folhaDoFormulario(ss);
  if (folha) folha.setName('Jogos');
  var vazia = ss.getSheetByName('Sheet1') || ss.getSheetByName('Folha1') || ss.getSheetByName('Página1');
  if (vazia && ss.getSheets().length > 1) ss.deleteSheet(vazia);

  // 3. Leitura pública (só ver) para a dashboard conseguir ler os dados
  try {
    DriveApp.getFileById(ss.getId())
      .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    Logger.log('Não consegui abrir a folha a quem tem o link. Faz à mão: Partilhar > Qualquer pessoa com o link > Visualizador.');
  }

  props.setProperty('FORM_ID', form.getId());
  props.setProperty('SHEET_ID', ss.getId());
  mostrarLinks();
}

function mostrarLinks() {
  var props = PropertiesService.getScriptProperties();
  var form = FormApp.openById(props.getProperty('FORM_ID'));
  var ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  var folha = folhaDoFormulario(ss) || ss.getSheets()[0];
  var csv = 'https://docs.google.com/spreadsheets/d/' + ss.getId() +
            '/gviz/tq?tqx=out:csv&gid=' + folha.getSheetId();

  Logger.log('LINK DO FORMULÁRIO (partilha no grupo): ' + form.getPublishedUrl());
  Logger.log('LINK DA FOLHA (para corrigir erros): ' + ss.getUrl());
  Logger.log('LINK DE DADOS (cola na dashboard, em DADOS_URL): ' + csv);
}

function adicionarJogador() {
  var nome = String(NOVO_JOGADOR).trim();
  if (!nome || nome === 'Nome do novo jogador') {
    Logger.log('Escreve primeiro o nome em NOVO_JOGADOR.');
    return;
  }
  var form = FormApp.openById(PropertiesService.getScriptProperties().getProperty('FORM_ID'));
  form.getItems(FormApp.ItemType.LIST).forEach(function (item) {
    var l = item.asListItem();
    var nomes = l.getChoices().map(function (c) { return c.getValue(); });
    if (nomes.indexOf(nome) === -1) {
      nomes.push(nome);
      nomes.sort(function (a, b) { return a.localeCompare(b, 'pt'); });
      l.setChoiceValues(nomes);
    }
  });
  Logger.log(nome + ' adicionado ao formulário. Acrescenta-o também à lista JOGADORES da dashboard.');
}

function renomearJogador() {
  var antigo = String(NOME_ANTIGO).trim(), novo = String(NOME_NOVO).trim();
  if (!antigo || !novo || antigo === novo) {
    Logger.log('Preenche NOME_ANTIGO e NOME_NOVO com nomes diferentes.');
    return;
  }
  var props = PropertiesService.getScriptProperties();

  // 1. Listas do formulário
  var form = FormApp.openById(props.getProperty('FORM_ID'));
  var listas = 0;
  form.getItems(FormApp.ItemType.LIST).forEach(function (item) {
    var l = item.asListItem();
    var nomes = l.getChoices().map(function (c) { return c.getValue(); });
    var i = nomes.indexOf(antigo);
    if (i === -1) return;
    if (nomes.indexOf(novo) === -1) nomes[i] = novo; else nomes.splice(i, 1);
    nomes.sort(function (a, b) { return a.localeCompare(b, 'pt'); });
    l.setChoiceValues(nomes);
    listas++;
  });

  // 2. Jogos já registados na folha
  var ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  var folha = folhaDoFormulario(ss) || ss.getSheets()[0];
  var trocas = folha.createTextFinder(antigo).matchCase(true).matchEntireCell(true).replaceAllWith(novo);

  Logger.log(antigo + ' passou a ' + novo + ': ' + listas + ' listas do formulário e ' + trocas + ' células na folha.');
  Logger.log('Confirma que o nome novo também está na lista JOGADORES da dashboard.');
}

// Auxiliares
function lista(form, titulo) {
  var nomes = JOGADORES.slice().sort(function (a, b) { return a.localeCompare(b, 'pt'); });
  return form.addListItem().setTitle(titulo).setChoiceValues(nomes)
    .setRequired(titulo.indexOf('Registado') === -1);
}

function folhaDoFormulario(ss) {
  var folhas = ss.getSheets();
  for (var i = 0; i < folhas.length; i++) {
    if (folhas[i].getFormUrl()) return folhas[i];
  }
  return null;
}
