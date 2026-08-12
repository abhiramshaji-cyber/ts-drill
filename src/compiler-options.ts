export const TYPE_PRELUDE = `
type Equal<A, B> = (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2) ? true : false
type Expect<T extends true> = T
`

export const SHARED_COMPILER_OPTIONS = {
  strict: true,
  noEmit: false,
  skipLibCheck: true,
  noUnusedLocals: false,
  noUnusedParameters: false,
  forceConsistentCasingInFileNames: true,
}
