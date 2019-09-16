import resolve from 'rollup-plugin-node-resolve';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import external from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss-modules';
import autoprefixer from 'autoprefixer';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

export default [
  {
    input: pkg.source,
    output: [
      {
        file: pkg.browser,
        format: 'umd',
        name: 'reaviz',
      },
      {
        file: pkg.main,
        format: 'cjs',
        name: 'reaviz',
      },
      {
        file: pkg.module,
        format: 'es',
      },
    ],
    plugins: [
      external({
        includeDependencies: true
      }),
      postcss({
        modules: true,
        extract: true,
        writeDefinitions: true,
        plugins: [
          autoprefixer()
        ]
      }),
      typescript({
        clean: true,
        exclude: [
          '*.d.ts',
          '**/*.d.ts',
          '**/*.story.tsx'
        ]
      }),
      resolve(),
      commonjs(),
      sourceMaps()
    ]
  }
];
