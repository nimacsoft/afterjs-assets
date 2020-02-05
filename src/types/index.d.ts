import { AsyncRouteProps } from "@jaredpalmer/after"
import { Request } from "express"

interface manifest {
  [key: string]: {
    css: string[]
    js: string[]
  }
}
interface AsyncChunkRouteProps extends AsyncRouteProps {
  name?: string
}
export interface getAssets {
  manifest: manifest
  req: Request
  routes: AsyncChunkRouteProps[]
}
