import "./style.css";
import { initBootstrap } from "./app/bootstrap";
import { createApp } from "./app/app";

const { boot, renderRoute } = createApp();

initBootstrap({
  boot,
  renderRoute,
});
