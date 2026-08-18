# Chamada Local

Protótipo client-side para demonstrar IndexedDB em uma aplicação de chamada.

## Funcionalidades

- importação de turma por CSV;
- CSV com apenas duas colunas: `id` e `nome`;
- suporte a múltiplas turmas;
- criação/abertura de chamada por data;
- todos os estudantes começam como presentes; desmarcar o checkbox registra ausência;
- filtros por status;
- busca de estudante;
- persistência local com IndexedDB;
- exportação em CSV e JSON;
- layout responsivo para desktop e smartphone.

## CSV esperado

```csv
id,nome
2026001,Ana Silva
2026002,Bruno Souza
2026003,Carla Mendes
```

Também é aceito `;` como separador.

## Executar

Para testes simples, abra `index.html`.

Em alguns navegadores é preferível servir a pasta localmente:

```bash
python3 -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Observação

Os dados ficam somente no IndexedDB do navegador/dispositivo atual. O protótipo não deve ser tratado como sistema institucional de registro acadêmico.
