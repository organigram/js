declare module 'uint8arrays/concat' {
  export const concat: (arrays: Uint8Array[], length?: number) => Uint8Array
}

declare module 'uint8arrays/to-string' {
  export const toString: (array: Uint8Array, encoding?: string) => string
}
