# Projeto: Remake de aplicação web simples

<img width="1404" height="972" alt="piupiu gif" src="https://github.com/user-attachments/assets/e0a6d5b1-5ef3-4b3e-b44a-d8fbee7d1418" />



## Acesso
https://elc1090.github.io/project1-2026b-oropoc/


## Desenvolvedor
Joao Daniel Wurdig Lucas, Sistemas de Informacao UFSM

## App original

### Links

- Acesso: elc1090.github.io/demo-attendance-indexeddb/
- Repositório: https://github.com/elc1090/demo-attendance-indexeddb

### Descrição


Notei que o programa funciona com uma lista de estudantes e uma lista de ausência, o que ele faz é, quando o aluno está na lista de ausência ele é marcado como ausente, se não, é presente, ou seja, a função que marca a presença na verdade está tirando o aluno da lista de ausência, tendo uma parte escalonada pela função "markAllPresent".

O app armazena múltiplas chamadas com os mesmos alunos usando o arquivo CSV para ter o nome dos alunos e o ID, que, conforme o usuário coloca datas para compor sua chamada, suas presenças são armazenadas independente uma das outras e suas classes são feitas conforme o usuário abre chamada na data selecionada.

## Demanda do(a) cliente

### Cliente
Miguel Brondani

### Demanda
- adição botão "desmarcar todos"
- visualizar porcentagem de faltas/presença de cada aluno

## Desenvolvimento

### Processo

Primeira coisa que eu fiz foi tentar abrir ele pelo localhost usando o python, vendo que tinha dado tudo certo fui direto no app.js sabendo que lá teria as funções que estão por trás dos botões, comandos e layouts que aparecem no app.

Pensando na primeira demanda de ter um botão de desmarcar todos eu procurei a função que marcava todos e fui entender como ela funcionava relacionada com eventos de botão, css e o index.html. Além disso procurei entender como que ele setava as ausências e as presenças no app, foi aí que, olhando pelas ferramentas de desenvolvedor, percebi que a table attendance mostra o nome do aluno, seu ID, seu status de falta e a classe e a data que teve a falta, pensando nisso, vi que a única coisa que precisava fazer era percorrer esse "attendance" e pelas classes e, pelo id, pegar quantas vezes o aluno apareceu faltando e depois pegar quantas "session" tem para aplicar a razão para ter essa porcentagem.

Minhas demandas eram basicamente mexer nas relações entre as funções de marcar presença e o banco de dados do app, por isso que quando eu vi pelas ferramentas de desenvolvedor no site eu tive dois insites ao mesmo tempo, escalonar a função de marcar falta do aluno (que é colocar o estudante dentro do objeto attendance) e também a ideia e passar um "for" pelo attendance porque lá tinha tudo que eu precisava.

Depois de fazer as funções com a ajuda da IA, além de usar ela para conseguir entender a base do código utilizei a IA para fazer um modal quando eu passasse o mouse no nome dos estudantes para aparecer sua frequência de faltas e só copiei e colei o formato do botão de marcar todos pois pelo jeito que foi feito, se colocasse outro elemento ele iria ser automaticamente ajustado (pelo que eu entendi e me lembro).


### Trechos de código

## Primeiro trecho

<img width="702" height="187" alt="image" src="https://github.com/user-attachments/assets/7f8772d0-08da-4811-b201-8ea1c57484c0" />

- Esse trecho possui o Promise, que eh um jeito do JS para representar uma resposta que ainda vai chegar soh que demora um pouco a mais do que o navegador esperaria, como se fosse uma resposta vazia que depois eh preenchida com o acerto ou erro, isso permite que o codigo continue rodando enquanto isso

## Segundo trecho

<img width="1352" height="452" alt="image" src="https://github.com/user-attachments/assets/0b788d11-ac52-45e9-bd57-78b045e91167" />

- Esse trecho mostra como o app exporta um arquivo JSON, pegando os dados da turma, data da sessao e a lista de presenca e coloca num texto no formatado como JSON, quem cria o arquivo e dispara para download eh a funcao downloadBlob

<img width="602" height="291" alt="image" src="https://github.com/user-attachments/assets/1f0ac405-6226-4f66-ad8b-ed58a6e67ffe" />

- Ela recebe três parâmetros: o conteúdo do arquivo (content, texto do CSV ou JSON), o nome do arquivo (fileName) e o tipo MIME (type, tipo "application/json" ou "text/csv;charset=utf-8").

O que ela faz, passo a passo:

- new Blob([content], { type }) empacota o texto num objeto Blob, que é basicamente "um arquivo em memória" — os dados brutos mais a informação de que tipo de arquivo é.

- URL.createObjectURL(blob) gera uma URL temporária (algo tipo blob:https://seusite.com/xxxx-xxxx) que aponta pra esse Blob na memória do navegador.

- Depois ela cria um link <a> invisível (document.createElement("a")), aponta o href pra essa URL e define download = fileName — é esse atributo download que faz o navegador salvar o arquivo em vez de tentar abrir/navegar pra ele.

- Adiciona o link no body, dispara um clique nele via código (a.click()) — simulando o usuário clicando num link de download — e remove o link em seguida, já que ele só serviu pra disparar o download.

- URL.revokeObjectURL(url) libera a memória usada pelo Blob, já que ele não é mais necessário depois do download disparado.

## Terceiro trecho

<img width="513" height="311" alt="image" src="https://github.com/user-attachments/assets/e63fee09-068c-485a-86c9-732f29f23ade" />

- Quando eu falei que soh precisei copiar e colar um novo botao que ele se alinhou sozinho esse style foi o resposavel por isso, os botoes de marcar e desmarcar estam dentro desse container que usa "flex" para se alinharam automaticamente com um gap (distancia) padrao.


## Tecnologias

### Linguagens e afins

- HTML
- CSS
- JavaScript

### Ambiente de desenvolvimento

- VS Code

## Referências e créditos

- video: Seu primeiro código HTML - @Curso em Vídeo HTML5 e CSS3 (https://youtu.be/E6CdIawPTh0?si=yRCqDDAoEUyCR2xB)
- Claude AI
- Auxilio da professora Andrea Schwertner Charão
- Dev Tools

---
Projeto entregue para a disciplina de [Desenvolvimento de Software para a Web](http://github.com/andreainfufsm/elc1090-2026b) em 2026b
