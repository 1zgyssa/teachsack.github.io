import { onRequestPost as __api_feedback_js_onRequestPost } from "D:\\jxgj\\server-deploy\\functions\\api\\feedback.js"
import { onRequestGet as __api_feedbacks_js_onRequestGet } from "D:\\jxgj\\server-deploy\\functions\\api\\feedbacks.js"

export const routes = [
    {
      routePath: "/api/feedback",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_feedback_js_onRequestPost],
    },
  {
      routePath: "/api/feedbacks",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_feedbacks_js_onRequestGet],
    },
  ]