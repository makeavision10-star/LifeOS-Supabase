# LifeOS v3.0

PWA pessoal em português, com dashboard, CRM da agência IA, projetos musicais CNLS, finanças, metas e agenda.

## Iniciar

1. Extrai o ZIP.
2. Na pasta `lifeos`, executa `python -m http.server 8080` (Python instalado).
3. Abre `http://localhost:8080` no navegador.
4. Para instalar como aplicação, usa a opção **Instalar aplicação** do navegador. Para instalação num telemóvel, publica a pasta num alojamento HTTPS (por exemplo, Netlify ou Cloudflare Pages).

## Dados

- Guardados no `localStorage` do navegador, sem servidor nem sincronização.
- Em **Dados**, exporta/importa cópias JSON.
- Sem autenticação, contas bancárias, notificações push ou sincronização entre dispositivos.
- Não introduzas dados especialmente sensíveis nesta versão local.

## Estrutura

`index.html` — interface e estilos; `app.js` — lógica e armazenamento; `manifest.webmanifest` — metadados PWA; `sw.js` — cache offline; `icon.svg` — ícone.

## Finanças v3

O cartão **Saldo bancário** substitui **Resultado do mês**. Clica em **Atualizar saldo** para introduzir manualmente o saldo real; o valor é guardado localmente e incluído no backup JSON. Não existe ligação automática ao banco.
