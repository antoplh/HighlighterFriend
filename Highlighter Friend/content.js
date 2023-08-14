
// Escuchar el atajo de teclado
chrome.commands.onCommand.addListener(function (command) {
  if (command === "highlight-text") {
    console.log("ctrl shift h")
  }
});
