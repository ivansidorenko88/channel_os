const {
  dashboardKeyboard,
  dashboardBackKeyboard
} = require("./dashboardKeyboard");

function mainMenu() {
  return dashboardKeyboard();
}

function backToMenu() {
  return dashboardBackKeyboard();
}

module.exports = {
  mainMenu,
  backToMenu
};
