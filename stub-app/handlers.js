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
    const apiUrl = "https://api.adviceslip.com/advice";

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {

      const advice = data.slip.advice;

      alert(
        "Random Advice:\n\n" +
        advice +
        "\n\nData from AdviceSlip API"
      );

    })
    .catch(error => {
      alert("API alınamadı: " + error);
    });

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
