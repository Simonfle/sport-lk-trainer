// Fügt alle Kartendateien aus karten/*.json zu karten.js zusammen.
// Aufruf:  node tools/build-karten.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const dir = path.join(root, "karten");
const FELDER = ["id", "thema", "kapitel", "q", "a", "e", "quelle", "typ"];

const files = fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort();
const alle = [], ids = new Set(), fehler = [];
const clean = s => String(s).replace(/\*\*/g, "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();

for (const f of files) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
  catch (e) { fehler.push(`${f}: kein gültiges JSON (${e.message})`); continue; }
  for (const c of arr) {
    const fehlt = FELDER.filter(k => !c[k]);
    if (fehlt.length) { fehler.push(`${f} ${c.id || "?"}: Feld fehlt: ${fehlt.join(", ")}`); continue; }
    if (ids.has(c.id)) { fehler.push(`${f}: doppelte id ${c.id}`); continue; }
    ids.add(c.id);
    let thema = c.thema;
    if (thema === "BONUS") {
      const m = /^L\s?(\d+)/.exec(c.kapitel);
      thema = m ? "B.L" + Number(m[1]) : "B.X";
    }
    const karte = { id: c.id, thema, kapitel: clean(c.kapitel).replace(/^L\s?\d+\s*[:·-]?\s*/, "") || clean(c.kapitel),
      q: clean(c.q), a: clean(c.a), e: clean(c.e), quelle: clean(c.quelle), typ: c.typ === "zusatz" ? "zusatz" : "kern" };
    if (Array.isArray(c.bezug) && c.bezug.length) karte.bezug = c.bezug;
    alle.push(karte);
  }
}

fs.writeFileSync(path.join(root, "karten.js"),
  "// Automatisch erzeugt aus karten/*.json mit: node tools/build-karten.js. Nicht von Hand bearbeiten.\n" +
  "window.KARTEN = " + JSON.stringify(alle) + ";\n");

const proThema = {};
alle.forEach(c => proThema[c.thema] = (proThema[c.thema] || 0) + 1);
console.log(`${alle.length} Karten aus ${files.length} Dateien`);
console.log(proThema);
if (fehler.length) { console.log("\nPROBLEME:\n" + fehler.join("\n")); process.exitCode = 1; }
