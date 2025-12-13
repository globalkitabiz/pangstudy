import { onRequestPost as __api_decks__deckId__share_js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\decks\\[deckId]\\share.js"
import { onRequestPost as __api_shared__shareToken__import_js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\shared\\[shareToken]\\import.js"
import { onRequestGet as __api_study__deckId__due_js_onRequestGet } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\study\\[deckId]\\due.js"
import { onRequestPost as __api_auth_login_js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\auth\\login.js"
import { onRequestPost as __api_auth_register_js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\auth\\register.js"
import { onRequestPost as __api_study_review_js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\study\\review.js"
import { onRequestGet as __api_cards__deckId__js_onRequestGet } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\cards\\[deckId].js"
import { onRequestPost as __api_cards__deckId__js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\cards\\[deckId].js"
import { onRequestGet as __api_shared__shareToken__index_js_onRequestGet } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\shared\\[shareToken]\\index.js"
import { onRequestGet as __api_decks_index_js_onRequestGet } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\decks\\index.js"
import { onRequestPost as __api_decks_index_js_onRequestPost } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\decks\\index.js"
import { onRequestGet as __api_stats_index_js_onRequestGet } from "C:\\win_asp_LMs\\pangstudy\\functions\\api\\stats\\index.js"
import { onRequest as ___middleware_js_onRequest } from "C:\\win_asp_LMs\\pangstudy\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/decks/:deckId/share",
      mountPath: "/api/decks/:deckId",
      method: "POST",
      middlewares: [],
      modules: [__api_decks__deckId__share_js_onRequestPost],
    },
  {
      routePath: "/api/shared/:shareToken/import",
      mountPath: "/api/shared/:shareToken",
      method: "POST",
      middlewares: [],
      modules: [__api_shared__shareToken__import_js_onRequestPost],
    },
  {
      routePath: "/api/study/:deckId/due",
      mountPath: "/api/study/:deckId",
      method: "GET",
      middlewares: [],
      modules: [__api_study__deckId__due_js_onRequestGet],
    },
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
      routePath: "/api/study/review",
      mountPath: "/api/study",
      method: "POST",
      middlewares: [],
      modules: [__api_study_review_js_onRequestPost],
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
      routePath: "/api/shared/:shareToken",
      mountPath: "/api/shared/:shareToken",
      method: "GET",
      middlewares: [],
      modules: [__api_shared__shareToken__index_js_onRequestGet],
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
      routePath: "/api/stats",
      mountPath: "/api/stats",
      method: "GET",
      middlewares: [],
      modules: [__api_stats_index_js_onRequestGet],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]