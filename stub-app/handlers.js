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
  console.log("Button 5 clicked -- implement me!");
}

function onButton6Click() {
  // Opens a new blank tab [cite: 49]
  const advicePage = window.open('', '_blank');
  
  // Injects the minimal HTML structure and API logic
  advicePage.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Daily Advice</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f1f5f9; margin: 0; }
        .container { background: white; padding: 2.5rem; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); text-align: center; max-width: 450px; }
        h1 { color: #4f46e5; margin-bottom: 1.5rem; }
        #advice-text { font-size: 1.4rem; font-style: italic; color: #1e293b; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Random Advice</h1>
        <div id="advice-text">Loading...</div>
      </div>
      <script>
        fetch('https://api.adviceslip.com/advice')
          .then(response => response.json())
          .then(data => {
            document.getElementById('advice-text').innerText = '"' + data.slip.advice + '"';
          })
          .catch(error => {
            document.getElementById('advice-text').innerText = "Something went wrong.";
          });
      <\/script>
    </body>
    </html>
  `);
  advicePage.document.close();
}


function onButton7Click() {
  console.log("Button 7 clicked -- implement me!");
}

