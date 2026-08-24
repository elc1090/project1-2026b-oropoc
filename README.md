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

[Substitua este texto por uma descrição do app original. Inclua observações sobre sua autoria, conteúdo, aparência e código.]

Notei que o programa funciona com uma lista de studantes e uma lista de ausencia, o que ele faz eh, quando o aluno estah na lista de ausencia ele eh marcado como ausente, se nao, eh presente, ou seja, a funcao que marca a presenca na verdade estah tirando o aluno da lista de ausencia, tendo uma parte escalonada pela funncao "markAllPresent"

O app armazena multiplas chamadas com os mesmos alunos usando o arquivo CSV para ter o nome dos alunos e o ID, que, conforme o usuario coloca datas para compor sua chamada, suas presencas sao armazenadas idependente uma das outras e suas classes sao feitas conforme o usuario abre chamada na data selecionada

## Demanda do(a) cliente

### Cliente
Miguel Brondani

### Demanda
- adição botão "desmarcar todos"
- visualizar porcentagem de faltas/presença de cada aluno

## Desenvolvimento

### Processo

[Substitua este texto por uma descrição do processo de desenvolvimento **em primeira pessoa, sem ajuda de IA**, explicando como você buscou entender o código existente, o que conhecia ou não, como lidou com as demandas (quais foram atendidas, não-atendidas, substituídas/adicionadas).]

Primeira coisa que eu fiz foi tentar abrir ele pelo localhost usando o python, vendo que tinha dado tudo certo fui direto no app.js sabendo que lah teria as funcoes que estao por tras dos botoes, comandos e layouts que aparecem no app. 

Pensando na primeira demanda de ter um botao de desmarcar todos eu procurei a funcao que marcava todos e fui entender como ela funcionava relacionada com eventos de botao, css e o index.html. Alem dissso procurei entender como que ele setava as ausencias e as presencas no app, foi ai que, olhando pelas ferramentas de desenvolvedor, percebi que a table attendance mostra o nome do aluno, seu ID, seu status de falta e a classe e a data que teve a falta, pensando nisso, vi que a unica coisa que precisava fazer era percorrer esse "attendance" e pelas classes e, pelo id, pegar quantas vezes o aluno apareceu faltando e depois pegar quantas "session" tem para aplicar a razao para ter essa porcentagem.


### Trechos de código

Indique pelo menos 3 trechos de código que você queira destacar para a turma (por exemplo, para contrastar com o código original, para explicar algo que aprendeu, para alertar sobre alguma dificuldade de compreensão, para mostrar uma curiosidade, etc).


## Tecnologias

### Linguagens e afins

Substitua este trecho por uma lista detalhada de tecnologias usadas no remake (tanto as básicas, como HTML, CSS e JavaScript, como alguma específica, por exemplo APIs externas, etc.):
- ...
- ...
- 

### Ambiente de desenvolvimento

Substitua este trecho por uma lista detalhada dos ambientes/ferramentas de desenvolvimento que você usou (por exemplo, VS Code + alguma extensão, agentes de IA, etc.)
- ...
- ...

## Referências e créditos

Substitua este trecho por uma lista bem detalhada de todo material que você consultou para ajudar no projeto, por exemplo:  URLs de vídeos ou outro material consultado, créditos para colegas que colaboraram, geradores de código, etc.
- ...
- ...




---
Projeto entregue para a disciplina de [Desenvolvimento de Software para a Web](http://github.com/andreainfufsm/elc1090-2026b) em 2026b
