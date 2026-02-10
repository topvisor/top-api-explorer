declare module 'js-yaml';
declare module '*.yaml?raw' {
  const content: string;
  export default content;
}
