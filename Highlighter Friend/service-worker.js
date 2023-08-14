chrome.action.onClicked.addListener((tab) => {
  const currentUrl = tab.url;
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    func: guardarResaltadoServer,
    args: [currentUrl],
  });
});

function guardarResaltadoServer(currentUrl) {
  try {
    var selectedText = window.getSelection().toString();
    if (selectedText) {
      var span = document.createElement("span");
      span.style.backgroundColor = "yellow";
      span.style.color = "black";
      var range = window.getSelection().getRangeAt(0).cloneRange();
      range.surroundContents(span);
      window.getSelection().removeAllRanges();
    }

    console.log(selectedText);

    // extraer dominio
    const domainRegex = /^(https?:\/\/)?([^\/]+)/i;
    const matches = currentUrl.match(domainRegex);
    if (matches && matches[2]) {
      var dominio = matches[2];
    }

    if (currentUrl.includes("#:~:text=")) {
      // Dividir la URL en base al fragmento existente
      var parts = currentUrl.split("#:~:text=");
      
      // Tomar solo la primera parte (antes del fragmento)
      currentUrl = parts[0];
    }

    // modificar vínculo
    var url = currentUrl + "#:~:text=" + encodeURIComponent(selectedText);

    // Conectar con servidor
    const xhr = new XMLHttpRequest();
    const serverUrl = 'http://localhost:3000/save-url';

    xhr.open('POST', serverUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');

    const data = {
      url: url,
      domain: dominio,
      highlighted: selectedText
    };

    if (selectedText !== "") {
      xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
            console.log('Data saved successfully.');
          } else {
            throw new Error('Error saving data to the database.');
          }
        }
      };
      console.log("Enviando");
      console.log(JSON.stringify(data));
      xhr.send(JSON.stringify(data));
    }
  } catch (error) {
    alert('An error occurred: ' + error.message);
  }
}
