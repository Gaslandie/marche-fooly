import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Même paquet et mêmes dessins Bootstrap. Aucun téléchargement ni dépendance ajoutée.
// Les classes sont écrites en entier dans les sources, y compris les choix dynamiques.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "src");
const iconsRoot = join(root, "node_modules/bootstrap-icons");
const names = new Set();
for (const file of readdirSync(source, { recursive: true, withFileTypes: true })) {
  if (!file.isFile() || !/\.tsx?$/.test(file.name)) continue;
  const text = readFileSync(join(file.parentPath, file.name), "utf8");
  for (const match of text.matchAll(/\bbi-([a-z0-9]+(?:-[a-z0-9]+)*)\b/g)) names.add(match[1]);
}

const rules = [...names].sort().map((name) => {
  const svg = readFileSync(join(iconsRoot, "icons", `${name}.svg`), "utf8")
    .replace(/\s+/g, " ")
    .replace(/fill="currentColor"/, 'fill="black"');
  return `.bi-${name}::before { --mf-icon: url("data:image/svg+xml,${encodeURIComponent(svg)}"); }`;
});

const license = readFileSync(join(iconsRoot, "LICENSE"), "utf8");
writeFileSync(join(source, "app/icons.generated.css"), `/*
Généré par npm run icons ; ne pas modifier. Bootstrap Icons, licence MIT :
${license}
*/
.bi::before, [class^="bi-"]::before, [class*=" bi-"]::before {
  content: "";
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -.125em;
  background-color: currentColor;
  -webkit-mask: var(--mf-icon, linear-gradient(transparent, transparent)) center / contain no-repeat;
  mask: var(--mf-icon, linear-gradient(transparent, transparent)) center / contain no-repeat;
}
${rules.join("\n")}
`);
console.log(`${names.size} icônes SVG utilisées, sans police d'icônes à télécharger.`);
