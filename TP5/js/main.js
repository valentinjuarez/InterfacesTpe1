import { PreGameMenuController } from "./controller/PreGameMenuController.js";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("myCanvas");
  new PreGameMenuController({ canvas });
});