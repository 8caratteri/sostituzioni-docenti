import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
for (const ext of ["", "-wal", "-shm"]) {
  const p = path.join(dataDir, `sostituzioni.sqlite${ext}`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

async function main() {
  const { getDb } = await import("../src/lib/db");
  const { resolvePagamento, getOreRecupero } = await import(
    "../src/lib/pagamento"
  );
  const { listCandidatiForSlot } = await import("../src/lib/candidati");
  const { listSedi } = await import("../src/lib/catalog");

  getDb();
  const moschetti = getOreRecupero("moschetti");
  const delNero = getOreRecupero("del-nero");
  const payM = resolvePagamento("moschetti");
  const payD = resolvePagamento("del-nero");

  console.log("Moschetti recuperi:", moschetti, "→", payM);
  console.log("Del Nero recuperi:", delNero, "→", payD);

  if (!payM.isRecupero || payM.importoEur !== 0) {
    throw new Error("Moschetti deve essere recupero 0€");
  }
  if (payD.isRecupero || payD.importoEur <= 0) {
    throw new Error("Del Nero deve essere a pagamento");
  }

  const sedi = listSedi();
  const carrara = sedi.find((s) => s.name === "Carrara");
  if (!carrara) throw new Error("Manca plesso Carrara");

  // Prossimo lunedì
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  const date = d.toISOString().slice(0, 10);

  const cand = listCandidatiForSlot({
    sede_id: carrara.id,
    fascia: "mattina",
    date,
    ora: 3,
  }).filter((c) => c.available);
  const names = cand.map((c) => c.name).sort();
  console.log("Carrara Lun 3ª disponibili:", names.join(", "));
  for (const n of ["Moschetti", "Tranchinetti", "Del Nero"]) {
    if (!names.includes(n)) throw new Error(`Manca ${n} su Carrara Lun 3ª`);
  }

  console.log("SMOKE OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
