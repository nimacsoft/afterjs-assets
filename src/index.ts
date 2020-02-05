import { matchPath } from "react-router-dom"
import { getAssets } from "./types"

declare var __DEV__: boolean

function getAssests({ req, routes, manifest }: getAssets) {
  let scripts: string[] = []
  let styles: string[] = []
  const match = routes.find(route => !!matchPath(req.url, route))

  if (match) {
    if (!match.name && __DEV__) {
      throw new Error(
        `routes must have a "name" key with value of chunk name ${JSON.stringify(
          { name: "ChunkName", ...match },
          null,
          2
        )}`
      )
    }

    if (match.name) {
      const { name: chunkName } = match

      if (manifest[chunkName]) {
        if (manifest[chunkName].js) {
          scripts = manifest[chunkName].js
        }

        if (manifest[chunkName].css) {
          styles = manifest[chunkName].css
        }
      }
    }
  }

  return { scripts, styles }
}

export { getAssests }
