import { onRequestPost as __api_auth_login_js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\auth\\login.js"
import { onRequestPost as __api_auth_register_js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\auth\\register.js"
import { onRequestGet as __api_cards__deckId__js_onRequestGet } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\cards\\[deckId].js"
import { onRequestPost as __api_cards__deckId__js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\cards\\[deckId].js"
import { onRequestGet as __api_decks_index_js_onRequestGet } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\decks\\index.js"
import { onRequestPost as __api_decks_index_js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\decks\\index.js"
import { onRequest as ___middleware_js_onRequest } from "C:\\win_asp_LMs\\pangstudy\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_js_onRequestPost],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_register_js_onRequestPost],
    },
  {
      routePath: "/api/cards/:deckId",
      mountPath: "/api/cards",
      method: "GET",
      middlewares: [],
      modules: [__api_cards__deckId__js_onRequestGet],
    },
  {
      routePath: "/api/cards/:deckId",
      mountPath: "/api/cards",
      method: "POST",
      middlewares: [],
      modules: [__api_cards__deckId__js_onRequestPost],
    },
  {
      routePath: "/api/decks",
      mountPath: "/api/decks",
      method: "GET",
      middlewares: [],
      modules: [__api_decks_index_js_onRequestGet],
    },
  {
      routePath: "/api/decks",
      mountPath: "/api/decks",
      method: "POST",
      middlewares: [],
      modules: [__api_decks_index_js_onRequestPost],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]