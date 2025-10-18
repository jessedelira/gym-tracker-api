import js from '@eslint/js'
import parser from '@typescript-eslint/parser'
import pluginTs from '@typescript-eslint/eslint-plugin'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import pluginUnusedImports from 'eslint-plugin-unused-imports'

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
				...globals.node,
				...globals.browser
			}
		},
		plugins: {
			'@typescript-eslint': pluginTs,
			'simple-import-sort': simpleImportSort,
			'unused-imports': pluginUnusedImports
		},
		rules: {
			...pluginTs.configs.recommended.rules,

			// Remove unused imports/vars
			'unused-imports/no-unused-imports': 'error',
			'unused-imports/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_'
				}
			],

			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',

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
