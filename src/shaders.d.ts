declare module "@paper-design/shaders" {
  export class ShaderMount {
    constructor(
      parentElement: HTMLElement,
      fragmentShader: string,
      uniforms: Record<string, number>,
      onUpdate?: (time: number) => void,
      playState?: number
    );
  }
  export const liquidMetalFragmentShader: string;
}
