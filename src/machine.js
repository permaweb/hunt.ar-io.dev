import { action, createMachine, invoke, reduce, state, transition, immediate, guard } from "robot3";
import { propEq } from "ramda";

export default function ({ leaderboard, uploadAvatar, player, stamp, register }, wallet) {
  return createMachine({
    idle: state(
      transition(
        "id",
        "loading",
        reduce((ctx, ev) => {
          console.log("app data", ev);
          return { ...ctx, code: ev.id };
        })
      ),
      transition(
        "tx",
        "loading",
        reduce((ctx, ev) => {
          return { ...ctx, tx: ev.tx };
        })
      ),
      transition("load", "loading")
    ),
    // loading: invoke(leaderboard,
    loading: invoke(
      async () => {
        //await new Promise((resolve) => setTimeout(resolve, 3000));

        return await leaderboard();
      },
      transition(
        "done",
        "leaderboard",
        reduce((ctx, ev) => ({ ...ctx, players: ev.data }))
      ),
      transition("error", "leaderboard")
    ),
    leaderboard: state(
      immediate(
        "getPlayer",
        guard((ctx) => ctx.code)
      ),
      immediate(
        "getPlayer",
        guard((ctx) => ctx.tx)
      ),
      transition("show", "getPlayer"),
      transition("register", "register")
    ),
    // getPlayer: invoke((_, ev) => player(ev.id),
    getPlayer: invoke(
      (ctx, ev) => {
        const player = ctx.players.find(propEq("code", ev.id));
        return player ? Promise.resolve(player) : Promise.reject(null);
        //return ctx.players[0]
      },
      transition(
        "done",
        "player",
        reduce((ctx, ev) => {
          return { ...ctx, player: ev.data };
        })
      ),
      transition("error", "register")
    ),
    player: state(
      transition("stamp", "stamping"),
      transition("reset", "resetPlayer"),
      transition("close", "leaderboard")
    ),
    stamping: invoke(async (ctx) => {
      await wallet.connect();
      await new Promise((resolve) => setTimeout(resolve, 2500));
      //return await stamp(ctx.player.id);
      return;
    }, transition("done", "confirmation")),
    confirmation: state(transition("close", "leaderboard")),
    register: state(transition("continue", "form")),
    form: state(transition("register", "submitting")),
    submitting: invoke(
      async (ctx, ev) => {
        if (!window["arweaveWallet"]) {
          await wallet.connect();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        const address = await window.arweaveWallet.getActiveAddress();
        const avatar = await uploadAvatar(ev.file, ev.file.type);
        const result = await register({
          code: ev.code,
          address: address,
          handle: ev.handle,
          bio: ev.bio,
          avatar: avatar.id
        });

        location.search = "";
        // reset to leaderboard
        return result;
      },
      transition("done", "leaderboard"),
      transition("error", "error")
    ),
    error: state(),
    resetPlayer: state()
  });
}