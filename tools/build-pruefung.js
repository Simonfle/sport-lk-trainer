// Fügt alle Aufgabendateien aus pruefung/*.json zu pruefung.js zusammen.
// Aufruf:  node tools/build-pruefung.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const dir = path.join(root, "pruefung");
const clean = s => String(s ?? "").replace(/\*\*/g, "").replace(/\r\n/g, "\n").trim();
const einzel = [], klausuren = [], fehler = [], ids = new Set();

function teil(a, wo) {
  const erwartung = (a.erwartung || []).map(e => ({ text: clean(e.text), be: Number(e.be) || 0 }));
  const summe = erwartung.reduce((x, e) => x + e.be, 0);
  if (summe !== Number(a.be)) fehler.push(`${wo}: Erwartungshorizont ${summe} BE statt ${a.be}`);
  return { operator: clean(a.operator), afb: clean(a.afb), be: Number(a.be), aufgabe: clean(a.aufgabe),
           material: clean(a.material), erwartung, muster: clean(a.muster), tipp: clean(a.tipp) };
}

for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  let d;
  try { d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
  catch (e) { fehler.push(`${f}: kein gültiges JSON (${e.message})`); continue; }
  for (const a of d.einzel || []) {
    if (ids.has(a.id)) { fehler.push(`doppelte id ${a.id}`); continue; }
    ids.add(a.id);
    einzel.push({ id: a.id, thema: a.thema, titel: clean(a.titel), ...teil(a, a.id) });
  }
  for (const k of d.klausuren || []) {
    if (ids.has(k.id)) { fehler.push(`doppelte id ${k.id}`); continue; }
    ids.add(k.id);
    klausuren.push({ id: k.id, themen: k.themen || [], titel: clean(k.titel), zeit: Number(k.zeit) || 120,
      einleitung: clean(k.einleitung),
      material: (k.material || []).map(m => m.tabelle
        ? { titel: clean(m.titel), tabelle: { kopf: m.tabelle.kopf.map(clean), zeilen: m.tabelle.zeilen.map(z => z.map(clean)) } }
        : { titel: clean(m.titel), text: clean(m.text) }),
      teil: k.teil.map(t => ({ nr: String(t.nr), ...teil(t, k.id + " " + t.nr) })) });
  }
}

fs.writeFileSync(path.join(root, "pruefung.js"),
  "// Automatisch erzeugt aus pruefung/*.json mit: node tools/build-pruefung.js. Nicht von Hand bearbeiten.\n" +
  "window.PRUEFUNG = " + JSON.stringify({ einzel, klausuren }) + ";\n");
console.log(`${einzel.length} Einzelaufgaben, ${klausuren.length} Klausuren`);
if (fehler.length) { console.log("\nPROBLEME:\n" + fehler.join("\n")); process.exitCode = 1; }
