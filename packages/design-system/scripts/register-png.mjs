/**
 * `--import` só executa um módulo; quem instala gancho de resolução é o
 * `module.register`. Este arquivo existe para fazer essa chamada.
 */
import { register } from "node:module";
register("./png-loader.mjs", import.meta.url);
