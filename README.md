# Sostituzioni docenti (CPIA) — MVP

Applicazione web per assegnare ore di sostituzione, farle confermare ai docenti e controllare il **budget in euro**.

## Avvio

```bash
cd /workspace/sostituzioni-docenti
npm install
cp .env.example .env.local   # se manca
npm run build
npm start
```

Sviluppo: `npm run dev` → http://localhost:3000

## Accesso (modalità prova)

Con `AUTH_DEMO_MODE=true` (default):

| Utente | Ruolo |
|--------|--------|
| Segreteria Demo | segreteria |
| Dirigente Demo | dirigente |
| Maria Rossi | docente |
| Luca Bianchi | docente |

Google Workspace: imposta `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (opzionale).

## Dati

SQLite in `data/sostituzioni.sqlite` (creato al primo avvio con dati di prova).

## GitHub

Repository locale su `main`. Per un archivio permanente: **Create repo** dalla vista agente Cursor (nessun remote ancora).
