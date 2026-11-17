// Fügt mindmap/*.json zu mindmap.js zusammen.
// Aufruf:  node tools/build-mindmap.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const dir = path.join(root, "mindmap");
const themen = [], links = [], fehler = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".json")).sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  themen.push(...d.themen); links.push(...d.links);
}
const keys = new Set();
themen.forEach(t => { keys.add(t.id); t.aeste.forEach(a => keys.add(t.id + ":" + a.name)); });
links.forEach(l => [l.von, l.zu].forEach(k => { if (!keys.has(k) && !keys.has(k.split(":")[0])) fehler.push("unbekannt: " + k); }));
fs.writeFileSync(path.join(root, "mindmap.js"),
  "// Automatisch erzeugt aus mindmap/*.json mit: node tools/build-mindmap.js\nwindow.MINDMAP = " + JSON.stringify({ themen, links }) + ";\n");
console.log(`${themen.length} Themen, ${links.length} Verbindungen`);
if (fehler.length) { console.log(fehler.join("\n")); process.exitCode = 1; }
