/**
 * BUTTON CLICK HANDLERS
 *
 * Each button on the homepage has its own handler function below.
 * Replace the placeholder console.log with your own implementation.
 */

function onButton1Click() {
  console.log("Button 1 clicked -- implement me!");
}

function onButton2Click() {
  console.log("Button 2 clicked -- implement me!");
}

function onButton3Click() {
  console.log("Button 3 clicked -- implement me!");
}

function onButton4Click() {
  console.log("Button 4 clicked -- implement me!");
}

function onButton5Click() {
  const newTab = window.open("", "_blank");

  if (!newTab) {
    alert("Popup blocked. Please allow popups for this site.");
    return;
  }

  newTab.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Random Joke</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f8fafc;
          margin: 0;
          padding: 40px;
          color: #1e293b;
        }

        .card {
          max-width: 700px;
          margin: 40px auto;
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }

        h1 {
          margin-bottom: 15px;
        }

        p {
          line-height: 1.6;
        }

        .loading {
          color: #475569;
        }

        .error {
          color: #b91c1c;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Random Joke Page</h1>
        <p>This page shows a random joke fetched from a public API.</p>
        <p class="loading">Loading joke...</p>
      </div>
    </body>
    </html>
  `);

  newTab.document.close();

  fetch("https://official-joke-api.appspot.com/random_joke")
    .then(response => response.json())
    .then(data => {
      newTab.document.body.innerHTML = `
        <div class="card" style="
          max-width: 700px;
          margin: 40px auto;
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          font-family: Arial, sans-serif;
          color: #1e293b;
        ">
          <h1>Random Joke Page</h1>
          <p>This page shows a random joke fetched from a public API.</p>
          <p><strong>Setup:</strong> ${data.setup}</p>
          <p><strong>Punchline:</strong> ${data.punchline}</p>
          <p><em>Data source: Goksel's cmpe220 jokes</em></p>
        </div>
      `;
      newTab.document.body.style.background = "#f8fafc";
      newTab.document.body.style.margin = "0";
      newTab.document.body.style.padding = "40px";
    })
    .catch(error => {
      newTab.document.body.innerHTML = `
        <div class="card" style="
          max-width: 700px;
          margin: 40px auto;
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          font-family: Arial, sans-serif;
          color: #1e293b;
        ">
          <h1>Random Joke Page</h1>
          <p>This page shows a random joke fetched from a public API.</p>
          <p style="color: #b91c1c;"><strong>Error:</strong> Joke could not be loaded.</p>
          <p>${error}</p>
        </div>
      `;
      newTab.document.body.style.background = "#f8fafc";
      newTab.document.body.style.margin = "0";
      newTab.document.body.style.padding = "40px";
    });
}
