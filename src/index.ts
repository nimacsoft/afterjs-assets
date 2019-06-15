import { matchPath } from "react-router-dom"
import { getAssets } from "./types"

function getAssests({ req, routes, manifest }: getAssets) {
	let scripts: string[] = []
	let styles: string[] = []
	const match = routes.find((route) => {
		return !!matchPath(req.url, route)
	})

	if (match) {
		const route = routes.find((item) => item.path === match.path)

		if (!route) return { scripts, styles }

		if (typeof route.name === "undefined" && process.env.NODE_ENV !== "production") {
			throw new Error(
				`routes must have a "name" key with value of chunk name ${JSON.stringify(
					{ name: "ChunkName", ...route },
					null,
					2
				)}`
			)
		}
		if (manifest[name] && manifest[name].js) {
			scripts = manifest[name].js
		}

		if (manifest[name] && manifest[name].css) {
			styles = manifest[name].css
		}
	}

	return { scripts, styles }
}

export default getAssests
