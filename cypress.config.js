const { defineConfig } = require("cypress");
module.exports = defineConfig({
  chromeWebSecurity: false,
})
module.exports = defineConfig({
  video: true,
  screenshotOnRunFailure: true,
  e2e: {
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      html: true,
      json: true,
    },
    viewportWidth: 1920,
    viewportHeight: 1080,
    setupNodeEvents(on, config) {
      require('@cypress/grep/src/plugin')(config);
      return require("./node_modules/cypress-fs/plugins/index.js")(on, config)
    }    
  },
  env: {
    baseApiUrl:"https://practice.expandtesting.com/notes/api",
    baseAppUrl: "https://practice.expandtesting.com/notes/app"
  }
});