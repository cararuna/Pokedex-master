/**
 * Declaração para os assets importados.
 *
 * O `tsc` do pacote não conhece PNG — quem resolve isso é o Vite, em tempo de
 * empacotamento. Sem esta declaração, `import fire from "./fireType.png"` é
 * erro de tipo mesmo com o build funcionando.
 */
declare module "*.png" {
  const src: string;
  export default src;
}
