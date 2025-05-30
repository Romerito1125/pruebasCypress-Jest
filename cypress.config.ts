import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "https://www.devcorebits.com", 
    setupNodeEvents(on, config) {
    },
  },
});
