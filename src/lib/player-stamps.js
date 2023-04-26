import { GAME_CONTRACT } from "./contract";
import { AsyncReader, Async } from "./utils.js";
import { filter, prop, propEq, values, sortWith, descend, map, find, path } from "ramda";
const { of, ask, lift } = AsyncReader;

/**
 * @param {string} token
 * @returns {AsyncReader}
 */
export function playerStamps(token) {
  return of(token)
    .chain((token) =>
      ask(() =>
        fetchStamps()
          .map(filter(propEq("asset", token)))
          .map(sortWith([descend(prop("timestamp"))]))
          // attach to players
          .chain((stamps) =>
            fetchPlayers().map((players) =>
              map(
                (stamp) => ({ ...stamp, player: find(propEq("address", stamp.address), players) }),
                stamps
              )
            )
          )
          .map((x) => (console.log("stampe-players", x), x))
      )
    )

    .chain(lift);
}

function fetchPlayers() {
  return Async.fromPromise(fetch)("https://cache-1.permaweb.tools/contract?id=" + GAME_CONTRACT)
    .chain((res) => Async.fromPromise(res.json.bind(res))())
    .map(path(["state", "players"]))
    .map(values);
}

function fetchStamps() {
  return Async.fromPromise(fetch)(
    "https://cache-1.permaweb.tools/contract?id=61vg8n54MGSC9ZHfSVAtQp4WjNb20TaThu6bkQ86pPI"
    //"https://cache.permapages.app/61vg8n54MGSC9ZHfSVAtQp4WjNb20TaThu6bkQ86pPI"
  )
    .chain((res) => Async.fromPromise(res.json.bind(res))())
    .map(prop("state"))
    .map(prop("stamps"))

    .map(values);
}
