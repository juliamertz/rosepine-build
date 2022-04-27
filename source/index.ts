import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {roles, variants, type Color} from '@rose-pine/palette'

interface Config {
	template: string
	output: string
	prefix: string
	format:
		| 'hex'
		| 'hex-ns'
		| 'rgb'
		| 'rgb-ns'
		| 'rgb-array'
		| 'rgb-function'
		| 'hsl'
		| 'hsl-ns'
		| 'hsl-array'
		| 'hsl-function'
	stripSpaces: boolean
}

type UserOptions = Partial<Config>

const defaultConfig: Config = {
	template: process.cwd() + '/source/template.json',
	output: process.cwd() + '/dist',
	prefix: '$',
	format: 'hex',
	stripSpaces: false,
}

export const formatColor = (
	color: Color,
	format: Config['format'] = 'hex',
	stripSpaces: Config['stripSpaces'] = false
) => {
	const workingColor = {...color}

	const formats = {
		hex: workingColor.hex,
		'hex-ns': workingColor.hex.replace('#', ''),
		rgb: workingColor.rgb.replace('rgb(', '').replace(')', ''),
		'rgb-ns': workingColor.rgb
			.replace('rgb(', '')
			.replace(')', '')
			.replaceAll(',', ''),
		'rgb-array': workingColor.rgb.replace('rgb(', '[').replace(')', ']'),
		'rgb-function': workingColor.rgb,
		hsl: workingColor.hsl.replace('hsl(', '').replace(')', ''),
		'hsl-ns': workingColor.hsl
			.replace('hsl(', '')
			.replace(')', '')
			.replaceAll(',', ''),
		'hsl-array': workingColor.hsl.replace('hsl(', '[').replace(')', ']'),
		'hsl-function': workingColor.hsl,
	}

	if (stripSpaces) return formats[format].replaceAll(' ', '')
	return formats[format]
}

export const build = async (flags?: UserOptions) => {
	const config: Config = Object.assign(defaultConfig, flags)
	const template = fs.readFileSync(config.template, 'utf8').toString()
	const extension = path.extname(config.template)

	for (const variant of Object.keys(variants)) {
		const suffix = variant === 'main' ? '' : `-${variant}`
		const filename = `rose-pine${suffix}`
		let result = template

		for (const role of Object.keys(roles)) {
			// @ts-expect-error TODO: If this errors we should check that the
			// correct @rose-pine/palette version is being used
			const currentColor = roles[role][variant] as Color
			const color = formatColor(currentColor, config.format, config.stripSpaces)

			result = result.replaceAll(`${config.prefix}${role}`, color)
		}

		fs.mkdirSync(config.output, {recursive: true})
		fs.writeFileSync(`${config.output}/${filename}${extension}`, result, 'utf8')
	}
}

export default build