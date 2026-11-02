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
In produzione: `SQLITE_PATH=/data/sostituzioni.sqlite` (volume Railway su `/data`).

## Hosting (Europa)

Vedi guida: volume `/data`, env `AUTH_*` / `SQLITE_PATH`, Deploy from GitHub → Railway.  
File pronti: `Dockerfile`, `railway.toml`, `.env.example`.
