import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const output = "public-build";
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

for (const file of ["index.html", "styles.css"]) {
  if (!existsSync(file)) throw new Error(`Missing static entrypoint: ${file}`);
  cpSync(file, `${output}/${file}`);
}

if (!existsSync("dist")) throw new Error("Compiled JavaScript missing: dist");

function copyJavaScript(directory) {
  for (const name of readdirSync(directory)) {
    const source = join(directory, name);
    const stats = statSync(source);
    if (stats.isDirectory()) {
      copyJavaScript(source);
      continue;
    }
    if (!name.endsWith(".js")) continue;
    const destination = join(output, relative(".", source));
    mkdirSync(join(destination, ".."), { recursive: true });
    cpSync(source, destination);
  }
}

copyJavaScript("dist");
