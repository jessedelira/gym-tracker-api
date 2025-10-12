import js from '@eslint/js'
import parser from '@typescript-eslint/parser'
import pluginTs from '@typescript-eslint/eslint-plugin'
import prettier from 'eslint-config-prettier'
import pluginImport from 'eslint-plugin-import'
import globals from 'globals' // <-- import globals package

/** @type {import("eslint").Linter.Config[]} */
export default [
	{
		ignores: ['dist/**', 'node_modules/**']
	},
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module'
			},
			globals: {
				...globals.node, // includes 'console' and 'Buffer'
				...globals.browser // includes 'File' and other browser globals
			}
		},
		plugins: {
			'@typescript-eslint': pluginTs,
			import: pluginImport
		},
		rules: {
			...pluginTs.configs.recommended.rules,

			'import/order': [
				'error',
				{
					groups: [
						'builtin',
						'external',
						'internal',
						['parent', 'sibling', 'index'],
						'object',
						'type'
					],
					'newlines-between': 'always',
					alphabetize: {
						order: 'asc',
						caseInsensitive: true
					}
				}
			],

			'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 0 }],
			'padding-line-between-statements': [
				'warn',
				{ blankLine: 'always', prev: '*', next: 'return' },
				{
					blankLine: 'always',
					prev: ['const', 'let', 'var'],
					next: '*'
				},
				{
					blankLine: 'any',
					prev: ['const', 'let', 'var'],
					next: ['const', 'let', 'var']
				}
			]
		}
	},
	js.configs.recommended,
	prettier
]
